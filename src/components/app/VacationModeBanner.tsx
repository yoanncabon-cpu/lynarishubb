"use client"

import { useState, useEffect } from "react"
import { Palmtree, X } from "lucide-react"

const LS_KEY = "lynaris_vacation_mode"

export function useVacationMode() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    try {
      setActive(localStorage.getItem(LS_KEY) === "true")
    } catch { /* SSR */ }
  }, [])

  function enable() {
    try { localStorage.setItem(LS_KEY, "true") } catch { /* */ }
    setActive(true)
  }

  function disable() {
    try { localStorage.removeItem(LS_KEY) } catch { /* */ }
    setActive(false)
  }

  return { active, enable, disable }
}

// Bandeau affiché dans le dashboard quand le mode vacances est actif
export function VacationModeBanner({ onDisable }: { onDisable: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        background: "rgba(251,191,36,0.08)",
        borderBottom: "1px solid rgba(251,191,36,0.25)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <Palmtree
        aria-hidden
        style={{ width: 16, height: 16, color: "#FBB724", flexShrink: 0 }}
      />
      <p style={{ flex: 1, margin: 0, fontSize: 13, color: "#FDE68A", fontWeight: 500 }}>
        Mode vacances actif — Vos agents répondent en mode réduit
      </p>
      <button
        type="button"
        onClick={onDisable}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 30,
          padding: "0 12px",
          borderRadius: 8,
          border: "1px solid rgba(251,191,36,0.4)",
          background: "rgba(251,191,36,0.12)",
          color: "#FBB724",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.22)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.12)"
        }}
      >
        <X aria-hidden style={{ width: 12, height: 12 }} />
        Désactiver
      </button>
    </div>
  )
}
