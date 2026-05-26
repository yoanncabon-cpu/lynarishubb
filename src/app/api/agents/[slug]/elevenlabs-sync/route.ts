/**
 * POST /api/agents/[slug]/elevenlabs-sync
 * Synchronise le system prompt de l'agent ElevenLabs avec la config DB de l'org.
 * Appelé automatiquement après chaque save des paramètres Marine.
 *
 * Requires: ELEVENLABS_API_KEY dans .env
 * L'agent_id ElevenLabs est stocké dans integrations (provider = "elevenlabs", metadata.agent_id)
 */

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getAgent } from "@/lib/agents/registry"
import { getIntegration } from "@/lib/integrations/manager"
import { db } from "@/lib/db"
import { agentInstances } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const runtime = "nodejs"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (slug !== "marine") {
    return NextResponse.json({ skipped: true, reason: "only marine supports elevenlabs sync" })
  }

  const orgId = await getOrProvisionOrgId()
  const apiKey = process.env["ELEVENLABS_API_KEY"]
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: "ELEVENLABS_API_KEY not set" })
  }

  // Récupère l'agent_id ElevenLabs de l'org
  const integration = await getIntegration(orgId, "elevenlabs")
  const agentId = integration?.metadata?.["agent_id"] as string | undefined
  if (!agentId) {
    return NextResponse.json({ skipped: true, reason: "No ElevenLabs agent_id configured for this org" })
  }

  // Génère le system prompt depuis la config DB
  const agentDef = getAgent(slug)
  if (!agentDef) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

  const row = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, slug)),
    columns: { config: true },
  }).catch(() => null)

  const config = (row?.config ?? {}) as Record<string, unknown>
  const prompt = agentDef.systemPromptFn({ orgId, ...config })

  // Récupère la voix configurée
  const specific = config["specific"] as Record<string, unknown> | undefined
  const voiceId = specific?.["elevenLabsVoiceId"] as string | undefined
    ?? integration?.credentials?.["voice_id"] as string | undefined
    ?? process.env["ELEVENLABS_VOICE_ID_MARINE"]
    ?? "pNInz6obpgDQGcFmaJgB"

  // Patch l'agent ElevenLabs
  const patchRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: { prompt },
          language: "fr",
        },
        tts: { voice_id: voiceId },
      },
    }),
  })

  if (!patchRes.ok) {
    const err = await patchRes.text()
    return NextResponse.json({ error: `ElevenLabs PATCH failed: ${patchRes.status} — ${err}` }, { status: 502 })
  }

  return NextResponse.json({ synced: true, agentId, voiceId })
}
