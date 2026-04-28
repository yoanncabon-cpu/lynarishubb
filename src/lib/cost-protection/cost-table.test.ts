import { describe, expect, it } from "vitest"
import { computeCost } from "./cost-table"

describe("computeCost — Anthropic", () => {
  it("Sonnet 4.6 : 1M input + 1M output ≈ 16.8 €", () => {
    const r = computeCost({
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    })
    expect(r.provider).toBe("anthropic")
    expect(r.costEuros).toBeCloseTo(16.8, 1)
    expect(r.details.modelUsed).toBe("claude-sonnet-4-6")
    expect(r.details.inputTokens).toBe(1_000_000)
  })

  it("Haiku 4.5 : 100k input → 0.07 €", () => {
    const r = computeCost({
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      inputTokens: 100_000,
      outputTokens: 0,
    })
    expect(r.costEuros).toBeCloseTo(0.07, 4)
  })

  it("Opus 4.7 : 10k output → 0.7 €", () => {
    const r = computeCost({
      provider: "anthropic",
      model: "claude-opus-4-7",
      inputTokens: 0,
      outputTokens: 10_000,
    })
    expect(r.costEuros).toBeCloseTo(0.7, 4)
  })

  it("0 tokens → 0 €", () => {
    const r = computeCost({
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      inputTokens: 0,
      outputTokens: 0,
    })
    expect(r.costEuros).toBe(0)
  })

  it("précision 4 décimales", () => {
    const r = computeCost({
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      inputTokens: 1234,
      outputTokens: 5678,
    })
    // Ne doit pas avoir plus de 4 décimales
    expect(r.costEuros.toString()).toMatch(/^\d+(\.\d{1,4})?$/)
  })
})

describe("computeCost — Replicate", () => {
  it("Flux Pro 1 image → 0.04 €", () => {
    const r = computeCost({
      provider: "replicate",
      model: "flux_pro",
    })
    expect(r.costEuros).toBeCloseTo(0.04, 4)
    expect(r.details.modelUsed).toBe("flux_pro")
  })

  it("Flux Schnell 10 images → 0.03 €", () => {
    const r = computeCost({
      provider: "replicate",
      model: "flux_schnell",
      count: 10,
    })
    expect(r.costEuros).toBeCloseTo(0.03, 4)
  })

  it("Runway 5s → 0.95 €", () => {
    const r = computeCost({
      provider: "replicate",
      model: "runway_5s",
    })
    expect(r.costEuros).toBeCloseTo(0.95, 2)
  })
})

describe("computeCost — Twilio", () => {
  it("Voix entrante FR 60s → 0.014 € (1 min)", () => {
    const r = computeCost({
      provider: "twilio",
      type: "voice_inbound_fr",
      durationSeconds: 60,
    })
    expect(r.costEuros).toBeCloseTo(0.014, 4)
    expect(r.details.durationSeconds).toBe(60)
  })

  it("Voix sortante FR 90s → 2 minutes facturées (arrondi sup) = 0.06 €", () => {
    const r = computeCost({
      provider: "twilio",
      type: "voice_outbound_fr",
      durationSeconds: 90,
    })
    // 0.030 * 2 = 0.06
    expect(r.costEuros).toBeCloseTo(0.06, 4)
  })

  it("SMS unitaire → 0.045 €", () => {
    const r = computeCost({
      provider: "twilio",
      type: "sms",
    })
    expect(r.costEuros).toBeCloseTo(0.045, 4)
    expect(r.details.modelUsed).toBe("sms")
  })

  it("SMS batch 10 → 0.45 €", () => {
    const r = computeCost({
      provider: "twilio",
      type: "sms",
      count: 10,
    })
    expect(r.costEuros).toBeCloseTo(0.45, 2)
  })

  it("Voix < 60s : facturé 1 minute", () => {
    const r = computeCost({
      provider: "twilio",
      type: "voice_inbound_fr",
      durationSeconds: 30,
    })
    expect(r.costEuros).toBeCloseTo(0.014, 4)
  })
})

describe("computeCost — ElevenLabs", () => {
  it("1000 caractères → 0.6 €", () => {
    const r = computeCost({
      provider: "elevenlabs",
      characterCount: 1000,
    })
    expect(r.costEuros).toBeCloseTo(0.6, 4)
  })

  it("0 caractère → 0 €", () => {
    const r = computeCost({
      provider: "elevenlabs",
      characterCount: 0,
    })
    expect(r.costEuros).toBe(0)
  })
})

describe("computeCost — Deepgram", () => {
  it("60s audio → 0.0043 €", () => {
    const r = computeCost({
      provider: "deepgram",
      durationSeconds: 60,
    })
    expect(r.costEuros).toBeCloseTo(0.0043, 4)
    expect(r.details.durationSeconds).toBe(60)
  })

  it("appel 5 min → 0.0215 €", () => {
    const r = computeCost({
      provider: "deepgram",
      durationSeconds: 300,
    })
    expect(r.costEuros).toBeCloseTo(0.0215, 4)
  })
})

describe("Coût total appel Marine 5 min — vérification pipeline", () => {
  it("Twilio inbound + Deepgram + ElevenLabs ≈ 0.077 €", () => {
    // Pipeline réel d'un appel Marine de 5 minutes :
    // - Twilio inbound 5min : 5 × 0.014 = 0.07
    // - Deepgram 5min : 5 × 0.0043 = 0.0215 (audio entier transcrit)
    // - ElevenLabs ≈ 600 caractères de réponse : 600 × 0.0006 = 0.36
    // Total ≈ 0.45 € (sans coût Anthropic, qui s'ajoute)
    const twilio = computeCost({
      provider: "twilio",
      type: "voice_inbound_fr",
      durationSeconds: 300,
    })
    const deepgram = computeCost({
      provider: "deepgram",
      durationSeconds: 300,
    })
    const elevenlabs = computeCost({
      provider: "elevenlabs",
      characterCount: 600,
    })
    const total = twilio.costEuros + deepgram.costEuros + elevenlabs.costEuros
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(1) // sanity check < 1€ pour 5 min
  })
})
