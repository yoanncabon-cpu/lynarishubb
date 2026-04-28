"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Phone, Brain, PenTool, TrendingUp, BarChart3, type LucideIcon } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

interface BentoCard {
  title: string
  description: string
  agent: string
  color: string
  icon: LucideIcon
  className: string
}

const cards: BentoCard[] = [
  {
    title: "Décroche en 2 secondes",
    description: "Ton agent vocal répond à chaque appel, qualifie le besoin et prend rendez-vous. 24/7, sans attente.",
    agent: "Agent vocal",
    color: "#22D3EE",
    icon: Phone,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Orchestre tout",
    description: "Charles comprend, délègue, et te tient informé via WhatsApp.",
    agent: "Charles",
    color: "#7C3AED",
    icon: Brain,
    className: "md:col-span-1",
  },
  {
    title: "Contenu autopilot",
    description: "Lou écrit, optimise SEO, et publie sur WordPress + LinkedIn.",
    agent: "Lou",
    color: "#F472B6",
    icon: PenTool,
    className: "md:col-span-1",
  },
  {
    title: "Programme bêta ouvert",
    description: "1 client pilote actif. Rejoins les prochains pilotes pour façonner le produit avec nous.",
    agent: "Bêta",
    color: "#A78BFA",
    icon: TrendingUp,
    className: "md:col-span-1",
  },
  {
    title: "Pipeline commercial",
    description: "Elio prospecte, qualifie et relance, pour que ton agenda commercial se remplisse tout seul.",
    agent: "Elio",
    color: "#10B981",
    icon: BarChart3,
    className: "md:col-span-1",
  },
]

export function BentoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const items = gridRef.current?.querySelectorAll(".bento-card")
      if (items) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
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
    <section ref={sectionRef} className="py-24 lg:py-32 relative" aria-label="Fonctionnalités clés">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`bento-card group relative rounded-2xl border border-[--ly-border] bg-[--ly-surface] p-6 lg:p-8 overflow-hidden transition-all duration-500 hover:border-transparent ${card.className}`}
              >
                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}30, transparent 50%)`,
                    padding: "1px",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                  }}
                  aria-hidden
                />

                {/* Background glow */}
                <div
                  className="absolute -bottom-20 -right-20 w-[200px] h-[200px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-[80px]"
                  style={{ backgroundColor: `${card.color}15` }}
                  aria-hidden
                />

                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-shadow duration-500"
                    style={{
                      backgroundColor: `${card.color}15`,
                      border: `1px solid ${card.color}20`,
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: card.color }}
                      aria-hidden
                    />
                  </div>

                  {/* Agent pill */}
                  <span
                    className="inline-flex self-start px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide mb-3"
                    style={{
                      backgroundColor: `${card.color}10`,
                      color: card.color,
                      border: `1px solid ${card.color}20`,
                    }}
                  >
                    {card.agent}
                  </span>

                  <h3 className="text-xl font-bold text-[--ly-text] tracking-[-0.02em] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[--ly-text-muted] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
