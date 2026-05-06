// ─────────────────────────────────────────────────────────────────────────────
// Plans Lynaris — Source de vérité pricing
// 5 paliers : Découverte (essai 14j) / Starter / Pro ⭐ / Business / Sur-mesure
// ─────────────────────────────────────────────────────────────────────────────
//
// Nouveaux PlanId UI : discovery / starter / pro / business / custom
//
// Cohérence DB : l'enum Postgres `plan` (src/lib/db/schema.ts) sera étendu
// à l'étape 3 (`feat(db): tables pricing, usage tracking et cost-protection`)
// pour ajouter `discovery` et `business`. Mapping legacy géré dans le webhook
// Stripe (étape 9).
//
// Stripe : `stripeProductId` et `stripePriceId*` sont lus depuis `process.env`.
// Voir `.env.example` + `docs/internal/stripe-setup.md` (étape 17) pour la
// liste complète des variables et la procédure de création manuelle.

import { z } from "zod"

// ─── Identifiants plans (UI) ─────────────────────────────────────────────────

export const PLAN_IDS = ["discovery", "starter", "pro", "business", "custom"] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const planSchema = z.enum(PLAN_IDS)

// ─── Agents disponibles ──────────────────────────────────────────────────────

export const AGENT_SLUGS = [
  "marine",
  "charles",
  "lou",
  "elio",
  "mae",
  "max",
  "nova",
  "alba",
] as const
export type AgentSlug = (typeof AGENT_SLUGS)[number]

// ─── Énumérations features ───────────────────────────────────────────────────

export const AGENT_ACCESS_TIERS = [
  "trial_all",            // Découverte : tous (essai 14j)
  "limited_3",            // Starter : 3 au choix, sans Marine
  "all",                  // Pro : tous les 9
  "all_plus_custom",      // Business : tous + 1 custom
  "all_plus_dedicated",   // Sur-mesure : agent dédié + tous
] as const
export type AgentAccessTier = (typeof AGENT_ACCESS_TIERS)[number]

export const TWILIO_NUMBER_TIERS = [
  "mutualized",      // Découverte : numéro mutualisé essai
  "shared",          // Pro : numéro FR partagé
  "dedicated_fr",    // Business : numéro FR dédié
  "multi_intl",      // Sur-mesure : multi-numéros + international
] as const
export type TwilioNumberTier = (typeof TWILIO_NUMBER_TIERS)[number]

export const ELEVENLABS_VOICE_TIERS = [
  "standard",
  "premium_fr",
  "custom",
  "multi_custom",
] as const
export type ElevenlabsVoiceTier = (typeof ELEVENLABS_VOICE_TIERS)[number]

export const SUPPORT_SLA_TIERS = [
  "email_j1",            // Découverte / Starter
  "email_j1_priority",   // Pro
  "slack_j0",            // Business
  "manager_7d",          // Sur-mesure
] as const
export type SupportSlaTier = (typeof SUPPORT_SLA_TIERS)[number]

export const ONBOARDING_TYPES = [
  "video_tutorial",
  "visio_1h",
  "visio_2h",
  "team_training_30d",
] as const
export type OnboardingType = (typeof ONBOARDING_TYPES)[number]

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlanFeatures = {
  readonly agentsAccess: AgentAccessTier
  /** Nombre max d'agents activables. "all" = pas de limite. */
  readonly maxAgents: number | "all"
  /** Minutes Marine incluses/mois. 0 = pas inclus. -1 = illimité. */
  readonly marineVoiceMinutes: number
  /** Option Marine packagée (recharge). */
  readonly marineVoiceOption: {
    readonly available: boolean
    readonly pricePerPack?: number
    readonly minutesPerPack?: number
  }
  /** Actions agent par mois. -1 = illimité. */
  readonly monthlyActions: number
  readonly twilioNumber: TwilioNumberTier | null
  readonly elevenlabsVoice: ElevenlabsVoiceTier
  /** Documents knowledge base RAG max. -1 = illimité, 0 = non disponible. */
  readonly ragMaxDocs: number
  /** Membres équipe max. -1 = illimité. */
  readonly teamMembers: number
  readonly integrations: readonly string[]
  readonly supportSla: SupportSlaTier
  readonly uptimeSla: 99 | 99.5 | 99.9 | null
  readonly onboardingType: OnboardingType
  /** Agents custom inclus. 0 = aucun, -1 = illimité. */
  readonly customAgentIncluded: number
}

export type Plan = {
  readonly id: PlanId
  readonly name: string
  readonly tagline: string
  /** Prix mensuel HT en euros. null = sur devis. */
  readonly priceMonthly: number | null
  /** Prix mensualisé sur engagement annuel HT. null = pas applicable. */
  readonly priceAnnualMonthly: number | null
  /** Frais de mise en service unique HT, payés au premier checkout. */
  readonly setupFee: number
  /** Pour Sur-mesure : prix de départ affiché ("À partir de X€"). null sinon. */
  readonly setupFeeMin: number | null
  /** Engagement minimum en mois. 0 = aucun engagement. */
  readonly minCommitmentMonths: number
  /** Durée d'essai gratuit en jours. 0 = pas d'essai. */
  readonly trialDays: number
  /** Plan mis en avant (badge "Recommandé"). Un seul à la fois. */
  readonly featured: boolean
  readonly stripeProductId: string | null
  readonly stripePriceIdMonthly: string | null
  readonly stripePriceIdAnnual: string | null
  /** Stripe price ID one-shot pour les frais setup. null si setupFee = 0. */
  readonly stripePriceIdSetup: string | null
  readonly features: PlanFeatures
  readonly cta: {
    readonly label: string
    readonly href: string
  }
}

// ─── Helpers internes ────────────────────────────────────────────────────────

/** Lit une variable d'env Stripe ou retourne null. Jamais de string vide. */
function envOrNull(key: string): string | null {
  const v = process.env[key]
  if (typeof v !== "string") return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

// ─── Listes d'intégrations par tier ──────────────────────────────────────────

const STARTER_INTEGRATIONS = [
  "google_calendar",
  "gmail",
  "google_drive",
] as const

const PRO_INTEGRATIONS = [
  "google_calendar",
  "gmail",
  "google_drive",
  "stripe",
  "n8n",
  "make",
] as const

const BUSINESS_INTEGRATIONS = [
  ...PRO_INTEGRATIONS,
  "whatsapp_business",
  "pipedream",
] as const

const CUSTOM_INTEGRATIONS = [
  ...BUSINESS_INTEGRATIONS,
  "private_api",
  "custom_erp",
  "custom_crm",
] as const

// ─── Définition des plans ────────────────────────────────────────────────────

const DISCOVERY: Plan = {
  id: "discovery",
  name: "Découverte",
  tagline: "Essai gratuit 14 jours, sans CB, sans engagement",
  priceMonthly: 0,
  priceAnnualMonthly: 0,
  setupFee: 0,
  setupFeeMin: null,
  minCommitmentMonths: 0,
  trialDays: 14,
  featured: false,
  stripeProductId: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  stripePriceIdSetup: null,
  features: {
    agentsAccess: "trial_all",
    maxAgents: "all",
    marineVoiceMinutes: 30,
    marineVoiceOption: { available: false },
    monthlyActions: 50,
    twilioNumber: "mutualized",
    elevenlabsVoice: "standard",
    ragMaxDocs: 0,
    teamMembers: 1,
    integrations: ["google_calendar"],
    supportSla: "email_j1",
    uptimeSla: null,
    onboardingType: "video_tutorial",
    customAgentIncluded: 0,
  },
  cta: { label: "Commencer gratuitement", href: "/signup" },
}

const STARTER: Plan = {
  id: "starter",
  name: "Starter",
  tagline: "3 agents au choix (hors Marine), volume confortable",
  priceMonthly: 149,
  priceAnnualMonthly: 127,
  setupFee: 0,
  setupFeeMin: null,
  minCommitmentMonths: 0,
  trialDays: 0,
  featured: false,
  stripeProductId: envOrNull("STRIPE_PRODUCT_STARTER"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_STARTER_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_STARTER_ANNUAL"),
  stripePriceIdSetup: null,
  features: {
    agentsAccess: "limited_3",
    maxAgents: 3,
    marineVoiceMinutes: 0,
    marineVoiceOption: { available: true, pricePerPack: 99, minutesPerPack: 200 },
    monthlyActions: 1200,
    twilioNumber: null,
    elevenlabsVoice: "standard",
    ragMaxDocs: 250,
    teamMembers: 1,
    integrations: [...STARTER_INTEGRATIONS],
    supportSla: "email_j1",
    uptimeSla: null,
    onboardingType: "video_tutorial",
    customAgentIncluded: 0,
  },
  cta: { label: "Démarrer Starter", href: "/signup?plan=starter" },
}

const PRO: Plan = {
  id: "pro",
  name: "Pro",
  tagline: "Tous les agents, volume premium, intégrations clés",
  priceMonthly: 449,
  priceAnnualMonthly: 382,
  setupFee: 290,
  setupFeeMin: null,
  minCommitmentMonths: 0,
  trialDays: 0,
  featured: true,
  stripeProductId: envOrNull("STRIPE_PRODUCT_PRO"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_PRO_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_PRO_ANNUAL"),
  stripePriceIdSetup: envOrNull("STRIPE_PRICE_PRO_SETUP"),
  features: {
    agentsAccess: "all",
    maxAgents: "all",
    marineVoiceMinutes: 400,
    marineVoiceOption: { available: false },
    monthlyActions: 4000,
    twilioNumber: "shared",
    elevenlabsVoice: "premium_fr",
    ragMaxDocs: 2000,
    teamMembers: 3,
    integrations: [...PRO_INTEGRATIONS],
    supportSla: "email_j1_priority",
    uptimeSla: 99,
    onboardingType: "visio_1h",
    customAgentIncluded: 0,
  },
  cta: { label: "Démarrer Pro", href: "/signup?plan=pro" },
}

const BUSINESS: Plan = {
  id: "business",
  name: "Business",
  tagline: "Tous les agents + 1 custom, numéro dédié, support J+0",
  priceMonthly: 1190,
  priceAnnualMonthly: 1012,
  setupFee: 690,
  setupFeeMin: null,
  minCommitmentMonths: 0,
  trialDays: 0,
  featured: false,
  stripeProductId: envOrNull("STRIPE_PRODUCT_BUSINESS"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_BUSINESS_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_BUSINESS_ANNUAL"),
  stripePriceIdSetup: envOrNull("STRIPE_PRICE_BUSINESS_SETUP"),
  features: {
    agentsAccess: "all_plus_custom",
    maxAgents: "all",
    marineVoiceMinutes: 1500,
    marineVoiceOption: { available: false },
    monthlyActions: 12000,
    twilioNumber: "dedicated_fr",
    elevenlabsVoice: "custom",
    ragMaxDocs: 10000,
    teamMembers: 8,
    integrations: [...BUSINESS_INTEGRATIONS],
    supportSla: "slack_j0",
    uptimeSla: 99.5,
    onboardingType: "visio_2h",
    customAgentIncluded: 1,
  },
  cta: { label: "Choisir Business", href: "/signup?plan=business" },
}

const CUSTOM: Plan = {
  id: "custom",
  name: "Sur-mesure",
  tagline: "Agent dédié, configuré pour ton secteur, opérationnel en 48h",
  priceMonthly: null,
  priceAnnualMonthly: null,
  setupFee: 2900,
  setupFeeMin: 2900,
  minCommitmentMonths: 12,
  trialDays: 0,
  featured: false,
  stripeProductId: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  stripePriceIdSetup: null,
  features: {
    agentsAccess: "all_plus_dedicated",
    maxAgents: "all",
    marineVoiceMinutes: -1,
    marineVoiceOption: { available: false },
    monthlyActions: -1,
    twilioNumber: "multi_intl",
    elevenlabsVoice: "multi_custom",
    ragMaxDocs: -1,
    teamMembers: -1,
    integrations: [...CUSTOM_INTEGRATIONS],
    supportSla: "manager_7d",
    uptimeSla: 99.9,
    onboardingType: "team_training_30d",
    customAgentIncluded: -1,
  },
  cta: { label: "Réserver une démo", href: "/contact" },
}

// ─── Exports : Record + array ────────────────────────────────────────────────

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  discovery: DISCOVERY,
  starter: STARTER,
  pro: PRO,
  business: BUSINESS,
  custom: CUSTOM,
} as const

/**
 * Liste ordonnée des plans pour l'affichage UI (5 cards de gauche à droite).
 * L'ordre est aussi celui de la progression d'upgrade.
 */
export const PLAN_LIST: readonly Plan[] = [
  DISCOVERY,
  STARTER,
  PRO,
  BUSINESS,
  CUSTOM,
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPlan(id: PlanId): Plan {
  return PLANS[id]
}

export function getFeaturedPlan(): Plan {
  return PLANS.pro
}

export function isCustomPlan(id: PlanId): boolean {
  return id === "custom"
}

export function isFreePlan(id: PlanId): boolean {
  return id === "discovery"
}

export function isPaidPlan(id: PlanId): boolean {
  return id !== "discovery"
}

export function allPaidPlans(): readonly Plan[] {
  return PLAN_LIST.filter((p) => isPaidPlan(p.id))
}

/**
 * Retourne le plan supérieur pour une suggestion d'upgrade.
 * `custom` n'a pas de successeur (retourne `custom`).
 */
export function getNextPlan(id: PlanId): PlanId {
  const order: readonly PlanId[] = ["discovery", "starter", "pro", "business", "custom"]
  const idx = order.indexOf(id)
  if (idx === -1 || idx >= order.length - 1) return "custom"
  return order[idx + 1] ?? "custom"
}

/**
 * Badge affiché sur la card du plan (ex: "Recommandé"). null si pas de badge.
 */
export function getPlanBadge(plan: Plan): string | null {
  if (plan.featured) return "Recommandé"
  return null
}

/**
 * Génère la liste textuelle des features d'un plan, formatée pour l'UI
 * (cards tarifs, dashboard billing). Exhaustif et stable.
 */
export function getFeatureList(plan: Plan): readonly string[] {
  const f = plan.features
  const items: string[] = []

  // Agents
  switch (f.agentsAccess) {
    case "trial_all":           items.push("Accès à tous les agents (essai)"); break
    case "limited_3":           items.push("3 agents au choix (hors Marine)"); break
    case "all":                 items.push("Tous les agents Lynaris"); break
    case "all_plus_custom":     items.push("Tous les agents + 1 agent custom"); break
    case "all_plus_dedicated":  items.push("Agent dédié configuré pour ton secteur + tous les agents"); break
  }

  // Marine voice
  if (f.marineVoiceMinutes === -1) {
    items.push("Marine illimitée")
  } else if (f.marineVoiceMinutes === 0 && f.marineVoiceOption.available) {
    const pack = f.marineVoiceOption
    items.push(`Marine en option (${pack.minutesPerPack} min — ${pack.pricePerPack} €/recharge)`)
  } else if (f.marineVoiceMinutes > 0) {
    items.push(`${f.marineVoiceMinutes.toLocaleString("fr-FR")} minutes voix / mois`)
  }

  // Actions
  if (f.monthlyActions === -1) {
    items.push("Actions illimitées")
  } else {
    items.push(`${f.monthlyActions.toLocaleString("fr-FR")} actions / mois`)
  }

  // Twilio
  if (f.twilioNumber === "mutualized")    items.push("Numéro Twilio mutualisé")
  else if (f.twilioNumber === "shared")        items.push("Numéro Twilio FR partagé")
  else if (f.twilioNumber === "dedicated_fr")  items.push("Numéro Twilio FR dédié")
  else if (f.twilioNumber === "multi_intl")    items.push("Multi-numéros + international")

  // ElevenLabs
  if (f.elevenlabsVoice === "standard")          items.push("Voix ElevenLabs standard")
  else if (f.elevenlabsVoice === "premium_fr")   items.push("Voix ElevenLabs premium FR")
  else if (f.elevenlabsVoice === "custom")       items.push("Voix ElevenLabs custom (clonage)")
  else if (f.elevenlabsVoice === "multi_custom") items.push("Plusieurs voix custom")

  // RAG
  if (f.ragMaxDocs === -1) {
    items.push("Knowledge base illimitée")
  } else if (f.ragMaxDocs > 0) {
    items.push(`${f.ragMaxDocs.toLocaleString("fr-FR")} documents RAG`)
  }

  // Team members
  if (f.teamMembers === -1) {
    items.push("Membres équipe illimités")
  } else if (f.teamMembers === 1) {
    items.push("1 membre")
  } else {
    items.push(`${f.teamMembers} membres équipe`)
  }

  // Support
  switch (f.supportSla) {
    case "email_j1":            items.push("Support email J+1"); break
    case "email_j1_priority":   items.push("Support email prioritaire J+1"); break
    case "slack_j0":            items.push("Support Slack/WhatsApp J+0"); break
    case "manager_7d":          items.push("Manager de compte dédié 7j/7"); break
  }

  // SLA uptime
  if (f.uptimeSla !== null) {
    items.push(`SLA uptime ${f.uptimeSla}%`)
  }

  // Onboarding
  switch (f.onboardingType) {
    case "video_tutorial":      items.push("Onboarding : Tutoriel vidéo"); break
    case "visio_1h":            items.push("Onboarding : Session 1h en visio"); break
    case "visio_2h":            items.push("Onboarding : Session 2h en visio"); break
    case "team_training_30d":   items.push("Onboarding : Formation équipe + 30j d'accompagnement"); break
  }

  return items
}

/**
 * Formate un prix mensuel pour affichage (ex: "449 €", "Gratuit", "Sur devis").
 * Retourne aussi le préfixe éventuel ("À partir de" pour Sur-mesure).
 */
export function formatPlanPrice(plan: Plan, mode: "monthly" | "annual"): {
  readonly prefix: string | null
  readonly value: string
  readonly suffix: string | null
} {
  if (plan.priceMonthly === null) {
    // Sur-mesure : affichage du setupFeeMin si défini
    if (plan.setupFeeMin !== null) {
      return { prefix: "À partir de", value: `${plan.setupFeeMin.toLocaleString("fr-FR")} €`, suffix: " setup" }
    }
    return { prefix: null, value: "Sur devis", suffix: null }
  }
  if (plan.priceMonthly === 0) {
    return { prefix: null, value: "Gratuit", suffix: null }
  }
  const price = mode === "annual" && plan.priceAnnualMonthly !== null
    ? plan.priceAnnualMonthly
    : plan.priceMonthly
  return {
    prefix: null,
    value: `${price.toLocaleString("fr-FR")} €`,
    suffix: "/mois",
  }
}
