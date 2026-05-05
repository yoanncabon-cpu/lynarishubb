import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  ArrowRight,
  Upload,
  Star,
  MessageSquare,
  RotateCcw,
  Users,
  Briefcase,
  TrendingUp,
  Code2,
  Target,
  Mail,
  BarChart3,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Elio — Agent Commercial IA | Lynaris",
  description:
    "Elio prospecte, qualifie et relance automatiquement. Scoring des prospects, messages personnalises, kanban commercial, sequences de relance.",
}

const ACCENT = "#10B981"
const ACCENT_10 = "rgba(16,185,129,0.1)"
const ACCENT_20 = "rgba(16,185,129,0.2)"
const ACCENT_30 = "rgba(16,185,129,0.3)"

const steps = [
  {
    icon: Upload,
    title: "1. Import CSV",
    desc: "Importe ta liste de prospects en CSV. Elio enrichit les donnees manquantes.",
  },
  {
    icon: Star,
    title: "2. Enrichit + score",
    desc: "Dropcontact/Hunter complete les emails. Chaque prospect recoit un score 0-100.",
  },
  {
    icon: MessageSquare,
    title: "3. Messages personnalises",
    desc: "Elio redige des messages LinkedIn et emails adaptes au profil de chaque prospect.",
  },
  {
    icon: RotateCcw,
    title: "4. Sequences de relance",
    desc: "Jusqu'a 5 relances automatiques, espacees intelligemment selon les reponses.",
  },
]

const capabilities = [
  {
    icon: Star,
    title: "Scoring des prospects (0-100)",
    desc: "Chaque prospect est score sur des criteres personnalises : poste, taille entreprise, ICP.",
  },
  {
    icon: MessageSquare,
    title: "Messages LinkedIn personnalises",
    desc: "Elio etudie le profil et redige un message d'approche sur-mesure, pas un template generique.",
  },
  {
    icon: RotateCcw,
    title: "Relances automatiques",
    desc: "Sequence de relances programmees avec variation du message si pas de reponse.",
  },
  {
    icon: BarChart3,
    title: "Kanban commercial",
    desc: "Vue kanban temps reel de tous tes prospects : a contacter, en cours, repondu, qualifie.",
  },
  {
    icon: Target,
    title: "Qualification par IA",
    desc: "Elio analyse les reponses et classe les prospects en chaud, tiede ou froid.",
  },
  {
    icon: Zap,
    title: "Enrichissement automatique",
    desc: "Emails professionnels trouves via Dropcontact et Hunter.io sans intervention.",
  },
]

const sectors = [
  {
    icon: Briefcase,
    title: "B2B",
    desc: "Pipeline commercial automatise du premier contact jusqu'a la qualification.",
  },
  {
    icon: Users,
    title: "Consultants",
    desc: "Genere un flux continu de prospects qualifies sans passer des heures sur LinkedIn.",
  },
  {
    icon: TrendingUp,
    title: "Agences",
    desc: "Scalez la prospection sans recruter un SDR supplementaire.",
  },
  {
    icon: Code2,
    title: "SaaS",
    desc: "Prospecte les ICP identifies et nourrit le pipeline avec des leads qualifies.",
  },
]

const integrations = [
  { name: "Gmail", color: "#EA4335" },
  { name: "Dropcontact", color: "#6366F1" },
  { name: "Hunter.io", color: "#F59E0B" },
  { name: "LinkedIn", color: "#0A66C2" },
]

const stats = [
  { value: "3-5", label: "Reponses qualifiees/semaine" },
  { value: "2h", label: "Economisees par semaine" },
  { value: "100", label: "Score max prospects" },
  { value: "×3", label: "Taux de reponse vs. cold email generique" },
]

export default function ElioPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/elio.webp"
        alt="Elio, Agent Commercial Lynaris"
        color="#10B981"
        name="Elio"
        role="Agent Commercial"
        tagline="Prospecte, qualifie, relance. Automatiquement."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="elio-heading"
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT_20} 0%, transparent 60%)`,
          }}
        />
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "9999px",
              border: `1px solid ${ACCENT_30}`,
              background: ACCENT_10,
              padding: "0.375rem 1rem",
              fontSize: "0.875rem",
              color: ACCENT,
              marginBottom: "1.5rem",
            }}
          >
            <span aria-hidden="true" style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: ACCENT }} />
            Agent Commercial
          </div>
          <h1
            id="elio-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Elio prospecte, qualifie
            <br />
            <span style={{ color: ACCENT }}>et relance automatiquement</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Importe tes prospects, laisse Elio les enrichir, scorer et engager des
            conversations personnalisees — 3 a 5 reponses qualifiees par semaine.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                height: "3rem",
                padding: "0 1.5rem",
                borderRadius: "0.75rem",
                background: ACCENT,
                color: "#0A0A0B",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Elio
            </Link>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                height: "3rem",
                padding: "0 1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#A1A1AA",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Voir une demo
              <ArrowRight style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(20,20,28,0.5)", padding: "2.5rem 0" }}
        aria-label="Statistiques Elio"
      >
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem", textAlign: "center" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <dt style={{ fontSize: "2rem", fontWeight: 700, color: ACCENT }}>{s.value}</dt>
                <dd style={{ fontSize: "0.875rem", color: "#A1A1AA", marginTop: "0.25rem" }}>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-elio">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-elio" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Elio fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Du CSV brut aux conversations qualifiees en 4 etapes.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {steps.map((step) => (
              <div
                key={step.title}
                style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "1.25rem" }}
              >
                <div
                  style={{
                    height: "2.5rem", width: "2.5rem", borderRadius: "0.75rem",
                    background: ACCENT_10, border: `1px solid ${ACCENT_20}`,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
                  }}
                >
                  <step.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT }} aria-hidden="true" />
                </div>
                <h3 style={{ fontWeight: 600, color: "#F5F5F7", marginBottom: "0.5rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-elio">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-elio" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Elio fait pour toi
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                style={{ display: "flex", gap: "1rem", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
              >
                <div
                  style={{ height: "2.5rem", width: "2.5rem", minWidth: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <cap.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT }} aria-hidden="true" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, color: "#F5F5F7", marginBottom: "0.25rem" }}>{cap.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.6 }}>{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-elio">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-elio" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Elio ?
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>Toutes les activites B2B qui veulent scaler la prospection.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {sectors.map((sector) => (
              <div key={sector.title} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, border: `1px solid ${ACCENT_20}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <sector.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT }} aria-hidden="true" />
                </div>
                <h3 style={{ fontWeight: 600, color: "#F5F5F7", marginBottom: "0.375rem" }}>{sector.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.6 }}>{sector.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: "4rem 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }} aria-labelledby="integrations-elio">
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p id="integrations-elio" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: "2rem" }}>
            Integrations incluses
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
            {integrations.map((intg) => (
              <span
                key={intg.name}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", border: `1px solid ${intg.color}33`, background: "rgba(255,255,255,0.03)", fontSize: "0.875rem", fontWeight: 500, color: "#A1A1AA" }}
              >
                <span aria-hidden="true" style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: intg.color }} />
                {intg.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-elio">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-elio" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Lance ta premiere campagne avec Elio aujourd&apos;hui
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Importe ton premier CSV et vois Elio enrichir, scorer et contacter en autonomie.
          </p>
          <Link
            href="/signup"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", height: "3rem", padding: "0 2rem", borderRadius: "0.75rem", background: ACCENT, color: "#0A0A0B", fontWeight: 600, textDecoration: "none" }}
          >
            Demarrer l&apos;essai gratuit
            <ArrowRight style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
          </Link>
          <p style={{ fontSize: "0.75rem", color: "#52525B", marginTop: "1rem" }}>
            14 jours gratuit &mdash; Sans carte bancaire &mdash; Support à l&apos;installation inclus
          </p>
        </div>
      </section>
    </div>
  )
}
