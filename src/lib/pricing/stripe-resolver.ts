// ─────────────────────────────────────────────────────────────────────────────
// Stripe price ID → PlanId resolver
// ─────────────────────────────────────────────────────────────────────────────
//
// Helper utilisé par le webhook Stripe (étape 9) pour résoudre le PlanId
// d'un Checkout / Subscription depuis le price_id Stripe.
//
// Tous les price_ids sont lus depuis process.env (cf. .env.example).

import type { PlanId } from "./plans"

/**
 * Build le mapping price_id (string) → PlanId à chaque appel.
 * On ne mémoize pas car les env vars peuvent être réloadées en dev.
 */
function buildPriceIdMap(env: NodeJS.ProcessEnv = process.env): Record<string, PlanId> {
  const map: Record<string, PlanId> = {}

  const entries: Array<[string, PlanId]> = [
    ["STRIPE_PRICE_STARTER_MONTHLY", "starter"],
    ["STRIPE_PRICE_STARTER_ANNUAL", "starter"],
    ["STRIPE_PRICE_PRO_MONTHLY", "pro"],
    ["STRIPE_PRICE_PRO_ANNUAL", "pro"],
    ["STRIPE_PRICE_BUSINESS_MONTHLY", "business"],
    ["STRIPE_PRICE_BUSINESS_ANNUAL", "business"],
  ]

  for (const [envKey, planId] of entries) {
    const priceId = env[envKey]?.trim()
    if (priceId && priceId.length > 0) {
      map[priceId] = planId
    }
  }

  return map
}

/**
 * Résout un Stripe price_id réel vers un PlanId. null si non trouvé.
 *
 * @param priceId Stripe Price ID (ex: "price_1NQRLp...")
 * @param env Override pour tests (par défaut process.env)
 */
export function getPlanFromStripePriceId(
  priceId: string,
  env: NodeJS.ProcessEnv = process.env
): PlanId | null {
  if (!priceId || priceId.length === 0) return null
  const map = buildPriceIdMap(env)
  return map[priceId] ?? null
}

/**
 * Indique si un price_id correspond à un setup fee (one-shot, pas un abonnement).
 * Utile pour différencier les line items dans le webhook checkout.session.completed.
 */
export function isStripeSetupFeePriceId(
  priceId: string,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!priceId || priceId.length === 0) return false
  const setupKeys = [
    "STRIPE_PRICE_PRO_SETUP",
    "STRIPE_PRICE_BUSINESS_SETUP",
  ]
  return setupKeys.some((k) => env[k]?.trim() === priceId)
}

/**
 * Indique si un price_id correspond au voice pack Starter (200 min — 99€).
 */
export function isVoicePackPriceId(
  priceId: string,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!priceId || priceId.length === 0) return false
  return env["STRIPE_PRICE_VOICE_PACK"]?.trim() === priceId
}
