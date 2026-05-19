"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { NumberTicker } from "@/components/shared/NumberTicker"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Stat {
  type: "ticker" | "static"
  value?: number
  suffix?: string
  prefix?: string
  display: string
  label: string
  highlight: boolean
  description: string
  delay: number
}

const stats: Stat[] = [
  {
    type: "static",
    display: "< 2s",
    label: "Appel décroché",
    highlight: true,
    description: "en moins de 2 secondes — chaque appel entrant",
    delay: 0,
  },
  {
    type: "ticker",
    value: 48,
    suffix: "h",
    display: "48h",
    label: "Délai d'activation",
    highlight: false,
    description: "de la signature à l'opérationnel",
    delay: 150,
  },
  {
    type: "ticker",
    value: 9,
    display: "9",
    label: "Agents spécialisés",
    highlight: true,
    description: "1 en production, 8 en développement actif",
    delay: 300,
  },
  {
    type: "static",
    display: "24/7",
    label: "Disponibilité",
    highlight: false,
    description: "vos agents travaillent sans pause ni congé",
    delay: 450,
  },
]

export function StatsSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section
      ref={ref}
      className="py-20 lg:py-24 relative"
      aria-label="Chiffres clés Lynaris"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: stat.delay / 1000 }}
              className={`group relative rounded-2xl border border-[--ly-border] p-6 lg:p-8 transition-all duration-500 overflow-hidden ${
                stat.highlight
                  ? "bg-[--ly-surface] hover:border-[--ly-primary]/30"
                  : "bg-transparent hover:bg-[--ly-surface]/50 hover:border-[--ly-border]"
              }`}
            >
              {stat.highlight && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: "inset 0 0 40px rgba(124,58,237,0.08), 0 0 30px rgba(124,58,237,0.06)",
                  }}
                  aria-hidden
                />
              )}

              <div className="relative z-10">
                <dt
                  className="font-bold text-[--ly-text] tracking-[-0.04em] leading-none"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
                >
                  {stat.type === "ticker" && stat.value !== undefined ? (
                    <NumberTicker
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      duration={1200}
                      delay={stat.delay}
                    />
                  ) : (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.5, ease: EASE, delay: stat.delay / 1000 + 0.1 }}
                    >
                      {stat.display}
                    </motion.span>
                  )}
                </dt>
                <dd className="mt-3 text-sm font-semibold text-[--ly-text-muted] leading-snug">
                  {stat.label}
                </dd>
                <dd className="mt-1 text-[11px] text-[#52525B] leading-relaxed">
                  {stat.description}
                </dd>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
