import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { prospects } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
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

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().default(""),
  company: z.string().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().default(""),
  status: z.string().default("Nouveau"),
  agentSlug: z.string().default("elio"),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(""),
  dealValue: z.number().optional(),
})

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  const rows = await db.query.prospects.findMany({
    where: (p, { eq }) => eq(p.orgId, orgId),
    orderBy: [desc(prospects.createdAt)],
    limit: 500,
  })
  return NextResponse.json({ contacts: rows.map(rowToContact) })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const d = parsed.data
  const [row] = await db.insert(prospects).values({
    orgId,
    fullName: `${d.firstName} ${d.lastName}`.trim(),
    email: d.email || undefined,
    company: d.company || undefined,
    status: (STATUS_FR_TO_DB[d.status] ?? "new") as ProspectStatus,
    metadata: {
      phone: d.phone,
      agentSlug: d.agentSlug,
      tags: d.tags,
      notes: d.notes,
      dealValue: d.dealValue,
      lastContact: new Date().toISOString(),
      activity: [],
    },
  }).returning()
  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 })
  return NextResponse.json({ contact: rowToContact(row) }, { status: 201 })
}
