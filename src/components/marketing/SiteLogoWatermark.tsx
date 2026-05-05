"use client"

import { useEffect, useRef } from "react"

/**
 * Logo Lynaris en giant ghost watermark — position fixed, plein écran.
 * Le L occupe tout le viewport avec un léger recadrage pour le voir entier.
 * Animation: flottement vertical lent + rotation micro.
 */
export function SiteLogoWatermark() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let raf = 0
    let time = 0
    let last = performance.now()

    function tick(now: number) {
      const dt = (now - last) / 1000
      last = now
      time += dt

      if (svgRef.current) {
        // Parallax scroll léger — 4% de la position scroll
        const parallax = window.scrollY * 0.04
        // Rotation micro très lente ±1.2°
        const rot = Math.sin(time * 0.035) * 1.2
        // Flottement vertical ±8px
        const floatY = Math.sin(time * 0.22) * 8

        svgRef.current.style.transform =
          `translate(-50%, calc(-50% + ${floatY - parallax}px)) rotate(${rot}deg)`
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    // Pas d'overflow:hidden — le SVG doit être visible en entier
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <svg
        ref={svgRef}
        viewBox="-8 -8 116 116"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          // Calcul pour que le carré s'adapte à l'écran entier quel que soit le ratio
          width: "min(95vh, 85vw)",
          height: "min(95vh, 85vw)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Polygone L — fill très subtil + stroke visible */}
        <polygon
          points="0,0 24,0 40,18 40,65 100,65 100,100 0,100"
          fill="rgba(245,146,47,0.035)"
          stroke="rgba(245,146,47,0.10)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Triangle coin haut-droit */}
        <polygon
          points="58,0 100,0 100,42"
          fill="rgba(245,146,47,0.030)"
          stroke="rgba(245,146,47,0.10)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
