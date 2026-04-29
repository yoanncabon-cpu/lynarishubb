import { describe, expect, it } from "vitest"
import {
  validateAgentSlug,
  buildAccessDeniedPayload,
} from "./instrumentation"
import type { AccessResult } from "@/lib/pricing/permissions"

describe("validateAgentSlug", () => {
  it("accepte les 9 agents officiels", () => {
    const officialAgents = [
      "marine", "charles", "lou", "elio", "mae",
      "max", "nova", "alba", "orion",
    ]
    for (const slug of officialAgents) {
      expect(validateAgentSlug(slug)).toBe(slug)
    }
  })

  it("rejette les agents inconnus / custom", () => {
    expect(validateAgentSlug("custom-agent-1")).toBeNull()
    expect(validateAgentSlug("aria")).toBeNull() // pas dans AGENT_SLUGS officiel
    expect(validateAgentSlug("")).toBeNull()
    expect(validateAgentSlug("MARINE")).toBeNull() // case-sensitive
  })

  it("rejette les inputs malformés", () => {
    expect(validateAgentSlug("../etc/passwd")).toBeNull()
    expect(validateAgentSlug("'; DROP TABLE")).toBeNull()
  })
})

describe("buildAccessDeniedPayload", () => {
  it("formate un refus standard avec upgradeUrl", () => {
    const access: AccessResult = {
      allowed: false,
      reason: "Marine nécessite le plan Pro ou supérieur",
      upgradeTo: "pro",
    }
    const payload = buildAccessDeniedPayload(access)
    expect(payload.error).toBe("PLAN_LIMIT_REACHED")
    expect(payload.reason).toBe("Marine nécessite le plan Pro ou supérieur")
    expect(payload.upgradeTo).toBe("pro")
    expect(payload.upgradeUrl).toBe("/dashboard/billing?upgrade=pro")
    expect(payload.planName).toBe("Pro")
  })

  it("formate vers Business", () => {
    const access: AccessResult = {
      allowed: false,
      reason: "Quota dépassé",
      upgradeTo: "business",
    }
    const payload = buildAccessDeniedPayload(access)
    expect(payload.upgradeTo).toBe("business")
    expect(payload.upgradeUrl).toBe("/dashboard/billing?upgrade=business")
    expect(payload.planName).toBe("Business")
  })

  it("formate vers Sur-mesure", () => {
    const access: AccessResult = {
      allowed: false,
      reason: "Volume illimité requis",
      upgradeTo: "custom",
    }
    const payload = buildAccessDeniedPayload(access)
    expect(payload.upgradeTo).toBe("custom")
    expect(payload.planName).toBe("Sur-mesure")
  })

  it("retourne un payload vide cohérent si access.allowed = true (edge case)", () => {
    const access: AccessResult = { allowed: true }
    const payload = buildAccessDeniedPayload(access)
    expect(payload.error).toBe("PLAN_LIMIT_REACHED")
    expect(payload.upgradeTo).toBeNull()
    expect(payload.planName).toBeNull()
    expect(payload.upgradeUrl).toBe("/dashboard/billing")
  })
})
