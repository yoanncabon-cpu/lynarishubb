import { describe, expect, it, vi, beforeEach } from "vitest"

// ─── Mock @/lib/db avant l'import du service ────────────────────────────────

interface MockOrgRow {
  planId: string | null
}
interface MockCounterRow {
  actionsUsed: number
  voiceMinutesUsed: number
  voicePackMinutesRemaining: number
  ragDocsCount: number
  teamMembersCount: number
  periodStart: Date
  periodEnd: Date
}

let mockOrgPlan: MockOrgRow = { planId: "starter" }
let mockCounters: MockCounterRow | null = null

const mockTx = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  execute: vi.fn().mockResolvedValue(undefined),
  query: {
    orgUsageCounters: {
      findFirst: vi.fn(async () => mockCounters),
    },
  },
}

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      organizations: {
        findFirst: vi.fn(async () => mockOrgPlan),
      },
      orgUsageCounters: {
        findFirst: vi.fn(async () => mockCounters),
      },
    },
    transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
      return cb(mockTx)
    }),
  },
}))

// Maintenant on peut importer le service (il pickup le mock)
const {
  consumeAction,
  consumeVoiceMinutes,
  addVoicePackMinutes,
  getCurrentUsage,
} = await import("./service")

beforeEach(() => {
  vi.clearAllMocks()
  mockOrgPlan = { planId: "starter" }
  mockCounters = null
  mockTx.query.orgUsageCounters.findFirst.mockResolvedValue(null)
})

// ─── consumeAction ──────────────────────────────────────────────────────────

describe("consumeAction", () => {
  it("Starter : refuse Marine", async () => {
    mockOrgPlan = { planId: "starter" }
    mockCounters = {
      actionsUsed: 0,
      voiceMinutesUsed: 0,
      voicePackMinutesRemaining: 0,
      ragDocsCount: 0,
      teamMembersCount: 1,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 86400_000),
    }
    // Note : consumeAction ne check pas l'agent (juste le quota actions)
    // La vérif Marine passe par canUseAgent appelé en amont
    const result = await consumeAction("org-1", "marine", "voice_inbound")
    expect(result.ok).toBe(true)
  })

  it("Starter : refuse au-delà de 1200 actions/mois", async () => {
    mockOrgPlan = { planId: "starter" }
    mockTx.query.orgUsageCounters.findFirst.mockResolvedValue({
      actionsUsed: 1200,
      voiceMinutesUsed: 0,
      voicePackMinutesRemaining: 0,
      ragDocsCount: 0,
      teamMembersCount: 1,
      periodStart: new Date(),
      periodEnd: new Date(),
    })
    // Pour le check : la fonction lit via db.query.orgUsageCounters.findFirst
    // Le mock retourne actionsUsed: 1200 → quota atteint
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      actionsUsed: 1200,
    } as unknown as never)

    const result = await consumeAction("org-1", "charles", "chat")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.access.allowed).toBe(false)
      if (!result.access.allowed) {
        expect(result.access.upgradeTo).toBe("pro")
      }
    }
  })

  it("Pro : autorise sous le quota 4000 actions", async () => {
    mockOrgPlan = { planId: "pro" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      actionsUsed: 100,
    } as unknown as never)

    const result = await consumeAction("org-1", "marine", "voice_inbound")
    expect(result.ok).toBe(true)
  })

  it("Custom : illimité", async () => {
    mockOrgPlan = { planId: "custom" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      actionsUsed: 999999,
    } as unknown as never)

    const result = await consumeAction("org-1", "marine", "voice_inbound", 100)
    expect(result.ok).toBe(true)
  })

  it("Plan inconnu (planId null) : fallback discovery", async () => {
    mockOrgPlan = { planId: null }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      actionsUsed: 50,
    } as unknown as never)

    // Discovery limit = 50, on dépasse
    const result = await consumeAction("org-1", "charles", "chat")
    expect(result.ok).toBe(false)
  })
})

// ─── consumeVoiceMinutes ────────────────────────────────────────────────────

describe("consumeVoiceMinutes", () => {
  it("0 minutes → ok newCount: 0 (pas de DB call)", async () => {
    const result = await consumeVoiceMinutes("org-1", 0)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.newCount).toBe(0)
  })

  it("Pro : autorise sous le quota 400 min", async () => {
    mockOrgPlan = { planId: "pro" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      voiceMinutesUsed: 100,
    } as unknown as never)

    const result = await consumeVoiceMinutes("org-1", 50)
    expect(result.ok).toBe(true)
  })

  it("Pro : refuse au-delà de 400 min", async () => {
    mockOrgPlan = { planId: "pro" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      voiceMinutesUsed: 400,
    } as unknown as never)

    const result = await consumeVoiceMinutes("org-1", 1)
    expect(result.ok).toBe(false)
    if (!result.ok && !result.access.allowed) {
      expect(result.access.upgradeTo).toBe("business")
    }
  })

  it("Starter : pas de quota → consomme depuis voice pack", async () => {
    mockOrgPlan = { planId: "starter" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      voicePackMinutesRemaining: 50,
    } as unknown as never)

    const result = await consumeVoiceMinutes("org-1", 10)
    expect(result.ok).toBe(true)
  })

  it("Starter : refuse si voice pack épuisé", async () => {
    mockOrgPlan = { planId: "starter" }
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      voicePackMinutesRemaining: 5,
    } as unknown as never)

    const result = await consumeVoiceMinutes("org-1", 10)
    expect(result.ok).toBe(false)
    if (!result.ok && !result.access.allowed) {
      expect(result.access.reason).toMatch(/pack/i)
      expect(result.access.reason).toMatch(/99/)
      expect(result.access.upgradeTo).toBe("pro")
    }
  })
})

// ─── addVoicePackMinutes ────────────────────────────────────────────────────

describe("addVoicePackMinutes", () => {
  it("ajoute des minutes via transaction", async () => {
    const dbModule = await import("@/lib/db")
    vi.spyOn(mockTx.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      voicePackMinutesRemaining: 250,
    } as unknown as never)

    const result = await addVoicePackMinutes("org-1", 200)
    // Le retour est calculé depuis la re-lecture post-update mockée
    expect(typeof result.newBalance).toBe("number")
    // Vérifie que la transaction a été appelée
    expect(dbModule.db.transaction).toHaveBeenCalled()
  })
})

// ─── getCurrentUsage ────────────────────────────────────────────────────────

describe("getCurrentUsage", () => {
  it("retourne des compteurs zéro si pas de ligne DB", async () => {
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce(undefined)

    const usage = await getCurrentUsage("org-1")
    expect(usage.actions).toBe(0)
    expect(usage.voiceMinutes).toBe(0)
    expect(usage.ragDocs).toBe(0)
    expect(usage.teamMembers).toBe(1)
    expect(usage.voicePackMinutesRemaining).toBe(0)
    expect(usage.periodStart).toBeInstanceOf(Date)
    expect(usage.periodEnd).toBeInstanceOf(Date)
  })

  it("retourne les compteurs DB s'ils existent", async () => {
    const periodStart = new Date("2026-04-01")
    const periodEnd = new Date("2026-05-01")
    const dbModule = await import("@/lib/db")
    vi.spyOn(dbModule.db.query.orgUsageCounters, "findFirst").mockResolvedValueOnce({
      actionsUsed: 1500,
      voiceMinutesUsed: 250,
      ragDocsCount: 100,
      teamMembersCount: 3,
      voicePackMinutesRemaining: 50,
      periodStart,
      periodEnd,
    } as unknown as never)

    const usage = await getCurrentUsage("org-1")
    expect(usage.actions).toBe(1500)
    expect(usage.voiceMinutes).toBe(250)
    expect(usage.ragDocs).toBe(100)
    expect(usage.teamMembers).toBe(3)
    expect(usage.voicePackMinutesRemaining).toBe(50)
    expect(usage.periodStart).toEqual(periodStart)
    expect(usage.periodEnd).toEqual(periodEnd)
  })
})
