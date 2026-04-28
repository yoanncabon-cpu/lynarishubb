"use client"

import { useState, useRef, type CSSProperties, type MouseEvent } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, Calendar, Check } from "lucide-react"
import { PLAN_LIST, getFeatureList, getPlanBadge } from "@/lib/pricing/plans"
import { RoiCalculatorSection } from "@/components/marketing/RoiCalculatorSection"

// ─── Mouse glow hook (effet spotlight qui suit le curseur) ──────────────────

function useMouseGlow() {
  const ref = useRef<HTMLDivElement | null>(null)
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }
  return { ref, onMouseMove }
}

// ─── Toggle Mensuel / Annuel ─────────────────────────────────────────────────

function BillingToggle({
  annual,
  setAnnual,
}: {
  annual: boolean
  setAnnual: (v: boolean) => void
}) {
  return (
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
        aria-label="Basculer la facturation"
        onClick={() => setAnnual(!annual)}
        className="relative transition-all duration-300 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
        style={{
          width: 56,
          height: 32,
          borderRadius: 9999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#14141C",
        }}
      >
        <span
          className="absolute rounded-full transition-transform duration-300"
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
        className="text-sm font-medium transition-colors flex items-center gap-2"
        style={{ color: annual ? "#F5F5F7" : "#71717A" }}
      >
        Annuel
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          -15%
        </span>
      </span>
    </div>
  )
}

// ─── Card de plan (variante standard) ────────────────────────────────────────

function PlanCard({
  plan,
  annual,
  variant,
}: {
  plan: (typeof PLAN_LIST)[number]
  annual: boolean
  variant: "discovery" | "starter" | "pro" | "business" | "custom"
}) {
  const { ref, onMouseMove } = useMouseGlow()
  const isPro = variant === "pro"
  const isCustom = variant === "custom"
  const isFree = plan.priceMonthly === 0
  const monthlyPrice = annual ? plan.priceAnnualMonthly : plan.priceMonthly
  const badge = getPlanBadge(plan)
  const features = getFeatureList(plan)

  // Couleurs accent par variant
  const accent = {
    discovery: { from: "#22D3EE", to: "#22D3EE", border: "rgba(34,211,238,0.20)" },
    starter:   { from: "#A78BFA", to: "#7C3AED", border: "rgba(124,58,237,0.20)" },
    pro:       { from: "#7C3AED", to: "#22D3EE", border: "rgba(124,58,237,0.40)" },
    business:  { from: "#6366F1", to: "#8B5CF6", border: "rgba(99,102,241,0.20)" },
    custom:    { from: "#FBBF24", to: "#F97316", border: "rgba(245,158,11,0.30)" },
  }[variant]

  return (
    <article
      ref={ref}
      onMouseMove={onMouseMove}
      className={`group relative rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-500 ${
        isPro ? "xl:-translate-y-2 xl:scale-[1.02]" : "hover:-translate-y-1"
      }`}
      style={
        {
          background: isCustom
            ? "linear-gradient(160deg, #14141C 0%, #14141C 60%, rgba(245,158,11,0.05) 100%)"
            : "#14141C",
          border: `1px solid ${accent.border}`,
          ...(isPro
            ? {
                boxShadow:
                  "0 0 0 1px rgba(124,58,237,0.15), 0 0 60px rgba(124,58,237,0.18), 0 0 32px rgba(34,211,238,0.10)",
              }
            : {}),
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as CSSProperties
      }
    >
      {/* Spotlight cursor effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(360px circle at var(--mouse-x) var(--mouse-y), ${accent.from}1a, transparent 40%)`,
        }}
        aria-hidden
      />

      {/* Animated conic border for Pro */}
      {isPro && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              "conic-gradient(from var(--angle, 0deg), #7C3AED, #22D3EE, #A78BFA, #7C3AED)",
            padding: "1px",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            animation: "spin-gradient 8s linear infinite",
          }}
          aria-hidden
        />
      )}

      {/* Badge "Recommandé" pour Pro */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-full text-white"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 14px",
              boxShadow:
                "0 0 24px rgba(124,58,237,0.6), 0 0 8px rgba(34,211,238,0.3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles className="size-3" aria-hidden />
            {badge}
          </span>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        {/* Plan name */}
        <h3 className="text-lg font-semibold text-[#F5F5F7] tracking-tight">
          {plan.name}
        </h3>
        <p
          className="text-xs text-[#71717A] mt-2 mb-6 leading-relaxed"
          style={{ minHeight: "2.5rem" }}
        >
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="mb-6">
          {isFree ? (
            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl font-bold tracking-tight text-[#F5F5F7]"
                style={{ letterSpacing: "-0.04em" }}
              >
                Gratuit
              </span>
            </div>
          ) : isCustom ? (
            <>
              <p className="text-xs text-amber-400/80 mb-1">À partir de</p>
              <span
                className="text-5xl font-bold tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EA580C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.04em",
                }}
              >
                Sur devis
              </span>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-6xl font-bold tracking-tight text-[#F5F5F7]"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {monthlyPrice}
                </span>
                <span className="text-base text-[#A1A1AA] font-medium">€/mois</span>
              </div>
              {annual &&
                plan.priceMonthly !== null &&
                plan.priceMonthly !== monthlyPrice && (
                  <p className="text-xs text-[#71717A] mt-1.5">
                    <span className="line-through text-[#52525B]">
                      {plan.priceMonthly}€/mois
                    </span>{" "}
                    facturé annuellement
                  </p>
                )}
              {plan.setupFee > 0 && (
                <p className="text-xs text-[#71717A] mt-2">
                  + {plan.setupFee}€ de frais de mise en service
                </p>
              )}
            </>
          )}

          {/* Détails Sur-mesure */}
          {isCustom && (
            <p className="text-xs text-[#71717A] mt-3 leading-relaxed">
              {plan.setupFeeMin
                ? `Setup à partir de ${plan.setupFeeMin}€ · `
                : ""}
              Engagement {plan.minCommitmentMonths} mois minimum
            </p>
          )}
        </div>

        {/* CTA en haut (best practice 2026) */}
        <Link
          href={plan.cta.href}
          className="group/cta inline-flex items-center justify-center gap-2 h-11 rounded-xl px-5 text-sm font-semibold transition-all duration-300 mb-7 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
          style={
            isPro
              ? {
                  background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 24px -6px rgba(124,58,237,0.5)",
                }
              : isCustom
                ? {
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.30)",
                    color: "#FCD34D",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#F5F5F7",
                  }
          }
        >
          {isCustom && <Calendar className="size-4" aria-hidden />}
          {plan.cta.label}
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5"
            aria-hidden
          />
        </Link>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-[#D4D4D8]"
            >
              <Check
                className="size-4 mt-0.5 shrink-0"
                style={{ color: isCustom ? "#FBBF24" : "#10B981" }}
                aria-hidden
              />
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function TarifsPricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      <BillingToggle annual={annual} setAnnual={setAnnual} />

      {/* ROI Calculator */}
      <RoiCalculatorSection />

      {/* Plans grid */}
      <section className="pb-24 px-4" aria-label="Plans tarifaires">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-5 items-stretch">
            {PLAN_LIST.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                annual={annual}
                variant={plan.id}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
