import type { Metadata } from "next"
import Link from "next/link"
import { AgentSceneHero } from "@/components/marketing/AgentSceneHero"
import {
  Phone,
  Calendar,
  MessageSquare,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle2,
  Users,
  AlertCircle,
  BookOpen,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Marine — Agente Téléphonique IA 24h/24 | Lynaris",
  description:
    "Marine décroche tous vos appels pendant vos séances, vérifie votre agenda en temps réel et envoie les confirmations SMS. Zéro appel manqué, zéro interruption.",
}

// ── Données ────────────────────────────────────────────────────────────────────

const CYAN = "#22D3EE"

const stats = [
  { value: "< 3s", label: "Temps de réponse", icon: Clock },
  { value: "24/7", label: "Disponibilité", icon: Shield },
  { value: "87 min", label: "Récupérées / semaine", icon: Clock },
  { value: "0", label: "Appels manqués", icon: CheckCircle2 },
]

const steps = [
  {
    step: "01",
    title: "L'appel arrive",
    desc: "Un patient appelle votre cabinet. Marine décroche à la première sonnerie — peu importe si vous êtes en pleine séance.",
    icon: Phone,
  },
  {
    step: "02",
    title: "Marine qualifie",
    desc: "Elle identifie le patient, comprend le motif (RDV, urgence, renseignement), et adapte sa réponse au contexte médical.",
    icon: MessageSquare,
  },
  {
    step: "03",
    title: "L'agenda est vérifié",
    desc: "Marine consulte votre Google Calendar en temps réel et propose les créneaux disponibles selon vos préférences.",
    icon: Calendar,
  },
  {
    step: "04",
    title: "Confirmation envoyée",
    desc: "Le RDV est créé dans votre agenda. Le patient reçoit un SMS de confirmation. Vous recevez un récapitulatif.",
    icon: CheckCircle2,
  },
]

const capabilities = [
  {
    icon: Calendar,
    title: "Prise de RDV Google Calendar",
    desc: "Vérifie vos disponibilités et crée l'événement directement dans votre agenda.",
    color: CYAN,
  },
  {
    icon: MessageSquare,
    title: "SMS de confirmation",
    desc: "Envoie automatiquement un SMS de confirmation au patient avec l'heure et l'adresse.",
    color: "#10B981",
  },
  {
    icon: BookOpen,
    title: "Fiche patient vérifiée",
    desc: "Identifie si le patient est connu et adapte la conversation en conséquence.",
    color: "#7C3AED",
  },
  {
    icon: AlertCircle,
    title: "Escalade urgences",
    desc: "Transfère immédiatement les cas urgents vers votre numéro personnel ou le 15.",
    color: "#EF4444",
  },
  {
    icon: Clock,
    title: "File d'attente de rappels",
    desc: "Enregistre les demandes quand aucun créneau n'est disponible et planifie les rappels.",
    color: "#F59E0B",
  },
  {
    icon: Users,
    title: "Disponible 24h/24, 7j/7",
    desc: "Week-ends, jours fériés, nuits — Marine ne prend jamais de vacances.",
    color: "#F472B6",
  },
]

const sectors = [
  { name: "Kinésithérapie", badge: "Client live", badgeColor: "#10B981" },
  { name: "Ostéopathie", badge: null, badgeColor: null },
  { name: "Médecine générale", badge: null, badgeColor: null },
  { name: "Chirurgie dentaire", badge: null, badgeColor: null },
  { name: "Vétérinaire", badge: null, badgeColor: null },
  { name: "Professions libérales", badge: null, badgeColor: null },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarinePage() {
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>

      {/* Cinematic scene parallax — banner full-bleed avec scroll effects */}
      <AgentSceneHero
        src="/agents/scenes/marine.webp"
        alt="Marine, Agent Téléphonique Lynaris"
        color="#22D3EE"
        name="Marine"
        role="Agent Téléphonique"
        tagline="Décroche. Qualifie. Prend RDV. 24 / 7."
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Glow de fond */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 700, height: 400, pointerEvents: "none",
            background: `radial-gradient(ellipse at center, ${CYAN}12 0%, transparent 65%)`,
          }}
        />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          {/* Badge agent */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${CYAN}12`, color: CYAN,
            border: `1px solid ${CYAN}30`, borderRadius: 999,
            padding: "6px 14px", fontSize: 12, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN, display: "inline-block", animation: "pulseLive 1.8s ease infinite" }} />
            Agente Téléphonique · Claude Sonnet 4.6
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 68px)",
            fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 1.05, margin: "0 0 24px",
          }}>
            <span style={{ color: "#F5F5F7" }}>Marine répond.</span>
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${CYAN}, #7C3AED)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Vous soignez.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.75 }}>
            Votre agente téléphonique IA disponible 24h/24. Elle décroche, qualifie, prend rendez-vous et
            envoie les confirmations SMS — pendant que vous êtes en séance.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: `linear-gradient(135deg, ${CYAN}, #0E9AB3)`,
                color: "#0A0A0F", textDecoration: "none", borderRadius: 12,
                padding: "14px 28px", fontSize: 15, fontWeight: 700,
              }}
            >
              Activer Marine en 48h
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link
              href="/cas-clients"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#A1A1AA", textDecoration: "none", borderRadius: 12,
                padding: "14px 28px", fontSize: 15, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Voir le cas client
            </Link>
          </div>
        </div>
      </section>

      {/* ── Preuve pilote ────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 64px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            background: `linear-gradient(135deg, ${CYAN}08, rgba(124,58,237,0.06))`,
            border: `1px solid ${CYAN}20`,
            borderRadius: 18,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${CYAN}30, rgba(124,58,237,0.3))`,
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "#F5F5F7",
            }}>🏥</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", marginBottom: 4 }}>
                {/* Mention Cabinet kiné pilote retirée — pas d'accord de citation */}
                Bêta privée — accès anticipé · <span style={{ color: "#10B981" }}>Ouvert sur demande</span>
              </div>
              <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.6 }}>
                &ldquo;L&apos;agent vocal répond à tous mes appels pendant les séances. Je ne rate plus un seul
                rendez-vous et mes patients adorent la réactivité.&rdquo;
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, flexShrink: 0, flexWrap: "wrap" }}>
              {[
                { v: "87 min", l: "récupérées/sem" },
                { v: "0", l: "appels manqués" },
                { v: "24/7", l: "disponible" },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: CYAN, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "20px 16px", textAlign: "center",
                  }}
                >
                  <Icon style={{ width: 18, height: 18, color: CYAN, margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 28, fontWeight: 800, color: CYAN, lineHeight: 1, marginBottom: 6 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717A" }}>{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717A", marginBottom: 12 }}>
              Processus
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F5F5F7", margin: 0 }}>
              Un appel géré en 4 étapes
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  style={{
                    display: "flex", gap: 20, alignItems: "flex-start",
                    paddingBottom: i < steps.length - 1 ? 32 : 0,
                    position: "relative",
                  }}
                >
                  {/* Ligne verticale */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: "absolute", left: 22, top: 48, bottom: 0,
                      width: 1, background: `${CYAN}20`,
                    }} />
                  )}

                  {/* Icône */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${CYAN}12`, border: `1px solid ${CYAN}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", zIndex: 1,
                  }}>
                    <Icon style={{ width: 18, height: 18, color: CYAN }} />
                  </div>

                  <div style={{ paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                      Étape {s.step}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#F5F5F7", marginBottom: 8 }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.7 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Capacités ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717A", marginBottom: 12 }}>
              Fonctionnalités
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F5F5F7", margin: 0 }}>
              Ce que Marine sait faire
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div
                  key={cap.title}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "20px",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                    background: `${cap.color}12`, border: `1px solid ${cap.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon style={{ width: 16, height: 16, color: cap.color }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", marginBottom: 6 }}>
                    {cap.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.6 }}>
                    {cap.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Secteurs ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717A", marginBottom: 12 }}>
              Secteurs
            </p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F5F5F7", margin: 0 }}>
              Marine s&apos;adapte à votre métier
            </h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {sectors.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${s.badge ? CYAN + "40" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 999, padding: "9px 18px",
                }}
              >
                <span style={{ fontSize: 14, color: "#F5F5F7", fontWeight: s.badge ? 600 : 400 }}>
                  {s.name}
                </span>
                {s.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: s.badgeColor!,
                    background: `${s.badgeColor}15`, border: `1px solid ${s.badgeColor}30`,
                    borderRadius: 999, padding: "2px 7px", letterSpacing: "0.04em",
                  }}>
                    {s.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intégrations requises ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 18, padding: "28px 28px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#71717A", margin: "0 0 16px" }}>
              Intégrations
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { name: "Google Calendar", desc: "Agenda en temps réel" },
                { name: "Twilio Voice", desc: "Appels entrants" },
                { name: "ElevenLabs", desc: "Voix naturelle" },
              ].map((integ) => (
                <div
                  key={integ.name}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", marginBottom: 2 }}>{integ.name}</div>
                  <div style={{ fontSize: 12, color: "#71717A" }}>{integ.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: "64px 24px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div
          aria-hidden
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, height: 300, pointerEvents: "none",
            background: `radial-gradient(ellipse, ${CYAN}08 0%, transparent 60%)`,
          }}
        />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F5F5F7", margin: "0 0 16px" }}>
            Plus un seul appel manqué
          </h2>
          <p style={{ fontSize: 16, color: "#A1A1AA", marginBottom: 36, lineHeight: 1.7 }}>
            Marine est opérationnelle en 48h. Configuration guidée, sans compétence technique.
            Résultats visibles dès la première semaine.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: `linear-gradient(135deg, ${CYAN}, #0E9AB3)`,
                color: "#0A0A0F", textDecoration: "none",
                borderRadius: 12, padding: "14px 32px",
                fontSize: 16, fontWeight: 700,
                boxShadow: `0 0 32px ${CYAN}30`,
              }}
            >
              Démarrer gratuitement
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link
              href="/contact"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.05)",
                color: "#A1A1AA", textDecoration: "none",
                borderRadius: 12, padding: "14px 28px",
                fontSize: 15, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Parler à l&apos;équipe
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: "#52525B" }}>
            30 jours satisfait ou remboursé · Annulation en 1 clic
          </p>
        </div>
      </section>

      <style>{`
        @keyframes pulseLive {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
