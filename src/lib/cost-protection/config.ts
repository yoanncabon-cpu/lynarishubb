// ─────────────────────────────────────────────────────────────────────────────
// Configuration globale de protection de marge
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚠️ INTERNE — Aucune valeur de ce fichier n'est exposée au client.
// Le client voit uniquement ses quotas (actions, voice, etc.) gérés par
// `src/lib/usage/`. Le coût réel et les budgets sont des données privées
// utilisées par le service `src/lib/cost-protection/service.ts` (étape 5).

import type { PlanId } from "@/lib/pricing/plans"

// ─── Mode global de protection ──────────────────────────────────────────────

export type CostProtectionMode = "alert" | "active"

/**
 * Mode global de protection.
 *
 * - `alert` : tracking complet + notifications, AUCUNE bascule auto.
 *             Mode initial à la publication, le temps de calibrer sur
 *             données réelles.
 * - `active` : bascule auto en mode économie à 100% du budget,
 *              hard cap à 130% (sauf actions critiques type Marine).
 *
 * À activer dans 2 mois de calibration : changer COST_PROTECTION_MODE=active
 * dans Vercel + redéploiement.
 */
export const COST_PROTECTION_MODE: CostProtectionMode =
  process.env["COST_PROTECTION_MODE"] === "active" ? "active" : "alert"

/**
 * Email destinataire des alertes admin (70% / 90% / 100% / 130%).
 */
export const COST_PROTECTION_ADMIN_EMAIL: string =
  process.env["COST_PROTECTION_ADMIN_EMAIL"] ?? "support@lynarisai.com"

// ─── Budgets par plan ───────────────────────────────────────────────────────

/**
 * Budget mensuel max de coût RÉEL accepté par plan (en euros HT).
 * Dimensionné pour garantir 70% de marge brute minimum.
 *
 * Calcul : budget = prix_plan × (1 - marge_garantie)
 *   - Starter 149€ × 0.30 ≈ 45€
 *   - Pro 449€ × 0.30 ≈ 135€
 *   - Business 1190€ × 0.30 ≈ 360€
 *   - Custom 2490€ × 0.30 ≈ 750€
 *   - Discovery : 5€ par essai 14j (acquisition acceptée à perte)
 */
export const PLAN_COST_BUDGET_EUROS: Readonly<Record<PlanId, number>> = {
  discovery: 5,
  starter: 45,
  pro: 135,
  business: 360,
  custom: 750,
} as const

/**
 * Marge brute minimum garantie (utilisée pour calcul/affichage admin).
 * Si le coût réel atteint le budget, la marge est exactement 70%.
 */
export const TARGET_GROSS_MARGIN: number = 0.7

// ─── Seuils de notification / bascule ───────────────────────────────────────

/**
 * Paliers de protection (ratio coût / budget).
 *
 * Mode ALERTE :
 *   - 70%  : notif admin (ex: "🟢 Cabinet X à 70% budget Pro")
 *   - 90%  : notif admin + email upsell client
 *   - 100% : alerte admin uniquement (PAS de bascule auto)
 *   - 130% : alerte critique admin (PAS de hard cap auto)
 *
 * Mode ACTIF (à activer après calibration) :
 *   - 100% : bascule auto modèles éco (Opus → Sonnet → Haiku)
 *   - 130% : hard cap actions non critiques (Marine continue)
 */
export const PROTECTION_THRESHOLDS = {
  notify_admin: 0.70,
  notify_client: 0.90,
  economy_mode: 1.00,
  hard_cap: 1.30,
} as const

export type ProtectionThreshold = keyof typeof PROTECTION_THRESHOLDS

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Retourne le budget mensuel en euros pour un plan donné.
 */
export function getBudgetForPlan(planId: PlanId): number {
  return PLAN_COST_BUDGET_EUROS[planId]
}

/**
 * Calcule le ratio de consommation (coût actuel / budget).
 * Retourne un nombre >= 0. > 1 indique un dépassement.
 */
export function getConsumptionRatio(
  currentCostEuros: number,
  budgetEuros: number
): number {
  if (budgetEuros <= 0) return 0
  return currentCostEuros / budgetEuros
}

/**
 * Retourne le palier le plus élevé franchi par un ratio donné, ou null
 * si aucun palier n'est franchi.
 *
 * Utilisé par le service tracking pour déterminer quel(s) flag(s) marquer
 * et quelle(s) notification(s) déclencher.
 */
export function getThresholdReached(ratio: number): ProtectionThreshold | null {
  if (ratio >= PROTECTION_THRESHOLDS.hard_cap) return "hard_cap"
  if (ratio >= PROTECTION_THRESHOLDS.economy_mode) return "economy_mode"
  if (ratio >= PROTECTION_THRESHOLDS.notify_client) return "notify_client"
  if (ratio >= PROTECTION_THRESHOLDS.notify_admin) return "notify_admin"
  return null
}

/**
 * Indique si le mode actuel autorise les bascules automatiques
 * (économie / hard cap). Toujours `false` en mode ALERTE.
 */
export function isAutoSwitchEnabled(): boolean {
  return COST_PROTECTION_MODE === "active"
}
