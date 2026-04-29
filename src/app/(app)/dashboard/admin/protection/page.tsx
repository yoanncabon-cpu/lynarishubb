"use client"

import { useEffect, useState } from "react"
import {
  Shield,
  AlertCircle,
  TrendingUp,
  Search,
  CheckCircle2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewResponse {
  mode: "alert" | "active"
  orgsByPlan: Array<{ planId: string | null; count: number }>
  monthCostEuros: number
  protection: {
    total: number
    safe: number
    notify70: number
    notify90: number
    over100: number
    over130: number
    totalBudgetEuros: number
    totalCurrentEuros: number
    averageMargin: number
  }
}

interface OrgRow {
  orgId: string
  orgName: string
  planId: string
  currentCostEuros: number
  budgetEuros: number
  ratio: number
  state: "safe" | "notify70" | "notify90" | "over100" | "over130"
  economyModeActive: boolean
  hardCapActive: boolean
  topAgent: string | null
}

interface OrgsResponse {
  orgs: OrgRow[]
  total: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATE_LABELS: Record<OrgRow["state"], string> = {
  safe: "🟢 Sûr",
  notify70: "🟡 70%+",
  notify90: "🟠 90%+",
  over100: "🔴 100%+",
  over130: "🚨 130%+",
}

const STATE_COLORS: Record<OrgRow["state"], { bg: string; text: string; border: string }> = {
  safe:     { bg: "rgba(16,185,129,0.10)", text: "#10B981", border: "rgba(16,185,129,0.25)" },
  notify70: { bg: "rgba(245,158,11,0.10)", text: "#F59E0B", border: "rgba(245,158,11,0.25)" },
  notify90: { bg: "rgba(249,115,22,0.10)", text: "#F97316", border: "rgba(249,115,22,0.25)" },
  over100:  { bg: "rgba(239,68,68,0.10)",  text: "#EF4444", border: "rgba(239,68,68,0.25)" },
  over130:  { bg: "rgba(220,38,38,0.15)",  text: "#DC2626", border: "rgba(220,38,38,0.35)" },
}

const PLAN_OPTIONS = [
  { value: "", label: "Tous les plans" },
  { value: "discovery", label: "Découverte" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "business", label: "Business" },
  { value: "custom", label: "Sur-mesure" },
]

// ─── Composants ──────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(250,250,250,0.45)",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#FAFAFA",
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "rgba(250,250,250,0.55)", margin: "4px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function StateBadge({ state }: { state: OrgRow["state"] }) {
  const c = STATE_COLORS[state]
  return (
    <span
      style={{
        display: "inline-block",
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {STATE_LABELS[state]}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminProtectionPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [orgs, setOrgs] = useState<OrgRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  // Filtres
  const [filterState, setFilterState] = useState<string>("")
  const [filterPlan, setFilterPlan] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch("/api/admin/protection/overview").then((r) => {
        if (r.status === 403) {
          setUnauthorized(true)
          return null
        }
        return r.ok ? (r.json() as Promise<OverviewResponse>) : null
      }),
      fetch(
        `/api/admin/protection/orgs?${new URLSearchParams({
          ...(filterState ? { state: filterState } : {}),
          ...(filterPlan ? { planId: filterPlan } : {}),
          ...(search ? { q: search } : {}),
        }).toString()}`
      ).then((r) => (r.ok ? (r.json() as Promise<OrgsResponse>) : null)),
    ])
      .then(([ov, og]) => {
        if (cancelled) return
        if (ov) setOverview(ov)
        if (og) setOrgs(og.orgs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filterState, filterPlan, search])

  if (unauthorized) {
    return (
      <div style={{ maxWidth: 720, padding: "60px 24px", margin: "0 auto", textAlign: "center" }}>
        <Shield size={40} style={{ color: "#EF4444", margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FAFAFA", marginBottom: 8 }}>
          Accès admin requis
        </h1>
        <p style={{ color: "rgba(250,250,250,0.6)", fontSize: 15 }}>
          Cette page est réservée à l&apos;équipe Lynaris.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1280, padding: "28px 24px 64px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Shield size={20} style={{ color: "#7C3AED" }} />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#FAFAFA",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Protection de marge
          </h1>
          {overview && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 6,
                background:
                  overview.mode === "alert"
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(16,185,129,0.15)",
                color: overview.mode === "alert" ? "#F59E0B" : "#10B981",
                border: `1px solid ${overview.mode === "alert" ? "rgba(245,158,11,0.30)" : "rgba(16,185,129,0.30)"}`,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Mode {overview.mode}
            </span>
          )}
        </div>
        <p style={{ color: "rgba(250,250,250,0.55)", fontSize: 14, margin: 0 }}>
          Surveillance interne des coûts réels par org · Admin only
        </p>
      </div>

      {/* Section 1 — Vue d'ensemble */}
      <section style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(250,250,250,0.45)",
            margin: "0 0 12px",
          }}
        >
          Vue d&apos;ensemble (mois courant)
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <KpiCard
            label="Total orgs actives"
            value={overview ? `${overview.protection.total}` : "—"}
            color="#7C3AED"
            icon={<TrendingUp size={14} />}
          />
          <KpiCard
            label="Coût réel ce mois"
            value={overview ? `${overview.monthCostEuros.toFixed(2)} €` : "—"}
            sub={
              overview
                ? `/ Budget ${overview.protection.totalBudgetEuros.toFixed(0)} €`
                : undefined
            }
            color="#22D3EE"
            icon={<TrendingUp size={14} />}
          />
          <KpiCard
            label="Marge moyenne"
            value={overview ? `${(overview.protection.averageMargin * 100).toFixed(1)}%` : "—"}
            sub="Cible : ≥ 70%"
            color="#10B981"
            icon={<CheckCircle2 size={14} />}
          />
          <KpiCard
            label="Orgs en alerte"
            value={
              overview
                ? `${overview.protection.over100 + overview.protection.over130}`
                : "—"
            }
            sub={
              overview
                ? `${overview.protection.notify70 + overview.protection.notify90} en watch`
                : undefined
            }
            color="#EF4444"
            icon={<AlertCircle size={14} />}
          />
        </div>
      </section>

      {/* Section 2 — Filtres + Table orgs */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(250,250,250,0.45)",
              margin: 0,
            }}
          >
            Organisations ({orgs?.length ?? 0})
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(250,250,250,0.45)",
                }}
              />
              <input
                type="text"
                placeholder="Rechercher une org..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  height: 32,
                  padding: "0 10px 0 30px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#FAFAFA",
                  fontSize: 12,
                  width: 200,
                  outline: "none",
                }}
              />
            </div>
            {/* Filter plan */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                color: "#FAFAFA",
                fontSize: 12,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {/* Filter state */}
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                color: "#FAFAFA",
                fontSize: 12,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Tous les états</option>
              <option value="safe">🟢 Sûr</option>
              <option value="notify70">🟡 70%+</option>
              <option value="notify90">🟠 90%+</option>
              <option value="over100">🔴 100%+</option>
              <option value="over130">🚨 130%+</option>
            </select>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 80px 100px 100px 80px 100px 90px",
              padding: "10px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {["Org", "Plan", "Budget", "Conso", "%", "Top agent", "État"].map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(250,250,250,0.45)",
                }}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 80px 100px 100px 80px 100px 90px",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {[180, 60, 70, 70, 40, 80, 70].map((w, j) => (
                  <div
                    key={j}
                    style={{
                      height: 12,
                      width: w,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.05)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ))}

          {/* Empty */}
          {!loading && orgs !== null && orgs.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "rgba(250,250,250,0.45)",
                fontSize: 13,
              }}
            >
              Aucune organisation correspond aux filtres.
            </div>
          )}

          {/* Rows */}
          {!loading &&
            orgs?.map((org, i) => (
              <div
                key={org.orgId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 80px 100px 100px 80px 100px 90px",
                  padding: "14px 18px",
                  borderBottom:
                    i < (orgs?.length ?? 0) - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  alignItems: "center",
                  fontSize: 12,
                  color: "#D4D4D8",
                }}
              >
                <span style={{ color: "#FAFAFA", fontWeight: 500 }}>{org.orgName}</span>
                <span style={{ textTransform: "capitalize" }}>{org.planId}</span>
                <span style={{ fontFamily: "monospace" }}>
                  {org.budgetEuros.toFixed(0)}€
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: org.ratio >= 1 ? "#EF4444" : "#FAFAFA",
                  }}
                >
                  {org.currentCostEuros.toFixed(2)}€
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color:
                      org.ratio >= 1.3
                        ? "#DC2626"
                        : org.ratio >= 1
                          ? "#EF4444"
                          : org.ratio >= 0.9
                            ? "#F97316"
                            : org.ratio >= 0.7
                              ? "#F59E0B"
                              : "#10B981",
                  }}
                >
                  {Math.round(org.ratio * 100)}%
                </span>
                <span style={{ color: "rgba(250,250,250,0.55)" }}>
                  {org.topAgent ?? "—"}
                </span>
                <StateBadge state={org.state} />
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}
