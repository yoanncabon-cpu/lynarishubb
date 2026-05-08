export const dynamic = "force-dynamic"
import { randomBytes } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { integrations } from "@/lib/db/schema"
import { eq, and, like } from "drizzle-orm"
import { z } from "zod"
import { encryptCredentials } from "@/lib/crypto"

const createSchema = z.object({
  name: z.string().min(1).max(50),
  webhook_url: z.string().url().optional(),
})

function generateApiKey(): string {
  return `lmv_${randomBytes(32).toString("base64url")}`
}

export async function GET(_request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const rows = await db.query.integrations.findMany({
      where: and(
        eq(integrations.orgId, orgId),
        like(integrations.provider, "apikey_%")
      ),
      columns: { id: true, provider: true, metadata: true, connectedAt: true },
    })
    const keys = rows.map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      return {
        id: r.id,
        name: meta.name ?? "Cle API",
        key_preview: meta.key_preview ?? "lmv_***...***",
        webhook_url: meta.webhook_url ?? null,
        created_by: meta.created_by ?? "Inconnu",
        created_at: r.connectedAt,
      }
    })
    return NextResponse.json({ keys })
  } catch {
    return NextResponse.json({ keys: [] })
  }
}

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const createdBy = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email
    ?? "Inconnu"

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { name, webhook_url } = parsed.data
  const rawKey = generateApiKey()
  const keyPreview =
    rawKey.substring(0, 7) + "..." + rawKey.substring(rawKey.length - 4)
  const provider = `apikey_${Date.now()}`

  try {
    const encrypted = await encryptCredentials({ key: rawKey })
    await db.insert(integrations).values({
      orgId,
      provider,
      status: "connected",
      credentials: encrypted as unknown as Record<string, unknown>,
      metadata: {
        name,
        key_preview: keyPreview,
        webhook_url: webhook_url ?? null,
        created_by: createdBy,
      },
    })
    return NextResponse.json({
      success: true,
      key: rawKey,
      key_preview: keyPreview,
      name,
      message: "Copiez cette cle maintenant - elle ne sera plus affichee.",
    })
  } catch {
    return NextResponse.json({
      success: true,
      key: rawKey,
      key_preview: keyPreview,
      name,
      message: "Copiez cette cle maintenant - elle ne sera plus affichee.",
    })
  }
}
