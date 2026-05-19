"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroVisualShowcase } from "./HeroVisualShowcase"
import dynamic from "next/dynamic"
// gsap (~250kb) chargé en async dans useEffect → exclu du bundle initial de la landing

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => ({ default: m.HeroScene })),
  { ssr: false }
)

const HeroLogo3D = dynamic(
  () => import("./HeroLogo3D").then((m) => ({ default: m.HeroLogo3D })),
  { ssr: false }
)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const h1Line1Ref = useRef<HTMLSpanElement>(null)
  const h1Line2Ref = useRef<HTMLSpanElement>(null)
  const underlineRef = useRef<SVGPathElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const microRef = useRef<HTMLDivElement>(null)
  const socialRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Import gsap async — sort le ~250kb de la lib du bundle initial de la home
    let cleanup: (() => void) | null = null
    let cancelled = false

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        tl.fromTo(badgeRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
          .fromTo(h1Line1Ref.current, { opacity: 0, y: 40, skewY: 2 }, { opacity: 1, y: 0, skewY: 0, duration: 0.8 }, 0.4)
          .fromTo(h1Line2Ref.current, { opacity: 0, y: 40, skewY: 2 }, { opacity: 1, y: 0, skewY: 0, duration: 0.8 }, 0.55)
          .fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.8)
          .fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.95)
          .fromTo(microRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.1)
          .fromTo(socialRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 1.2)
          .fromTo(terminalRef.current, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0.7)

        if (underlineRef.current) {
          const length = underlineRef.current.getTotalLength?.() ?? 120
          gsap.set(underlineRef.current, { strokeDasharray: length, strokeDashoffset: length })
          tl.to(underlineRef.current, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, 1.1)
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
      className="relative min-h-[100dvh] flex items-center pt-16 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Three.js particles background — hidden on mobile */}
      {!isMobile && <HeroScene />}

      {/* Logo 3D wireframe — apparaît et flotte en arrière-plan */}
      {!isMobile && <HeroLogo3D />}

      {/* Radial ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(124,58,237,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 50%, rgba(34,211,238,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(124,58,237,0.06) 0%, transparent 60%)
          `,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center py-16 lg:py-24">
          {/* Left */}
          <div className="lg:col-span-3 space-y-8">
            {/* Badge — social proof */}
            <div ref={badgeRef} className="inline-flex opacity-0">
              <div
                className="inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-sm max-w-full"
                style={{
                  borderColor: "rgba(249,115,22,0.3)",
                  background: "linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(124,58,237,0.10) 100%)",
                }}
              >
                <span className="text-[#F5F5F7] text-[13px]">
                  Accès anticipé — 3 places pilote ouvertes.
                </span>
                <a href="/contact" style={{ color: "#E86F4D", textDecoration: "underline", fontSize: 13, whiteSpace: "nowrap" }}>
                  Postuler →
                </a>
              </div>
            </div>

            {/* H1 */}
            <div>
              <h1
                id="hero-heading"
                style={{
                  fontSize: "clamp(48px, 6vw, 96px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.95,
                }}
              >
                <span ref={h1Line1Ref} className="block opacity-0" style={{ color: "#F5F5F7" }}>
                  Ton équipe IA.
                </span>
                <span
                  ref={h1Line2Ref}
                  className="block ly-gradient-text opacity-0 relative inline-block"
                >
                  Qui exécute.
                  {/* Animated underline */}
                  <svg
                    aria-hidden
                    className="absolute left-0 pointer-events-none"
                    style={{ bottom: "-6px", width: "100%", height: "10px", overflow: "visible" }}
                    viewBox="0 0 280 10"
                    preserveAspectRatio="none"
                  >
                    <path
                      ref={underlineRef}
                      d="M 2 7 Q 70 2 140 6 Q 210 10 278 5"
                      fill="none"
                      stroke="url(#underline-grad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
            </div>

            {/* Subtitle — concret */}
            <p
              ref={subtitleRef}
              className="opacity-0"
              style={{
                fontSize: 20,
                color: "#A1A1AA",
                maxWidth: 480,
                lineHeight: 1.55,
              }}
            >
              Pendant que tu travailles, Marine répond au téléphone. Lou publie. Elio prospecte.{" "}
              <span style={{ color: "#71717A" }}>Charles coordonne tout. Ton business avance, 24h/24.</span>
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row sm:items-center gap-3 opacity-0">
              <Button asChild size="lg" variant="primary" className="group relative overflow-hidden w-full sm:w-auto">
                <Link href="/tarifs">
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base">
                    Commencer gratuitement — 14 jours
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                  {/* Shimmer */}
                  <span
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                    }}
                    aria-hidden
                  />
                </Link>
              </Button>

              {/* FREE badge — desktop uniquement (redondant avec "gratuitement" sur mobile) */}
              <span
                className="hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "#10B981",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                GRATUIT
              </span>

              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <a href="#demo" onClick={(e) => { e.preventDefault(); document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" }) }}>
                  Voir la démo →
                </a>
              </Button>
            </div>

            {/* Stats inline pills */}
            <div ref={microRef} className="flex flex-wrap gap-2 opacity-0">
              {[
                { icon: "⚡", text: "Activation en 48h" },
                { icon: "✓", text: "Sans carte bancaire" },
                { icon: "🔒", text: "RGPD compliant" },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#A1A1AA",
                  }}
                >
                  <span aria-hidden>{icon}</span>
                  {text}
                </span>
              ))}
            </div>

            {/* Social proof — agent avatars */}
            <div ref={socialRef} className="flex items-center gap-4 pt-2 opacity-0">
              <div style={{ fontSize: 13, color: "#A1A1AA", display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#E86F4D",
                    boxShadow: "0 0 0 3px rgba(232,111,77,0.2)",
                    animation: "pulse-dot 2s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                <span>
                  <span style={{ color: "#F5F5F7", fontWeight: 600 }}>Accès bêta limité</span>
                  {" · Lancement T3 2026"}
                </span>
              </div>
              <style>{`
                @keyframes pulse-dot {
                  0%, 100% { box-shadow: 0 0 0 3px rgba(232,111,77,0.2); }
                  50% { box-shadow: 0 0 0 6px rgba(232,111,77,0.08); }
                }
              `}</style>
            </div>
          </div>

          {/* Right — visuel immersif (photo + avatar Marine + bulles + secteurs) */}
          <div ref={terminalRef} className="lg:col-span-2 w-full opacity-0">
            <HeroVisualShowcase />
          </div>
        </div>
      </div>
    </section>
  )
}
