import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  ArrowRight,
  Inbox,
  SortAsc,
  PenLine,
  Bell,
  Clock,
  Users,
  Briefcase,
  Building2,
  CheckCircle2,
  Mail,
  Zap,
  Filter,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Mae — Agent Mail IA | Lynaris",
  description:
    "Mae trie ta boite mail et redige tes reponses chaque matin. Tri intelligent par priorite, redaction en ton souhaite, brief quotidien de 3 points urgents.",
}

const ACCENT = "#F59E0B"
const ACCENT_10 = "rgba(245,158,11,0.1)"
const ACCENT_20 = "rgba(245,158,11,0.2)"
const ACCENT_30 = "rgba(245,158,11,0.3)"

const steps = [
  {
    icon: Inbox,
    title: "1. Mae analyse a 8h",
    desc: "Chaque matin a l'heure que tu choisis, Mae parcourt tous tes emails non lus.",
  },
  {
    icon: SortAsc,
    title: "2. Trie par priorite",
    desc: "Urgent / Important / Peut attendre / Pas besoin de repondre — 4 niveaux clairs.",
  },
  {
    icon: PenLine,
    title: "3. Redige des reponses",
    desc: "Mae propose un draft pour chaque email qui necessite une reponse, dans ton style.",
  },
  {
    icon: Bell,
    title: "4. Brief matinal 3 points",
    desc: "Tu recois un resume de tes 3 actions urgentes du jour, pret a valider.",
  },
]

const capabilities = [
  {
    icon: Filter,
    title: "Tri intelligent par priorite",
    desc: "Mae classe chaque email : client, prospect, admin, newsletter, spam — avec le bon niveau d'urgence.",
  },
  {
    icon: PenLine,
    title: "Redaction dans ton style",
    desc: "Apres quelques echanges, Mae adopte ton ton, tes formulations et tes habitudes redactionnelles.",
  },
  {
    icon: Bell,
    title: "Detection des emails importants",
    desc: "Contrats, paiements, urgences — Mae les isole et t'en informe immediatement.",
  },
  {
    icon: Clock,
    title: "Brief quotidien",
    desc: "Resume chaque matin les 3 actions prioritaires. Tu arrives concentre sur l'essentiel.",
  },
  {
    icon: Zap,
    title: "Reponses pre-redigees",
    desc: "Valide ou ajuste les drafts de Mae en quelques secondes. Plus d'email vide ouvert.",
  },
  {
    icon: Mail,
    title: "Zero email manque",
    desc: "Mae s'assure qu'aucune demande importante ne passe entre les mailles du filet.",
  },
]

const sectors = [
  {
    icon: Briefcase,
    title: "Dirigeants",
    desc: "Recupere 30 min par matin. Arrive au bureau avec une boite propre et des priorites claires.",
  },
  {
    icon: Users,
    title: "+50 emails/jour",
    desc: "Toute personne avec un volume de mails eleve — Mae absorbe le flux sans s'epuiser.",
  },
  {
    icon: Building2,
    title: "Consultants",
    desc: "Gere les relances clients et les nouvelles demandes sans interruption dans le travail profond.",
  },
  {
    icon: CheckCircle2,
    title: "PME",
    desc: "Support client de premier niveau gere par Mae avant de transmettre les cas complexes.",
  },
]

const integrations = [
  { name: "Gmail", color: "#EA4335" },
  { name: "Outlook", color: "#0078D4" },
]

const stats = [
  { value: "47", label: "Emails traites/jour en moyenne" },
  { value: "30min", label: "Recuperees chaque matin" },
  { value: "8h", label: "Heure du brief quotidien" },
  { value: "< 2min", label: "Pour valider les drafts" },
]

export default function MaePage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/mae.webp"
        alt="Mae, Agent Mail Lynaris"
        color="#F59E0B"
        name="Mae"
        role="Agent Mail"
        tagline="Ta boîte mail triée et gérée chaque matin."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="mae-heading"
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
            Agent Mail
          </div>
          <h1
            id="mae-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Mae trie ta boite mail
            <br />
            <span style={{ color: ACCENT }}>et redige tes reponses chaque matin</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Plus jamais d&apos;email ouvert vide face a toi. Mae trie, redige et te presente
            les 3 actions du jour — 30 minutes recuperees chaque matin.
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
              <Inbox style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Mae
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
        aria-label="Statistiques Mae"
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-mae">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-mae" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Mae fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Chaque matin, ta boite est traitee avant que tu ne te reveilles.
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
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-mae">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-mae" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Mae fait pour toi
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-mae">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-mae" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Mae ?
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-mae">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-mae" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Active Mae et recupere 30 minutes des demain matin
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Connecte Gmail ou Outlook. Mae commence a trier cette nuit.
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
