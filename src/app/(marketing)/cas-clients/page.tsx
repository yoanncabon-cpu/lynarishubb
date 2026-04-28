// Mention Cabinet Ménigoz retirée — pas d'accord de citation
// Page neutralisée tant qu'aucun client SaaS Lynaris Hub n'a signé un droit de citation.
import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Cas clients — Lynaris",
  description:
    "Premiers cas clients en cours de constitution. Découvre Lynaris en bêta privée.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "Cas clients — Lynaris",
    description:
      "Premiers cas clients en cours de constitution. Découvre Lynaris en bêta privée.",
    type: "article",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

const S = {
  page: {
    background: "#0A0A0F",
    minHeight: "100vh",
    color: "#F5F5F7",
    fontFamily: "inherit",
  } as React.CSSProperties,
  container: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "0 24px",
  } as React.CSSProperties,
}

export default function CasClientsPage() {
  return (
    <div style={S.page}>
      <div style={{ ...S.container, paddingTop: 32, paddingBottom: 0 }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: "#71717A", display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/" style={{ color: "#71717A", textDecoration: "none" }}>Accueil</Link>
          <span>/</span>
          <span style={{ color: "#A1A1AA" }}>Cas clients</span>
        </nav>
      </div>

      <section style={{ padding: "96px 24px 120px", textAlign: "center" }}>
        <div style={S.container}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(232,111,77,0.1)",
            color: "#E86F4D",
            border: "1px solid rgba(232,111,77,0.25)",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            Bêta privée
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 800,
            color: "#F5F5F7",
            letterSpacing: "-0.02em",
            margin: "0 0 20px",
            lineHeight: 1.15,
          }}>
            Premiers cas clients en cours de constitution
          </h1>

          <p style={{ fontSize: 17, color: "#A1A1AA", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Lynaris est en bêta privée. Nous publierons les retours d&apos;expérience de nos premiers
            clients dès qu&apos;ils auront formellement validé la diffusion publique de leur cas.
            Reviens bientôt.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #E86F4D, #C8522F)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 10,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Rejoindre la bêta privée
            </Link>
            <Link
              href="/agents"
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.06)",
                color: "#A1A1AA",
                textDecoration: "none",
                borderRadius: 10,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Découvrir les agents
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
