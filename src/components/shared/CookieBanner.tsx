"use client"
import { useState, useEffect } from "react"

type Consent = { essential: true; analytics: boolean; marketing: boolean }

function getStoredConsent(): Consent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("lynaris_cookie_consent")
    return raw ? (JSON.parse(raw) as Consent) : null
  } catch { return null }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true)
  }, [])

  function save(consent: Consent) {
    localStorage.setItem("lynaris_cookie_consent", JSON.stringify(consent))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: "fixed", bottom: 24, left: 24, right: 24, zIndex: 9998,
      maxWidth: 480, margin: "0 auto",
      background: "rgba(18,18,22,0.98)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16,
      padding: "20px 24px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <p style={{ fontSize: 14, color: "#F5F5F7", fontWeight: 600, margin: "0 0 8px" }}>
        Cookies et confidentialité
      </p>
      <p style={{ fontSize: 13, color: "#A1A1AA", margin: "0 0 16px", lineHeight: 1.5 }}>
        Nous utilisons des cookies essentiels au fonctionnement du site. Avec votre accord, nous utilisons également des cookies d&apos;analyse pour améliorer l&apos;expérience.{" "}
        <a href="/legal/confidentialite" style={{ color: "#E86F4D" }}>Politique de confidentialité</a>
      </p>

      {showCustomize && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "essential", label: "Essentiels", desc: "Authentification, session — obligatoires", locked: true, value: true, set: undefined as ((v: boolean) => void) | undefined },
            { key: "analytics", label: "Analytiques", desc: "Mesure d'audience anonymisée", locked: false, value: analytics, set: setAnalytics as (v: boolean) => void },
            { key: "marketing", label: "Marketing", desc: "Publicité personnalisée", locked: false, value: marketing, set: setMarketing as (v: boolean) => void },
          ].map(({ key, label, desc, locked, value, set }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>{desc}</p>
              </div>
              <button
                type="button"
                disabled={locked}
                onClick={() => set?.(!value)}
                style={{
                  width: 40, height: 22, borderRadius: 999, border: "none",
                  background: value ? "#E86F4D" : "rgba(255,255,255,0.15)",
                  cursor: locked ? "not-allowed" : "pointer",
                  position: "relative", transition: "background 0.2s",
                  opacity: locked ? 0.5 : 1,
                }}
                aria-checked={value}
                role="switch"
              >
                <span style={{
                  position: "absolute", top: 3,
                  left: value ? "calc(100% - 19px)" : 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "white", transition: "left 0.2s",
                }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => save({ essential: true, analytics: false, marketing: false })}
          style={{ flex: 1, minWidth: 120, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#A1A1AA", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Refuser tout
        </button>
        {!showCustomize && (
          <button type="button" onClick={() => setShowCustomize(true)}
            style={{ flex: 1, minWidth: 120, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#A1A1AA", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            Personnaliser
          </button>
        )}
        {showCustomize && (
          <button type="button" onClick={() => save({ essential: true, analytics, marketing })}
            style={{ flex: 1, minWidth: 120, height: 36, borderRadius: 8, border: "1px solid rgba(232,111,77,0.3)", background: "rgba(232,111,77,0.2)", color: "#E86F4D", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Enregistrer mes choix
          </button>
        )}
        <button type="button" onClick={() => save({ essential: true, analytics: true, marketing: true })}
          style={{ flex: 1, minWidth: 120, height: 36, borderRadius: 8, border: "none", background: "#E86F4D", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Tout accepter
        </button>
      </div>
    </div>
  )
}
