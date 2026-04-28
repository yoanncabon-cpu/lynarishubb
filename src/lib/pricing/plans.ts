// ─────────────────────────────────────────────────────────────────────────────
// Plans Lynaris — Source de vérité pricing
// 5 paliers : Découverte (essai 14j) / Starter / Pro ⭐ / Business / Sur-mesure
// ─────────────────────────────────────────────────────────────────────────────
//
// Cohérence DB : l'enum Postgres `plan` (src/lib/db/schema.ts) reste
// `trial | starter | pro | scale` pour rétrocompat. Le mapping UI ↔ DB
// est géré par `src/lib/pricing/legacy-mapping.ts` (étape 2).
//
// Stripe : les `stripeProductId` et `stripePriceId*` sont lus depuis
// `process.env`. Voir `.env.example` pour la liste complète.
// Découverte et Sur-mesure n'ont pas de produit Stripe (essai trialEndsAt
// pour le premier, devis manuel + invoicing pour le second).

import { z } from "zod"

// ─── Identifiants plans (UI) ─────────────────────────────────────────────────

export const PLAN_IDS = ["discovery", "starter", "pro", "business", "custom"] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const planSchema = z.enum(PLAN_IDS)

// ─── Énumérations features ───────────────────────────────────────────────────

export const AGENT_TIERS = [
  "all",                   // Découverte : tous (essai)
  "limited",               // Starter : 3 au choix, sans Marine
  "all_no_custom",         // Pro : tous les 9
  "all_plus_custom",       // Business : tous + 1 custom
  "all_plus_dedicated",    // Sur-mesure : agent dédié + tous
] as const
export type AgentTier = (typeof AGENT_TIERS)[number]

export const TWILIO_NUMBER_TIERS = [
  "pooled",        // Découverte : numéro mutualisé essai
  "shared_fr",     // Pro : numéro FR partagé
  "dedicated_fr",  // Business : numéro FR dédié
  "multi_intl",    // Sur-mesure : multi-numéros + international
] as const
export type TwilioNumberTier = (typeof TWILIO_NUMBER_TIERS)[number]

export const ELEVENLABS_VOICE_TIERS = [
  "standard",
  "premium_fr",
  "custom",        // clonage voix unique
  "multi_custom",  // plusieurs voix custom
] as const
export type ElevenlabsVoiceTier = (typeof ELEVENLABS_VOICE_TIERS)[number]

export const SUPPORT_SLA_TIERS = [
  "j2",            // Découverte : email 48h
  "j1",            // Starter : email J+1
  "j1_priority",   // Pro : J+1 prioritaire
  "j0_dedicated",  // Business : Slack/WhatsApp J+0
  "manager",       // Sur-mesure : manager dédié + QBR
] as const
export type SupportSlaTier = (typeof SUPPORT_SLA_TIERS)[number]

export const INTEGRATIONS = [
  "google",
  "stripe",
  "n8n",
  "make",
  "whatsapp",
  "pipedream",
  "twilio",
  "elevenlabs",
  "private_api",
] as const
export type IntegrationKey = (typeof INTEGRATIONS)[number]

// ─── Types ───────────────────────────────────────────────────────────────────

export type Quota = number | "unlimited"

export type ApiCreditsAllowance = number | "included"

export type PlanFeatures = {
  readonly agents: AgentTier
  readonly agentsCount: Quota
  readonly voiceMinutes: Quota
  readonly actions: Quota
  /** Crédits API inclus (en euros HT). "included" = forfait sans plafond. */
  readonly apiCredits: ApiCreditsAllowance
  readonly twilioNumber: TwilioNumberTier | null
  readonly elevenlabsVoice: ElevenlabsVoiceTier
  readonly ragDocs: Quota
  readonly members: Quota
  readonly integrations: readonly IntegrationKey[]
  readonly customAgentAvailable: boolean
  readonly supportSla: SupportSlaTier
  /** SLA uptime contractuel. null = best-effort (pas d'engagement). */
  readonly uptimeSla: 99 | 99.5 | 99.9 | null
  /** Onboarding texte court affiché en card. */
  readonly onboarding: string
}

export type Plan = {
  readonly id: PlanId
  readonly name: string
  /** Sous-titre court, max ~80 caractères. */
  readonly tagline: string
  /** Prix mensuel HT en euros. null = sur devis. */
  readonly priceMonthly: number | null
  /** Prix mensualisé sur engagement annuel HT. null = pas applicable. */
  readonly priceAnnualMonthly: number | null
  /** Préfixe d'affichage du prix, ex: "À partir de". null = prix exact. */
  readonly pricePrefix: string | null
  /** Frais de mise en service unique HT, payés au premier checkout. */
  readonly setupFee: number
  /** Engagement minimum en mois. 0 = aucun engagement. */
  readonly minCommitmentMonths: number
  /** Durée d'essai gratuit en jours. 0 = pas d'essai. */
  readonly trialDays: number
  /** Plan mis en avant (badge "Recommandé"). Un seul à la fois. */
  readonly featured: boolean
  readonly stripeProductId: string | null
  readonly stripePriceIdMonthly: string | null
  readonly stripePriceIdAnnual: string | null
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

// ─── Définition des plans ────────────────────────────────────────────────────

const DISCOVERY: Plan = {
  id: "discovery",
  name: "Découverte",
  tagline: "Essai gratuit 14 jours, sans CB, sans engagement",
  priceMonthly: 0,
  priceAnnualMonthly: null,
  pricePrefix: null,
  setupFee: 0,
  minCommitmentMonths: 0,
  trialDays: 14,
  featured: false,
  stripeProductId: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  features: {
    agents: "all",
    agentsCount: "unlimited",
    voiceMinutes: 30,
    actions: 50,
    apiCredits: 0,
    twilioNumber: "pooled",
    elevenlabsVoice: "standard",
    ragDocs: 0,
    members: 1,
    integrations: ["google"],
    customAgentAvailable: false,
    supportSla: "j2",
    uptimeSla: null,
    onboarding: "Tutoriel vidéo",
  },
  cta: { label: "Commencer gratuitement", href: "/signup?plan=discovery" },
}

const STARTER: Plan = {
  id: "starter",
  name: "Starter",
  tagline: "3 agents au choix (hors Marine), volume confortable",
  priceMonthly: 149,
  priceAnnualMonthly: 127,
  pricePrefix: null,
  setupFee: 0,
  minCommitmentMonths: 0,
  trialDays: 14,
  featured: false,
  stripeProductId: envOrNull("STRIPE_PRODUCT_STARTER"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_STARTER_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_STARTER_YEARLY"),
  features: {
    agents: "limited",
    agentsCount: 3,
    voiceMinutes: 0,
    actions: 1200,
    apiCredits: 20,
    twilioNumber: null,
    elevenlabsVoice: "standard",
    ragDocs: 250,
    members: 1,
    integrations: ["google"],
    customAgentAvailable: false,
    supportSla: "j1",
    uptimeSla: null,
    onboarding: "Tutoriel vidéo",
  },
  cta: { label: "Démarrer Starter", href: "/signup?plan=starter" },
}

const PRO: Plan = {
  id: "pro",
  name: "Pro",
  tagline: "Tous les 9 agents, volume premium, intégrations clés",
  priceMonthly: 449,
  priceAnnualMonthly: 382,
  pricePrefix: null,
  setupFee: 290,
  minCommitmentMonths: 0,
  trialDays: 14,
  featured: true,
  stripeProductId: envOrNull("STRIPE_PRODUCT_PRO_NEW"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_PRO_NEW_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_PRO_NEW_YEARLY"),
  features: {
    agents: "all_no_custom",
    agentsCount: "unlimited",
    voiceMinutes: 400,
    actions: 4000,
    apiCredits: 60,
    twilioNumber: "shared_fr",
    elevenlabsVoice: "premium_fr",
    ragDocs: 2000,
    members: 3,
    integrations: ["google", "stripe", "n8n", "make"],
    customAgentAvailable: false,
    supportSla: "j1_priority",
    uptimeSla: 99,
    onboarding: "Session 1h en visio",
  },
  cta: { label: "Démarrer Pro", href: "/signup?plan=pro" },
}

const BUSINESS: Plan = {
  id: "business",
  name: "Business",
  tagline: "Tous les agents + 1 custom, numéro dédié, support J+0",
  priceMonthly: 1190,
  priceAnnualMonthly: 1012,
  pricePrefix: null,
  setupFee: 690,
  minCommitmentMonths: 0,
  trialDays: 14,
  featured: false,
  stripeProductId: envOrNull("STRIPE_PRODUCT_BUSINESS"),
  stripePriceIdMonthly: envOrNull("STRIPE_PRICE_BUSINESS_MONTHLY"),
  stripePriceIdAnnual: envOrNull("STRIPE_PRICE_BUSINESS_YEARLY"),
  features: {
    agents: "all_plus_custom",
    agentsCount: "unlimited",
    voiceMinutes: 1500,
    actions: 12000,
    apiCredits: 180,
    twilioNumber: "dedicated_fr",
    elevenlabsVoice: "custom",
    ragDocs: 10000,
    members: 8,
    integrations: ["google", "stripe", "n8n", "make", "whatsapp", "pipedream"],
    customAgentAvailable: true,
    supportSla: "j0_dedicated",
    uptimeSla: 99.5,
    onboarding: "Session 2h en visio",
  },
  cta: { label: "Choisir Business", href: "/signup?plan=business" },
}

const CUSTOM: Plan = {
  id: "custom",
  name: "Sur-mesure",
  tagline: "Agent dédié, configuré pour ton secteur, opérationnel en 48h",
  priceMonthly: 2490,
  priceAnnualMonthly: null,
  pricePrefix: "À partir de",
  setupFee: 2900,
  minCommitmentMonths: 12,
  trialDays: 0,
  featured: false,
  stripeProductId: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  features: {
    agents: "all_plus_dedicated",
    agentsCount: "unlimited",
    voiceMinutes: "unlimited",
    actions: "unlimited",
    apiCredits: "included",
    twilioNumber: "multi_intl",
    elevenlabsVoice: "multi_custom",
    ragDocs: "unlimited",
    members: "unlimited",
    integrations: [
      "google", "stripe", "n8n", "make", "whatsapp",
      "pipedream", "twilio", "elevenlabs", "private_api",
    ],
    customAgentAvailable: true,
    supportSla: "manager",
    uptimeSla: 99.9,
    onboarding: "Formation équipe + 30j d'accompagnement",
  },
  cta: { label: "Réserver une démo", href: "/contact?type=demo" },
}

// ─── Exports : Record + array ────────────────────────────────────────────────

export const PLANS_BY_ID: Readonly<Record<PlanId, Plan>> = {
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
export const PLANS: readonly Plan[] = [
  DISCOVERY,
  STARTER,
  PRO,
  BUSINESS,
  CUSTOM,
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPlan(id: PlanId): Plan {
  return PLANS_BY_ID[id]
}

export function getFeaturedPlan(): Plan {
  const featured = PLANS.find((p) => p.featured)
  // Invariant : exactement un plan a `featured: true`. Si jamais cassé,
  // on retourne Pro par défaut plutôt que de throw — l'UI doit toujours rendre.
  return featured ?? PRO
}

export function isCustomPlan(id: PlanId): boolean {
  return id === "custom"
}

export function isFreePlan(id: PlanId): boolean {
  return id === "discovery"
}

export function isPaidPlan(id: PlanId): boolean {
  const plan = getPlan(id)
  return plan.priceMonthly !== null && plan.priceMonthly > 0
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
 * Génère la liste textuelle des features d'un plan, formatée pour l'UI
 * (cards tarifs, dashboard billing). Exhaustif et stable.
 */
export function getFeatureList(plan: Plan): readonly string[] {
  const f = plan.features
  const items: string[] = []

  // Agents
  if (f.agents === "all") items.push(`Accès à tous les agents (${plan.id === "discovery" ? "essai" : "complet"})`)
  else if (f.agents === "limited" && typeof f.agentsCount === "number") items.push(`${f.agentsCount} agents au choix (hors Marine)`)
  else if (f.agents === "all_no_custom") items.push("Tous les 9 agents Lynaris")
  else if (f.agents === "all_plus_custom") items.push("Tous les agents + 1 agent custom")
  else if (f.agents === "all_plus_dedicated") items.push("Agent dédié configuré pour ton secteur + tous les agents")

  // Voice
  if (f.voiceMinutes === "unlimited") items.push("Marine illimitée")
  else if (f.voiceMinutes === 0) items.push("Marine en option (recharge crédits téléphoniques)")
  else items.push(`${f.voiceMinutes.toLocaleString("fr-FR")} minutes voix / mois`)

  // Actions
  if (f.actions === "unlimited") items.push("Actions illimitées")
  else items.push(`${f.actions.toLocaleString("fr-FR")} actions / mois`)

  // API credits
  if (f.apiCredits === "included") items.push("Crédits API inclus dans le forfait")
  else if (f.apiCredits > 0) items.push(`${f.apiCredits} € de crédits API inclus`)

  // Twilio
  if (f.twilioNumber === "pooled") items.push("Numéro Twilio mutualisé")
  else if (f.twilioNumber === "shared_fr") items.push("Numéro Twilio FR partagé")
  else if (f.twilioNumber === "dedicated_fr") items.push("Numéro Twilio FR dédié")
  else if (f.twilioNumber === "multi_intl") items.push("Multi-numéros + international")

  // ElevenLabs
  if (f.elevenlabsVoice === "standard") items.push("Voix ElevenLabs standard")
  else if (f.elevenlabsVoice === "premium_fr") items.push("Voix ElevenLabs premium FR")
  else if (f.elevenlabsVoice === "custom") items.push("Voix ElevenLabs custom (clonage)")
  else if (f.elevenlabsVoice === "multi_custom") items.push("Plusieurs voix custom")

  // RAG
  if (f.ragDocs === "unlimited") items.push("Knowledge base illimitée")
  else if (f.ragDocs > 0) items.push(`${f.ragDocs.toLocaleString("fr-FR")} documents RAG`)

  // Members
  if (f.members === "unlimited") items.push("Membres équipe illimités")
  else if (f.members === 1) items.push("1 membre")
  else items.push(`${f.members} membres équipe`)

  // Support
  if (f.supportSla === "j2") items.push("Support email J+2")
  else if (f.supportSla === "j1") items.push("Support email J+1")
  else if (f.supportSla === "j1_priority") items.push("Support email prioritaire J+1")
  else if (f.supportSla === "j0_dedicated") items.push("Support Slack/WhatsApp J+0")
  else if (f.supportSla === "manager") items.push("Manager de compte dédié + QBR")

  // SLA uptime
  if (f.uptimeSla !== null) items.push(`SLA uptime ${f.uptimeSla}%`)

  // Onboarding
  items.push(`Onboarding : ${f.onboarding}`)

  return items
}

/**
 * Badge affiché sur la card du plan (ex: "Recommandé"). null si pas de badge.
 * Centralise la logique pour éviter les divergences entre /tarifs et /billing.
 */
export function getPlanBadge(plan: Plan): string | null {
  if (plan.featured) return "Recommandé"
  return null
}

/**
 * Formate un prix mensuel pour affichage (ex: "449 €", "Gratuit", "Sur devis").
 * Retourne aussi le préfixe éventuel.
 */
export function formatPlanPrice(plan: Plan, mode: "monthly" | "annual"): {
  readonly prefix: string | null
  readonly value: string
  readonly suffix: string | null
} {
  if (plan.priceMonthly === null) return { prefix: null, value: "Sur devis", suffix: null }
  if (plan.priceMonthly === 0) return { prefix: null, value: "Gratuit", suffix: null }
  const price = mode === "annual" && plan.priceAnnualMonthly !== null
    ? plan.priceAnnualMonthly
    : plan.priceMonthly
  return {
    prefix: plan.pricePrefix,
    value: `${price.toLocaleString("fr-FR")} €`,
    suffix: "/mois",
  }
}
