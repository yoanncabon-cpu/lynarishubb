import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") ?? "Ton équipe IA qui exécute"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0B 0%, #1A0A2E 50%, #0A0A0B 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F5922F 0%, #D4530A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            L
          </div>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.04em",
            }}
          >
            Lynaris
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#F5F5F7",
            textAlign: "center",
            letterSpacing: "-0.03em",
            maxWidth: 900,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(245,245,247,0.6)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
          Équipe IA · Opérationnelle en 48h · Essai gratuit 14 jours
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: 40,
            padding: "10px 24px",
            background: "rgba(124,58,237,0.2)",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: 999,
            fontSize: 18,
            color: "#C4B5FD",
          }}
        >
          lynaris.ai
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
