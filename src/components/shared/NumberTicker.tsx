"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface NumberTickerProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  decimals?: number
}

export function NumberTicker({
  value,
  suffix = "",
  prefix = "",
  duration = 1400,
  className,
  decimals = 0,
}: NumberTickerProps) {
  const [current, setCurrent] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!inView) return

    // Affiche directement la valeur finale sans compter depuis 0
    if (reducedMotion) {
      setCurrent(value)
      return
    }

    const startTime = performance.now()
    const startValue = 0

    function update(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round((startValue + (value - startValue) * eased) * Math.pow(10, decimals)) / Math.pow(10, decimals))

      if (progress < 1) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }, [inView, value, duration, decimals, reducedMotion])

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(current)

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
