export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { integrations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  webhook_url: z.string().url().nullable().optional(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  try {
    await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.orgId, orgId)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const row = await db.query.integrations.findFirst({
      where: and(eq(integrations.id, id), eq(integrations.orgId, orgId)),
      columns: { metadata: true },
    })
    const meta = (row?.metadata ?? {}) as Record<string, unknown>
    await db
      .update(integrations)
      .set({ metadata: { ...meta, ...parsed.data } })
      .where(and(eq(integrations.id, id), eq(integrations.orgId, orgId)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
