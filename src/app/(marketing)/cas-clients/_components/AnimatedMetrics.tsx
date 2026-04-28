"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"
import { NumberTicker } from "@/components/shared/NumberTicker"

interface Metric {
  value: number | null
  staticDisplay: string
  label: string
  sub: string
  color: string
  suffix?: string
  prefix?: string
}

const METRICS: Metric[] = [
  {
    value: 87,
    staticDisplay: "87 min",
    label: "récupérées par semaine",
    sub: "Appels gérés par Marine pendant les séances",
    color: "#22D3EE",
    suffix: " min",
  },
  {
    value: null,
    staticDisplay: "0",
    label: "appels manqués",
    sub: "Marine décroche à la première sonnerie, 24h/24",
    color: "#10B981",
  },
  {
    value: 48,
    staticDisplay: "48 h",
    label: "délai d'activation",
    sub: "De la signature au premier appel géré par l'IA",
    color: "#7C3AED",
    suffix: " h",
  },
  {
    value: null,
    staticDisplay: "24/7",
    label: "disponibilité",
    sub: "Week-ends et jours fériés inclus, sans surcoût",
    color: "#F59E0B",
  },
]

export function AnimatedMetrics() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {METRICS.map((m) => (
        <MetricCard key={m.label} metric={m} />
      ))}
    </div>
  )
}

function MetricCard({ metric: m }: { metric: Metric }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <div
      ref={ref}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${m.color}25`,
        borderRadius: 16,
        padding: "24px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Barre de couleur en haut */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${m.color}80, transparent)`,
        }}
      />

      <div
        style={{
          fontSize: "clamp(28px, 3vw, 38px)",
          fontWeight: 800,
          color: m.color,
          lineHeight: 1,
          marginBottom: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {m.value !== null && inView ? (
          <NumberTicker value={m.value} suffix={m.suffix ?? ""} prefix={m.prefix ?? ""} duration={1200} />
        ) : (
          m.staticDisplay
        )}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F7", marginBottom: 4 }}>
        {m.label}
      </div>
      <div style={{ fontSize: 12, color: "#71717A", lineHeight: 1.5 }}>
        {m.sub}
      </div>
    </div>
  )
}
