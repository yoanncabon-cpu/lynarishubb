export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { contents, contentAttachments } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const [original] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
    .limit(1)

  if (!original) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const originalAttachments = await db
    .select()
    .from(contentAttachments)
    .where(eq(contentAttachments.contentId, id))
    .orderBy(asc(contentAttachments.position))

  const [duplicate] = await db
    .insert(contents)
    .values({
      orgId,
      agentSlug: original.agentSlug,
      contentType: original.contentType,
      platform: original.platform,
      title: `Copie — ${original.title}`,
      description: original.description,
      body: original.body,
      status: "published",
      externalUrl: null,
      externalId: null,
      metadata: original.metadata ?? {},
    })
    .returning()

  if (!duplicate) {
    return NextResponse.json({ error: "Erreur duplication" }, { status: 500 })
  }

  if (originalAttachments.length > 0) {
    await db.insert(contentAttachments).values(
      originalAttachments.map((att) => ({
        contentId: duplicate.id,
        attachmentType: att.attachmentType,
        storageUrl: att.storageUrl,
        storageKey: att.storageKey ?? "",
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        width: att.width,
        height: att.height,
        durationSeconds: att.durationSeconds,
        position: att.position ?? 0,
      }))
    )
  }

  return NextResponse.json({ content: duplicate }, { status: 201 })
}
