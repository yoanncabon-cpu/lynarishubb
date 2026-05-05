import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  ArrowRight,
  Image,
  Sparkles,
  Scissors,
  Download,
  ShoppingBag,
  Megaphone,
  Palette,
  Share2,
  Zap,
  Layers,
  Film,
  Wand2,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Max — Agent Photo & Video IA | Lynaris",
  description:
    "Max genere des visuels professionnels en quelques secondes via Flux 1.1 Pro. Suppression de fonds, templates Reels, variations produits.",
}

const ACCENT = "#EC4899"
const ACCENT_10 = "rgba(236,72,153,0.1)"
const ACCENT_20 = "rgba(236,72,153,0.2)"
const ACCENT_30 = "rgba(236,72,153,0.3)"

const steps = [
  {
    icon: Wand2,
    title: "1. Decris ton visuel",
    desc: "Produit, ambiance, style, couleurs — Max comprend une description naturelle.",
  },
  {
    icon: Sparkles,
    title: "2. Generation Flux 1.1 Pro",
    desc: "Le modele de generation d'image le plus avance genere ton visuel en secondes.",
  },
  {
    icon: Scissors,
    title: "3. Supprime les fonds",
    desc: "Fond transparent en un clic. Pret pour tes presentations et publications.",
  },
  {
    icon: Download,
    title: "4. Exporte aux bons formats",
    desc: "PNG, JPG, WebP, carre Instagram, banner LinkedIn — chaque format optimise.",
  },
]

const capabilities = [
  {
    icon: Image,
    title: "Generation d'images IA",
    desc: "Flux 1.1 Pro : qualite photographique, styles artistiques, coherence de marque.",
  },
  {
    icon: Scissors,
    title: "Suppression de fonds",
    desc: "Fond blanc, transparent ou personnalise en un clic. Qualite profesionnelle.",
  },
  {
    icon: Film,
    title: "Templates Reels Instagram",
    desc: "Visuels cles pre-formates pour tes Reels et Stories au bon ratio.",
  },
  {
    icon: Layers,
    title: "Variations de produits",
    desc: "Genere 10 angles differents d'un meme produit en quelques minutes.",
  },
  {
    icon: Palette,
    title: "Coherence de marque",
    desc: "Indique tes couleurs et ton style. Max les applique a chaque generation.",
  },
  {
    icon: Zap,
    title: "Stockage automatique",
    desc: "Tous tes visuels archives dans Supabase Storage, accessibles partout.",
  },
]

const sectors = [
  {
    icon: ShoppingBag,
    title: "E-commerce",
    desc: "Photos produits sur fond blanc, variations de couleurs, mise en situation.",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    desc: "Visuels campagnes, bannières publicitaires, posts reseaux sociaux.",
  },
  {
    icon: Palette,
    title: "Agences creatives",
    desc: "Moodboards, concepts clients, iterations rapides sans attendre un DA.",
  },
  {
    icon: Share2,
    title: "Reseaux sociaux",
    desc: "Contenu visuel quotidien adapte a chaque format et plateforme.",
  },
]

const integrations = [
  { name: "Replicate", color: "#6366F1" },
  { name: "Supabase Storage", color: "#3ECF8E" },
]

const stats = [
  { value: "20", label: "Visuels generes en 1 heure" },
  { value: "< 5s", label: "Par generation" },
  { value: "Flux 1.1", label: "Modele Pro actif" },
  { value: "0€", label: "Abonnement Photoshop economise" },
]

export default function MaxPage() {
  return (
    <div style={{ background: "#0A0A0B" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/max.webp"
        alt="Max, Agent Photo & Vidéo Lynaris"
        color="#EC4899"
        name="Max"
        role="Agent Photo & Vidéo"
        tagline="Génère, retouche, exporte. En secondes."
      />
      {/* Hero */}
      <section
        style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}
        aria-labelledby="max-heading"
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
            Agent Photo & Video
          </div>
          <h1
            id="max-heading"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 700,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Max genere des visuels
            <br />
            <span style={{ color: ACCENT }}>professionnels en quelques secondes</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#A1A1AA", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Decris ce que tu veux voir. Max genere, recadre, supprime les fonds et
            exporte les bons formats — qualite photographique, zero Photoshop.
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
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
              Activer Max
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
              Voir des exemples
              <ArrowRight style={{ height: "1rem", width: "1rem" }} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(20,20,28,0.5)", padding: "2.5rem 0" }}
        aria-label="Statistiques Max"
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="how-max">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="how-max" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Comment Max fonctionne
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              De la description au visuel pret a publier en 4 etapes.
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
      <section style={{ padding: "5rem 0", background: "rgba(20,20,28,0.3)" }} aria-labelledby="capabilities-max">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 id="capabilities-max" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", textAlign: "center", marginBottom: "3rem" }}>
            Ce que Max fait pour toi
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="sectors-max">
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 id="sectors-max" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7" }}>
              Pour qui est Max ?
            </h2>
            <p style={{ color: "#A1A1AA", marginTop: "0.75rem" }}>
              Toute entreprise qui a besoin de visuels reguliers et de qualite.
            </p>
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
            Propulse par
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
      <section style={{ padding: "5rem 0" }} aria-labelledby="cta-max">
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 id="cta-max" style={{ fontSize: "2rem", fontWeight: 700, color: "#F5F5F7", marginBottom: "1rem" }}>
            Genere ton premier visuel avec Max aujourd&apos;hui
          </h2>
          <p style={{ color: "#A1A1AA", marginBottom: "2rem" }}>
            Aucun outil a installer. Decris, genere, exporte.
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
