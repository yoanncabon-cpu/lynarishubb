export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status:      z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority:    z.enum(["low", "medium", "high"]).default("medium"),
  dueDate:     z.string().datetime().optional().nullable(),
})

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.orgId, orgId))
    .orderBy(desc(tasks.createdAt))

  return NextResponse.json(
    { tasks: rows },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  )
}

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues.map(i => `${i.path.join(".")} : ${i.message}`).join(" | "),
    }, { status: 422 })
  }

  const d = parsed.data
  const [task] = await db.insert(tasks).values({
    orgId,
    title:       d.title,
    description: d.description ?? null,
    status:      d.status,
    priority:    d.priority,
    dueDate:     d.dueDate ? new Date(d.dueDate) : null,
    createdBy:   "user",
  }).returning()

  return NextResponse.json({ task }, { status: 201 })
}
