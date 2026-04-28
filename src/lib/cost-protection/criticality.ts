// ─────────────────────────────────────────────────────────────────────────────
// Criticité des actions agent — pour mode ACTIF (hard cap sélectif)
// ─────────────────────────────────────────────────────────────────────────────
//
// En mode ACTIF, à 130% du budget on bloque les actions non critiques.
// Cette matrice définit ce qui est critique (toujours autorisé) vs optionnel
// (bloqué en hard cap).
//
// ⚠️ Règle absolue : MARINE NE DOIT JAMAIS ÊTRE BLOQUÉE sur appel entrant,
// même en hard cap. C'est une réception téléphonique business-critique.

import type { AgentSlug } from "@/lib/pricing/plans"

export const CRITICALITY_LEVELS = ["critical", "standard", "optional"] as const
export type CriticalityLevel = (typeof CRITICALITY_LEVELS)[number]

/**
 * Type d'action pour la matrice de criticité.
 *
 * - `voice_inbound`  : appel entrant Marine (toujours critical)
 * - `voice_outbound` : appel sortant Marine (critical pour rappels qualifiés)
 * - `chat`           : conversation chat agent (standard)
 * - `email_send`     : envoi email Mae/Elio (standard)
 * - `content_gen`    : génération contenu Lou (standard)
 * - `image_gen`      : génération image Max (optional)
 * - `video_gen`      : génération vidéo Max (optional)
 * - `automation`     : workflow Orion (optional)
 * - `analysis`       : analyse Nova (standard)
 * - `internal`       : tâche interne Charles (orchestration) (standard)
 */
export const ACTION_TYPES = [
  "voice_inbound",
  "voice_outbound",
  "chat",
  "email_send",
  "content_gen",
  "image_gen",
  "video_gen",
  "automation",
  "analysis",
  "internal",
] as const
export type ActionType = (typeof ACTION_TYPES)[number]

/**
 * Matrice agent × type d'action → criticité.
 *
 * Lecture : critical | standard | optional
 *
 * En mode ACTIF :
 * - critical : jamais bloqué, jamais bascule éco (qualité maximale)
 * - standard : bascule éco à 100% (modèle moins cher), bloqué à 130%
 * - optional : bascule éco à 100%, bloqué dès 100% si dépassement
 */
const CRITICALITY_MATRIX: Readonly<
  Record<AgentSlug, Partial<Record<ActionType, CriticalityLevel>>>
> = {
  // Marine : voice toujours critical (réception téléphonique business-critique)
  marine: {
    voice_inbound: "critical",
    voice_outbound: "critical",
    chat: "standard",
    internal: "standard",
  },
  // Charles : orchestrateur, standard partout
  charles: {
    chat: "standard",
    internal: "standard",
    automation: "standard",
  },
  // Lou : contenu — non critique
  lou: {
    chat: "standard",
    content_gen: "standard",
  },
  // Elio : prospection — standard (pipeline commercial)
  elio: {
    chat: "standard",
    email_send: "standard",
    analysis: "standard",
  },
  // Mae : email — standard
  mae: {
    chat: "standard",
    email_send: "standard",
  },
  // Max : photo/vidéo — optional (luxe, pas business-critique)
  max: {
    chat: "standard",
    image_gen: "optional",
    video_gen: "optional",
  },
  // Nova : business intelligence — standard
  nova: {
    chat: "standard",
    analysis: "standard",
  },
  // Alba : RH — standard
  alba: {
    chat: "standard",
    email_send: "standard",
    analysis: "standard",
  },
  // Orion : automatisation — optional (l'utilisateur peut attendre)
  orion: {
    chat: "standard",
    automation: "optional",
  },
} as const

/**
 * Retourne la criticité d'une action agent.
 * Fallback "standard" si la combinaison n'est pas explicitement définie.
 */
export function getCriticality(
  agent: AgentSlug,
  action: ActionType
): CriticalityLevel {
  return CRITICALITY_MATRIX[agent]?.[action] ?? "standard"
}

/**
 * Indique si une action peut continuer même en hard cap (130% budget).
 * Seules les actions `critical` passent.
 */
export function isCriticalAction(
  agent: AgentSlug,
  action: ActionType
): boolean {
  return getCriticality(agent, action) === "critical"
}

/**
 * Indique si une action peut continuer en mode économie (entre 100% et 130%).
 * `critical` et `standard` passent (mais `standard` peut basculer modèle éco).
 * `optional` est bloqué dès 100%.
 */
export function isAllowedInEconomyMode(
  agent: AgentSlug,
  action: ActionType
): boolean {
  const level = getCriticality(agent, action)
  return level === "critical" || level === "standard"
}
