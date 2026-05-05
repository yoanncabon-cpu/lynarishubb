"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useEffect, useCallback } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { agents, type AgentStatus } from "@/lib/agents/data"

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === "live") {
    return <span style={{ color: "#10B981", fontSize: 11, fontWeight: 600 }}>● En production</span>
  }
  if (status === "beta") {
    return <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 600 }}>⊕ Bêta</span>
  }
  return <span style={{ color: "#71717A", fontSize: 11, fontWeight: 600 }}>◌ Roadmap</span>
}

function AgentCard({
  agent,
  floatDelay,
}: {
  agent: (typeof agents)[number]
  floatDelay: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const card = cardRef.current
      const glow = glowRef.current
      if (!card || !glow) return
      const rect = card.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / rect.width) * 100
      const my = ((e.clientY - rect.top) / rect.height) * 100
      glow.style.background = `radial-gradient(500px circle at ${mx}% ${my}%, ${agent.color}33, transparent 50%)`
      glow.style.opacity = "1"
    },
    [agent.color],
  )

  return (
    <motion.div
      ref={cardRef}
      className="agent-card group relative flex flex-col snap-start"
      style={{
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(28,28,38,0.7) 0%, rgba(15,15,22,0.85) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        transition: "transform 500ms cubic-bezier(0.22,1,0.36,1), border-color 300ms",
        minHeight: 460,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        const card = cardRef.current
        if (!card) return
        card.style.borderColor = `${agent.color}66`
        card.style.transform = "translateY(-6px)"
        const scene = card.querySelector<HTMLElement>(".agent-card-scene")
        if (scene) scene.style.opacity = "1"
        const avatar = card.querySelector<HTMLElement>(".agent-card-avatar")
        if (avatar) avatar.style.transform = "scale(1.08) translateY(-4px)"
      }}
      onMouseLeave={() => {
        const card = cardRef.current
        if (!card) return
        card.style.borderColor = "rgba(255,255,255,0.08)"
        card.style.transform = "translateY(0)"
        if (glowRef.current) glowRef.current.style.opacity = "0"
        const scene = card.querySelector<HTMLElement>(".agent-card-scene")
        if (scene) scene.style.opacity = "0"
        const avatar = card.querySelector<HTMLElement>(".agent-card-avatar")
        if (avatar) avatar.style.transform = "scale(1) translateY(0)"
      }}
    >
      {/* Scène contextuelle révélée au hover */}
      {agent.scene && (
        <div
          aria-hidden
          className="agent-card-scene pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: 0 }}
        >
          <Image
            src={agent.scene}
            alt=""
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(15,15,22,0.55) 0%, rgba(15,15,22,0.85) 65%, rgba(15,15,22,0.96) 100%)`,
            }}
          />
        </div>
      )}

      {/* Halo couleur agent fixe */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-30%",
          right: "-30%",
          width: "140%",
          height: "140%",
          background: `radial-gradient(circle at center, ${agent.color}22 0%, transparent 60%)`,
          filter: "blur(20px)",
          opacity: 0.7,
        }}
      />

      {/* Mouse-follow glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute z-0 transition-opacity duration-300"
        style={{ inset: -1, opacity: 0 }}
        aria-hidden
      />

      {/* Avatar grand format avec float perpétuel */}
      <div
        className="relative z-10 flex justify-center pt-6 pb-2"
        style={{ height: 220 }}
      >
        <motion.div
          className="agent-card-avatar relative"
          style={{
            width: 200,
            height: 200,
            transition: "transform 500ms cubic-bezier(0.22,1,0.36,1)",
            transformOrigin: "center bottom",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -6, 0],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatDelay,
          }}
        >
          {/* Glow sous l'avatar (ombre lumineuse) */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              bottom: "-10%",
              left: "10%",
              right: "10%",
              height: "30%",
              background: `radial-gradient(ellipse at center, ${agent.color}55 0%, transparent 70%)`,
              filter: "blur(15px)",
            }}
          />
          {agent.avatar ? (
            <Image
              src={agent.avatar.replace(".webp", ".png")}
              alt={`Avatar ${agent.name}`}
              width={400}
              height={400}
              sizes="200px"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.45))",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${agent.color}66, ${agent.color}11)`,
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pb-6 pt-2">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h3
            className="font-bold tracking-[-0.02em]"
            style={{ color: "#F5F5F7", fontSize: 22 }}
          >
            {agent.name}
          </h3>
          <span style={{ color: "#71717A", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
            {agent.role}
          </span>
        </div>

        <p
          style={{
            color: agent.color,
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {agent.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 11,
                background: `${agent.color}14`,
                color: `${agent.color}DD`,
                border: `1px solid ${agent.color}33`,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <StatusBadge status={agent.status} />
          <Link
            href={`/agents/${agent.slug}`}
            className="group/link inline-flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 500 }}
          >
            Découvrir
            <ArrowRight
              className="h-3 w-3 transition-transform duration-200 group-hover/link:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function AgentsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
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
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          },
        )

        const cards = gridRef.current?.querySelectorAll(".agent-card")
        if (cards && cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 60, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: gridRef.current,
                start: "top 85%",
                once: true,
              },
            },
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
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative overflow-hidden"
      aria-labelledby="agents-heading"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, rgba(34,211,238,0.05) 40%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-16 space-y-3">
          <span className="ly-overline">L’équipe</span>
          <h2
            id="agents-heading"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              margin: "12px 0 16px",
            }}
          >
            <span style={{ color: "#F5F5F7" }}>Rencontre </span>
            <span className="ly-gradient-text">ton équipe IA</span>
            <span style={{ color: "#F5F5F7" }}>.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#A1A1AA" }}>
            Une équipe IA spécialisée. Chaque agent expert de son domaine. Charles coordonne le tout.
          </p>
        </div>

        {/* Mobile : carousel scroll-snap horizontal — Desktop : grid 3 colonnes */}
        <div
          ref={gridRef}
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-px-4 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:m-0 sm:p-0 sm:snap-none lg:grid-cols-3 lg:gap-6 no-scrollbar"
          style={{ scrollPaddingLeft: 16 }}
        >
          {agents.map((agent, idx) => (
            <div
              key={agent.slug}
              className="flex-shrink-0 w-[78%] sm:w-auto"
              style={{ scrollSnapAlign: "start" }}
            >
              <AgentCard agent={agent} floatDelay={(idx * 0.4) % 2} />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/agents"
            className="group inline-flex items-center gap-2 font-semibold transition-colors text-sm"
            style={{ color: "#A78BFA" }}
          >
            Voir tous les agents en détail
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
