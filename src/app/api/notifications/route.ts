import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { actionLogs, agentInstances } from "@/lib/db/schema"
import { agents } from "@/lib/agents/data"
import { buildNotificationLabel, type ActionPayload } from "@/lib/agents/action-labels"
import { desc, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "maintenant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "hier"
  return `il y a ${diffD}j`
}

function agentDisplayName(slug: string): string {
  const agent = agents.find((a) => a.slug === slug)
  return agent?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

export interface NotificationItem {
  id: string
  text: string
  time: string
  read: boolean
  agentSlug: string
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()

  try {
    const rows = await db
      .select({
        id: actionLogs.id,
        type: actionLogs.type,
        createdAt: actionLogs.createdAt,
        payload: actionLogs.payload,
        agentSlug: agentInstances.agentSlug,
      })
      .from(actionLogs)
      .leftJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
      .where(eq(actionLogs.orgId, orgId))
      .orderBy(desc(actionLogs.createdAt))
      .limit(10)

    const notifications: NotificationItem[] = rows.map((row) => {
      const payload: ActionPayload =
        row.payload && typeof row.payload === "object"
          ? (row.payload as Record<string, unknown>)
          : null
      const payloadSlug =
        payload && typeof payload.agentSlug === "string" ? payload.agentSlug : undefined
      const slug = row.agentSlug ?? payloadSlug ?? "charles"
      const name = agentDisplayName(slug)
      return {
        id: row.id,
        text: buildNotificationLabel(row.type, name, payload),
        time: relativeTime(row.createdAt),
        read: false,
        agentSlug: slug,
      }
    })

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error("[notifications] DB error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ notifications: [] })
  }
}
