export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { contents, contentAttachments } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { z } from "zod"

async function resolveContent(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
    .limit(1)
  return row ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const content = await resolveContent(orgId, id)
  if (!content) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const attachments = await db
    .select()
    .from(contentAttachments)
    .where(eq(contentAttachments.contentId, id))
    .orderBy(asc(contentAttachments.position))

  return NextResponse.json({ content: { ...content, attachments } })
}

const patchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(1000).optional(),
  body: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const content = await resolveContent(orgId, id)
  if (!content) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const updates: Partial<typeof contents.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (parsed.data.title !== undefined) updates.title = parsed.data.title
  if (parsed.data.description !== undefined) updates.description = parsed.data.description
  if (parsed.data.body !== undefined) updates.body = parsed.data.body

  const [updated] = await db
    .update(contents)
    .set(updates)
    .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
    .returning()

  return NextResponse.json({ content: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const content = await resolveContent(orgId, id)
  if (!content) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const force = new URL(req.url).searchParams.get("force") === "true"

  if (force) {
    await db
      .delete(contents)
      .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
  } else {
    await db
      .update(contents)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
  }

  return NextResponse.json({ ok: true })
}
