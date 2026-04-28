"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const stats = [
  {
    value: "< 2s",
    label: "Appel décroché",
    highlight: true,
    description: "en moins de 2 secondes — chaque appel entrant",
  },
  {
    value: "48h",
    label: "Délai d'activation",
    highlight: false,
    description: "de la signature à l'opérationnel",
  },
  {
    value: "9",
    label: "Agents spécialisés",
    highlight: true,
    description: "1 en production, 8 en développement actif",
  },
  {
    value: "24/7",
    label: "Disponibilité",
    highlight: false,
    description: "vos agents travaillent sans pause ni congé",
  },
]

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".stat-card")
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-24 relative"
      aria-label="Chiffres clés Lynaris"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`stat-card group relative rounded-2xl border border-[--ly-border] p-6 lg:p-8 transition-all duration-500 overflow-hidden ${
                stat.highlight
                  ? "bg-[--ly-surface] hover:border-[--ly-primary]/30"
                  : "bg-transparent hover:bg-[--ly-surface]/50 hover:border-[--ly-border]"
              }`}
            >
              {/* Border glow on hover */}
              {stat.highlight && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: "inset 0 0 40px rgba(124,58,237,0.08), 0 0 30px rgba(124,58,237,0.06)",
                  }}
                  aria-hidden
                />
              )}

              <div className="relative z-10">
                <dt
                  className="font-bold text-[--ly-text] tracking-[-0.04em] leading-none"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
                >
                  {stat.value}
                </dt>
                <dd className="mt-3 text-sm font-semibold text-[--ly-text-muted] leading-snug">
                  {stat.label}
                </dd>
                <dd className="mt-1 text-[11px] text-[#52525B] leading-relaxed">
                  {stat.description}
                </dd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
