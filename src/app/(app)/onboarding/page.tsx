"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { agents } from "@/lib/agents/data"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"

// ─── Types ────────────────────────────────────────────────────────────────────

type Sector = keyof typeof SECTOR_AGENTS

interface StepProps {
  onNext: () => void
  onBack: () => void
}

// Map plan slug → label affiché.
// Migration douce : anciens slugs ('essentiel', 'starter', 'scale', 'cabinet')
// affichés selon la nouvelle nomenclature 3 plans.
const PLAN_LABELS: Record<string, string> = {
  decouverte: "Découverte",
  pro: "Pro",
  custom: "Sur-mesure",
  trial: "Découverte",
  // Rétrocompat
  essentiel: "Pro",
  starter: "Pro",
  scale: "Sur-mesure",
  cabinet: "Sur-mesure",
}

// ─── Sector → Agent mapping ───────────────────────────────────────────────────

const SECTOR_AGENTS = {
  sante: ["marine", "mae", "charles"],
  juridique: ["mae", "charles", "alba"],
  btp: ["marine", "elio", "nova"],
  commerce: ["elio", "lou", "nova"],
  tech: ["charles", "nova", "lou"],
  marketing: ["lou", "elio", "max"],
  finance: ["nova", "mae", "charles"],
  formation: ["lou", "mae", "charles"],
  autre: ["charles", "lou", "elio"],
} as const

const SECTORS = [
  { key: "sante", label: "Santé & Médical", icon: "🏥" },
  { key: "juridique", label: "Juridique & Conseil", icon: "⚖️" },
  { key: "btp", label: "BTP & Artisanat", icon: "🏗️" },
  { key: "commerce", label: "Commerce & E-commerce", icon: "🛒" },
  { key: "tech", label: "Tech & SaaS", icon: "💻" },
  { key: "marketing", label: "Marketing & Agence", icon: "📱" },
  { key: "finance", label: "Finance & Comptabilité", icon: "🏦" },
  { key: "formation", label: "Formation & Éducation", icon: "🎓" },
  { key: "autre", label: "Autre", icon: "🔧" },
] as const

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#E86F4D", "#F97316", "#7C3AED", "#22D3EE",
  "#10B981", "#F472B6", "#FBBF24", "#6366F1",
]

function Confetti() {
  const particles = Array.from({ length: 22 }, (_, i) => i)

  // Respecte prefers-reduced-motion
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null
  }

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .confetti-particle {
          position: absolute;
          top: -10px;
          animation: confetti-fall linear infinite;
        }
      `}</style>
      {particles.map((i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!
        const left = `${(i * 4.5 + 2) % 100}%`
        const size = 7 + (i % 5)
        const duration = `${2.8 + (i % 7) * 0.4}s`
        const delay = `${(i * 0.18) % 2.2}s`
        const isRect = i % 3 !== 0
        return (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left,
              animationDuration: duration,
              animationDelay: delay,
              width: isRect ? size : size * 0.7,
              height: isRect ? size * 0.5 : size * 0.7,
              borderRadius: isRect ? 2 : "50%",
              background: color,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i < step ? "#E86F4D" : "rgba(255,255,255,0.12)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  )
}

// ─── Button components ────────────────────────────────────────────────────────

function PrimaryButton({
  onClick,
  children,
  disabled = false,
  type = "button",
}: {
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 48,
        borderRadius: 12,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled
          ? "rgba(232,111,77,0.3)"
          : "linear-gradient(135deg, #E86F4D, #F97316)",
        color: "white",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        boxShadow: disabled
          ? "none"
          : "0 4px 20px rgba(232,111,77,0.35), 0 2px 8px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 24px rgba(232,111,77,0.45), 0 3px 10px rgba(0,0,0,0.35)"
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(232,111,77,0.35), 0 2px 8px rgba(0,0,0,0.3)"
        }
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        background: "transparent",
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"
      }}
    >
      {children}
    </button>
  )
}

// ─── Step 1 — Welcome ─────────────────────────────────────────────────────────

function StepWelcome({
  onNext,
  firstName,
  setFirstName,
  company,
  setCompany,
  password,
  setPassword,
  email,
  setEmail,
  plan,
}: StepProps & {
  firstName: string
  setFirstName: (v: string) => void
  company: string
  setCompany: (v: string) => void
  password: string
  setPassword: (v: string) => void
  email: string
  setEmail: (v: string) => void
  plan: string | null
}) {
  const [pwdError, setPwdError] = useState("")
  const [saving, setSaving] = useState(false)

  // Pré-remplir l'email depuis le compte Supabase
  useEffect(() => {
    if (email) return
    void getSupabaseBrowserClient().auth.getUser().then((r: Awaited<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["auth"]["getUser"]>>) => {
      if (r.data.user?.email) setEmail(r.data.user.email)
    })
  }, [])

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: 15,
    padding: "0 16px",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  }

  async function handleNext() {
    if (password.length < 8) {
      setPwdError("8 caractères minimum")
      return
    }
    setPwdError("")
    setSaving(true)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    const updates: { password: string; email?: string } = { password }
    if (email && email !== user?.email) updates.email = email
    const { error } = await supabase.auth.updateUser(updates)
    setSaving(false)
    if (error) { setPwdError(error.message); return }
    onNext()
  }

  return (
    <div>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg, #E86F4D 0%, #F4956E 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(232,111,77,0.35)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#F5EFE6", letterSpacing: "-0.02em" }}>Lynaris</span>
      </div>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          margin: "0 0 10px",
          lineHeight: 1.2,
        }}
      >
        Bienvenue sur Lynaris 🎉
      </h1>

      {/* Badge plan sélectionné — informatif, non modifiable */}
      {plan && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#A78BFA",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 12l2 2 4-4" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" stroke="#A78BFA" strokeWidth="2" />
            </svg>
            Plan {PLAN_LABELS[plan.toLowerCase()] ?? plan} sélectionné
          </span>
        </div>
      )}

      <p
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          margin: "0 0 32px",
          lineHeight: 1.6,
        }}
      >
        Ton équipe IA est prête. Quelques questions pour la configurer.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        <div>
          <label
            style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}
          >
            Comment tu t&apos;appelles ?
          </label>
          <input
            type="text"
            placeholder="Ton prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#E86F4D"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
            }}
          />
        </div>
        <div>
          <label
            style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}
          >
            Nom de ton entreprise
          </label>
          <input
            type="text"
            // Placeholder Cabinet Ménigoz retiré — pas d'accord de citation
            placeholder="Ex : Mon cabinet"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E86F4D" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
            Adresse email
          </label>
          <input
            type="email"
            placeholder="toi@entreprise.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E86F4D" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
            Mot de passe
            <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>8 caractères min.</span>
          </label>
          <input
            type="password"
            placeholder="Choisis un mot de passe sécurisé"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwdError("") }}
            style={inputStyle}
            autoComplete="new-password"
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E86F4D" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = pwdError ? "#F87171" : "rgba(255,255,255,0.1)" }}
          />
          {pwdError && (
            <p style={{ fontSize: 12, color: "#FCA5A5", marginTop: 4 }}>{pwdError}</p>
          )}
        </div>
      </div>

      <PrimaryButton
        onClick={handleNext}
        disabled={saving || !firstName.trim() || !company.trim() || !email.trim() || !password || password.length < 8}
      >
        {saving ? "Enregistrement…" : "C'est parti →"}
      </PrimaryButton>
    </div>
  )
}

// ─── Step 2 — Sector ──────────────────────────────────────────────────────────

function StepSector({
  onNext,
  onBack,
  sector,
  setSector,
}: StepProps & {
  sector: Sector | null
  setSector: (s: Sector) => void
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          margin: "0 0 8px",
        }}
      >
        Quel est ton secteur d&apos;activité ?
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          margin: "0 0 28px",
        }}
      >
        On recommandera les agents les plus utiles pour toi.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {SECTORS.map(({ key, label, icon }) => {
          const isSelected = sector === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSector(key as Sector)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "14px 8px",
                borderRadius: 12,
                border: isSelected
                  ? "1.5px solid #E86F4D"
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: isSelected
                  ? "rgba(232,111,77,0.12)"
                  : "rgba(255,255,255,0.03)",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.2)"
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.06)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)"
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.03)"
                }
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: isSelected ? "#E86F4D" : "rgba(255,255,255,0.65)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <SecondaryButton onClick={onBack}>← Retour</SecondaryButton>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onNext} disabled={!sector}>
            Suivant →
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Recommended Agents ─────────────────────────────────────────────

function StepAgents({
  onNext,
  onBack,
  sector,
  enabledAgents,
  setEnabledAgents,
}: StepProps & {
  sector: Sector | null
  enabledAgents: string[]
  setEnabledAgents: (a: string[]) => void
}) {
  const slugs = sector ? [...SECTOR_AGENTS[sector]] : ["charles", "lou", "elio"]
  const recommendedAgents = slugs
    .map((slug) => agents.find((a) => a.slug === slug))
    .filter(Boolean)

  const toggleAgent = (slug: string) => {
    setEnabledAgents(
      enabledAgents.includes(slug)
        ? enabledAgents.filter((s) => s !== slug)
        : [...enabledAgents, slug]
    )
  }

  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          margin: "0 0 8px",
        }}
      >
        Tes agents recommandés
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          margin: "0 0 28px",
        }}
      >
        Sélectionne les agents à activer dans ton espace.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {recommendedAgents.map((agent) => {
          if (!agent) return null
          const isEnabled = enabledAgents.includes(agent.slug)
          return (
            <button
              key={agent.slug}
              type="button"
              onClick={() => toggleAgent(agent.slug)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 14,
                border: isEnabled
                  ? `1.5px solid ${agent.color}50`
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: isEnabled
                  ? `${agent.color}10`
                  : "rgba(255,255,255,0.03)",
                cursor: "pointer",
                transition: "all 0.18s ease",
                textAlign: "left",
              }}
            >
              <AgentAvatar slug={agent.slug} size={48} glow={isEnabled} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {agent.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: agent.color,
                      background: `${agent.color}18`,
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {agent.role}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {agent.tagline}
                </p>
              </div>
              {/* Checkbox */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: isEnabled ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                  background: isEnabled
                    ? "linear-gradient(135deg, #E86F4D, #F97316)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.18s ease",
                }}
              >
                {isEnabled && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path
                      d="M1 5L4.5 8.5L11 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <SecondaryButton onClick={onBack}>← Retour</SecondaryButton>
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={onNext} disabled={enabledAgents.length === 0}>
            Activer mes agents →
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4 — Ready ───────────────────────────────────────────────────────────

function StepReady({
  firstName,
  onFinish,
  provisionLoading,
  provisionError,
}: {
  firstName: string
  onFinish: (instruction: string) => Promise<boolean>
  provisionLoading: boolean
  provisionError: string | null
}) {
  const router = useRouter()
  const [instruction, setInstruction] = useState("")

  const handleCharles = async () => {
    if (instruction.trim()) {
      localStorage.setItem("prefill_charles", instruction.trim())
    }
    const ok = await onFinish(instruction)
    if (ok) router.push("/dashboard/agents/charles")
  }

  const handleDashboard = async () => {
    const ok = await onFinish(instruction)
    if (ok) router.push("/dashboard")
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          fontSize: 52,
          textAlign: "center",
          marginBottom: 16,
          animation: "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        🚀
      </div>
      <style>{`
        @keyframes bounce-in {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          margin: "0 0 10px",
          lineHeight: 1.3,
        }}
      >
        Ton équipe IA est activée !
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          margin: "0 0 28px",
          lineHeight: 1.6,
        }}
      >
        {firstName ? `Super ${firstName} ! ` : ""}Charles coordonne tout. Dis-lui ce que tu veux accomplir.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 8,
          }}
        >
          Donne ta première instruction à Charles...
        </label>
        <textarea
          placeholder="Ex : Rédige un article de blog sur les tendances IA en 2025 et publie-le sur WordPress"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: 14,
            padding: "12px 14px",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
            fontFamily: "inherit",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#E86F4D"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
          }}
        />
      </div>

      {/* Erreur provision */}
      {provisionError && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 14,
          color: "#EF4444",
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {provisionError} — réessaie ou contacte le support.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={handleCharles} disabled={provisionLoading}>
          {provisionLoading ? "Activation en cours…" : "Discuter avec Charles →"}
        </PrimaryButton>
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={handleDashboard}
            disabled={provisionLoading}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              cursor: provisionLoading ? "not-allowed" : "pointer",
              padding: "6px 0",
              transition: "color 0.2s ease",
              opacity: provisionLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!provisionLoading) {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"
            }}
          >
            Explorer le dashboard d&apos;abord
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Slide transitions ────────────────────────────────────────────────────────

function SlideContainer({
  children,
  stepKey,
}: {
  children: React.ReactNode
  stepKey: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      key={stepKey}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
      }}
    >
      {children}
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sector, setSector] = useState<Sector | null>(null)
  const [enabledAgents, setEnabledAgents] = useState<string[]>([
    "charles",
    "lou",
    "elio",
  ])
  const [provisionLoading, setProvisionLoading] = useState(false)
  const [provisionError, setProvisionError] = useState<string | null>(null)

  // Récupère le plan depuis les searchParams
  useEffect(() => {
    const p = searchParams.get("plan")
    if (p) setPlan(p)
  }, [searchParams])

  // Sync enabled agents when sector changes
  useEffect(() => {
    if (sector) {
      setEnabledAgents([...SECTOR_AGENTS[sector]])
    }
  }, [sector])

  const next = useCallback(() => setStep((s) => Math.min(s + 1, 4)), [])
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])

  // Plans payants déclenchant un checkout Stripe (Découverte/Sur-mesure exclus)
  // 'essentiel'/'starter' conservés en rétrocompat des liens existants
  const PAID_PLANS = ["pro", "essentiel", "starter"]

  const saveAndFinish = useCallback(
    async (_instruction: string): Promise<boolean> => {
      localStorage.setItem("user_name", firstName)
      setProvisionLoading(true)
      setProvisionError(null)

      try {
        // 1. Provision org + user en DB
        const res = await fetch("/api/onboarding/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgName: company,
            firstName: firstName.trim(),
            sector: sector ?? "autre",
            plan: plan ?? "trial",
            enabledAgents,
          }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? `Erreur ${res.status}`)
        }

        const provision = (await res.json()) as { orgId: string; orgEmail?: string }

        // 2. Plans payants → Stripe Checkout
        if (plan && PAID_PLANS.includes(plan)) {
          const checkoutRes = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: plan,
              org_id: provision.orgId,
              org_email: provision.orgEmail ?? "",
              billing: "monthly",
            }),
          })

          const checkoutData = (await checkoutRes.json()) as { url?: string; error?: string }
          if (checkoutRes.ok && checkoutData.url) {
            window.location.href = checkoutData.url
            return true
          }
          // Erreur Stripe → afficher au lieu de silencer
          if (checkoutData.error) {
            throw new Error(`Stripe : ${JSON.stringify(checkoutData.error)}`)
          }
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inattendue"
        setProvisionError(message)
        setProvisionLoading(false)
        return false
      }
    },
    [firstName, company, sector, plan, enabledAgents, PAID_PLANS]
  )

  return (
    <>
      {step === 4 && <Confetti />}

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 45% at 50% -5%, rgba(124,58,237,0.18), transparent 65%)",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "36px 32px",
            boxSizing: "border-box",
          }}
        >
          <ProgressBar step={step} total={4} />

          <SlideContainer stepKey={step}>
            {step === 1 && (
              <StepWelcome
                onNext={next}
                onBack={back}
                firstName={firstName}
                setFirstName={setFirstName}
                company={company}
                setCompany={setCompany}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                plan={plan}
              />
            )}
            {step === 2 && (
              <StepSector
                onNext={next}
                onBack={back}
                sector={sector}
                setSector={setSector}
              />
            )}
            {step === 3 && (
              <StepAgents
                onNext={next}
                onBack={back}
                sector={sector}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
              />
            )}
            {step === 4 && (
              <StepReady
                firstName={firstName}
                onFinish={saveAndFinish}
                provisionLoading={provisionLoading}
                provisionError={provisionError}
              />
            )}
          </SlideContainer>
        </div>

        {/* Step indicator */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            marginTop: 16,
          }}
        >
          Étape {step} sur 4
        </p>
      </div>
    </>
  )
}
