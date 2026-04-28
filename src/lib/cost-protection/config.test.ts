import { describe, expect, it } from "vitest"
import {
  PLAN_COST_BUDGET_EUROS,
  PROTECTION_THRESHOLDS,
  TARGET_GROSS_MARGIN,
  getBudgetForPlan,
  getConsumptionRatio,
  getThresholdReached,
} from "./config"

describe("PLAN_COST_BUDGET_EUROS — invariants marge 70%", () => {
  it("budgets exacts par plan", () => {
    expect(PLAN_COST_BUDGET_EUROS.discovery).toBe(5)
    expect(PLAN_COST_BUDGET_EUROS.starter).toBe(45)
    expect(PLAN_COST_BUDGET_EUROS.pro).toBe(135)
    expect(PLAN_COST_BUDGET_EUROS.business).toBe(360)
    expect(PLAN_COST_BUDGET_EUROS.custom).toBe(750)
  })

  it("budget Starter ≈ 30% du prix (149€)", () => {
    const ratio = PLAN_COST_BUDGET_EUROS.starter / 149
    expect(ratio).toBeGreaterThan(0.29)
    expect(ratio).toBeLessThan(0.31)
  })

  it("budget Pro ≈ 30% du prix (449€)", () => {
    const ratio = PLAN_COST_BUDGET_EUROS.pro / 449
    expect(ratio).toBeGreaterThan(0.29)
    expect(ratio).toBeLessThan(0.31)
  })

  it("budget Business ≈ 30% du prix (1190€)", () => {
    const ratio = PLAN_COST_BUDGET_EUROS.business / 1190
    expect(ratio).toBeGreaterThan(0.29)
    expect(ratio).toBeLessThan(0.31)
  })

  it("TARGET_GROSS_MARGIN = 0.7 (70%)", () => {
    expect(TARGET_GROSS_MARGIN).toBe(0.7)
  })
})

describe("PROTECTION_THRESHOLDS", () => {
  it("paliers ordonnés croissants", () => {
    expect(PROTECTION_THRESHOLDS.notify_admin).toBe(0.7)
    expect(PROTECTION_THRESHOLDS.notify_client).toBe(0.9)
    expect(PROTECTION_THRESHOLDS.economy_mode).toBe(1.0)
    expect(PROTECTION_THRESHOLDS.hard_cap).toBe(1.3)

    expect(PROTECTION_THRESHOLDS.notify_admin)
      .toBeLessThan(PROTECTION_THRESHOLDS.notify_client)
    expect(PROTECTION_THRESHOLDS.notify_client)
      .toBeLessThan(PROTECTION_THRESHOLDS.economy_mode)
    expect(PROTECTION_THRESHOLDS.economy_mode)
      .toBeLessThan(PROTECTION_THRESHOLDS.hard_cap)
  })
})

describe("getBudgetForPlan", () => {
  it("retourne le bon budget", () => {
    expect(getBudgetForPlan("pro")).toBe(135)
    expect(getBudgetForPlan("custom")).toBe(750)
  })
})

describe("getConsumptionRatio", () => {
  it("calcule un ratio simple", () => {
    expect(getConsumptionRatio(67.5, 135)).toBe(0.5)
    expect(getConsumptionRatio(135, 135)).toBe(1.0)
    expect(getConsumptionRatio(175.5, 135)).toBeCloseTo(1.3, 2)
  })

  it("budget 0 → ratio 0 (pas de division par zéro)", () => {
    expect(getConsumptionRatio(50, 0)).toBe(0)
  })
})

describe("getThresholdReached", () => {
  it("détecte le palier le plus élevé franchi", () => {
    expect(getThresholdReached(0.5)).toBeNull()
    expect(getThresholdReached(0.69)).toBeNull()
    expect(getThresholdReached(0.7)).toBe("notify_admin")
    expect(getThresholdReached(0.85)).toBe("notify_admin")
    expect(getThresholdReached(0.9)).toBe("notify_client")
    expect(getThresholdReached(0.95)).toBe("notify_client")
    expect(getThresholdReached(1.0)).toBe("economy_mode")
    expect(getThresholdReached(1.15)).toBe("economy_mode")
    expect(getThresholdReached(1.3)).toBe("hard_cap")
    expect(getThresholdReached(2.0)).toBe("hard_cap")
  })

  it("ratio 0 / négatif → aucun palier", () => {
    expect(getThresholdReached(0)).toBeNull()
    expect(getThresholdReached(-0.1)).toBeNull()
  })
})
