"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

interface AgentSceneHeroProps {
  src: string
  alt: string
  color: string
  name: string
  role: string
  tagline: string
}

/**
 * Banner cinématique 16:9 en tête de page agent.
 * Parallax léger sur le scroll, overlay dégradé qui blend dans le fond du site.
 * Côté mobile, on dégrade gracefully en image statique.
 */
export function AgentSceneHero({ src, alt, color, name, role, tagline }: AgentSceneHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // Image translates up slowly (parallax) — scale légère au start
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15])
  // Texte fade out à mi-scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "min(70vh, 720px)" }}
    >
      {/* Image avec parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imgY, scale: imgScale }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 30%" }}
        />
      </motion.div>

      {/* Overlay dégradé pour lisibilité texte + blend bottom */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(10,10,15,0.35) 0%, rgba(10,10,15,0.55) 60%, #0A0A0F 100%),
            radial-gradient(ellipse 80% 60% at 50% 100%, ${color}26, transparent 70%)
          `,
        }}
      />

      {/* Texte hero centered */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        style={{ opacity: textOpacity, y: textY }}
      >
        <span
          className="uppercase mb-3"
          style={{
            color,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
          }}
        >
          {role}
        </span>
        <h1
          style={{
            fontSize: "clamp(48px, 9vw, 96px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#F5F5F7",
            lineHeight: 1,
            marginBottom: 16,
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {name}
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 22px)",
            color: "rgba(245,245,247,0.85)",
            fontWeight: 500,
            maxWidth: 580,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {tagline}
        </p>
      </motion.div>
    </div>
  )
}
