"use client"

import { motion, useInView, type Variants } from "framer-motion"
import { useRef, type ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

interface RevealProps {
  children: ReactNode
  /** Direction d'apparition du contenu */
  direction?: Direction
  /** Délai en secondes avant déclenchement */
  delay?: number
  /** Durée de l'animation en secondes */
  duration?: number
  /** Distance de translation initiale en pixels */
  distance?: number
  /** Marge de déclenchement (intersection observer) */
  margin?: string
  /** Class CSS du wrapper */
  className?: string
  /** Joue une seule fois (true) ou à chaque entrée dans le viewport */
  once?: boolean
  /** Tag HTML utilisé pour le wrapper */
  as?: "div" | "section" | "article" | "header" | "footer" | "li" | "ul"
}

/**
 * Reveal — révèle le contenu lors de l'entrée dans le viewport.
 * Respecte prefers-reduced-motion (Framer Motion désactive auto si motion réduite).
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  distance = 32,
  margin = "0px 0px -10% 0px",
  className,
  once = true,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, {
    once,
    margin: margin as `${number}${"px" | "%"} ${number}${"px" | "%"} ${number}${"px" | "%"} ${number}${"px" | "%"}`,
  })

  const offsets: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }
  const { x, y } = offsets[direction]

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        delay,
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </MotionTag>
  )
}
