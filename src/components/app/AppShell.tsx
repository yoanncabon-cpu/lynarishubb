"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { SpotlightTopBar } from "@/components/app/SpotlightTopBar"
import { SpotlightSubNav } from "@/components/app/SpotlightSubNav"
import { SpotlightMobileDrawer } from "@/components/app/SpotlightMobileDrawer"
import { NotificationProvider } from "@/components/app/NotificationProvider"
import { VoiceLynaris } from "@/components/app/VoiceLynaris"
import { OnboardingLoader } from "@/components/onboarding/OnboardingLoader"
import { AuroraBackground } from "@/components/app/glass"

const CommandPalette = dynamic(
  () =>
    import("@/components/app/CommandPalette").then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false }
)

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    fetch("/api/admin/tickets?limit=1")
      .then((r) => setIsAdmin(r.ok))
      .catch(() => {})
  }, [])

  return (
    <NotificationProvider>
      <div
        className="lg-canvas"
        style={{
          position: "relative",
          minHeight: "100dvh",
          height: "100dvh",
          overflow: "hidden",
          fontFamily:
            "var(--font-jakarta, var(--font-geist-sans), -apple-system, sans-serif)",
        }}
      >
        {/* Aurora background — calque vivant */}
        <AuroraBackground />

        {/* Charpente flex column flottante — padding fluide selon viewport */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100dvh",
            padding: "clamp(8px, 1.5vw, 16px)",
            gap: "clamp(8px, 1vw, 12px)",
            boxSizing: "border-box",
          }}
        >
          <SpotlightTopBar
            onMenuClick={() => setMobileMenuOpen(true)}
            onSearchClick={() => setCmdOpen(true)}
            isAdmin={isAdmin}
          />

          <SpotlightSubNav isAdmin={isAdmin} />

          <main
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.12) transparent",
              borderRadius: 22,
            }}
          >
            {children}
          </main>
        </div>

        <SpotlightMobileDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          isAdmin={isAdmin}
        />

        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <VoiceLynaris />
        <OnboardingLoader />
      </div>
    </NotificationProvider>
  )
}
