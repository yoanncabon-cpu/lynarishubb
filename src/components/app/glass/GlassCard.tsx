"use client"

import React, { useCallback } from "react"

export interface GlassCardProps {
  children?: React.ReactNode
  /** Tint coloré subtil (rgba ou hex) — overlay gradient */
  tint?: string
  radius?: number
  padding?: number | string
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  /** Specular sheen pointer-tracking (effet verre poli Apple) */
  specular?: boolean
  /** Bord iridescent conic gradient animé (réservé aux cartes signature) */
  iridescent?: boolean
  onClick?: () => void
  as?: "div" | "button" | "a" | "article"
  ariaLabel?: string
}

/**
 * Carte verre niveau 2 avec tint, hover lift, et options premium :
 * - `specular` : highlight radial qui suit le pointeur (verre poli)
 * - `iridescent` : bord conic gradient animé (signature)
 */
export function GlassCard({
  children,
  tint,
  radius = 22,
  padding = 20,
  className = "",
  style,
  hover = true,
  specular = false,
  iridescent = false,
  onClick,
  as: Tag = "div",
  ariaLabel,
}: GlassCardProps) {
  const composed = [
    "lg-surface-2",
    "lg-sheen",
    hover ? "lg-card-hover" : "",
    specular ? "lg-specular" : "",
    iridescent ? "lg-iridescent" : "",
    className,
  ].filter(Boolean).join(" ")

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * 100
    const my = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty("--mx", `${mx}%`)
    el.style.setProperty("--my", `${my}%`)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any

  return (
    <TagAny
      onClick={onClick}
      onMouseMove={specular ? onMouseMove : undefined}
      aria-label={ariaLabel}
      className={composed}
      style={{
        borderRadius: radius,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {tint && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: `linear-gradient(135deg, ${tint} 0%, transparent 55%)`,
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.7,
          }}
        />
      )}
      <div
        className="lg-content"
        style={{
          padding,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </TagAny>
  )
}
