import React from "react"
import { Glass } from "@/components/app/glass/Glass"
import { Ticker } from "@/components/app/glass/Ticker"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  label: string
  value: number
  unit?: string
  hint?: string
  agentName: string
  agentColor: string
  icon: LucideIcon
}

export function KpiCard({ label, value, unit, hint, agentName, agentColor, icon: Icon }: KpiCardProps) {
  return (
    <div
      style={{ transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)", height: "100%" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}
    >
    <Glass radius={18} tint={0.05} padding="18px 18px 16px" style={{ height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
        {/* Label + icon */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6A6A7A" }}>
            {label}
          </span>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `${agentColor}22`,
            border: `1px solid ${agentColor}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color={agentColor} strokeWidth={1.5} aria-hidden />
          </div>
        </div>

        {/* Agent badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
          padding: "2px 8px", borderRadius: 999,
          background: `${agentColor}1A`, border: `1px solid ${agentColor}33`,
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: agentColor }}>{agentName}</span>
        </div>

        {/* Value */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", color: "#F5F5F7", lineHeight: 1 }}>
            <Ticker to={value} />
          </span>
          {unit && <span style={{ fontSize: 12, color: "#71717A", fontFamily: "var(--font-geist-mono, monospace)" }}>{unit}</span>}
        </div>

        {/* Hint */}
        {hint && <span style={{ fontSize: 11, color: "#A1A1AA", marginTop: "auto" }}>{hint}</span>}
      </div>
    </Glass>
    </div>
  )
}
