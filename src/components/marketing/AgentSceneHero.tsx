"use client"

import Image from "next/image"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { useRef } from "react"

interface AgentSceneHeroProps {
  src: string
  alt: string
  color: string
  name: string
  role: string
  tagline: string
  /** Vidéo Seedance 2.0 loop — prend le dessus sur src si définie et non-mobile. */
  videoSrc?: string
}

/**
 * Banner cinématique en tête de page agent.
 * Supporte image (parallax) ou vidéo loop Seedance 2.0.
 * Sur mobile ou prefers-reduced-motion : fallback image statique.
 */
export function AgentSceneHero({ src, alt, color, name, role, tagline, videoSrc }: AgentSceneHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])

  const useVideo = !!videoSrc && !reduceMotion

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "min(70vh, 720px)" }}
    >
      {useVideo ? (
        /* Vidéo Seedance 2.0 — loop, muted, autoplay */
        <motion.div
          className="absolute inset-0"
          style={{ scale: imgScale }}
        >
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          {/* Poster image pendant le chargement vidéo */}
          <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{
              objectPosition: "center 30%",
              // masquée dès que la vidéo joue (z-index inférieur)
              zIndex: -1,
            }}
            aria-hidden
          />
        </motion.div>
      ) : (
        /* Image statique avec parallax */
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
      )}

      {/* Overlay — assombrit progressivement sans couleur parasite */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(10,10,15,0.15) 0%, rgba(10,10,15,0.25) 40%, rgba(10,10,15,0.55) 70%, #0A0A0F 100%)",
        }}
      />

      {/* Texte centré — fade out au scroll */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        style={{ opacity: textOpacity, y: textY }}
      >
        <span
          className="uppercase mb-3"
          style={{ color, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}
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
