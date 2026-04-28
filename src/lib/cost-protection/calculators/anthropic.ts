// ─────────────────────────────────────────────────────────────────────────────
// Calculateur de coût Anthropic — Claude API
// ─────────────────────────────────────────────────────────────────────────────
//
// Tarifs lus depuis process.env (mise à jour sans redéploiement).
// Voir .env.example pour les valeurs nominales.

import type { AnthropicModel } from "../economy-mode"

/**
 * Lit un tarif env (en €/1M tokens) avec fallback. Jamais NaN.
 */
function envFloat(key: string, fallback: number): number {
  const raw = process.env[key]
  if (typeof raw !== "string") return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Tarifs par modèle (€ HT par 1M tokens).
 * Lecture dynamique via process.env, fallback sur valeurs publiques Anthropic.
 *
 * Sources publiques (avr. 2026) :
 *   Opus 4.x   : 14 € input / 70 € output (≈ $15 / $75)
 *   Sonnet 4.6 : 2.8 € input / 14 € output (≈ $3 / $15)
 *   Haiku 4.5  : 0.7 € input / 3.5 € output (≈ $0.80 / $4)
 */
function getModelPricing(model: AnthropicModel): {
  inputPerM: number
  outputPerM: number
} {
  if (model === "claude-opus-4-7" || model === "claude-opus-4-6") {
    return {
      inputPerM: envFloat("ANTHROPIC_PRICE_OPUS_INPUT_PER_M", 14),
      outputPerM: envFloat("ANTHROPIC_PRICE_OPUS_OUTPUT_PER_M", 70),
    }
  }
  if (model === "claude-sonnet-4-6") {
    return {
      inputPerM: envFloat("ANTHROPIC_PRICE_SONNET_INPUT_PER_M", 2.8),
      outputPerM: envFloat("ANTHROPIC_PRICE_SONNET_OUTPUT_PER_M", 14),
    }
  }
  // Haiku 4.5
  return {
    inputPerM: envFloat("ANTHROPIC_PRICE_HAIKU_INPUT_PER_M", 0.7),
    outputPerM: envFloat("ANTHROPIC_PRICE_HAIKU_OUTPUT_PER_M", 3.5),
  }
}

export interface AnthropicCostInput {
  readonly model: AnthropicModel
  readonly inputTokens: number
  readonly outputTokens: number
}

export interface AnthropicCostResult {
  readonly costEuros: number
  readonly inputCostEuros: number
  readonly outputCostEuros: number
  readonly model: AnthropicModel
}

/**
 * Calcule le coût d'un appel Claude API en euros HT.
 * Précision 4 décimales (suffisant pour micro-coûts).
 */
export function computeAnthropicCost(
  input: AnthropicCostInput
): AnthropicCostResult {
  const pricing = getModelPricing(input.model)
  const inputCost = (input.inputTokens / 1_000_000) * pricing.inputPerM
  const outputCost = (input.outputTokens / 1_000_000) * pricing.outputPerM
  const total = inputCost + outputCost
  return {
    costEuros: round4(total),
    inputCostEuros: round4(inputCost),
    outputCostEuros: round4(outputCost),
    model: input.model,
  }
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
