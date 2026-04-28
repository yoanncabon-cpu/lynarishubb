"use client"

import React from "react"
import { GlassPanel } from "./GlassPanel"

export interface RightPanelProps {
  children: React.ReactNode
  visible?: boolean
  width?: number
  /** Mode overlay (mobile/tablette) — flotte par-dessus avec backdrop */
  overlay?: boolean
  onClose?: () => void
}

/**
 * Panneau contextuel droit (KPIs, raccourcis voice, etc.).
 * Desktop : flottant à droite. Tablette : overlay avec backdrop verre.
 */
export function RightPanel({ children, visible = true, width = 340, overlay = false, onClose }: RightPanelProps) {
  if (!visible) return null

  if (overlay) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          aria-hidden
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7,7,10,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
        <GlassPanel
          level={1}
          strong
          radius={22}
          aria-label="Panneau contextuel"
          style={{
            position: "relative",
            margin: 16,
            width,
            maxWidth: "90vw",
            height: "calc(100dvh - 32px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          contentStyle={{ padding: 16, overflowY: "auto" }}
        >
          {children}
        </GlassPanel>
      </div>
    )
  }

  return (
    <GlassPanel
      level={1}
      radius={22}
      aria-label="Panneau contextuel"
      style={{
        flexShrink: 0,
        width,
        height: "calc(100dvh - 92px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      contentStyle={{ padding: 16, overflowY: "auto" }}
    >
      {children}
    </GlassPanel>
  )
}
