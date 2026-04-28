// ─────────────────────────────────────────────────────────────────────────────
// Définition des plans Lynaris et leurs restrictions runtime
// 3 plans actifs : decouverte (essai), pro, custom (sur-mesure)
// `trial` est conservé pour la rétrocompatibilité avec planEnum DB
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId = "trial" | "decouverte" | "pro" | "custom"

export interface PlanLimits {
  agents: string[]          // slugs agents autorisés
  actionsPerMonth: number
  voiceMinutes: number
  teamMembers: number
  integrations: "basic" | "all"
  analytics: boolean
  crm: boolean
  automations: number       // nombre d'automatisations max
  contents: boolean
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  // Plan technique : essai 14j (créé à l'inscription via trialEndsAt)
  trial: {
    agents: ["charles", "marine", "mae", "lou", "elio", "nova", "max", "alba", "orion"],
    actionsPerMonth: 50,
    voiceMinutes: 30,
    teamMembers: 1,
    integrations: "basic",
    analytics: false,
    crm: false,
    automations: 3,
    contents: false,
  },
  // Plan Découverte = alias public de l'essai gratuit (mêmes limites)
  decouverte: {
    agents: ["charles", "marine", "mae", "lou", "elio", "nova", "max", "alba", "orion"],
    actionsPerMonth: 50,
    voiceMinutes: 30,
    teamMembers: 1,
    integrations: "basic",
    analytics: false,
    crm: false,
    automations: 3,
    contents: false,
  },
  // Plan Pro : tous les agents, 1500 actions, 300 min voix
  pro: {
    agents: ["charles", "marine", "mae", "lou", "elio", "nova", "max", "alba", "orion"],
    actionsPerMonth: 1500,
    voiceMinutes: 300,
    teamMembers: 5,
    integrations: "all",
    analytics: true,
    crm: true,
    automations: 20,
    contents: true,
  },
  // Plan Sur-mesure : volume illimité (mappé sur 'scale' en DB)
  custom: {
    agents: ["charles", "marine", "mae", "lou", "elio", "nova", "max", "alba", "orion"],
    actionsPerMonth: 999999,
    voiceMinutes: 999999,
    teamMembers: 999999,
    integrations: "all",
    analytics: true,
    crm: true,
    automations: 999999,
    contents: true,
  },
}

export const PLAN_LABELS: Record<PlanId, string> = {
  trial: "Essai gratuit",
  decouverte: "Découverte",
  pro: "Pro",
  custom: "Sur-mesure",
}

export const PLAN_COLORS: Record<PlanId, string> = {
  trial: "#71717A",
  decouverte: "#22D3EE",
  pro: "#7C3AED",
  custom: "#F59E0B",
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanId] ?? PLAN_LIMITS.trial
}

export function canUseAgent(plan: string, agentSlug: string): boolean {
  return getLimits(plan).agents.includes(agentSlug)
}

export function canUseFeature(plan: string, feature: keyof PlanLimits): boolean {
  const limits = getLimits(plan)
  const val = limits[feature]
  if (typeof val === "boolean") return val
  if (typeof val === "number") return val > 0
  return true
}

// Intégrations disponibles en plan basique (Découverte / Trial)
export const BASIC_INTEGRATIONS = [
  "google", "google_drive", "google_sheets", "google_docs", "google_meet",
  "gmail", "slack", "notion", "calendar", "zoom", "whatsapp",
]
