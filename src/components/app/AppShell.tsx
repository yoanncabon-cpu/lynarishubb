"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { SpotlightTopBar } from "@/components/app/SpotlightTopBar"
import { SpotlightSubNav } from "@/components/app/SpotlightSubNav"
import { SpotlightMobileDrawer } from "@/components/app/SpotlightMobileDrawer"
import { NavigationProgress } from "@/components/app/NavigationProgress"
import { NotificationProvider } from "@/components/app/NotificationProvider"
const VoiceLynaris = dynamic(
  () =>
    import("@/components/app/VoiceLynaris").then((m) => ({
      default: m.VoiceLynaris,
    })),
  { ssr: false }
)
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
  const router = useRouter()

  // Prefetch routes fréquentes au montage (budget réseau libre avant interaction)
  useEffect(() => {
    const routes = [
      "/dashboard",
      "/dashboard/agents/marine",
      "/dashboard/agents/charles",
      "/dashboard/conversations",
      "/dashboard/calendrier",
      "/dashboard/taches",
    ]
    const id = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(() => routes.forEach(r => { try { router.prefetch(r) } catch {} }))
      : setTimeout(() => routes.forEach(r => { try { router.prefetch(r) } catch {} }), 2000)
    return () => {
      if (typeof cancelIdleCallback !== "undefined") {
        try { cancelIdleCallback(id as number) } catch {}
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Check admin — cache sessionStorage 5min pour éviter un fetch à chaque mount
  useEffect(() => {
    const KEY = "lynaris-is-admin"
    const TS_KEY = "lynaris-is-admin-ts"
    const TTL = 5 * 60 * 1000 // 5 minutes

    // iOS private mode bloque sessionStorage — on wrappe en try/catch
    let cached: string | null = null
    let cachedTs = 0
    try {
      cached = sessionStorage.getItem(KEY)
      cachedTs = parseInt(sessionStorage.getItem(TS_KEY) ?? "0", 10)
    } catch { /* ignore — private mode iOS */ }
    if (cached !== null && Date.now() - cachedTs < TTL) {
      setIsAdmin(cached === "1")
      return
    }

    fetch("/api/admin/tickets?limit=1")
      .then((r) => {
        const result = r.ok
        setIsAdmin(result)
        try {
          sessionStorage.setItem(KEY, result ? "1" : "0")
          sessionStorage.setItem(TS_KEY, String(Date.now()))
        } catch { /* ignore — private mode iOS */ }
      })
      .catch(() => {})
  }, [])

  return (
    <NotificationProvider>
      <NavigationProgress />
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
        {/* Aurora background — mount différé après FCP (idle callback) */}
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
            isolation: "isolate",
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
              contain: "layout paint",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
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
