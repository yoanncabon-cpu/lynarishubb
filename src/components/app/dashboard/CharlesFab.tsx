"use client"
import React, { useState } from "react"
import Link from "next/link"

export function CharlesFab() {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/dashboard/agents/charles"
      aria-label="Ouvrir Charles"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 50,
        width: 52,
        height: 52,
        borderRadius: 16,
        background: hovered
          ? "linear-gradient(135deg, #9333EA, #A78BFA)"
          : "linear-gradient(135deg, #7C3AED, #A78BFA)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: hovered
          ? "0 0 40px rgba(124,58,237,0.7), inset 0 1px 0 rgba(255,255,255,0.35)"
          : "0 0 24px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
        transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
        transform: hovered ? "scale(1.06)" : "scale(1)",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-geist-sans, system-ui)", letterSpacing: "-0.04em", userSelect: "none" }}>C</span>
      {/* Online dot */}
      <span style={{
        position: "absolute",
        top: -2,
        right: -2,
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: "#10B981",
        border: "2px solid #06060B",
        boxShadow: "0 0 6px rgba(16,185,129,0.6)",
      }} aria-hidden />
    </Link>
  )
}
