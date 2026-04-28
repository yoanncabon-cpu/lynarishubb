"use client"

import { useState, useRef, useEffect, useCallback, useReducer } from "react"
import {
  Send,
  StopCircle,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Share2,
  Lock,
  Users,
  Globe,
  X,
  Mic,
  AlertTriangle,
  Settings2,
  CheckCircle,
  ClipboardCopy,
} from "lucide-react"
import Link from "next/link"
import type { Agent } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string
  file: File
  name: string
  type: "image" | "video" | "document"
  previewUrl?: string
  size: string
}

interface ToolCall {
  name: string
  input?: Record<string, unknown>
  result?: string
  done: boolean
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  isError?: boolean
  toolCalls?: ToolCall[]
}

type Action =
  | { type: "ADD"; message: Message }
  | { type: "APPEND_CHUNK"; id: string; chunk: string }
  | { type: "SET_STREAMING"; id: string; isStreaming: boolean }
  | { type: "SET_ERROR"; id: string; error: string }
  | { type: "RESET"; greeting: Message }
  | { type: "ADD_TOOL_CALL"; id: string; tool: { name: string; input?: Record<string, unknown> } }
  | { type: "COMPLETE_TOOL_CALL"; id: string; toolName: string; result: string }

// ─── Reducer ─────────────────────────────────────────────────────────────────

function messagesReducer(state: Message[], action: Action): Message[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.message]
    case "APPEND_CHUNK":
      return state.map((m) =>
        m.id === action.id ? { ...m, content: m.content + action.chunk } : m
      )
    case "SET_STREAMING":
      return state.map((m) =>
        m.id === action.id ? { ...m, isStreaming: action.isStreaming } : m
      )
    case "SET_ERROR":
      return state.map((m) =>
        m.id === action.id
          ? { ...m, content: action.error, isError: true, isStreaming: false }
          : m
      )
    case "RESET":
      return [action.greeting]
    case "ADD_TOOL_CALL":
      return state.map((m) => {
        if (m.id !== action.id) return m
        const existing = m.toolCalls ?? []
        return {
          ...m,
          toolCalls: [...existing, { name: action.tool.name, input: action.tool.input, done: false }],
        }
      })
    case "COMPLETE_TOOL_CALL":
      return state.map((m) => {
        if (m.id !== action.id) return m
        const updated = (m.toolCalls ?? []).map((tc) =>
          tc.name === action.toolName && !tc.done
            ? { ...tc, result: action.result, done: true }
            : tc
        )
        return { ...m, toolCalls: updated }
      })
    default:
      return state
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGreeting(agent: Agent): Message {
  return {
    id: "initial-greeting",
    role: "assistant",
    content: `Bonjour ! Je suis ${agent.name}. ${agent.tagline}`,
    timestamp: new Date(),
  }
}

// ─── Quick suggestions per agent ─────────────────────────────────────────────

const AGENT_SUGGESTIONS: Record<string, string[]> = {
  marine: [
    "Prends les appels de mon cabinet",
    "Configure mes horaires d'ouverture",
    "Envoie un SMS de test",
  ],
  charles: [
    "Fais-moi un brief de la journée",
    "Délègue cette tâche à Lou",
    "Quelle est mon activité cette semaine ?",
  ],
  lou: [
    "Écris un article sur [sujet]",
    "Analyse le SEO de mon site",
    "Publie sur LinkedIn",
  ],
  elio: [
    "Importe mes prospects depuis CSV",
    "Lance une campagne de prospection",
    "Quelle est mon pipeline ?",
  ],
  mae: [
    "Trie ma boîte mail",
    "Rédige une réponse pour [expéditeur]",
    "Quels emails sont urgents ?",
  ],
  max: [
    "Génère une image de [description]",
    "Édite cette photo",
    "Crée une bannière LinkedIn",
  ],
  nova: [
    "Analyse mes revenus du mois",
    "Génère un rapport financier",
    "Quelle est ma MRR cette semaine ?",
  ],
  alba: [
    "Trie les CVs reçus",
    "Rédige un contrat de travail",
    "Réponds à la FAQ salarié",
  ],
  orion: [
    "Crée un workflow n8n pour [tâche]",
    "Automatise l'envoi de mes rapports",
    "Connecte Gmail à Notion",
  ],
}

// ─── Error sanitizer — traduit les erreurs techniques en messages lisibles ────

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("authentication_error") || lower.includes("invalid x-api-key") || lower.includes("invalid api key") || lower.includes("401"))
    return "Problème de configuration API. Contactez le support Lynaris."
  if (lower.includes("rate_limit") || lower.includes("rate limit") || lower.includes("429") || lower.includes("too many"))
    return "Trop de messages envoyés. Attends quelques secondes et réessaie."
  if (lower.includes("overloaded") || lower.includes("529") || lower.includes("503"))
    return "Le service IA est momentanément surchargé. Réessaie dans un instant."
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "La réponse a pris trop de temps. Réessaie."
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch"))
    return "Problème de connexion réseau. Vérifie ta connexion et réessaie."
  if (lower.includes("context_length") || lower.includes("too long") || lower.includes("max_tokens"))
    return "La conversation est trop longue. Commence une nouvelle conversation."
  if (lower.includes("not found") || lower.includes("404"))
    return "Service indisponible. Attends 3 secondes et réessaie."
  if (lower.includes("erreur http 5") || lower.includes("500") || lower.includes("502"))
    return "Erreur serveur temporaire. Réessaie dans quelques instants."
  if (lower.includes("400") || lower.includes("bad request"))
    return "Requête invalide. Réessaie."
  // Fallback générique — pas de JSON brut exposé
  return "Une erreur est survenue. Réessaie ou contacte le support si ça persiste."
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(245,245,247,0.4)",
            display: "inline-block",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "maintenant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Working steps panel ─────────────────────────────────────────────────────

const WORKING_STEPS = [
  "Lecture du contexte",
  "Analyse de ta demande",
  "Génération de la réponse",
  "Finalisation",
]

function WorkingPanel({ isStreaming }: { isStreaming: boolean }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isStreaming) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 85))
    }, 100)

    const t1 = setTimeout(() => setCurrentStep(1), 500)
    const t2 = setTimeout(() => setCurrentStep(2), 1200)

    return () => {
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isStreaming])

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        margin: "0 16px 12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
        }}
      >
        <Loader2
          size={14}
          color="#E86F4D"
          style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>
          Agent travaille...
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.1)",
          marginBottom: 10,
        }}
      />

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {WORKING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                fontSize: 12,
                color: isCompleted ? "#34D399" : isCurrent ? "#E86F4D" : "rgba(245,245,247,0.3)",
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {isCompleted && (
                <CheckCircle2
                  size={12}
                  color="#34D399"
                  style={{ flexShrink: 0 }}
                />
              )}
              {isCurrent && (
                <Loader2
                  size={12}
                  color="#E86F4D"
                  style={{
                    animation: "spin 1s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}
              {isPending && (
                <Circle size={12} color="rgba(255,255,255,0.14)" style={{ flexShrink: 0 }} />
              )}
              {step}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 999,
          marginTop: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "#E86F4D",
            borderRadius: 999,
            width: `${progress}%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copier le message"
      title="Copier (Ctrl+C)"
      style={{
        opacity: 0.45,
        transition: "opacity 0.15s, background 0.15s",
        padding: "3px 7px",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        color: "rgba(245,245,247,0.5)",
        fontSize: 11,
      }}
      className="copy-btn"
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.45"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)" }}
    >
      {copied ? (
        <><Check size={11} color="#34D399" /><span style={{ color: "#34D399" }}>Copié</span></>
      ) : (
        <><Copy size={11} /><span>Copier</span></>
      )}
    </button>
  )
}

// ─── Share conversation modal ─────────────────────────────────────────────────

type PrivacyOption = "private" | "members" | "workspace"

const PRIVACY_OPTIONS: {
  id: PrivacyOption
  icon: React.ReactNode
  label: string
  description: string
}[] = [
  {
    id: "private",
    icon: <Lock size={14} />,
    label: "Privée",
    description: "Accessible uniquement par vous",
  },
  {
    id: "members",
    icon: <Users size={14} />,
    label: "Partagée avec des membres spécifiques",
    description: "Accessible uniquement par les membres sélectionnés",
  },
  {
    id: "workspace",
    icon: <Globe size={14} />,
    label: "Partagée avec l'espace de travail",
    description: "Accessible à tous les membres (lecture seule)",
  },
]

function ShareConversationModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [selected, setSelected] = useState<PrivacyOption>("private")

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "rgba(18,18,22,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          maxWidth: 480,
          width: "100%",
          padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#F5F5F7",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Partager la conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(245,245,247,0.4)",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.8)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.4)"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "rgba(245,245,247,0.5)",
            margin: "0 0 22px",
            lineHeight: 1.5,
          }}
        >
          Définissez qui peut accéder à cette conversation au sein de votre espace de travail.
        </p>

        {/* Privacy label */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(245,245,247,0.4)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Confidentialité
        </p>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {PRIVACY_OPTIONS.map((opt) => {
            const isActive = selected === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: isActive
                    ? "1px solid rgba(124,58,237,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isActive
                    ? "rgba(124,58,237,0.1)"
                    : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  outline: "none",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.18)"
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.05)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.1)"
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.03)"
                  }
                }}
              >
                {/* Radio circle */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: isActive ? "2px solid #7C3AED" : "2px solid rgba(255,255,255,0.2)",
                    background: isActive ? "#7C3AED" : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "white",
                      }}
                    />
                  )}
                </div>

                {/* Icon */}
                <span
                  style={{
                    color: isActive ? "#A78BFA" : "rgba(245,245,247,0.4)",
                    flexShrink: 0,
                    display: "flex",
                    transition: "color 0.15s",
                  }}
                >
                  {opt.icon}
                </span>

                {/* Text */}
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#F5F5F7" : "rgba(245,245,247,0.65)",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(245,245,247,0.35)",
                      margin: "2px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(245,245,247,0.6)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              outline: "none",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.9)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.6)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#7C3AED",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
              outline: "none",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "#6D28D9"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "#7C3AED"
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Marine status banner ─────────────────────────────────────────────────────

interface MarineStatus {
  active_calls: number
  calls_today: number
  avg_duration_seconds: number
  last_call_at: string | null
  twilio_configured: boolean
  appointments_booked_today: number
}

function MarineStatusBanner() {
  const [status, setStatus] = useState<MarineStatus | null>(null)

  useEffect(() => {
    fetch("/api/voice/status-live")
      .then((r) => r.json() as Promise<MarineStatus>)
      .then(setStatus)
      .catch(() => null)
  }, [])

  if (!status) return null

  if (!status.twilio_configured) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: "rgba(245,158,11,0.08)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={13} color="#FBBF24" />
        <span style={{ fontSize: 12, color: "#FBBF24", flex: 1 }}>
          Twilio non configuré — activez les appels dans les{" "}
        </span>
        <Link
          href="/dashboard/integrations"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#FBBF24",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            flexShrink: 0,
          }}
        >
          intégrations
        </Link>
      </div>
    )
  }

  const avgMin = Math.floor(status.avg_duration_seconds / 60)
  const avgSec = status.avg_duration_seconds % 60

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "7px 16px",
        background: "rgba(34,211,238,0.05)",
        borderBottom: "1px solid rgba(34,211,238,0.15)",
        flexShrink: 0,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22D3EE",
            boxShadow: "0 0 5px #22D3EE80",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <Mic size={12} color="#22D3EE" />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#22D3EE" }}>
          Marine active
        </span>
      </div>

      <div
        style={{
          width: 1,
          height: 14,
          background: "rgba(34,211,238,0.25)",
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.55)" }}>
        <span style={{ fontWeight: 600, color: "#F5F5F7" }}>{status.calls_today}</span> appels auj.
      </span>

      <div
        style={{
          width: 1,
          height: 14,
          background: "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.55)" }}>
        <span style={{ fontWeight: 600, color: "#F5F5F7" }}>{status.appointments_booked_today}</span> RDV
      </span>

      <div
        style={{
          width: 1,
          height: 14,
          background: "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />

      <span style={{ fontSize: 11, color: "rgba(245,245,247,0.55)" }}>
        Moy.{" "}
        <span style={{ fontWeight: 600, color: "#F5F5F7" }}>
          {avgMin}m{avgSec.toString().padStart(2, "0")}s
        </span>
      </span>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 999,
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.25)",
          color: "#34D399",
          fontWeight: 600,
        }}
      >
        En ligne
      </span>
    </div>
  )
}

// ─── Tool call card ───────────────────────────────────────────────────────────

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (toolCall.done) {
      setProgress(100)
      return
    }
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 3, 85))
    }, 80)
    return () => clearInterval(interval)
  }, [toolCall.done])

  const toolLabel = toolCall.name.replace(/_/g, " ")

  return (
    <div
      style={{
        margin: "4px 0",
        padding: "10px 14px",
        borderRadius: 10,
        background: toolCall.done
          ? "rgba(16,185,129,0.06)"
          : "rgba(124,58,237,0.06)",
        border: `1px solid ${toolCall.done ? "rgba(16,185,129,0.18)" : "rgba(124,58,237,0.18)"}`,
        fontSize: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: toolCall.done && toolCall.result ? 6 : 0 }}>
        {toolCall.done ? (
          <CheckCircle size={12} color="#34D399" style={{ flexShrink: 0 }} />
        ) : (
          <Settings2
            size={12}
            color="#A78BFA"
            style={{ animation: "spin 2s linear infinite", flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontWeight: 600,
            color: toolCall.done ? "#34D399" : "#A78BFA",
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: 11,
          }}
        >
          {toolCall.name}
        </span>
        {!toolCall.done && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(245,245,247,0.4)",
              fontStyle: "italic",
            }}
          >
            Exécution de {toolLabel}...
          </span>
        )}
      </div>

      {/* Progress bar (only while running) */}
      {!toolCall.done && (
        <div
          style={{
            height: 2,
            background: "rgba(124,58,237,0.15)",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#7C3AED",
              borderRadius: 999,
              width: `${progress}%`,
              transition: "width 0.08s linear",
            }}
          />
        </div>
      )}

      {/* Result */}
      {toolCall.done && toolCall.result && (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "rgba(245,245,247,0.55)",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {(() => {
            try {
              const parsed = JSON.parse(toolCall.result) as unknown
              if (typeof parsed === "object" && parsed !== null) {
                return JSON.stringify(parsed, null, 0).slice(0, 120)
              }
            } catch {
              // not JSON
            }
            return String(toolCall.result).slice(0, 120)
          })()}
        </p>
      )}
    </div>
  )
}

// ─── DB persistence helpers (fire-and-forget) ────────────────────────────────

function persistMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): void {
  void fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  }).catch(() => {/* ignore */})
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentChatTab({ agent }: { agent: Agent }) {
  const [messages, dispatch] = useReducer(messagesReducer, undefined, () => [
    makeGreeting(agent),
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [agentConfig, setAgentConfig] = useState<Record<string, unknown>>({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showTyping, setShowTyping] = useState(false)
  const [convCopied, setConvCopied] = useState(false)
  // Active conversation ID in Supabase (null = not yet created / API unavailable)
  const conversationIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Ref stable vers handleSend pour pouvoir l'appeler depuis des useEffect qui tournent avant sa déclaration
  const handleSendRef = useRef<(() => Promise<void>) | null>(null)

  // Load or create a Supabase conversation for persistence (fire-and-forget)
  useEffect(() => {
    void (async () => {
      try {
        // Try to find an existing conversation for this agent
        const res = await fetch(`/api/conversations?agent_slug=${agent.slug}`)
        if (!res.ok) return
        const json = await res.json() as { conversations: Array<{ id: string }> }
        if (json.conversations && json.conversations.length > 0) {
          conversationIdRef.current = json.conversations[0]!.id
        } else {
          // Create a new one
          const createRes = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent_slug: agent.slug }),
          })
          if (!createRes.ok) return
          const created = await createRes.json() as { conversation?: { id: string } }
          if (created.conversation) {
            conversationIdRef.current = created.conversation.id
          }
        }
      } catch {
        // API unavailable — chat still works normally
      }
    })()
  }, [agent.slug])

  // Load agent config to pass with chat requests
  useEffect(() => {
    fetch(`/api/agents/${agent.slug}/settings`)
      .then(r => r.json() as Promise<{ settings: Record<string, unknown> }>)
      .then(data => setAgentConfig(data.settings ?? {}))
      .catch(() => {
        try {
          const raw = localStorage.getItem(`agent-settings-${agent.slug}`)
          if (raw) setAgentConfig(JSON.parse(raw) as Record<string, unknown>)
        } catch { /* ignore */ }
      })
  }, [agent.slug])

  // Prefill input depuis onboarding ou skills wizard
  useEffect(() => {
    const prefillKey = agent.slug === "charles" ? "prefill_charles" : `agent_prefill_${agent.slug}`
    const prefill = localStorage.getItem(prefillKey)
    const autosubmit = agent.slug === "charles" && localStorage.getItem("autosubmit_charles") === "true"
    if (prefill) {
      setInput(prefill)
      localStorage.removeItem(prefillKey)
      if (autosubmit) {
        localStorage.removeItem("autosubmit_charles")
        // handleSendRef sera populé après que handleSend soit déclaré
        setTimeout(() => { void handleSendRef.current?.() }, 500)
      } else {
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }
  }, [agent.slug])

  // Typing indicator: show for 2s when streaming starts, hide once text arrives
  useEffect(() => {
    if (!streaming) {
      setShowTyping(false)
      return undefined
    }
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === "assistant" && lastMsg?.content === "") {
      setShowTyping(true)
      const timer = setTimeout(() => setShowTyping(false), 2000)
      return () => clearTimeout(timer)
    }
    setShowTyping(false)
    return undefined
  }, [streaming, messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    const t = setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      30
    )
    return () => clearTimeout(t)
  }, [messages])

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getAttachmentType(file: File): "image" | "video" | "document" {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    return "document"
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const MAX = 5
    const remaining = MAX - attachments.length
    const toAdd = files.slice(0, remaining)

    const newAttachments: Attachment[] = toAdd.map((file) => {
      const att: Attachment = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: getAttachmentType(file),
        size: formatSize(file.size),
      }
      if (att.type === "image") {
        att.previewUrl = URL.createObjectURL(file)
      }
      return att
    })
    setAttachments((prev) => [...prev, ...newAttachments])
    if (e.target) e.target.value = ""
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if ((!content && attachments.length === 0) || streaming) return

    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Accumulate assistant response for persistence
    let assistantAccumulated = ""

    // Convert images to base64
    type ImageContent = {
      type: "image"
      source: { type: "base64"; media_type: string; data: string }
    }
    const imageContents: ImageContent[] = []

    for (const att of attachments) {
      if (att.type === "image") {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(",")[1] ?? "")
          }
          reader.readAsDataURL(att.file)
        })
        imageContents.push({
          type: "image",
          source: {
            type: "base64",
            media_type: att.file.type,
            data: base64,
          },
        })
      }
    }

    const nonImageNames = attachments
      .filter((a) => a.type !== "image")
      .map((a) => `\n[Fichier joint: ${a.name}]`)
      .join("")

    const userContent =
      imageContents.length > 0
        ? [
            ...imageContents,
            { type: "text" as const, text: content + nonImageNames },
          ]
        : content + nonImageNames

    const displayContent =
      content +
      (attachments.length > 0
        ? `\n📎 ${attachments.map((a) => a.name).join(", ")}`
        : "")

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    }
    dispatch({ type: "ADD", message: userMsg })
    setAttachments([])

    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }
    dispatch({ type: "ADD", message: assistantMsg })
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    const historyMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      // Lecture du carnet d'adresses utilisateur (page /dashboard/contacts)
      // pour que l'agent récupère directement les infos d'un contact connu
      // au lieu de demander email/téléphone à chaque fois
      let userContacts: unknown[] = []
      try {
        const raw = localStorage.getItem("lynaris_contacts_v1")
        if (raw) userContacts = JSON.parse(raw) as unknown[]
      } catch { /* LS indisponible — l'agent demandera comme avant */ }

      const requestBody = JSON.stringify({
        messages: [...historyMessages, { role: "user", content: userContent }],
        config: { ...agentConfig, contacts: userContacts },
      })

      // Auto-retry on 404/503 (transient hot-reload issues in dev)
      let response: Response | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1500))
        try {
          response = await fetch(`/api/agents/${agent.slug}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody,
            signal: controller.signal,
          })
          if (response.status !== 404 && response.status !== 503) break
        } catch (fetchErr) {
          if (attempt === 2) throw fetchErr
        }
      }

      if (!response || !response.ok || !response.body) {
        throw new Error(`Erreur HTTP ${response?.status ?? 0}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6)
          if (raw === "[DONE]") {
            dispatch({ type: "SET_STREAMING", id: assistantId, isStreaming: false })
            setStreaming(false)
            return
          }
          try {
            const parsed = JSON.parse(raw) as {
              content?: string
              error?: string
              type?: string
              name?: string
              input?: Record<string, unknown>
            }
            if (parsed.error) {
              dispatch({
                type: "SET_ERROR",
                id: assistantId,
                error: friendlyError(String(parsed.error)),
              })
              setStreaming(false)
              return
            }
            // Tool use events
            if (parsed.type === "tool_use") {
              dispatch({
                type: "ADD_TOOL_CALL",
                id: assistantId,
                tool: { name: parsed.name ?? "tool", input: parsed.input },
              })
            } else if (parsed.type === "tool_result") {
              dispatch({
                type: "COMPLETE_TOOL_CALL",
                id: assistantId,
                toolName: parsed.name ?? "tool",
                result: String(parsed.content ?? ""),
              })
            } else if (parsed.content) {
              assistantAccumulated += parsed.content
              dispatch({ type: "APPEND_CHUNK", id: assistantId, chunk: parsed.content })
            }
          } catch {
            // incomplete JSON chunk — skip
          }
        }
      }

      dispatch({ type: "SET_STREAMING", id: assistantId, isStreaming: false })
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        dispatch({ type: "SET_STREAMING", id: assistantId, isStreaming: false })
      } else {
        const msg = err instanceof Error ? err.message : "Erreur inconnue"
        dispatch({
          type: "SET_ERROR",
          id: assistantId,
          error: friendlyError(msg),
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      // Persist exchange fire-and-forget (non-blocking)
      if (conversationIdRef.current && assistantAccumulated) {
        const convId = conversationIdRef.current
        persistMessage(convId, "user", displayContent)
        persistMessage(convId, "assistant", assistantAccumulated)
      }
    }
  }, [input, streaming, messages, attachments, agent.slug, agentConfig])

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleReset() {
    abortRef.current?.abort()
    setStreaming(false)
    setInput("")
    dispatch({ type: "RESET", greeting: makeGreeting(agent) })
  }

  async function handleCopyConversation() {
    const md = messages
      .map((m) => `**${m.role === "user" ? "Vous" : agent.name}** (${formatTime(m.timestamp)})\n\n${m.content}`)
      .join("\n\n---\n\n")
    await navigator.clipboard.writeText(md)
    setConvCopied(true)
    setTimeout(() => setConvCopied(false), 2000)
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
    if (e.key === "Escape") {
      setInput("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }
  }

  // Detect working panel: streaming and last assistant message is empty
  const lastMsg = messages[messages.length - 1]
  const showWorkingPanel =
    streaming && lastMsg?.role === "assistant" && lastMsg?.content === ""

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: "transparent",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        {/* Agent mini-identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgentAvatar slug={agent.slug} size={30} />
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#F5F5F7",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {agent.name}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 3,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34D399",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 11, color: "#34D399", fontWeight: 500 }}>
                En ligne
              </span>
            </div>
          </div>
        </div>

        {/* Header action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Copy conversation button */}
          <button
            type="button"
            onClick={() => void handleCopyConversation()}
            aria-label="Copier la conversation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: convCopied ? "#34D399" : "rgba(245,245,247,0.45)",
              background: "transparent",
              border: `1px solid ${convCopied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!convCopied) {
                ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.75)"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)"
              }
            }}
            onMouseLeave={(e) => {
              if (!convCopied) {
                ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.45)"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"
              }
            }}
          >
            {convCopied ? (
              <Check size={11} aria-hidden />
            ) : (
              <ClipboardCopy size={11} aria-hidden />
            )}
            {convCopied ? "Copié !" : "Copier la conv."}
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            aria-label="Partager la conversation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "rgba(245,245,247,0.45)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.75)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.45)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"
            }}
          >
            <Share2 size={11} aria-hidden />
            Partager
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            aria-label="Nouvelle conversation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "rgba(245,245,247,0.45)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.75)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.45)"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"
            }}
          >
            <Trash2 size={11} aria-hidden />
            Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Marine status banner */}
      {agent.slug === "marine" && <MarineStatusBanner />}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: 0,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {messages.map((msg, msgIndex) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: 10,
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
            }}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <AgentAvatar slug={agent.slug} size={30} />
            )}

            {/* Bubble + meta */}
            <div
              className="msg-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                maxWidth: "75%",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  userSelect: "text",
                  WebkitUserSelect: "text",
                  cursor: "text",
                  ...(msg.role === "user"
                    ? {
                        background: "#111827",
                        color: "#F5F5F7",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "18px 18px 4px 18px",
                      }
                    : msg.isError
                    ? {
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#DC2626",
                        borderRadius: "18px 18px 18px 4px",
                      }
                    : {
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#F5F5F7",
                        borderRadius: "18px 18px 18px 4px",
                      }),
                }}
              >
                {msg.content}
                {msg.isStreaming && msg.content.length > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 14,
                      background: "currentColor",
                      opacity: 0.7,
                      marginLeft: 2,
                      verticalAlign: "middle",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>

              {/* Tool calls */}
              {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
                  {msg.toolCalls.map((tc, i) => (
                    <ToolCallCard key={`${tc.name}-${i}`} toolCall={tc} />
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  paddingLeft: 2,
                  paddingRight: 2,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(245,245,247,0.3)",
                    marginTop: 3,
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
                {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                  <CopyButton text={msg.content} />
                )}
                {msg.isStreaming && msg.content.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(245,245,247,0.45)",
                      fontStyle: "italic",
                    }}
                  >
                    Génération...
                  </span>
                )}
              </div>

              {/* Quick suggestions — only after greeting message (index 0) when no user messages yet */}
              {msgIndex === 0 &&
                msg.role === "assistant" &&
                messages.length === 1 &&
                !streaming &&
                (AGENT_SUGGESTIONS[agent.slug] ?? []).length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 8,
                      maxWidth: "100%",
                    }}
                  >
                    {(AGENT_SUGGESTIONS[agent.slug] ?? []).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(245,245,247,0.7)",
                          cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s, color 0.15s",
                          outline: "none",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.background =
                            "rgba(255,255,255,0.12)"
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                            "rgba(255,255,255,0.2)"
                          ;(e.currentTarget as HTMLButtonElement).style.color = "#F5F5F7"
                          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                            `0 0 0 1px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.2)`
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.background =
                            "rgba(255,255,255,0.06)"
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                            "rgba(255,255,255,0.1)"
                          ;(e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(245,245,247,0.7)"
                          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* Typing indicator — shown during first 2s of streaming before text arrives */}
        {showTyping && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <AgentAvatar slug={agent.slug} size={30} />
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "18px 18px 18px 4px",
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Working panel — shown when streaming starts (empty assistant message) */}
      {showWorkingPanel && <WorkingPanel isStreaming={streaming} />}

      {/* Input area */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: "10px 16px 0",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  flexShrink: 0,
                }}
              >
                {att.type === "image" && att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    style={{ width: 64, height: 64, objectFit: "cover", display: "block" }}
                  />
                ) : att.type === "video" ? (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                        stroke="#E86F4D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(245,245,247,0.45)",
                        textAlign: "center",
                        padding: "0 4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {att.name.length > 10 ? att.name.slice(0, 8) + "…" : att.name}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                        stroke="rgba(245,245,247,0.45)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                        stroke="rgba(245,245,247,0.45)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(245,245,247,0.45)",
                        textAlign: "center",
                        padding: "0 4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {att.name.length > 10 ? att.name.slice(0, 8) + "…" : att.name}
                    </span>
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-label="Retirer"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1 1l8 8M9 1L1 9"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {/* Size badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: 2,
                    fontSize: 8,
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(0,0,0,0.6)",
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  {att.size}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value)
              autoResize()
            }}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder={`Envoie une instruction à ${agent.name}...`}
            aria-label={`Message à ${agent.name}`}
            style={{
              flex: 1,
              resize: "none",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#F5F5F7",
              fontSize: 13,
              lineHeight: 1.5,
              outline: "none",
              transition: "border-color 0.15s",
              minHeight: 40,
              maxHeight: 96,
              overflowY: "hidden",
              opacity: streaming ? 0.5 : 1,
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = "#E86F4D"
            }}
            onBlur={(e) => {
              ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.14)"
            }}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.txt,.md,.doc,.docx,.csv"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            aria-label="Joindre des fichiers"
          />

          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming || attachments.length >= 5}
            title={attachments.length >= 5 ? "Maximum 5 fichiers" : "Joindre un fichier"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: attachments.length > 0 ? "#E86F4D" : "rgba(245,245,247,0.3)",
              cursor: streaming || attachments.length >= 5 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "color 0.15s, background 0.15s",
              position: "relative",
              outline: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {attachments.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#E86F4D",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {attachments.length}
              </span>
            )}
          </button>

          {streaming ? (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Arrêter la génération"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid #EF4444",
                background: "transparent",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
                outline: "none",
              }}
            >
              <StopCircle size={16} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() && attachments.length === 0}
              aria-label="Envoyer"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "none",
                background: (input.trim() || attachments.length > 0) ? "#E86F4D" : "rgba(255,255,255,0.14)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: (input.trim() || attachments.length > 0) ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "background 0.15s",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (input.trim() || attachments.length > 0) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(232,111,77,0.8)"
                }
              }}
              onMouseLeave={(e) => {
                if (input.trim() || attachments.length > 0) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = "#E86F4D"
                }
              }}
            >
              <Send size={15} aria-hidden />
            </button>
          )}
        </div>

        <p
          style={{
            fontSize: 11,
            color: "rgba(245,245,247,0.28)",
            marginTop: 6,
            paddingLeft: 2,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>
            <kbd style={{ fontFamily: "inherit", opacity: 0.7 }}>⏎</kbd> Envoyer
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>
            <kbd style={{ fontFamily: "inherit", opacity: 0.7 }}>⇧⏎</kbd> Nouvelle ligne
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>
            <kbd style={{ fontFamily: "inherit", opacity: 0.7 }}>⎋</kbd> Effacer
          </span>
        </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .copy-btn {
          opacity: 0.45;
        }
        .msg-group:hover .copy-btn {
          opacity: 1 !important;
        }
        textarea::placeholder {
          color: rgba(245,245,247,0.3);
        }
      `}</style>

      {/* Share conversation modal */}
      {showShareModal && (
        <ShareConversationModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  )
}
