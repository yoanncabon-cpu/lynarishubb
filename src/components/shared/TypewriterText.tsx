"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypewriterTextProps {
  texts: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  showCursor?: boolean
}

export function TypewriterText({
  texts,
  className,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseDuration = 2000,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (texts.length === 0) return

    // Affiche directement le premier texte sans animation
    if (reducedMotion) {
      setDisplayText(texts[0] ?? "")
      return
    }

    const currentText = texts[currentIndex % texts.length] ?? ""

    if (isPaused) {
      const timer = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseDuration)
      return () => clearTimeout(timer)
    }

    if (isDeleting) {
      if (displayText.length === 0) {
        const t = setTimeout(() => {
          setIsDeleting(false)
          setCurrentIndex((i) => (i + 1) % texts.length)
        }, 0)
        return () => clearTimeout(t)
      }
      const timer = setTimeout(() => {
        setDisplayText((t) => t.slice(0, -1))
      }, deletingSpeed)
      return () => clearTimeout(timer)
    }

    if (displayText === currentText) {
      const t = setTimeout(() => setIsPaused(true), 0)
      return () => clearTimeout(t)
    }

    const timer = setTimeout(() => {
      setDisplayText(currentText.slice(0, displayText.length + 1))
    }, typingSpeed)
    return () => clearTimeout(timer)
  }, [displayText, currentIndex, isDeleting, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration, reducedMotion])

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      {showCursor && !reducedMotion && (
        <span className="animate-[blink_1s_step-end_infinite] border-r-2 border-[--ly-primary] ml-0.5" />
      )}
    </span>
  )
}
