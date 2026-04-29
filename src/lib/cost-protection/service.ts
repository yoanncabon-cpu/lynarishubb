// ─────────────────────────────────────────────────────────────────────────────
// Service principal de cost-protection
// ─────────────────────────────────────────────────────────────────────────────
//
// Responsabilités :
// 1. trackUsage(input)        : insère un coût + met à jour l'état protection
// 2. checkProtection(orgId, planId, action) : retourne le mode courant
//                                             (normal/economy/hard_cap)
//
// Garanties :
// - Transactions atomiques sur insert + update flags
// - Lock SELECT FOR UPDATE pour éviter les races sur les flags
// - Notifications déclenchées HORS transaction (post-commit)
// - Idempotence des notifications via flags DB (notifiedAdmin70, etc.)
// - Mode ALERTE : flags marqués mais bascules éco/hard-cap NON activées
// - Mode ACTIF : flags marqués + bascules activées

import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  organizations,
  orgProtectionState,
  usageCosts,
} from "@/lib/db/schema"
import type { AgentSlug, PlanId } from "@/lib/pricing/plans"
import {
  COST_PROTECTION_MODE,
  PROTECTION_THRESHOLDS,
  getBudgetForPlan,
  getConsumptionRatio,
  getThresholdReached,
  isAutoSwitchEnabled,
} from "./config"
import { computeCost, type ComputeCostInput } from "./cost-table"
import {
  isAllowedInEconomyMode,
  isCriticalAction,
  type ActionType,
} from "./criticality"
import {
  dispatchNotification,
  type NotificationContext,
  type NotificationProvider,
} from "./notifications"
import { resendNotificationProvider } from "./notifications-resend"

// ─── Types publics ──────────────────────────────────────────────────────────

export interface TrackUsageInput {
  readonly orgId: string
  readonly planId: PlanId
  readonly agentSlug: AgentSlug
  readonly actionType: ActionType
  readonly cost: ComputeCostInput
  readonly providerRef?: string
  /** Si true, la requête a tourné en mode économie (modèle dégradé). */
  readonly economyModeUsed?: boolean
}

export interface TrackUsageResult {
  readonly costEuros: number
  readonly newCumulativeCost: number
  readonly budget: number
  readonly ratio: number
  readonly thresholdReached: ReturnType<typeof getThresholdReached>
  readonly economyModeActivated: boolean
  readonly hardCapActivated: boolean
}

export type ProtectionMode =
  | { readonly mode: "normal" }
  | { readonly mode: "economy" }
  | { readonly mode: "hard_cap_blocked"; readonly reason: string }
  | { readonly mode: "hard_cap_passthrough"; readonly reason: string }

// ─── Helpers internes ───────────────────────────────────────────────────────

const INITIAL_PERIOD_DAYS = 30

function newPeriod(): { start: Date; end: Date } {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + INITIAL_PERIOD_DAYS)
  return { start, end }
}

/**
 * Récupère ou crée la ligne protection state pour l'org.
 * Toujours appelé DANS une transaction avec lock pour éviter race condition.
 */
async function getOrCreateProtectionState(
  tx: typeof db,
  orgId: string,
  planId: PlanId
): Promise<{
  currentCostEuros: string
  budgetEuros: string
  notifiedAdmin70: boolean
  notifiedClient90: boolean
  alertedAdmin100: boolean
  alertedAdmin130: boolean
  economyModeActive: boolean
  hardCapActive: boolean
  periodStart: Date
  periodEnd: Date
}> {
  // SELECT FOR UPDATE (verrou)
  const existing = await tx.execute(
    sql`SELECT current_cost_euros, budget_euros, notified_admin_70,
        notified_client_90, alerted_admin_100, alerted_admin_130,
        economy_mode_active, hard_cap_active, period_start, period_end
        FROM org_protection_state
        WHERE org_id = ${orgId}
        FOR UPDATE`
  )

  const row = (existing as unknown as { rows?: Array<Record<string, unknown>> })
    .rows?.[0]

  if (row) {
    return {
      currentCostEuros: String(row["current_cost_euros"] ?? "0"),
      budgetEuros: String(row["budget_euros"] ?? "0"),
      notifiedAdmin70: row["notified_admin_70"] === true,
      notifiedClient90: row["notified_client_90"] === true,
      alertedAdmin100: row["alerted_admin_100"] === true,
      alertedAdmin130: row["alerted_admin_130"] === true,
      economyModeActive: row["economy_mode_active"] === true,
      hardCapActive: row["hard_cap_active"] === true,
      periodStart: new Date(row["period_start"] as string),
      periodEnd: new Date(row["period_end"] as string),
    }
  }

  // Création initiale
  const { start, end } = newPeriod()
  const budget = getBudgetForPlan(planId)
  await tx.insert(orgProtectionState).values({
    orgId,
    periodStart: start,
    periodEnd: end,
    currentCostEuros: "0",
    budgetEuros: String(budget),
  })

  return {
    currentCostEuros: "0",
    budgetEuros: String(budget),
    notifiedAdmin70: false,
    notifiedClient90: false,
    alertedAdmin100: false,
    alertedAdmin130: false,
    economyModeActive: false,
    hardCapActive: false,
    periodStart: start,
    periodEnd: end,
  }
}

export interface FlagUpdates {
  notifiedAdmin70?: boolean
  notifiedClient90?: boolean
  alertedAdmin100?: boolean
  alertedAdmin130?: boolean
  economyModeActive?: boolean
  hardCapActive?: boolean
  economyModeActivatedAt?: Date
  hardCapActivatedAt?: Date
}

/**
 * Détermine quels flags doivent être marqués selon le ratio courant
 * et l'état précédent (idempotence).
 *
 * En mode ACTIF : active aussi economyMode/hardCap.
 * En mode ALERTE : marque uniquement les flags de notification.
 */
export function computeFlagUpdates(
  ratio: number,
  previous: {
    notifiedAdmin70: boolean
    notifiedClient90: boolean
    alertedAdmin100: boolean
    alertedAdmin130: boolean
    economyModeActive: boolean
    hardCapActive: boolean
  }
): { updates: FlagUpdates; thresholdsToNotify: Array<ReturnType<typeof getThresholdReached>> } {
  const updates: FlagUpdates = {}
  const thresholdsToNotify: Array<ReturnType<typeof getThresholdReached>> = []

  if (ratio >= PROTECTION_THRESHOLDS.notify_admin && !previous.notifiedAdmin70) {
    updates.notifiedAdmin70 = true
    thresholdsToNotify.push("notify_admin")
  }
  if (ratio >= PROTECTION_THRESHOLDS.notify_client && !previous.notifiedClient90) {
    updates.notifiedClient90 = true
    thresholdsToNotify.push("notify_client")
  }
  if (ratio >= PROTECTION_THRESHOLDS.economy_mode && !previous.alertedAdmin100) {
    updates.alertedAdmin100 = true
    thresholdsToNotify.push("economy_mode")
    if (isAutoSwitchEnabled() && !previous.economyModeActive) {
      updates.economyModeActive = true
      updates.economyModeActivatedAt = new Date()
    }
  }
  if (ratio >= PROTECTION_THRESHOLDS.hard_cap && !previous.alertedAdmin130) {
    updates.alertedAdmin130 = true
    thresholdsToNotify.push("hard_cap")
    if (isAutoSwitchEnabled() && !previous.hardCapActive) {
      updates.hardCapActive = true
      updates.hardCapActivatedAt = new Date()
    }
  }

  return { updates, thresholdsToNotify }
}

// ─── trackUsage ─────────────────────────────────────────────────────────────

/**
 * Enregistre la consommation d'une action et met à jour l'état protection
 * de l'org de façon atomique. Déclenche les notifications nécessaires
 * post-commit.
 *
 * À appeler APRÈS chaque appel à un provider externe (Anthropic, Twilio,
 * Replicate, ElevenLabs, Deepgram).
 */
export async function trackUsage(
  input: TrackUsageInput,
  notificationProvider: NotificationProvider = resendNotificationProvider
): Promise<TrackUsageResult> {
  const cost = computeCost(input.cost)

  type TxOutcome = {
    state: Awaited<ReturnType<typeof getOrCreateProtectionState>>
    newCumulative: number
    ratio: number
    thresholdReached: ReturnType<typeof getThresholdReached>
    thresholdsToNotify: Array<ReturnType<typeof getThresholdReached>>
    economyModeActivated: boolean
    hardCapActivated: boolean
  }

  const outcome = await db.transaction(async (tx): Promise<TxOutcome> => {
    // Insert ledger immuable
    await tx.insert(usageCosts).values({
      orgId: input.orgId,
      agentSlug: input.agentSlug,
      actionType: input.actionType,
      costEuros: String(cost.costEuros),
      provider: cost.provider,
      ...(input.providerRef !== undefined ? { providerRef: input.providerRef } : {}),
      ...(cost.details.inputTokens !== undefined
        ? { inputTokens: cost.details.inputTokens }
        : {}),
      ...(cost.details.outputTokens !== undefined
        ? { outputTokens: cost.details.outputTokens }
        : {}),
      ...(cost.details.durationSeconds !== undefined
        ? { durationSeconds: cost.details.durationSeconds }
        : {}),
      ...(cost.details.modelUsed !== undefined
        ? { modelUsed: cost.details.modelUsed }
        : {}),
      economyMode: input.economyModeUsed === true,
    })

    // Lock + read state actuel
    const state = await getOrCreateProtectionState(
      tx as unknown as typeof db,
      input.orgId,
      input.planId
    )

    const previousCost = Number.parseFloat(state.currentCostEuros)
    const budget = Number.parseFloat(state.budgetEuros)
    const newCumulative = previousCost + cost.costEuros
    const ratio = getConsumptionRatio(newCumulative, budget)
    const thresholdReached = getThresholdReached(ratio)

    const flagResult = computeFlagUpdates(ratio, state)

    // Update atomique
    await tx
      .update(orgProtectionState)
      .set({
        currentCostEuros: String(newCumulative),
        ...flagResult.updates,
        updatedAt: new Date(),
      })
      .where(eq(orgProtectionState.orgId, input.orgId))

    return {
      state,
      newCumulative,
      ratio,
      thresholdReached,
      thresholdsToNotify: flagResult.thresholdsToNotify,
      economyModeActivated: flagResult.updates.economyModeActive === true,
      hardCapActivated: flagResult.updates.hardCapActive === true,
    }
  })

  // ── Post-commit : notifications HORS transaction ──
  if (outcome.thresholdsToNotify.length > 0) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, input.orgId),
      columns: { name: true },
    })
    const notifCtx: NotificationContext = {
      orgId: input.orgId,
      orgName: org?.name ?? input.orgId,
      planId: input.planId,
      currentCostEuros: outcome.newCumulative,
      budgetEuros: Number.parseFloat(outcome.state.budgetEuros),
      ratio: outcome.ratio,
    }
    for (const t of outcome.thresholdsToNotify) {
      if (t !== null) {
        // Fire-and-forget : on ne bloque pas l'appel principal
        dispatchNotification(notificationProvider, t, notifCtx).catch((err) => {
          console.error("[cost-protection] notification failed", {
            threshold: t,
            err,
          })
        })
      }
    }
  }

  return {
    costEuros: cost.costEuros,
    newCumulativeCost: outcome.newCumulative,
    budget: Number.parseFloat(outcome.state.budgetEuros),
    ratio: outcome.ratio,
    thresholdReached: outcome.thresholdReached,
    economyModeActivated: outcome.economyModeActivated,
    hardCapActivated: outcome.hardCapActivated,
  }
}

// ─── checkProtection ────────────────────────────────────────────────────────

/**
 * Détermine le mode protection courant pour une action donnée.
 * À appeler AVANT l'appel à un provider externe (côté agent executor).
 *
 * Mode ALERTE : retourne toujours `normal` (pas de bascule auto).
 * Mode ACTIF :
 *   - currentCost < 100% budget        → normal
 *   - 100% ≤ currentCost < 130%        → economy (modèles dégradés)
 *   - currentCost ≥ 130%               → hard_cap_passthrough si action critique
 *                                       ou hard_cap_blocked sinon
 */
export async function checkProtection(
  orgId: string,
  planId: PlanId,
  agent: AgentSlug,
  action: ActionType
): Promise<ProtectionMode> {
  // Mode ALERTE : pas de bascule, jamais. On track et on notifie, mais
  // toutes les actions passent en mode normal.
  if (COST_PROTECTION_MODE === "alert") {
    return { mode: "normal" }
  }

  // Mode ACTIF : on lit l'état (sans lock — read-only)
  const state = await db.query.orgProtectionState.findFirst({
    where: eq(orgProtectionState.orgId, orgId),
    columns: {
      currentCostEuros: true,
      budgetEuros: true,
      economyModeActive: true,
      hardCapActive: true,
    },
  })

  if (!state) {
    // Pas encore d'état — première action de l'org. Mode normal par défaut.
    return { mode: "normal" }
  }

  const ratio = getConsumptionRatio(
    Number.parseFloat(state.currentCostEuros),
    Number.parseFloat(state.budgetEuros)
  )

  // Hard cap (130%+) : on filtre par criticité
  if (state.hardCapActive || ratio >= PROTECTION_THRESHOLDS.hard_cap) {
    if (isCriticalAction(agent, action)) {
      return {
        mode: "hard_cap_passthrough",
        reason: `Action critique (${agent}/${action}) — autorisée malgré dépassement`,
      }
    }
    return {
      mode: "hard_cap_blocked",
      reason: `Budget dépassé de 30% — action non critique bloquée`,
    }
  }

  // Economy mode (100%-130%) : on filtre par criticité aussi
  if (state.economyModeActive || ratio >= PROTECTION_THRESHOLDS.economy_mode) {
    if (!isAllowedInEconomyMode(agent, action)) {
      return {
        mode: "hard_cap_blocked",
        reason: `Action optionnelle bloquée en mode économie`,
      }
    }
    return { mode: "economy" }
  }

  return { mode: "normal" }
}
