"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Zap, Phone, Mail } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { GlassCard, GlassChip, KpiTile } from "@/components/app/glass"

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

interface LinePoint {
  date: string
  value: number
}

interface LineSeries {
  data: LinePoint[]
  color: string
  gradientId: string
}

function LineChart({
  series,
  width = 700,
  height = 220,
}: {
  series: LineSeries[]
  width?: number
  height?: number
}) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    values: { color: string; label: string; value: number }[]
    date: string
  } | null>(null)

  const padding = { top: 20, right: 20, bottom: 40, left: 52 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const firstSeries = series[0]!
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const maxVal = Math.max(...allValues)
  const minVal = 0

  const xScale = (i: number) => (i / (firstSeries.data.length - 1)) * chartW
  const yScale = (v: number) =>
    chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH

  const gridCount = 5
  const yTicks = Array.from({ length: gridCount }, (_, i) => {
    const v = minVal + ((maxVal - minVal) / (gridCount - 1)) * i
    return { y: yScale(v), label: Math.round(v).toString() }
  })

  const xLabelStep = Math.ceil(firstSeries.data.length / 8)
  const xLabels = firstSeries.data.filter((_, i) => i % xLabelStep === 0 || i === firstSeries.data.length - 1)

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines + Y labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={0} x2={chartW}
                y1={tick.y} y2={tick.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={-8} y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="rgba(245,245,247,0.35)"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X labels */}
          {xLabels.map((d, rawI) => {
            const actualI = firstSeries.data.indexOf(d)
            return (
              <text
                key={rawI}
                x={xScale(actualI)}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(245,245,247,0.35)"
              >
                {d.date}
              </text>
            )
          })}

          {/* Series */}
          {series.map((s) => {
            const pathD = s.data
              .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
              .join(" ")
            const areaD = `${pathD} L ${xScale(s.data.length - 1).toFixed(1)} ${chartH} L 0 ${chartH} Z`

            return (
              <g key={s.gradientId}>
                <path d={areaD} fill={`url(#${s.gradientId})`} />
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {s.data.map((d, i) => (
                  <circle
                    key={i}
                    cx={xScale(i)}
                    cy={yScale(d.value)}
                    r={3}
                    fill={s.color}
                    stroke="#0A0A0B"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            )
          })}

          {/* Hover overlay */}
          {firstSeries.data.map((d, i) => (
            <rect
              key={i}
              x={xScale(i) - chartW / firstSeries.data.length / 2}
              y={0}
              width={chartW / firstSeries.data.length}
              height={chartH}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                const svgScaleX = width / rect.width
                const svgScaleY = height / rect.height
                setTooltip({
                  x: (e.clientX - rect.left) * svgScaleX,
                  y: (e.clientY - rect.top) * svgScaleY,
                  date: d.date,
                  values: series.map((s) => ({
                    color: s.color,
                    label: s.gradientId.includes("conv") ? "Conversations" : "Actions",
                    value: s.data[i]?.value ?? 0,
                  })),
                })
              }}
            />
          ))}

          {/* Tooltip vertical line */}
          {tooltip && (
            <line
              x1={tooltip.x - padding.left}
              x2={tooltip.x - padding.left}
              y1={0}
              y2={chartH}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
        </g>
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x / (width / 100), 80) + "%",
            top: "10%",
            transform: "translateX(-50%)",
            background: "rgba(20,20,28,0.92)",
            border: "1px solid var(--glass-border)",
            borderRadius: 10,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 10,
            minWidth: 140,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(245,245,247,0.5)", marginBottom: 6 }}>
            {tooltip.date}
          </div>
          {tooltip.values.map((v) => (
            <div key={v.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: v.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(245,245,247,0.7)" }}>{v.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F5F5F7", marginLeft: "auto" }}>{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutItem {
  slug: string
  name: string
  pct: number
  color: string
}

function DonutChart({ data }: { data: DonutItem[] }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const size = 180
  const cx = size / 2
  const cy = size / 2
  const outerR = 76
  const innerR = 50

  const hoveredItem = data.find((d) => d.slug === hoveredSlug)

  const slices = data.reduce<{ items: (DonutItem & { path: string })[]; cum: number }>(
    ({ items, cum }, d) => {
      const angle = (d.pct / 100) * Math.PI * 2
      const startA = cum
      const endA = cum + angle

      const x1 = cx + outerR * Math.cos(startA)
      const y1 = cy + outerR * Math.sin(startA)
      const x2 = cx + outerR * Math.cos(endA)
      const y2 = cy + outerR * Math.sin(endA)
      const x3 = cx + innerR * Math.cos(endA)
      const y3 = cy + innerR * Math.sin(endA)
      const x4 = cx + innerR * Math.cos(startA)
      const y4 = cy + innerR * Math.sin(startA)

      const largeArc = angle > Math.PI ? 1 : 0

      const path = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
        "Z",
      ].join(" ")

      return { items: [...items, { ...d, path }], cum: endA }
    },
    { items: [], cum: -Math.PI / 2 }
  ).items

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        {slices.map((s) => {
          const isHovered = hoveredSlug === s.slug
          return (
            <path
              key={s.slug}
              d={s.path}
              fill={s.color}
              opacity={hoveredSlug === null ? 0.9 : isHovered ? 1 : 0.5}
              style={{
                transform: isHovered ? `scale(1.02)` : "scale(1)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: "transform 220ms var(--ease-apple), opacity 220ms var(--ease-apple)",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredSlug(s.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            />
          )
        })}
        {hoveredItem ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={hoveredItem.color}>
              {hoveredItem.pct}%
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="rgba(245,245,247,0.6)">
              {hoveredItem.name}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#FAFAFA">
              {data.length}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="rgba(245,245,247,0.45)">
              agents
            </text>
          </>
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {data.map((d) => (
          <div
            key={d.slug}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", borderRadius: 8, padding: "4px 6px",
              background: hoveredSlug === d.slug ? "rgba(255,255,255,0.06)" : "transparent",
              transition: "background 180ms var(--ease-apple)",
            }}
            onMouseEnter={() => setHoveredSlug(d.slug)}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: hoveredSlug === d.slug ? "#FAFAFA" : "rgba(245,245,247,0.65)", flex: 1, transition: "color 180ms var(--ease-apple)" }}>{d.name}</span>
            <span style={{ fontSize: 11, color: hoveredSlug === d.slug ? d.color : "rgba(245,245,247,0.4)", fontVariantNumeric: "tabular-nums", transition: "color 180ms var(--ease-apple)" }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

interface BarItem { label: string; value: number; max: number }

function HorizBarChart({ data }: { data: BarItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d, i) => {
        const pct = (d.value / d.max) * 100
        const gradStart = "#E86F4D"
        const gradEnd = "#7C3AED"
        const gradId = `bar-grad-${i}`
        return (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "rgba(245,245,247,0.65)" }}>{d.label}</span>
              <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "rgba(245,245,247,0.5)" }}>
                {d.value}
              </span>
            </div>
            <svg width="100%" height={8} style={{ display: "block" }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={gradStart} />
                  <stop offset="100%" stopColor={gradEnd} />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width="100%" height={8} rx={4} fill="rgba(255,255,255,0.06)" />
              <rect x={0} y={0} width={`${pct}%`} height={8} rx={4} fill={`url(#${gradId})`} />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "rgba(250,250,250,0.55)",
}

// ─── Date range tabs ──────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ApiTotals {
  conversations: number
  actions: number
  callsMinutes: number
  emailsProcessed: number
  deltaConversations: number
  deltaActions: number
}
interface ApiAnalytics {
  totals: ApiTotals
  dailyConversations: { date: string; value: number }[]
  dailyActions: { date: string; value: number }[]
  agentBreakdown: { slug: string; name: string; conversations: number; actions: number; pct: number; color: string }[] | null
  topActionTypes: { label: string; count: number }[] | null
  hasRealData: boolean
}

function formatDelta(v: number) {
  return `${v >= 0 ? "+" : ""}${v}% vs période préc.`
}

// ─── Empty state overlay pour graphiques sans données réelles ─────────────────

function ChartEmptyOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,10,15,0.62)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 14,
        zIndex: 4,
        gap: 8,
      }}
    >
      <div style={{ fontSize: 22, color: "rgba(245,245,247,0.18)" }}>·</div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,245,247,0.6)", margin: 0 }}>
        Aucune donnée pour l&apos;instant
      </p>
      <p style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", margin: 0, textAlign: "center", maxWidth: 220 }}>
        Les statistiques apparaîtront dès que tes agents commenceront à travailler.
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30)
  const [apiData, setApiData] = useState<ApiAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?range=${range}`)
      .then(r => r.json())
      .then((d: ApiAnalytics) => { setApiData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  // Utilise uniquement les données de l'API — jamais de fallback local
  const convData = apiData?.dailyConversations ?? []
  const actionData = apiData?.dailyActions ?? []
  const hasRealData = apiData?.hasRealData ?? false

  const convSeries: LineSeries = {
    data: convData,
    color: "#7C3AED",
    gradientId: "area-conv",
  }
  const actionSeries: LineSeries = {
    data: actionData,
    color: "#E86F4D",
    gradientId: "area-actions",
  }

  const totals = apiData?.totals
  const callsH = totals ? Math.floor(totals.callsMinutes / 60) : 0
  const callsM = totals ? totals.callsMinutes % 60 : 0
  const callsStr = totals ? (callsH > 0 ? `${callsH}h ${callsM.toString().padStart(2, "0")}min` : `${callsM}min`) : "—"

  // Données agents depuis l'API uniquement
  const agentBreakdown = apiData?.agentBreakdown ?? null
  const topActionTypes = apiData?.topActionTypes ?? null

  // KPIs principaux — accent coloré par métrique
  const kpis: {
    label: string
    value: string | number | null
    icon: React.ReactNode
    accent: string
    delta: string | null
    positive: boolean
  }[] = [
    {
      label: "Conversations totales",
      value: !loading && totals ? totals.conversations.toLocaleString("fr-FR") : loading ? "…" : "—",
      icon: <MessageSquare size={14} />,
      accent: "#7C3AED",
      delta: !loading && totals && hasRealData ? formatDelta(totals.deltaConversations) : null,
      positive: (totals?.deltaConversations ?? 0) >= 0,
    },
    {
      label: "Actions exécutées",
      value: !loading && totals ? totals.actions.toLocaleString("fr-FR") : loading ? "…" : "—",
      icon: <Zap size={14} />,
      accent: "#E86F4D",
      delta: !loading && totals && hasRealData ? formatDelta(totals.deltaActions) : null,
      positive: (totals?.deltaActions ?? 0) >= 0,
    },
    {
      label: "Temps appels",
      value: loading ? "…" : callsStr,
      icon: <Phone size={14} />,
      accent: "#22D3EE",
      delta: null,
      positive: true,
    },
    {
      label: "Emails traités",
      value: !loading && totals ? totals.emailsProcessed.toLocaleString("fr-FR") : loading ? "…" : "—",
      icon: <Mail size={14} />,
      accent: "#34D399",
      delta: null,
      positive: true,
    },
  ]

  return (
    <div style={{ maxWidth: 1480, padding: "24px clamp(20px, 4vw, 32px) 56px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 220, flex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "#FAFAFA",
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Statistiques
          </h1>
          <p style={{ fontSize: 14, color: "rgba(250,250,250,0.55)", margin: "6px 0 0", letterSpacing: "-0.005em" }}>
            Activité de tes agents sur les {range} derniers jours
          </p>
        </div>

        {/* Date range selector — chips verre */}
        <div role="tablist" aria-label="Période" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DATE_RANGES.map((r) => (
            <GlassChip
              key={r.value}
              onClick={() => setRange(r.value)}
              active={range === r.value}
              ariaLabel={`Voir ${r.label}`}
            >
              {r.label}
            </GlassChip>
          ))}
        </div>
      </header>

      {/* Row 1 — 4 KPI Cards */}
      <div className="ly-analytics-kpi-grid" style={{ marginBottom: 22 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ position: "relative" }}>
            <KpiTile
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              accent={kpi.accent}
              {...(kpi.delta !== null ? { hint: kpi.delta } : {})}
            />
            {kpi.delta !== null && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 700,
                  color: kpi.positive ? "#34D399" : "#F87171",
                  background: kpi.positive ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                  border: `1px solid ${kpi.positive ? "rgba(52,211,153,0.28)" : "rgba(248,113,113,0.28)"}`,
                  borderRadius: 999,
                  padding: "2px 7px",
                  letterSpacing: "0.02em",
                }}
              >
                {kpi.positive ? "↑" : "↓"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Row 2 — Main line chart */}
      <GlassCard radius={22} padding={22} hover={false} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", letterSpacing: "-0.01em" }}>
              Activité journalière
            </div>
            <div style={{ fontSize: 12, color: "rgba(250,250,250,0.45)", marginTop: 2 }}>
              Conversations et actions sur {range} jours
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { color: "#7C3AED", label: "Conversations" },
              { color: "#E86F4D", label: "Actions" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: l.color }} />
                <span style={{ fontSize: 12, color: "rgba(250,250,250,0.55)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
          {!loading && !hasRealData && <ChartEmptyOverlay />}
          {convData.length > 0 && (
            <LineChart series={[convSeries, actionSeries]} height={220} />
          )}
          {!loading && convData.length === 0 && hasRealData && (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(250,250,250,0.35)", fontSize: 13 }}>
              Chargement des données…
            </div>
          )}
        </div>
      </GlassCard>

      {/* Row 3 — 2 charts */}
      <div className="ly-analytics-pair-grid" style={{ marginBottom: 20 }}>
        {/* Donut */}
        <GlassCard radius={22} padding={22} hover={false} style={{ position: "relative" }}>
          <div style={{ ...labelStyle, marginBottom: 18 }}>Répartition par agent</div>
          {agentBreakdown && agentBreakdown.length > 0 ? (
            <DonutChart data={agentBreakdown} />
          ) : (
            <div style={{ position: "relative", minHeight: 180 }}>
              <ChartEmptyOverlay />
            </div>
          )}
        </GlassCard>

        {/* Horizontal bars */}
        <GlassCard radius={22} padding={22} hover={false} style={{ position: "relative" }}>
          <div style={{ ...labelStyle, marginBottom: 18 }}>Top actions par type</div>
          {topActionTypes && topActionTypes.length > 0 ? (
            <HorizBarChart data={topActionTypes.map(a => ({ label: a.label, value: a.count, max: topActionTypes[0]!.count }))} />
          ) : (
            <div style={{ position: "relative", minHeight: 180 }}>
              <ChartEmptyOverlay />
            </div>
          )}
        </GlassCard>
      </div>

      {/* Row 4 — Agent ranking table */}
      <GlassCard radius={22} padding={22} hover={false}>
        <div style={{ ...labelStyle, marginBottom: 16 }}>Classement des agents</div>
        {agentBreakdown && agentBreakdown.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Agent", "Conversations", "Actions", "Statut"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: col === "Agent" ? "left" : "right",
                        paddingBottom: 10,
                        paddingLeft: col === "Agent" ? 0 : 16,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "rgba(250,250,250,0.40)",
                        borderBottom: "1px solid var(--glass-border)",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentBreakdown.map((agent, i) => (
                  <tr
                    key={agent.slug}
                    style={{
                      borderBottom: i < agentBreakdown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <td style={{ padding: "12px 0" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <AgentAvatar slug={agent.slug} size={32} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>{agent.name}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: "right", paddingLeft: 16, fontSize: 13, color: "rgba(250,250,250,0.65)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                      {agent.conversations}
                    </td>
                    <td style={{ textAlign: "right", paddingLeft: 16, fontSize: 13, fontWeight: 600, color: "#FAFAFA", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                      {agent.actions.toLocaleString("fr-FR")}
                    </td>
                    <td style={{ textAlign: "right", paddingLeft: 16, verticalAlign: "middle" }}>
                      <span className="ly-badge" style={{ color: "#34D399", borderColor: "rgba(52,211,153,0.28)", background: "rgba(52,211,153,0.10)" }}>
                        <span
                          aria-hidden
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#34D399",
                            boxShadow: "0 0 0 3px rgba(52,211,153,0.22)",
                            animation: "pulse 2s infinite",
                            flexShrink: 0,
                          }}
                        />
                        Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(250,250,250,0.35)", fontSize: 13 }}>
            {loading ? "Chargement…" : "Aucune activité agent pour l'instant."}
          </div>
        )}
      </GlassCard>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(52,211,153,0.22); }
          50% { box-shadow: 0 0 0 6px rgba(52,211,153,0.05); }
        }
        .ly-analytics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .ly-analytics-pair-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .ly-analytics-kpi-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .ly-analytics-pair-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}
