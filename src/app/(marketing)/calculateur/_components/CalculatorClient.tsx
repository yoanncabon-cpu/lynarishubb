"use client"
import { useState } from "react"
import Link from "next/link"

export function CalculatorClient() {
  const [callsPerDay, setCallsPerDay] = useState(15)
  const [avgMinutes, setAvgMinutes] = useState(5)
  const [hourlyRate, setHourlyRate] = useState(20) // salaire secrétaire €/h

  const minutesPerMonth = callsPerDay * avgMinutes * 22 // 22 jours ouvrés
  const hoursPerMonth = minutesPerMonth / 60
  const costPerMonth = hoursPerMonth * hourlyRate
  const lynarisCost = 149 // plan Pro
  const savings = costPerMonth - lynarisCost
  const roi = Math.round((savings / lynarisCost) * 100)

  return (
    <div style={{ background: "#0A0A0B", color: "#F5F5F7", minHeight: "100vh", padding: "100px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
            Calculez vos économies avec un agent vocal IA
          </h1>
          <p style={{ fontSize: 17, color: "#A1A1AA" }}>
            En quelques secondes, estimez ce qu&apos;un agent vocal vous ferait économiser chaque mois.
          </p>
        </div>

        {/* Sliders */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "36px" }}>
          {[
            { label: "Appels entrants par jour", value: callsPerDay, set: setCallsPerDay, min: 1, max: 100, unit: "appels/jour" },
            { label: "Durée moyenne d'un appel", value: avgMinutes, set: setAvgMinutes, min: 1, max: 20, unit: "minutes" },
            { label: "Salaire secrétaire / chargé d'accueil", value: hourlyRate, set: setHourlyRate, min: 10, max: 60, unit: "€/heure" },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F7" }}>{s.label}</label>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#E86F4D" }}>{s.value} {s.unit}</span>
              </div>
              <input
                type="range"
                min={s.min} max={s.max} value={s.value}
                onChange={e => s.set(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#E86F4D", height: 4 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#52525B" }}>{s.min} {s.unit}</span>
                <span style={{ fontSize: 11, color: "#52525B" }}>{s.max} {s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Résultats */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "Temps téléphonique / mois", value: `${Math.round(hoursPerMonth)}h`, color: "#A1A1AA" },
            { label: "Coût secrétariat équivalent", value: `${Math.round(costPerMonth)} €`, color: "#F87171" },
            { label: "Économie avec Lynaris Pro", value: savings > 0 ? `${Math.round(savings)} € / mois` : "Déjà rentable", color: "#34D399" },
          ].map((r, i) => (
            <div key={i} style={{ padding: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: r.color, margin: "0 0 6px", fontVariantNumeric: "tabular-nums" }}>{r.value}</p>
              <p style={{ fontSize: 12, color: "#71717A", margin: 0, lineHeight: 1.4 }}>{r.label}</p>
            </div>
          ))}
        </div>

        {savings > 0 && (
          <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#34D399", margin: 0 }}>
              ROI estimé : +{roi}% — l&apos;agent vocal se rembourse en {Math.round(lynarisCost / (savings / 30))} jours
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ fontSize: 14, color: "#71717A", marginBottom: 20 }}>
            Ces estimations sont basées sur votre saisie. Résultat réel variable.
          </p>
          <Link
            href={`/contact?source=calculator&calls=${callsPerDay}&minutes=${avgMinutes}&savings=${Math.round(savings)}`}
            style={{ display: "inline-flex", padding: "14px 32px", borderRadius: 12, background: "#E86F4D", color: "white", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
          >
            Réserver une démo avec ces chiffres →
          </Link>
        </div>
      </div>
    </div>
  )
}
