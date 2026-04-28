// ─────────────────────────────────────────────────────────────────────────────
// Calculateur de coût Twilio — voix FR + SMS
// ─────────────────────────────────────────────────────────────────────────────

function envFloat(key: string, fallback: number): number {
  const raw = process.env[key]
  if (typeof raw !== "string") return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const TWILIO_OPERATIONS = [
  "voice_inbound_fr",
  "voice_outbound_fr",
  "sms",
] as const
export type TwilioOperation = (typeof TWILIO_OPERATIONS)[number]

/**
 * Tarifs (€ HT par minute pour voix, par SMS pour sms).
 *
 * Sources publiques (avr. 2026) :
 *   Voix FR entrante  : ≈ 0.0145 €/min
 *   Voix FR sortante  : ≈ 0.030 €/min
 *   SMS FR            : ≈ 0.045 € par SMS
 */
function getTwilioPricing(operation: TwilioOperation): number {
  switch (operation) {
    case "voice_inbound_fr":  return envFloat("TWILIO_PRICE_VOICE_INBOUND_FR", 0.014)
    case "voice_outbound_fr": return envFloat("TWILIO_PRICE_VOICE_OUTBOUND_FR", 0.030)
    case "sms":               return envFloat("TWILIO_PRICE_SMS", 0.045)
  }
}

export interface TwilioVoiceCostInput {
  readonly type: "voice_inbound_fr" | "voice_outbound_fr"
  readonly durationSeconds: number
}

export interface TwilioSmsCostInput {
  readonly type: "sms"
  readonly count?: number
}

export type TwilioCostInput = TwilioVoiceCostInput | TwilioSmsCostInput

export interface TwilioCostResult {
  readonly costEuros: number
  readonly operation: TwilioOperation
}

/**
 * Calcule le coût d'une opération Twilio en euros HT.
 * Pour voix : facturation à la minute, arrondi au-dessus (industry standard).
 */
export function computeTwilioCost(input: TwilioCostInput): TwilioCostResult {
  if (input.type === "sms") {
    const count = input.count ?? 1
    const unit = getTwilioPricing("sms")
    return {
      costEuros: Math.round(unit * count * 10000) / 10000,
      operation: "sms",
    }
  }
  // Voix : conversion sec → min, arrondi au-dessus
  const minutes = Math.ceil(input.durationSeconds / 60)
  const unit = getTwilioPricing(input.type)
  const total = unit * minutes
  return {
    costEuros: Math.round(total * 10000) / 10000,
    operation: input.type,
  }
}
