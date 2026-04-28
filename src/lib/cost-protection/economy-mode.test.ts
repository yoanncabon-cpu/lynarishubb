import { describe, expect, it } from "vitest"
import {
  resolveModel,
  canSwitchToEconomy,
  ECONOMY_MODE_FALLBACK,
} from "./economy-mode"

describe("ECONOMY_MODE_FALLBACK — chaîne progressive", () => {
  it("Opus → Sonnet, Sonnet → Haiku, Haiku → Haiku (déjà min)", () => {
    expect(ECONOMY_MODE_FALLBACK["claude-opus-4-7"]).toBe("claude-sonnet-4-6")
    expect(ECONOMY_MODE_FALLBACK["claude-opus-4-6"]).toBe("claude-sonnet-4-6")
    expect(ECONOMY_MODE_FALLBACK["claude-sonnet-4-6"]).toBe("claude-haiku-4-5-20251001")
    expect(ECONOMY_MODE_FALLBACK["claude-haiku-4-5-20251001"]).toBe("claude-haiku-4-5-20251001")
  })
})

describe("resolveModel — règles de bascule", () => {
  it("Mode normal : utilise toujours le modèle de base", () => {
    expect(resolveModel("charles", "claude-opus-4-6", false)).toBe("claude-opus-4-6")
    expect(resolveModel("marine", "claude-sonnet-4-6", false)).toBe("claude-sonnet-4-6")
  })

  it("Mode économie : bascule pour agents standards", () => {
    expect(resolveModel("charles", "claude-opus-4-6", true)).toBe("claude-sonnet-4-6")
    expect(resolveModel("nova", "claude-opus-4-6", true)).toBe("claude-sonnet-4-6")
    expect(resolveModel("lou", "claude-opus-4-6", true)).toBe("claude-sonnet-4-6")
  })

  it("Marine : JAMAIS de bascule (qualité voix critique)", () => {
    expect(resolveModel("marine", "claude-sonnet-4-6", true)).toBe("claude-sonnet-4-6")
    expect(resolveModel("marine", "claude-opus-4-7", true)).toBe("claude-opus-4-7")
  })
})

describe("canSwitchToEconomy", () => {
  it("Marine : false (no economy)", () => {
    expect(canSwitchToEconomy("marine")).toBe(false)
  })

  it("Tous les autres agents : true", () => {
    const others = ["charles", "lou", "elio", "mae", "max", "nova", "alba", "orion"] as const
    for (const agent of others) {
      expect(canSwitchToEconomy(agent)).toBe(true)
    }
  })
})
