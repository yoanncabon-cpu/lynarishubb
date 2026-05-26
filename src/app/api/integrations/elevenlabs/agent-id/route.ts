/**
 * GET  /api/integrations/elevenlabs/agent-id — retourne le agent_id configuré
 * PATCH /api/integrations/elevenlabs/agent-id — met à jour uniquement l'agent_id dans metadata
 */
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { integrations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const patchSchema = z.object({
  agent_id: z.string().min(1).max(128),
})

export async function GET() {
  const orgId = await getOrProvisionOrgId()

  const row = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.orgId, orgId),
      eq(integrations.provider, "elevenlabs")
    ),
    columns: { metadata: true, status: true },
  }).catch(() => null)

  const agentId = (row?.metadata as Record<string, unknown> | null)?.["agent_id"] as string | undefined

  return NextResponse.json({
    agent_id: agentId ?? null,
    connected: row?.status === "connected",
  })
}

export async function PATCH(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { agent_id } = parsed.data

  // Récupère la metadata existante pour la fusionner (pas écraser)
  const existing = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.orgId, orgId),
      eq(integrations.provider, "elevenlabs")
    ),
    columns: { metadata: true },
  }).catch(() => null)

  const currentMeta = (existing?.metadata as Record<string, unknown> | null) ?? {}
  const newMeta = { ...currentMeta, agent_id }

  const updated = await db
    .update(integrations)
    .set({ metadata: newMeta })
    .where(
      and(
        eq(integrations.orgId, orgId),
        eq(integrations.provider, "elevenlabs")
      )
    )
    .returning({ id: integrations.id })

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Intégration ElevenLabs non trouvée. Connecte d'abord ElevenLabs dans les intégrations." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, agent_id })
}
