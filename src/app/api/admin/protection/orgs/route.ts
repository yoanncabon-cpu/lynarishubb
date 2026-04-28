// GET /api/admin/protection/orgs — table des orgs avec leur état protection
//
// ⚠️ ADMIN ONLY. Retourne la liste des orgs avec :
// - Plan, budget, conso réelle, ratio
// - État (safe / notify70 / notify90 / over100 / over130)
// - Top agent consommateur
//
// Filtres query string :
// - ?state=safe|notify70|notify90|over100|over130
// - ?planId=discovery|starter|pro|business|custom
// - ?q=search (sur org name)

import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import {
  organizations,
  orgProtectionState,
  usageCosts,
} from "@/lib/db/schema"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { eq, sql, ilike, and, type SQL } from "drizzle-orm"
import { PROTECTION_THRESHOLDS } from "@/lib/cost-protection/config"
import { planSchema } from "@/lib/pricing/plans"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const STATE_FILTERS = ["safe", "notify70", "notify90", "over100", "over130"] as const
type StateFilter = (typeof STATE_FILTERS)[number]

function isStateFilter(s: string): s is StateFilter {
  return (STATE_FILTERS as readonly string[]).includes(s)
}

function categorizeRatio(ratio: number): StateFilter {
  if (ratio < PROTECTION_THRESHOLDS.notify_admin) return "safe"
  if (ratio < PROTECTION_THRESHOLDS.notify_client) return "notify70"
  if (ratio < PROTECTION_THRESHOLDS.economy_mode) return "notify90"
  if (ratio < PROTECTION_THRESHOLDS.hard_cap) return "over100"
  return "over130"
}

export async function GET(req: NextRequest) {
  const admin = await isLynarisAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const stateFilter = searchParams.get("state")
  const planFilterRaw = searchParams.get("planId")
  const queryFilter = searchParams.get("q")?.trim() ?? ""

  // Validation : planId via Zod
  const planFilter =
    planFilterRaw !== null ? planSchema.safeParse(planFilterRaw) : null

  // Build WHERE clauses (Drizzle)
  const whereClauses: SQL[] = []
  if (planFilter?.success) {
    whereClauses.push(eq(organizations.planId, planFilter.data))
  }
  if (queryFilter.length > 0) {
    whereClauses.push(ilike(organizations.name, `%${queryFilter}%`))
  }

  // Query : join organizations + orgProtectionState
  const rows = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      planId: organizations.planId,
      currentCostEuros: orgProtectionState.currentCostEuros,
      budgetEuros: orgProtectionState.budgetEuros,
      economyModeActive: orgProtectionState.economyModeActive,
      hardCapActive: orgProtectionState.hardCapActive,
    })
    .from(organizations)
    .leftJoin(
      orgProtectionState,
      eq(orgProtectionState.orgId, organizations.id)
    )
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .limit(200)

  // Filter par état + calcul ratio
  const enriched = rows
    .map((r) => {
      const cost = Number.parseFloat(r.currentCostEuros ?? "0")
      const budget = Number.parseFloat(r.budgetEuros ?? "0")
      const ratio = budget > 0 ? cost / budget : 0
      const state = categorizeRatio(ratio)
      return {
        orgId: r.orgId,
        orgName: r.orgName,
        planId: r.planId,
        currentCostEuros: Math.round(cost * 100) / 100,
        budgetEuros: Math.round(budget * 100) / 100,
        ratio: Math.round(ratio * 1000) / 1000,
        state,
        economyModeActive: r.economyModeActive ?? false,
        hardCapActive: r.hardCapActive ?? false,
      }
    })
    .filter((r) => {
      if (stateFilter !== null && isStateFilter(stateFilter)) {
        return r.state === stateFilter
      }
      return true
    })

  // ── Top agent par org (lookup léger pour les 50 premiers seulement) ──
  const topOrgs = enriched.slice(0, 50)
  const topAgentByOrg = await Promise.all(
    topOrgs.map(async (o) => {
      const top = await db
        .select({
          agentSlug: usageCosts.agentSlug,
          totalCost: sql<string>`SUM(${usageCosts.costEuros})`,
        })
        .from(usageCosts)
        .where(eq(usageCosts.orgId, o.orgId))
        .groupBy(usageCosts.agentSlug)
        .orderBy(sql`SUM(${usageCosts.costEuros}) DESC`)
        .limit(1)
      return {
        orgId: o.orgId,
        topAgent: top[0]?.agentSlug ?? null,
      }
    })
  )

  const topAgentMap = new Map(topAgentByOrg.map((t) => [t.orgId, t.topAgent]))

  return NextResponse.json({
    orgs: enriched.map((o) => ({
      ...o,
      topAgent: topAgentMap.get(o.orgId) ?? null,
    })),
    total: enriched.length,
  })
}
