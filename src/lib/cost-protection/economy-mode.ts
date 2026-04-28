// ─────────────────────────────────────────────────────────────────────────────
// Mode économie — bascule modèles Anthropic moins chers
// ─────────────────────────────────────────────────────────────────────────────
//
// En mode ACTIF, à 100% du budget, les actions standard basculent sur des
// modèles moins coûteux pour préserver la marge.
//
// ⚠️ Règle : Marine reste TOUJOURS sur son modèle premium (qualité voix
// critique, pas de bascule).

import type { AgentSlug } from "@/lib/pricing/plans"

/**
 * Modèles Anthropic supportés.
 * Source : Claude API documentation.
 */
export const ANTHROPIC_MODELS = [
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
] as const
export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number]

/**
 * Mapping modèle premium → modèle économique pour bascule.
 *
 * Stratégie progressive :
 *   Opus 4.7   → Sonnet 4.6  (≈ 80% qualité, 20% du coût)
 *   Opus 4.6   → Sonnet 4.6  (idem)
 *   Sonnet 4.6 → Haiku 4.5   (≈ 60% qualité, 25% du coût Sonnet)
 *   Haiku 4.5  → Haiku 4.5   (déjà le moins cher)
 */
export const ECONOMY_MODE_FALLBACK: Readonly<Record<AnthropicModel, AnthropicModel>> = {
  "claude-opus-4-7":           "claude-sonnet-4-6",
  "claude-opus-4-6":           "claude-sonnet-4-6",
  "claude-sonnet-4-6":         "claude-haiku-4-5-20251001",
  "claude-haiku-4-5-20251001": "claude-haiku-4-5-20251001",
} as const

/**
 * Agents protégés contre toute bascule modèle (qualité critique).
 */
const NO_ECONOMY_AGENTS: ReadonlySet<AgentSlug> = new Set<AgentSlug>([
  "marine", // qualité voix critique sur appels entrants
])

/**
 * Retourne le modèle effectif à utiliser selon l'agent et le mode.
 *
 * @param agent       agent appelant
 * @param baseModel   modèle nominal de l'agent (cf. AGENTS.md)
 * @param economyMode true si l'org est en mode économie (100% budget en mode ACTIF)
 */
export function resolveModel(
  agent: AgentSlug,
  baseModel: AnthropicModel,
  economyMode: boolean
): AnthropicModel {
  // Marine : pas de bascule, toujours qualité maximale
  if (NO_ECONOMY_AGENTS.has(agent)) return baseModel
  if (!economyMode) return baseModel
  return ECONOMY_MODE_FALLBACK[baseModel]
}

/**
 * Indique si l'agent peut bénéficier d'une bascule modèle économique.
 */
export function canSwitchToEconomy(agent: AgentSlug): boolean {
  return !NO_ECONOMY_AGENTS.has(agent)
}
