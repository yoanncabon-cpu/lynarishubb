"use client"

import { useEffect } from "react"

// Précharge GSAP + ScrollTrigger pendant l'idle du navigateur.
// Évite le waterfall réseau quand plusieurs sections triggent leur import simultanément au scroll.
export function GsapPreloader() {
  useEffect(() => {
    const load = () => { void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]) }

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(load, { timeout: 2000 })
      return () => cancelIdleCallback(id)
    }

    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [])

  return null
}
