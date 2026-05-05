import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  PenLine,
  ArrowRight,
  Search,
  FileText,
  Share2,
  Megaphone,
  Mail,
  ShoppingBag,
  Briefcase,
  BarChart3,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Lou — Agent Contenu & SEO IA | Lynaris",
  description:
    "Lou redige, optimise et publie ton contenu partout. Articles SEO, posts LinkedIn/Instagram, newsletters, audit SEO, publication WordPress automatique.",
}

const ACCENT = "#F472B6"
const ACCENT_10 = "rgba(244,114,182,0.1)"
const ACCENT_20 = "rgba(244,114,182,0.2)"
const ACCENT_30 = "rgba(244,114,182,0.3)"

const steps = [
  {
    icon: PenLine,
    title: "1. Tu decris ton idee",
    desc: "Un sujet, un mot-cle ou un objectif — Lou part de la moindre indication.",
  },
  {
    icon: FileText,
    title: "2. Lou planifie",
    desc: "Recherche les mots-cles, analyse la concurrence, etablit un plan editorial.",
  },
  {
    icon: Search,
    title: "3. Redige + optimise SEO",
    desc: "Article structure avec titres H2/H3, meta description et maillage interne.",
  },
  {
    icon: Share2,
    title: "4. Publie sur tes plateformes",
    desc: "WordPress, LinkedIn, Instagram — tout depuis un seul workflow.",
  },
]

const capabilities = [
  {
    icon: FileText,
    title: "Articles SEO (800-2000 mots)",
    desc: "Contenu long-forme structure, optimise pour les moteurs de recherche, avec sources.",
  },
  {
    icon: Share2,
    title: "Posts LinkedIn & Instagram",
    desc: "Formats adaptes a chaque reseau : hooks, carousels, hashtags pertinents.",
  },
  {
    icon: Mail,
    title: "Newsletters",
    desc: "Redige et envoie tes newsletters avec un taux d'ouverture optimise.",
  },
  {
    icon: Search,
    title: "Audit SEO de sites",
    desc: "Analyse l'existant, identifie les lacunes de contenu et les opportunites.",
  },
  {
    icon: Share2,
    title: "Publication WordPress automatique",
    desc: "Publie directement sur ton site sans intervention manuelle.",
  },
  {
    icon: BarChart3,
    title: "Analyse de performance",
    desc: "Suit le trafic genere et adapte la strategie en fonction des resultats.",
  },
]

const sectors = [
  {
    icon: Megaphone,
    title: "Agences marketing",
    desc: "Multiplie la capacite de production sans recruter.",
  },
  {
    icon: Briefcase,
    title: "PME",
    desc: "Maintiens une presence SEO constante avec zero effort editorial.",
  },
  {
    icon: FileText,
    title: "Consultants",
    desc: "Asseois ton expertise en ligne avec du contenu de qualite regulier.",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce",
    desc: "Descriptions produits, articles blog, posts — tout en cohérence de marque.",
  },
]

const integrations = [
  { name: "WordPress", color: "#21759B" },
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Instagram", color: "#E1306C" },
  { name: "Google Analytics", color: "#F9AB00" },
]

const stats = [
  { value: "4", label: "Articles SEO/semaine" },
  { value: "×2", label: "Trafic en 3 mois" },
  { value: "800", label: "Mots min par article" },
  { value: "< 5min", label: "De l'idee a la publication" },
]

export default function LouPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/lou.webp"
        alt="Lou, Agent Contenu & SEO Lynaris"
        color="#F472B6"
        name="Lou"
        role="Agent Contenu & SEO"
        tagline="Rédige, optimise, publie. Partout."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="lou-heading"
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
            <span
              aria-hidden="true"
              style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: ACCENT }}
            />
            Agent Contenu & SEO
          </div>
          <h1
            id="lou-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Lou redige, optimise
            <br />
            <span style={{ color: ACCENT }}>et publie ton contenu partout</span>
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
            Articles SEO, posts reseaux sociaux, newsletters — Lou produit et distribue
            du contenu de qualite professionnelle en quelques minutes.
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
              <PenLine style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Lou
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
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(20,20,28,0.5)",
          padding: "2.5rem 0",
        }}
        aria-label="Statistiques Lou"
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-lou">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-lou" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Lou fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              De l&apos;idee a la publication en 4 etapes automatisees.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
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
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-lou">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-lou" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Lou fait pour toi
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-lou">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-lou" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Lou ?
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Toute entreprise qui a besoin de contenu regulier et de qualite.
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
        aria-labelledby="integrations-lou"
      >
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p id="integrations-lou" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B", marginBottom: "2rem" }}>
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
                <span aria-hidden="true" style={{ height: "0.5rem", width: "0.5rem", borderRadius: "9999px", background: intg.color }} />
                {intg.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: "5rem 0" }} aria-label="Temoignage client">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <figure
            style={{
              borderRadius: "1rem",
              border: `1px solid ${ACCENT_20}`,
              background: `rgba(244,114,182,0.04)`,
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <blockquote style={{ fontSize: "1.125rem", fontWeight: 500, color: "#F5F5F7", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              &ldquo;Lou produit 4 articles SEO par semaine pour nous. Notre trafic organique
              a double en 3 mois sans recruter un seul redacteur.&rdquo;
            </blockquote>
            <figcaption>
              <div
                aria-hidden="true"
                style={{
                  height: "3rem",
                  width: "3rem",
                  borderRadius: "9999px",
                  margin: "0 auto 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0A0A0B",
                  background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`,
                }}
              >
                SC
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F5F5F7" }}>Sophie Cleret</p>
              <p style={{ fontSize: "0.75rem", color: "#A1A1AA", marginTop: "0.25rem" }}>
                Directrice Marketing — Agence Pixel, Paris
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-lou">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-lou" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Active Lou et produis ton premier article aujourd&apos;hui
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Connecte WordPress et les reseaux sociaux. Lou commence immediatement.
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
