"use client"

import Link from "next/link"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

export interface AgentTileProps {
  slug: string
  name: string
  role: string
  color: string
  status: "live" | "beta" | "roadmap"
}

const STATUS_LABEL: Record<AgentTileProps["status"], string> = {
  live: "Actif",
  beta: "Bêta",
  roadmap: "Bientôt",
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

/**
 * Carte agent verre — utilisée dans le carrousel home.
 * Tint subtil avec couleur agent + bord supérieur lumineux.
 */
export function AgentTile({ slug, name, role, color, status }: AgentTileProps) {
  const rgb = hexToRgb(color)
  const cleanRole = role.replace("Agent ", "").replace("Assistante ", "").replace("Assistant ", "")

  return (
    <Link
      href={`/dashboard/agents/${slug}`}
      className="lg-surface-2 lg-sheen lg-card-hover lg-focus"
      aria-label={`${name} — ${cleanRole}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: 220,
        height: 140,
        borderRadius: 18,
        padding: 16,
        textDecoration: "none",
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      {/* Tint coloré */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: `linear-gradient(135deg, rgba(${rgb},0.22) 0%, transparent 55%)`,
          opacity: 0.7,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Bord supérieur lumineux */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          right: 16,
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${rgb},0.55), transparent)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div className="lg-content" style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <AgentAvatar slug={slug} size={36} />
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: status === "live" ? "#34D399" : status === "beta" ? "#FBBF24" : "rgba(255,255,255,0.3)",
                border: "1.5px solid #16161C",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 999,
              color,
              background: `rgba(${rgb},0.14)`,
              border: `1px solid rgba(${rgb},0.28)`,
              marginLeft: "auto",
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#FAFAFA", margin: 0, letterSpacing: "-0.01em" }}>{name}</p>
          <p
            style={{
              fontSize: 12,
              color: "rgba(250,250,250,0.55)",
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cleanRole}
          </p>
        </div>
      </div>
    </Link>
  )
}
