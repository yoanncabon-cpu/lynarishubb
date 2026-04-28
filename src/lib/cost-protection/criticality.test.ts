import { describe, expect, it } from "vitest"
import {
  getCriticality,
  isCriticalAction,
  isAllowedInEconomyMode,
} from "./criticality"

describe("Criticality — Marine voice", () => {
  it("Marine voice_inbound TOUJOURS critical (règle absolue)", () => {
    expect(getCriticality("marine", "voice_inbound")).toBe("critical")
    expect(isCriticalAction("marine", "voice_inbound")).toBe(true)
  })

  it("Marine voice_outbound critical (rappels qualifiés)", () => {
    expect(getCriticality("marine", "voice_outbound")).toBe("critical")
    expect(isCriticalAction("marine", "voice_outbound")).toBe(true)
  })

  it("Marine chat reste standard", () => {
    expect(getCriticality("marine", "chat")).toBe("standard")
    expect(isCriticalAction("marine", "chat")).toBe(false)
  })
})

describe("Criticality — Max images/vidéos = optional", () => {
  it("Max image_gen et video_gen optionnels", () => {
    expect(getCriticality("max", "image_gen")).toBe("optional")
    expect(getCriticality("max", "video_gen")).toBe("optional")
    expect(isAllowedInEconomyMode("max", "image_gen")).toBe(false)
  })
})

describe("Criticality — Orion automation = optional", () => {
  it("Orion automation optionnel (l'utilisateur peut attendre)", () => {
    expect(getCriticality("orion", "automation")).toBe("optional")
    expect(isAllowedInEconomyMode("orion", "automation")).toBe(false)
  })
})

describe("Criticality — agents secondaires = standard", () => {
  it("Charles / Lou / Elio / Mae / Nova / Alba = standard", () => {
    expect(getCriticality("charles", "chat")).toBe("standard")
    expect(getCriticality("lou", "content_gen")).toBe("standard")
    expect(getCriticality("elio", "email_send")).toBe("standard")
    expect(getCriticality("mae", "email_send")).toBe("standard")
    expect(getCriticality("nova", "analysis")).toBe("standard")
    expect(getCriticality("alba", "chat")).toBe("standard")
  })
})

describe("Fallback : action non définie → standard", () => {
  it("Charles voice_inbound (combinaison non définie) → standard", () => {
    expect(getCriticality("charles", "voice_inbound")).toBe("standard")
  })
})

describe("isAllowedInEconomyMode", () => {
  it("critical et standard passent en mode économie", () => {
    expect(isAllowedInEconomyMode("marine", "voice_inbound")).toBe(true) // critical
    expect(isAllowedInEconomyMode("charles", "chat")).toBe(true) // standard
  })

  it("optional bloqué en mode économie", () => {
    expect(isAllowedInEconomyMode("max", "image_gen")).toBe(false)
    expect(isAllowedInEconomyMode("orion", "automation")).toBe(false)
  })
})
