import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  MessageCircle,
  ArrowRight,
  Brain,
  Calendar,
  Zap,
  Users,
  CheckCircle2,
  Network,
  Clock,
  Briefcase,
  BarChart3,
  BookOpen,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Charles — Agent Personnel & Orchestrateur IA | Lynaris",
  description:
    "Charles coordonne toute ton equipe IA depuis WhatsApp. Comprend le langage naturel, delegue aux 8 agents specialises, gere ton agenda et envoie un brief matinal quotidien.",
}

const steps = [
  {
    icon: MessageCircle,
    title: "1. Tu envoies un message",
    desc: "Depuis WhatsApp, dis a Charles ce que tu veux faire en langage naturel.",
  },
  {
    icon: Brain,
    title: "2. Charles comprend",
    desc: "Claude Opus analyse l'intention et identifie le meilleur agent pour la tache.",
  },
  {
    icon: Network,
    title: "3. Deleguе aux agents",
    desc: "Charles confie la tache a l'agent vocal, Elio, Mae ou tout autre agent specialise.",
  },
  {
    icon: CheckCircle2,
    title: "4. Te tient informe",
    desc: "Tu recois un rapport concis des resultats, directement sur WhatsApp.",
  },
]

const capabilities = [
  {
    icon: Brain,
    title: "Comprend le langage naturel",
    desc: "Ecris comme tu parles. Charles interprete l'intention et agit sans instructions techniques.",
  },
  {
    icon: Network,
    title: "Delegue a 8 agents specialises",
    desc: "Charles sait quelle tache confier a quel agent. Tu n'as pas a choisir toi-meme.",
  },
  {
    icon: Calendar,
    title: "Gere agenda + emails",
    desc: "Lit ton Google Calendar, cree des evenements, prepare des drafts Gmail pour validation.",
  },
  {
    icon: Clock,
    title: "Brief matinal quotidien",
    desc: "Chaque matin a l'heure que tu choisis, Charles resume les 3 priorites de ta journee.",
  },
  {
    icon: BookOpen,
    title: "Memoire long-terme",
    desc: "Charles se souvient de tes preferences, habitudes et contextes importants (pgvector).",
  },
  {
    icon: Zap,
    title: "Declenche les workflows",
    desc: "Lance n'importe quel workflow n8n ou Make depuis un simple message WhatsApp.",
  },
]

const sectors = [
  {
    icon: Briefcase,
    title: "PME",
    desc: "Coordonne l'ensemble des operations quotidiennes depuis une seule interface.",
  },
  {
    icon: Users,
    title: "CEO & Dirigeants",
    desc: "Elimine le cout de coordination entre outils, equipes et agents IA.",
  },
  {
    icon: BarChart3,
    title: "Entrepreneurs",
    desc: "Automatise la gestion admin pour te concentrer sur la creation de valeur.",
  },
  {
    icon: BookOpen,
    title: "Consultants",
    desc: "Gere les relances clients, la compta temps et les livrables en parallele.",
  },
]

const integrations = [
  { name: "WhatsApp", color: "#25D366" },
  { name: "Gmail", color: "#EA4335" },
  { name: "Google Calendar", color: "#4285F4" },
  { name: "n8n / Make", color: "#7C3AED" },
]

const stats = [
  { value: "-40%", label: "Temps admin economise" },
  { value: "8", label: "Agents coordonnes" },
  { value: "24/7", label: "Disponibilite" },
  { value: "< 3s", label: "Temps de delegation" },
]

const ACCENT = "#7C3AED"
const ACCENT_10 = "rgba(124,58,237,0.1)"
const ACCENT_20 = "rgba(124,58,237,0.2)"
const ACCENT_30 = "rgba(124,58,237,0.3)"

export default function CharlesPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/charles.webp"
        alt="Charles, Agent Personnel Lynaris"
        color="#7C3AED"
        name="Charles"
        role="Agent Personnel"
        tagline="Ton chef d’orchestre IA disponible sur WhatsApp."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="charles-heading"
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
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            textAlign: "center",
            position: "relative",
          }}
        >
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
            <span
              aria-hidden="true"
              style={{
                height: "0.5rem",
                width: "0.5rem",
                borderRadius: "9999px",
                background: ACCENT,
                animation: "pulse 2s infinite",
              }}
            />
            Orchestrateur IA
          </div>
          <h1
            id="charles-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Charles coordonne toute
            <br />
            <span style={{ color: ACCENT }}>ton equipe IA depuis WhatsApp</span>
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "#A1A1AA",
              maxWidth: "40rem",
              margin: "0 auto 2.5rem",
              lineHeight: 1.6,
            }}
          >
            Envoie un message en langage naturel. Charles comprend, delegue aux bons agents
            et te tient informe — sans que tu aies a toucher un seul outil.
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
                fontSize: "0.9375rem",
              }}
            >
              <MessageCircle style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Charles
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
                fontSize: "0.9375rem",
              }}
            >
              Demander une demo
              <ArrowRight style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(20,20,28,0.5)",
          padding: "2.5rem 0",
        }}
        aria-label="Statistiques Charles"
      >
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "2rem",
              textAlign: "center",
            }}
          >
            {stats.map((s) => (
              <div key={s.label} style={{ gridColumn: "span 1" }}>
                <dt style={{ fontSize: "2rem", fontWeight: 700, color: ACCENT }}>{s.value}</dt>
                <dd style={{ fontSize: "0.875rem", color: "#A1A1AA", marginTop: "0.25rem" }}>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-charles">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-charles" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Charles fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Un message WhatsApp declenche toute la chaine de coordination.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {steps.map((step) => (
              <div
                key={step.title}
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "1.25rem",
                }}
              >
                <div
                  style={{
                    height: "2.5rem",
                    width: "2.5rem",
                    borderRadius: "0.75rem",
                    background: ACCENT_10,
                    border: `1px solid ${ACCENT_20}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.75rem",
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
      <section
        style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }}
        aria-labelledby="capabilities-charles"
      >
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2
            id="capabilities-charles"
            style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}
          >
            Ce que Charles fait pour toi
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1.25rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    height: "2.5rem",
                    width: "2.5rem",
                    minWidth: "2.5rem",
                    borderRadius: "0.75rem",
                    background: ACCENT_10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-charles">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-charles" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Charles ?
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Tout professionnel qui veut coordonner plusieurs agents sans friction.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {sectors.map((sector) => (
              <div
                key={sector.title}
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "1.25rem",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    height: "2.5rem",
                    width: "2.5rem",
                    borderRadius: "0.75rem",
                    background: ACCENT_10,
                    border: `1px solid ${ACCENT_20}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.75rem",
                  }}
                >
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
      <section
        style={{ padding: "4rem 0", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        aria-labelledby="integrations-charles"
      >
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p
            id="integrations-charles"
            style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: "2rem" }}
          >
            Integrations incluses
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
            {integrations.map((intg) => (
              <span
                key={intg.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  border: `1px solid ${intg.color}33`,
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#A1A1AA",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: intg.color }}
                />
                {intg.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-charles">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-charles" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Active Charles en moins de 15 minutes
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Connecte WhatsApp, Gmail et Calendar. Charles prend le relai immediatement.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              height: "3rem",
              padding: "0 2rem",
              borderRadius: "0.75rem",
              background: ACCENT,
              color: "#0A0A0B",
              fontWeight: 600,
              textDecoration: "none",
            }}
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
