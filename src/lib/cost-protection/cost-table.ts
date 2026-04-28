// ─────────────────────────────────────────────────────────────────────────────
// Cost table — point d'entrée unique pour calculer le coût d'une action
// ─────────────────────────────────────────────────────────────────────────────
//
// Délègue aux calculateurs par provider et retourne un résultat normalisé
// destiné à être inséré dans `usage_costs` via le service cost-protection.

import {
  computeAnthropicCost,
  type AnthropicCostInput,
} from "./calculators/anthropic"
import {
  computeReplicateCost,
  type ReplicateCostInput,
} from "./calculators/replicate"
import {
  computeTwilioCost,
  type TwilioCostInput,
} from "./calculators/twilio"
import {
  computeElevenlabsCost,
  type ElevenlabsCostInput,
} from "./calculators/elevenlabs"
import {
  computeDeepgramCost,
  type DeepgramCostInput,
} from "./calculators/deepgram"

export const COST_PROVIDERS = [
  "anthropic",
  "replicate",
  "twilio",
  "elevenlabs",
  "deepgram",
] as const
export type CostProvider = (typeof COST_PROVIDERS)[number]

// ─── Discriminated union : 1 type par provider ──────────────────────────────

export type ComputeCostInput =
  | { readonly provider: "anthropic" } & AnthropicCostInput
  | { readonly provider: "replicate" } & ReplicateCostInput
  | { readonly provider: "twilio" } & TwilioCostInput
  | { readonly provider: "elevenlabs" } & ElevenlabsCostInput
  | { readonly provider: "deepgram" } & DeepgramCostInput

export interface NormalizedCost {
  readonly provider: CostProvider
  readonly costEuros: number
  /** Détails techniques pour audit (modèle, tokens, durée, etc.) */
  readonly details: {
    readonly modelUsed?: string
    readonly inputTokens?: number
    readonly outputTokens?: number
    readonly durationSeconds?: number
  }
}

/**
 * Calcule le coût d'une opération en euros HT, normalisé pour insertion
 * dans `usage_costs`.
 *
 * Pattern discriminated union : TS infère automatiquement les champs requis
 * selon `provider`. Aucun any, aucun cast.
 */
export function computeCost(input: ComputeCostInput): NormalizedCost {
  if (input.provider === "anthropic") {
    const r = computeAnthropicCost(input)
    return {
      provider: "anthropic",
      costEuros: r.costEuros,
      details: {
        modelUsed: r.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
      },
    }
  }
  if (input.provider === "replicate") {
    const r = computeReplicateCost(input)
    return {
      provider: "replicate",
      costEuros: r.costEuros,
      details: { modelUsed: r.model },
    }
  }
  if (input.provider === "twilio") {
    const r = computeTwilioCost(input)
    const durationSeconds =
      input.type === "sms" ? undefined : input.durationSeconds
    return {
      provider: "twilio",
      costEuros: r.costEuros,
      details: {
        modelUsed: r.operation,
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      },
    }
  }
  if (input.provider === "elevenlabs") {
    const r = computeElevenlabsCost(input)
    return {
      provider: "elevenlabs",
      costEuros: r.costEuros,
      details: {},
    }
  }
  // deepgram (dernier cas du discriminated union)
  const r = computeDeepgramCost(input)
  return {
    provider: "deepgram",
    costEuros: r.costEuros,
    details: { durationSeconds: r.durationSeconds },
  }
}
