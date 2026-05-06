"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"

/**
 * Section "L'équipe Lynaris" — banner cinématique full-bleed avec parallax scroll.
 * Image team-hero.webp générée via Higgsfield (5 agents en réunion).
 */
export function TeamSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // Parallax : l'image scroll plus lentement que le viewport
  const imgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"])
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.08, 1.15])
  // Texte qui apparaît plus tard
  const textOpacity = useTransform(scrollYProgress, [0.05, 0.28], [0, 1])
  const textY = useTransform(scrollYProgress, [0, 1], [32, -32])

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      aria-labelledby="team-heading"
      style={{ height: "min(100vh, 820px)" }}
    >
      {/* Image avec parallax scroll */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imgY, scale: imgScale }}
      >
        <Image
          src="/marketing/team-hero.webp"
          alt="L'équipe Lynaris au travail dans un workspace moderne parisien"
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
          priority={false}
        />
      </motion.div>

      {/* Overlay multi-couches */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(10,10,15,0.65) 0%,
              rgba(10,10,15,0.45) 30%,
              rgba(10,10,15,0.55) 70%,
              rgba(10,10,15,0.95) 100%
            )
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.18), transparent 70%)",
        }}
      />

      {/* Contenu texte — fade-in au scroll */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: textOpacity, y: textY }}
      >
        <span
          className="ly-overline mb-4"
          style={{ color: "#A78BFA" }}
        >
          Une équipe coordonnée
        </span>

        <h2
          id="team-heading"
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#F5F5F7",
            lineHeight: 1.05,
            marginBottom: 24,
            textShadow: "0 4px 32px rgba(0,0,0,0.6)",
            maxWidth: 1100,
          }}
        >
          Tes agents travaillent <span className="ly-gradient-text">ensemble</span>.
          <br />Pas chacun dans son coin.
        </h2>

        <p
          style={{
            fontSize: "clamp(16px, 1.4vw, 20px)",
            color: "rgba(245,245,247,0.85)",
            maxWidth: 640,
            lineHeight: 1.5,
            textShadow: "0 2px 14px rgba(0,0,0,0.5)",
            marginBottom: 36,
          }}
        >
          Charles orchestre. Marine décroche. Lou publie. Elio prospecte.
          Chaque agent est expert de son domaine — et ils se parlent.
        </p>

        <Link
          href="/agents"
          className="group inline-flex items-center gap-2 rounded-full px-6 py-3 transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#F5F5F7",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Découvrir les 9 agents
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </motion.div>
    </section>
  )
}
