export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

const patchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status:      z.enum(["todo", "in_progress", "done"]).optional(),
  priority:    z.enum(["low", "medium", "high"]).optional(),
  dueDate:     z.string().datetime().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues.map(i => `${i.path.join(".")} : ${i.message}`).join(" | "),
    }, { status: 422 })
  }

  const d = parsed.data
  const updates: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() }
  if (d.title !== undefined) updates.title = d.title
  if (d.description !== undefined) updates.description = d.description
  if (d.priority !== undefined) updates.priority = d.priority
  if (d.dueDate !== undefined) updates.dueDate = d.dueDate ? new Date(d.dueDate) : null
  if (d.status !== undefined) {
    updates.status = d.status
    // Marque completedAt quand on passe en "done", reset quand on revient en arrière
    updates.completedAt = d.status === "done" ? new Date() : null
  }

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.orgId, orgId)))
    .returning()

  if (!updated) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  return NextResponse.json({ task: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.orgId, orgId)))
  return NextResponse.json({ ok: true })
}
