import { ImageResponse } from "next/og"
import { agents } from "@/lib/agents/data"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export const alt = "Agent IA Lynaris"

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = agents.find((a) => a.slug === slug)

  const color = agent?.color ?? "#7C3AED"
  const name = agent?.name ?? "Agent"
  const role = agent?.role ?? "Agent IA"
  const tagline = agent?.tagline ?? "Lynaris — Ton équipe IA qui exécute"

  // Convertit hex → rgba pour les overlays
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0A0A0B",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient radial arrière-plan couleur agent */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexToRgba(color, 0.25)} 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexToRgba(color, 0.12)} 0%, transparent 70%)`,
          }}
        />

        {/* Grille décorative subtile */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Contenu principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "60px 72px",
            position: "relative",
          }}
        >
          {/* Logo Lynaris */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "linear-gradient(135deg, #F5922F 0%, #D4530A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-1px",
              }}
            >
              L
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "rgba(245,245,247,0.7)",
                letterSpacing: "-0.03em",
              }}
            >
              Lynaris
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 14,
                color: "rgba(245,245,247,0.3)",
                fontWeight: 500,
              }}
            >
              · Agent IA
            </span>
          </div>

          {/* Bloc central agent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Badge rôle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: 999,
                background: hexToRgba(color, 0.15),
                border: `1px solid ${hexToRgba(color, 0.4)}`,
                width: "fit-content",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: color,
                  letterSpacing: "0.02em",
                }}
              >
                {role}
              </span>
            </div>

            {/* Nom de l'agent */}
            <div
              style={{
                fontSize: 88,
                fontWeight: 800,
                color: "#F5F5F7",
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
              }}
            >
              {name}
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: 26,
                color: "rgba(245,245,247,0.55)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                maxWidth: 680,
                lineHeight: 1.35,
              }}
            >
              {tagline}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: "rgba(245,245,247,0.3)",
                fontWeight: 500,
              }}
            >
              lynaris.ai
            </span>
            {/* Trait coloré */}
            <div
              style={{
                height: 3,
                width: 120,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${color}, transparent)`,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
