import { describe, expect, it, vi } from "vitest"
import { computeFlagUpdates } from "./service"
import {
  dispatchNotification,
  stubNotificationProvider,
  type NotificationContext,
} from "./notifications"

// ─── computeFlagUpdates : matrice de paliers + idempotence ──────────────────

const initialState = {
  notifiedAdmin70: false,
  notifiedClient90: false,
  alertedAdmin100: false,
  alertedAdmin130: false,
  economyModeActive: false,
  hardCapActive: false,
}

describe("computeFlagUpdates — paliers", () => {
  it("ratio 0.5 : aucun palier franchi", () => {
    const r = computeFlagUpdates(0.5, initialState)
    expect(r.thresholdsToNotify).toEqual([])
    expect(r.updates).toEqual({})
  })

  it("ratio 0.7 : seuil notify_admin franchi", () => {
    const r = computeFlagUpdates(0.7, initialState)
    expect(r.thresholdsToNotify).toEqual(["notify_admin"])
    expect(r.updates.notifiedAdmin70).toBe(true)
  })

  it("ratio 0.9 : seuil notify_client franchi (et admin déjà compris)", () => {
    const r = computeFlagUpdates(0.9, initialState)
    expect(r.thresholdsToNotify).toContain("notify_admin")
    expect(r.thresholdsToNotify).toContain("notify_client")
    expect(r.updates.notifiedAdmin70).toBe(true)
    expect(r.updates.notifiedClient90).toBe(true)
  })

  it("ratio 1.0 : tous les paliers jusqu'à economy_mode", () => {
    const r = computeFlagUpdates(1.0, initialState)
    expect(r.thresholdsToNotify).toContain("economy_mode")
    expect(r.updates.alertedAdmin100).toBe(true)
  })

  it("ratio 1.5 : tous les paliers franchis", () => {
    const r = computeFlagUpdates(1.5, initialState)
    expect(r.thresholdsToNotify).toContain("notify_admin")
    expect(r.thresholdsToNotify).toContain("notify_client")
    expect(r.thresholdsToNotify).toContain("economy_mode")
    expect(r.thresholdsToNotify).toContain("hard_cap")
    expect(r.updates.alertedAdmin130).toBe(true)
  })
})

describe("computeFlagUpdates — idempotence", () => {
  it("flags déjà marqués → pas de re-notification", () => {
    const alreadyNotified = {
      ...initialState,
      notifiedAdmin70: true,
      notifiedClient90: true,
    }
    const r = computeFlagUpdates(0.95, alreadyNotified)
    // 70% et 90% déjà notifiés, on ne re-déclenche pas
    expect(r.thresholdsToNotify).toEqual([])
    expect(r.updates.notifiedAdmin70).toBeUndefined()
    expect(r.updates.notifiedClient90).toBeUndefined()
  })

  it("partiel : 70% déjà fait, 90% à déclencher", () => {
    const partial = { ...initialState, notifiedAdmin70: true }
    const r = computeFlagUpdates(0.92, partial)
    expect(r.thresholdsToNotify).toEqual(["notify_client"])
    expect(r.updates.notifiedClient90).toBe(true)
  })
})

describe("computeFlagUpdates — Mode ALERTE vs ACTIF", () => {
  it("Mode ALERTE (env défaut) : flags marqués mais economy/hardcap NON activés", () => {
    // En mode ALERTE (défaut), isAutoSwitchEnabled() = false
    // Donc flags notification marqués mais pas economyModeActive/hardCapActive
    const r = computeFlagUpdates(1.5, initialState)
    expect(r.updates.alertedAdmin100).toBe(true)
    expect(r.updates.alertedAdmin130).toBe(true)
    expect(r.updates.economyModeActive).toBeUndefined()
    expect(r.updates.hardCapActive).toBeUndefined()
  })
})

// ─── dispatchNotification : tests sur stub ──────────────────────────────────

const ctx: NotificationContext = {
  orgId: "00000000-0000-0000-0000-000000000001",
  orgName: "Cabinet Test",
  planId: "pro",
  currentCostEuros: 95,
  budgetEuros: 135,
  ratio: 0.7,
}

describe("dispatchNotification — provider stub", () => {
  it("notify_admin → notifyAdmin70 appelé", async () => {
    const spy = vi.spyOn(stubNotificationProvider, "notifyAdmin70")
    await dispatchNotification(stubNotificationProvider, "notify_admin", ctx)
    expect(spy).toHaveBeenCalledWith(ctx)
    spy.mockRestore()
  })

  it("notify_client → admin90 + client upsell tous les deux appelés", async () => {
    const spyAdmin = vi.spyOn(stubNotificationProvider, "notifyAdmin90")
    const spyClient = vi.spyOn(stubNotificationProvider, "notifyClientUpsell90")
    await dispatchNotification(stubNotificationProvider, "notify_client", ctx)
    expect(spyAdmin).toHaveBeenCalledWith(ctx)
    expect(spyClient).toHaveBeenCalledWith(ctx)
    spyAdmin.mockRestore()
    spyClient.mockRestore()
  })

  it("economy_mode → alertAdmin100", async () => {
    const spy = vi.spyOn(stubNotificationProvider, "alertAdmin100")
    await dispatchNotification(stubNotificationProvider, "economy_mode", ctx)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it("hard_cap → alertAdmin130", async () => {
    const spy = vi.spyOn(stubNotificationProvider, "alertAdmin130")
    await dispatchNotification(stubNotificationProvider, "hard_cap", ctx)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
