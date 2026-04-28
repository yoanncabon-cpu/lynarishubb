"use client"
import React, { useState } from "react"
import { Bell, ChevronDown } from "lucide-react"
import { GlassButton } from "@/components/app/glass/GlassButton"
import { usePathname } from "next/navigation"

const BREADCRUMB: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/agents": "Mes agents",
  "/dashboard/skills": "Compétences",
  "/dashboard/integrations": "Intégrations",
  "/dashboard/conversations": "Conversations",
  "/dashboard/analytics": "Analytics",
  "/dashboard/billing": "Facturation",
  "/dashboard/settings": "Paramètres",
  "/dashboard/team": "Équipe",
}

export function GlassTopbar({ onSearchClick }: { onSearchClick?: () => void }) {
  const pathname = usePathname()
  const pageName = BREADCRUMB[pathname] ?? "Dashboard"
  const [userOpen, setUserOpen] = useState(false)

  return (
    <header style={{
      height: 56, flexShrink: 0,
      display: "flex", alignItems: "center", gap: 16,
      padding: "0 16px 0 20px",
      background: "rgba(6,6,11,0.7)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717A", flexShrink: 0 }}>
        <span>Lynaris</span>
        <span style={{ color: "#3F3F46" }}>›</span>
        <span style={{ color: "#F5F5F7", fontWeight: 600 }}>{pageName}</span>
      </div>

      {/* Search */}
      <button
        type="button"
        onClick={onSearchClick}
        style={{
          flex: 1, maxWidth: 380, height: 34,
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 12px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 9999,
          cursor: "text",
          backdropFilter: "blur(16px)",
        }}
        aria-label="Rechercher (⌘K)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="8" stroke="#52525B" strokeWidth="1.5" />
          <path d="m21 21-4.35-4.35" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ flex: 1, fontSize: 12, color: "#52525B", textAlign: "left", letterSpacing: "-0.01em" }}>
          Rechercher une tâche, un agent, un contact…
        </span>
        <kbd style={{
          fontSize: 11, color: "#52525B",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 5, padding: "1px 6px",
          fontFamily: "var(--font-geist-mono, monospace)",
        }}>⌘K</kbd>
      </button>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Bell */}
        <div style={{ position: "relative" }}>
          <GlassButton variant="ghost" size="sm" icon={Bell} iconSize={15} aria-label="Notifications" />
        </div>

        {/* User */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 6px", borderRadius: 9,
              background: "transparent", border: "none", cursor: "pointer",
            }}
            aria-expanded={userOpen}
            aria-label="Menu utilisateur"
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #F59E0B, #EC4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
              boxShadow: "0 0 12px rgba(236,72,153,0.4)",
            }}>Y</div>
            <ChevronDown size={13} color="#71717A" style={{ transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} aria-hidden />
          </button>

          {userOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              width: 180, borderRadius: 12,
              background: "rgba(18,18,24,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(32px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              padding: "4px",
              zIndex: 100,
            }}>
              <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Yoann</p>
                <p style={{ fontSize: 11, color: "#71717A", margin: "1px 0 0" }}>yoann@lynaris.ai</p>
              </div>
              {[
                { label: "Paramètres", href: "/dashboard/settings" },
                { label: "Facturation", href: "/dashboard/billing" },
              ].map((item) => (
                <a key={item.href} href={item.href} onClick={() => setUserOpen(false)} style={{
                  display: "block", padding: "7px 10px", fontSize: 13, color: "#A1A1AA",
                  textDecoration: "none", borderRadius: 8, transition: "background 100ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {item.label}
                </a>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 2, paddingTop: 2 }}>
                <button type="button" style={{
                  width: "100%", padding: "7px 10px", fontSize: 13, color: "#EF4444",
                  background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", borderRadius: 8,
                }}>
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
