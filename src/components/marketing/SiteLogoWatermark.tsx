"use client"

import { useEffect, useRef } from "react"

/**
 * Logo Lynaris ghost watermark — scroll-driven via GSAP ScrollTrigger.
 *
 * Phases scroll :
 * 0→40%   : logo apparaît + tourne +10° + grossit légèrement
 * 40→70%  : logo se déplace à droite + rotation inverse -8°
 * 70→100% : logo se recentre + shrink subtil + fond en bas
 *
 * Stroke draw : les contours du L se "dessinent" progressivement au scroll.
 * Flottement sinusoïdal additionnel via rAF pour l'aspect organique.
 */

// Longueur approximative du périmètre L-shape (calculée manuellement)
const L_PERIMETER = 400
const TRI_PERIMETER = 150

export function SiteLogoWatermark() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef  = useRef<SVGSVGElement>(null)
  const polyRef = useRef<SVGPolygonElement>(null)
  const triRef  = useRef<SVGPolygonElement>(null)

  // ── Flottement organique (rAF, indépendant du scroll) ────────────────────
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0, t = 0, last = performance.now()

    const tick = (now: number) => {
      t += (now - last) / 1000
      last = now
      if (svgRef.current) {
        const floatY = Math.sin(t * 0.22) * 10
        const floatX = Math.cos(t * 0.14) * 4
        // On applique le float comme data-attrs pour que GSAP puisse s'y ajouter
        svgRef.current.dataset.floatY = String(floatY)
        svgRef.current.dataset.floatX = String(floatX)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Scroll-driven GSAP ────────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!svgRef.current || !polyRef.current || !triRef.current) return

    let cleanup: (() => void) | null = null
    let cancelled = false

    // Initialiser les stroke-dasharray pour l'animation de dessin
    const p = polyRef.current
    const t = triRef.current
    p.style.strokeDasharray  = String(L_PERIMETER)
    p.style.strokeDashoffset = String(L_PERIMETER) // caché au départ
    t.style.strokeDasharray  = String(TRI_PERIMETER)
    t.style.strokeDashoffset = String(TRI_PERIMETER)

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapMod, stMod]) => {
        if (cancelled) return
        const gsap = gsapMod.default
        gsap.registerPlugin(stMod.ScrollTrigger)

        const svg = svgRef.current!
        const poly = polyRef.current!
        const tri  = triRef.current!

        // ── Timeline principale — scroll de la page entière ──────────────
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.8, // smooth scrubbing
          },
        })

        // Phase 1 (0→35%) : entrée, rotation +10°, scale 1→1.18
        tl.fromTo(svg,
          { rotation: 0, scale: 1, x: "0%", opacity: 0.85 },
          { rotation: 10, scale: 1.18, x: "2%", opacity: 1, ease: "none" },
          "0"
        )
        // Phase 2 (35→70%) : rotation inverse, dérive gauche
        tl.to(svg,
          { rotation: -7, scale: 1.05, x: "-3%", ease: "none" },
          "0.35"
        )
        // Phase 3 (70→100%) : recentrage + shrink
        tl.to(svg,
          { rotation: 2, scale: 0.90, x: "0%", opacity: 0.7, ease: "none" },
          "0.7"
        )

        // ── Stroke draw — suit le scroll de la première moitié ────────────
        const drawTL = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "50% top",
            scrub: 2,
          },
        })

        drawTL
          .to(poly, { strokeDashoffset: 0, ease: "none" }, 0)
          .to(tri,  { strokeDashoffset: 0, ease: "none", delay: 0.15 }, 0)

        cleanup = () => {
          stMod.ScrollTrigger.getAll().forEach(st => st.kill())
        }
      }
    )

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
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
          width: "min(95vh, 85vw)",
          height: "min(95vh, 85vw)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
      >
        {/* Fill très léger — toujours visible */}
        <polygon
          points="0,0 24,0 40,18 40,65 100,65 100,100 0,100"
          fill="rgba(245,146,47,0.035)"
          stroke="none"
        />
        <polygon
          points="58,0 100,0 100,42"
          fill="rgba(245,146,47,0.030)"
          stroke="none"
        />

        {/* Stroke animé — se dessine au scroll */}
        <polygon
          ref={polyRef}
          points="0,0 24,0 40,18 40,65 100,65 100,100 0,100"
          fill="none"
          stroke="rgba(245,146,47,0.14)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <polygon
          ref={triRef}
          points="58,0 100,0 100,42"
          fill="none"
          stroke="rgba(245,146,47,0.12)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
