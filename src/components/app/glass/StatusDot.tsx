import React from "react"

type DotStatus = "online" | "busy" | "idle"

const STATUS_COLORS: Record<DotStatus, string> = {
  online: "#10B981",
  busy: "#F59E0B",
  idle: "#71717A",
}

export function StatusDot({ status = "online", size = 5 }: { status?: DotStatus; size?: number }) {
  const color = STATUS_COLORS[status]
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .status-pulse { animation: statusPulse 2s ease-in-out infinite; }
        }
        @keyframes statusPulse {
          0%,100% { box-shadow: 0 0 0 0 ${STATUS_COLORS.busy}80, 0 0 6px ${STATUS_COLORS.busy}80; }
          50% { box-shadow: 0 0 0 3px transparent, 0 0 6px ${STATUS_COLORS.busy}80; }
        }
      `}</style>
      <span
        className={status === "busy" ? "status-pulse" : ""}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}80`,
          flexShrink: 0,
        }}
        aria-hidden
      />
    </>
  )
}
