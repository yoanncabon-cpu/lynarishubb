// GET /api/cron/monthly-reset — reset mensuel des compteurs et budgets
//
// Lance chaque jour à 02:00 UTC (cf. vercel.json crons).
// Pour chaque org dont la période courante est terminée (periodEnd <= NOW()) :
//   1. Reset org_usage_counters : actionsUsed = 0, voiceMinutesUsed = 0
//      Conserve : ragDocsCount, teamMembersCount (compteurs cumulatifs),
//                 voicePackMinutesRemaining (solde pack acheté)
//   2. Reset org_protection_state : currentCostEuros = 0, tous flags = false,
//      recalcule budgetEuros selon planId courant
//   3. Avance period_start = old end, period_end = old end + 30 jours
//
// Idempotent : si une org a déjà sa période avancée, elle est skip.

import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import {
  organizations,
  orgUsageCounters,
  orgProtectionState,
} from "@/lib/db/schema"
import { eq, lte } from "drizzle-orm"
import { PLAN_COST_BUDGET_EUROS } from "@/lib/cost-protection/config"
import { planSchema, type PlanId } from "@/lib/pricing/plans"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300 // 5 min — large pour gros volumes

const PERIOD_DAYS = 30

interface ResetResult {
  countersReset: number
  protectionReset: number
  errors: number
}

async function resetUsageCounters(now: Date): Promise<number> {
  const expired = await db
    .select({ orgId: orgUsageCounters.orgId, periodEnd: orgUsageCounters.periodEnd })
    .from(orgUsageCounters)
    .where(lte(orgUsageCounters.periodEnd, now))

  let count = 0
  for (const row of expired) {
    const newStart = row.periodEnd
    const newEnd = new Date(newStart)
    newEnd.setDate(newEnd.getDate() + PERIOD_DAYS)

    await db
      .update(orgUsageCounters)
      .set({
        actionsUsed: 0,
        voiceMinutesUsed: 0,
        // Reset mois conserve ragDocsCount + teamMembersCount + voicePackMinutesRemaining
        periodStart: newStart,
        periodEnd: newEnd,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, row.orgId))
    count++
  }
  return count
}

async function resetProtectionState(now: Date): Promise<number> {
  const expired = await db
    .select({
      orgId: orgProtectionState.orgId,
      periodEnd: orgProtectionState.periodEnd,
    })
    .from(orgProtectionState)
    .where(lte(orgProtectionState.periodEnd, now))

  let count = 0
  for (const row of expired) {
    // Lookup planId courant pour recalculer budget
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, row.orgId),
      columns: { planId: true },
    })
    const parsed = org?.planId ? planSchema.safeParse(org.planId) : null
    const planId: PlanId = parsed?.success ? parsed.data : "discovery"
    const newBudget = PLAN_COST_BUDGET_EUROS[planId]

    const newStart = row.periodEnd
    const newEnd = new Date(newStart)
    newEnd.setDate(newEnd.getDate() + PERIOD_DAYS)

    await db
      .update(orgProtectionState)
      .set({
        currentCostEuros: "0",
        budgetEuros: String(newBudget),
        notifiedAdmin70: false,
        notifiedClient90: false,
        alertedAdmin100: false,
        alertedAdmin130: false,
        economyModeActive: false,
        hardCapActive: false,
        // Note : on ne nullify pas les *ActivatedAt — ils gardent l'historique
        // de la dernière activation (utile pour audit admin)
        periodStart: newStart,
        periodEnd: newEnd,
        updatedAt: new Date(),
      })
      .where(eq(orgProtectionState.orgId, row.orgId))
    count++
  }
  return count
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result: ResetResult = {
    countersReset: 0,
    protectionReset: 0,
    errors: 0,
  }

  const now = new Date()

  try {
    result.countersReset = await resetUsageCounters(now)
  } catch (err) {
    logger.error("[cron/monthly-reset] usage_counters error", { err: String(err) })
    result.errors++
  }

  try {
    result.protectionReset = await resetProtectionState(now)
  } catch (err) {
    logger.error("[cron/monthly-reset] protection_state error", { err: String(err) })
    result.errors++
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    ...result,
  })
}

// Pour usage manuel admin via UI (réservé super-admin)
export async function POST(request: NextRequest) {
  return GET(request)
}
