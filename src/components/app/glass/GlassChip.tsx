"use client"

import React from "react"

export interface GlassChipProps {
  children: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
  style?: React.CSSProperties
  as?: "button" | "span" | "div"
  ariaLabel?: string
  type?: "button" | "submit"
}

/**
 * Chip / pill verre niveau 3 — actions rapides, tags, filtres.
 */
export function GlassChip({
  children,
  icon,
  onClick,
  active = false,
  className = "",
  style,
  as: Tag = onClick ? "button" : "span",
  ariaLabel,
  type = "button",
}: GlassChipProps) {
  const isButton = Tag === "button"

  return (
    <Tag
      type={isButton ? type : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`lg-chip lg-focus ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? "rgba(232,111,77,0.45)" : undefined,
        background: active ? "rgba(232,111,77,0.14)" : undefined,
        color: active ? "#FAFAFA" : undefined,
        ...style,
      }}
    >
      {icon && (
        <span style={{ display: "inline-flex", flexShrink: 0, color: active ? "var(--accent)" : "rgba(250,250,250,0.55)" }}>
          {icon}
        </span>
      )}
      {children}
    </Tag>
  )
}
