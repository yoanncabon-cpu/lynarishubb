export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { agentInstances } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getAgent } from "@/lib/agents/registry"
import { z } from "zod"

const VALID_MODELS = [
  "claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-6",
  "gpt-4o", "gpt-4o-mini", "gpt-4-turbo",
  "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash",
] as const

// Config schema — tous les champs sont optionnels
const settingsSchema = z.object({
  // Generic (all agents)
  displayName: z.string().max(50).optional(),
  customInstructions: z.string().max(2000).optional(),
  tone: z.enum(["Professionnel", "Décontracté", "Formel", "Chaleureux"]).optional(),
  language: z.enum(["Français", "English", "Español"]).optional(),
  autonomy: z.boolean().optional(),
  notifications: z.boolean().optional(),
  isActive: z.boolean().optional(),
  modelId: z.enum(VALID_MODELS).optional(),
  // Agent-specific (free-form, stored in config.specific)
  specific: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!getAgent(slug)) {
    return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })
  }
  const orgId = await getOrProvisionOrgId()

  const row = await db.query.agentInstances.findFirst({
    where: and(
      eq(agentInstances.orgId, orgId),
      eq(agentInstances.agentSlug, slug)
    ),
    columns: { config: true, isActive: true, systemPromptOverride: true },
  })

  return NextResponse.json({
    settings: (row?.config as Record<string, unknown>) ?? {},
    isActive: row?.isActive ?? false,
    systemPromptOverride: row?.systemPromptOverride ?? null,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!getAgent(slug)) {
    return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })
  }
  const orgId = await getOrProvisionOrgId()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { isActive, ...configFields } = parsed.data

  await db
    .insert(agentInstances)
    .values({
      orgId,
      agentSlug: slug,
      isActive: isActive ?? false,
      config: configFields as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: [agentInstances.orgId, agentInstances.agentSlug],
      set: {
        ...(isActive !== undefined ? { isActive } : {}),
        config: configFields as Record<string, unknown>,
      },
    })

  return NextResponse.json({ success: true, slug, settings: configFields })
}
