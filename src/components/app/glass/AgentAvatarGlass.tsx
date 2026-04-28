import React from "react"

interface AgentAvatarGlassProps {
  name: string
  color: string
  size?: number
  radius?: string
}

export function AgentAvatarGlass({ name, color, size = 38, radius = "28%" }: AgentAvatarGlassProps) {
  const initial = name[0]?.toUpperCase() ?? "?"
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px ${color}40`,
      }}
    >
      {/* Specular */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.60), transparent 60%)",
        pointerEvents: "none",
      }} />
      <span style={{
        position: "relative",
        color: "#fff",
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontFamily: "var(--font-geist-sans, system-ui)",
        userSelect: "none",
        lineHeight: 1,
      }}>
        {initial}
      </span>
    </div>
  )
}
