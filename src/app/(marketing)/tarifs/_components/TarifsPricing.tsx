"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PLANS, getFeatureList, getPlanBadge } from "@/lib/pricing/plans"
import { RoiCalculatorSection } from "@/components/marketing/RoiCalculatorSection"

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
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function TarifsPricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* ── Toggle ── */}
      <div className="flex items-center justify-center gap-4 mb-12 px-4">
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

      {/* ── ROI Calculator ── */}
      <RoiCalculatorSection />

      {/* ── Plans ── */}
      <section className="pb-24 px-4" aria-label="Plans tarifaires">
        <div className="mx-auto max-w-6xl space-y-5">

          {/* ── 5 plans : Découverte / Starter / Pro ⭐ / Business / Sur-mesure ── */}
          {/* Note : la refonte UI premium des cards (typo, padding, hiérarchie) */}
          {/* est traitée à l'étape 7. Cette version étend la grille à 5 colonnes */}
          {/* avec un fallback responsive 1/2/3/5 selon viewport. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
            {PLANS.map((plan) => {
              const isFree = plan.priceMonthly === 0
              const isCustom = plan.priceMonthly === null || plan.id === "custom"
              const monthlyPrice = annual ? plan.priceAnnualMonthly : plan.priceMonthly
              const badge = getPlanBadge(plan)
              const features = getFeatureList(plan)

              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={{
                    background: "#14141C",
                    border: plan.featured
                      ? "1px solid rgba(124,58,237,0.4)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Animated conic border for Pro (featured) */}
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

                  {/* Badge */}
                  {badge && (
                    <span
                      className="absolute left-1/2 rounded-full text-white"
                      style={{
                        top: -14,
                        transform: "translateX(-50%)",
                        background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 16px",
                        boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge}
                    </span>
                  )}

                  <div className="relative z-10 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[#F5F5F7]">{plan.name}</h3>
                    <p className="text-xs text-[#71717A] mt-1 mb-5">{plan.tagline}</p>

                    {/* Price — 3 cas : Gratuit / prix€/mois / Sur devis */}
                    <div className="mb-6">
                      {isFree ? (
                        <>
                          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", color: "#F5F5F7" }}>
                            Gratuit
                          </span>
                          <p className="text-xs mt-1 text-[#71717A]">14 jours, sans CB</p>
                        </>
                      ) : isCustom && plan.priceMonthly === null ? (
                        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em", color: "#F5F5F7" }}>
                          Sur devis
                        </span>
                      ) : (
                        <>
                          {plan.pricePrefix && (
                            <p className="text-xs text-[#71717A] mb-1">{plan.pricePrefix}</p>
                          )}
                          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", color: "#F5F5F7" }}>
                            {monthlyPrice}
                          </span>
                          <span className="text-sm ml-1 text-[#A1A1AA]">€/mois</span>
                          {annual && plan.priceAnnualMonthly !== null && plan.priceAnnualMonthly > 0 && (
                            <p className="text-xs mt-1 text-[#71717A]">
                              soit{" "}
                              <span className="font-semibold text-[#A1A1AA]">
                                {plan.priceAnnualMonthly * 12}€
                              </span>{" "}
                              / an
                            </p>
                          )}
                          {plan.setupFee > 0 && (
                            <p className="text-xs mt-1 text-[#71717A]">
                              + {plan.setupFee}€ de frais de mise en service
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-7">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-[#A1A1AA]">
                          <CheckIcon />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={plan.cta.href}
                      className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 text-sm font-semibold transition-colors"
                      style={
                        plan.featured
                          ? { background: "linear-gradient(135deg,#7C3AED,#22D3EE)", color: "#fff" }
                          : {
                              background: "rgba(255,255,255,0.06)",
                              color: "#F5F5F7",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }
                      }
                    >
                      {plan.cta.label}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>
    </>
  )
}
