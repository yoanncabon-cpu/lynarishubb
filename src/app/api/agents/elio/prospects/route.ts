import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { prospects } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const createSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
  headline: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  status: z
    .enum(["new", "contacted", "replied", "qualified", "lost", "won"])
    .default("new"),
  score: z.number().min(0).max(100).default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export async function GET(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  const status = request.nextUrl.searchParams.get("status")

  const rows = await db.query.prospects.findMany({
    where: status
      ? (p, { and, eq: eqFn }) =>
          and(
            eqFn(p.orgId, orgId),
            eqFn(p.status, status as "new")
          )
      : (p, { eq: eqFn }) => eqFn(p.orgId, orgId),
    orderBy: [desc(prospects.createdAt)],
    limit: 200,
  })

  return NextResponse.json({ prospects: rows, total: rows.length })
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const [row] = await db
    .insert(prospects)
    .values({
      orgId,
      fullName: parsed.data.full_name,
      email: parsed.data.email,
      company: parsed.data.company,
      headline: parsed.data.headline,
      linkedinUrl: parsed.data.linkedin_url,
      status: parsed.data.status,
      score: parsed.data.score,
      metadata: parsed.data.metadata,
    })
    .returning()

  return NextResponse.json({ prospect: row }, { status: 201 })
}
