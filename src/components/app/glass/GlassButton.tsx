"use client"
import React, { useState } from "react"
import type { LucideIcon } from "lucide-react"

type Variant = "primary" | "ghost" | "clear"
type Size = "sm" | "md" | "lg"

const HEIGHT: Record<Size, number> = { sm: 28, md: 36, lg: 44 }
const FONT_SIZE: Record<Size, number> = { sm: 12, md: 13, lg: 14 }
const PADDING: Record<Size, string> = { sm: "0 12px", md: "0 16px", lg: "0 20px" }

interface GlassButtonProps {
  children?: React.ReactNode
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconSize?: number
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  style?: React.CSSProperties
  type?: "button" | "submit" | "reset"
  "aria-label"?: string
}

export function GlassButton({
  children, variant = "ghost", size = "md", icon: Icon, iconSize,
  onClick, disabled, style, type = "button", "aria-label": ariaLabel,
}: GlassButtonProps) {
  const [hovered, setHovered] = useState(false)
  const h = HEIGHT[size]
  const fs = FONT_SIZE[size]
  const iSize = iconSize ?? (size === "sm" ? 13 : size === "lg" ? 16 : 14)

  const baseStyle: React.CSSProperties = {
    height: h,
    padding: children ? PADDING[size] : `0 ${h * 0.28}px`,
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: fs,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
    outline: "none",
    letterSpacing: "-0.01em",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  }

  let variantStyle: React.CSSProperties = {}
  if (variant === "primary") {
    variantStyle = {
      background: hovered
        ? "linear-gradient(135deg, #9333EA, #7C3AED)"
        : "linear-gradient(135deg, #7C3AED, #A78BFA)",
      color: "#fff",
      boxShadow: hovered
        ? "0 0 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
        : "0 0 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
      border: "1px solid rgba(167,139,250,0.4)",
    }
  } else if (variant === "ghost") {
    variantStyle = {
      background: hovered ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
      color: hovered ? "#F5F5F7" : "#A1A1AA",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
    }
  } else {
    variantStyle = {
      background: "transparent",
      color: hovered ? "#F5F5F7" : "#A1A1AA",
      border: "1px solid transparent",
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...baseStyle, ...variantStyle, ...style }}
    >
      {Icon && <Icon size={iSize} aria-hidden strokeWidth={1.5} />}
      {children}
    </button>
  )
}
