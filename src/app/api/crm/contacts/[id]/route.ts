import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { prospects } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ProspectStatus = "new" | "contacted" | "replied" | "qualified" | "lost" | "won"

const STATUS_FR_TO_DB: Record<string, ProspectStatus> = {
  Nouveau: "new",
  Contacté: "contacted",
  Qualifié: "qualified",
  Proposition: "replied",
  Gagné: "won",
  Perdu: "lost",
}

const STATUS_DB_TO_FR: Record<ProspectStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  replied: "Proposition",
  won: "Gagné",
  lost: "Perdu",
}

function rowToContact(row: typeof prospects.$inferSelect) {
  const meta = (row.metadata ?? {}) as Record<string, unknown>
  const fullName = row.fullName ?? ""
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? ""
  const lastName = parts.slice(1).join(" ")
  return {
    id: row.id,
    firstName,
    lastName,
    company: row.company ?? "",
    email: row.email ?? "",
    phone: (meta.phone as string) ?? "",
    status: STATUS_DB_TO_FR[row.status] ?? "Nouveau",
    lastContact: (meta.lastContact as string) ?? row.createdAt.toISOString(),
    agentSlug: (meta.agentSlug as string) ?? "elio",
    tags: (meta.tags as string[]) ?? [],
    notes: (meta.notes as string) ?? "",
    dealValue: meta.dealValue as number | undefined,
    activity: (meta.activity as unknown[]) ?? [],
    createdAt: row.createdAt.toISOString(),
  }
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.string().optional(),
  agentSlug: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  dealValue: z.number().optional(),
  lastContact: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const d = parsed.data

  const existing = await db.query.prospects.findFirst({
    where: (p, { and: andFn, eq: eqFn }) => andFn(eqFn(p.id, id), eqFn(p.orgId, orgId)),
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existingMeta = (existing.metadata ?? {}) as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if (d.firstName !== undefined || d.lastName !== undefined) {
    const fn = d.firstName ?? (existing.fullName?.split(/\s+/)[0] ?? "")
    const ln = d.lastName ?? (existing.fullName?.split(/\s+/).slice(1).join(" ") ?? "")
    updates["fullName"] = `${fn} ${ln}`.trim()
  }
  if (d.company !== undefined) updates["company"] = d.company
  if (d.email !== undefined) updates["email"] = d.email || null
  if (d.status !== undefined) updates["status"] = STATUS_FR_TO_DB[d.status] ?? existing.status

  const newMeta: Record<string, unknown> = { ...existingMeta }
  if (d.phone !== undefined) newMeta["phone"] = d.phone
  if (d.agentSlug !== undefined) newMeta["agentSlug"] = d.agentSlug
  if (d.tags !== undefined) newMeta["tags"] = d.tags
  if (d.notes !== undefined) newMeta["notes"] = d.notes
  if (d.dealValue !== undefined) newMeta["dealValue"] = d.dealValue
  if (d.lastContact !== undefined) newMeta["lastContact"] = d.lastContact
  updates["metadata"] = newMeta

  const [row] = await db
    .update(prospects)
    .set(updates)
    .where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))
    .returning()

  if (!row) return NextResponse.json({ error: "Update failed" }, { status: 500 })
  return NextResponse.json({ contact: rowToContact(row) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  await db.delete(prospects).where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))
  return NextResponse.json({ success: true })
}
