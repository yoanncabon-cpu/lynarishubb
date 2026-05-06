"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Menu, X, Search, ChevronRight, Copy, Check, ArrowLeft, ArrowRight as ArrowRightIcon, ExternalLink } from "lucide-react"

// URL publique du site — basculé automatiquement quand on branche le domaine custom
const SITE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarishubb.vercel.app"

// ---------------------------------------------------------------------------
// Sidebar structure
// ---------------------------------------------------------------------------
const sections = [
  {
    id: "demarrer",
    label: "Démarrer",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quick start" },
      { id: "concepts", label: "Concepts clés" },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    items: [
      { id: "marine", label: "Marine — Agent vocal" },
      { id: "charles", label: "Charles — Orchestrateur" },
      { id: "lou", label: "Lou — Contenu & SEO" },
      { id: "elio", label: "Elio — Commercial" },
      { id: "mae", label: "Mae — Email" },
      { id: "max", label: "Max — Photo & vidéo" },
      { id: "nova", label: "Nova — Business" },
      { id: "alba", label: "Alba — RH" },
    ],
  },
  {
    id: "integrations",
    label: "Intégrations",
    items: [
      { id: "google", label: "Google (Gmail, Calendar)" },
      { id: "twilio", label: "Twilio" },
      { id: "elevenlabs", label: "ElevenLabs" },
      { id: "n8n", label: "n8n" },
    ],
  },
  {
    id: "api",
    label: "API",
    items: [
      { id: "auth", label: "Authentification" },
      { id: "chat", label: "Chat endpoint" },
      { id: "run", label: "Run endpoint" },
      { id: "logs", label: "Logs endpoint" },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    items: [
      { id: "events", label: "Événements" },
      { id: "security", label: "Sécurité" },
      { id: "retry", label: "Retry policy" },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function SectionBadge({ label, color = "#7C3AED" }: { label: string; color?: string }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "clamp(22px, 3vw, 34px)",
        fontWeight: 800,
        color: "#F5F5F7",
        margin: "0 0 12px",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h2>
  )
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 16, color: "#A1A1AA", lineHeight: 1.7, marginBottom: 36 }}>
      {children}
    </p>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F5F5F7", margin: "32px 0 14px" }}>
      {children}
    </h3>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15, color: "#A1A1AA", lineHeight: 1.75, margin: "0 0 16px" }}>
      {children}
    </p>
  )
}

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div
      style={{
        background: "#0D0D14",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {(["#FF5F57", "#FEBC2E", "#28C840"] as string[]).map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{filename}</span>
      </div>
      <pre
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.7,
          color: "#A1A1AA",
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          whiteSpace: "pre-wrap" as const,
        }}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}

function InfoCard({
  title,
  desc,
  color = "#7C3AED",
}: {
  title: string
  desc: string
  color?: string
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 10,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  )
}

function DocTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 28,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 14 }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.06)" }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left" as const,
                  color: "#F5F5F7",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 16px",
                    color: "#A1A1AA",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Introduction
// ---------------------------------------------------------------------------
function IntroductionSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  const agents = [
    { name: "Agent vocal", slug: "marine", role: "Réceptionniste téléphonique IA 24/7", status: "En production", color: "#22D3EE" },
    { name: "Charles", slug: "charles", role: "Orchestrateur & chef de projet", status: "Bêta", color: "#7C3AED" },
    { name: "Lou", slug: "lou", role: "Contenu & SEO", status: "Bêta", color: "#F472B6" },
    { name: "Elio", slug: "elio", role: "Commercial & prospection", status: "Bêta", color: "#10B981" },
    { name: "Mae", slug: "mae", role: "Email & communication", status: "Bêta", color: "#F59E0B" },
    { name: "Max", slug: "max", role: "Photo & vidéo (Replicate)", status: "Roadmap", color: "#EC4899" },
    { name: "Nova", slug: "nova", role: "Business & finance", status: "Roadmap", color: "#6366F1" },
    { name: "Alba", slug: "alba", role: "RH & recrutement", status: "Roadmap", color: "#8B5CF6" },
  ]

  const statusColor: Record<string, string> = {
    "En production": "#10B981",
    "Bêta": "#F59E0B",
    "Roadmap": "#64748B",
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Démarrer" />
      </div>
      <SectionTitle>Bienvenue dans Lynaris</SectionTitle>
      <SectionLead>
        Lynaris est une plateforme d&apos;agents IA spécialisés conçue pour les TPE et PME.
        Chaque agent prend en charge un domaine précis — téléphonie, email, prospection, contenu — et
        s&apos;intègre directement dans votre stack existante.
      </SectionLead>

      <H3>Les agents disponibles</H3>
      <DocTable
        headers={["Agent", "Slug", "Rôle", "Statut"]}
        rows={agents.map((a) => [
          <span key="name" style={{ color: a.color, fontWeight: 700 }}>{a.name}</span>,
          <code key="slug" style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: "#A1A1AA" }}>{a.slug}</code>,
          a.role,
          <TagBadge key="status" label={a.status} color={statusColor[a.status] ?? "#64748B"} />,
        ])}
      />

      <H3>Architecture</H3>
      <Paragraph>
        Chaque agent est une combinaison de trois éléments : un modèle Claude (Sonnet ou Opus), un
        ensemble de tools (fonctions que l&apos;agent peut appeler), et des intégrations vers des services
        tiers. Le tout est géré par l&apos;executor Lynaris qui orchestre le run loop, le streaming SSE, et
        la gestion des erreurs.
      </Paragraph>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 28 }}>
        <InfoCard title="Modèle" desc="Claude Sonnet 4.6 pour les agents temps réel (agent vocal, Elio, Mae). Claude Opus 4.6 pour les agents complexes (Charles, Lou, Nova)." color="#7C3AED" />
        <InfoCard title="Tools" desc="Chaque agent dispose d'un sous-ensemble de tools déclarés dans src/lib/agents/tools/. L'executor gère jusqu'à 10 itérations d'appels d'outils par run." color="#22D3EE" />
        <InfoCard title="Intégrations" desc="Google, Twilio, ElevenLabs, n8n, Replicate, Stripe, Shopify... Les credentials sont chiffrés en base et injectés au runtime." color="#10B981" />
      </div>

      <H3>Intégration dans votre stack</H3>
      <Paragraph>
        Lynaris expose une API REST (chat, run, logs) et un système de webhooks. Vous pouvez l&apos;appeler
        depuis n&apos;importe quel backend, l&apos;intégrer dans n8n ou Make, ou accéder directement au dashboard.
        Aucune modification de votre infrastructure n&apos;est requise.
      </Paragraph>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginTop: 8 }}>
        {[
          { label: "Quick start — en route en 15 min", id: "quickstart", color: "#7C3AED" },
          { label: "Concepts clés", id: "concepts", color: "#22D3EE" },
          { label: "Référence API", id: "auth", color: "#10B981" },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "14px 18px",
              textDecoration: "none",
              color: "#F5F5F7",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
              textAlign: "left" as const,
            }}
          >
            <span>{link.label}</span>
            <span style={{ color: link.color, fontWeight: 600 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Quick start
// ---------------------------------------------------------------------------
const quickstartSteps = [
  { num: 1, title: "Créer un compte", desc: "Inscris-toi en quelques secondes — accès immédiat à ton dashboard, sans carte bancaire.", badge: "2 min", badgeColor: "#22D3EE", href: "/signup" },
  { num: 2, title: "Choisir tes agents", desc: "Sélectionne les agents adaptés à tes besoins parmi les 9 disponibles. Active-les en un clic.", badge: "5 min", badgeColor: "#10B981" },
  { num: 3, title: "Connecter tes outils", desc: "Relie Gmail, Google Calendar, Twilio ou n8n via le catalogue d'intégrations OAuth.", badge: "15 min", badgeColor: "#F59E0B" },
  { num: 4, title: "Activer", desc: "Tes agents commencent à travailler immédiatement. Ils gèrent les appels, les emails, le contenu pendant que tu te concentres sur ton métier.", badge: "Instant", badgeColor: "#7C3AED" },
]

const codeExampleQuickstart = `// Chat avec un agent via l'API Lynaris
const response = await fetch('/api/agents/marine/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <votre_api_key>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Je voudrais prendre un RDV demain à 14h',
    sessionId: 'sess_abc123',
  }),
})

// Réponse en streaming SSE
const reader = response.body?.getReader()
// Lire les chunks...`

function QuickstartSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Démarrer" />
      </div>
      <SectionTitle>Démarrer avec Lynaris</SectionTitle>
      <SectionLead>
        Lynaris est une plateforme d&apos;agents IA spécialisés. En quelques minutes,
        vous pouvez automatiser vos appels, vos emails, votre prospection et votre contenu.
      </SectionLead>

      <H3>Mise en route rapide</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 32 }}>
        {quickstartSteps.map((step) => {
          const Card = step.href ? "a" : "div"
          return (
            <Card
              key={step.num}
              {...(step.href ? { href: step.href } : {})}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                textDecoration: "none",
                cursor: step.href ? "pointer" : "default",
                transition: "border-color 200ms, background 200ms, transform 200ms",
              }}
              onMouseEnter={(e) => {
                if (step.href) {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
                  e.currentTarget.style.background = "rgba(124,58,237,0.06)"
                }
              }}
              onMouseLeave={(e) => {
                if (step.href) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                }
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(124,58,237,0.2)",
                  border: "1.5px solid rgba(124,58,237,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#7C3AED",
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7" }}>{step.title}</span>
                  <TagBadge label={step.badge} color={step.badgeColor} />
                </div>
                <p style={{ fontSize: 14, color: "#A1A1AA", margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
              {step.href && (
                <ChevronRight style={{ width: 18, height: 18, color: "#A1A1AA", flexShrink: 0, marginTop: 6 }} aria-hidden />
              )}
            </Card>
          )
        })}
      </div>

      <a
        href="/signup"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #7C3AED 0%, #E86F4D 100%)",
          color: "white",
          padding: "12px 24px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 36,
          boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
        }}
      >
        Créer un compte gratuit
        <ArrowRightIcon style={{ width: 16, height: 16 }} aria-hidden />
      </a>

      <H3>Exemple de requête</H3>
      <CodeBlock filename="api-example.ts">{codeExampleQuickstart}</CodeBlock>

      <H3>Prochaines étapes</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {[
          { label: "Vue d'ensemble des agents", id: "introduction", color: "#7C3AED" },
          { label: "Configurer les intégrations", id: "google", color: "#E86F4D" },
          { label: "Référence API", id: "auth", color: "#22D3EE" },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#F5F5F7",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
              textAlign: "left" as const,
            }}
          >
            <span>{link.label}</span>
            <span style={{ color: link.color, fontWeight: 600 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Concepts
// ---------------------------------------------------------------------------
function ConceptsSection() {
  const concepts = [
    {
      term: "Agent",
      color: "#7C3AED",
      desc: "Système IA spécialisé avec un rôle précis, un ensemble de tools et un contexte métier. Chaque agent est défini par son prompt système, ses outils disponibles et ses intégrations.",
    },
    {
      term: "Tool",
      color: "#22D3EE",
      desc: "Fonction que l'agent peut appeler pendant une conversation : créer un RDV, envoyer un SMS, lire des emails, publier sur WordPress, etc. Les tools sont déclarés dans src/lib/agents/tools/.",
    },
    {
      term: "Intégration",
      color: "#10B981",
      desc: "Connexion à un service tiers (Google, Twilio, ElevenLabs, n8n, Replicate...). Les credentials sont chiffrés en base et injectés au runtime lors de chaque appel de tool.",
    },
    {
      term: "Conversation",
      color: "#F59E0B",
      desc: "Historique des échanges avec un agent dans une session. Les messages sont persistés et passés en contexte à chaque nouvelle requête. Endpoint : POST /api/agents/{slug}/chat.",
    },
    {
      term: "Run",
      color: "#F472B6",
      desc: "Exécution one-shot d'une tâche sans session persistante. L'agent traite le message, exécute ses tools, et retourne une réponse complète. Endpoint : POST /api/agents/{slug}/run.",
    },
    {
      term: "Streaming SSE",
      color: "#6366F1",
      desc: "Le chat utilise les Server-Sent Events pour streamer la réponse token par token. Les chunks ont le format data: {\"content\": \"...\"} et se terminent par data: [DONE].",
    },
    {
      term: "Org",
      color: "#8B5CF6",
      desc: "Votre espace de travail Lynaris : agents configurés, intégrations connectées, membres de l'équipe, clés API, webhooks. Tout est isolé par org.",
    },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Démarrer" />
      </div>
      <SectionTitle>Concepts clés</SectionTitle>
      <SectionLead>
        Glossaire des termes utilisés dans la documentation et dans le dashboard Lynaris.
      </SectionLead>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {concepts.map((c) => (
          <div
            key={c.term}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "16px 20px",
              borderLeft: `3px solid ${c.color}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", marginBottom: 6 }}>
              <span style={{ color: c.color }}>{c.term}</span>
            </div>
            <div style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.7 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Marine
// ---------------------------------------------------------------------------
// Exemple de configuration neutralisé — Cabinet Ménigoz retiré (pas d'accord de citation)
const marineConfigExample = `{
  "orgName": "Mon cabinet",
  "practitionerName": "Dr. Dupont",
  "services": ["kinésithérapie", "thérapie manuelle"],
  "escalationPhone": "+336...",
  "appointmentDuration": 30,
  "openingHours": "Lundi-Vendredi 8h-19h, Samedi 9h-12h"
}`

function MarineSection() {
  const tools = [
    { name: "check_calendar_availability", desc: "Vérifie les créneaux disponibles dans Google Calendar" },
    { name: "create_calendar_event", desc: "Crée le rendez-vous et envoie l'invitation" },
    { name: "send_sms", desc: "SMS de confirmation via Twilio" },
    { name: "escalate_to_human", desc: "Transfère l'appel vers le numéro d'urgence configuré" },
    { name: "lookup_patient", desc: "Recherche un patient existant dans la base" },
    { name: "add_to_callback_list", desc: "Ajoute le contact à la liste de rappel" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#22D3EE" />
        <TagBadge label="En production" color="#10B981" />
      </div>
      <SectionTitle>Agent vocal — Réceptionniste IA</SectionTitle>
      <SectionLead>
        {/* Mention Cabinet Ménigoz retirée — pas d'accord de citation */}
        L&apos;agent vocal prend les appels entrants 24h/24 et 7j/7, qualifie le motif, prend les rendez-vous
        dans votre Google Calendar et envoie les SMS de confirmation. En bêta privée auprès de cabinets
        de soins partenaires.
      </SectionLead>

      <H3>Stack technique</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="Twilio Voice" desc="Réception des appels entrants. Votre numéro Twilio doit pointer vers le webhook Lynaris." color="#22D3EE" />
        <InfoCard title="Deepgram STT" desc="Transcription en temps réel (français, modèle Nova-2) via WebSocket." color="#7C3AED" />
        <InfoCard title="Claude Sonnet 4.6" desc="Compréhension, qualification, décision. Run loop jusqu'à 10 appels de tools." color="#F5F5F7" />
        <InfoCard title="ElevenLabs TTS" desc="Synthèse vocale réaliste en streaming. Voix configurable dans les paramètres de l'agent." color="#F472B6" />
      </div>

      <H3>Intégrations requises</H3>
      <DocTable
        headers={["Service", "Utilisation", "Setup"]}
        rows={[
          ["Twilio", "Téléphonie, numéro dédié", "Dashboard > Intégrations > Twilio"],
          ["Google Calendar", "Créneaux & création de RDV", "Dashboard > Intégrations > Google"],
          ["ElevenLabs", "Voix réaliste (TTS)", "Dashboard > Intégrations > ElevenLabs"],
        ]}
      />

      <H3>Webhook Twilio</H3>
      <Paragraph>
        Dans la Twilio Console, configurez le Voice URL de votre numéro :
      </Paragraph>
      <CodeBlock filename="twilio-webhook">{`Voice URL → ${SITE_URL}/api/voice/incoming`}</CodeBlock>

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(34,211,238,0.1)", color: "#22D3EE", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Configuration</H3>
      <Paragraph>
        Paramétrez l&apos;agent vocal depuis Dashboard &gt; Agents &gt; Agent vocal &gt; Paramètres. Exemple de
        configuration JSON :
      </Paragraph>
      <CodeBlock filename="marine-config.json">{marineConfigExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Charles
// ---------------------------------------------------------------------------
const charlesCommandExample = `// Exemple via le chat dashboard ou WhatsApp
"Génère-moi un brief de la semaine avec l'activité
 de tous les agents et les RDV du jour."

// Charles va :
// 1. query_agent_logs() sur chaque agent
// 2. read_calendar() pour les RDV du jour
// 3. Compiler et retourner le brief formaté`

function CharlesSection() {
  const tools = [
    { name: "delegate_to_agent", desc: "Délègue une tâche à un agent spécialisé" },
    { name: "query_agent_logs", desc: "Récupère l'activité récente d'un agent" },
    { name: "read_calendar", desc: "Lit les événements Google Calendar" },
    { name: "create_event", desc: "Crée un événement dans Google Calendar" },
    { name: "send_email_draft", desc: "Prépare un email pour validation avant envoi" },
    { name: "search_memory", desc: "Recherche dans la mémoire long-terme (pgvector)" },
    { name: "save_memory", desc: "Enregistre un contexte ou une préférence en mémoire" },
    { name: "generate_daily_brief", desc: "Génère le brief matinal de l'organisation" },
    { name: "trigger_n8n_workflow", desc: "Déclenche un workflow n8n arbitraire" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#7C3AED" />
        <TagBadge label="Bêta" color="#F59E0B" />
      </div>
      <SectionTitle>Charles — Orchestrateur & Chef de projet</SectionTitle>
      <SectionLead>
        Charles comprend les instructions en langage naturel et délègue aux agents spécialisés.
        C&apos;est votre interface principale pour piloter l&apos;ensemble des agents Lynaris sans
        connaître leurs APIs respectives.
      </SectionLead>

      <H3>Accès</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="Dashboard chat" desc="Interface de chat directement dans le dashboard Lynaris, sous Agents > Charles." color="#7C3AED" />
        <InfoCard title="WhatsApp" desc="Si un numéro Twilio WhatsApp est configuré, Charles répond aux messages entrants sur ce numéro." color="#10B981" />
      </div>

      <H3>Mémoire long-terme</H3>
      <Paragraph>
        Charles mémorise les préférences et le contexte de votre organisation dans la table{" "}
        <code style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: "#A1A1AA" }}>agent_memories</code>{" "}
        via pgvector. Les souvenirs sont retrouvés par similarité sémantique à chaque nouvelle requête.
      </Paragraph>

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(124,58,237,0.1)", color: "#7C3AED", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Exemple de commande</H3>
      <CodeBlock filename="charles-example.txt">{charlesCommandExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Lou
// ---------------------------------------------------------------------------
const louPromptExample = `// Exemple de prompt pour Lou
"Rédige un article SEO de 800 mots sur
 'automatisation PME 2026' avec les mots-clés :
 ['automatisation', 'PME', 'IA', 'n8n', 'gain de temps'].
 Publie-le sur WordPress en brouillon."`

function LouSection() {
  const tools = [
    { name: "scrape_url", desc: "Extrait le contenu d'une URL (benchmark concurrents)" },
    { name: "generate_content_plan", desc: "Génère un plan de contenu sur une thématique" },
    { name: "write_article", desc: "Rédige un article complet avec structure SEO" },
    { name: "generate_social_post", desc: "Adapte le contenu pour LinkedIn/Instagram" },
    { name: "publish_wordpress", desc: "Publie en brouillon ou live sur WordPress" },
    { name: "publish_via_n8n", desc: "Déclenche un workflow de publication via n8n" },
    { name: "generate_carousel_slides", desc: "Génère le plan d'un carousel LinkedIn" },
    { name: "analyze_seo", desc: "Analyse les mots-clés et l'optimisation SEO" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#F472B6" />
        <TagBadge label="Bêta" color="#F59E0B" />
      </div>
      <SectionTitle>Lou — Contenu & SEO</SectionTitle>
      <SectionLead>
        Lou rédige, optimise et publie du contenu sur tous les canaux : articles de blog WordPress,
        posts LinkedIn, carrousels Instagram, plans de contenu mensuels.
      </SectionLead>

      <H3>Intégrations</H3>
      <DocTable
        headers={["Service", "Utilisation"]}
        rows={[
          ["WordPress", "Publication automatique d'articles (XML-RPC ou WP REST API)"],
          ["LinkedIn", "Via n8n/Make — nécessite votre validation avant envoi"],
          ["Instagram", "Via n8n/Make — nécessite votre validation avant envoi"],
          ["n8n / Make", "Orchestration des publications multi-canaux"],
        ]}
      />

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(244,114,182,0.1)", color: "#F472B6", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Bonne pratique</H3>
      <InfoCard
        title="Validation avant publication"
        desc="Lou ne publie pas directement sur LinkedIn et Instagram sans votre validation. Les posts sont d'abord présentés comme brouillon pour relecture."
        color="#F59E0B"
      />

      <H3>Exemple de prompt</H3>
      <CodeBlock filename="lou-example.txt">{louPromptExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Elio
// ---------------------------------------------------------------------------
function ElioSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#10B981" />
        <TagBadge label="Bêta" color="#F59E0B" />
      </div>
      <SectionTitle>Elio — Commercial & Prospection</SectionTitle>
      <SectionLead>
        Elio gère la prospection outbound : import de contacts, enrichissement, rédaction de messages
        personnalisés, relances automatiques et scoring des réponses.
      </SectionLead>

      <H3>Interface dédiée</H3>
      <InfoCard
        title="Kanban prospects"
        desc="Accessible depuis /dashboard/agents/elio. Vue Kanban avec les colonnes : À contacter, Contacté, Répondu, Qualifié, Disqualifié."
        color="#10B981"
      />

      <H3>Fonctionnalités</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="Import CSV" desc="Importez une liste de prospects depuis un fichier CSV. Elio dédoublonne et enrichit automatiquement." color="#10B981" />
        <InfoCard title="Enrichissement contact" desc="Via Dropcontact ou Hunter.io (optionnel) : email professionnel, LinkedIn, entreprise." color="#22D3EE" />
        <InfoCard title="Messages personnalisés" desc="Elio rédige un message différent pour chaque prospect en fonction de son profil et de son secteur." color="#7C3AED" />
        <InfoCard title="Scoring réponses" desc="Elio évalue la qualité des réponses (intérêt, timing, budget) et met à jour le score du prospect." color="#F472B6" />
      </div>

      <H3>Intégrations</H3>
      <DocTable
        headers={["Service", "Utilisation"]}
        rows={[
          ["Gmail / Outlook", "Envoi et suivi des séquences email de relance"],
          ["Dropcontact", "Enrichissement des contacts (optionnel)"],
          ["Hunter.io", "Recherche d'emails (optionnel)"],
        ]}
      />

      <H3>Bonne pratique</H3>
      <InfoCard
        title="Toujours relire avant envoi en masse"
        desc="Elio propose les messages pour validation avant tout envoi en masse. Activez l'envoi automatique uniquement après avoir validé la qualité des messages sur un échantillon."
        color="#F59E0B"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Mae
// ---------------------------------------------------------------------------
function MaeSection() {
  const tools = [
    { name: "list_unread_emails", desc: "Liste les emails non lus par catégorie de priorité" },
    { name: "categorize_email", desc: "Classe un email (urgent, informatif, newsletter, spam)" },
    { name: "draft_reply", desc: "Rédige une réponse adaptée au contexte de l'email" },
    { name: "send_email", desc: "Envoie un email (après validation)" },
    { name: "archive", desc: "Archive les emails traités" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#F59E0B" />
        <TagBadge label="Bêta" color="#F59E0B" />
      </div>
      <SectionTitle>Mae — Email & Communication</SectionTitle>
      <SectionLead>
        Mae trie votre boîte de réception, identifie les priorités, rédige les réponses et
        vous envoie un brief quotidien à 8h avec les 3 points urgents du jour.
      </SectionLead>

      <H3>Intégrations requises</H3>
      <InfoCard
        title="Gmail (OAuth requis)"
        desc="Connexion via OAuth Google avec les scopes gmail.readonly et gmail.send. Setup : Dashboard > Intégrations > Google."
        color="#F59E0B"
      />

      <H3>Brief quotidien</H3>
      <Paragraph>
        Chaque matin à 8h, Mae envoie un résumé avec : les 3 emails les plus urgents, les sujets en
        attente de réponse depuis plus de 48h, et les newsletters à désabonner. Configurable dans
        les paramètres de l&apos;agent.
      </Paragraph>

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(245,158,11,0.1)", color: "#F59E0B", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Max
// ---------------------------------------------------------------------------
function MaxSection() {
  const tools = [
    { name: "generate_image", desc: "Génère une image via Replicate (Flux 1.1 Pro)" },
    { name: "edit_image", desc: "Édite une image existante (inpainting, retouche)" },
    { name: "upscale_image", desc: "Augmente la résolution d'une image" },
    { name: "generate_video", desc: "Génère une courte vidéo (modèles Replicate)" },
    { name: "save_to_storage", desc: "Sauvegarde l'asset dans Supabase Storage" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#EC4899" />
        <TagBadge label="Roadmap" color="#64748B" />
      </div>
      <SectionTitle>Max — Photo & Vidéo</SectionTitle>
      <SectionLead>
        Max génère et édite tes visuels marketing : photos produit, illustrations d&apos;article,
        miniatures vidéo, contenus pour réseaux sociaux. Tous les assets passent par Replicate
        (Flux 1.1 Pro pour les images) et sont stockés dans ton espace Supabase.
      </SectionLead>

      <H3>Intégrations requises</H3>
      <DocTable
        headers={["Service", "Utilisation"]}
        rows={[
          ["Replicate", "Génération d'images et vidéos (clé API requise)"],
          ["Supabase Storage", "Stockage des assets générés (inclus dans Lynaris)"],
        ]}
      />

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(236,72,153,0.1)", color: "#EC4899", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Bonne pratique</H3>
      <InfoCard
        title="Coût des générations"
        desc="Chaque génération consomme des crédits Replicate facturés à l'usage. Active les quotas dans Dashboard > Agents > Max > Paramètres pour éviter les dépassements."
        color="#F59E0B"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Nova
// ---------------------------------------------------------------------------
function NovaSection() {
  const tools = [
    { name: "get_revenue_summary", desc: "Récupère le revenu Stripe sur une période donnée" },
    { name: "get_top_customers", desc: "Identifie les meilleurs clients par CA" },
    { name: "analyze_churn", desc: "Analyse le taux de désabonnement et les causes" },
    { name: "get_cash_position", desc: "Position de trésorerie via Qonto (optionnel)" },
    { name: "forecast_revenue", desc: "Projection de revenu basée sur les abonnements actifs" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#6366F1" />
        <TagBadge label="Roadmap" color="#64748B" />
      </div>
      <SectionTitle>Nova — Business & Finance</SectionTitle>
      <SectionLead>
        Nova est ton assistant stratégique : elle a accès à tes données financières (Stripe, Qonto,
        Shopify si applicable) et te livre un brief hebdomadaire sur le revenu, les abonnements,
        la trésorerie et les anomalies.
      </SectionLead>

      <H3>Intégrations</H3>
      <DocTable
        headers={["Service", "Utilisation", "Statut"]}
        rows={[
          ["Stripe", "Revenu, abonnements, churn", "Requis"],
          ["Shopify", "Ventes e-commerce", "Optionnel"],
          ["Qonto", "Trésorerie, virements", "Optionnel"],
        ]}
      />

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(99,102,241,0.1)", color: "#6366F1", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Sécurité des données</H3>
      <InfoCard
        title="Tokens chiffrés en base"
        desc="Tous les credentials Stripe, Qonto, Shopify sont chiffrés AES-256-GCM avant stockage. Nova accède aux données en lecture seule sauf pour les actions explicitement validées."
        color="#10B981"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Alba
// ---------------------------------------------------------------------------
function AlbaSection() {
  const tools = [
    { name: "screen_cv", desc: "Évalue un CV par rapport à une fiche de poste" },
    { name: "generate_contract", desc: "Génère un contrat à partir d'un template (CDI, CDD, freelance)" },
    { name: "schedule_interview", desc: "Planifie un entretien dans Google Calendar" },
    { name: "answer_employee_faq", desc: "Répond aux questions fréquentes des salariés (congés, fiches de paie)" },
    { name: "send_onboarding_kit", desc: "Envoie le kit d'arrivée à un nouveau collaborateur" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Agents" color="#8B5CF6" />
        <TagBadge label="Roadmap" color="#64748B" />
      </div>
      <SectionTitle>Alba — Ressources humaines</SectionTitle>
      <SectionLead>
        Alba automatise les tâches RH récurrentes : tri des candidatures, génération des contrats,
        organisation des entretiens, FAQ salariés et onboarding. Elle s&apos;appuie sur tes
        templates et ta charte d&apos;entreprise pour rester cohérente avec ta culture.
      </SectionLead>

      <H3>Intégrations requises</H3>
      <DocTable
        headers={["Service", "Utilisation"]}
        rows={[
          ["Gmail", "Envoi des invitations entretiens, accusés de réception candidatures"],
          ["Google Calendar", "Planification des entretiens et créneaux RH"],
          ["Google Drive", "Stockage des CV et contrats générés (optionnel)"],
        ]}
      />

      <H3>Tools disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {tools.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(139,92,246,0.1)", color: "#8B5CF6", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{t.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <H3>Conformité RGPD</H3>
      <InfoCard
        title="Données candidats"
        desc="Les données candidats sont conservées 2 ans maximum (durée légale). Alba purge automatiquement les dossiers expirés et journalise les accès aux fiches sensibles."
        color="#10B981"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Google integration
// ---------------------------------------------------------------------------
function GoogleSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Intégrations" color="#10B981" />
      </div>
      <SectionTitle>Intégration Google (Gmail + Calendar)</SectionTitle>
      <SectionLead>
        La connexion Google OAuth permet à l&apos;agent vocal de créer des rendez-vous et à Mae de lire et répondre
        aux emails. Une seule connexion suffit pour les deux agents.
      </SectionLead>

      <H3>Scopes OAuth requis</H3>
      <DocTable
        headers={["Scope", "Utilisation"]}
        rows={[
          ["calendar.events", "Création et modification de RDV (agent vocal)"],
          ["calendar.readonly", "Lecture des créneaux disponibles (agent vocal)"],
          ["gmail.send", "Envoi d'emails (Mae)"],
          ["gmail.readonly", "Lecture de la boîte de réception (Mae)"],
        ]}
      />

      <H3>Setup</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="1. Connecter le compte" desc={"Dashboard > Intégrations > Google > «Connecter avec Google». Vous serez redirigé vers la page d’autorisation Google."} color="#10B981" />
        <InfoCard title="2. Autoriser les scopes" desc="Acceptez les permissions demandées. Lynaris ne lit pas les emails — Mae agit uniquement sur les scopes explicitement autorisés." color="#22D3EE" />
        <InfoCard title="3. Vérification" desc="Une fois connecté, le statut passe à Connecté et les agents concernés sont opérationnels." color="#7C3AED" />
      </div>

      <H3>Refresh token automatique</H3>
      <Paragraph>
        Les tokens Google expirent après 1h. Lynaris renouvelle automatiquement les access tokens en
        arrière-plan via le refresh token stocké (chiffré). Aucune action manuelle requise.
      </Paragraph>

      <H3>Déconnecter</H3>
      <Paragraph>
        Dashboard &gt; Intégrations &gt; Google &gt; &quot;Gérer la connexion&quot; &gt; Déconnecter.
        Les tokens sont supprimés immédiatement de la base.
      </Paragraph>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Twilio integration
// ---------------------------------------------------------------------------
function TwilioSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Intégrations" color="#22D3EE" />
      </div>
      <SectionTitle>Intégration Twilio (Téléphonie)</SectionTitle>
      <SectionLead>
        Twilio est la couche téléphonique de l&apos;agent vocal. Un numéro Twilio dédié reçoit les appels
        entrants et les transmet à l&apos;agent vocal via WebSocket.
      </SectionLead>

      <H3>Prérequis</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="Compte Twilio" desc="Créez un compte sur twilio.com. Un compte de test suffit pour valider l'intégration." color="#22D3EE" />
        <InfoCard title="Numéro de téléphone" desc="Achetez un numéro dans la Twilio Console. Choisissez un numéro français (+33) si vos clients appellent depuis la France." color="#7C3AED" />
      </div>

      <H3>Configuration dans Lynaris</H3>
      <Paragraph>
        Dashboard &gt; Intégrations &gt; Twilio &gt; renseigner :
      </Paragraph>
      <DocTable
        headers={["Champ", "Où le trouver"]}
        rows={[
          ["Account SID", "Twilio Console > Dashboard (commence par AC...)"],
          ["Auth Token", "Twilio Console > Dashboard (sous le Account SID)"],
          ["Numéro de téléphone", "Twilio Console > Phone Numbers (format E.164 : +33...)"],
        ]}
      />

      <H3>Webhook dans Twilio Console</H3>
      <CodeBlock filename="twilio-webhook-config">
        {`Phone Numbers > votre numéro > Voice Configuration\nVoice URL (HTTP POST) → ${SITE_URL}/api/voice/incoming`}
      </CodeBlock>

      <H3>Test</H3>
      <Paragraph>
        Appelez votre numéro Twilio. L&apos;agent vocal doit décrocher après 1-2 sonneries. En cas de problème :
        Dashboard &gt; Agents &gt; Agent vocal &gt; Logs pour voir les erreurs en temps réel.
      </Paragraph>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: ElevenLabs integration
// ---------------------------------------------------------------------------
function ElevenLabsSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Intégrations" color="#F472B6" />
      </div>
      <SectionTitle>Intégration ElevenLabs (Voix IA)</SectionTitle>
      <SectionLead>
        ElevenLabs fournit la synthèse vocale réaliste de l&apos;agent vocal. Sans ElevenLabs, l&apos;agent vocal utilise
        une TTS basique (moins naturelle pour vos clients).
      </SectionLead>

      <H3>Setup</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="1. Créer un compte ElevenLabs" desc="Créez un compte sur elevenlabs.io. Le plan Creator ($22/mois) est suffisant pour un usage normal." color="#F472B6" />
        <InfoCard title="2. Copier l'API Key" desc='Profile > API Keys. Copiez votre clé.' color="#7C3AED" />
        <InfoCard title="3. Coller dans Lynaris" desc='Dashboard > Intégrations > ElevenLabs > coller la clé > Enregistrer.' color="#22D3EE" />
        <InfoCard title="4. Choisir la voix de l'agent vocal" desc="Une fois connecté, sélectionnez la voix dans Dashboard > Agents > Agent vocal > Paramètres > Voix." color="#10B981" />
      </div>

      <H3>Recommandation de voix</H3>
      <DocTable
        headers={["Voix", "Style", "Usage recommandé"]}
        rows={[
          ["Rachel", "Calme, professionnelle", "Cabinet médical, juridique"],
          ["Charlotte", "Chaleureuse, naturelle", "Généraliste, commerce"],
          ["Bella", "Énergique, dynamique", "E-commerce, startup"],
        ]}
      />

      <H3>Fallback sans ElevenLabs</H3>
      <Paragraph>
        Si ElevenLabs n&apos;est pas configuré, l&apos;agent vocal utilise la TTS native de Twilio. La qualité
        vocale est inférieure mais la fonctionnalité reste complète.
      </Paragraph>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: n8n integration
// ---------------------------------------------------------------------------
const n8nWebhookExample = `// Payload Lynaris → n8n
POST https://votre-n8n.com/webhook/lynaris
Authorization: Bearer <votre_n8n_api_key>

{
  "trigger": "agent.action.completed",
  "agentSlug": "lou",
  "action": "publish_wordpress",
  "result": { "postId": 1234, "url": "https://..." }
}`

function N8nSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Intégrations" color="#10B981" />
      </div>
      <SectionTitle>Intégration n8n (Workflows)</SectionTitle>
      <SectionLead>
        n8n connecte Lynaris à des centaines de services tiers. Les agents peuvent déclencher des
        workflows n8n, et n8n peut déclencher des runs d&apos;agents Lynaris.
      </SectionLead>

      <H3>Prérequis</H3>
      <InfoCard
        title="Instance n8n accessible"
        desc="Self-hosted (n8n.io/docs) ou n8n.cloud. L'URL doit être accessible depuis les serveurs Lynaris (pas de localhost en production)."
        color="#10B981"
      />

      <H3>Configuration dans Lynaris</H3>
      <DocTable
        headers={["Champ", "Description"]}
        rows={[
          ["URL de base", "URL racine de votre instance n8n (ex: https://n8n.mondomaine.com)"],
          ["API Key", "n8n Settings > API > Create an API key"],
        ]}
      />

      <H3>Webhook entrant (n8n → Lynaris)</H3>
      <CodeBlock filename="n8n-webhook-config">
        {`POST ${SITE_URL}/api/webhooks/n8n\nX-Lynaris-Signature: sha256=<hmac_signature>`}
      </CodeBlock>
      <Paragraph>
        Lynaris vérifie une signature HMAC SHA-256 sur chaque webhook entrant. La clé secrète est
        disponible dans Dashboard &gt; Paramètres &gt; API &gt; Webhook Secret.
      </Paragraph>

      <H3>Exemple de payload n8n → Lynaris</H3>
      <CodeBlock filename="n8n-to-lynaris.json">{n8nWebhookExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Auth API
// ---------------------------------------------------------------------------
const authCurlExample = `curl -X POST ${SITE_URL}/api/agents/marine/chat \\
  -H "Authorization: Bearer lynx_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Prendre un RDV demain"}'`

function AuthSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="API" color="#22D3EE" />
      </div>
      <SectionTitle>Authentification API</SectionTitle>
      <SectionLead>
        Toutes les requêtes API Lynaris nécessitent un header{" "}
        <code style={{ fontSize: 14, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>Authorization: Bearer &lt;api_key&gt;</code>.
      </SectionLead>

      <H3>Créer une clé API</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        <InfoCard title="1. Dashboard > Paramètres > API" desc='Cliquez sur "Créer une clé". Donnez-lui un nom descriptif (ex: "Production backend").' color="#22D3EE" />
        <InfoCard title="2. Copier immédiatement" desc="La clé est affichée une seule fois. Après fermeture du modal, seul le hash est conservé en base — la clé ne peut pas être récupérée." color="#F59E0B" />
        <InfoCard title="3. Format" desc={"Les clés Lynaris commencent par \"lynx_\". Gardez-les dans vos variables d'environnement, jamais en clair dans le code."} color="#10B981" />
      </div>

      <H3>Rate limits</H3>
      <DocTable
        headers={["Plan", "Limite"]}
        rows={[
          ["Essentiel", "20 requêtes / minute par clé"],
          ["Pro", "100 requêtes / minute par clé"],
          ["Enterprise", "Sur demande"],
        ]}
      />

      <H3>Exemple</H3>
      <CodeBlock filename="auth-example.sh">{authCurlExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Chat endpoint
// ---------------------------------------------------------------------------
const chatStreamExample = `// POST /api/agents/{slug}/chat
// Body
{
  "message": "Je voudrais prendre un RDV",
  "messages": [                          // optionnel — historique
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "config": { "timezone": "Europe/Paris" } // optionnel
}

// Réponse : text/event-stream
data: {"content": "Bien sûr, "}
data: {"content": "regardons les disponibilités..."}
data: [DONE]`

const chatJsExample = `const response = await fetch('/api/agents/marine/chat', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer lynx_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'RDV demain 14h' }),
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  const lines = chunk.split('\\n').filter(l => l.startsWith('data: '))
  for (const line of lines) {
    const data = line.slice(6)
    if (data === '[DONE]') break
    const { content } = JSON.parse(data)
    process.stdout.write(content)
  }
}`

function ChatSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="API" color="#22D3EE" />
      </div>
      <SectionTitle>Endpoint Chat — Streaming SSE</SectionTitle>
      <SectionLead>
        <code style={{ fontSize: 14, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>POST /api/agents/{"{slug}"}/chat</code>
        {" "}— conversation persistante avec réponse en streaming.
      </SectionLead>

      <H3>Format de la requête</H3>
      <CodeBlock filename="chat-request.json">{chatStreamExample}</CodeBlock>

      <H3>Lecture du stream en JavaScript</H3>
      <CodeBlock filename="chat-stream.ts">{chatJsExample}</CodeBlock>

      <H3>Notes</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        <InfoCard title="sessionId" desc="Passez un sessionId stable pour conserver l'historique entre plusieurs requêtes. Sans sessionId, chaque requête est indépendante." color="#22D3EE" />
        <InfoCard title="messages" desc="Si vous gérez l'historique côté client, passez le tableau messages complet. Lynaris ne le persiste pas automatiquement." color="#7C3AED" />
        <InfoCard title="config" desc="L'objet config est passé à l'agent comme contexte supplémentaire (timezone, langue, préférences)." color="#10B981" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Run endpoint
// ---------------------------------------------------------------------------
const runRequestExample = `// POST /api/agents/{slug}/run
// Body
{
  "message": "Rédige un article de 600 mots sur l'automatisation PME",
  "config": { "tone": "professionnel", "lang": "fr" }  // optionnel
}

// Réponse (JSON, après traitement complet)
{
  "content": "L'automatisation des PME...",
  "toolCallsCount": 3,
  "inputTokens": 512,
  "outputTokens": 1024
}`

function RunSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="API" color="#22D3EE" />
      </div>
      <SectionTitle>Endpoint Run — Exécution one-shot</SectionTitle>
      <SectionLead>
        <code style={{ fontSize: 14, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>POST /api/agents/{"{slug}"}/run</code>
        {" "}— exécution sans streaming, retourne la réponse complète.
      </SectionLead>

      <H3>Différence avec /chat</H3>
      <DocTable
        headers={["", "/chat", "/run"]}
        rows={[
          ["Streaming", "Oui (SSE)", "Non (JSON)"],
          ["Session persistante", "Optionnel", "Non"],
          ["Timeout", "120s", "60s"],
          ["Cas d'usage", "Chat interactif", "Tâche batch, génération de contenu"],
        ]}
      />

      <H3>Format</H3>
      <CodeBlock filename="run-request.json">{runRequestExample}</CodeBlock>

      <H3>Cas d&apos;usage typiques</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        <InfoCard title="Génération de contenu (Lou)" desc="Générer un article, un post LinkedIn, ou un plan de contenu sans interface de chat." color="#F472B6" />
        <InfoCard title="Analyse d'email (Mae)" desc="Envoyer un email brut à Mae pour catégorisation et proposition de réponse." color="#F59E0B" />
        <InfoCard title="Rapport business (Nova)" desc="Déclencher la génération d'un rapport financier depuis un cron job." color="#6366F1" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Logs endpoint
// ---------------------------------------------------------------------------
const logsResponseExample = `// GET /api/agents/marine/logs?limit=20&offset=0&status=success

{
  "logs": [
    {
      "id": "log_abc123",
      "type": "chat",
      "status": "success",
      "createdAt": "2026-04-24T08:12:00Z",
      "inputTokens": 256,
      "outputTokens": 512,
      "toolCallsCount": 2,
      "durationMs": 1842
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}`

function LogsSection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="API" color="#22D3EE" />
      </div>
      <SectionTitle>Endpoint Logs</SectionTitle>
      <SectionLead>
        <code style={{ fontSize: 14, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>GET /api/agents/{"{slug}"}/logs</code>
        {" "}— historique des exécutions d&apos;un agent.
      </SectionLead>

      <H3>Paramètres de requête</H3>
      <DocTable
        headers={["Paramètre", "Type", "Description"]}
        rows={[
          ["limit", "integer", "Nombre de résultats (défaut : 20, max : 100)"],
          ["offset", "integer", "Décalage pour la pagination"],
          ["status", "string", 'Filtre : "success" ou "error"'],
          ["type", "string", 'Filtre : "chat" ou "run"'],
        ]}
      />

      <H3>Réponse</H3>
      <CodeBlock filename="logs-response.json">{logsResponseExample}</CodeBlock>

      <H3>Rétention</H3>
      <InfoCard
        title="30 jours"
        desc="Les logs sont conservés 30 jours glissants. Pour un archivage long-terme, configurez un webhook sur l'événement agent.action.completed."
        color="#64748B"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Webhook Events
// ---------------------------------------------------------------------------
const webhookPayloadExample = `// Exemple de payload reçu sur votre endpoint
{
  "event": "appointment.booked",
  "agentSlug": "marine",
  "timestamp": "2026-04-24T09:32:00Z",
  "data": {
    "patientName": "Jean Dupont",
    "appointmentDate": "2026-04-25T14:00:00Z",
    "service": "kinésithérapie",
    "calendarEventId": "evt_xyz"
  }
}`

function EventsSection() {
  const events = [
    { name: "agent.action.completed", desc: "Un tool a été appelé avec succès" },
    { name: "agent.call.ended", desc: "Un appel téléphonique de l'agent vocal s'est terminé" },
    { name: "agent.error", desc: "Une erreur s'est produite pendant un run" },
    { name: "prospect.qualified", desc: "Elio a qualifié un prospect" },
    { name: "appointment.booked", desc: "L'agent vocal a créé un rendez-vous" },
    { name: "webhook.delivery.failed", desc: "Après 5 échecs, la livraison est abandonnée" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Webhooks" color="#6366F1" />
      </div>
      <SectionTitle>Événements webhook</SectionTitle>
      <SectionLead>
        Lynaris envoie des webhooks vers votre endpoint à chaque événement significatif. Configurez
        votre URL dans Dashboard &gt; Paramètres &gt; API &gt; Webhook.
      </SectionLead>

      <H3>Événements disponibles</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {events.map((e) => (
          <div key={e.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <code style={{ fontSize: 12, background: "rgba(99,102,241,0.1)", color: "#6366F1", padding: "3px 8px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{e.name}</code>
            <span style={{ fontSize: 14, color: "#A1A1AA" }}>{e.desc}</span>
          </div>
        ))}
      </div>

      <H3>Format du payload</H3>
      <CodeBlock filename="webhook-payload.json">{webhookPayloadExample}</CodeBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Webhook Security
// ---------------------------------------------------------------------------
const webhookVerifyExample = `import crypto from 'crypto'

function verifyLynarisWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// Usage dans votre route handler
app.post('/webhooks/lynaris', (req, res) => {
  const sig = req.headers['x-lynaris-signature'] as string
  const raw = req.rawBody  // payload JSON brut (non parsé)
  const secret = process.env.LYNARIS_WEBHOOK_SECRET

  if (!verifyLynarisWebhook(raw, sig, secret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  // Traiter l'événement...
  res.json({ received: true })
})`

function SecuritySection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Webhooks" color="#6366F1" />
      </div>
      <SectionTitle>Sécurité des webhooks</SectionTitle>
      <SectionLead>
        Chaque webhook Lynaris est signé avec HMAC-SHA256. Vérifiez la signature avant de traiter
        le payload pour vous assurer qu&apos;il vient bien de Lynaris.
      </SectionLead>

      <H3>Header de signature</H3>
      <CodeBlock filename="webhook-header">
        {"X-Lynaris-Signature: sha256=<hex_hash>"}
      </CodeBlock>

      <H3>Récupérer le webhook secret</H3>
      <Paragraph>
        Dashboard &gt; Paramètres &gt; API &gt; section Webhook &gt; &quot;Webhook Secret&quot;.
        Stockez-le dans une variable d&apos;environnement, jamais en clair.
      </Paragraph>

      <H3>Vérification en Node.js</H3>
      <CodeBlock filename="verify-webhook.ts">{webhookVerifyExample}</CodeBlock>

      <H3>Important</H3>
      <InfoCard
        title="Utiliser le payload brut"
        desc="La vérification doit se faire sur le body JSON brut (avant JSON.parse). Un parsing préalable peut modifier l'ordre des clés et invalider la signature."
        color="#F59E0B"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Webhook Retry
// ---------------------------------------------------------------------------
function RetrySection() {
  const retries = [
    { attempt: 1, delay: "1 minute" },
    { attempt: 2, delay: "5 minutes" },
    { attempt: 3, delay: "15 minutes" },
    { attempt: 4, delay: "1 heure" },
    { attempt: 5, delay: "4 heures" },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <SectionBadge label="Webhooks" color="#6366F1" />
      </div>
      <SectionTitle>Politique de retry</SectionTitle>
      <SectionLead>
        Si votre endpoint ne retourne pas un code 2xx, Lynaris retente la livraison selon un
        backoff exponentiel.
      </SectionLead>

      <H3>Stratégie de retry</H3>
      <DocTable
        headers={["Tentative", "Délai après échec"]}
        rows={retries.map((r) => [
          `Tentative ${r.attempt}`,
          r.delay,
        ])}
      />

      <H3>Après 5 échecs</H3>
      <InfoCard
        title="webhook.delivery.failed"
        desc="L'événement est marqué comme échoué et un événement webhook.delivery.failed est loggué dans Dashboard > Paramètres > API > Logs de livraison."
        color="#F59E0B"
      />

      <H3>Bonnes pratiques</H3>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        <InfoCard title="Répondre vite, traiter en arrière-plan" desc="Retournez 200 immédiatement et traitez le payload en arrière-plan (queue, job). Votre handler ne doit pas dépasser 5s de latence." color="#22D3EE" />
        <InfoCard title="Idempotence" desc="En cas de retry, le même événement peut être livré plusieurs fois. Utilisez le champ id de l'événement pour dédoublonner." color="#7C3AED" />
        <InfoCard title="Surveillance" desc="Configurez une alerte sur l'événement webhook.delivery.failed pour être notifié rapidement en cas de problème." color="#10B981" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DOC_CONTENT map
// ---------------------------------------------------------------------------
function buildDocContent(onNavigate: (id: string) => void): Record<string, React.ReactNode> {
  return {
    introduction: <IntroductionSection onNavigate={onNavigate} />,
    quickstart: <QuickstartSection onNavigate={onNavigate} />,
    concepts: <ConceptsSection />,
    marine: <MarineSection />,
    charles: <CharlesSection />,
    lou: <LouSection />,
    elio: <ElioSection />,
    mae: <MaeSection />,
    max: <MaxSection />,
    nova: <NovaSection />,
    alba: <AlbaSection />,
    google: <GoogleSection />,
    twilio: <TwilioSection />,
    elevenlabs: <ElevenLabsSection />,
    n8n: <N8nSection />,
    auth: <AuthSection />,
    chat: <ChatSection />,
    run: <RunSection />,
    logs: <LogsSection />,
    events: <EventsSection />,
    security: <SecuritySection />,
    retry: <RetrySection />,
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function DocsClient() {
  const [activeItem, setActiveItem] = useState("quickstart")

  const DOC_CONTENT = buildDocContent(setActiveItem)

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>
      {/* Page header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "32px 24px",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(124,58,237,0.15)",
              color: "#7C3AED",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 12,
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            Documentation
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 800,
              color: "#F5F5F7",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Lynaris Docs
          </h1>
        </div>
      </div>

      {/* Layout */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: 0,
          minHeight: "calc(100vh - 160px)",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "32px 0 32px 0",
            position: "sticky" as const,
            top: 80,
            alignSelf: "flex-start" as const,
          }}
        >
          {sections.map((section) => (
            <div key={section.id} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(245,245,247,0.35)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  marginBottom: 8,
                  paddingRight: 16,
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left" as const,
                    background:
                      activeItem === item.id ? "rgba(124,58,237,0.15)" : "transparent",
                    color: activeItem === item.id ? "#7C3AED" : "#A1A1AA",
                    border: "none",
                    borderRight:
                      activeItem === item.id
                        ? "2px solid #7C3AED"
                        : "2px solid transparent",
                    padding: "7px 16px 7px 12px",
                    fontSize: 14,
                    fontWeight: activeItem === item.id ? 600 : 400,
                    cursor: "pointer",
                    borderRadius: "6px 0 0 6px",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "40px 0 80px 48px", maxWidth: 720 }}>
          {DOC_CONTENT[activeItem] ?? DOC_CONTENT["introduction"]}
        </main>
      </div>
    </div>
  )
}
