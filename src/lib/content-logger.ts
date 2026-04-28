import { db } from "@/lib/db"
import { contents, contentAttachments } from "@/lib/db/schema"

export type ContentType =
  | "social_post"
  | "article"
  | "email"
  | "sms"
  | "image"
  | "video"
  | "document"
  | "workflow"
  | "call_summary"
  | "report"
  | "conversation"

export type Platform =
  | "linkedin"
  | "instagram"
  | "wordpress"
  | "gmail"
  | "whatsapp"
  | "twitter"

export interface ContentAttachmentInput {
  type: "image" | "video" | "audio" | "document" | "thumbnail"
  url: string
  mimeType?: string
  width?: number
  height?: number
  durationSeconds?: number
  position?: number
}

export interface LogContentInput {
  orgId: string
  agentSlug: string
  contentType: ContentType
  platform?: Platform
  title: string
  description?: string
  body?: string
  externalUrl?: string
  externalId?: string
  attachments?: ContentAttachmentInput[]
  metadata?: Record<string, unknown>
}

export async function logContent(input: LogContentInput) {
  const [content] = await db
    .insert(contents)
    .values({
      orgId: input.orgId,
      agentSlug: input.agentSlug,
      contentType: input.contentType,
      platform: input.platform,
      title: input.title,
      description: input.description ?? null,
      body: input.body ?? null,
      status: "published",
      externalUrl: input.externalUrl ?? null,
      externalId: input.externalId ?? null,
      metadata: input.metadata ?? {},
    })
    .returning()

  if (!content) throw new Error("Failed to insert content")

  if (input.attachments?.length) {
    await db.insert(contentAttachments).values(
      input.attachments.map((att, i) => ({
        contentId: content.id,
        attachmentType: att.type,
        storageUrl: att.url,
        storageKey: "",
        mimeType: att.mimeType ?? null,
        sizeBytes: null,
        width: att.width ?? null,
        height: att.height ?? null,
        durationSeconds: att.durationSeconds ?? null,
        position: att.position ?? i,
      }))
    )
  }

  return content
}
