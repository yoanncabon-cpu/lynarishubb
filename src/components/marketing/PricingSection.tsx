"use client"

import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { PLAN_LIST, getFeatureList, getPlanBadge } from "@/lib/pricing/plans"

gsap.registerPlugin(ScrollTrigger)

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#10B981] mt-0.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" className="check-path" />
    </svg>
  )
}

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [annual, setAnnual] = useState(false)

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

      const cards = sectionRef.current?.querySelectorAll(".pricing-card")
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
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
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 space-y-4">
          <span className="ly-overline">Tarifs</span>
          <h2
            id="pricing-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em]"
            style={{ color: "#F5F5F7" }}
          >
            Un plan pour chaque étape
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#A1A1AA" }}>
            Essai 14 jours gratuit. Sans carte bancaire. Annulation en 1 clic.
          </p>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "#71717A" }}>
            Les agents en bêta et roadmap sont accessibles gratuitement pendant leur phase de développement.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span
            className="text-sm font-medium transition-colors"
            style={{ color: !annual ? "#F5F5F7" : "#71717A" }}
          >
            Mensuel
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Basculer vers la facturation annuelle"
            onClick={() => setAnnual(!annual)}
            className="relative transition-all duration-300"
            style={{
              width: 56,
              height: 32,
              borderRadius: 9999,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#14141C",
            }}
          >
            <span
              className="absolute rounded-full transition-all duration-300"
              style={{
                top: 3,
                left: 3,
                width: 24,
                height: 24,
                transform: annual ? "translateX(24px)" : "translateX(0)",
                background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
                boxShadow: "0 0 12px rgba(124,58,237,0.4)",
              }}
            />
          </button>
          <span
            className="text-sm font-medium transition-colors"
            style={{ color: annual ? "#F5F5F7" : "#71717A" }}
          >
            Annuel
            <span className="ml-2 inline-flex items-center rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10B981]">
              -15%
            </span>
          </span>
        </div>

        {/* Plans — 2+3 responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {PLAN_LIST.map((plan) => {
            const price = annual ? plan.priceAnnualMonthly : plan.priceMonthly
            const badge = getPlanBadge(plan)
            const features = getFeatureList(plan)

            return (
              <div
                key={plan.id}
                className={`pricing-card group relative rounded-2xl p-6 lg:p-8 flex flex-col transition-all duration-500 overflow-hidden ${
                  plan.featured
                    ? "bg-[#14141C]"
                    : "bg-[#14141C]/50 hover:bg-[#14141C]"
                }`}
                style={{
                  border: plan.featured
                    ? "1px solid rgba(124,58,237,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  ...(plan.featured
                    ? { boxShadow: "0 0 0 1px rgba(124,58,237,0.15), 0 0 60px rgba(124,58,237,0.12)" }
                    : {}),
                }}
              >
                {/* Animated conic border for Pro */}
                {plan.featured && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: "conic-gradient(from var(--angle, 0deg), #7C3AED, #22D3EE, #A78BFA, #7C3AED)",
                      padding: "1px",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      WebkitMaskComposite: "xor",
                      animation: "spin-gradient 4s linear infinite",
                    }}
                    aria-hidden
                  />
                )}

                {/* Glow for Pro */}
                {plan.featured && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{
                      top: -80,
                      width: 300,
                      height: 200,
                      background: "rgba(124,58,237,0.12)",
                      filter: "blur(80px)",
                    }}
                    aria-hidden
                  />
                )}

                {/* Badge */}
                {badge && (
                  <div className="relative z-10 flex justify-center" style={{ marginBottom: 16 }}>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full text-white"
                      style={{
                        background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 14px",
                        boxShadow: "0 0 24px rgba(124,58,237,0.6), 0 0 8px rgba(34,211,238,0.3)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {badge}
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-col flex-1">
                  <h3 className="text-xl font-bold tracking-[-0.02em]" style={{ color: "#F5F5F7" }}>
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#71717A" }}>
                    {plan.tagline}
                  </p>

                  <div className="mt-6 mb-8">
                    {price !== null ? (
                      price === 0 ? (
                        <span
                          style={{
                            fontSize: 44,
                            fontWeight: 700,
                            letterSpacing: "-0.04em",
                            color: "#F5F5F7",
                          }}
                        >
                          Gratuit
                        </span>
                      ) : (
                        <>
                          <span
                            style={{
                              fontSize: 56,
                              fontWeight: 700,
                              letterSpacing: "-0.04em",
                              color: "#F5F5F7",
                            }}
                          >
                            {price}
                          </span>
                          <span className="text-sm ml-1" style={{ color: "#A1A1AA" }}>€/mois</span>
                          {annual && (
                            <p className="text-xs mt-2" style={{ color: "#71717A" }}>
                              facturé annuellement
                            </p>
                          )}
                        </>
                      )
                    ) : (
                      <span
                        style={{
                          fontSize: 44,
                          fontWeight: 700,
                          letterSpacing: "-0.04em",
                          color: "#F5F5F7",
                        }}
                      >
                        Sur devis
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3.5 flex-1">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                        style={{ color: "#A1A1AA" }}
                      >
                        <CheckIcon />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      asChild
                      size="lg"
                      variant={plan.featured ? "primary" : "secondary"}
                      className="w-full group/btn"
                    >
                      <Link href={plan.cta.href}>
                        {plan.cta.label}
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                          aria-hidden
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
