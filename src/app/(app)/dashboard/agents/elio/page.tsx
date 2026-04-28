"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal, ChevronRight, Loader2 } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProspectStatus = "nouveau" | "contacte" | "repondu" | "qualifie" | "gagne"

interface Prospect {
  id: string
  name: string
  company: string
  title: string
  status: ProspectStatus
  channel: "linkedin" | "email"
  score: number
}

// Mapping du statut DB → statut kanban
const DB_STATUS_MAP: Record<string, ProspectStatus> = {
  new: "nouveau",
  contacted: "contacte",
  replied: "repondu",
  qualified: "qualifie",
  won: "gagne",
  // lost n'a pas de colonne kanban — ignoré
}

interface DbProspect {
  id: string
  fullName: string
  company: string | null
  headline: string | null
  email: string | null
  linkedinUrl: string | null
  status: string
  score: number
}

function dbToProspect(p: DbProspect): Prospect | null {
  const status = DB_STATUS_MAP[p.status]
  if (!status) return null
  const channel: "linkedin" | "email" = p.linkedinUrl ? "linkedin" : "email"
  return {
    id: p.id,
    name: p.fullName,
    company: p.company ?? "—",
    title: p.headline ?? "—",
    status,
    channel,
    score: p.score,
  }
}

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS: { id: ProspectStatus; label: string; color: string; next: ProspectStatus | null }[] = [
  { id: "nouveau", label: "Nouveaux", color: "#6366F1", next: "contacte" },
  { id: "contacte", label: "Contactes", color: "#F59E0B", next: "repondu" },
  { id: "repondu", label: "Repondus", color: "#22D3EE", next: "qualifie" },
  { id: "qualifie", label: "Qualifies", color: "#10B981", next: "gagne" },
  { id: "gagne", label: "Gagnes", color: "#7C3AED", next: null },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444"
  const bg = score >= 80 ? "rgba(16,185,129,0.12)" : score >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)"
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: bg,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {score}
      </span>
    </div>
  )
}

function ChannelBadge({ channel }: { channel: "linkedin" | "email" }) {
  const isLinkedin = channel === "linkedin"
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: isLinkedin ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)",
        color: isLinkedin ? "#60A5FA" : "#FBBF24",
        border: `1px solid ${isLinkedin ? "rgba(59,130,246,0.25)" : "rgba(245,158,11,0.25)"}`,
      }}
    >
      {isLinkedin ? "LinkedIn" : "Email"}
    </span>
  )
}

function ProspectCard({
  prospect,
  nextColumn,
  onAdvance,
}: {
  prospect: Prospect
  nextColumn: { label: string; color: string } | null
  onAdvance: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{
        background: "rgba(20,20,28,0.7)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
      }}
    >
      {/* Top row: name + score + menu */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {prospect.name}
          </div>
          <div style={{ fontSize: 11, color: "#10B981", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {prospect.company}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ScoreBadge score={prospect.score} />
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(245,245,247,0.4)",
                borderRadius: 6,
              }}
              aria-label="Options prospect"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  background: "rgba(20,20,30,0.97)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "4px 0",
                  zIndex: 20,
                  minWidth: 130,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {["Voir profil", "Envoyer email", "Marquer perdu"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "7px 14px",
                      textAlign: "left",
                      fontSize: 12,
                      color: item === "Marquer perdu" ? "#EF4444" : "rgba(245,245,247,0.7)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title + channel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.45)" }}>{prospect.title}</span>
        <ChannelBadge channel={prospect.channel} />
      </div>

      {/* Advance button */}
      {nextColumn && (
        <button
          type="button"
          onClick={onAdvance}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "6px 0",
            background: `${nextColumn.color}18`,
            border: `1px solid ${nextColumn.color}35`,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            color: nextColumn.color,
            cursor: "pointer",
            width: "100%",
            transition: "background 0.15s",
          }}
        >
          Avancer
          <ChevronRight size={12} />
          <span style={{ color: "rgba(245,245,247,0.4)", fontWeight: 400 }}>{nextColumn.label}</span>
        </button>
      )}
    </div>
  )
}

function KanbanColumn({
  column,
  prospects,
  nextColumn,
  onAdvance,
}: {
  column: (typeof COLUMNS)[number]
  prospects: Prospect[]
  nextColumn: { label: string; color: string } | null
  onAdvance: (id: string) => void
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 240,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "calc(100vh - 260px)",
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: `${column.color}14`,
          border: `1px solid ${column.color}30`,
          borderRadius: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: column.color,
            boxShadow: `0 0 8px ${column.color}80`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#F5F5F7", flex: 1 }}>
          {column.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: column.color,
            background: `${column.color}22`,
            borderRadius: 20,
            padding: "1px 8px",
          }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Cards scroll */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          paddingRight: 2,
          flex: 1,
        }}
      >
        {prospects.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "24px 0",
              textAlign: "center",
              fontSize: 12,
              color: "rgba(245,245,247,0.2)",
            }}
          >
            Aucun prospect
          </div>
        ) : (
          prospects.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              nextColumn={nextColumn}
              onAdvance={() => onAdvance(p.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ElioKanbanPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/agents/elio/prospects")
        if (res.ok) {
          const data = await res.json() as { prospects: DbProspect[] }
          const mapped = data.prospects
            .map(dbToProspect)
            .filter((p): p is Prospect => p !== null)
          setProspects(mapped)
        }
      } catch { /* silencieux */ } finally {
        setLoading(false)
      }
    })()
  }, [])

  function advance(id: string) {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const col = COLUMNS.find((c) => c.id === p.status)
        if (!col || !col.next) return p
        return { ...p, status: col.next }
      })
    )
  }

  const responded = prospects.filter((p) => ["repondu", "qualifie", "gagne"].includes(p.status)).length
  const contacted = prospects.filter((p) => ["contacte", "repondu", "qualifie", "gagne"].includes(p.status)).length
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : 0

  const stats = {
    total: prospects.length,
    qualified: prospects.filter((p) => p.status === "qualifie").length,
    rdv: prospects.filter((p) => p.status === "gagne").length,
    responseRate,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AgentAvatar slug="elio" size={40} glow />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F7", margin: 0 }}>
                Mes prospects
              </h1>
              <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: "2px 0 0" }}>
                Elio — Agent Commercial
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: "rgba(124,58,237,0.85)",
              border: "1px solid rgba(124,58,237,0.5)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#F5F5F7",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
            }}
          >
            <Plus size={14} />
            Nouveau prospect
          </button>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "prospects totaux", value: stats.total, color: "#A1A1AA" },
            { label: "qualifies", value: stats.qualified, color: "#10B981" },
            { label: "rendez-vous", value: stats.rdv, color: "#7C3AED" },
            { label: "taux reponse", value: `${stats.responseRate}%`, color: "#F59E0B" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 11, color: "rgba(245,245,247,0.4)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "rgba(245,245,247,0.4)" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 14 }}>Chargement des prospects…</span>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, height: "100%", minWidth: "max-content" }}>
            {COLUMNS.map((col) => {
              const nextColDef = col.next ? COLUMNS.find((c) => c.id === col.next) : null
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  prospects={prospects.filter((p) => p.status === col.id)}
                  nextColumn={nextColDef ? { label: nextColDef.label, color: nextColDef.color } : null}
                  onAdvance={advance}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
