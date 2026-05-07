"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { agents } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { ArrowRight, Lock, Send, Zap } from "lucide-react"
import { usePlan } from "@/hooks/usePlan"
import { GlassCard, GlassChip } from "@/components/app/glass"

const tabs = ["Mes assistants", "Historique des conversations"] as const

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const { plan, limits, loading } = usePlan()

  return (
    <div style={{ padding: "clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 32px", maxWidth: 1480, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
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
          Mes assistants
        </h1>
        <p style={{ fontSize: 14, color: "rgba(250,250,250,0.55)", margin: "8px 0 0", letterSpacing: "-0.005em" }}>
          Une équipe d&apos;agents IA prêts à exécuter
        </p>
      </header>

      {/* Tabs verre */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map((tab, i) => (
          <GlassChip
            key={tab}
            active={activeTab === i}
            onClick={() => setActiveTab(i)}
            style={{ padding: "8px 14px", fontSize: 13 }}
          >
            {tab}
          </GlassChip>
        ))}
      </div>

      {/* Tab: Mes assistants */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {agents
            .filter((agent) => loading || limits.agents.includes(agent.slug))
            .map((agent) => (
              <AgentCard key={agent.slug} agent={agent} locked={false} plan={plan} />
            ))}
        </div>
      )}

      {/* Tab: Historique */}
      {activeTab === 1 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px 0",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 15, color: "rgba(250,250,250,0.6)", margin: 0, textAlign: "center" }}>
            Retrouve toutes tes conversations dans l&apos;espace dédié.
          </p>
          <Link
            href="/dashboard/conversations"
            className="lg-focus"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 42,
              padding: "0 22px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.12) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.35)",
              boxShadow: "0 8px 24px -6px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.10)",
              color: "#C4B5FD",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
            }}
          >
            Voir toutes mes conversations
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  locked,
  plan,
}: {
  agent: (typeof agents)[number]
  locked: boolean
  plan: string
}) {
  const router = useRouter()
  const rgb = hexToRgb(agent.color)
  const requiredPlan = plan === "trial" || plan === "decouverte" ? "Pro" : "Sur-mesure"
  const [quickInput, setQuickInput] = useState("")

  function handleClick() {
    if (locked) {
      router.push("/dashboard/billing")
    }
  }

  function goAgent() {
    const q = quickInput.trim()
    if (q) {
      localStorage.setItem(`agent_prefill_${agent.slug}`, q)
      localStorage.setItem(`agent_autosubmit_${agent.slug}`, "true")
    }
    router.push(`/dashboard/agents/${agent.slug}`)
  }

  return (
    <div onClick={locked ? handleClick : undefined} style={{ cursor: locked ? "pointer" : undefined }}>
      <GlassCard
        tint={locked ? undefined : `rgba(${rgb},0.18)`}
        radius={20}
        padding={20}
        hover={!locked}
        style={{
          opacity: locked ? 0.55 : 1,
          filter: locked ? "grayscale(0.6)" : "none",
        }}
      >
        {/* Bord supérieur lumineux couleur agent */}
        {!locked && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 16,
              right: 16,
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(${rgb},0.55), transparent)`,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}

        {/* Badge plan requis */}
        {locked && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(232,111,77,0.14)",
              border: "1px solid rgba(232,111,77,0.32)",
              borderRadius: 999,
              padding: "3px 9px",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "0.04em",
              zIndex: 2,
            }}
          >
            <Lock size={9} aria-hidden />
            {requiredPlan}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AgentAvatar slug={agent.slug} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: locked ? "rgba(250,250,250,0.55)" : "#FAFAFA",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {agent.name}
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  color: locked ? "rgba(250,250,250,0.3)" : agent.color,
                  margin: "2px 0 0",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                {agent.role}
              </p>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: locked ? "rgba(250,250,250,0.42)" : "rgba(250,250,250,0.72)",
              lineHeight: 1.55,
              margin: 0,
              flex: 1,
            }}
          >
            {agent.description}
          </p>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agent.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: locked ? "rgba(250,250,250,0.42)" : agent.color,
                  background: locked ? "rgba(255,255,255,0.05)" : `rgba(${rgb},0.16)`,
                  border: `1px solid ${locked ? "var(--glass-border)" : `rgba(${rgb},0.32)`}`,
                  borderRadius: 999,
                  padding: "3px 9px",
                  letterSpacing: "0.01em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          {locked ? (
            <button
              type="button"
              onClick={handleClick}
              className="lg-focus"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 11,
                background: "linear-gradient(135deg, rgba(232,111,77,0.16) 0%, rgba(232,111,77,0.08) 100%)",
                border: "1px solid rgba(232,111,77,0.32)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent)",
                cursor: "pointer",
                width: "100%",
                fontFamily: "inherit",
                transition: "background 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
              }}
            >
              <Zap size={13} aria-hidden />
              Passer au plan {requiredPlan}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goAgent() }}
                placeholder={`Demande à ${agent.name}…`}
                aria-label={`Message à ${agent.name}`}
                style={{
                  flex: 1,
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#FAFAFA",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 220ms, background 220ms",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `rgba(${rgb},0.5)`
                  e.currentTarget.style.background = "rgba(255,255,255,0.09)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                }}
              />
              <button
                type="button"
                onClick={goAgent}
                aria-label="Envoyer"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  border: "none",
                  flexShrink: 0,
                  background: `linear-gradient(135deg, rgba(${rgb},0.9) 0%, rgba(${rgb},0.7) 100%)`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 6px 18px -4px rgba(${rgb},0.5)`,
                  transition: "transform 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"
                }}
              >
                <Send size={14} color="#fff" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
