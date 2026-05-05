"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface VideoLoopProps {
  /** Sources du média ; le premier compatible navigateur sera utilisé */
  sources: Array<{ src: string; type: string }>
  /** Image affichée tant que la vidéo n'est pas chargée (ou en reduced-motion) */
  poster: string
  /** Texte alternatif (utilisé pour aria-label du conteneur) */
  alt?: string
  /** Class CSS du conteneur */
  className?: string
  /** Style inline du conteneur */
  style?: CSSProperties
  /** Style inline appliqué à l'élément <video> et <img> poster */
  mediaStyle?: CSSProperties
  /** object-fit appliqué au média (cover par défaut) */
  fit?: CSSProperties["objectFit"]
  /** Marge IntersectionObserver pour démarrer le préchargement avant entrée */
  rootMargin?: string
  /** Désactive complètement la vidéo (force poster) — utile en debug */
  disabled?: boolean
}

/**
 * VideoLoop — vidéo loop autoplay muted optimisée landing.
 *
 * - Lazy : chargée uniquement quand visible (IntersectionObserver)
 * - Autoplay muted + playsInline (compatible iOS Safari)
 * - prefers-reduced-motion → bloque la lecture, affiche le poster
 * - Économise la bande passante mobile (fait pause hors viewport)
 * - Pas de contrôles : usage purement décoratif
 *
 * Performance : utiliser des fichiers ≤ 3Mo (WebM AV1 + MP4 H264 fallback).
 */
export function VideoLoop({
  sources,
  poster,
  alt = "",
  className,
  style,
  mediaStyle,
  fit = "cover",
  rootMargin = "200px",
  disabled = false,
}: VideoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (disabled || reduceMotion) return
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            videoRef.current?.play().catch(() => {})
          } else {
            videoRef.current?.pause()
          }
        }
      },
      { rootMargin, threshold: 0.01 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [disabled, reduceMotion, rootMargin])

  const showVideo = shouldLoad && !disabled && !reduceMotion

  const baseMedia: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
    ...mediaStyle,
  }

  return (
    <div
      ref={containerRef}
      className={className}
      role={alt ? "img" : "presentation"}
      aria-label={alt || undefined}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {/* Poster — visible tant que la vidéo n'est pas prête, et en reduced-motion */}
      <Image
        src={poster}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        style={{
          objectFit: fit,
          opacity: showVideo && canPlay ? 0 : 1,
          transition: "opacity 700ms ease",
        }}
      />
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onCanPlay={() => setCanPlay(true)}
          style={{
            ...baseMedia,
            position: "relative",
            opacity: canPlay ? 1 : 0,
            transition: "opacity 700ms ease",
          }}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}
    </div>
  )
}
