// ─────────────────────────────────────────────────────────────────────────────
// Calculateur de coût Replicate — Flux Pro/Schnell, Runway
// ─────────────────────────────────────────────────────────────────────────────

function envFloat(key: string, fallback: number): number {
  const raw = process.env[key]
  if (typeof raw !== "string") return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const REPLICATE_MODELS = [
  "flux_pro",
  "flux_schnell",
  "runway_5s",
] as const
export type ReplicateModel = (typeof REPLICATE_MODELS)[number]

/**
 * Tarifs par génération (€ HT par image / vidéo 5s).
 *
 * Sources publiques (avr. 2026) :
 *   Flux 1.1 Pro  : ≈ $0.04 / image  → 0.04 €
 *   Flux Schnell  : ≈ $0.003 / image → 0.003 €
 *   Runway Gen-3  : ≈ $1 / 5s        → 0.95 €
 */
function getReplicatePricing(model: ReplicateModel): number {
  switch (model) {
    case "flux_pro":     return envFloat("REPLICATE_PRICE_FLUX_PRO", 0.04)
    case "flux_schnell": return envFloat("REPLICATE_PRICE_FLUX_SCHNELL", 0.003)
    case "runway_5s":    return envFloat("REPLICATE_PRICE_RUNWAY_5S", 0.95)
  }
}

export interface ReplicateCostInput {
  readonly model: ReplicateModel
  /** Nombre de générations (images / vidéos). Défaut 1. */
  readonly count?: number
}

export interface ReplicateCostResult {
  readonly costEuros: number
  readonly model: ReplicateModel
  readonly count: number
}

export function computeReplicateCost(
  input: ReplicateCostInput
): ReplicateCostResult {
  const count = input.count ?? 1
  const unitPrice = getReplicatePricing(input.model)
  const total = unitPrice * count
  return {
    costEuros: Math.round(total * 10000) / 10000,
    model: input.model,
    count,
  }
}
