import React from "react"
import { Glass } from "@/components/app/glass/Glass"
import { AgentAvatarGlass } from "@/components/app/glass/AgentAvatarGlass"
import { GlassButton } from "@/components/app/glass/GlassButton"
import Link from "next/link"

const STAGES = [
  { label: "New", count: 2, color: "#22D3EE" },
  { label: "Contactés", count: 3, color: "#A78BFA" },
  { label: "Relancés", count: 2, color: "#F59E0B" },
  { label: "Qualifiés", count: 1, color: "#10B981" },
]

export function ElioCard() {
  const ELIO_COLOR = "#10B981"

  return (
    <Glass radius={20} tint={0.05} halo={{ color: ELIO_COLOR, intensity: 0.15 }} padding={0}>
      <div style={{ padding: "18px 20px 14px", display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgentAvatarGlass name="Elio" color={ELIO_COLOR} size={38} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: ELIO_COLOR, letterSpacing: "-0.02em" }}>Elio</span>
                <span style={{
                  padding: "1px 8px", borderRadius: 999,
                  background: "rgba(124,58,237,0.2)", border: "1px solid rgba(167,139,250,0.3)",
                  fontSize: 10, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.04em",
                }}>
                  PIPELINE
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#71717A" }}>8 prospects qualifiés cette semaine</span>
            </div>
          </div>
          <Link href="/dashboard/agents/elio">
            <GlassButton variant="ghost" size="sm">Voir pipeline</GlassButton>
          </Link>
        </div>

        {/* Kanban stages */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flex: 1 }}>
          {STAGES.map((stage) => (
            <div key={stage.label} style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stage.color}20`,
              borderTop: `2px solid ${stage.color}`,
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{
                fontSize: 24, fontWeight: 700, color: stage.color,
                fontFamily: "var(--font-geist-mono, monospace)", lineHeight: 1,
              }}>
                {stage.count}
              </span>
              <span style={{ fontSize: 11, color: "#71717A" }}>{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, fontSize: 11, color: "#71717A" }}>
          {"-> "}<strong style={{ color: "#F5F5F7" }}>Thomas Perrin</strong>
          <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: "#A1A1AA" }}> · score 82/100</span>
          <span style={{ fontFamily: "var(--font-geist-mono, monospace)", color: "#6A6A7A" }}> · il y a 2h</span>
        </div>
      </div>
    </Glass>
  )
}
