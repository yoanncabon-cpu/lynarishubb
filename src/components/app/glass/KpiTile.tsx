"use client"

import React from "react"
import { GlassPanel } from "./GlassPanel"

export interface KpiTileProps {
  label: string
  value: string | number | null
  hint?: string
  icon?: React.ReactNode
  accent?: string
}

/**
 * Mini-carte KPI — utilisée dans le right panel.
 */
export function KpiTile({ label, value, hint, icon, accent = "#E86F4D" }: KpiTileProps) {
  return (
    <GlassPanel level={2} radius={16} padding={14}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {icon && (
          <div
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${accent}1F`,
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(250,250,250,0.55)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#FAFAFA",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value !== null && value !== undefined ? value : "—"}
      </div>
      {hint && (
        <div style={{ marginTop: 4, fontSize: 12, color: "rgba(250,250,250,0.45)" }}>{hint}</div>
      )}
    </GlassPanel>
  )
}
