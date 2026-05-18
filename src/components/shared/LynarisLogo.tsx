import React, { useId } from "react"

interface LynarisLogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export function LynarisLogo({ size = 32, showWordmark = true, className }: LynarisLogoProps) {
  const uid = useId()
  const gradId = `logo-grad-${uid.replace(/:/g, "")}`
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.28) }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="Lynaris"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5922F" />
            <stop offset="100%" stopColor="#D4530A" />
          </linearGradient>
        </defs>

        {/* L shape: vertical bar + horizontal bar, diagonal cut at top-right of vertical */}
        <polygon
          points="0,0 24,0 40,18 40,65 100,65 100,100 0,100"
          fill={`url(#${gradId})`}
        />

        {/* Small triangle, top-right (mirrors the diagonal notch) */}
        <polygon
          points="58,0 100,0 100,42"
          fill={`url(#${gradId})`}
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontSize: Math.round(size * 0.5),
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#FAFAFA",
            fontFamily: "var(--font-geist-sans), var(--font-jakarta), system-ui, sans-serif",
            fontStyle: "normal",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          Lynaris
        </span>
      )}
    </div>
  )
}

export default LynarisLogo
