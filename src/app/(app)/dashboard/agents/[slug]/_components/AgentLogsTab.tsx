"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare,
  Phone,
  Mail,
  RefreshCw,
  Search,
  MessageSquareText,
  ArrowRight,
} from "lucide-react"
import type { Agent } from "@/lib/agents/data"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  title: string
  agentSlug: string
  channel: string
  summary: string
  lastMessage: string
  time: string
  status: "terminée" | "en cours"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  const props = { size: 12, "aria-hidden": true as const }
  if (channel === "voice") return <Phone {...props} />
  if (channel === "email") return <Mail {...props} />
  return <MessageSquare {...props} />
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    chat: "Chat",
    voice: "Voix",
    email: "Email",
    whatsapp: "WhatsApp",
    internal: "Interne",
  }
  return labels[channel] ?? channel
}

function channelColor(channel: string): string {
  const colors: Record<string, string> = {
    chat: "#60a5fa",
    voice: "#22D3EE",
    email: "#F472B6",
    whatsapp: "#22c55e",
    internal: "#a78bfa",
  }
  return colors[channel] ?? "#71717A"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ height: 10, width: 60, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ height: 10, width: 50, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ height: 12, width: "55%", borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
      <div style={{ height: 10, width: "80%", borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
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
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
        <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <rect x="16" y="18" width="24" height="16" rx="4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
        <path d="M16 30l4 4 4-4" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: "center", maxWidth: 280 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>
          {hasFilter ? "Aucune conversation pour ce filtre" : "Aucune conversation pour le moment"}
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 16px", lineHeight: 1.5 }}>
          {hasFilter
            ? "Essaie une autre recherche."
            : `Lance une première conversation avec ${agentName}.`}
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

interface ConversationCardProps {
  conv: Conversation
  agentColor: string
}

function ConversationCard({ conv, agentColor }: ConversationCardProps) {
  const color = channelColor(conv.channel)
  const isOngoing = conv.status === "en cours"

  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        transition: "background 150ms",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)"
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent"
      }}
    >
      {/* Channel icon bubble */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `${color}14`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: color,
          marginTop: 2,
        }}
      >
        <ChannelIcon channel={conv.channel} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: color,
                background: `${color}14`,
                border: `1px solid ${color}28`,
                padding: "1px 7px",
                borderRadius: 999,
              }}
            >
              {channelLabel(conv.channel)}
            </span>
            {isOngoing && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#10B981",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  padding: "1px 6px",
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#10B981",
                    display: "inline-block",
                  }}
                />
                en cours
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
            {conv.time}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            margin: "0 0 3px",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.82)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {conv.title}
        </p>

        {/* Last message preview */}
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(255,255,255,0.38)",
            lineHeight: 1.45,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {conv.lastMessage || "Pas encore de message"}
        </p>
      </div>

      <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0, marginTop: 8 }} aria-hidden />
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

  const fetchConversations = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      try {
        const res = await fetch(`/api/conversations?agent_slug=${agent.slug}`)
        if (!res.ok) throw new Error("fetch failed")
        const data = (await res.json()) as { conversations?: Conversation[] }
        setConversations(data.conversations ?? [])
      } catch {
        setConversations([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [agent.slug]
  )

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q)
    )
  })

  const hasFilter = search.trim() !== ""

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
          {loading
            ? "Chargement..."
            : `${filtered.length} conversation${filtered.length !== 1 ? "s" : ""}`}
        </span>
        <button
          type="button"
          onClick={() => fetchConversations(true)}
          disabled={refreshing}
          aria-label="Rafraîchir les conversations"
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
          Rafraîchir
        </button>
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
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans les conversations..."
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
            e.currentTarget.style.borderColor = `${agent.color}60`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
          }}
        />
      </div>

      {/* List */}
      <div
        style={{
          background: "rgba(20,20,28,0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilter={hasFilter}
            agentName={agent.name}
            onScrollToChat={onSwitchToChat ?? (() => {})}
          />
        ) : (
          filtered.map((conv) => (
            <ConversationCard key={conv.id} conv={conv} agentColor={agent.color} />
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
