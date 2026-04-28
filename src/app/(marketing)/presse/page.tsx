import type { Metadata } from "next"
import { COMPANY } from "@/lib/legal/company"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Espace presse — Lynaris",
  description: "Ressources presse, chiffres clés, kit de communication et contact médias Lynaris.",
  // noindex temporaire — page à activer quand le contenu sera prêt.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Espace presse — Lynaris",
    description: "Ressources presse, chiffres clés, kit de communication et contact médias Lynaris.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

const keyFigures = [
  { value: "2026", label: "Lancement" },
  { value: "9", label: "Agents IA" },
  { value: "< 48h", label: "Délai d'activation" },
  { value: "TPE/PME", label: "Cible principale" },
]

const downloads = [
  {
    name: "Kit presse complet",
    format: ".zip",
    desc: "Logos, captures d'écran, biographies, assets",
    color: "#7C3AED",
    href: "/press/lynaris-press-kit.zip",
  },
  {
    name: "Logo Lynaris SVG",
    format: ".svg",
    desc: "Vectoriel, fond transparent",
    color: "#10B981",
    href: "/press/lynaris-logos-svg.zip",
  },
  {
    name: "Logo Lynaris PNG",
    format: ".png",
    desc: "Blanc, fond transparent, haute résolution",
    color: "#22D3EE",
    href: "/press/lynaris-logos-png.zip",
  },
  {
    name: "Fiche produit",
    format: ".pdf",
    desc: "Présentation complète de la plateforme",
    color: "#E86F4D",
    href: "/press/lynaris-fiche-produit.pdf",
  },
]

export default function PressePage() {
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>
      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(124,58,237,0.15)",
            color: "#7C3AED",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>Presse</div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 800,
            color: "#F5F5F7",
            letterSpacing: "-0.02em",
            margin: "0 0 20px",
            lineHeight: 1.1,
          }}>
            Espace presse
          </h1>
          <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Tout ce dont les journalistes et créateurs de contenu ont besoin pour parler de Lynaris.
          </p>
        </div>
      </section>

      {/* About */}
      <section style={{ padding: "48px 24px 64px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#F5F5F7",
            margin: "0 0 24px",
          }}>
            À propos de Lynaris
          </h2>
          <p style={{ fontSize: 16, color: "#A1A1AA", lineHeight: 1.8, marginBottom: 20 }}>
            Lynaris est une plateforme d&apos;agents IA spécialisés pour les entrepreneurs et les PME.
            Fondée en 2025, Lynaris permet à n&apos;importe quelle entreprise de déployer en 48 heures
            des agents capables de gérer ses appels téléphoniques, sa prospection commerciale,
            sa création de contenu, ses emails et ses workflows automatisés.
          </p>
          <p style={{ fontSize: 16, color: "#A1A1AA", lineHeight: 1.8 }}>
            Contrairement aux solutions génériques, chaque agent Lynaris est conçu pour un métier précis.
            L&apos;agent vocal répond aux appels 24/7, Elio prospecte sur LinkedIn, Lou rédige et publie du contenu SEO.
            Ensemble, ils forment une équipe IA complète, conçue pour les entrepreneurs et PME en France.
          </p>
        </div>
      </section>

      {/* Key figures */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#F5F5F7",
            margin: "0 0 40px",
            textAlign: "center",
          }}>
            Chiffres clés
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 20,
          }}>
            {keyFigures.map((fig) => (
              <div key={fig.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "28px 24px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: "clamp(36px, 4vw, 52px)",
                  fontWeight: 800,
                  color: "#E86F4D",
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {fig.value}
                </div>
                <div style={{ fontSize: 14, color: "#A1A1AA" }}>{fig.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads */}
      <section style={{ padding: "0 24px 64px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#F5F5F7",
            margin: "0 0 32px",
          }}>
            Téléchargements
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {downloads.map((dl) => (
              <div key={dl.name} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", marginBottom: 4 }}>
                    {dl.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#A1A1AA" }}>{dl.desc}</div>
                </div>
                <button
                  disabled
                  title="Bientôt disponible"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: `${dl.color}18`,
                    color: dl.color,
                    border: `1px solid ${dl.color}40`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  Bientôt disponible
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press contact */}
      <section style={{
        padding: "64px 24px 80px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F7", margin: "0 0 12px" }}>
            Contact presse
          </h3>
          <p style={{ fontSize: 15, color: "#A1A1AA", lineHeight: 1.7, marginBottom: 20 }}>
            Pour toute demande médias, interview ou partenariat éditorial :
          </p>
          <a
            href={`mailto:${COMPANY.emailPresse}`}
            style={{
              display: "inline-block",
              background: "#7C3AED",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {COMPANY.emailPresse}
          </a>
        </div>
      </section>
    </div>
  )
}
