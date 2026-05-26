/**
 * GET /api/agents/[slug]/prompt
 * Retourne le system prompt généré dynamiquement depuis la config DB de l'org.
 * Utilisé par ElevenLabs pour sync le prompt de l'agent vocal Marine.
 */

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getAgent } from "@/lib/agents/registry"
import { db } from "@/lib/db"
import { agentInstances } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const orgId = await getOrProvisionOrgId()

  const agentDef = getAgent(slug)
  if (!agentDef) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const row = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, slug)),
    columns: { config: true },
  }).catch(() => null)

  const config = (row?.config ?? {}) as Record<string, unknown>
  const prompt = agentDef.systemPromptFn({ orgId, ...config })

  return NextResponse.json({ prompt, slug, orgId })
}
