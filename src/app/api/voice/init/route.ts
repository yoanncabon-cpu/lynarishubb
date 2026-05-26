/**
 * POST /api/voice/init
 * Webhook d'initiation de conversation ElevenLabs (workspace-level).
 * ElevenLabs appelle cet endpoint au démarrage de chaque appel Twilio.
 * On retourne les dynamic_variables (org_id) + l'override du system prompt live.
 *
 * Format de réponse attendu par ElevenLabs :
 * { type: "conversation_initiation_client_data", dynamic_variables: {...}, conversation_config_override: {...} }
 */
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agentInstances, integrations as integrationsTable } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getAgent } from "@/lib/agents/registry"
import { logger } from "@/lib/logger"

interface ElevenLabsInitBody {
  agent_id?: string
  conversation_id?: string
  // Twilio custom parameters passés via <Parameter> dans le TwiML
  custom_parameters?: {
    org_id?: string
    agent_slug?: string
    callSid?: string
    from?: string
    to?: string
    [key: string]: string | undefined
  }
}

export async function POST(request: NextRequest) {
  let body: ElevenLabsInitBody
  try {
    body = await request.json() as ElevenLabsInitBody
  } catch {
    return NextResponse.json({ type: "conversation_initiation_client_data", dynamic_variables: {} })
  }

  const orgId = body.custom_parameters?.org_id
  const agentSlug = body.custom_parameters?.agent_slug ?? "marine"

  logger.info("[Voice/Init] Conversation start", {
    orgId: orgId?.slice(0, 8) ?? "unknown",
    agentSlug,
    conversationId: body.conversation_id?.slice(0, 12),
  })

  if (!orgId) {
    // Pas d'org_id → réponse minimale, ElevenLabs utilisera la config par défaut de l'agent
    return NextResponse.json({ type: "conversation_initiation_client_data", dynamic_variables: {} })
  }

  // Récupère la config de l'agent pour cette org
  const agentDef = getAgent(agentSlug)
  const row = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, agentSlug)),
    columns: { config: true },
  }).catch(() => null)

  const config = (row?.config ?? {}) as Record<string, unknown>

  // Voice ID : depuis la config spécifique ou l'intégration ElevenLabs
  const specific = config["specific"] as Record<string, unknown> | undefined
  let voiceId = specific?.["elevenLabsVoiceId"] as string | undefined

  if (!voiceId) {
    const elIntegration = await db.query.integrations.findFirst({
      where: and(eq(integrationsTable.orgId, orgId), eq(integrationsTable.provider, "elevenlabs")),
      columns: { credentials: true },
    }).catch(() => null)
    // credentials est chiffré — on passe juste le fallback env
    voiceId = process.env["ELEVENLABS_VOICE_ID_MARINE"]
  }

  // Génère le system prompt live depuis la config DB
  const prompt = agentDef
    ? agentDef.systemPromptFn({ orgId, ...config })
    : undefined

  const response: Record<string, unknown> = {
    type: "conversation_initiation_client_data",
    dynamic_variables: { org_id: orgId, agent_slug: agentSlug },
  }

  if (prompt || voiceId) {
    const override: Record<string, unknown> = {}
    if (prompt) {
      override["agent"] = { prompt: { prompt }, language: "fr" }
    }
    if (voiceId) {
      override["tts"] = { voice_id: voiceId }
    }
    response["conversation_config_override"] = override
  }

  return NextResponse.json(response)
}
