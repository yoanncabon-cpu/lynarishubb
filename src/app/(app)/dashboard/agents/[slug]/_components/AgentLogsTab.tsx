"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Wrench,
  MessageSquare,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
} from "lucide-react"
import type { Agent } from "@/lib/agents/data"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionLog {
  id: string
  type: string
  status: "success" | "error" | "pending"
  detail: string
  cost_usd?: number
  duration_ms?: number
  created_at: string
}

type FilterStatus = "all" | "success" | "error" | "tool"
type DateRange = "today" | "7d" | "30d"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  if (isToday) return `Aujourd'hui ${time}`
  if (isYesterday) return `Hier ${time}`
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + ` ${time}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function isToolLog(log: ActionLog): boolean {
  return log.type.includes("tool") || log.type.includes("call") || log.type.includes("function")
}

function isInDateRange(iso: string, range: DateRange): boolean {
  const date = new Date(iso)
  const now = new Date()
  if (range === "today") {
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }
  if (range === "7d") {
    const limit = new Date(now)
    limit.setDate(limit.getDate() - 7)
    return date >= limit
  }
  if (range === "30d") {
    const limit = new Date(now)
    limit.setDate(limit.getDate() - 30)
    return date >= limit
  }
  return true
}

function exportCSV(logs: ActionLog[], agentSlug: string) {
  const header = ["id", "type", "status", "detail", "duration_ms", "cost_usd", "created_at"]
  const rows = logs.map((l) =>
    [
      l.id,
      l.type,
      l.status,
      `"${(l.detail ?? "").replace(/"/g, '""')}"`,
      l.duration_ms ?? "",
      l.cost_usd ?? "",
      l.created_at,
    ].join(",")
  )
  const csv = [header.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `logs-${agentSlug}-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            height: 12,
            width: "40%",
            borderRadius: 4,
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            height: 10,
            width: "70%",
            borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
          }}
        />
      </div>
      <div
        style={{
          width: 64,
          height: 10,
          borderRadius: 4,
          background: "rgba(255,255,255,0.04)",
          flexShrink: 0,
        }}
      />
    </div>
  )
}

function EmptyState({
  hasFilter,
  agentName,
  onScrollToChat,
}: {
  hasFilter: boolean
  agentName: string
  onScrollToChat: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "56px 24px",
      }}
    >
      {/* Simple SVG illustration */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="18" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx="22" cy="28" r="2.5" fill="rgba(255,255,255,0.12)" />
        <circle cx="32" cy="24" r="2.5" fill="rgba(255,255,255,0.12)" />
        <circle cx="42" cy="28" r="2.5" fill="rgba(255,255,255,0.12)" />
        <circle cx="27" cy="38" r="2" fill="rgba(255,255,255,0.08)" />
        <circle cx="37" cy="38" r="2" fill="rgba(255,255,255,0.08)" />
      </svg>

      <div style={{ textAlign: "center", maxWidth: 280 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 6px",
          }}
        >
          {hasFilter ? "Aucun log pour ce filtre" : "Aucune activité pour le moment"}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          {hasFilter
            ? "Essaie un autre filtre ou une plage de dates plus large."
            : `Envoie une instruction à ${agentName} pour commencer.`}
        </p>
        {!hasFilter && (
          <button
            type="button"
            onClick={onScrollToChat}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(232,111,77,0.3)",
              background: "rgba(232,111,77,0.1)",
              color: "#E86F4D",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms",
            }}
          >
            <MessageSquareText size={12} aria-hidden />
            Aller au Chat
          </button>
        )}
      </div>
    </div>
  )
}

interface LogEntryProps {
  log: ActionLog
  isLast: boolean
}

function LogEntry({ log, isLast }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false)

  const isTool = isToolLog(log)

  const iconColor =
    log.status === "success"
      ? "#22c55e"
      : log.status === "error"
        ? "#ef4444"
        : isTool
          ? "#a78bfa"
          : "#60a5fa"

  const IconComp =
    log.status === "success"
      ? CheckCircle2
      : log.status === "error"
        ? XCircle
        : isTool
          ? Wrench
          : log.status === "pending"
            ? Clock
            : MessageSquare

  const detail = log.detail ?? ""
  const preview = detail.length > 120 ? detail.slice(0, 120) + "…" : detail
  const hasMore = detail.length > 120

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 0,
        borderBottom: isLast ? undefined : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Timeline line + dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14px 0 0 16px",
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `${iconColor}14`,
            border: `1px solid ${iconColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconComp size={13} style={{ color: iconColor }} aria-hidden />
        </div>
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 12,
              marginTop: 4,
              background:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 16px 14px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {formatType(log.type)}
          </p>
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
              {formatTimestamp(log.created_at)}
            </span>
            {(log.duration_ms !== undefined || log.cost_usd !== undefined) && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                {log.duration_ms !== undefined && formatDuration(log.duration_ms)}
                {log.duration_ms !== undefined && log.cost_usd !== undefined && " · "}
                {log.cost_usd !== undefined && `$${log.cost_usd.toFixed(4)}`}
              </span>
            )}
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.5,
          }}
        >
          {expanded ? log.detail : preview}
        </p>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              marginTop: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={11} aria-hidden /> Réduire
              </>
            ) : (
              <>
                <ChevronDown size={11} aria-hidden /> Voir tout
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentLogsTab({
  agent,
  onSwitchToChat,
}: {
  agent: Agent
  onSwitchToChat?: () => void
}) {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [dateRange, setDateRange] = useState<DateRange>("7d")
  const [search, setSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      try {
        const res = await fetch(`/api/agents/${agent.slug}/logs`)
        if (!res.ok) throw new Error("fetch failed")
        const data = (await res.json()) as { logs?: ActionLog[] } | ActionLog[]
        setLogs(Array.isArray(data) ? data : (data.logs ?? []))
      } catch {
        setLogs([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [agent.slug]
  )

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Apply filters
  const filtered = logs.filter((l) => {
    if (!isInDateRange(l.created_at, dateRange)) return false
    if (filter === "success" && l.status !== "success") return false
    if (filter === "error" && l.status !== "error") return false
    if (filter === "tool" && !isToolLog(l)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!l.type.toLowerCase().includes(q) && !l.detail.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalCost = logs.reduce((acc, l) => acc + (l.cost_usd ?? 0), 0)
  const hasActiveFilter = filter !== "all" || dateRange !== "7d" || search.trim() !== ""

  const filterLabels: Record<FilterStatus, string> = {
    all: "Tous",
    success: "Succès",
    error: "Erreurs",
    tool: "Tool calls",
  }

  const dateRangeLabels: Record<DateRange, string> = {
    today: "Aujourd'hui",
    "7d": "7 jours",
    "30d": "30 jours",
  }

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            {loading
              ? "Chargement..."
              : `${filtered.length} / ${logs.length} action${logs.length !== 1 ? "s" : ""}`}
          </span>
          {!loading && totalCost > 0 && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              {(totalCost * 100).toFixed(3)} ct
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Export CSV */}
          {!loading && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => exportCSV(filtered, agent.slug)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)",
                fontSize: 12,
                cursor: "pointer",
                transition: "opacity 150ms",
              }}
            >
              <Download size={12} aria-hidden />
              CSV
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            aria-label="Rafraichir les logs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.5 : 1,
              transition: "opacity 150ms",
            }}
          >
            <RefreshCw
              size={12}
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
              aria-hidden
            />
            Rafraichir
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {/* Status filters */}
        {(["all", "success", "error", "tool"] as FilterStatus[]).map((s) => {
          const active = filter === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(124,58,237,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                color: active ? "#a78bfa" : "rgba(255,255,255,0.45)",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {filterLabels[s]}
            </button>
          )
        })}

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 24,
            background: "rgba(255,255,255,0.08)",
            alignSelf: "center",
            margin: "0 2px",
          }}
        />

        {/* Date range filters */}
        {(["today", "7d", "30d"] as DateRange[]).map((d) => {
          const active = dateRange === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDateRange(d)}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(232,111,77,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.03)",
                color: active ? "#E86F4D" : "rgba(255,255,255,0.45)",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {dateRangeLabels[d]}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans les logs..."
          style={{
            width: "100%",
            height: 36,
            paddingLeft: 32,
            paddingRight: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 150ms",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
          }}
        />
      </div>

      {/* Log list */}
      <div
        style={{
          background: "rgba(20,20,28,0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={
                i < 4 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : undefined
              }
            >
              <SkeletonRow />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilter={hasActiveFilter}
            agentName={agent.name}
            onScrollToChat={onSwitchToChat ?? (() => {})}
          />
        ) : (
          filtered.map((log, i) => (
            <LogEntry key={log.id} log={log} isLast={i === filtered.length - 1} />
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
