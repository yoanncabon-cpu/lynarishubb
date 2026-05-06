import { describe, expect, it } from "vitest"
import {
  canUseAgent,
  canAddTeamMember,
  canConsumeVoiceMinutes,
  canConsumeActions,
  canUseIntegration,
  canAddRagDoc,
  canRequestCustomAgent,
  hasFeature,
  type AccessResult,
} from "./permissions"
import type { AgentSlug } from "./plans"

const expectAllowed = (r: AccessResult): void => {
  expect(r.allowed).toBe(true)
}

const expectDenied = (r: AccessResult, expectedUpgrade: string): void => {
  expect(r.allowed).toBe(false)
  if (!r.allowed) {
    expect(r.upgradeTo).toBe(expectedUpgrade)
    expect(r.reason.length).toBeGreaterThan(0)
  }
}

// ─── canUseAgent ─────────────────────────────────────────────────────────────

describe("canUseAgent", () => {
  it("Découverte autorise tous les agents", () => {
    expectAllowed(canUseAgent("discovery", "marine"))
    expectAllowed(canUseAgent("discovery", "charles"))
    expectAllowed(canUseAgent("discovery", "elio"))
  })

  it("Starter REFUSE Marine et propose Pro", () => {
    expectDenied(canUseAgent("starter", "marine"), "pro")
  })

  it("Starter autorise 3 agents max (hors Marine)", () => {
    expectAllowed(canUseAgent("starter", "charles", []))
    expectAllowed(canUseAgent("starter", "elio", ["charles"]))
    expectAllowed(canUseAgent("starter", "lou", ["charles", "elio"]))
    // 3 déjà sélectionnés, on ajoute un 4e → refus
    expectDenied(
      canUseAgent("starter", "mae", ["charles", "elio", "lou"]),
      "pro"
    )
  })

  it("Starter autorise un agent déjà sélectionné même si limite atteinte", () => {
    // L'agent "elio" est déjà dans la liste → autorisé sans incrément
    expectAllowed(
      canUseAgent("starter", "elio", ["charles", "elio", "lou"])
    )
  })

  it("Pro / Business / Custom autorisent tous les agents", () => {
    const agents: AgentSlug[] = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba"]
    for (const agent of agents) {
      expectAllowed(canUseAgent("pro", agent))
      expectAllowed(canUseAgent("business", agent))
      expectAllowed(canUseAgent("custom", agent))
    }
  })
})

// ─── canAddTeamMember ────────────────────────────────────────────────────────

describe("canAddTeamMember", () => {
  it("Découverte / Starter limités à 1 membre", () => {
    expectAllowed(canAddTeamMember("discovery", 0))
    expectDenied(canAddTeamMember("discovery", 1), "starter")
    expectAllowed(canAddTeamMember("starter", 0))
    expectDenied(canAddTeamMember("starter", 1), "pro")
  })

  it("Pro limité à 3 membres", () => {
    expectAllowed(canAddTeamMember("pro", 0))
    expectAllowed(canAddTeamMember("pro", 2))
    expectDenied(canAddTeamMember("pro", 3), "business")
  })

  it("Business limité à 8 membres", () => {
    expectAllowed(canAddTeamMember("business", 7))
    expectDenied(canAddTeamMember("business", 8), "custom")
  })

  it("Sur-mesure : illimité", () => {
    expectAllowed(canAddTeamMember("custom", 999))
  })
})

// ─── canConsumeVoiceMinutes ──────────────────────────────────────────────────

describe("canConsumeVoiceMinutes", () => {
  it("Découverte : 30 min/mois", () => {
    expectAllowed(canConsumeVoiceMinutes("discovery", 0, 30))
    expectAllowed(canConsumeVoiceMinutes("discovery", 29, 1))
    expectDenied(canConsumeVoiceMinutes("discovery", 30, 1), "starter")
  })

  it("Starter : 0 min, REFUSÉ avec message option pack", () => {
    const r = canConsumeVoiceMinutes("starter", 0, 1)
    expectDenied(r, "pro")
    if (!r.allowed) {
      expect(r.reason).toMatch(/option/i)
      expect(r.reason).toMatch(/99/)
    }
  })

  it("Pro : 400 min/mois, suggère Business si dépassement", () => {
    expectAllowed(canConsumeVoiceMinutes("pro", 0, 400))
    expectAllowed(canConsumeVoiceMinutes("pro", 399, 1))
    expectDenied(canConsumeVoiceMinutes("pro", 400, 1), "business")
  })

  it("Business : 1500 min/mois, suggère Sur-mesure", () => {
    expectAllowed(canConsumeVoiceMinutes("business", 0, 1500))
    expectDenied(canConsumeVoiceMinutes("business", 1500, 1), "custom")
  })

  it("Sur-mesure : illimité", () => {
    expectAllowed(canConsumeVoiceMinutes("custom", 99999, 999))
  })
})

// ─── canConsumeActions ───────────────────────────────────────────────────────

describe("canConsumeActions", () => {
  it("Découverte : 50 actions/mois", () => {
    expectAllowed(canConsumeActions("discovery", 0))
    expectAllowed(canConsumeActions("discovery", 49))
    expectDenied(canConsumeActions("discovery", 50), "starter")
  })

  it("Starter : 1200 actions", () => {
    expectAllowed(canConsumeActions("starter", 1199))
    expectDenied(canConsumeActions("starter", 1200), "pro")
  })

  it("Pro : 4000 actions, batch de 5 testé", () => {
    expectAllowed(canConsumeActions("pro", 3995, 5))
    expectDenied(canConsumeActions("pro", 3996, 5), "business")
  })

  it("Business : 12000 actions", () => {
    expectAllowed(canConsumeActions("business", 11999))
    expectDenied(canConsumeActions("business", 12000), "custom")
  })

  it("Sur-mesure : illimité", () => {
    expectAllowed(canConsumeActions("custom", 999999, 100))
  })
})

// ─── canUseIntegration ───────────────────────────────────────────────────────

describe("canUseIntegration", () => {
  it("google_calendar disponible partout", () => {
    expectAllowed(canUseIntegration("discovery", "google_calendar"))
    expectAllowed(canUseIntegration("starter", "google_calendar"))
    expectAllowed(canUseIntegration("pro", "google_calendar"))
  })

  it("stripe disponible Pro+", () => {
    expectDenied(canUseIntegration("starter", "stripe"), "pro")
    expectAllowed(canUseIntegration("pro", "stripe"))
    expectAllowed(canUseIntegration("business", "stripe"))
  })

  it("whatsapp_business disponible Business+", () => {
    expectDenied(canUseIntegration("pro", "whatsapp_business"), "business")
    expectAllowed(canUseIntegration("business", "whatsapp_business"))
    expectAllowed(canUseIntegration("custom", "whatsapp_business"))
  })

  it("private_api uniquement Sur-mesure", () => {
    expectDenied(canUseIntegration("business", "private_api"), "custom")
    expectAllowed(canUseIntegration("custom", "private_api"))
  })

  it("intégration inexistante → refus + suggestion custom", () => {
    expectDenied(
      canUseIntegration("pro", "salesforce_inexistant"),
      "custom"
    )
  })
})

// ─── canAddRagDoc ────────────────────────────────────────────────────────────

describe("canAddRagDoc", () => {
  it("Découverte : 0 docs (RAG non disponible)", () => {
    expectDenied(canAddRagDoc("discovery", 0), "starter")
  })

  it("Starter : 250 docs", () => {
    expectAllowed(canAddRagDoc("starter", 0))
    expectAllowed(canAddRagDoc("starter", 249))
    expectDenied(canAddRagDoc("starter", 250), "pro")
  })

  it("Pro : 2000 docs", () => {
    expectAllowed(canAddRagDoc("pro", 1999))
    expectDenied(canAddRagDoc("pro", 2000), "business")
  })

  it("Business : 10000 docs", () => {
    expectAllowed(canAddRagDoc("business", 9999))
    expectDenied(canAddRagDoc("business", 10000), "custom")
  })

  it("Sur-mesure : illimité", () => {
    expectAllowed(canAddRagDoc("custom", 999999))
  })
})

// ─── canRequestCustomAgent ───────────────────────────────────────────────────

describe("canRequestCustomAgent", () => {
  it("Découverte / Starter / Pro : custom non disponible", () => {
    expectDenied(canRequestCustomAgent("discovery"), "business")
    expectDenied(canRequestCustomAgent("starter"), "business")
    expectDenied(canRequestCustomAgent("pro"), "business")
  })

  it("Business : 1 custom max", () => {
    expectAllowed(canRequestCustomAgent("business", 0))
    expectDenied(canRequestCustomAgent("business", 1), "custom")
  })

  it("Sur-mesure : illimité", () => {
    expectAllowed(canRequestCustomAgent("custom", 999))
  })
})

// ─── hasFeature ──────────────────────────────────────────────────────────────

describe("hasFeature", () => {
  it("voice_marine : Starter NON, autres OUI", () => {
    expect(hasFeature("discovery", "voice_marine")).toBe(true)
    expect(hasFeature("starter", "voice_marine")).toBe(false)
    expect(hasFeature("pro", "voice_marine")).toBe(true)
    expect(hasFeature("business", "voice_marine")).toBe(true)
    expect(hasFeature("custom", "voice_marine")).toBe(true)
  })

  it("rag : Découverte NON, autres OUI", () => {
    expect(hasFeature("discovery", "rag")).toBe(false)
    expect(hasFeature("starter", "rag")).toBe(true)
    expect(hasFeature("pro", "rag")).toBe(true)
  })

  it("custom_agent : Business / Custom uniquement", () => {
    expect(hasFeature("discovery", "custom_agent")).toBe(false)
    expect(hasFeature("starter", "custom_agent")).toBe(false)
    expect(hasFeature("pro", "custom_agent")).toBe(false)
    expect(hasFeature("business", "custom_agent")).toBe(true)
    expect(hasFeature("custom", "custom_agent")).toBe(true)
  })

  it("uptime_sla : Pro+ uniquement", () => {
    expect(hasFeature("discovery", "uptime_sla")).toBe(false)
    expect(hasFeature("starter", "uptime_sla")).toBe(false)
    expect(hasFeature("pro", "uptime_sla")).toBe(true)
    expect(hasFeature("business", "uptime_sla")).toBe(true)
    expect(hasFeature("custom", "uptime_sla")).toBe(true)
  })
})

// ─── Matrice complète plan × action (régression) ─────────────────────────────

describe("Matrice plan × action — invariants critiques", () => {
  it("Toutes les fonctions retournent un AccessResult valide (jamais throw)", () => {
    const plans = ["discovery", "starter", "pro", "business", "custom"] as const
    const agents: AgentSlug[] = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba"]

    for (const plan of plans) {
      for (const agent of agents) {
        const r = canUseAgent(plan, agent)
        expect(typeof r.allowed).toBe("boolean")
        if (!r.allowed) {
          expect(typeof r.reason).toBe("string")
          expect(typeof r.upgradeTo).toBe("string")
        }
      }
      // Les autres helpers doivent aussi répondre sans throw
      expect(typeof canAddTeamMember(plan, 0).allowed).toBe("boolean")
      expect(typeof canConsumeVoiceMinutes(plan, 0, 1).allowed).toBe("boolean")
      expect(typeof canConsumeActions(plan, 0).allowed).toBe("boolean")
      expect(typeof canUseIntegration(plan, "google_calendar").allowed).toBe("boolean")
      expect(typeof canAddRagDoc(plan, 0).allowed).toBe("boolean")
      expect(typeof canRequestCustomAgent(plan).allowed).toBe("boolean")
    }
  })
})
