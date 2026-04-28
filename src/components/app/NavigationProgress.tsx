"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Barre de progression top qui s'affiche pendant les transitions de page.
 * Style accent Lynaris + glow orange. Ne dépend d'aucune lib externe.
 *
 * Stratégie :
 *  - Intercepte les clics sur les <a> internes ET les pushState/replaceState (next/router)
 *  - Anime jusqu'à 90% pendant le chargement
 *  - Termine à 100% quand le pathname change
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // Termine la barre quand le pathname change (la page a fini de charger)
  useEffect(() => {
    if (!visible) return
    setProgress(100)
    const t = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Démarre la barre quand un <a> interne est cliqué (capture phase)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      if (!link) return
      const href = link.getAttribute("href")
      if (!href) return
      // Externe ou anchor ou télécharg. → ignore
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.getAttribute("target") === "_blank" ||
        link.hasAttribute("download")
      ) return
      // Modifier keys → ouvre dans nouvel onglet, on n'intercepte pas
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      // Même URL → no-op
      if (href === pathname) return

      setVisible(true)
      setProgress(20)
      // Pousse jusqu'à 90% progressivement
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            clearInterval(interval)
            return p
          }
          return p + Math.random() * 12
        })
      }, 220)
      // Sécurité : si jamais le pathname ne change pas (404, refresh stop), masque après 8s
      const failsafe = setTimeout(() => {
        clearInterval(interval)
        setVisible(false)
        setProgress(0)
      }, 8000)
      // Cleanup au prochain click
      ;(window as unknown as { __navProgressCleanup?: () => void }).__navProgressCleanup?.()
      ;(window as unknown as { __navProgressCleanup?: () => void }).__navProgressCleanup = () => {
        clearInterval(interval)
        clearTimeout(failsafe)
      }
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      ;(window as unknown as { __navProgressCleanup?: () => void }).__navProgressCleanup?.()
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, transparent 0%, var(--accent) 40%, #F4956E 100%)",
          boxShadow: "0 0 14px var(--accent), 0 0 6px var(--accent-glow)",
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          transition: "width 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      />
    </div>
  )
}
