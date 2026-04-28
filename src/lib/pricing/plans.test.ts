import { describe, expect, it } from "vitest"
import {
  PLAN_IDS,
  PLANS,
  PLAN_LIST,
  planSchema,
  getPlan,
  getFeaturedPlan,
  getNextPlan,
  getFeatureList,
  getPlanBadge,
  isCustomPlan,
  isFreePlan,
  isPaidPlan,
  allPaidPlans,
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
    expect(() => planSchema.parse("essentiel")).toThrow()
    expect(() => planSchema.parse("")).toThrow()
  })
})

describe("PLANS record", () => {
  it("expose chaque plan via son id", () => {
    for (const id of PLAN_IDS) {
      expect(PLANS[id]).toBeDefined()
      expect(PLANS[id].id).toBe(id)
    }
  })

  it("PLANS.pro est featured (un seul featured)", () => {
    expect(PLANS.pro.featured).toBe(true)
    expect(PLANS.discovery.featured).toBe(false)
    expect(PLANS.starter.featured).toBe(false)
    expect(PLANS.business.featured).toBe(false)
    expect(PLANS.custom.featured).toBe(false)
  })
})

describe("PLAN_LIST array", () => {
  it("a la même longueur que PLAN_IDS", () => {
    expect(PLAN_LIST.length).toBe(PLAN_IDS.length)
  })

  it("est dans le même ordre que PLAN_IDS", () => {
    PLAN_LIST.forEach((plan, i) => {
      expect(plan.id).toBe(PLAN_IDS[i])
    })
  })

  it("contient les mêmes références d'objets que PLANS record", () => {
    for (const plan of PLAN_LIST) {
      expect(PLANS[plan.id]).toBe(plan)
    }
  })
})

describe("Prix par plan", () => {
  it("Découverte est gratuit avec essai 14 jours", () => {
    expect(PLANS.discovery.priceMonthly).toBe(0)
    expect(PLANS.discovery.priceAnnualMonthly).toBe(0)
    expect(PLANS.discovery.setupFee).toBe(0)
    expect(PLANS.discovery.trialDays).toBe(14)
    expect(PLANS.discovery.minCommitmentMonths).toBe(0)
  })

  it("Starter à 149€/127€ sans setup fee, mensuel sans engagement", () => {
    expect(PLANS.starter.priceMonthly).toBe(149)
    expect(PLANS.starter.priceAnnualMonthly).toBe(127)
    expect(PLANS.starter.setupFee).toBe(0)
    expect(PLANS.starter.minCommitmentMonths).toBe(0)
    expect(PLANS.starter.trialDays).toBe(0)
  })

  it("Pro à 449€/382€ avec setup 290€, featured", () => {
    expect(PLANS.pro.priceMonthly).toBe(449)
    expect(PLANS.pro.priceAnnualMonthly).toBe(382)
    expect(PLANS.pro.setupFee).toBe(290)
    expect(PLANS.pro.featured).toBe(true)
  })

  it("Business à 1190€/1012€ avec setup 690€", () => {
    expect(PLANS.business.priceMonthly).toBe(1190)
    expect(PLANS.business.priceAnnualMonthly).toBe(1012)
    expect(PLANS.business.setupFee).toBe(690)
  })

  it("Sur-mesure : prix null (devis) + setupFeeMin 2900€ + engagement 12 mois", () => {
    expect(PLANS.custom.priceMonthly).toBeNull()
    expect(PLANS.custom.priceAnnualMonthly).toBeNull()
    expect(PLANS.custom.setupFee).toBe(2900)
    expect(PLANS.custom.setupFeeMin).toBe(2900)
    expect(PLANS.custom.minCommitmentMonths).toBe(12)
  })

  it("économie annuelle ~15% sur Starter / Pro / Business", () => {
    const checkSaving = (id: "starter" | "pro" | "business") => {
      const p = PLANS[id]
      if (p.priceMonthly === null || p.priceAnnualMonthly === null) {
        throw new Error(`${id} doit avoir des prix non null`)
      }
      const ratio = p.priceAnnualMonthly / p.priceMonthly
      // Tolérance ~15% (= ratio entre 0.83 et 0.87)
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
    expect(PLANS.discovery.stripeProductId).toBeNull()
    expect(PLANS.discovery.stripePriceIdMonthly).toBeNull()
    expect(PLANS.discovery.stripePriceIdAnnual).toBeNull()
    expect(PLANS.discovery.stripePriceIdSetup).toBeNull()
    expect(PLANS.custom.stripeProductId).toBeNull()
    expect(PLANS.custom.stripePriceIdMonthly).toBeNull()
    expect(PLANS.custom.stripePriceIdSetup).toBeNull()
  })

  it("Plans payants : stripePriceId* est null si env absente, jamais string vide", () => {
    for (const id of ["starter", "pro", "business"] as const) {
      const p = PLANS[id]
      const isNullOrNonEmpty = (v: string | null) =>
        v === null || (typeof v === "string" && v.length > 0)
      expect(isNullOrNonEmpty(p.stripePriceIdMonthly)).toBe(true)
      expect(isNullOrNonEmpty(p.stripePriceIdAnnual)).toBe(true)
    }
  })

  it("Pro et Business ont un slot stripePriceIdSetup", () => {
    // Champ existe (même si null en l'absence d'env). Starter n'en a pas besoin.
    expect("stripePriceIdSetup" in PLANS.pro).toBe(true)
    expect("stripePriceIdSetup" in PLANS.business).toBe(true)
    expect(PLANS.starter.stripePriceIdSetup).toBeNull()
  })
})

describe("Features par plan — invariants critiques", () => {
  it("Starter EXCLUT Marine (marineVoiceMinutes: 0) avec option 200 min/99€", () => {
    expect(PLANS.starter.features.marineVoiceMinutes).toBe(0)
    expect(PLANS.starter.features.marineVoiceOption.available).toBe(true)
    expect(PLANS.starter.features.marineVoiceOption.pricePerPack).toBe(99)
    expect(PLANS.starter.features.marineVoiceOption.minutesPerPack).toBe(200)
    expect(PLANS.starter.features.agentsAccess).toBe("limited_3")
    expect(PLANS.starter.features.maxAgents).toBe(3)
  })

  it("Pro inclut tous les agents SANS custom", () => {
    expect(PLANS.pro.features.agentsAccess).toBe("all")
    expect(PLANS.pro.features.customAgentIncluded).toBe(0)
  })

  it("Business autorise 1 agent custom", () => {
    expect(PLANS.business.features.customAgentIncluded).toBe(1)
    expect(PLANS.business.features.agentsAccess).toBe("all_plus_custom")
  })

  it("Sur-mesure : tout illimité (-1) + agent dédié", () => {
    const f = PLANS.custom.features
    expect(f.agentsAccess).toBe("all_plus_dedicated")
    expect(f.marineVoiceMinutes).toBe(-1)
    expect(f.monthlyActions).toBe(-1)
    expect(f.ragMaxDocs).toBe(-1)
    expect(f.teamMembers).toBe(-1)
    expect(f.customAgentIncluded).toBe(-1)
    expect(f.uptimeSla).toBe(99.9)
  })

  it("Actions par plan : 50 / 1200 / 4000 / 12000 / illimité", () => {
    expect(PLANS.discovery.features.monthlyActions).toBe(50)
    expect(PLANS.starter.features.monthlyActions).toBe(1200)
    expect(PLANS.pro.features.monthlyActions).toBe(4000)
    expect(PLANS.business.features.monthlyActions).toBe(12000)
    expect(PLANS.custom.features.monthlyActions).toBe(-1)
  })

  it("Voice Marine par plan : 30 / 0 (option) / 400 / 1500 / illimité", () => {
    expect(PLANS.discovery.features.marineVoiceMinutes).toBe(30)
    expect(PLANS.starter.features.marineVoiceMinutes).toBe(0)
    expect(PLANS.pro.features.marineVoiceMinutes).toBe(400)
    expect(PLANS.business.features.marineVoiceMinutes).toBe(1500)
    expect(PLANS.custom.features.marineVoiceMinutes).toBe(-1)
  })

  it("SLA uptime croissant Pro → Business → Custom", () => {
    expect(PLANS.discovery.features.uptimeSla).toBeNull()
    expect(PLANS.starter.features.uptimeSla).toBeNull()
    expect(PLANS.pro.features.uptimeSla).toBe(99)
    expect(PLANS.business.features.uptimeSla).toBe(99.5)
    expect(PLANS.custom.features.uptimeSla).toBe(99.9)
  })

  it("Membres équipe : 1 / 1 / 3 / 8 / illimité", () => {
    expect(PLANS.discovery.features.teamMembers).toBe(1)
    expect(PLANS.starter.features.teamMembers).toBe(1)
    expect(PLANS.pro.features.teamMembers).toBe(3)
    expect(PLANS.business.features.teamMembers).toBe(8)
    expect(PLANS.custom.features.teamMembers).toBe(-1)
  })

  it("Numéro Twilio progressif", () => {
    expect(PLANS.discovery.features.twilioNumber).toBe("mutualized")
    expect(PLANS.starter.features.twilioNumber).toBeNull()
    expect(PLANS.pro.features.twilioNumber).toBe("shared")
    expect(PLANS.business.features.twilioNumber).toBe("dedicated_fr")
    expect(PLANS.custom.features.twilioNumber).toBe("multi_intl")
  })

  it("WhatsApp Business débloqué à partir de Business", () => {
    expect(PLANS.discovery.features.integrations).not.toContain("whatsapp_business")
    expect(PLANS.starter.features.integrations).not.toContain("whatsapp_business")
    expect(PLANS.pro.features.integrations).not.toContain("whatsapp_business")
    expect(PLANS.business.features.integrations).toContain("whatsapp_business")
    expect(PLANS.custom.features.integrations).toContain("whatsapp_business")
  })

  it("API privée et ERP/CRM custom seulement pour Sur-mesure", () => {
    expect(PLANS.custom.features.integrations).toContain("private_api")
    expect(PLANS.custom.features.integrations).toContain("custom_erp")
    expect(PLANS.custom.features.integrations).toContain("custom_crm")
    for (const id of ["discovery", "starter", "pro", "business"] as const) {
      expect(PLANS[id].features.integrations).not.toContain("private_api")
      expect(PLANS[id].features.integrations).not.toContain("custom_erp")
    }
  })

  it("RAG knowledge base : 0 / 250 / 2000 / 10000 / illimité", () => {
    expect(PLANS.discovery.features.ragMaxDocs).toBe(0)
    expect(PLANS.starter.features.ragMaxDocs).toBe(250)
    expect(PLANS.pro.features.ragMaxDocs).toBe(2000)
    expect(PLANS.business.features.ragMaxDocs).toBe(10000)
    expect(PLANS.custom.features.ragMaxDocs).toBe(-1)
  })

  it("Onboarding progressif", () => {
    expect(PLANS.discovery.features.onboardingType).toBe("video_tutorial")
    expect(PLANS.starter.features.onboardingType).toBe("video_tutorial")
    expect(PLANS.pro.features.onboardingType).toBe("visio_1h")
    expect(PLANS.business.features.onboardingType).toBe("visio_2h")
    expect(PLANS.custom.features.onboardingType).toBe("team_training_30d")
  })
})

describe("Helpers", () => {
  it("getPlan retourne le bon plan", () => {
    expect(getPlan("pro")).toBe(PLANS.pro)
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
    expect(getNextPlan("custom")).toBe("custom")
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

  it("allPaidPlans retourne 4 plans (sans Découverte)", () => {
    const paid = allPaidPlans()
    expect(paid.length).toBe(4)
    expect(paid.map((p) => p.id)).toEqual(["starter", "pro", "business", "custom"])
  })

  it("getPlanBadge : seul Pro a un badge 'Recommandé'", () => {
    expect(getPlanBadge(PLANS.pro)).toBe("Recommandé")
    for (const id of ["discovery", "starter", "business", "custom"] as const) {
      expect(getPlanBadge(PLANS[id])).toBeNull()
    }
  })

  it("getFeatureList retourne au moins 5 entrées par plan", () => {
    for (const id of PLAN_IDS) {
      const list = getFeatureList(PLANS[id])
      expect(list.length).toBeGreaterThanOrEqual(5)
      for (const f of list) {
        expect(f.length).toBeGreaterThan(0)
      }
    }
  })

  it("getFeatureList : Starter mentionne Marine en option", () => {
    const list = getFeatureList(PLANS.starter)
    const optionMention = list.find(
      (f) => f.toLowerCase().includes("marine") && /option|recharge/i.test(f)
    )
    expect(optionMention).toBeDefined()
    expect(optionMention).toMatch(/99/)
    expect(optionMention).toMatch(/200/)
  })

  it("getFeatureList : Découverte mentionne 30 minutes voix", () => {
    const list = getFeatureList(PLANS.discovery)
    expect(list.some((f) => f.includes("30") && f.includes("voix"))).toBe(true)
  })
})

describe("formatPlanPrice", () => {
  it("Découverte → 'Gratuit'", () => {
    const r = formatPlanPrice(PLANS.discovery, "monthly")
    expect(r.value).toBe("Gratuit")
    expect(r.suffix).toBeNull()
  })

  it("Starter monthly → 149 €", () => {
    const r = formatPlanPrice(PLANS.starter, "monthly")
    expect(r.value).toBe("149 €")
    expect(r.suffix).toBe("/mois")
  })

  it("Pro annual → 382 €/mois (mensualisé)", () => {
    const r = formatPlanPrice(PLANS.pro, "annual")
    expect(r.value).toBe("382 €")
  })

  it("Sur-mesure : 'À partir de 2 900 €' (setupFeeMin)", () => {
    const r = formatPlanPrice(PLANS.custom, "monthly")
    expect(r.prefix).toBe("À partir de")
    expect(r.value).toMatch(/^2.900 €$/u)
  })

  it("Business utilise un espace insécable français pour les milliers", () => {
    const r = formatPlanPrice(PLANS.business, "monthly")
    expect(r.value).toMatch(/^1.190 €$/u)
  })
})

describe("Type inference (régression)", () => {
  it("PlanId est strictement les 5 valeurs", () => {
    const ids: PlanId[] = ["discovery", "starter", "pro", "business", "custom"]
    expect(ids).toHaveLength(5)
  })
})
