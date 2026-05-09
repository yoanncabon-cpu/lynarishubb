"use client"
import React, { useState, useEffect, useRef } from "react"

export function Ticker({ to, duration = 1200, style }: { to: number; duration?: number; style?: React.CSSProperties }) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) { setValue(to); return }
    startRef.current = performance.now()
    function tick(now: number) {
      const elapsed = now - startRef.current
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * to))
      if (p < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [to, duration])

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-geist-mono, monospace)", ...style }}>
      {value}
    </span>
  )
}
