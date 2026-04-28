import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Workflow,
  Code2,
  Rocket,
  CheckCircle2,
  Settings,
  Building2,
  Zap,
  RefreshCw,
  BookOpen,
  Network,
  Terminal,
  GitBranch,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Orion — Agent Automatisation IA | Lynaris",
  description:
    "Orion cree tes workflows n8n et Make en decrivant ton process en francais. Deploiement automatique, debugging, documentation generee.",
}

const _ACCENT = "#64748B"
const ACCENT_BRIGHT = "#94A3B8"
const ACCENT_10 = "rgba(100,116,139,0.1)"
const ACCENT_20 = "rgba(100,116,139,0.2)"
const ACCENT_30 = "rgba(100,116,139,0.3)"

const steps = [
  {
    icon: Terminal,
    title: "1. Tu decris ton workflow",
    desc: "Explique ton process en francais. Orion pose les questions de clarification si besoin.",
  },
  {
    icon: GitBranch,
    title: "2. Orion le concoit",
    desc: "Genere le JSON du workflow avec les noeuds, conditions et transformations.",
  },
  {
    icon: Rocket,
    title: "3. Le deploie sur ton instance",
    desc: "Push direct vers ton n8n ou Make via API. Le workflow est actif immediatement.",
  },
  {
    icon: CheckCircle2,
    title: "4. Confirme que ca fonctionne",
    desc: "Orion execute un test, verifie les resultats et te confirme que tout tourne.",
  },
]

const capabilities = [
  {
    icon: Workflow,
    title: "Creation de workflows n8n",
    desc: "Depuis une description naturelle, Orion genere des workflows n8n complets et deploie.",
  },
  {
    icon: Network,
    title: "Creation de scenarios Make",
    desc: "Memes capacites pour Make (ex-Integromat) — tous les modules disponibles.",
  },
  {
    icon: RefreshCw,
    title: "Debugging de workflows existants",
    desc: "Partage un workflow qui bug. Orion analyse, identifie le probleme et le corrige.",
  },
  {
    icon: BookOpen,
    title: "Documentation automatique",
    desc: "Chaque workflow deploye est documente automatiquement en Markdown.",
  },
  {
    icon: Code2,
    title: "Webhooks & integrations custom",
    desc: "Pipedream, webhooks personnalises, appels API — Orion gere la complexite technique.",
  },
  {
    icon: Zap,
    title: "Templates metier",
    desc: "Lead nurturing, facturation, onboarding, alertes — 50+ templates prets a deployer.",
  },
]

const sectors = [
  {
    icon: Settings,
    title: "Operations",
    desc: "Automatise les process repetitifs sans ecrire une ligne de code.",
  },
  {
    icon: Code2,
    title: "Tech",
    desc: "Prototype rapidement des integrations sans distraire les developpeurs.",
  },
  {
    icon: Building2,
    title: "Toute entreprise",
    desc: "Si tu fais quelque chose plus de 3 fois par semaine, Orion peut l'automatiser.",
  },
  {
    icon: Workflow,
    title: "Agences no-code",
    desc: "Multiplie la capacite de livraison de workflows clients sans scaler l'equipe.",
  },
]

const integrations = [
  { name: "n8n", color: "#EA4B71" },
  { name: "Make", color: "#6D00CC" },
  { name: "Pipedream", color: "#3B82F6" },
  { name: "Webhooks", color: "#64748B" },
]

const stats = [
  { value: "5min", label: "Workflow cree depuis une description" },
  { value: "20h", label: "Dev economisees par workflow" },
  { value: "0", label: "Lignes de code a ecrire" },
  { value: "50+", label: "Templates metier disponibles" },
]

export default function OrionPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="orion-heading"
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
              color: ACCENT_BRIGHT,
              marginBottom: "1.5rem",
            }}
          >
            <span aria-hidden="true" style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: ACCENT_BRIGHT }} />
            Agent Automatisation
          </div>
          <h1
            id="orion-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Orion cree tes workflows n8n
            <br />
            <span style={{ color: ACCENT_BRIGHT }}>en decrivant ton process en francais</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Explique ce que tu veux automatiser. Orion concoit, deploie et teste
            le workflow sur ton instance n8n ou Make — en 5 minutes.
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
                background: ACCENT_BRIGHT,
                color: "#0A0A0B",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Workflow style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Orion
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
        aria-label="Statistiques Orion"
      >
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem", textAlign: "center" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <dt style={{ fontSize: "2rem", fontWeight: 700, color: ACCENT_BRIGHT }}>{s.value}</dt>
                <dd style={{ fontSize: "0.875rem", color: "#A1A1AA", marginTop: "0.25rem" }}>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-orion">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-orion" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Orion fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              De la description en francais au workflow actif en production.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {steps.map((step) => (
              <div key={step.title} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, border: `1px solid ${ACCENT_20}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <step.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT_BRIGHT }} aria-hidden="true" />
                </div>
                <h3 style={{ fontWeight: 600, color: "#F5F5F7", marginBottom: "0.5rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-orion">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-orion" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Orion fait pour toi
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {capabilities.map((cap) => (
              <div key={cap.title} style={{ display: "flex", gap: "1rem", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", minWidth: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <cap.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT_BRIGHT }} aria-hidden="true" />
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-orion">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-orion" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Orion ?
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Toute entreprise qui veut automatiser sans developper.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {sectors.map((sector) => (
              <div key={sector.title} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, border: `1px solid ${ACCENT_20}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <sector.icon style={{ height: "1.25rem", width: "1.25rem", color: ACCENT_BRIGHT }} aria-hidden="true" />
                </div>
                <h3 style={{ fontWeight: 600, color: "#F5F5F7", marginBottom: "0.375rem" }}>{sector.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.6 }}>{sector.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: "4rem 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: "2rem" }}>
            Plateformes supportees
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-orion">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-orion" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Dis a Orion ce que tu veux automatiser
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Ton premier workflow est pret en 5 minutes. Sans ecrire une ligne de code.
          </p>
          <Link
            href="/signup"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", height: "3rem", padding: "0 2rem", borderRadius: "0.75rem", background: ACCENT_BRIGHT, color: "#0A0A0B", fontWeight: 600, textDecoration: "none" }}
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
