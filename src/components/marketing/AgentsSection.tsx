"use client"

import Link from "next/link"
import { useRef, useEffect, useCallback } from "react"
import { ArrowRight } from "lucide-react"
import { agents, type AgentStatus } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === "live") {
    return <span style={{ color: "#10B981", fontSize: 11 }}>● En production</span>
  }
  if (status === "beta") {
    return <span style={{ color: "#F59E0B", fontSize: 11 }}>⊕ Bêta — accès inclus</span>
  }
  return <span style={{ color: "#71717A", fontSize: 11 }}>◌ Roadmap Q4 2026</span>
}

function AgentCard({
  agent,
}: {
  agent: (typeof agents)[number]
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const card = cardRef.current
      const glow = glowRef.current
      if (!card || !glow) return

      const rect = card.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / rect.width) * 100
      const my = ((e.clientY - rect.top) / rect.height) * 100

      glow.style.background = `radial-gradient(400px circle at ${mx}% ${my}%, ${agent.color}26, transparent 45%)`
      glow.style.opacity = "1"
    },
    [agent.color]
  )

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) {
      glowRef.current.style.opacity = "0"
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className="agent-card group relative flex flex-col overflow-hidden transition-all duration-500"
      style={{
        borderRadius: 20,
        padding: 24,
        background: "rgba(20,20,28,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        if (cardRef.current) {
          cardRef.current.style.border = `1px solid ${agent.color}4D`
          cardRef.current.style.transform = "translateY(-4px)"
        }
      }}
      onMouseLeave={() => {
        handleMouseLeave()
        if (cardRef.current) {
          cardRef.current.style.border = "1px solid rgba(255,255,255,0.08)"
          cardRef.current.style.transform = "translateY(0)"
        }
      }}
    >
      {/* Mouse-follow glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute z-0 opacity-0 transition-opacity duration-300"
        style={{ inset: -1 }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Avatar */}
        <div style={{ marginBottom: 16 }}>
          <AgentAvatar slug={agent.slug} size={52} glow />
        </div>

        {/* Name */}
        <h3
          className="font-bold tracking-[-0.02em]"
          style={{ color: "#F5F5F7", fontSize: 16, marginBottom: 4 }}
        >
          {agent.name}
        </h3>

        {/* Tagline */}
        <p
          style={{
            color: agent.color,
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {agent.tagline}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 16 }}>
          {agent.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 11,
                background: `${agent.color}14`,
                color: `${agent.color}CC`,
                border: `1px solid ${agent.color}33`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badge */}
        <div style={{ marginBottom: 12 }}>
          <StatusBadge status={agent.status} />
        </div>

        {/* CTA */}
        <Link
          href={`/agents/${agent.slug}`}
          className="group/link flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 12, color: "#A1A1AA" }}
        >
          Découvrir
          <ArrowRight
            className="h-3 w-3 transition-transform duration-200 group-hover/link:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  )
}

export function AgentsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

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
        }
      )

      const cards = gridRef.current?.querySelectorAll(".agent-card")
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
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
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative"
      aria-labelledby="agents-heading"
    >
      {/* Background ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20 space-y-3">
          <span className="ly-overline">L’équipe</span>
          <h2
            id="agents-heading"
            style={{
              fontSize: 56,
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
          {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#A1A1AA" }}>
            Une équipe IA spécialisée. Chaque agent expert de son domaine. Charles coordonne le tout.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {agents.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/agents"
            className="group inline-flex items-center gap-2 text-[#A78BFA] font-semibold hover:text-[#F5F5F7] transition-colors text-sm"
          >
            Voir tous les agents en détail
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
