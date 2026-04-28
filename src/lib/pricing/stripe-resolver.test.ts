import { describe, expect, it } from "vitest"
import {
  getPlanFromStripePriceId,
  isStripeSetupFeePriceId,
  isVoicePackPriceId,
} from "./stripe-resolver"

describe("getPlanFromStripePriceId", () => {
  const env = {
    STRIPE_PRICE_STARTER_MONTHLY: "price_starter_m",
    STRIPE_PRICE_STARTER_ANNUAL: "price_starter_a",
    STRIPE_PRICE_PRO_MONTHLY: "price_pro_m",
    STRIPE_PRICE_PRO_ANNUAL: "price_pro_a",
    STRIPE_PRICE_BUSINESS_MONTHLY: "price_business_m",
    STRIPE_PRICE_BUSINESS_ANNUAL: "price_business_a",
  } as NodeJS.ProcessEnv

  it("résout les prix Starter", () => {
    expect(getPlanFromStripePriceId("price_starter_m", env)).toBe("starter")
    expect(getPlanFromStripePriceId("price_starter_a", env)).toBe("starter")
  })

  it("résout les prix Pro", () => {
    expect(getPlanFromStripePriceId("price_pro_m", env)).toBe("pro")
    expect(getPlanFromStripePriceId("price_pro_a", env)).toBe("pro")
  })

  it("résout les prix Business", () => {
    expect(getPlanFromStripePriceId("price_business_m", env)).toBe("business")
    expect(getPlanFromStripePriceId("price_business_a", env)).toBe("business")
  })

  it("renvoie null pour un price inconnu", () => {
    expect(getPlanFromStripePriceId("price_unknown", env)).toBeNull()
  })

  it("renvoie null pour un price vide", () => {
    expect(getPlanFromStripePriceId("", env)).toBeNull()
  })

  it("ignore les env vars vides", () => {
    const emptyEnv = {} as NodeJS.ProcessEnv
    expect(getPlanFromStripePriceId("price_starter_m", emptyEnv)).toBeNull()
  })
})

describe("isStripeSetupFeePriceId", () => {
  const env = {
    STRIPE_PRICE_PRO_SETUP: "price_pro_setup",
    STRIPE_PRICE_BUSINESS_SETUP: "price_business_setup",
  } as NodeJS.ProcessEnv

  it("détecte les setup fees Pro et Business", () => {
    expect(isStripeSetupFeePriceId("price_pro_setup", env)).toBe(true)
    expect(isStripeSetupFeePriceId("price_business_setup", env)).toBe(true)
  })

  it("rejette un price d'abonnement", () => {
    expect(isStripeSetupFeePriceId("price_pro_m", env)).toBe(false)
  })
})

describe("isVoicePackPriceId", () => {
  it("détecte le voice pack", () => {
    const env = { STRIPE_PRICE_VOICE_PACK: "price_voice_pack" } as NodeJS.ProcessEnv
    expect(isVoicePackPriceId("price_voice_pack", env)).toBe(true)
    expect(isVoicePackPriceId("price_other", env)).toBe(false)
  })
})
