// ─────────────────────────────────────────────────────────────────────────────
// Permissions par plan — gating fonctionnel
// ─────────────────────────────────────────────────────────────────────────────
//
// Centralise toutes les vérifications d'accès liées au plan. Appelé par :
// - Les API routes (agents/chat, agents/run, voice/stream, etc.)
// - Le service usage tracking (consumeAction, consumeVoiceMinutes)
// - L'UI dashboard (suggestion d'upgrade)
//
// Pattern Result<T, E> : aucune fonction ne throw. Toutes retournent
// `AccessResult` que l'appelant inspecte.

import type { AgentSlug, PlanId } from "./plans"
import { PLANS, getNextPlan } from "./plans"

// ─── Types ───────────────────────────────────────────────────────────────────

export type AccessResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false
      readonly reason: string
      readonly upgradeTo: PlanId
    }

// ─── Helpers internes ────────────────────────────────────────────────────────

const allow = (): AccessResult => ({ allowed: true })

const deny = (reason: string, upgradeTo: PlanId): AccessResult => ({
  allowed: false,
  reason,
  upgradeTo,
})

// ─── Vérifications par feature ───────────────────────────────────────────────

/**
 * Vérifie si un agent est accessible pour un plan donné.
 *
 * - discovery : tous (essai gratuit)
 * - starter   : 3 au choix dans `selectedAgents`, JAMAIS Marine
 * - pro       : tous les 9
 * - business  : tous + 1 custom
 * - custom    : agent dédié + tous
 *
 * @param selectedAgents Liste des agents déjà sélectionnés/activés par l'org.
 *   Utilisé uniquement pour Starter (limite de 3). Si l'agent demandé est
 *   déjà dans la liste, il est autorisé sans incrémenter le compteur.
 */
export function canUseAgent(
  planId: PlanId,
  agent: AgentSlug,
  selectedAgents: readonly AgentSlug[] = []
): AccessResult {
  const plan = PLANS[planId]

  if (plan.features.agentsAccess === "trial_all") return allow()

  if (plan.features.agentsAccess === "limited_3") {
    if (agent === "marine") {
      return deny(
        "Marine nécessite le plan Pro ou supérieur",
        "pro"
      )
    }
    if (!selectedAgents.includes(agent) && selectedAgents.length >= 3) {
      return deny(
        "Limite de 3 agents atteinte sur Starter",
        "pro"
      )
    }
    return allow()
  }

  // pro / business / custom : tous les agents disponibles
  return allow()
}

/**
 * Vérifie si l'org peut ajouter un nouveau membre équipe.
 */
export function canAddTeamMember(
  planId: PlanId,
  currentCount: number
): AccessResult {
  const limit = PLANS[planId].features.teamMembers
  if (limit === -1) return allow()
  if (currentCount >= limit) {
    return deny(
      `Limite de ${limit} membre${limit > 1 ? "s" : ""} atteinte`,
      getNextPlan(planId)
    )
  }
  return allow()
}

/**
 * Vérifie si l'org peut consommer X minutes de voix Marine.
 *
 * Cas particulier Starter : `marineVoiceMinutes === 0` → Marine n'est pas
 * incluse dans le plan, mais l'option "Pack voix 200 min — 99€" est
 * disponible (cf. `marineVoiceOption`). On refuse l'usage gratuit ici ;
 * la consommation via pack est gérée par le service usage qui décrémente
 * un solde séparé.
 */
export function canConsumeVoiceMinutes(
  planId: PlanId,
  usedMinutes: number,
  requestedMinutes: number
): AccessResult {
  const f = PLANS[planId].features
  if (f.marineVoiceMinutes === -1) return allow()
  if (f.marineVoiceMinutes === 0) {
    return deny(
      "Marine n'est pas incluse dans Starter (option Pack voix 200 min — 99€ disponible)",
      "pro"
    )
  }
  if (usedMinutes + requestedMinutes > f.marineVoiceMinutes) {
    return deny(
      "Quota voix Marine mensuel dépassé",
      getNextPlan(planId)
    )
  }
  return allow()
}

/**
 * Vérifie si l'org peut consommer N actions agent.
 */
export function canConsumeActions(
  planId: PlanId,
  usedActions: number,
  requestedActions = 1
): AccessResult {
  const limit = PLANS[planId].features.monthlyActions
  if (limit === -1) return allow()
  if (usedActions + requestedActions > limit) {
    return deny(
      "Quota mensuel d'actions atteint",
      getNextPlan(planId)
    )
  }
  return allow()
}

/**
 * Vérifie si une intégration est disponible sur le plan.
 * Utilisé par /api/integrations/[provider]/connect.
 */
export function canUseIntegration(
  planId: PlanId,
  integration: string
): AccessResult {
  const integrations = PLANS[planId].features.integrations
  if (integrations.includes(integration)) return allow()

  // Suggestion d'upgrade : on cherche le premier plan qui inclut l'intégration
  const order: readonly PlanId[] = ["discovery", "starter", "pro", "business", "custom"]
  const currentIdx = order.indexOf(planId)
  for (let i = currentIdx + 1; i < order.length; i++) {
    const next = order[i]
    if (next && PLANS[next].features.integrations.includes(integration)) {
      return deny(
        `Intégration ${integration} non disponible sur ce plan`,
        next
      )
    }
  }
  // Aucun plan ne propose cette intégration — fallback custom
  return deny(
    `Intégration ${integration} non disponible — contactez-nous pour Sur-mesure`,
    "custom"
  )
}

/**
 * Vérifie si l'org peut ajouter un document à la knowledge base.
 */
export function canAddRagDoc(
  planId: PlanId,
  currentCount: number
): AccessResult {
  const limit = PLANS[planId].features.ragMaxDocs
  if (limit === -1) return allow()
  if (limit === 0) {
    return deny(
      "Knowledge base non disponible sur ce plan",
      "starter"
    )
  }
  if (currentCount >= limit) {
    return deny(
      `Limite de ${limit.toLocaleString("fr-FR")} documents atteinte`,
      getNextPlan(planId)
    )
  }
  return allow()
}

/**
 * Vérifie si l'org peut créer un agent custom.
 *
 * - 0 : pas de custom (Découverte, Starter, Pro)
 * - N (>0) : N agents custom max (Business : 1)
 * - -1 : illimité (Sur-mesure)
 */
export function canRequestCustomAgent(
  planId: PlanId,
  currentCustomCount = 0
): AccessResult {
  const limit = PLANS[planId].features.customAgentIncluded
  if (limit === -1) return allow()
  if (limit === 0) {
    return deny(
      "Agent custom disponible à partir de Business",
      "business"
    )
  }
  if (currentCustomCount >= limit) {
    return deny(
      `Limite de ${limit} agent${limit > 1 ? "s" : ""} custom atteinte`,
      "custom"
    )
  }
  return allow()
}

/**
 * Helper agrégé : vérifie qu'une feature est disponible sur le plan.
 * Utile pour l'UI dashboard (afficher/masquer des sections).
 */
export function hasFeature(
  planId: PlanId,
  feature: "voice_marine" | "rag" | "custom_agent" | "uptime_sla"
): boolean {
  const f = PLANS[planId].features
  switch (feature) {
    case "voice_marine":  return f.marineVoiceMinutes !== 0
    case "rag":           return f.ragMaxDocs !== 0
    case "custom_agent":  return f.customAgentIncluded !== 0
    case "uptime_sla":    return f.uptimeSla !== null
  }
}
