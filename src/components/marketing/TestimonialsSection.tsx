"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const benefits = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: "#E86F4D",
    bg: "rgba(232,111,77,0.08)",
    border: "rgba(232,111,77,0.2)",
    title: "Tarif early adopter",
    description:
      "Accède à l'ensemble des agents au tarif fondateur, verrouillé à vie. Tu ne paieras jamais le prix catalogue.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#A78BFA",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
    title: "Accompagnement direct",
    description:
      "Yoann configure tes agents avec toi. Onboarding en visio, réponses en moins de 24h, suivi personnalisé pendant les 3 premiers mois.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    color: "#22D3EE",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.2)",
    title: "Influence sur la roadmap",
    description:
      "Tes retours façonnent directement les prochaines fonctionnalités. Les bêta-testeurs votent en priorité sur chaque nouvelle release.",
  },
] as const

export function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section
      ref={ref}
      className="py-20 lg:py-28"
      style={{ background: "rgba(255,255,255,0.01)" }}
      aria-labelledby="beta-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#A78BFA]">
            Programme bêta
          </p>
          <h2
            id="beta-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5F5F7] tracking-tight"
          >
            Sois parmi les premiers
          </h2>
          <p className="text-base text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
            3 places pilote ouvertes. Une fenêtre courte pour intégrer Lynaris avant le lancement officiel — avec des avantages réservés aux fondateurs.
          </p>
        </motion.div>

        {/* Cartes avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.1 }}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: benefit.bg,
                border: `1px solid ${benefit.border}`,
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Icône */}
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: benefit.bg,
                  border: `1px solid ${benefit.border}`,
                  color: benefit.color,
                }}
              >
                {benefit.icon}
              </div>

              {/* Texte */}
              <div className="space-y-2">
                <h3
                  className="text-[15px] font-bold leading-tight"
                  style={{ color: benefit.color }}
                >
                  {benefit.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#A1A1AA]">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA central */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}
          className="flex flex-col items-center gap-4"
        >
          <Link
            href="/contact"
            className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-xl px-8 text-[15px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #E86F4D 0%, #C8522F 100%)",
              boxShadow: "0 0 28px rgba(232,111,77,0.4)",
            }}
          >
            <span className="relative z-10">Rejoindre le programme bêta</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span
              className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              }}
              aria-hidden
            />
          </Link>
          <p className="text-[12px] text-[#52525B]">
            Sans engagement · Réponse sous 24h
          </p>
        </motion.div>
      </div>
    </section>
  )
}
