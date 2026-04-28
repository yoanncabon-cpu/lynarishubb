import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  FileText,
  Star,
  MessageSquare,
  Calendar,
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  Mail,
  Zap,
  UserCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Alba — Agent RH IA | Lynaris",
  description:
    "Alba trie les CV, redige les contrats et gere tes candidats. Score CV, messages personnalises, planification entretiens, generation de contrats.",
}

const ACCENT = "#8B5CF6"
const ACCENT_10 = "rgba(139,92,246,0.1)"
const ACCENT_20 = "rgba(139,92,246,0.2)"
const ACCENT_30 = "rgba(139,92,246,0.3)"

const steps = [
  {
    icon: Mail,
    title: "1. Candidatures recues",
    desc: "Alba recoit automatiquement les CVs depuis Gmail, job boards ou formulaires.",
  },
  {
    icon: Star,
    title: "2. Score les CV",
    desc: "Chaque CV est note sur tes criteres personnalises : competences, experience, diplomes.",
  },
  {
    icon: MessageSquare,
    title: "3. Envoie les reponses",
    desc: "Message d'acceptation ou de refus redige dans ton style, envoye automatiquement.",
  },
  {
    icon: Calendar,
    title: "4. Planifie + genere contrats",
    desc: "Entretiens planifies dans Google Calendar, contrats pre-remplis envoyes par email.",
  },
]

const capabilities = [
  {
    icon: Star,
    title: "Score CV sur criteres personnalises",
    desc: "Definis tes criteres une fois. Alba note chaque candidature de 0 a 100.",
  },
  {
    icon: MessageSquare,
    title: "Messages candidats personnalises",
    desc: "Pas de template generique. Alba redige un message adapte au profil de chaque candidat.",
  },
  {
    icon: Calendar,
    title: "Planification des entretiens",
    desc: "Alba propose des creneaux depuis ton Google Calendar et confirme automatiquement.",
  },
  {
    icon: FileText,
    title: "Generation de contrats",
    desc: "CDI, CDD, freelance — Alba pre-remplit les contrats depuis tes templates.",
  },
  {
    icon: UserCheck,
    title: "Suivi des candidats",
    desc: "Pipeline visuel de toutes les candidatures en cours, de la reception a l'embauche.",
  },
  {
    icon: Zap,
    title: "FAQ salaries automatique",
    desc: "Reponses automatiques aux questions frequentes des employes sur conges, paie, etc.",
  },
]

const sectors = [
  {
    icon: Building2,
    title: "PME en croissance",
    desc: "Gere 50 candidatures par mois sans recruter un RH a temps plein.",
  },
  {
    icon: Users,
    title: "Cabinets de recrutement",
    desc: "Triple le nombre de dossiers traites sans augmenter l'equipe.",
  },
  {
    icon: Briefcase,
    title: "RH independants",
    desc: "Accompagne plusieurs clients simultanement avec la meme qualite de traitement.",
  },
  {
    icon: CheckCircle2,
    title: "Startups",
    desc: "Processus RH professionnel des le premier recrutement, sans expertise RH interne.",
  },
]

const integrations = [
  { name: "Gmail", color: "#EA4335" },
  { name: "Google Calendar", color: "#4285F4" },
]

const stats = [
  { value: "15h", label: "Recuperees/semaine sur le recrutement" },
  { value: "2min", label: "Score CV complet" },
  { value: "100%", label: "Candidats repondus" },
  { value: "0", label: "Entretiens oublies" },
]

export default function AlbaPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="alba-heading"
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
            Agent RH
          </div>
          <h1
            id="alba-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Alba trie les CV, redige
            <br />
            <span style={{ color: ACCENT }}>les contrats et gere tes candidats</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Fini les heures perdues a trier des CVs. Alba note, repond, planifie les
            entretiens et genere les contrats — 15 heures recuperees par semaine.
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
              <Users style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Alba
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
        aria-label="Statistiques Alba"
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-alba">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-alba" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Alba fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Du CV recu a l&apos;entretien planifie, tout en autonomie.
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
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-alba">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-alba" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Alba fait pour toi
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-alba">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-alba" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Alba ?
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-alba">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-alba" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Active Alba et gagne 15h cette semaine
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Connecte Gmail et Calendar. Alba commence a traiter les candidatures immediatement.
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
