"use client"
import { motion } from "framer-motion"

interface GradientBlobProps {
  className?: string
  color?: string
  size?: number
}

export function GradientBlob({ className, color = "#7C3AED", size = 600 }: GradientBlobProps) {
  return (
    <motion.div
      className={`absolute pointer-events-none select-none ${className ?? ""}`}
      animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 600 600" width={size} height={size}>
        <defs>
          <radialGradient id={`blob-${color.replace("#", "")}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill={`url(#blob-${color.replace("#", "")})`} />
      </svg>
    </motion.div>
  )
}
