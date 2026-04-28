"use client"

import React from "react"

type GlassLevel = 1 | 2 | 3

export interface GlassPanelProps {
  level?: GlassLevel
  radius?: number
  padding?: number | string
  className?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  children?: React.ReactNode
  as?: "div" | "section" | "aside" | "header" | "nav"
  strong?: boolean
  sheen?: boolean
  role?: string
  "aria-label"?: string
}

/**
 * Panneau structurel verre — sidebar, topbar, right panel.
 * Niveau 1 (sidebar/topbar), 2 (cartes), 3 (chips/imbriqué).
 */
export function GlassPanel({
  level = 1,
  radius = 22,
  padding,
  className = "",
  style,
  contentStyle,
  children,
  as: Tag = "div",
  strong = false,
  sheen = true,
  role,
  "aria-label": ariaLabel,
}: GlassPanelProps) {
  const surfaceClass = `lg-surface-${level}`
  const composed = [surfaceClass, sheen ? "lg-sheen" : "", strong ? "lg-surface-strong" : "", className].filter(Boolean).join(" ")

  return (
    <Tag
      role={role}
      aria-label={ariaLabel}
      className={composed}
      style={{ borderRadius: radius, ...style }}
    >
      <div
        className="lg-content"
        style={{
          padding,
          height: "100%",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </Tag>
  )
}
