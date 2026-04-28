"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number
  children: React.ReactNode
}

export function MagneticButton({
  children,
  className,
  strength = 8,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 350, damping: 30 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) / rect.width
    const deltaY = (e.clientY - centerY) / rect.height
    x.set(deltaX * strength)
    y.set(deltaY * strength)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  // Bouton statique si reducedMotion activé
  if (reducedMotion) {
    return (
      <button
        className={cn(className)}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      className={cn("transition-transform", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  )
}
