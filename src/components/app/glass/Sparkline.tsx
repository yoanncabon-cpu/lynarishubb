import React from "react"

interface SparklineProps {
  data?: number[]
  color?: string
  height?: number
  strokeWidth?: number
}

const DEFAULT_DATA = [2, 3, 2, 4, 6, 5, 7, 9, 8, 10, 9, 11, 10, 12, 11]

export function Sparkline({ data = DEFAULT_DATA, color = "#22D3EE", height = 70, strokeWidth = 1.8 }: SparklineProps) {
  const W = 100
  const H = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return { x, y }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`
  const gradId = `spark-${color.replace("#", "")}`
  const last = pts[pts.length - 1]!

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.2} fill={color} />
    </svg>
  )
}
