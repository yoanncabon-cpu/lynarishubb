"use client"

import { useState, useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SliderDef {
  label: string
  min: number
  max: number
  step: number
  defaultVal: number
  suffix: string
  color: string
}

interface MetricResult {
  label: string
  value: string
  sub: string
  color: string
}

interface AgentSim {
  id: string
  label: string
  emoji: string
  color: string
  sliders: [SliderDef, SliderDef]
  planLabel: string
  planCost: number
  compute: (s1: number, s2: number) => { metrics: MetricResult[]; benefit: number }
}

// ─── Simulations par agent ────────────────────────────────────────────────────

const SIMS: AgentSim[] = [
  // ── Marine — Téléphonique ────────────────────────────────────────────────
  {
    id: "marine",
    label: "Marine — Téléphonique",
    emoji: "📞",
    color: "#22D3EE",
    planLabel: "Plan Pro",
    planCost: 199,
    sliders: [
      { label: "Appels par semaine", min: 5, max: 80, step: 5, defaultVal: 20, suffix: " appels", color: "#22D3EE" },
      { label: "Valeur d'un RDV", min: 20, max: 120, step: 5, defaultVal: 40, suffix: "€", color: "#10B981" },
    ],
    compute: (calls, apptValue) => {
      const callsPerMonth = calls * 4.3
      const minRecovered = Math.round(callsPerMonth * 5)
      const hoursRecovered = (minRecovered / 60).toFixed(1)
      const timeValue = Math.round((minRecovered / 60) * 50)
      const missedRdv = Math.round(callsPerMonth * 0.18)
      const missedValue = missedRdv * apptValue
      const benefit = timeValue + missedValue
      return {
        benefit,
        metrics: [
          { label: "Temps récupéré", value: `${minRecovered} min`, sub: `soit ${hoursRecovered}h/mois`, color: "#22D3EE" },
          { label: "RDV récupérés", value: `${missedRdv}`, sub: "manqués évités/mois", color: "#10B981" },
          { label: "Valeur estimée", value: `${benefit.toLocaleString("fr-FR")}€`, sub: "par mois", color: "#7C3AED" },
          { label: "Plan Pro", value: "199€", sub: "par mois", color: "#52525B" },
        ],
      }
    },
  },

  // ── Elio — Commercial ────────────────────────────────────────────────────
  {
    id: "elio",
    label: "Elio — Commercial",
    emoji: "🎯",
    color: "#10B981",
    planLabel: "Plan Pro",
    planCost: 199,
    sliders: [
      { label: "Prospects/mois à contacter", min: 50, max: 2000, step: 50, defaultVal: 300, suffix: " prospects", color: "#10B981" },
      { label: "Valeur d'un contrat", min: 200, max: 5000, step: 100, defaultVal: 800, suffix: "€", color: "#F59E0B" },
    ],
    compute: (prospects, contractValue) => {
      const responses = Math.round(prospects * 0.09)
      const deals = Math.round(responses * 0.15)
      const revenue = deals * contractValue
      const timeSaved = Math.round(prospects * 3 / 60) // 3 min/prospect manual
      const timeValue = timeSaved * 50
      const benefit = revenue + timeValue
      return {
        benefit,
        metrics: [
          { label: "Emails envoyés", value: prospects.toLocaleString("fr-FR"), sub: "séquences automatisées", color: "#10B981" },
          { label: "Réponses estimées", value: `${responses}`, sub: "taux de 9% B2B", color: "#22D3EE" },
          { label: "CA généré", value: `${revenue.toLocaleString("fr-FR")}€`, sub: "par mois estimé", color: "#7C3AED" },
          { label: "Plan Pro", value: "199€", sub: "par mois", color: "#52525B" },
        ],
      }
    },
  },

  // ── Lou — Contenu & SEO ──────────────────────────────────────────────────
  {
    id: "lou",
    label: "Lou — Contenu & SEO",
    emoji: "✍️",
    color: "#F472B6",
    planLabel: "Plan Pro",
    planCost: 199,
    sliders: [
      { label: "Posts / articles par semaine", min: 1, max: 20, step: 1, defaultVal: 5, suffix: " contenus", color: "#F472B6" },
      { label: "Valeur d'un client acquis", min: 100, max: 3000, step: 100, defaultVal: 500, suffix: "€", color: "#F59E0B" },
    ],
    compute: (postsPerWeek, clientValue) => {
      const postsPerMonth = Math.round(postsPerWeek * 4.3)
      const reach = postsPerMonth * 450
      const leads = Math.round(reach * 0.003)
      const clients = Math.round(leads * 0.1)
      const revenue = clients * clientValue
      const hoursAvoided = postsPerMonth * 2
      const timeValue = Math.round(hoursAvoided * 60)
      const benefit = revenue + timeValue
      return {
        benefit,
        metrics: [
          { label: "Contenus publiés", value: `${postsPerMonth}`, sub: "par mois automatiquement", color: "#F472B6" },
          { label: "Portée estimée", value: reach.toLocaleString("fr-FR"), sub: "personnes touchées/mois", color: "#22D3EE" },
          { label: "Valeur générée", value: `${benefit.toLocaleString("fr-FR")}€`, sub: "contenus + leads/mois", color: "#7C3AED" },
          { label: "Plan Pro", value: "199€", sub: "par mois", color: "#52525B" },
        ],
      }
    },
  },

  // ── Mae — Mail ───────────────────────────────────────────────────────────
  {
    id: "mae",
    label: "Mae — Mail",
    emoji: "📬",
    color: "#F59E0B",
    planLabel: "Plan Pro",
    planCost: 199,
    sliders: [
      { label: "Emails reçus par jour", min: 10, max: 200, step: 10, defaultVal: 50, suffix: " emails/j", color: "#F59E0B" },
      { label: "Votre taux horaire", min: 30, max: 150, step: 10, defaultVal: 60, suffix: "€/h", color: "#F472B6" },
    ],
    compute: (emailsPerDay, hourlyRate) => {
      const emailsPerMonth = emailsPerDay * 22
      const minSaved = Math.round(emailsPerMonth * 3 * 0.7) // Mae gère 70% auto, 3min/email
      const hoursSaved = (minSaved / 60).toFixed(1)
      const value = Math.round((minSaved / 60) * hourlyRate)
      return {
        benefit: value,
        metrics: [
          { label: "Emails triés/mois", value: emailsPerMonth.toLocaleString("fr-FR"), sub: "traités automatiquement", color: "#F59E0B" },
          { label: "Heures économisées", value: `${hoursSaved}h`, sub: "par mois (70% auto)", color: "#22D3EE" },
          { label: "Valeur temps", value: `${value.toLocaleString("fr-FR")}€`, sub: "récupérée/mois", color: "#7C3AED" },
          { label: "Plan Pro", value: "199€", sub: "par mois", color: "#52525B" },
        ],
      }
    },
  },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export function RoiCalculatorSection() {
  const [activeSimIdx, setActiveSimIdx] = useState(0)
  const sim = SIMS[activeSimIdx]!

  const [s1, setS1] = useState(sim.sliders[0].defaultVal)
  const [s2, setS2] = useState(sim.sliders[1].defaultVal)

  // Reset les sliders quand on change d'agent
  function switchSim(idx: number) {
    setActiveSimIdx(idx)
    setS1(SIMS[idx]!.sliders[0].defaultVal)
    setS2(SIMS[idx]!.sliders[1].defaultVal)
  }

  const result = useMemo(() => sim.compute(s1, s2), [sim, s1, s2])
  const netRoi = result.benefit - sim.planCost
  const weeksToRoi = netRoi > 0 ? Math.max(1, Math.round(sim.planCost / (result.benefit / 4.3))) : null

  return (
    <section className="px-4 pb-16">
      <div
        className="mx-auto max-w-4xl rounded-3xl p-8 relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        {/* Glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717A", marginBottom: 10 }}>
              Simulateur ROI
            </p>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F5F5F7", margin: 0 }}>
              Calculez votre retour sur investissement
            </h2>
          </div>

          {/* Onglets agent */}
          <div
            role="tablist"
            style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}
          >
            {SIMS.map((s, idx) => {
              const active = activeSimIdx === idx
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchSim(idx)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: "pointer", transition: "all 200ms", outline: "none",
                    border: `1px solid ${active ? s.color + "50" : "rgba(255,255,255,0.08)"}`,
                    background: active ? `${s.color}18` : "rgba(255,255,255,0.03)",
                    color: active ? s.color : "rgba(245,245,247,0.45)",
                    boxShadow: active ? `0 0 12px ${s.color}15` : "none",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Sliders */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              marginBottom: 28,
            }}
          >
            <SliderInput
              def={sim.sliders[0]}
              value={s1}
              onChange={setS1}
            />
            <SliderInput
              def={sim.sliders[1]}
              value={s2}
              onChange={setS2}
            />
          </div>

          {/* Métriques */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {result.metrics.map((m) => (
              <div
                key={m.label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 14px",
                }}
              >
                <p style={{ fontSize: 10, color: "#52525B", margin: "0 0 5px", lineHeight: 1.3 }}>{m.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: "0 0 2px", lineHeight: 1 }}>{m.value}</p>
                <p style={{ fontSize: 10, color: "#52525B", margin: 0 }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* ROI net */}
          <div
            style={{
              background: netRoi > 0 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${netRoi > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 14, padding: "18px 22px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#71717A", margin: "0 0 4px" }}>Bénéfice net estimé</p>
              <p style={{
                fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, lineHeight: 1, margin: 0,
                color: netRoi > 0 ? "#10B981" : "#EF4444",
              }}>
                {netRoi > 0 ? "+" : ""}{netRoi.toLocaleString("fr-FR")}€
                <span style={{ fontSize: 15, fontWeight: 600 }}>/mois</span>
              </p>
            </div>
            {weeksToRoi !== null && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "#A1A1AA", margin: "0 0 3px" }}>Rentable en moins de</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#10B981", margin: 0 }}>
                  {weeksToRoi} semaine{weeksToRoi > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          <p style={{ fontSize: 10, color: "#3F3F46", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
            Estimation indicative basée sur des moyennes sectorielles. Résultats réels peuvent varier selon votre activité.
          </p>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #F5F5F7; border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer; box-shadow: 0 0 6px rgba(0,0,0,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #F5F5F7; border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer; box-shadow: 0 0 6px rgba(0,0,0,0.4);
        }
      `}</style>
    </section>
  )
}

function SliderInput({ def, value, onChange }: { def: SliderDef; value: number; onChange: (v: number) => void }) {
  const pct = ((value - def.min) / (def.max - def.min)) * 100
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#A1A1AA" }}>{def.label}</label>
        <span style={{ fontSize: 18, fontWeight: 800, color: def.color, minWidth: 60, textAlign: "right" }}>
          {value.toLocaleString("fr-FR")}{def.suffix}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 4, borderRadius: 2, appearance: "none",
          background: `linear-gradient(90deg, ${def.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          cursor: "pointer", outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#52525B" }}>
        <span>{def.min.toLocaleString("fr-FR")}{def.suffix}</span>
        <span>{def.max.toLocaleString("fr-FR")}{def.suffix}</span>
      </div>
    </div>
  )
}
