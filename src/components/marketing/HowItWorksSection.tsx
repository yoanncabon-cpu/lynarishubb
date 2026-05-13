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

        {/* Mockup dashboard — fallback CSS en attendant l'image Higgsfield */}
        <div
          className="relative mx-auto mb-20 rounded-2xl overflow-hidden"
          style={{
            maxWidth: 960,
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)",
            background: "rgba(12,12,20,1)",
          }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(18,18,28,1)" }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
            <span
              className="ml-4 flex-1 rounded-md px-3 py-1 text-[11px] text-center"
              style={{ background: "rgba(255,255,255,0.04)", color: "#52525B", maxWidth: 220, margin: "0 auto" }}
            >
              app.lynaris.ai/dashboard
            </span>
          </div>

          {/* Dashboard body */}
          <div className="flex" style={{ minHeight: 420 }}>
            {/* Sidebar */}
            <div className="hidden sm:flex flex-col gap-1 p-3 border-r shrink-0" style={{ width: 52, borderColor: "rgba(255,255,255,0.05)" }}>
              {[
                { color: "#7C3AED", active: true },
                { color: "#22D3EE", active: false },
                { color: "#10B981", active: false },
                { color: "#F59E0B", active: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: item.active ? `${item.color}20` : "rgba(255,255,255,0.03)",
                    border: item.active ? `1px solid ${item.color}30` : "1px solid transparent",
                  }}
                >
                  <div className="h-2 w-2 rounded-sm" style={{ background: item.active ? item.color : "#3F3F46" }} />
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="flex-1 p-4 sm:p-6 space-y-4">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 rounded-md" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="flex gap-2">
                  <div className="h-7 w-20 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }} />
                  <div className="h-7 w-7 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>

              {/* 3 agent cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: "Marine", role: "Téléphonique", color: "#22D3EE", stat: "24 appels", badge: "Actif" },
                  { name: "Lou", role: "Contenu & SEO", color: "#7C3AED", stat: "8 articles", badge: "En cours" },
                  { name: "Elio", role: "Commercial", color: "#10B981", stat: "12 leads", badge: "Actif" },
                ].map((agent) => (
                  <div
                    key={agent.name}
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full" style={{ background: `${agent.color}25`, border: `1px solid ${agent.color}40` }}>
                          <div className="h-full w-full rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full" style={{ background: agent.color }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: "#F5F5F7" }}>{agent.name}</div>
                          <div className="text-[10px]" style={{ color: "#52525B" }}>{agent.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${agent.color}15`, color: agent.color }}>
                        {agent.badge}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: "72%", background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})` }} />
                    </div>
                    <div className="text-[12px] font-medium" style={{ color: "#A1A1AA" }}>{agent.stat} aujourd&apos;hui</div>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Appels traités", value: "847", color: "#22D3EE" },
                  { label: "Tâches auto", value: "2.4k", color: "#7C3AED" },
                  { label: "Temps gagné", value: "38h", color: "#10B981" },
                  { label: "Disponibilité", value: "99.9%", color: "#F59E0B" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="text-[11px] mb-1" style={{ color: "#52525B" }}>{stat.label}</div>
                    <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glows */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)", filter: "blur(30px)" }} />

          {/* Fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" aria-hidden
            style={{ background: "linear-gradient(to bottom, transparent, rgba(8,8,16,0.95))" }} />
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
