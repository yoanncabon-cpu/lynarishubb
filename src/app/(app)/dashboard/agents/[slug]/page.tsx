"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { agents } from "@/lib/agents/data"
import { MessageSquare, Clock, Settings, ArrowLeft, Brain, Play, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { AgentChatTab } from "./_components/AgentChatTab"
import { AgentLogsTab } from "./_components/AgentLogsTab"
import { AgentSettingsTab } from "./_components/AgentSettingsTab"
import { AgentMemoryTab } from "./_components/AgentMemoryTab"
import { Glass } from "@/components/app/glass/Glass"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { usePlan } from "@/hooks/usePlan"


interface AgentStats {
  conversations: number
  lastAction: string
  costEur: string
  successRate: number
}

type Tab = "chat" | "logs" | "settings" | "memory"

export default function AgentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [activeTab, setActiveTab] = useState<Tab>("chat")
  const [stats, setStats] = useState<AgentStats>({ conversations: 0, lastAction: "—", costEur: "0.00", successRate: 100 })
  const agent = agents.find((a) => a.slug === slug)
  const { limits, loading: planLoading } = usePlan()
  const hasAccess = planLoading || limits.agents.includes(slug ?? "")

  useEffect(() => {
    if (!slug) return
    fetch(`/api/agents/${slug}/stats`)
      .then((r) => r.json())
      .then((d: AgentStats) => setStats(d))
      .catch(() => {})
  }, [slug])

  if (!agent) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#F5EFE6" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Agent introuvable</p>
          <Link href="/dashboard/agents" style={{ color: "#E86F4D", fontSize: 13 }}>
            &larr; Retour
          </Link>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
        <AgentAvatar slug={agent.slug} size={64} />
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F7", margin: "0 0 8px" }}>
            {agent.name} n&apos;est pas inclus dans ton plan
          </p>
          <p style={{ fontSize: 14, color: "rgba(245,245,247,0.55)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Passe au plan Pro pour accéder à {agent.name} et à tous les agents Lynaris.
          </p>
          <Link
            href="/dashboard/billing"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 40, padding: "0 20px", borderRadius: 10,
              background: "#E86F4D", color: "white",
              fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}
          >
            Voir les plans
          </Link>
        </div>
        <Link href="/dashboard/agents" style={{ color: "rgba(245,245,247,0.35)", fontSize: 13, textDecoration: "none" }}>
          &larr; Retour aux agents
        </Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "logs", label: "Logs", icon: Clock },
    { id: "settings", label: "Paramètres", icon: Settings },
    ...(slug === "charles" ? [{ id: "memory" as Tab, label: "Mémoire", icon: Brain }] : []),
  ]

  // Mode "grand chat" : sur l'onglet chat, on compacte radicalement le header
  // (juste back link + tabs) pour donner toute la hauteur à la conversation.
  // Sur les autres tabs (logs, paramètres, mémoire), on garde le hero card complet.
  const isChatFullscreen = activeTab === "chat"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0" }}>
      {/* Back link */}
      <div style={{ padding: isChatFullscreen ? "12px 24px 0" : "20px 24px 0", flexShrink: 0 }}>
        <Link
          href="/dashboard/agents"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, color: "#71717A", textDecoration: "none",
            marginBottom: isChatFullscreen ? 8 : 16,
          }}
        >
          <ArrowLeft size={13} aria-hidden /> Mes agents
        </Link>

        {/* ── Hero glass card — masqué en mode chat fullscreen ────────────── */}
        {!isChatFullscreen && (
        <div
          style={{
            background: "rgba(20,20,28,0.7)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            border: `1px solid ${agent.color}33`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Left: avatar + info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flex: 1, minWidth: 0 }}>
            <AgentAvatar slug={slug} size={56} glow priority style={{ borderRadius: "50%", flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + online badge */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 2 }}>
                <h1
                  style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em",
                    fontFamily: "var(--font-fraunces-var, Georgia, serif)", fontStyle: "italic",
                    color: agent.color, margin: 0,
                  }}
                >
                  {agent.name}
                </h1>

                {/* Online status */}
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 999,
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                    fontSize: 11, fontWeight: 600, color: "#10B981",
                  }}
                >
                  <span
                    style={{
                      width: 5, height: 5, borderRadius: "50%", background: "#10B981",
                      boxShadow: "0 0 6px #10B98180",
                      animation: "pulse-dot 2s ease-in-out infinite",
                    }}
                  />
                  En ligne
                </span>

              </div>

              <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 10px" }}>{agent.role}</p>

              {/* Tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                      background: `${agent.color}14`,
                      color: agent.color,
                      border: `1px solid ${agent.color}28`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "flex-start" }}>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: `${agent.color}20`,
                border: `1px solid ${agent.color}40`,
                color: agent.color,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              <Play size={12} aria-hidden />
              Tester
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              <SlidersHorizontal size={12} aria-hidden />
              Config
            </button>
          </div>
        </div>
        )}

        {/* ── Quick stats pills — masquées en mode chat fullscreen ─────── */}
        {!isChatFullscreen && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Conversations */}
          <Glass radius={10} tint={0.04} padding="8px 14px">
            <p
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 2px",
              }}
            >
              Conversations
            </p>
            <p
              style={{
                fontSize: 16, fontWeight: 700, color: "#F5EFE6", margin: 0,
                fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "-0.02em",
              }}
            >
              {stats.conversations}
            </p>
          </Glass>

          {/* Last action */}
          <Glass radius={10} tint={0.04} padding="8px 14px">
            <p
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 2px",
              }}
            >
              Dernière action
            </p>
            <p
              style={{
                fontSize: 13, fontWeight: 600, color: "#F5EFE6", margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {stats.lastAction}
            </p>
          </Glass>

          {/* Status */}
          <Glass radius={10} tint={0.04} padding="8px 14px">
            <p
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 2px",
              }}
            >
              Status
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#10B981",
                  boxShadow: "0 0 6px #10B98180",
                  animation: "pulse-dot 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 13, fontWeight: 600, color: "#10B981", margin: 0,
                }}
              >
                Actif
              </p>
            </div>
          </Glass>

          {/* Activity mini-stat */}
          <Glass radius={10} tint={0.04} padding="8px 14px">
            <p
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 2px",
              }}
            >
              Succès
            </p>
            <p
              style={{
                fontSize: 16, fontWeight: 700, color: "#10B981", margin: 0,
                fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "-0.02em",
              }}
            >
              {stats.successRate}%
            </p>
          </Glass>

          <Glass radius={10} tint={0.04} padding="8px 14px">
            <p
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 2px",
              }}
            >
              Coût
            </p>
            <p
              style={{
                fontSize: 16, fontWeight: 700, color: "#E86F4D", margin: 0,
                fontFamily: "var(--font-geist-mono, monospace)", letterSpacing: "-0.02em",
              }}
            >
              €{stats.costEur}
            </p>
          </Glass>
        </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div
          style={{ display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          role="tablist"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px",
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  color: active ? "#F5EFE6" : "#71717A",
                  background: "none", border: "none",
                  borderBottom: active ? `2px solid ${agent.color}` : "2px solid transparent",
                  marginBottom: -1, cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#A1A1AA"
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#71717A"
                }}
              >
                <Icon size={14} aria-hidden />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden" }} role="tabpanel">
        {activeTab === "chat" && <AgentChatTab agent={agent} />}
        {activeTab === "logs" && (
          <AgentLogsTab agent={agent} onSwitchToChat={() => setActiveTab("chat")} />
        )}
        {activeTab === "settings" && <AgentSettingsTab agent={agent} />}
        {activeTab === "memory" && slug === "charles" && <AgentMemoryTab />}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
