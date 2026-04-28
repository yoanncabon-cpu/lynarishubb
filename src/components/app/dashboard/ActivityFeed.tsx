import React from "react"
import { Glass } from "@/components/app/glass/Glass"
import { Activity, Phone, Feather, Mail, Target, Camera, Compass } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ActivityItem {
  agent: string
  agentColor: string
  icon: LucideIcon
  text: string
  sub: string
  time: string
}

const ITEMS: ActivityItem[] = [
  { agent: "Marine", agentColor: "#22D3EE", icon: Phone, text: "RDV créé — Mme Rousseau", sub: "jeudi 9h30", time: "12 min" },
  { agent: "Lou", agentColor: "#F472B6", icon: Feather, text: "Post LinkedIn publié", sub: "847 vues", time: "1 h" },
  { agent: "Mae", agentColor: "#F59E0B", icon: Mail, text: "12 emails triés", sub: "2 brouillons", time: "1 h" },
  { agent: "Elio", agentColor: "#10B981", icon: Target, text: "Thomas Perrin qualifié", sub: "score 82", time: "2 h" },
  { agent: "Max", agentColor: "#EC4899", icon: Camera, text: "6 visuels générés", sub: "Lynaris dark", time: "3 h" },
  { agent: "Charles", agentColor: "#7C3AED", icon: Compass, text: "Brief quotidien généré", sub: "3 priorités", time: "4 h" },
]

export function ActivityFeed() {
  return (
    <Glass radius={20} tint={0.05} padding={0} style={{ height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Activity size={15} color="#22D3EE" strokeWidth={1.5} aria-hidden />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", letterSpacing: "-0.02em" }}>Activité</span>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#10B981", boxShadow: "0 0 6px #10B98180",
              display: "inline-block",
            }} aria-hidden />
          </div>
          <span style={{
            padding: "2px 8px", borderRadius: 999,
            background: "rgba(244,114,182,0.2)", border: "1px solid rgba(244,114,182,0.3)",
            fontSize: 11, fontWeight: 700, color: "#F472B6",
          }}>
            24
          </span>
        </div>

        {/* Items */}
        <div style={{
          flex: 1, overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.12) transparent",
        } as React.CSSProperties}>
          {ITEMS.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 18px",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                transition: "background 150ms",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
              >
                {/* Icon */}
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: `${item.agentColor}22`,
                  border: `1px solid ${item.agentColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={13} color={item.agentColor} strokeWidth={1.5} aria-hidden />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#F5F5F7", margin: 0, fontWeight: 500, letterSpacing: "-0.01em" }}>
                    {item.text}
                  </p>
                  <p style={{ fontSize: 10, margin: "1px 0 0", color: "#71717A" }}>
                    <span style={{ color: item.agentColor, fontWeight: 600 }}>{item.agent}</span>
                    {" · "}
                    <span>{item.sub}</span>
                  </p>
                </div>

                {/* Time */}
                <span style={{ fontSize: 10, color: "#6A6A7A", fontFamily: "var(--font-geist-mono, monospace)", flexShrink: 0 }}>
                  {item.time}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Glass>
  )
}
