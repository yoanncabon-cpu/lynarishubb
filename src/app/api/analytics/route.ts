import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { conversations, actionLogs, agentInstances } from "@/lib/db/schema"
import { eq, and, gte, lt, sql, count } from "drizzle-orm"
import { actionTypeShortLabel } from "@/lib/agents/action-labels"
import { cached } from "@/lib/cache/redis"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const AGENT_COLORS: Record<string, string> = {
  marine: "#22D3EE", charles: "#A78BFA", lou: "#F472B6",
  elio: "#34D399", mae: "#F59E0B", max: "#FB923C",
  nova: "#818CF8", alba: "#C084FC", orion: "#94A3B8",
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}


interface AnalyticsResult {
  totals: {
    conversations: number
    actions: number
    callsMinutes: number
    emailsProcessed: number
    deltaConversations: number
    deltaActions: number
  }
  dailyConversations: { date: string; value: number }[]
  dailyActions: { date: string; value: number }[]
  agentBreakdown: Array<{
    slug: string
    name: string
    conversations: number
    actions: number
    pct: number
    color: string
  }> | null
  topActionTypes: Array<{ label: string; count: number }> | null
  hasRealData: boolean
}

async function computeAnalytics(orgId: string, rangeN: number): Promise<AnalyticsResult> {
  const since = daysAgo(rangeN)
  const prevSince = daysAgo(rangeN * 2)

  // ── Totals ──────────────────────────────────────────────────────────────
  const [convTotal, convPrev, actionTotal, actionPrev] = await Promise.all([
    db.select({ c: count() }).from(conversations)
      .where(and(eq(conversations.orgId, orgId), gte(conversations.startedAt, since)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: count() }).from(conversations)
      .where(and(eq(conversations.orgId, orgId), gte(conversations.startedAt, prevSince), lt(conversations.startedAt, since)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: count() }).from(actionLogs)
      .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, since)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: count() }).from(actionLogs)
      .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, prevSince), lt(actionLogs.createdAt, since)))
      .then(r => r[0]?.c ?? 0),
  ])

  const deltaConv = convPrev > 0 ? Math.round(((convTotal - convPrev) / convPrev) * 100) : 0
  const deltaAction = actionPrev > 0 ? Math.round(((actionTotal - actionPrev) / actionPrev) * 100) : 0

  // ── Action types breakdown ───────────────────────────────────────────────
  const actionTypes = await db
    .select({ type: actionLogs.type, c: count() })
    .from(actionLogs)
    .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, since)))
    .groupBy(actionLogs.type)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  const callsLogs = actionTypes.find(a => a.type.toLowerCase().includes("call"))
  const emailLogs = actionTypes.find(a => a.type.toLowerCase().includes("email") || a.type.toLowerCase().includes("mail"))
  const callsMinutes = callsLogs ? Math.round(callsLogs.c * 2.5) : 0
  const emailsProcessed = emailLogs?.c ?? 0

  // ── Per-agent breakdown — 2 queries GROUP BY au lieu de 2×N ─────────────
  // Avant : 2 × nb_agents queries en parallèle (~26 queries pour 9 agents)
  // Après : 3 queries totales (instances + 2 GROUP BY) → gain ~70%
  const [instances, convGrouped, actionGrouped] = await Promise.all([
    db.query.agentInstances.findMany({
      where: (ai, { eq: e }) => e(ai.orgId, orgId),
      columns: { id: true, agentSlug: true },
    }),
    db
      .select({ agentInstanceId: conversations.agentInstanceId, c: count() })
      .from(conversations)
      .where(and(eq(conversations.orgId, orgId), gte(conversations.startedAt, since)))
      .groupBy(conversations.agentInstanceId),
    db
      .select({ agentInstanceId: actionLogs.agentInstanceId, c: count() })
      .from(actionLogs)
      .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, since)))
      .groupBy(actionLogs.agentInstanceId),
  ])

  const convCountByInstance = new Map(convGrouped.map((r) => [r.agentInstanceId, r.c]))
  const actionCountByInstance = new Map(actionGrouped.map((r) => [r.agentInstanceId, r.c]))

  const totalConvs = instances.reduce((acc, inst) => acc + (convCountByInstance.get(inst.id) ?? 0), 0) || 1

  const agentBreakdown = instances
    .map((inst) => {
      const convs = convCountByInstance.get(inst.id) ?? 0
      const actions = actionCountByInstance.get(inst.id) ?? 0
      return {
        slug: inst.agentSlug,
        name: inst.agentSlug.charAt(0).toUpperCase() + inst.agentSlug.slice(1),
        conversations: convs,
        actions,
        pct: Math.round((convs / totalConvs) * 100),
        color: AGENT_COLORS[inst.agentSlug] ?? "#6B7280",
      }
    })
    .sort((a, b) => b.conversations - a.conversations)

  // ── Daily series (SQL GROUP BY date) ────────────────────────────────────
  const dailyConvRaw = await db
    .select({
      day: sql<string>`date_trunc('day', ${conversations.startedAt})::date::text`,
      c: count(),
    })
    .from(conversations)
    .where(and(eq(conversations.orgId, orgId), gte(conversations.startedAt, since)))
    .groupBy(sql`date_trunc('day', ${conversations.startedAt})`)
    .orderBy(sql`date_trunc('day', ${conversations.startedAt})`)

  const dailyActionRaw = await db
    .select({
      day: sql<string>`date_trunc('day', ${actionLogs.createdAt})::date::text`,
      c: count(),
    })
    .from(actionLogs)
    .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${actionLogs.createdAt})`)
    .orderBy(sql`date_trunc('day', ${actionLogs.createdAt})`)

  const convByDay = Object.fromEntries(dailyConvRaw.map(r => [r.day, r.c]))
  const actionByDay = Object.fromEntries(dailyActionRaw.map(r => [r.day, r.c]))

  const dailyConversations: { date: string; value: number }[] = []
  const dailyActions: { date: string; value: number }[] = []
  for (let i = rangeN - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const isoDay = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
    dailyConversations.push({ date: label, value: convByDay[isoDay] ?? 0 })
    dailyActions.push({ date: label, value: actionByDay[isoDay] ?? 0 })
  }

  const hasRealData = dailyConversations.some(d => d.value > 0) || dailyActions.some(d => d.value > 0)

  // Top action types for bar chart — libellé français lisible (ex: "scheduled_job" → "Tâches planifiées")
  const topActionTypes = actionTypes.slice(0, 6).map(a => ({
    label: actionTypeShortLabel(a.type),
    count: a.c,
  }))

  return {
    totals: {
      conversations: convTotal,
      actions: actionTotal,
      callsMinutes,
      emailsProcessed,
      deltaConversations: deltaConv,
      deltaActions: deltaAction,
    },
    dailyConversations,
    dailyActions,
    agentBreakdown: agentBreakdown.length > 0 ? agentBreakdown : null,
    topActionTypes: topActionTypes.length > 0 ? topActionTypes : null,
    hasRealData,
  }
}

export async function GET(request: NextRequest) {
  const range = parseInt(request.nextUrl.searchParams.get("range") ?? "30", 10)
  const rangeN = [7, 30, 90].includes(range) ? range : 30

  try {
    const orgId = await getOrProvisionOrgId()

    // Cache Redis Upstash : 5 min TTL. Hit ≈ 5-15ms vs 200-1500ms cold DB (10 queries).
    // Clé incluant orgId + range pour isolation multi-tenant + différentes fenêtres.
    // Si Upstash non configuré → no-op gracieux, requête DB directe.
    const result = await cached<AnalyticsResult>(
      `analytics:${orgId}:${rangeN}`,
      300,
      () => computeAnalytics(orgId, rangeN)
    )

    return NextResponse.json(result, {
      headers: {
        // Cache navigateur 5 min + 10 min SWR. Combiné au cache Redis serveur,
        // les hits cumulés sont quasi gratuits.
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (err) {
    console.error("Analytics API error:", err)
    return NextResponse.json({
      totals: { conversations: 0, actions: 0, callsMinutes: 0, emailsProcessed: 0, deltaConversations: 0, deltaActions: 0 },
      dailyConversations: [],
      dailyActions: [],
      agentBreakdown: null,
      topActionTypes: null,
      hasRealData: false,
    })
  }
}
