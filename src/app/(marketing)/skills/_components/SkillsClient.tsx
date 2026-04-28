"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { gsap } from "@/lib/gsap"
import { AGENT_SKILLS, CATEGORIES } from "@/lib/agents/skills-data"
import type { AgentSkillEntry } from "@/lib/agents/skills-data"

const TOOLS_SHOWN = 4

// ─── Card ──────────────────────────────────────────────────────────────────────

function AgentSkillCard({ agent }: { agent: AgentSkillEntry }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current
      const glow = glowRef.current
      if (!card || !glow) return
      const r = card.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      glow.style.background = `radial-gradient(380px circle at ${x}% ${y}%, ${agent.color}1A, transparent 52%)`
      glow.style.opacity = "1"
    },
    [agent.color]
  )

  const onMouseEnter = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.borderColor = `${agent.color}35`
    card.style.transform = "translateY(-5px)"
    card.style.boxShadow = `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px ${agent.color}18`
  }, [agent.color])

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return
    card.style.borderColor = "rgba(255,255,255,0.07)"
    card.style.transform = "translateY(0)"
    card.style.boxShadow = "none"
    glow.style.opacity = "0"
  }, [])

  const preview = agent.tools.slice(0, TOOLS_SHOWN)
  const extra = agent.tools.length - TOOLS_SHOWN

  return (
    <article
      ref={cardRef}
      className="skill-card group relative flex flex-col overflow-hidden"
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(20,20,28,0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "border-color 0.25s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
      }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Mouse-follow radial glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
        aria-hidden
      />

      {/* Color accent strip */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${agent.color}CC, ${agent.color}25)`,
          flexShrink: 0,
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col flex-1 gap-4 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: `${agent.color}12`,
                border: `1.5px solid ${agent.color}2E`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: agent.color,
                fontWeight: 800,
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              {agent.name[0]}
            </div>
            <div>
              <p
                style={{
                  color: "#F5F5F7",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {agent.name}
              </p>
              <p style={{ color: "#52525B", fontSize: 11, marginTop: 2 }}>
                {agent.role}
              </p>
            </div>
          </div>

          {/* Model badge */}
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              flexShrink: 0,
              background:
                agent.modelTier === "opus"
                  ? "rgba(124,58,237,0.12)"
                  : "rgba(34,211,238,0.08)",
              color: agent.modelTier === "opus" ? "#A78BFA" : "#67E8F9",
              border: `1px solid ${
                agent.modelTier === "opus"
                  ? "rgba(167,139,250,0.2)"
                  : "rgba(34,211,238,0.15)"
              }`,
            }}
          >
            {agent.model}
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: agent.color,
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {agent.tagline}
        </p>

        {/* Integrations */}
        <div>
          <p
            style={{
              color: "#3F3F46",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 7,
            }}
          >
            Intégrations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {agent.integrations.map((name) => (
              <span
                key={name}
                style={{
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontSize: 11,
                  background: "rgba(255,255,255,0.04)",
                  color: "#71717A",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="flex-1">
          <p
            style={{
              color: "#3F3F46",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Outils ({agent.tools.length})
          </p>
          <ul className="space-y-1.5" role="list">
            {preview.map((tool) => (
              <li key={tool} className="flex items-start gap-2">
                <Check
                  size={11}
                  style={{ color: agent.color, flexShrink: 0, marginTop: 2 }}
                  aria-hidden
                />
                <span style={{ color: "#A1A1AA", fontSize: 12, lineHeight: 1.45 }}>
                  {tool}
                </span>
              </li>
            ))}
            {extra > 0 && (
              <li style={{ color: "#52525B", fontSize: 11, paddingLeft: 15 }}>
                +{extra} outil{extra > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={`/agents/${agent.slug}`}
          className="flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 group-hover:text-[#A1A1AA]"
          style={{ color: "#52525B", marginTop: "auto" }}
        >
          En savoir plus
          <ArrowRight
            size={11}
            className="transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SkillsClient() {
  const [activeCategory, setActiveCategory] = useState<string>("tous")
  const heroRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered =
    activeCategory === "tous"
      ? AGENT_SKILLS
      : AGENT_SKILLS.filter((a) => a.category === activeCategory)

  // Hero entrance
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-anim",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.11, ease: "power3.out" }
      )
    }, heroRef)
    return () => ctx.revert()
  }, [])

  // Cards entrance / re-animate on filter change
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".skill-card",
        { opacity: 0, y: 22, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.055,
          ease: "power3.out",
        }
      )
    }, gridRef)
    return () => ctx.revert()
  }, [activeCategory])

  return (
    <section className="relative py-20 lg:py-28" aria-label="Compétences des agents">
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 900,
          height: 480,
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[35%] right-[5%]"
        style={{
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Hero ────────────────────────────────────────────────── */}
        <div ref={heroRef} className="text-center mb-16 space-y-6">
          <span className="hero-anim opacity-0 inline-block ly-overline">
            Compétences
          </span>

          <h1
            className="hero-anim opacity-0"
            style={{
              fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.06,
              color: "#F5F5F7",
            }}
          >
            Les capacités de{" "}
            <span className="ly-gradient-text">chaque agent.</span>
          </h1>

          <p
            className="hero-anim opacity-0 mx-auto max-w-lg"
            style={{ color: "#A1A1AA", fontSize: 16, lineHeight: 1.7 }}
          >
            Outils natifs, intégrations et modèles IA — tout ce que chaque agent
            peut faire pour toi, en détail.
          </p>

          {/* Stats row */}
          <div className="hero-anim opacity-0 flex items-center justify-center gap-8 sm:gap-12 pt-1">
            {[
              { n: "9", label: "agents" },
              { n: "50+", label: "outils natifs" },
              { n: "20+", label: "intégrations" },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "#F5F5F7",
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Filter tabs ─────────────────────────────────────────── */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-10"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Filtrer par catégorie"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.value)}
                className="whitespace-nowrap transition-all duration-200"
                style={{
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  border: `1px solid ${active ? `${cat.color}40` : "rgba(255,255,255,0.08)"}`,
                  background: active ? `${cat.color}14` : "rgba(20,20,28,0.5)",
                  color: active ? cat.color : "#71717A",
                  cursor: "pointer",
                  flexShrink: 0,
                  outline: "none",
                  boxShadow: active ? `0 0 14px ${cat.color}18` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* ─── Grid ────────────────────────────────────────────────── */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
        >
          {filtered.map((agent) => (
            <AgentSkillCard key={agent.slug} agent={agent} />
          ))}
        </div>

        {/* ─── Bottom CTA ──────────────────────────────────────────── */}
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <p style={{ color: "#52525B", fontSize: 13 }}>
            Prêt à déployer ton équipe IA ?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tarifs"
              className="group inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-[#F5F5F7]"
              style={{ color: "#A78BFA", fontSize: 14 }}
            >
              Voir les tarifs
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
            <span style={{ color: "#27272A" }}>·</span>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-[#F5F5F7]"
              style={{ color: "#A78BFA", fontSize: 14 }}
            >
              Essai gratuit — 14 jours
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
