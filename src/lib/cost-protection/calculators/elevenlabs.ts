// ─────────────────────────────────────────────────────────────────────────────
// Calculateur de coût ElevenLabs — TTS streaming
// ─────────────────────────────────────────────────────────────────────────────

function envFloat(key: string, fallback: number): number {
  const raw = process.env[key]
  if (typeof raw !== "string") return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Tarif (€ HT par caractère synthétisé).
 *
 * Source (avr. 2026) :
 *   Plan Creator $22/mois → 100k caractères
 *   ≈ 0.00022 €/char (mais facturation Lynaris au char réel ≈ 0.0006)
 */
function getCharPrice(): number {
  return envFloat("ELEVENLABS_PRICE_PER_CHAR", 0.0006)
}

export interface ElevenlabsCostInput {
  /** Nombre de caractères synthétisés. */
  readonly characterCount: number
}

export interface ElevenlabsCostResult {
  readonly costEuros: number
  readonly characterCount: number
}

export function computeElevenlabsCost(
  input: ElevenlabsCostInput
): ElevenlabsCostResult {
  const unit = getCharPrice()
  const total = unit * input.characterCount
  return {
    costEuros: Math.round(total * 10000) / 10000,
    characterCount: input.characterCount,
  }
}
