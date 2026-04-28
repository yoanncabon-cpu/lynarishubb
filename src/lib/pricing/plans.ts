// ─────────────────────────────────────────────────────────────────────────────
// Plans Lynaris — affichage marketing
// 3 plans : Découverte (essai), Pro, Sur-mesure (custom)
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId = "decouverte" | "pro" | "custom"

export interface Plan {
  id: PlanId
  name: string
  priceMonthly: number | null
  priceYearly: number | null
  pricePrefix?: string
  stripePriceIdMonthly: string | undefined
  stripePriceIdYearly: string | undefined
  tagline: string
  badge?: string
  features: string[]
  highlighted?: boolean
  earlyAdopter?: boolean
  cta: { label: string; href: string }
}

export const PLANS: Plan[] = [
  // ── Plan 1 — Découverte (essai gratuit 14j) ──────────────────────────────
  {
    id: "decouverte",
    name: "Découverte",
    priceMonthly: 0,
    priceYearly: 0,
    // Pas de price ID Stripe : l'essai est géré par trialEndsAt en DB
    stripePriceIdMonthly: undefined,
    stripePriceIdYearly: undefined,
    tagline: "Essai gratuit, sans CB, sans engagement",
    features: [
      "Accès à tous les agents disponibles",
      "50 actions sur 14 jours",
      "Sans CB, sans engagement",
    ],
    cta: { label: "Commencer gratuitement", href: "/signup?plan=decouverte" },
  },
  // ── Plan 2 — Pro (recommandé) ────────────────────────────────────────────
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 149,
    // 15% d'économie sur l'annuel : 149 × 12 × 0,85 ≈ 1524€/an → 127€/mois
    priceYearly: 127,
    // Price ID Stripe à créer dans le dashboard Stripe puis renseigner dans .env.local
    stripePriceIdMonthly: process.env["STRIPE_PRICE_PRO_MONTHLY"] ?? "PRICE_ID_TO_FILL",
    stripePriceIdYearly: process.env["STRIPE_PRICE_PRO_YEARLY"] ?? "PRICE_ID_TO_FILL",
    tagline: "Tous les agents, volume confortable, intégrations clés",
    badge: "Recommandé",
    features: [
      "Tous les agents disponibles",
      "1 500 actions / mois",
      "300 minutes voix / mois",
      "Intégrations Google + Stripe",
      "Support email J+1",
    ],
    highlighted: true,
    cta: { label: "Démarrer Pro", href: "/signup?plan=pro" },
  },
  // ── Plan 3 — Sur-mesure (custom) ─────────────────────────────────────────
  {
    id: "custom",
    name: "Sur-mesure",
    // Pas de prix affiché — sur devis uniquement
    priceMonthly: null,
    priceYearly: null,
    stripePriceIdMonthly: undefined,
    stripePriceIdYearly: undefined,
    tagline: "Agent dédié, configuré pour ton secteur, opérationnel en 48h",
    features: [
      "Agent dédié configuré pour ton secteur",
      "Volume illimité",
      "Numéro Twilio + voix ElevenLabs sur-mesure",
      "Onboarding personnalisé",
    ],
    cta: { label: "Nous contacter", href: "/contact?plan=custom" },
  },
]
