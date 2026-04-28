import type { Metadata } from "next"
import { COMPANY } from "@/lib/legal/company"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Carrières — Lynaris",
  description: "Rejoins l'équipe Lynaris et construis l'avenir du travail avec l'IA.",
  // noindex temporaire — page à activer quand le contenu sera prêt.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Carrières — Lynaris",
    description: "Rejoins l'équipe Lynaris et construis l'avenir du travail avec l'IA.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

const values = [
  {
    icon: "◈",
    title: "Autonomie",
    desc: "Tu travailles où tu veux, comme tu veux. On juge sur les résultats.",
    color: "#7C3AED",
  },
  {
    icon: "◎",
    title: "Ambition",
    desc: "On construit quelque chose de grand. On ne s'interdit rien.",
    color: "#E86F4D",
  },
  {
    icon: "◐",
    title: "Impact",
    desc: "Chaque ligne de code améliore le quotidien de centaines d'entrepreneurs.",
    color: "#10B981",
  },
  {
    icon: "◉",
    title: "Transparence",
    desc: "Chiffres, décisions, stratégie — tout est partagé avec l'équipe.",
    color: "#22D3EE",
  },
]

const stack = [
  { name: "Next.js", color: "#F5F5F7" },
  { name: "TypeScript", color: "#3B82F6" },
  { name: "Anthropic", color: "#7C3AED" },
  { name: "Supabase", color: "#10B981" },
  { name: "Twilio", color: "#E86F4D" },
  { name: "ElevenLabs", color: "#F472B6" },
]

const jobs = [
  {
    title: "Full-stack Engineer (Senior)",
    location: "Remote",
    type: "CDI",
    context: "React, Next.js, TypeScript, Supabase",
    locationColor: "#10B981",
  },
  {
    title: "AI Product Manager",
    location: "Paris ou Remote",
    type: "CDI",
    context: "Product, LLMs, Agents IA",
    locationColor: "#7C3AED",
  },
  {
    title: "Sales Engineer",
    location: "Paris",
    type: "CDI",
    context: "B2B SaaS, démos techniques, clients PME",
    locationColor: "#E86F4D",
  },
]

export default function CarrieresPage() {
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>
      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(232,111,77,0.15)",
            color: "#E86F4D",
            border: "1px solid rgba(232,111,77,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>Carrières</div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 800,
            color: "#F5F5F7",
            letterSpacing: "-0.02em",
            margin: "0 0 20px",
            lineHeight: 1.1,
          }}>
            Rejoins l&apos;équipe Lynaris
          </h1>
          <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            On construit l&apos;avenir du travail avec l&apos;IA. Rejoins-nous.
          </p>
        </div>
      </section>

      {/* Culture */}
      <section style={{ padding: "48px 24px 64px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#F5F5F7",
            textAlign: "center",
            margin: "0 0 40px",
          }}>
            Notre culture
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}>
            {values.map((v) => (
              <div key={v.title} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
              }}>
                <div style={{
                  fontSize: 24,
                  color: v.color,
                  marginBottom: 12,
                  fontWeight: 300,
                }}>
                  {v.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", marginBottom: 8 }}>{v.title}</div>
                <p style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#F5F5F7",
            margin: "0 0 12px",
          }}>
            Notre stack technique
          </h2>
          <p style={{ fontSize: 16, color: "#A1A1AA", marginBottom: 36, lineHeight: 1.6 }}>
            Les meilleures technologies pour construire les meilleurs agents.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {stack.map((tech) => (
              <span key={tech.name} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: tech.color,
              }}>
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section style={{ padding: "0 24px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#F5F5F7",
            margin: "0 0 32px",
            textAlign: "center",
          }}>
            Offres d&apos;emploi
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {jobs.map((job) => (
              <div key={job.title} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F7", margin: "0 0 8px" }}>
                    {job.title}
                  </h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      background: `${job.locationColor}18`,
                      color: job.locationColor,
                      border: `1px solid ${job.locationColor}40`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {job.location}
                    </span>
                    <span style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#A1A1AA",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 12,
                    }}>
                      {job.type}
                    </span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>·</span>
                    <span style={{ fontSize: 13, color: "#A1A1AA" }}>{job.context}</span>
                  </div>
                </div>
                <a
                  href={`mailto:${COMPANY.emailJobs}`}
                  style={{
                    display: "inline-block",
                    background: "#7C3AED",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Postuler →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spontaneous */}
      <section style={{
        padding: "48px 24px 80px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F7", margin: "0 0 12px" }}>
            Pas de poste correspondant ?
          </h3>
          <p style={{ fontSize: 15, color: "#A1A1AA", marginBottom: 24, lineHeight: 1.6 }}>
            On est toujours à la recherche de personnes exceptionnelles. Envoie-nous ta candidature spontanée.
          </p>
          <a
            href={`mailto:${COMPANY.emailJobs}?subject=Candidature%20spontanée`}
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.06)",
              color: "#F5F5F7",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Candidature spontanée
          </a>
        </div>
      </section>
    </div>
  )
}
