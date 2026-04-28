import { describe, expect, it } from "vitest"
import {
  PLAN_IDS,
  PLANS,
  PLANS_BY_ID,
  planSchema,
  getPlan,
  getFeaturedPlan,
  getNextPlan,
  getFeatureList,
  getPlanBadge,
  isCustomPlan,
  isFreePlan,
  isPaidPlan,
  formatPlanPrice,
  type PlanId,
} from "./plans"

describe("PLAN_IDS", () => {
  it("contient exactement les 5 paliers attendus dans l'ordre", () => {
    expect(PLAN_IDS).toEqual(["discovery", "starter", "pro", "business", "custom"])
  })
})

describe("planSchema (Zod)", () => {
  it("accepte tous les PlanId valides", () => {
    for (const id of PLAN_IDS) {
      expect(planSchema.parse(id)).toBe(id)
    }
  })

  it("rejette une valeur inconnue", () => {
    expect(() => planSchema.parse("scale")).toThrow()
    expect(() => planSchema.parse("trial")).toThrow()
    expect(() => planSchema.parse("")).toThrow()
  })
})

describe("PLANS array", () => {
  it("a la même longueur que PLAN_IDS", () => {
    expect(PLANS.length).toBe(PLAN_IDS.length)
  })

  it("est dans le même ordre que PLAN_IDS", () => {
    PLANS.forEach((plan, i) => {
      expect(plan.id).toBe(PLAN_IDS[i])
    })
  })

  it("a exactement un plan featured", () => {
    const featured = PLANS.filter((p) => p.featured)
    expect(featured).toHaveLength(1)
    expect(featured[0]?.id).toBe("pro")
  })
})

describe("PLANS_BY_ID record", () => {
  it("expose chaque plan via son id", () => {
    for (const id of PLAN_IDS) {
      expect(PLANS_BY_ID[id]).toBeDefined()
      expect(PLANS_BY_ID[id].id).toBe(id)
    }
  })

  it("renvoie le même objet que PLANS array (référence partagée)", () => {
    PLANS.forEach((plan) => {
      expect(PLANS_BY_ID[plan.id]).toBe(plan)
    })
  })
})

describe("Prix par plan", () => {
  it("Découverte est gratuit", () => {
    expect(PLANS_BY_ID.discovery.priceMonthly).toBe(0)
    expect(PLANS_BY_ID.discovery.setupFee).toBe(0)
    expect(PLANS_BY_ID.discovery.trialDays).toBe(14)
  })

  it("Starter à 149€/127€ sans setup fee", () => {
    expect(PLANS_BY_ID.starter.priceMonthly).toBe(149)
    expect(PLANS_BY_ID.starter.priceAnnualMonthly).toBe(127)
    expect(PLANS_BY_ID.starter.setupFee).toBe(0)
  })

  it("Pro à 449€/382€ avec setup 290€", () => {
    expect(PLANS_BY_ID.pro.priceMonthly).toBe(449)
    expect(PLANS_BY_ID.pro.priceAnnualMonthly).toBe(382)
    expect(PLANS_BY_ID.pro.setupFee).toBe(290)
    expect(PLANS_BY_ID.pro.featured).toBe(true)
  })

  it("Business à 1190€/1012€ avec setup 690€", () => {
    expect(PLANS_BY_ID.business.priceMonthly).toBe(1190)
    expect(PLANS_BY_ID.business.priceAnnualMonthly).toBe(1012)
    expect(PLANS_BY_ID.business.setupFee).toBe(690)
  })

  it("Sur-mesure : prix de départ 2490€ + setup 2900€ + engagement 12 mois", () => {
    expect(PLANS_BY_ID.custom.priceMonthly).toBe(2490)
    expect(PLANS_BY_ID.custom.pricePrefix).toBe("À partir de")
    expect(PLANS_BY_ID.custom.setupFee).toBe(2900)
    expect(PLANS_BY_ID.custom.minCommitmentMonths).toBe(12)
  })

  it("économie annuelle ~15% sur Starter / Pro / Business", () => {
    const checkSaving = (id: "starter" | "pro" | "business") => {
      const p = PLANS_BY_ID[id]
      if (p.priceMonthly === null || p.priceAnnualMonthly === null) {
        throw new Error(`${id} doit avoir des prix non null`)
      }
      const ratio = p.priceAnnualMonthly / p.priceMonthly
      // Tolérance large pour arrondis : ~15% (= ratio entre 0.83 et 0.87)
      expect(ratio).toBeGreaterThan(0.83)
      expect(ratio).toBeLessThan(0.87)
    }
    checkSaving("starter")
    checkSaving("pro")
    checkSaving("business")
  })
})

describe("Stripe IDs", () => {
  it("Découverte et Sur-mesure n'ont pas de stripeProductId", () => {
    expect(PLANS_BY_ID.discovery.stripeProductId).toBeNull()
    expect(PLANS_BY_ID.discovery.stripePriceIdMonthly).toBeNull()
    expect(PLANS_BY_ID.discovery.stripePriceIdAnnual).toBeNull()
    expect(PLANS_BY_ID.custom.stripeProductId).toBeNull()
    expect(PLANS_BY_ID.custom.stripePriceIdMonthly).toBeNull()
  })

  it("Plans payants : stripePriceId* est null si env var absente, jamais string vide", () => {
    // En env de test, les vars Stripe ne sont pas définies — donc null attendu
    for (const id of ["starter", "pro", "business"] as const) {
      const p = PLANS_BY_ID[id]
      expect(p.stripePriceIdMonthly === null || (typeof p.stripePriceIdMonthly === "string" && p.stripePriceIdMonthly.length > 0)).toBe(true)
      expect(p.stripePriceIdAnnual === null || (typeof p.stripePriceIdAnnual === "string" && p.stripePriceIdAnnual.length > 0)).toBe(true)
    }
  })
})

describe("Features par plan — invariants critiques", () => {
  it("Starter EXCLUT Marine (voiceMinutes: 0)", () => {
    expect(PLANS_BY_ID.starter.features.voiceMinutes).toBe(0)
    expect(PLANS_BY_ID.starter.features.agents).toBe("limited")
  })

  it("Pro inclut tous les agents (sans custom)", () => {
    expect(PLANS_BY_ID.pro.features.agents).toBe("all_no_custom")
    expect(PLANS_BY_ID.pro.features.customAgentAvailable).toBe(false)
  })

  it("Business autorise un agent custom", () => {
    expect(PLANS_BY_ID.business.features.customAgentAvailable).toBe(true)
    expect(PLANS_BY_ID.business.features.agents).toBe("all_plus_custom")
  })

  it("Sur-mesure : tout illimité + agent dédié", () => {
    const f = PLANS_BY_ID.custom.features
    expect(f.agents).toBe("all_plus_dedicated")
    expect(f.voiceMinutes).toBe("unlimited")
    expect(f.actions).toBe("unlimited")
    expect(f.ragDocs).toBe("unlimited")
    expect(f.members).toBe("unlimited")
    expect(f.apiCredits).toBe("included")
    expect(f.uptimeSla).toBe(99.9)
  })

  it("SLA uptime croissant Pro → Business → Custom", () => {
    expect(PLANS_BY_ID.pro.features.uptimeSla).toBe(99)
    expect(PLANS_BY_ID.business.features.uptimeSla).toBe(99.5)
    expect(PLANS_BY_ID.custom.features.uptimeSla).toBe(99.9)
  })

  it("Membres équipe croissants : 1 / 1 / 3 / 8 / unlimited", () => {
    expect(PLANS_BY_ID.discovery.features.members).toBe(1)
    expect(PLANS_BY_ID.starter.features.members).toBe(1)
    expect(PLANS_BY_ID.pro.features.members).toBe(3)
    expect(PLANS_BY_ID.business.features.members).toBe(8)
    expect(PLANS_BY_ID.custom.features.members).toBe("unlimited")
  })

  it("Numéro Twilio progressif", () => {
    expect(PLANS_BY_ID.discovery.features.twilioNumber).toBe("pooled")
    expect(PLANS_BY_ID.starter.features.twilioNumber).toBeNull()
    expect(PLANS_BY_ID.pro.features.twilioNumber).toBe("shared_fr")
    expect(PLANS_BY_ID.business.features.twilioNumber).toBe("dedicated_fr")
    expect(PLANS_BY_ID.custom.features.twilioNumber).toBe("multi_intl")
  })

  it("WhatsApp débloqué à partir de Business", () => {
    expect(PLANS_BY_ID.discovery.features.integrations).not.toContain("whatsapp")
    expect(PLANS_BY_ID.starter.features.integrations).not.toContain("whatsapp")
    expect(PLANS_BY_ID.pro.features.integrations).not.toContain("whatsapp")
    expect(PLANS_BY_ID.business.features.integrations).toContain("whatsapp")
    expect(PLANS_BY_ID.custom.features.integrations).toContain("whatsapp")
  })

  it("API privée seulement pour Sur-mesure", () => {
    expect(PLANS_BY_ID.custom.features.integrations).toContain("private_api")
    for (const id of ["discovery", "starter", "pro", "business"] as const) {
      expect(PLANS_BY_ID[id].features.integrations).not.toContain("private_api")
    }
  })
})

describe("Helpers", () => {
  it("getPlan retourne le bon plan", () => {
    expect(getPlan("pro")).toBe(PLANS_BY_ID.pro)
    expect(getPlan("custom").name).toBe("Sur-mesure")
  })

  it("getFeaturedPlan retourne Pro", () => {
    expect(getFeaturedPlan().id).toBe("pro")
  })

  it("getNextPlan : progression d'upgrade", () => {
    expect(getNextPlan("discovery")).toBe("starter")
    expect(getNextPlan("starter")).toBe("pro")
    expect(getNextPlan("pro")).toBe("business")
    expect(getNextPlan("business")).toBe("custom")
    expect(getNextPlan("custom")).toBe("custom") // sans successeur
  })

  it("isCustomPlan / isFreePlan / isPaidPlan", () => {
    expect(isCustomPlan("custom")).toBe(true)
    expect(isCustomPlan("pro")).toBe(false)

    expect(isFreePlan("discovery")).toBe(true)
    expect(isFreePlan("pro")).toBe(false)

    expect(isPaidPlan("starter")).toBe(true)
    expect(isPaidPlan("pro")).toBe(true)
    expect(isPaidPlan("business")).toBe(true)
    expect(isPaidPlan("custom")).toBe(true)
    expect(isPaidPlan("discovery")).toBe(false)
  })

  it("getPlanBadge : seul Pro a un badge 'Recommandé'", () => {
    expect(getPlanBadge(PLANS_BY_ID.pro)).toBe("Recommandé")
    for (const id of ["discovery", "starter", "business", "custom"] as const) {
      expect(getPlanBadge(PLANS_BY_ID[id])).toBeNull()
    }
  })

  it("getFeatureList retourne au moins 5 entrées par plan", () => {
    for (const id of PLAN_IDS) {
      const list = getFeatureList(PLANS_BY_ID[id])
      expect(list.length).toBeGreaterThanOrEqual(5)
      // Pas de string vide
      for (const f of list) {
        expect(f.length).toBeGreaterThan(0)
      }
    }
  })

  it("getFeatureList : Starter mentionne Marine en option (pas inclus)", () => {
    const list = getFeatureList(PLANS_BY_ID.starter)
    // Au moins une feature doit mentionner Marine en option/recharge
    const optionMention = list.find(
      (f) => f.toLowerCase().includes("marine") && /option|recharge/i.test(f)
    )
    expect(optionMention).toBeDefined()
  })

  it("getFeatureList : Découverte mentionne 30 minutes voix", () => {
    const list = getFeatureList(PLANS_BY_ID.discovery)
    expect(list.some((f) => f.includes("30") && f.includes("voix"))).toBe(true)
  })
})

describe("formatPlanPrice", () => {
  it("Découverte → 'Gratuit'", () => {
    const r = formatPlanPrice(PLANS_BY_ID.discovery, "monthly")
    expect(r.value).toBe("Gratuit")
    expect(r.suffix).toBeNull()
  })

  it("Starter monthly → 149 €", () => {
    const r = formatPlanPrice(PLANS_BY_ID.starter, "monthly")
    expect(r.value).toBe("149 €")
    expect(r.suffix).toBe("/mois")
  })

  it("Pro annual → 382 €/mois (mensualisé)", () => {
    const r = formatPlanPrice(PLANS_BY_ID.pro, "annual")
    expect(r.value).toBe("382 €")
  })

  it("Sur-mesure annual : fallback sur monthly (pas d'annuel)", () => {
    const r = formatPlanPrice(PLANS_BY_ID.custom, "annual")
    expect(r.prefix).toBe("À partir de")
    // toLocaleString fr-FR insère un espace insécable étroit (U+202F) entre milliers
    expect(r.value).toMatch(/^2.490 €$/u)
  })

  it("Business utilise un espace insécable français pour les milliers", () => {
    const r = formatPlanPrice(PLANS_BY_ID.business, "monthly")
    // toLocaleString fr-FR insère un espace insécable (  ou  ) entre milliers
    expect(r.value).toMatch(/^1.190 €$/)
  })
})

describe("Type inference (régression)", () => {
  it("PlanId est strictement les 5 valeurs", () => {
    const ids: PlanId[] = ["discovery", "starter", "pro", "business", "custom"]
    expect(ids).toHaveLength(5)
  })
})
