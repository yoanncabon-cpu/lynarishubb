"use client"

import { useEffect, useRef, useState } from "react"

interface HeroVideoLoopProps {
  src: string
  /** Image de fallback pendant le chargement ou sur mobile */
  poster?: string
}

/**
 * Vidéo hero en boucle — Seedance 2.0 cinématique.
 * Masquée sur mobile (réseau + batterie).
 * prefers-reduced-motion → affiche uniquement le poster.
 */
export function HeroVideoLoop({ src, poster }: HeroVideoLoopProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    if (prefersReducedMotion || isMobile) return
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 30%" }}
      />
      {/* Overlay pour blend avec les glows et le contenu hero */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,16,0.55) 0%, rgba(8,8,16,0.45) 40%, rgba(8,8,16,0.75) 100%)",
        }}
      />
    </div>
  )
}
