import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { actionLogs, conversations } from "@/lib/db/schema"
import { eq, and, sql, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "maintenant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `il y a ${diffD}j`
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const orgId = await getOrProvisionOrgId()

  const instance = await db.query.agentInstances.findFirst({
    where: (ai, { and: a, eq: e }) => a(e(ai.orgId, orgId), e(ai.agentSlug, slug)),
  })

  if (!instance) {
    return NextResponse.json({
      conversations: 0,
      lastAction: "jamais",
      costEur: "0.00",
      successRate: 100,
    })
  }

  const [convCount, logs, lastLog] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(and(eq(conversations.orgId, orgId), eq(conversations.agentInstanceId, instance.id)))
      .then((r) => r[0]?.count ?? 0),

    db.query.actionLogs.findMany({
      where: (l, { and: a, eq: e }) => a(e(l.orgId, orgId), e(l.agentInstanceId, instance.id)),
      columns: { status: true, costUsd: true, createdAt: true },
      limit: 500,
    }),

    db.query.actionLogs.findFirst({
      where: (l, { and: a, eq: e }) => a(e(l.orgId, orgId), e(l.agentInstanceId, instance.id)),
      orderBy: [desc(actionLogs.createdAt)],
      columns: { createdAt: true },
    }),
  ])

  const successCount = logs.filter((l) => l.status === "success").length
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100

  // Sum real cost_usd from DB, convert to EUR (approx 0.92 rate)
  const totalUsd = logs.reduce((acc, l) => acc + parseFloat(String(l.costUsd ?? "0")), 0)
  const costEur = (totalUsd * 0.92).toFixed(2)

  return NextResponse.json({
    conversations: convCount,
    lastAction: lastLog ? relativeTime(lastLog.createdAt) : "jamais",
    costEur,
    successRate,
  })
}
