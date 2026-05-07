export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { contents, contentAttachments } from "@/lib/db/schema"
import { eq, and, desc, ne, ilike, inArray } from "drizzle-orm"
import { z } from "zod"
import { logContent } from "@/lib/content-logger"
import type { ContentType, Platform } from "@/lib/content-logger"

const createSchema = z.object({
  agentSlug: z.string().min(1),
  contentType: z.string().min(1),
  platform: z.string().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
  body: z.string().optional(),
  externalUrl: z.string().url().optional(),
  externalId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(["image", "video", "audio", "document", "thumbnail"]),
        url: z.string().url(),
        mimeType: z.string().optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        durationSeconds: z.number().int().optional(),
        position: z.number().int().optional(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const agent = searchParams.get("agent")
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24"), 100)
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0)

  const conditions = [
    eq(contents.orgId, orgId),
    ne(contents.status, "archived"),
  ]

  if (type && type !== "all") {
    conditions.push(eq(contents.contentType, type))
  }
  if (agent) {
    conditions.push(eq(contents.agentSlug, agent))
  }
  if (search) {
    conditions.push(
      ilike(contents.title, `%${search}%`)
    )
  }

  const rows = await db
    .select({
      id: contents.id,
      agentSlug: contents.agentSlug,
      contentType: contents.contentType,
      platform: contents.platform,
      title: contents.title,
      description: contents.description,
      status: contents.status,
      externalUrl: contents.externalUrl,
      viewsCount: contents.viewsCount,
      likesCount: contents.likesCount,
      commentsCount: contents.commentsCount,
      sharesCount: contents.sharesCount,
      metadata: contents.metadata,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
    })
    .from(contents)
    .where(and(...conditions))
    .orderBy(desc(contents.createdAt))
    .limit(limit)
    .offset(offset)

  // Pour chaque contenu, récupérer le premier attachment (thumbnail pour la card)
  const ids = rows.map((r) => r.id)
  const attachmentsMap = new Map<string, typeof contentAttachments.$inferSelect>()

  if (ids.length > 0) {
    const firstAttachments = await db
      .select()
      .from(contentAttachments)
      .where(
        and(
          inArray(contentAttachments.contentId, ids),
          eq(contentAttachments.position, 0)
        )
      )
    for (const att of firstAttachments) {
      if (!attachmentsMap.has(att.contentId)) {
        attachmentsMap.set(att.contentId, att)
      }
    }
  }

  const items = rows.map((row) => ({
    ...row,
    thumbnail: attachmentsMap.get(row.id) ?? null,
  }))

  return NextResponse.json(
    { items, total: rows.length, offset, limit },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
  )
}

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const content = await logContent({
    orgId,
    agentSlug: parsed.data.agentSlug,
    contentType: parsed.data.contentType as ContentType,
    platform: parsed.data.platform as Platform | undefined,
    title: parsed.data.title,
    description: parsed.data.description,
    body: parsed.data.body,
    externalUrl: parsed.data.externalUrl,
    externalId: parsed.data.externalId,
    attachments: parsed.data.attachments,
    metadata: parsed.data.metadata,
  })

  return NextResponse.json({ content }, { status: 201 })
}
