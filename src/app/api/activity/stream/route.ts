export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { db } from "@/lib/db"
import { actionLogs, agentInstances } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { and, desc, eq, gt } from "drizzle-orm"

async function fetchLogs(orgId: string, since?: Date) {
  // ⚠️ Filtre SQL réel sur `since` (avant : la condition était identique des 2 côtés → bug)
  const whereClause = since
    ? and(eq(actionLogs.orgId, orgId), gt(actionLogs.createdAt, since))
    : eq(actionLogs.orgId, orgId)

  const logs = await db
    .select({
      id: actionLogs.id,
      type: actionLogs.type,
      createdAt: actionLogs.createdAt,
      agentInstanceId: actionLogs.agentInstanceId,
      payload: actionLogs.payload,
    })
    .from(actionLogs)
    .where(whereClause)
    .orderBy(desc(actionLogs.createdAt))
    .limit(since ? 20 : 10)

  const instanceIds = logs
    .map((l) => l.agentInstanceId)
    .filter((id): id is string => id !== null)

  const instances =
    instanceIds.length > 0
      ? await db
          .select({ id: agentInstances.id, agentSlug: agentInstances.agentSlug })
          .from(agentInstances)
          .where(eq(agentInstances.orgId, orgId))
      : []

  const slugMap = new Map(instances.map((i) => [i.id, i.agentSlug]))

  return logs.map((l) => {
    const payloadObj =
      l.payload && typeof l.payload === "object"
        ? (l.payload as Record<string, unknown>)
        : null
    const payloadSlug =
      payloadObj && typeof payloadObj.agentSlug === "string"
        ? payloadObj.agentSlug
        : undefined
    return {
      type: "activity" as const,
      id: l.id, // ✅ Identifiant unique pour déduplication client
      agent:
        (l.agentInstanceId ? slugMap.get(l.agentInstanceId) : undefined) ??
        payloadSlug ??
        "charles",
      action: l.type,
      time: l.createdAt.toISOString(),
      payload: payloadObj,
    }
  })
}

export async function GET() {
  const encoder = new TextEncoder()

  let orgId: string
  try {
    orgId = await getOrProvisionOrgId()
  } catch {
    return new Response("Unauthorized", { status: 401 })
  }

  let pingInterval: ReturnType<typeof setInterval> | undefined
  let pollInterval: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    async start(controller) {
      const safeEnqueue = (chunk: Uint8Array) => {
        try { controller.enqueue(chunk) } catch { /* contrôleur fermé */ }
      }

      // Ping immédiat — force onopen côté client
      safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping", ts: Date.now() })}\n\n`))

      // Snapshot initial — événements envoyés en bloc avec flag `snapshot: true`
      // Le client REMPLACE sa liste au reçu d'un snapshot (au lieu d'append)
      try {
        const initial = await fetchLogs(orgId)
        safeEnqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "snapshot", events: initial, ts: Date.now() })}\n\n`
          )
        )
      } catch { /* DB indisponible */ }

      // Ping keepalive toutes les 30s
      pingInterval = setInterval(() => {
        safeEnqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "ping", ts: Date.now() })}\n\n`)
        )
      }, 30_000)

      // Polling nouveaux logs toutes les 30s (live append)
      let lastCheck = new Date()
      pollInterval = setInterval(async () => {
        try {
          const newLogs = await fetchLogs(orgId, lastCheck)
          for (const ev of newLogs) {
            safeEnqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`))
          }
          lastCheck = new Date()
        } catch { /* ignore */ }
      }, 30_000)
    },
    cancel() {
      clearInterval(pingInterval)
      clearInterval(pollInterval)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
