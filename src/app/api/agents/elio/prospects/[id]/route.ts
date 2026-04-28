import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { prospects } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const updateSchema = z.object({
  status: z
    .enum(["new", "contacted", "replied", "qualified", "lost", "won"])
    .optional(),
  score: z.number().min(0).max(100).optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

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

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.status) updates["status"] = parsed.data.status
  if (parsed.data.score !== undefined) updates["score"] = parsed.data.score
  if (parsed.data.email) updates["email"] = parsed.data.email

  const [row] = await db
    .update(prospects)
    .set(updates)
    .where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))
    .returning()

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ prospect: row })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()

  await db
    .delete(prospects)
    .where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))

  return NextResponse.json({ success: true })
}
