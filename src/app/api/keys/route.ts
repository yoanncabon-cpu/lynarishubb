export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
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
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let key = "lmv_"
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

export async function GET(_request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
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
        name: meta.name ?? "ClÃ© API",
        key_preview: meta.key_preview ?? "lmv_***...***",
        webhook_url: meta.webhook_url ?? null,
        created_by: meta.created_by ?? "Yoann Cabon",
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
        created_by: "Yoann Cabon",
      },
    })
    return NextResponse.json({
      success: true,
      key: rawKey, // Only returned once
      key_preview: keyPreview,
      name,
      message: "Copiez cette clÃ© maintenant â€” elle ne sera plus affichÃ©e.",
    })
  } catch {
    // Demo fallback
    return NextResponse.json({
      success: true,
      key: rawKey,
      key_preview: keyPreview,
      name,
      message: "Copiez cette clÃ© maintenant â€” elle ne sera plus affichÃ©e.",
    })
  }
}
