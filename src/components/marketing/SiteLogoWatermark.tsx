"use client"

import { useEffect, useRef } from "react"

/**
 * Logo Lynaris en giant ghost watermark — position fixed derrière tout le site.
 * Juste la silhouette du L en trait/fill ultra-transparent.
 * Anime doucement en rotation et parallax sur le scroll.
 */
export function SiteLogoWatermark() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let scrollY = 0
    let time = 0
    let last = performance.now()

    if (prefersReducedMotion) return

    function tick(now: number) {
      const dt = (now - last) / 1000
      last = now
      time += dt
      scrollY = window.scrollY

      if (svgRef.current) {
        // Parallax lent sur le scroll — se déplace 15% moins vite que le scroll
        const parallax = scrollY * 0.06
        // Rotation micro très lente
        const rot = Math.sin(time * 0.04) * 1.5
        // Scale micro-pulsation
        const sc = 1 + Math.sin(time * 0.18) * 0.015

        svgRef.current.style.transform =
          `translateY(${-parallax}px) rotate(${rot}deg) scale(${sc})`
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        // Pas de background ici — juste le logo transparent
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          // Centré, taille ~90vh
          width: "90vh",
          height: "90vh",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Polygone principal — L shape Lynaris */}
        <polygon
          points="0,0 24,0 40,18 40,65 100,65 100,100 0,100"
          fill="rgba(245,146,47,0.028)"
          stroke="rgba(245,146,47,0.06)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        {/* Triangle coin haut-droit */}
        <polygon
          points="58,0 100,0 100,42"
          fill="rgba(245,146,47,0.025)"
          stroke="rgba(245,146,47,0.06)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
