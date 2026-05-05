"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { Phone, Brain, PenTool, TrendingUp, BarChart3, type LucideIcon } from "lucide-react"
// gsap (~250kb) + ScrollTrigger chargés en async dans useEffect → exclus du bundle initial

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

    let cleanup: (() => void) | null = null
    let cancelled = false

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapMod, stMod]) => {
      if (cancelled) return
      const gsap = gsapMod.default
      gsap.registerPlugin(stMod.ScrollTrigger)
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
      cleanup = () => ctx.revert()
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
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
          {cards.map((card, idx) => {
            const Icon = card.icon
            const isFeatured = idx === 0
            return (
              <div
                key={card.title}
                className={`bento-card group relative rounded-2xl overflow-hidden transition-all duration-500 ${card.className} ${
                  isFeatured
                    ? "border border-white/10"
                    : "border border-[--ly-border] bg-[--ly-surface] p-6 lg:p-8 hover:border-transparent"
                }`}
              >
                {/* Grande carte — image dashboard Higgsfield en background */}
                {isFeatured && (
                  <>
                    <Image
                      src="/marketing/bento-dashboard.webp"
                      alt="Dashboard IA Lynaris — suivi des appels et performances en temps réel"
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      style={{ objectFit: "cover", objectPosition: "center" }}
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay gradient pour lisibilité du texte */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      aria-hidden
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(8,8,16,0.92) 0%, rgba(8,8,16,0.75) 45%, rgba(8,8,16,0.55) 100%)",
                      }}
                    />
                    {/* Glow cyan en bas à droite */}
                    <div
                      className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none"
                      aria-hidden
                      style={{
                        background: "radial-gradient(circle at center, rgba(34,211,238,0.18) 0%, transparent 70%)",
                        filter: "blur(30px)",
                      }}
                    />
                  </>
                )}

                {/* Hover border glow (petites cartes) */}
                {!isFeatured && (
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
                )}

                {/* Background glow (petites cartes) */}
                {!isFeatured && (
                  <div
                    className="absolute -bottom-20 -right-20 w-[200px] h-[200px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-[80px]"
                    style={{ backgroundColor: `${card.color}15` }}
                    aria-hidden
                  />
                )}

                <div className={`relative z-10 h-full flex flex-col ${isFeatured ? "p-8 lg:p-10 justify-end min-h-[340px]" : ""}`}>
                  {/* Icon */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-shadow duration-500"
                    style={{
                      backgroundColor: `${card.color}15`,
                      border: `1px solid ${card.color}30`,
                      backdropFilter: isFeatured ? "blur(8px)" : undefined,
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
                      backgroundColor: `${card.color}18`,
                      color: card.color,
                      border: `1px solid ${card.color}35`,
                      backdropFilter: isFeatured ? "blur(8px)" : undefined,
                    }}
                  >
                    {card.agent}
                  </span>

                  <h3
                    className="font-bold tracking-[-0.02em] mb-2"
                    style={{
                      fontSize: isFeatured ? "clamp(22px, 2.5vw, 32px)" : undefined,
                      color: "#F5F5F7",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{
                      fontSize: isFeatured ? 16 : 14,
                      color: isFeatured ? "rgba(245,245,247,0.8)" : "var(--ly-text-muted)",
                      maxWidth: isFeatured ? 380 : undefined,
                    }}
                  >
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
