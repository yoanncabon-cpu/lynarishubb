import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { actionLogs, agentInstances } from "@/lib/db/schema"
import { agents } from "@/lib/agents/data"
import { buildNotificationLabel, type ActionPayload } from "@/lib/agents/action-labels"
import { desc, eq, and, isNull, inArray } from "drizzle-orm"

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
      // Filtre les notifs effacées par l'utilisateur (notification_dismissed_at IS NULL).
      // L'audit log complet reste accessible via dashboard/analytics qui ignore ce flag.
      .where(and(eq(actionLogs.orgId, orgId), isNull(actionLogs.notificationDismissedAt)))
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

    return NextResponse.json(
      { notifications },
      {
        headers: {
          // Cache court 30s navigateur. Les dismiss font un optimistic update local
          // (cf. SpotlightTopBar.removeNotif) → l'utilisateur n'attend pas le refetch.
          // Le polling 2 min couvre l'arrivée de nouvelles notifs.
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (err) {
    logger.error("[notifications] DB error", { err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ notifications: [] })
  }
}

/**
 * DELETE /api/notifications
 *   - body { id: string }  → efface 1 notification
 *   - body { ids: string[] } → efface une liste
 *   - body vide / { all: true } → efface TOUTES les notifs de l'org
 *
 * On ne supprime PAS la ligne action_logs (audit) — on set notification_dismissed_at = NOW().
 * Multi-tenant safe : on filtre toujours par orgId pour bloquer la suppression cross-org.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let body: { id?: string; ids?: string[]; all?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    // body vide → considère comme "all"
    body = { all: true }
  }

  const now = new Date()

  try {
    if (body.id) {
      await db
        .update(actionLogs)
        .set({ notificationDismissedAt: now })
        .where(and(eq(actionLogs.id, body.id), eq(actionLogs.orgId, orgId), isNull(actionLogs.notificationDismissedAt)))
      return NextResponse.json({ ok: true, dismissed: 1 })
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await db
        .update(actionLogs)
        .set({ notificationDismissedAt: now })
        .where(and(inArray(actionLogs.id, body.ids), eq(actionLogs.orgId, orgId), isNull(actionLogs.notificationDismissedAt)))
      return NextResponse.json({ ok: true, dismissed: body.ids.length })
    }

    // Effacer toutes les notifs encore non-effacées de l'org
    await db
      .update(actionLogs)
      .set({ notificationDismissedAt: now })
      .where(and(eq(actionLogs.orgId, orgId), isNull(actionLogs.notificationDismissedAt)))

    return NextResponse.json({ ok: true, dismissed: "all" })
  } catch (err) {
    logger.error("[notifications DELETE] DB error", { err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: "Échec de l'effacement" }, { status: 500 })
  }
}
