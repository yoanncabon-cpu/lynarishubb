"use client"

import { useRef, useEffect } from "react"
import { Plug, Cpu, BarChart3 } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: "01",
    title: "Connecte tes outils",
    description:
      "Tu relies Gmail, Google Calendar, WordPress... en quelques clics. Pas de code.",
    icon: Plug,
  },
  {
    number: "02",
    title: "Active tes agents",
    description:
      "Tu choisis les agents qui correspondent a ton activite. Un agent vocal pour les appels, Lou pour le contenu, Elio pour la prospection.",
    icon: Cpu,
  },
  {
    number: "03",
    title: "Ils travaillent, tu pilotes",
    description:
      "Tes agents s'executent en autonomie. Tu supervises depuis le dashboard ou par WhatsApp via Charles.",
    icon: BarChart3,
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

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20 space-y-4">
          <span className="inline-flex items-center rounded-full border border-[--ly-primary]/20 bg-[--ly-primary]/5 px-4 py-1 text-[13px] font-medium text-[--ly-primary-soft] tracking-wide uppercase">
            Comment ca marche
          </span>
          <h2
            id="how-it-works-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[--ly-text] tracking-[-0.04em]"
          >
            Operationnel en{" "}
            <span className="gradient-text" style={{ WebkitTextFillColor: "transparent" }}>
              3 etapes
            </span>
          </h2>
          <p className="text-lg text-[--ly-text-muted] max-w-2xl mx-auto leading-relaxed">
            Pas de formation. Pas d&apos;integration complexe. Tu connectes, tu actives, ca tourne.
          </p>
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
                    style={{ color: "rgba(124,58,237,0.05)" }}
                    aria-hidden
                  >
                    {step.number}
                  </span>

                  {/* Icon circle */}
                  <div className="relative z-10 shrink-0 h-[72px] w-[72px] lg:h-[120px] lg:w-[120px] rounded-2xl bg-[--ly-surface] border border-[--ly-border] flex items-center justify-center transition-all duration-500 hover:border-[--ly-primary]/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                    <Icon className="h-7 w-7 lg:h-10 lg:w-10 text-[--ly-primary-soft]" aria-hidden />
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
