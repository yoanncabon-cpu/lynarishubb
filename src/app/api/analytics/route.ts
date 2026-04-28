import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { conversations, actionLogs, agentInstances } from "@/lib/db/schema"
import { eq, and, gte, lt, sql, count } from "drizzle-orm"

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


export async function GET(request: NextRequest) {
  const range = parseInt(request.nextUrl.searchParams.get("range") ?? "30", 10)
  const rangeN = [7, 30, 90].includes(range) ? range : 30
  const since = daysAgo(rangeN)
  const prevSince = daysAgo(rangeN * 2)

  try {
    const orgId = await getOrProvisionOrgId()

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

    // ── Per-agent breakdown ──────────────────────────────────────────────────
    const instances = await db.query.agentInstances.findMany({
      where: (ai, { eq: e }) => e(ai.orgId, orgId),
      columns: { id: true, agentSlug: true },
    })

    const agentConvCounts = await Promise.all(
      instances.map(inst =>
        db.select({ c: count() }).from(conversations)
          .where(and(eq(conversations.orgId, orgId), eq(conversations.agentInstanceId, inst.id), gte(conversations.startedAt, since)))
          .then(r => ({ slug: inst.agentSlug, convs: r[0]?.c ?? 0 }))
      )
    )

    const agentActionCounts = await Promise.all(
      instances.map(inst =>
        db.select({ c: count() }).from(actionLogs)
          .where(and(eq(actionLogs.orgId, orgId), eq(actionLogs.agentInstanceId, inst.id), gte(actionLogs.createdAt, since)))
          .then(r => ({ slug: inst.agentSlug, actions: r[0]?.c ?? 0 }))
      )
    )

    const actionMap = Object.fromEntries(agentActionCounts.map(a => [a.slug, a.actions]))
    const totalConvs = agentConvCounts.reduce((a, b) => a + b.convs, 0) || 1

    const agentBreakdown = agentConvCounts
      .map(a => ({
        slug: a.slug,
        name: a.slug.charAt(0).toUpperCase() + a.slug.slice(1),
        conversations: a.convs,
        actions: actionMap[a.slug] ?? 0,
        pct: Math.round((a.convs / totalConvs) * 100),
        color: AGENT_COLORS[a.slug] ?? "#6B7280",
      }))
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

    // Build day-keyed maps
    const convByDay = Object.fromEntries(dailyConvRaw.map(r => [r.day, r.c]))
    const actionByDay = Object.fromEntries(dailyActionRaw.map(r => [r.day, r.c]))

    // Fill all days in range
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
    const finalConvSeries = dailyConversations
    const finalActionSeries = dailyActions

    // Top action types for bar chart
    const topActionTypes = actionTypes.slice(0, 6).map(a => ({
      label: a.type,
      count: a.c,
    }))

    return NextResponse.json({
      totals: {
        conversations: convTotal,
        actions: actionTotal,
        callsMinutes,
        emailsProcessed,
        deltaConversations: deltaConv,
        deltaActions: deltaAction,
      },
      dailyConversations: finalConvSeries,
      dailyActions: finalActionSeries,
      agentBreakdown: agentBreakdown.length > 0 ? agentBreakdown : null,
      topActionTypes: topActionTypes.length > 0 ? topActionTypes : null,
      hasRealData,
    })
  } catch (err) {
    console.error("Analytics API error:", err)
    // Fallback gracieux
    const days = rangeN
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
