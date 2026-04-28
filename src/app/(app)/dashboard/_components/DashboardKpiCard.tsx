"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"

interface DashboardKpiCardProps {
  label: string
  value: string
  suffix?: string
  icon: LucideIcon
  color: string
  change?: string
}

export function DashboardKpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  change,
}: DashboardKpiCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#161618",
        border: `1px solid ${hovered ? `${color}20` : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 200ms ease",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${color}CC, ${color}20)`,
        }}
      />

      <div style={{ padding: "16px 20px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#71717A",
              margin: 0,
            }}
          >
            {label}
          </p>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: `${color}14`,
              border: `1px solid ${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={16} style={{ color }} aria-hidden />
          </div>
        </div>

        <div>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#F5EFE6",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </span>
            {suffix && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#71717A",
                  marginLeft: 3,
                }}
              >
                {suffix}
              </span>
            )}
          </p>
          {change && (
            <p
              style={{
                fontSize: 12,
                color: "#A1A1AA",
                marginTop: 8,
                margin: "8px 0 0",
              }}
            >
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
