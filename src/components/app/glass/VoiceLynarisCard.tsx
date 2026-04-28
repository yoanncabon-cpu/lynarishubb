"use client"

import { useEffect, useState } from "react"
import { Mic, MicOff, Sparkles } from "lucide-react"
import { GlassCard } from "./GlassCard"
import { GlassChip } from "./GlassChip"

const STORAGE_KEY = "lynaris-voice-enabled"

/**
 * Tuile Voice Lynaris — toggle micro persistant + wake word "OK Lynaris".
 * Active/désactive le wake word listener (le composant VoiceLynaris global
 * lit cette préférence via localStorage).
 */
export function VoiceLynarisCard() {
  // Par défaut : actif (cohérent avec le comportement initial de VoiceLynaris).
  // Désactivé uniquement si l'utilisateur a explicitement choisi "0".
  const [enabled, setEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    setEnabled(saved !== "0")
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    if (mounted) {
      // Convention storage : "0" = désactivé explicitement, "1" ou absence = actif (défaut)
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      // Émet un event custom pour que VoiceLynaris global puisse réagir
      window.dispatchEvent(new CustomEvent("lynaris:voice-toggle", { detail: { enabled: next } }))
    }
  }

  return (
    <GlassCard
      tint={enabled ? "rgba(232,111,77,0.20)" : undefined}
      radius={20}
      padding={20}
      hover={false}
      specular
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
        {/* Header : icon + toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            aria-hidden
            style={{
              position: "relative",
              width: 46,
              height: 46,
              borderRadius: 14,
              background: enabled
                ? "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
              border: enabled
                ? "1px solid rgba(232,111,77,0.55)"
                : "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: enabled
                ? "0 10px 26px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)"
                : "inset 0 1px 0 var(--glass-highlight)",
              transition: "background 280ms var(--ease-apple), border-color 280ms var(--ease-apple), box-shadow 280ms var(--ease-apple)",
              flexShrink: 0,
            }}
          >
            {enabled ? (
              <>
                <Mic size={20} color="#fff" />
                {/* Onde sonore animée quand actif */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: 18,
                    border: "1.5px solid rgba(232,111,77,0.55)",
                    animation: "lg-pulse-ring 2.4s var(--ease-apple) infinite",
                    pointerEvents: "none",
                  }}
                />
              </>
            ) : (
              <MicOff size={19} color="rgba(250,250,250,0.45)" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              Voice Lynaris
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: enabled ? "var(--accent)" : "rgba(250,250,250,0.5)",
                margin: "2px 0 0",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {enabled ? "● Écoute active" : "○ Micro désactivé"}
            </p>
          </div>

          {/* Toggle iOS-style */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Désactiver le micro" : "Activer le micro"}
            onClick={toggle}
            className="lg-focus"
            style={{
              position: "relative",
              width: 44,
              height: 26,
              borderRadius: 999,
              border: "1px solid",
              borderColor: enabled ? "rgba(232,111,77,0.55)" : "var(--glass-border-strong)",
              background: enabled
                ? "linear-gradient(135deg, var(--accent), #C2552A)"
                : "rgba(255,255,255,0.06)",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              boxShadow: enabled
                ? "0 4px 14px -4px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.20)"
                : "inset 0 1px 2px rgba(0,0,0,0.20)",
              transition: "background 280ms var(--ease-apple), border-color 280ms var(--ease-apple), box-shadow 280ms var(--ease-apple)",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 2,
                left: enabled ? 20 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(0,0,0,0.05)",
                transition: "left 320ms var(--ease-apple)",
              }}
            />
          </button>
        </div>

        {/* Wake word indicator */}
        <div
          className="lg-surface-3"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 13,
            opacity: enabled ? 1 : 0.55,
            transition: "opacity 280ms var(--ease-apple)",
          }}
        >
          <Sparkles
            size={14}
            style={{ color: enabled ? "var(--accent)" : "rgba(250,250,250,0.45)", flexShrink: 0 }}
            aria-hidden
          />
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "rgba(250,250,250,0.78)", lineHeight: 1.4 }}>
            Dis{" "}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "1px 7px",
                borderRadius: 6,
                background: enabled ? "rgba(232,111,77,0.18)" : "rgba(255,255,255,0.06)",
                border: enabled ? "1px solid rgba(232,111,77,0.32)" : "1px solid var(--glass-border)",
                color: enabled ? "var(--accent)" : "rgba(250,250,250,0.65)",
                fontWeight: 700,
                fontSize: 11.5,
                letterSpacing: "0.02em",
                fontFamily: "var(--font-mono, ui-monospace, monospace)",
              }}
            >
              OK&nbsp;Lynaris
            </span>{" "}
            pour réveiller{" "}
            <span style={{ color: "#C4B5FD", fontWeight: 600 }}>Charles</span>
          </div>
        </div>

        {/* Footer : 2 chips d'action rapide */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
          <GlassChip
            onClick={toggle}
            ariaLabel={enabled ? "Désactiver le micro" : "Activer le micro"}
            style={{ fontSize: 11 }}
          >
            {enabled ? <MicOff size={11} /> : <Mic size={11} />}
            {enabled ? "Couper" : "Activer"}
          </GlassChip>
          <GlassChip style={{ fontSize: 11, opacity: enabled ? 1 : 0.55 }}>
            <Sparkles size={11} />
            Wake word actif
          </GlassChip>
        </div>
      </div>
    </GlassCard>
  )
}
