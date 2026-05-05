"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * SmoothScrollProvider — active Lenis pour un scroll fluide premium sur la landing.
 *
 * Désactivé automatiquement si :
 * - prefers-reduced-motion: reduce
 * - viewport tactile mobile (Lenis perturbe le pull-to-refresh natif)
 *
 * Synchronise Lenis avec ScrollTrigger de gsap si présent, pour que les
 * animations scroll-pinnées restent en phase avec le smooth-scroll.
 */
export function SmoothScrollProvider() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches
    if (reduceMotion || isCoarsePointer) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Synchronise avec gsap ScrollTrigger si chargé
    void (async () => {
      try {
        const gsapMod = await import("gsap")
        const { ScrollTrigger } = await import("gsap/ScrollTrigger")
        gsapMod.gsap.registerPlugin(ScrollTrigger)
        lenis.on("scroll", ScrollTrigger.update)
        gsapMod.gsap.ticker.add((time) => lenis.raf(time * 1000))
        gsapMod.gsap.ticker.lagSmoothing(0)
      } catch {
        // gsap absent : Lenis fonctionne seul
      }
    })()

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return null
}
