// ─────────────────────────────────────────────────────────────────────────────
// Calculateur de coût Deepgram — STT streaming Nova-2
// ─────────────────────────────────────────────────────────────────────────────

function envFloat(key: string, fallback: number): number {
  const raw = process.env[key]
  if (typeof raw !== "string") return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Tarif (€ HT par minute audio Nova-2).
 *
 * Source (avr. 2026) :
 *   Nova-2 streaming : ≈ $0.0043/min → 0.0043 €
 */
function getMinutePrice(): number {
  return envFloat("DEEPGRAM_PRICE_PER_MIN", 0.0043)
}

export interface DeepgramCostInput {
  /** Durée audio en secondes. */
  readonly durationSeconds: number
}

export interface DeepgramCostResult {
  readonly costEuros: number
  readonly durationSeconds: number
}

/**
 * Facturation à la seconde (pas d'arrondi minute pour Deepgram).
 */
export function computeDeepgramCost(
  input: DeepgramCostInput
): DeepgramCostResult {
  const unit = getMinutePrice()
  const minutes = input.durationSeconds / 60
  const total = unit * minutes
  return {
    costEuros: Math.round(total * 10000) / 10000,
    durationSeconds: input.durationSeconds,
  }
}
