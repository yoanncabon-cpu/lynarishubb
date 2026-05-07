export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { eq, and } from "drizzle-orm"

const SubSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth:   z.string(),
  }),
})

export async function POST(req: Request): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json().catch(() => null)
  const parsed = SubSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 })

  const { endpoint, keys } = parsed.data

  // Upsert — évite les doublons par endpoint
  await db.delete(pushSubscriptions).where(
    and(eq(pushSubscriptions.orgId, orgId), eq(pushSubscriptions.endpoint, endpoint))
  )
  await db.insert(pushSubscriptions).values({
    orgId,
    userId: user?.id ?? null,
    endpoint,
    p256dh: keys.p256dh,
    auth:   keys.auth,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  const { endpoint } = await req.json().catch(() => ({})) as { endpoint?: string }
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 })

  await db.delete(pushSubscriptions).where(
    and(eq(pushSubscriptions.orgId, orgId), eq(pushSubscriptions.endpoint, endpoint))
  )
  return NextResponse.json({ success: true })
}
