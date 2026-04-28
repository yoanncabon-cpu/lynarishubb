"use client"
import React from "react"

interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = "100%", height = 16, radius = 8, className, style }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: radius,
        background: "rgba(255,255,255,0.06)",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ padding: "20px", background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
        <Skeleton width={40} height={40} radius={999} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 15}%`} height={12} style={{ marginBottom: 8, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}
