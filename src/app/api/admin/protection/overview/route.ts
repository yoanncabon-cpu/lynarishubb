// GET /api/admin/protection/overview — métriques globales cost-protection
//
// ⚠️ ADMIN ONLY (vérification isLynarisAdmin + RLS DB sur usage_costs).
// Retourne les KPI principaux pour le dashboard /dashboard/admin/protection.

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  organizations,
  orgProtectionState,
  usageCosts,
} from "@/lib/db/schema"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { sql } from "drizzle-orm"
import { COST_PROTECTION_MODE, PROTECTION_THRESHOLDS } from "@/lib/cost-protection/config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const admin = await isLynarisAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Total orgs par plan ────────────────────────────────────────────
  const orgsByPlan = await db
    .select({
      planId: organizations.planId,
      count: sql<number>`count(*)::int`,
    })
    .from(organizations)
    .groupBy(organizations.planId)

  // ── Total coût mois en cours ───────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const totalCostRow = await db
    .select({
      total: sql<string>`COALESCE(SUM(${usageCosts.costEuros}), 0)`,
    })
    .from(usageCosts)
    .where(sql`${usageCosts.createdAt} >= ${startOfMonth.toISOString()}`)

  const totalCostEuros = Number.parseFloat(totalCostRow[0]?.total ?? "0")

  // ── État protection : compte par palier ───────────────────────────
  const protectionStates = await db
    .select({
      currentCostEuros: orgProtectionState.currentCostEuros,
      budgetEuros: orgProtectionState.budgetEuros,
    })
    .from(orgProtectionState)

  const counts = {
    total: protectionStates.length,
    safe: 0, // < 70%
    notify70: 0, // 70-90%
    notify90: 0, // 90-100%
    over100: 0, // 100-130%
    over130: 0, // > 130%
  }
  let totalBudget = 0
  let totalCurrent = 0

  for (const s of protectionStates) {
    const cost = Number.parseFloat(s.currentCostEuros)
    const budget = Number.parseFloat(s.budgetEuros)
    totalCurrent += cost
    totalBudget += budget
    const ratio = budget > 0 ? cost / budget : 0
    if (ratio < PROTECTION_THRESHOLDS.notify_admin) counts.safe++
    else if (ratio < PROTECTION_THRESHOLDS.notify_client) counts.notify70++
    else if (ratio < PROTECTION_THRESHOLDS.economy_mode) counts.notify90++
    else if (ratio < PROTECTION_THRESHOLDS.hard_cap) counts.over100++
    else counts.over130++
  }

  // Marge moyenne globale = 1 - (cost / revenue). Revenue ≈ totalBudget / 0.30
  // (puisque budget = 30% du prix plan)
  const estimatedRevenue = totalBudget / 0.30
  const globalMargin =
    estimatedRevenue > 0 ? 1 - totalCurrent / estimatedRevenue : 0

  return NextResponse.json({
    mode: COST_PROTECTION_MODE,
    orgsByPlan,
    monthCostEuros: Math.round(totalCostEuros * 100) / 100,
    protection: {
      ...counts,
      totalBudgetEuros: Math.round(totalBudget * 100) / 100,
      totalCurrentEuros: Math.round(totalCurrent * 100) / 100,
      averageMargin: Math.round(globalMargin * 1000) / 1000,
    },
  })
}
