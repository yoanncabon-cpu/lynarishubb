import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  CreditCard,
  ShoppingBag,
  Code2,
  Building2,
  DollarSign,
  Activity,
  Target,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Nova — Agent Business IA | Lynaris",
  description:
    "Nova analyse tes donnees financieres et te donne des priorites actionnables. Dashboard MRR/ARR temps reel, detection d'anomalies, rapport hebdomadaire.",
}

const ACCENT = "#6366F1"
const ACCENT_10 = "rgba(99,102,241,0.1)"
const ACCENT_20 = "rgba(99,102,241,0.2)"
const ACCENT_30 = "rgba(99,102,241,0.3)"

const steps = [
  {
    icon: CreditCard,
    title: "1. Connect Stripe / banque",
    desc: "Connexion OAuth securisee. Nova ne stocke que les metriques, jamais les donnees brutes.",
  },
  {
    icon: BarChart3,
    title: "2. Agregation des metriques",
    desc: "MRR, ARR, churn, LTV, CAC — tout centralise dans un dashboard en temps reel.",
  },
  {
    icon: AlertTriangle,
    title: "3. Detection des anomalies",
    desc: "Pic de churn, revenu atypique, client a risque — Nova te previent avant que ca coute.",
  },
  {
    icon: FileText,
    title: "4. Rapport hebdo + 3 priorites",
    desc: "Chaque lundi, 10 pages d'analyse et les 3 actions business de la semaine.",
  },
]

const capabilities = [
  {
    icon: TrendingUp,
    title: "Dashboard MRR/ARR temps reel",
    desc: "Toutes tes metriques SaaS sur un seul ecran, mises a jour en continu depuis Stripe.",
  },
  {
    icon: AlertTriangle,
    title: "Detection d'anomalies",
    desc: "Nova apprend ta baseline et t'alerte des qu'un indicateur sort des clous.",
  },
  {
    icon: FileText,
    title: "Rapport hebdomadaire automatique",
    desc: "10 pages d'analyse generees en 2 minutes, pret a partager avec les investisseurs.",
  },
  {
    icon: Target,
    title: "Previsions de revenus",
    desc: "Projections MRR a 3 et 6 mois basees sur les tendances historiques.",
  },
  {
    icon: Activity,
    title: "Analyse du churn",
    desc: "Identifie les clients a risque avant qu'ils ne resilient, avec des actions recommandees.",
  },
  {
    icon: Zap,
    title: "Alertes proactives",
    desc: "WhatsApp ou email quand une metrique franchise un seuil critique que tu definis.",
  },
]

const sectors = [
  {
    icon: Code2,
    title: "SaaS",
    desc: "MRR, churn, expansion revenue — Nova est l'analyste financier que tu ne peux pas recruter.",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce",
    desc: "Panier moyen, taux de conversion, LTV client — tout monitore automatiquement.",
  },
  {
    icon: DollarSign,
    title: "Services abonnement",
    desc: "Retrouvailles mensuelle simplifiee, prediction du churn, fidel des meilleurs clients.",
  },
  {
    icon: Building2,
    title: "Toute entreprise avec Stripe",
    desc: "Si tu utilises Stripe, Nova peut analyser tes revenus des la premiere connexion.",
  },
]

const integrations = [
  { name: "Stripe", color: "#6772E5" },
  { name: "Shopify", color: "#96BF48" },
  { name: "Qonto", color: "#00C4B4" },
]

const stats = [
  { value: "2min", label: "Pour generer un rapport 10 pages" },
  { value: "Temps reel", label: "Mise a jour des metriques" },
  { value: "J-1", label: "Anomalies detectees en avance" },
  { value: "3", label: "Priorites actionnables par semaine" },
]

export default function NovaPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/nova.webp"
        alt="Nova, Agent Business Lynaris"
        color="#6366F1"
        name="Nova"
        role="Agent Business"
        tagline="Ton assistant stratégique avec tes vraies données."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="nova-heading"
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
            Agent Business
          </div>
          <h1
            id="nova-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Nova analyse tes donnees
            <br />
            <span style={{ color: ACCENT }}>et te donne des priorites actionnables</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Connecte Stripe. Nova surveille tes metriques en temps reel, detecte les
            anomalies et te livre un rapport hebdomadaire pret a presenter.
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
                color: "#F5F5F7",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <BarChart3 style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Nova
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
        aria-label="Statistiques Nova"
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-nova">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-nova" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Nova fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              De la connexion Stripe au rapport business, sans intervention manuelle.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {steps.map((step) => (
              <div key={step.title} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, border: `1px solid ${ACCENT_20}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
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
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-nova">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-nova" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Nova fait pour toi
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {capabilities.map((cap) => (
              <div key={cap.title} style={{ display: "flex", gap: "1rem", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ height: "2.5rem", width: "2.5rem", minWidth: "2.5rem", borderRadius: "0.75rem", background: ACCENT_10, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-nova">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-nova" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Nova ?
            </h2>
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
      <section style={{ padding: "4rem 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: "2rem" }}>
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-nova">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-nova" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Active Nova et connais tes metriques en temps reel
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Connexion Stripe en 2 minutes. Ton premier rapport hebdo arrive lundi.
          </p>
          <Link
            href="/signup"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", height: "3rem", padding: "0 2rem", borderRadius: "0.75rem", background: ACCENT, color: "#F5F5F7", fontWeight: 600, textDecoration: "none" }}
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
