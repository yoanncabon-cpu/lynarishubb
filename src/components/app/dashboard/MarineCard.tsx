"use client"
import React, { useState, useRef } from "react"
import { Glass } from "@/components/app/glass/Glass"
import { AgentAvatarGlass } from "@/components/app/glass/AgentAvatarGlass"
import { GlassButton } from "@/components/app/glass/GlassButton"
import Link from "next/link"

const SPARK_DATA = [1, 2, 1, 0, 1, 3, 5, 8, 7, 6, 9, 10, 8, 7, 6, 9, 11, 10, 8, 7, 5, 4, 3, 2]
const HOURS = ["0h", "4h", "8h", "12h", "16h", "20h", "24h"]
const MARINE_COLOR = "#22D3EE"

// ─── Chart — viewBox large, pas de preserveAspectRatio="none" ─────────────────

function EnhancedChart() {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Fixed coordinate space — large enough to avoid text distortion
  const VW = 600   // viewBox width
  const VH = 80    // viewBox chart height
  const LABEL_H = 18
  const PADX = 6
  const PADY = 6

  const min = 0
  const max = Math.max(...SPARK_DATA)
  const range = max - min

  const pts = SPARK_DATA.map((v, i) => ({
    x: PADX + (i / (SPARK_DATA.length - 1)) * (VW - PADX * 2),
    y: VH - PADY - ((v - min) / range) * (VH - PADY * 2 - 4),
    v,
  }))

  // Smooth bezier path
  let linePath = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]!
    const p1 = pts[i]!
    const cx = (p0.x + p1.x) / 2
    linePath += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`
  }
  const last = pts[pts.length - 1]!
  const first = pts[0]!
  const fillPath = `${linePath} L ${last.x} ${VH} L ${first.x} ${VH} Z`

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * VW
    let closest = 0
    let minDist = Infinity
    pts.forEach((pt, i) => {
      const d = Math.abs(pt.x - mx)
      if (d < minDist) { minDist = d; closest = i }
    })
    const pt = pts[closest]!
    setTooltip({ idx: closest, x: pt.x, y: pt.y })
  }

  const tooltipIdx = tooltip?.idx ?? null
  const ttPt = tooltipIdx !== null ? pts[tooltipIdx] : null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH + LABEL_H}`}
      style={{ width: "100%", height: 110, display: "block" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
      aria-label="Graphique activité appels Marine"
    >
      <defs>
        <linearGradient id="mc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MARINE_COLOR} stopOpacity={0.4} />
          <stop offset="70%" stopColor={MARINE_COLOR} stopOpacity={0.06} />
          <stop offset="100%" stopColor={MARINE_COLOR} stopOpacity={0} />
        </linearGradient>
        <filter id="mc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <clipPath id="mc-clip">
          <rect x={0} y={0} width={VW} height={VH} />
        </clipPath>
      </defs>

      {/* Dashed grid lines */}
      {[0.33, 0.66, 1].map((f) => {
        const y = VH - PADY - f * (VH - PADY * 2 - 4)
        return (
          <line key={f}
            x1={PADX} y1={y} x2={VW - PADX} y2={y}
            stroke="rgba(255,255,255,0.055)" strokeWidth={0.8} strokeDasharray="5 7"
          />
        )
      })}

      {/* Fill */}
      <path d={fillPath} fill="url(#mc-fill)" clipPath="url(#mc-clip)" />

      {/* Glow stroke */}
      <path d={linePath} fill="none" stroke={MARINE_COLOR} strokeWidth={4}
        strokeLinecap="round" strokeLinejoin="round"
        opacity={0.25} filter="url(#mc-glow)" />

      {/* Main stroke */}
      <path d={linePath} fill="none" stroke={MARINE_COLOR} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Hover crosshair */}
      {ttPt && (
        <>
          <line x1={ttPt.x} y1={PADY} x2={ttPt.x} y2={VH}
            stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="3 4" />
          <circle cx={ttPt.x} cy={ttPt.y} r={5.5}
            fill="#06060B" stroke={MARINE_COLOR} strokeWidth={2} />
          <circle cx={ttPt.x} cy={ttPt.y} r={3} fill={MARINE_COLOR} />
          {/* Tooltip pill */}
          <rect
            x={Math.min(Math.max(ttPt.x - 26, PADX), VW - 56)}
            y={ttPt.y - 32}
            width={52} height={22} rx={8}
            fill="rgba(34,211,238,0.18)"
            stroke="rgba(34,211,238,0.4)" strokeWidth={0.8}
          />
          <text
            x={Math.min(Math.max(ttPt.x, PADX + 26), VW - 30)}
            y={ttPt.y - 17}
            textAnchor="middle"
            fill={MARINE_COLOR}
            fontSize={11}
            fontWeight="700"
            fontFamily="ui-monospace,monospace"
          >
            {ttPt.v} min
          </text>
        </>
      )}

      {/* Terminal dot when no hover */}
      {!ttPt && (
        <circle cx={last.x} cy={last.y} r={3.5} fill={MARINE_COLOR}
          filter="url(#mc-glow)" />
      )}

      {/* Hour labels — fixed font, no distortion */}
      {HOURS.map((h, i) => {
        const x = PADX + (i / (HOURS.length - 1)) * (VW - PADX * 2)
        return (
          <text key={h} x={x} y={VH + LABEL_H - 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={10}
            fontFamily="ui-monospace,monospace"
          >
            {h}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function MarineCard() {
  return (
    <Glass radius={20} tint={0.05} halo={{ color: MARINE_COLOR, intensity: 0.15 }} padding={0}>
      <div style={{ padding: "18px 20px 14px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgentAvatarGlass name="Marine" color={MARINE_COLOR} size={38} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: MARINE_COLOR, letterSpacing: "-0.02em" }}>Marine</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "1px 8px", borderRadius: 999,
                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                  fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.04em",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B98180" }} />
                  EN DIRECT
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#71717A" }}>Agent téléphonique · 24/7</span>
            </div>
          </div>
          <Link href="/dashboard/agents/marine">
            <GlassButton variant="ghost" size="sm">Voir détails</GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 14, fontFamily: "ui-monospace, monospace" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: MARINE_COLOR }}>12 appels</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>87 min</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B" }}>0 urgences</span>
        </div>

        {/* Chart */}
        <div style={{
          background: "rgba(0,0,0,0.22)",
          backdropFilter: "blur(8px)",
          borderRadius: 14,
          padding: "10px 8px 6px",
          marginBottom: 12,
          border: "1px solid rgba(34,211,238,0.08)",
        }}>
          <EnhancedChart />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#A1A1AA" }}>
            Dernier appel : <strong style={{ color: "#F5F5F7" }}>Mme Rousseau</strong> · RDV pris 14h30
          </span>
          <span style={{ fontSize: 10, color: "#6A6A7A", fontFamily: "ui-monospace, monospace" }}>il y a 12 min</span>
        </div>
      </div>
    </Glass>
  )
}
