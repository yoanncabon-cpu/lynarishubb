"use client"

import { useRef, useEffect } from "react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
// gsap (~250kb) + ScrollTrigger chargés en async dans useEffect → exclus du bundle initial

// ─── Metrics data ─────────────────────────────────────────────────────────────
// Promesses qualitatives — aucun chiffre tant qu'il n'est pas mesuré et signé client.

const metrics = [
  {
    value: "0",
    label: "Appel manqué",
    explanation: "Ton agent vocal décroche chaque appel entrant, même quand tu es en réunion.",
    agentSlug: "marine",
    agentName: "Agent vocal",
    color: "#7C3AED",
  },
  {
    value: "48h",
    label: "De la signature à l'opérationnel",
    explanation: "Onboarding guidé, sans compétence technique requise.",
    agentSlug: "charles",
    agentName: "Charles",
    color: "#22D3EE",
  },
  {
    value: "1",
    label: "Tableau de bord unique",
    explanation: "Tous tes agents pilotés depuis la même interface, branchée à tes outils.",
    agentSlug: "mae",
    agentName: "Mae",
    color: "#10B981",
  },
  {
    value: "24/7",
    label: "Disponibilité sans interruption",
    explanation: "Tes agents travaillent en continu, sans pause ni congé.",
    agentSlug: "lou",
    agentName: "Lou",
    color: "#F472B6",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let cleanup: (() => void) | null = null
    let cancelled = false

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapMod, stMod]) => {
      if (cancelled) return
      const gsap = gsapMod.default
      gsap.registerPlugin(stMod.ScrollTrigger)
      const ctx = gsap.context(() => {
        // Overline + heading
        gsap.fromTo(
          ".results-heading",
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        )

        // Metric cards staggered
        gsap.fromTo(
          ".results-metric",
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".results-grid",
              start: "top 85%",
              once: true,
            },
          }
        )

      }, sectionRef)
      cleanup = () => ctx.revert()
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative"
      aria-label="Résultats mesurés"
    >
      {/* Subtle background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 640,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Heading */}
        <div className="results-heading text-center mb-16">
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#7C3AED",
              marginBottom: 12,
            }}
          >
            Résultats mesurés
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              color: "#F5F5F7",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Ce que font vos agents pendant que vous dormez
          </h2>
        </div>

        {/* Metrics grid 2x2 */}
        <div
          className="results-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.value}
              className="results-metric"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "28px 24px",
                transition: "border-color 0.25s, background 0.25s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = `${m.color}40`
                ;(e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"
                ;(e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"
              }}
            >
              {/* Big metric value */}
              <p
                style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: m.color,
                  margin: "0 0 6px",
                  lineHeight: 1,
                }}
              >
                {m.value}
              </p>

              {/* Label */}
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#F5F5F7",
                  margin: "0 0 8px",
                  lineHeight: 1.3,
                }}
              >
                {m.label}
              </p>

              {/* Explanation */}
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,245,247,0.45)",
                  margin: "0 0 16px",
                  lineHeight: 1.55,
                }}
              >
                {m.explanation}
              </p>

              {/* Agent badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 10px 5px 6px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <AgentAvatar slug={m.agentSlug} size={20} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(245,245,247,0.65)",
                  }}
                >
                  {m.agentName}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
