// Composant pure-render sans hook ni event → SSR-friendly (pas de "use client")
import React from "react"

const BLOBS = [
  { color: "#7C3AED", x: "10%", y: "15%", size: 500, dur: 22 },
  { color: "#22D3EE", x: "75%", y: "10%", size: 420, dur: 28 },
  { color: "#EC4899", x: "60%", y: "65%", size: 460, dur: 18 },
  { color: "#6366F1", x: "20%", y: "70%", size: 380, dur: 25 },
  { color: "#F472B6", x: "85%", y: "40%", size: 340, dur: 32 },
]

interface MeshBackgroundProps {
  intensity?: number
  animated?: boolean
}

export function MeshBackground({ intensity = 1, animated = true }: MeshBackgroundProps) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mesh-blob-0 { animation: meshFloat0 22s ease-in-out infinite; }
          .mesh-blob-1 { animation: meshFloat1 28s ease-in-out infinite; }
          .mesh-blob-2 { animation: meshFloat2 18s ease-in-out infinite; }
          .mesh-blob-3 { animation: meshFloat3 25s ease-in-out infinite; }
          .mesh-blob-4 { animation: meshFloat4 32s ease-in-out infinite; }
        }
        @keyframes meshFloat0 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.1)} 66%{transform:translate(-30px,50px) scale(0.95)} }
        @keyframes meshFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(1.08)} 66%{transform:translate(40px,-60px) scale(1.03)} }
        @keyframes meshFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,50px) scale(0.92)} 66%{transform:translate(-60px,-20px) scale(1.06)} }
        @keyframes meshFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.05)} 66%{transform:translate(-40px,30px) scale(0.97)} }
        @keyframes meshFloat4 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,40px) scale(1.07)} 66%{transform:translate(50px,-30px) scale(0.94)} }
      `}</style>

      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className={animated ? `mesh-blob-${i}` : ""}
          style={{
            position: "absolute",
            left: blob.x,
            top: blob.y,
            width: blob.size * intensity,
            height: blob.size * intensity,
            borderRadius: "50%",
            background: `${blob.color}${Math.round(0.55 * 255).toString(16).padStart(2, "0")}`,
            filter: `blur(${Math.round(blob.size * 0.22 * intensity)}px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Grain overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "overlay", opacity: 0.04 }}
        aria-hidden
      >
        <filter id="grain-mesh">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={4} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-mesh)" />
      </svg>
    </div>
  )
}
