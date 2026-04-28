"use client"

import { useEffect, useRef, useCallback } from "react"

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const outer = useRef({ x: 0, y: 0 })
  const isHovering = useRef(false)
  const rafId = useRef<number>(0)

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Use a ref to hold the animate function to avoid self-reference in useCallback
  const animateRef = useRef<() => void>(() => undefined)

  const animate = useCallback(() => {
    outer.current.x = lerp(outer.current.x, mouse.current.x, 0.15)
    outer.current.y = lerp(outer.current.y, mouse.current.y, 0.15)

    if (outerRef.current) {
      outerRef.current.style.transform = `translate(${outer.current.x - 16}px, ${outer.current.y - 16}px) scale(${isHovering.current ? 2.5 : 1})`
    }
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`
    }
    rafId.current = requestAnimationFrame(animateRef.current)
  }, [])

  useEffect(() => {
    // Keep the ref in sync with latest animate
    animateRef.current = animate
  }, [animate])

  useEffect(() => {
    // Disable on touch devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    if (isTouch) return

    document.documentElement.style.cursor = "none"

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest("a, button, [role='button'], input, textarea, select, label")
      ) {
        isHovering.current = true
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest("a, button, [role='button'], input, textarea, select, label")
      ) {
        isHovering.current = false
      }
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    document.addEventListener("mouseover", onMouseOver, { passive: true })
    document.addEventListener("mouseout", onMouseOut, { passive: true })

    rafId.current = requestAnimationFrame(animate)

    return () => {
      document.documentElement.style.cursor = ""
      window.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("mouseout", onMouseOut)
      cancelAnimationFrame(rafId.current)
    }
  }, [animate])

  return (
    <>
      <div
        ref={outerRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none hidden md:block"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid var(--ly-primary)",
          opacity: 0.6,
          transition: "opacity 0.2s, width 0.3s, height 0.3s",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={innerRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none hidden md:block"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "var(--ly-primary)",
          willChange: "transform",
        }}
      />
    </>
  )
}
