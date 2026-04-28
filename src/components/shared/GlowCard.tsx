"use client"

import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string
  intensity?: "low" | "medium" | "high"
}

export function GlowCard({
  children,
  className,
  glowColor = "rgba(124,58,237,0.15)",
  intensity = "medium",
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({})

  const intensityMap = { low: 0.5, medium: 1, high: 1.5 }
  const factor = intensityMap[intensity]

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setGlowStyle({
      background: `radial-gradient(400px circle at ${x}px ${y}px, ${glowColor.replace("0.15", String(0.15 * factor))}, transparent 70%)`,
    })
  }

  function handleMouseLeave() {
    setGlowStyle({})
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[--ly-border] bg-[--ly-surface] transition-all duration-300",
        "hover:border-[--ly-border-hover]",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={glowStyle}
        aria-hidden
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
