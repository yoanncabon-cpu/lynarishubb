"use client"
import React from "react"

const LAYOUT_KEYS = new Set([
  "display","flexDirection","alignItems","justifyContent","gap","flexWrap",
  "gridTemplateColumns","gridTemplateRows","gridAutoColumns","gridAutoRows",
  "rowGap","columnGap","alignContent","justifyItems","justifySelf","flex","overflow",
])

export interface GlassProps {
  children?: React.ReactNode
  radius?: number
  blur?: number
  tint?: number
  padding?: number | string
  halo?: { color: string; intensity?: number }
  highlight?: boolean
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  className?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
  role?: string
  tabIndex?: number
  "aria-label"?: string
}

export function Glass({
  children, radius = 24, blur = 32, tint = 0.06, padding = 20,
  halo, highlight = true, style = {}, contentStyle = {}, className,
  ...handlers
}: GlassProps) {
  const layoutStyle: React.CSSProperties = {}
  const wrapperStyle: React.CSSProperties = {}

  for (const [key, val] of Object.entries(style)) {
    if (LAYOUT_KEYS.has(key)) {
      (layoutStyle as Record<string, unknown>)[key] = val
    } else {
      (wrapperStyle as Record<string, unknown>)[key] = val
    }
  }

  const haloShadow = halo
    ? `, 0 0 80px -10px ${halo.color}${Math.round((halo.intensity ?? 0.2) * 255).toString(16).padStart(2, "0")}`
    : ""

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: radius,
        border: "1px solid rgba(255,255,255,0.12)",
        background: `rgba(255,255,255,${tint})`,
        backdropFilter: `blur(${blur}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)${haloShadow}`,
        overflow: "hidden",
        ...wrapperStyle,
      }}
      {...handlers}
    >
      {/* Sheen overlay */}
      {highlight && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: typeof padding === "number" ? padding : padding,
          height: "100%",
          boxSizing: "border-box",
          ...layoutStyle,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
