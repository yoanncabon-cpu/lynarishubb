"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
// gsap (~250kb) + ScrollTrigger chargés en async dans useEffect → exclus du bundle initial

export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
          contentRef.current,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          }
        )
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
      className="relative py-32 lg:py-40 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Photo Higgsfield — entrepreneur premium en background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/cta-hero.webp"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
          aria-hidden
        />
        {/* Overlay multi-couches pour lisibilité + cohérence dark theme */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(180deg, rgba(8,8,16,0.88) 0%, rgba(8,8,16,0.72) 40%, rgba(8,8,16,0.88) 100%)",
          }}
        />
        {/* Aurora violet par-dessus */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.22) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Light beam line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32"
        style={{
          background: "linear-gradient(to bottom, transparent, #7C3AED, transparent)",
          opacity: 0.35,
        }}
        aria-hidden
      />

      <div ref={contentRef} className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="cta-heading"
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#F5F5F7" }}>Prêt à embaucher</span>
          <br />
          <span className="ly-gradient-text">ton équipe IA ?</span>
        </h2>
        <p
          className="mx-auto leading-relaxed"
          style={{ fontSize: 20, color: "#A1A1AA", maxWidth: 480, marginBottom: 40 }}
        >
          Active tes agents en quelques minutes. Essai gratuit de 7 jours, sans carte bancaire.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="xl" variant="primary" className="group relative overflow-hidden">
            <Link href="/signup">
              <span className="relative z-10 flex items-center gap-2">
                Démarrer gratuitement
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
              {/* Shimmer effect */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                }}
                aria-hidden
              />
            </Link>
          </Button>
          <Button asChild size="xl" variant="secondary">
            <Link href="/contact">Voir une démo</Link>
          </Button>
        </div>
        <p
          className="mt-6 font-mono"
          style={{ fontSize: 13, color: "#71717A" }}
        >
          Essai 14 jours · aucune carte bancaire · activation en 48h
        </p>
      </div>
    </section>
  )
}
