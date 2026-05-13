"use client"

import { useRef, useEffect } from "react"
import { Plug, Cpu, BarChart3 } from "lucide-react"
// gsap (~250kb) + ScrollTrigger chargés en async dans useEffect → exclus du bundle initial

const steps = [
  {
    number: "01",
    title: "Connecte tes outils",
    description: "Tu relies Gmail, Google Calendar, WordPress, Twilio… en quelques clics. Pas de code, pas d'intégration complexe.",
    icon: Plug,
    color: "#22D3EE",
  },
  {
    number: "02",
    title: "Active tes agents",
    description: "Tu choisis les agents qui correspondent à ton activité. Un agent vocal pour les appels, Lou pour le contenu, Elio pour la prospection.",
    icon: Cpu,
    color: "#7C3AED",
  },
  {
    number: "03",
    title: "Ils travaillent, tu pilotes",
    description: "Tes agents s'exécutent en autonomie. Tu supervises depuis le dashboard ou par WhatsApp via Charles.",
    icon: BarChart3,
    color: "#10B981",
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGLineElement>(null)

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
        // Header
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

        // Line draw animation (SVG)
        if (lineRef.current) {
          const lineLength = lineRef.current.getTotalLength()
          gsap.set(lineRef.current, {
            strokeDasharray: lineLength,
            strokeDashoffset: lineLength,
          })

          gsap.to(lineRef.current, {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: timelineRef.current,
              start: "top 75%",
              once: true,
            },
          })
        }

        // Steps stagger
        const stepEls = timelineRef.current?.querySelectorAll(".step-item")
        if (stepEls) {
          gsap.fromTo(
            stepEls,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.2,
              ease: "power3.out",
              scrollTrigger: {
                trigger: timelineRef.current,
                start: "top 75%",
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
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 space-y-4">
          <span className="inline-flex items-center rounded-full border border-[--ly-primary]/20 bg-[--ly-primary]/5 px-4 py-1 text-[13px] font-medium text-[--ly-primary-soft] tracking-wide uppercase">
            Comment ça marche
          </span>
          <h2
            id="how-it-works-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[--ly-text] tracking-[-0.04em]"
          >
            Opérationnel en{" "}
            <span className="ly-gradient-text">
              3 étapes
            </span>
          </h2>
          <p className="text-lg text-[--ly-text-muted] max-w-2xl mx-auto leading-relaxed">
            Pas de formation. Pas d&apos;intégration complexe. Tu connectes, tu actives, ça tourne.
          </p>
        </div>

        {/* Mockup device cinématique — vrai dashboard Lynaris */}
        <div
          className="relative mx-auto mb-20 rounded-3xl overflow-hidden px-6 pt-10 pb-0"
          style={{
            maxWidth: 960,
            background: "radial-gradient(ellipse at 30% 0%, rgba(232,111,77,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(124,58,237,0.1) 0%, transparent 60%), #07070e",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Lumières ambiantes */}
          <div className="absolute top-0 left-1/4 w-80 h-40 pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute top-0 right-1/4 w-60 h-32 pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(ellipse, rgba(232,111,77,0.12) 0%, transparent 70%)", filter: "blur(30px)" }} />

          <div className="flex items-end justify-center gap-5 sm:gap-8 relative z-10">

            {/* MacBook */}
            <div
              className="relative flex-1"
              style={{
                maxWidth: 700,
                filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(124,58,237,0.15))",
              }}
            >
              {/* Corps écran */}
              <div
                className="rounded-t-2xl overflow-hidden"
                style={{
                  background: "#111118",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  borderBottom: "none",
                }}
              >
                {/* Barre macOS */}
                <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
                </div>
                {/* Dashboard avec overlay perso */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/marketing/dashboard-screenshot.png" alt="Dashboard Lynaris" className="w-full h-auto block" loading="eager" />
                  {/* Masque données perso */}
                  <div className="absolute left-0 right-0" style={{ top: "3.2%", padding: "0 1% 0 8.5%" }}>
                    <div className="rounded-xl px-4 py-2.5" style={{ background: "rgba(8,8,14,0.98)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #E86F4D, #7C3AED)" }}>S</div>
                        <div>
                          <div style={{ fontSize: "clamp(12px, 1.8vw, 20px)", fontWeight: 700, color: "#F5F5F7", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                            Bonjour, <span style={{ color: "#E86F4D" }}>Sophie</span>{" "}
                            <em style={{ fontFamily: "var(--font-fraunces-var)", color: "#71717A", fontWeight: 400 }}>· bonne journée</em>
                          </div>
                          <div style={{ fontSize: "clamp(9px, 1vw, 12px)", color: "#3F3F46", marginTop: 2 }}>
                            Lundi 5 mai · 09:15 &nbsp;·&nbsp; <span style={{ color: "#10B981" }}>●</span>&nbsp;9 agents en ligne
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Reflet écran */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)" }} />
                </div>
              </div>
              {/* Charnière + socle MacBook */}
              <div style={{ height: 12, background: "linear-gradient(to bottom, #1c1c28, #141420)", border: "1.5px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 3px 3px" }} />
              <div style={{ height: 5, background: "#0d0d14", borderRadius: "0 0 12px 12px", margin: "0 6%", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }} />
              {/* Reflet sol */}
              <div className="mx-auto mt-1 opacity-20" style={{ height: 20, width: "80%", background: "linear-gradient(to bottom, rgba(124,58,237,0.3), transparent)", filter: "blur(8px)" }} aria-hidden />
            </div>

            {/* iPhone */}
            <div
              className="hidden sm:block shrink-0 relative"
              style={{
                width: 148,
                marginBottom: 28,
                filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(232,111,77,0.1))",
              }}
            >
              <div className="rounded-[2.5rem] overflow-hidden" style={{ border: "1.5px solid rgba(255,255,255,0.12)", background: "#0a0a0f" }}>
                {/* Dynamic Island */}
                <div className="flex justify-center pt-3 pb-1" style={{ background: "#0a0a0f" }}>
                  <div className="h-2.5 w-14 rounded-full" style={{ background: "#000" }} />
                </div>
                {/* Dashboard — zoom sur contenu central */}
                <div style={{ overflow: "hidden", height: 285, position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/marketing/dashboard-screenshot.png"
                    alt="Lynaris app"
                    style={{ position: "absolute", width: "290%", maxWidth: "none", left: "-88%", top: "-5%" }}
                    loading="eager"
                  />
                  {/* Reflet */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 35%)" }} />
                </div>
                {/* Home bar */}
                <div className="flex justify-center py-2.5" style={{ background: "#0a0a0f" }}>
                  <div className="h-1 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
                </div>
              </div>
              {/* Reflet sol iPhone */}
              <div className="mx-auto mt-1 opacity-15" style={{ height: 16, width: "70%", background: "linear-gradient(to bottom, rgba(232,111,77,0.3), transparent)", filter: "blur(6px)" }} aria-hidden />
            </div>

          </div>

          {/* Sol réfléchissant */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" aria-hidden
            style={{ background: "linear-gradient(to bottom, transparent, rgba(4,4,10,0.9))" }} />
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative max-w-4xl mx-auto">
          {/* Vertical line SVG — desktop */}
          <svg
            className="hidden lg:block absolute left-[60px] top-0 bottom-0 h-full w-[2px]"
            aria-hidden
          >
            <line
              ref={lineRef}
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ly-primary)" />
                <stop offset="100%" stopColor="var(--ly-accent)" />
              </linearGradient>
            </defs>
          </svg>

          <div className="space-y-16 lg:space-y-20">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="step-item relative flex flex-col lg:flex-row items-start gap-6 lg:gap-12"
                >
                  {/* Large translucent number */}
                  <span
                    className="absolute -top-4 lg:-top-8 right-0 lg:right-auto lg:left-[100px] text-[6rem] lg:text-[8rem] font-black leading-none select-none pointer-events-none"
                    style={{ color: `${step.color}08` }}
                    aria-hidden
                  >
                    {step.number}
                  </span>

                  {/* Icon circle avec couleur d'étape */}
                  <div
                    className="relative z-10 shrink-0 h-[72px] w-[72px] lg:h-[120px] lg:w-[120px] rounded-2xl flex items-center justify-center transition-all duration-500"
                    style={{
                      background: `${step.color}10`,
                      border: `1px solid ${step.color}25`,
                    }}
                  >
                    <Icon
                      className="h-7 w-7 lg:h-10 lg:w-10"
                      style={{ color: step.color }}
                      aria-hidden
                    />
                  </div>

                  {/* Text */}
                  <div className="lg:pt-4 max-w-lg">
                    <h3 className="text-2xl lg:text-3xl font-bold text-[--ly-text] tracking-[-0.03em] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[--ly-text-muted] leading-relaxed text-base lg:text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
