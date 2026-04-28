"use client"

import React, { useState, useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Sparkles,
  Check,
  Phone,
  PenLine,
  Mail,
  Briefcase,
  BarChart2,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { Glass } from "@/components/app/glass/Glass"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface AgentTemplate {
  id: string
  label: string
  description: string
  icon: ComponentType<{ size?: number; style?: React.CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>
  baseSlug: string
  color: string
  defaultModel: string
  suggestedTools: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES: AgentTemplate[] = [
  {
    id: "receptionist",
    label: "Réceptionniste",
    description: "Décroche, qualifie, prend RDV 24/7",
    icon: Phone,
    baseSlug: "marine",
    color: "#22D3EE",
    defaultModel: "claude-sonnet-4-6",
    suggestedTools: ["calendar", "sms"],
  },
  {
    id: "content",
    label: "Créateur de contenu",
    description: "Rédige, optimise, publie partout",
    icon: PenLine,
    baseSlug: "lou",
    color: "#F472B6",
    defaultModel: "claude-opus-4-6",
    suggestedTools: ["web_search", "n8n"],
  },
  {
    id: "email",
    label: "Assistant email",
    description: "Trie, rédige et gère ta boîte mail",
    icon: Mail,
    baseSlug: "mae",
    color: "#F59E0B",
    defaultModel: "claude-sonnet-4-6",
    suggestedTools: ["gmail"],
  },
  {
    id: "sales",
    label: "Commercial",
    description: "Prospecte, qualifie, relance auto",
    icon: Briefcase,
    baseSlug: "elio",
    color: "#10B981",
    defaultModel: "claude-sonnet-4-6",
    suggestedTools: ["gmail"],
  },
  {
    id: "analytics",
    label: "Analyste business",
    description: "Métriques, anomalies, rapports",
    icon: BarChart2,
    baseSlug: "nova",
    color: "#6366F1",
    defaultModel: "claude-opus-4-6",
    suggestedTools: ["stripe"],
  },
  {
    id: "custom",
    label: "Agent personnalisé",
    description: "Configure librement from scratch",
    icon: Wrench,
    baseSlug: "",
    color: "#E86F4D",
    defaultModel: "claude-sonnet-4-6",
    suggestedTools: [],
  },
]

const MODELS = [
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic", badge: "Économique", color: "#34D399" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", badge: "Rapide", color: "#E86F4D" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic", badge: "Puissant", color: "#A78BFA" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", badge: "Multimodal", color: "#10B981" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "OpenAI", badge: "Économique", color: "#6EE7B7" },
] as const

const TOOL_CATEGORIES = [
  { id: "calendar", label: "Google Calendar", description: "Créer et gérer des RDV" },
  { id: "gmail", label: "Gmail", description: "Lire et envoyer des emails" },
  { id: "sms", label: "SMS / Twilio", description: "Envoyer des SMS" },
  { id: "web_search", label: "Recherche web", description: "Rechercher des informations" },
  { id: "n8n", label: "n8n workflows", description: "Déclencher des workflows" },
  { id: "make", label: "Make scenarios", description: "Déclencher des scénarios Make" },
  { id: "notion", label: "Notion", description: "Lire et écrire dans Notion" },
  { id: "stripe", label: "Stripe", description: "Consulter les métriques financières" },
]

const AGENT_COLORS = ["#22D3EE", "#7C3AED", "#F472B6", "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#8B5CF6", "#E86F4D"]

const CREATION_STEPS = [
  { label: "Configuration..." },
  { label: "Connexion des intégrations..." },
  { label: "Agent prêt !" },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#F5EFE6",
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-geist-sans, system-ui)",
  boxSizing: "border-box",
  transition: "border-color 150ms",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(245,239,230,0.4)",
  marginBottom: 8,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Step labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        {["Type d'agent", "Configuration", "Déploiement"].map((label, i) => {
          const idx = i + 1
          const active = step === idx
          const done = step > idx
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
                justifyContent: i === 0 ? "flex-start" : i === 2 ? "flex-end" : "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  background: done
                    ? "#E86F4D"
                    : active
                      ? "rgba(232,111,77,0.2)"
                      : "rgba(255,255,255,0.06)",
                  border: done
                    ? "none"
                    : active
                      ? "1px solid #E86F4D"
                      : "1px solid rgba(255,255,255,0.1)",
                  color: done ? "white" : active ? "#E86F4D" : "rgba(255,255,255,0.3)",
                  flexShrink: 0,
                  transition: "all 200ms",
                }}
              >
                {done ? <Check size={11} aria-hidden /> : idx}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#F5EFE6" : done ? "#E86F4D" : "rgba(255,255,255,0.3)",
                  transition: "color 200ms",
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bar */}
      <div
        style={{
          height: 3,
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
            background: "linear-gradient(90deg, #E86F4D, #F472B6)",
            borderRadius: 999,
            transition: "width 350ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  )
}

interface CreationAnimationProps {
  agentName: string
  agentColor: string
}

function CreationAnimation({ agentName, agentColor }: CreationAnimationProps) {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (stepIdx >= CREATION_STEPS.length - 1) return
    const t = setTimeout(() => setStepIdx((s) => s + 1), 1000)
    return () => clearTimeout(t)
  }, [stepIdx])

  const done = stepIdx === CREATION_STEPS.length - 1

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 24,
      }}
    >
      {/* Spinner / check */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: done ? `${agentColor}20` : "rgba(255,255,255,0.05)",
          border: `2px solid ${done ? agentColor : "rgba(255,255,255,0.1)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 300ms",
          animation: done ? "none" : "spin 1.2s linear infinite",
        }}
      >
        {done ? (
          <Check size={28} style={{ color: agentColor }} aria-hidden />
        ) : (
          <Bot size={28} style={{ color: "rgba(255,255,255,0.4)" }} aria-hidden />
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: done ? agentColor : "#F5EFE6",
            margin: "0 0 8px",
            fontFamily: "var(--font-fraunces-var, Georgia, serif)",
            fontStyle: "italic",
            transition: "color 300ms",
          }}
        >
          {done ? `${agentName} est prêt !` : "Création en cours..."}
        </p>

        {/* Steps list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {CREATION_STEPS.map((s, i) => {
            const isCurrent = i === stepIdx
            const isPast = i < stepIdx
            return (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: isPast
                    ? "#10B981"
                    : isCurrent
                      ? "#F5EFE6"
                      : "rgba(255,255,255,0.25)",
                  transition: "color 200ms",
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {isPast ? (
                  <Check size={12} style={{ color: "#10B981" }} aria-hidden />
                ) : (
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: isCurrent ? "#E86F4D" : "rgba(255,255,255,0.1)",
                      flexShrink: 0,
                      transition: "background 200ms",
                    }}
                  />
                )}
                {s.label}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateAgentPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)

  // Step 2 form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-6")
  const [selectedColor, setSelectedColor] = useState("#22D3EE")
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  // Step 3 state
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)

  function pickTemplate(tpl: AgentTemplate) {
    setSelectedTemplate(tpl)
    setSelectedColor(tpl.color)
    setSelectedModel(tpl.defaultModel)
    setSelectedTools(tpl.suggestedTools)
    setStep(2)
  }

  function toggleTool(id: string) {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleCreate() {
    if (!name.trim() || !systemPrompt.trim()) return
    setCreating(true)
    setError(null)

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    try {
      const res = await fetch(`/api/agents/${slug}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          customInstructions: systemPrompt,
          isActive: true,
          specific: {
            description,
            model: selectedModel,
            color: selectedColor,
            tools: selectedTools.join(","),
            isCustom: "true",
            baseTemplate: selectedTemplate?.id ?? "custom",
          },
        }),
      })

      if (res.ok) {
        setCreatedSlug(slug)
        // Wait for animation to finish (3s), then redirect
        setTimeout(() => {
          router.push(`/dashboard/agents/${slug}`)
        }, 3200)
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Erreur lors de la création")
        setCreating(false)
      }
    } catch {
      setError("Erreur réseau")
      setCreating(false)
    }
  }

  const canProceedStep2 = name.trim().length > 0 && systemPrompt.trim().length > 0

  return (
    <div style={{ maxWidth: 680, padding: "24px 24px 64px", margin: "0 auto" }}>
      {/* Back */}
      <Link
        href="/dashboard/agents"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, color: "#71717A", textDecoration: "none", marginBottom: 20,
        }}
      >
        <ArrowLeft size={13} aria-hidden /> Mes agents
      </Link>

      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
            color: "#F5EFE6", margin: "0 0 4px",
          }}
        >
          Créer un agent IA
        </h1>
        <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>
          Configure un agent avec son modèle, ses instructions et ses outils.
        </p>
      </div>

      {/* Progress */}
      <ProgressBar step={step} />

      {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2
            style={{
              fontSize: 17, fontWeight: 700, color: "#F5EFE6",
              margin: "0 0 20px", letterSpacing: "-0.02em",
            }}
          >
            Quel type d&apos;agent veux-tu créer ?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => pickTemplate(tpl)}
                  style={{
                    padding: "20px 18px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 180ms",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${tpl.color}0d`
                    e.currentTarget.style.borderColor = `${tpl.color}30`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${tpl.color}18`,
                      border: `1px solid ${tpl.color}28`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} style={{ color: tpl.color }} aria-hidden />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 14, fontWeight: 700,
                        color: "#F5EFE6", margin: "0 0 3px",
                      }}
                    >
                      {tpl.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12, color: "rgba(255,255,255,0.4)",
                        margin: 0, lineHeight: 1.4,
                      }}
                    >
                      {tpl.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {selectedTemplate && (
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${selectedTemplate.color}18`,
                  border: `1px solid ${selectedTemplate.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <selectedTemplate.icon size={16} style={{ color: selectedTemplate.color }} aria-hidden />
              </div>
            )}
            <h2
              style={{
                fontSize: 17, fontWeight: 700, color: "#F5EFE6",
                margin: 0, letterSpacing: "-0.02em",
              }}
            >
              Configuration de l&apos;agent
            </h2>
          </div>

          {/* Identité */}
          <Glass radius={14} tint={0.04} padding={20}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 16px" }}>
              Identité
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle} htmlFor="agent-name">Nom de l&apos;agent *</label>
                <input
                  id="agent-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sophia, Felix..."
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Couleur</label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {AGENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: color,
                        border: selectedColor === color ? "2px solid white" : "2px solid transparent",
                        boxShadow: selectedColor === color ? `0 0 8px ${color}90` : "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "all 0.15s",
                      }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle} htmlFor="agent-desc">Description courte</label>
              <input
                id="agent-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ce que fait cet agent en une phrase..."
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
              />
            </div>
          </Glass>

          {/* Instructions système */}
          <Glass radius={14} tint={0.04} padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A6A7A", margin: 0 }}>
                Instructions système *
              </p>
              <button
                type="button"
                onClick={() => {
                  setSystemPrompt(
                    `Tu es ${name || "un agent IA"} de l'équipe Lynaris. Tu es ${description || "un assistant intelligent"}.\n\nTon rôle est de...\n\nRègles importantes:\n- Réponds toujours en français\n- Sois concis et précis\n- Demande des clarifications si nécessaire`
                  )
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "#E86F4D",
                  background: "rgba(232,111,77,0.1)", border: "1px solid rgba(232,111,77,0.2)",
                  borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                }}
              >
                <Sparkles size={10} aria-hidden /> Générer
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Tu es [Nom], un agent IA spécialisé dans... Tu dois toujours..."
              rows={6}
              style={{
                ...inputStyle,
                height: "auto",
                padding: "10px 12px",
                resize: "vertical",
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
            />
            <p style={{ fontSize: 11, color: "#52525B", marginTop: 6 }}>
              {systemPrompt.length} caractères
            </p>
          </Glass>

          {/* Modèle */}
          <Glass radius={14} tint={0.04} padding={20}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 14px" }}>
              Modèle IA
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MODELS.map((model) => {
                const active = selectedModel === model.id
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    style={{
                      padding: "12px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                      background: active ? `${model.color}14` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? model.color + "40" : "rgba(255,255,255,0.08)"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: active ? model.color : "#A1A1AA" }}>
                        {model.label}
                      </span>
                      {active && <Check size={13} color={model.color} aria-hidden />}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#71717A" }}>{model.provider}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: model.color, background: `${model.color}14`, padding: "0px 6px", borderRadius: 4 }}>
                        {model.badge}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Glass>

          {/* Intégrations */}
          <Glass radius={14} tint={0.04} padding={20}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A6A7A", margin: "0 0 14px" }}>
              Intégrations à activer
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TOOL_CATEGORIES.map((tool) => {
                const active = selectedTools.includes(tool.id)
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    style={{
                      padding: "10px 12px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                      background: active ? "rgba(232,111,77,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(232,111,77,0.25)" : "rgba(255,255,255,0.08)"}`,
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: active ? "rgba(232,111,77,0.2)" : "rgba(255,255,255,0.06)",
                        border: active ? "1px solid rgba(232,111,77,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {active && <Check size={11} color="#E86F4D" aria-hidden />}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: active ? "#F5EFE6" : "#A1A1AA", margin: 0 }}>
                        {tool.label}
                      </p>
                      <p style={{ fontSize: 10, color: "#52525B", margin: 0 }}>{tool.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Glass>

          {/* Nav */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} aria-hidden /> Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 18px", borderRadius: 10,
                border: "none",
                background: canProceedStep2 ? "#E86F4D" : "rgba(255,255,255,0.08)",
                color: canProceedStep2 ? "white" : "rgba(255,255,255,0.3)",
                fontSize: 13, fontWeight: 600,
                cursor: canProceedStep2 ? "pointer" : "not-allowed",
                transition: "all 150ms",
              }}
            >
              Continuer <ArrowRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2
            style={{
              fontSize: 17, fontWeight: 700, color: "#F5EFE6",
              margin: "0 0 4px", letterSpacing: "-0.02em",
            }}
          >
            Récapitulatif
          </h2>

          {/* Summary card */}
          <Glass radius={14} tint={0.04} padding={20}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}88)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 16px ${selectedColor}40`,
                }}
              >
                <Bot size={22} color="white" aria-hidden />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#F5EFE6", margin: "0 0 2px" }}>
                  {name || "Agent sans nom"}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>
                  {description || "Aucune description"}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedTools.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                        background: "rgba(232,111,77,0.1)", color: "#E86F4D",
                        border: "1px solid rgba(232,111,77,0.2)",
                      }}
                    >
                      {TOOL_CATEGORIES.find((tc) => tc.id === t)?.label ?? t}
                    </span>
                  ))}
                  {selectedTools.length === 0 && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                      Aucune intégration
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Model row */}
            <div
              style={{
                marginTop: 16, paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Modèle</span>
              <span
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: MODELS.find((m) => m.id === selectedModel)?.color ?? "#F5EFE6",
                }}
              >
                {MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}
              </span>
            </div>

            {/* System prompt preview */}
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#52525B", margin: "0 0 4px" }}>
                Instructions
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                {systemPrompt.length > 200
                  ? systemPrompt.slice(0, 200) + "…"
                  : systemPrompt || "—"}
              </p>
            </div>
          </Glass>

          {/* Creation animation when creating */}
          {creating && (
            <Glass radius={14} tint={0.04} padding={0}>
              <CreationAnimation agentName={name} agentColor={selectedColor} />
            </Glass>
          )}

          {/* Error */}
          {error && !creating && (
            <div
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#EF4444", fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          {!creating && !createdSlug && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                <ArrowLeft size={14} aria-hidden /> Retour
              </button>
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #E86F4D, #D05E3D)",
                  color: "white",
                  fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(232,111,77,0.3)",
                  transition: "all 150ms",
                }}
              >
                <Bot size={15} aria-hidden />
                Créer et activer l&apos;agent
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
