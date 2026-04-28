"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Star } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

interface Testimonial {
  name: string
  role: string
  initials: string
  quote: string
  rating: number
  agentSlug: string
  agentName: string
  agentRole: string
}

// Section témoignages désactivée tant qu'aucun client SaaS Lynaris Hub n'a signé un droit de citation
// Mention Cabinet Ménigoz retirée — pas d'accord de citation
const testimonials: Testimonial[] = []

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} étoiles sur 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-[--ly-warning] text-[--ly-warning]"
          aria-hidden
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section
      ref={ref}
      className="py-20 lg:py-28 bg-[--ly-surface]/30"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[--ly-primary-soft]">
            Témoignages clients
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[--ly-text] tracking-tight"
          >
            Ils utilisent Lynaris
          </h2>
          <p className="text-base text-[--ly-text-dim] max-w-xl mx-auto">
            1 client en production. 3 places pilote ouvertes pour les early adopters.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Témoignage réel */}
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="rounded-2xl border border-[--ly-border] bg-[--ly-surface] p-6 hover:border-[--ly-border-hover] transition-colors flex flex-col"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 10px 6px 6px", borderRadius: 999,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                marginBottom: 16, alignSelf: "flex-start",
              }}>
                <AgentAvatar slug={t.agentSlug} size={22} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.7)" }}>{t.agentName}</span>
                <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)" }}>— {t.agentRole}</span>
              </div>
              <Stars count={t.rating} />
              <blockquote className="mt-4 flex-1 text-[--ly-text-muted] italic leading-relaxed text-sm">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(232,111,77,0.3))",
                    border: "1px solid rgba(255,255,255,0.12)", color: "#F5F5F7",
                  }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[--ly-text]">{t.name}</p>
                  <p className="text-xs text-[--ly-text-dim]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Slot bêta 1 */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-dashed flex flex-col items-center justify-center p-8 text-center"
            style={{
              borderColor: "rgba(232,111,77,0.3)",
              background: "rgba(232,111,77,0.03)",
              backdropFilter: "blur(20px)",
              minHeight: 280,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(232,111,77,0.12)", border: "1px solid rgba(232,111,77,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, marginBottom: 16,
            }}>
              🚀
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#E86F4D", marginBottom: 8 }}>
              Place pilote disponible
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", lineHeight: 1.6, marginBottom: 20 }}>
              Active tes agents en 48h et deviens l&apos;un des premiers clients Lynaris.
            </p>
            <a
              href="/contact"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #E86F4D, #C8522F)",
                color: "#fff", borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                transition: "opacity 150ms",
              }}
            >
              Rejoindre le programme →
            </a>
          </motion.div>

          {/* Slot bêta 2 */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-dashed flex flex-col items-center justify-center p-8 text-center"
            style={{
              borderColor: "rgba(124,58,237,0.3)",
              background: "rgba(124,58,237,0.03)",
              backdropFilter: "blur(20px)",
              minHeight: 280,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, marginBottom: 16,
            }}>
              ✨
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 8 }}>
              Place pilote disponible
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", lineHeight: 1.6, marginBottom: 20 }}>
              Tarif early adopter — accès complet à tous les agents + accompagnement direct.
            </p>
            <a
              href="/contact"
              style={{
                display: "inline-block",
                background: "rgba(124,58,237,0.15)",
                color: "#A78BFA",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}
            >
              Prendre contact →
            </a>
          </motion.div>

          {/* Slot bêta 3 */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-dashed flex flex-col items-center justify-center p-8 text-center"
            style={{
              borderColor: "rgba(34,211,238,0.3)",
              background: "rgba(34,211,238,0.03)",
              backdropFilter: "blur(20px)",
              minHeight: 280,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, marginBottom: 16,
            }}>
              💬
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#22D3EE", marginBottom: 8 }}>
              Ton témoignage ici
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", lineHeight: 1.6, marginBottom: 20 }}>
              Rejoins le programme bêta et ton retour façonne le produit avec nous.
            </p>
            <a
              href="/contact"
              style={{
                display: "inline-block",
                background: "rgba(34,211,238,0.15)",
                color: "#22D3EE",
                border: "1px solid rgba(34,211,238,0.4)",
                borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}
            >
              Postuler →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
