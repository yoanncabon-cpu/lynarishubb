"use client"

import { useState, useEffect, useRef, CSSProperties } from "react"
import { usePlan } from "@/hooks/usePlan"
import {
  CheckCircle2,
  Zap,
  ExternalLink,
  Download,
  CreditCard,
  Phone,
  X,
  Shield,
  TrendingUp,
  Bot,
  Mic,
} from "lucide-react"
import { GlassCard, GlassPanel, GlassChip, KpiTile } from "@/components/app/glass"

// ─── Data ─────────────────────────────────────────────────────────────────────

import {
  PLAN_LIST as PRICING_PLANS,
  type Plan as PricingPlan,
  type PlanId as PricingPlanId,
  type PlanFeatures,
} from "@/lib/pricing/plans"

// ─── Plans dashboard — dérivés depuis pricing/plans.ts (source de vérité) ────
// Affichage des 5 paliers : Découverte / Starter / Pro ⭐ / Business / Sur-mesure

// Couleur d'accent par plan pour l'UI (chip, prix, bordure card)
const PLAN_DISPLAY_COLORS: Readonly<Record<PricingPlanId, string>> = {
  discovery: "#22D3EE",
  starter:   "#A78BFA",
  pro:       "#E86F4D",
  business:  "#6366F1",
  custom:    "#F59E0B",
}

function fmtAgents(f: PlanFeatures): string {
  switch (f.agentsAccess) {
    case "trial_all":           return "Tous les agents (essai)"
    case "limited_3":           return typeof f.maxAgents === "number" ? `${f.maxAgents} agents (hors Marine)` : "Agents limités"
    case "all":                 return "Tous les 9 agents Lynaris"
    case "all_plus_custom":     return "Tous + 1 custom"
    case "all_plus_dedicated":  return "Agent dédié + tous"
  }
}

function fmtActions(monthlyActions: number): string {
  if (monthlyActions === -1) return "Illimité"
  return `${monthlyActions.toLocaleString("fr-FR")}/mois`
}

function fmtVoice(f: PlanFeatures): string {
  if (f.marineVoiceMinutes === -1) return "Illimité"
  if (f.marineVoiceMinutes === 0) return "En option"
  return `${f.marineVoiceMinutes.toLocaleString("fr-FR")} min`
}

function fmtSupport(f: PlanFeatures): string {
  switch (f.supportSla) {
    case "email_j1":           return "Email J+1"
    case "email_j1_priority":  return "Email prioritaire J+1"
    case "slack_j0":           return "Slack/WhatsApp J+0"
    case "manager_7d":         return "Manager dédié 7j/7"
  }
}

interface PlanDisplay {
  id: PricingPlanId
  name: string
  monthly: number | null
  annual: number | null
  color: string
  agents: string
  actions: string
  voice: string
  support: string
  setupFee: number
  isFree: boolean
  isCustom: boolean
  isFeatured: boolean
}

function toDisplay(plan: PricingPlan): PlanDisplay {
  return {
    id: plan.id,
    name: plan.name,
    monthly: plan.priceMonthly,
    annual: plan.priceAnnualMonthly,
    color: PLAN_DISPLAY_COLORS[plan.id],
    agents: fmtAgents(plan.features),
    actions: fmtActions(plan.features.monthlyActions),
    voice: fmtVoice(plan.features),
    support: fmtSupport(plan.features),
    setupFee: plan.setupFee,
    isFree: plan.priceMonthly === 0,
    isCustom: plan.id === "custom",
    isFeatured: plan.featured,
  }
}

const PLAN_DISPLAY: readonly PlanDisplay[] = PRICING_PLANS.map(toDisplay)

// Garde PLANS pour compatibilité avec le code existant
const PLANS = PLAN_DISPLAY

// Type local — ce qu'on peut envoyer comme planId au checkout serveur
type PlanId = PricingPlanId

// ─── Types ────────────────────────────────────────────────────────────────────

interface Invoice {
  id: string
  number: string | null
  amount: string
  currency: string
  status: "paid" | "open" | "void" | "uncollectible" | "draft" | null
  date: string
  pdfUrl: string | null
  hostedUrl: string | null
  description: string
}

const RECHARGE_AMOUNTS = [5, 10, 25, 50, 100, 200]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function progressColor(pct: number) {
  if (pct > 90) return "#EF4444"
  if (pct > 70) return "#F59E0B"
  return "#10B981"
}

function downloadInvoice(pdfUrl: string) {
  window.open(pdfUrl, "_blank", "noopener,noreferrer")
}

// Couleurs par plan DB → tints / textes — utilisées pour la carte plan actif et badges.
const PLAN_COLORS: Record<string, { tint: string; text: string; chipBg: string; chipBorder: string }> = {
  trial:   { tint: "rgba(34,211,238,0.16)",  text: "#22D3EE", chipBg: "rgba(34,211,238,0.12)",  chipBorder: "rgba(34,211,238,0.25)" },
  starter: { tint: "rgba(232,111,77,0.16)",  text: "#E86F4D", chipBg: "rgba(232,111,77,0.12)",  chipBorder: "rgba(232,111,77,0.30)" },
  pro:     { tint: "rgba(232,111,77,0.16)",  text: "#E86F4D", chipBg: "rgba(232,111,77,0.12)",  chipBorder: "rgba(232,111,77,0.30)" },
  scale:   { tint: "rgba(245,158,11,0.16)",  text: "#FBBF24", chipBg: "rgba(245,158,11,0.12)",  chipBorder: "rgba(245,158,11,0.25)" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(250,250,250,0.45)",
        margin: "0 0 12px",
      }}
    >
      {children}
    </p>
  )
}

function ProgressBar({ used, max }: { used: number; max: number }) {
  const pct = Math.min(Math.round((used / max) * 100), 100)
  const color = progressColor(pct)
  return (
    <div
      style={{
        height: 4,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 999,
          transition: "width 0.6s var(--ease-apple)",
        }}
      />
    </div>
  )
}

interface RechargeModalProps {
  type: "phone" | "api"
  onClose: () => void
}

function RechargeModal({ type, onClose }: RechargeModalProps) {
  const [selected, setSelected] = useState<number | null>(25)
  const [custom, setCustom] = useState("")
  const [loading, setLoading] = useState(false)

  const amount = custom ? parseFloat(custom) : selected ?? 0
  const isValid = amount >= 5
  const ttc = isValid ? (amount * 1.2).toFixed(2) : "—"

  const label = type === "phone" ? "Téléphoniques" : "API"
  const accentColor = type === "phone" ? "#22D3EE" : "#A78BFA"
  const accentBg = type === "phone" ? "rgba(34,211,238,0.12)" : "rgba(124,58,237,0.12)"

  async function handlePay() {
    if (!isValid) return
    setLoading(true)
    try {
      const res = await fetch("/api/billing/credits/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type }),
      })
      const data = (await res.json()) as { url?: string }
      if (data.url) window.location.assign(data.url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassPanel
        level={2}
        radius={20}
        padding={28}
        strong
        style={{ width: 420, maxWidth: "90vw" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
              Recharger Crédits {label}
            </p>
            <p style={{ fontSize: 12, color: "rgba(250,250,250,0.55)", margin: "2px 0 0" }}>
              Choisissez un montant
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "rgba(250,250,250,0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 220ms var(--ease-apple), color 220ms var(--ease-apple)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Montants */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {RECHARGE_AMOUNTS.map((amt) => {
            const isActive = !custom && selected === amt
            return (
              <GlassChip
                key={amt}
                onClick={() => {
                  setSelected(amt)
                  setCustom("")
                }}
                active={isActive}
                style={{
                  height: 44,
                  borderRadius: 10,
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  borderColor: isActive ? accentColor : undefined,
                  background: isActive ? accentBg : undefined,
                  color: isActive ? accentColor : "rgba(250,250,250,0.78)",
                }}
              >
                {amt}€
              </GlassChip>
            )
          })}
        </div>

        {/* Custom input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "rgba(250,250,250,0.55)", display: "block", marginBottom: 6 }}>
            Montant personnalisé (min 5€)
          </label>
          <input
            type="number"
            min={5}
            placeholder="Ex : 75"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              setSelected(null)
            }}
            className="ly-input"
            style={{ height: 40 }}
          />
        </div>

        {/* Preview */}
        <div
          className="ly-surface"
          style={{
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(250,250,250,0.55)" }}>Total TTC (TVA 20% incluse)</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FAFAFA" }}>
            {isValid ? `${ttc} €` : "—"}
          </span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handlePay}
          disabled={!isValid || loading}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "none",
            background: isValid ? accentColor : "rgba(255,255,255,0.06)",
            color: isValid ? (type === "phone" ? "#0F0F1A" : "white") : "rgba(250,250,250,0.35)",
            fontSize: 14,
            fontWeight: 700,
            cursor: isValid && !loading ? "pointer" : "not-allowed",
            transition: "all 220ms var(--ease-apple)",
            boxShadow: isValid ? `0 8px 24px -6px ${accentColor}66` : "none",
          }}
        >
          {loading ? "Redirection…" : "Payer par carte →"}
        </button>
      </GlassPanel>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [rechargeModal, setRechargeModal] = useState<"phone" | null>(null)
  const [autoRechargePhone, setAutoRechargePhone] = useState(false)
  const [credits, setCredits] = useState<{ phone: number } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null | undefined>(undefined)
  const [toast, setToastState] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null)
  const plansRef = useRef<HTMLDivElement>(null)
  const { limits, plan: contextPlan } = usePlan()
  // Le plan vient du PlanProvider (Server Component layout) — pas de fetch nécessaire.
  // Mapping UI → DB : "custom" → "scale" pour rester compatible avec PLAN_COLORS / CURRENT_PLAN_LABEL.
  const currentPlanId = contextPlan === "custom" ? "scale" : contextPlan

  // Labels par plan DB.
  // Migration douce : ancien "starter" reste valide en DB et s'affiche comme "Pro".
  const CURRENT_PLAN_LABEL: Record<string, string> = {
    trial: "Découverte",
    starter: "Pro", // ancien Essentiel → affiché Pro
    pro: "Pro",
    scale: "Sur-mesure",
  }
  const planMeta = PLAN_COLORS[currentPlanId] ?? PLAN_COLORS["trial"]!
  const [usageData, setUsageData] = useState<{ actions: number; voice: number; agents: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/usage").then(r => r.json()),
      fetch("/api/analytics?range=30").then(r => r.json()),
    ]).then(([usageRes, analyticsRes]: [
      { usage?: { metric: string; total: string | null }[] },
      { agents?: { slug: string; conversations: number }[] }
    ]) => {
      const rows = usageRes.usage ?? []
      const actions = Math.round(Number(rows.find(u => u.metric === "actions")?.total ?? 0))
      const voice = Math.round(Number(rows.find(u => u.metric === "voice_minutes")?.total ?? 0))
      const agents = (analyticsRes.agents ?? []).filter(a => a.conversations > 0).length
      setUsageData({ actions, voice, agents })
    }).catch(() => {})
  }, [])

  function showToast(msg: string, type: "success" | "error" | "info" = "info") {
    setToastState({ msg, type })
    setTimeout(() => setToastState(null), 4000)
  }

  // Activation plan post-checkout (sans webhook)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("session_id")
    const status = params.get("checkout")
    if (status === "success" && sessionId) {
      // Nettoie l'URL immédiatement
      window.history.replaceState({}, "", "/dashboard/billing")
      // Active le plan via la session Stripe
      fetch("/api/billing/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then((d: { success?: boolean; plan?: string; error?: string }) => {
          if (d.success) {
            showToast(`Plan ${d.plan ?? ""} activé avec succès ! Rechargement...`, "success")
            setTimeout(() => window.location.reload(), 1500)
          } else {
            showToast(d.error ?? "Erreur d'activation", "error")
          }
        })
        .catch(() => showToast("Erreur réseau lors de l'activation", "error"))
    } else if (status === "cancelled") {
      window.history.replaceState({}, "", "/dashboard/billing")
      showToast("Paiement annulé.", "info")
    }

    // Confirmation recharge crédits
    const rechargeStatus = params.get("recharge")
    const rechargeSessionId = params.get("session_id")
    const rechargeAmount = parseFloat(params.get("amount") ?? "0")
    const rechargeType = params.get("type") as "phone" | "api" | null
    if (rechargeStatus === "success" && rechargeSessionId && rechargeAmount > 0 && rechargeType) {
      window.history.replaceState({}, "", "/dashboard/billing")
      fetch("/api/billing/credits/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: rechargeSessionId, amount: rechargeAmount, type: rechargeType }),
      })
        .then(r => r.json())
        .then((d: { success?: boolean; newBalance?: number; error?: string }) => {
          if (d.success) {
            showToast(`Recharge de ${rechargeAmount}€ confirmée ! Nouveau solde : ${(d.newBalance ?? 0).toFixed(2)}€`, "success")
            setTimeout(() => window.location.reload(), 1500)
          } else {
            showToast(d.error ?? "Erreur de confirmation", "error")
          }
        })
        .catch(() => showToast("Erreur réseau", "error"))
    }
  }, [])

  // Fetch credits balance
  useEffect(() => {
    fetch("/api/billing/credits/balance")
      .then((r) => r.json())
      .then((d) => setCredits(d as { phone: number; api: number }))
      .catch(() => {})
  }, [])

  // Fetch vraies factures Stripe + date de renouvellement
  useEffect(() => {
    fetch("/api/billing/invoices")
      .then((r) => {
        if (!r.ok) { setInvoices([]); setCurrentPeriodEnd(null); return null }
        return r.json() as Promise<{ invoices?: Invoice[]; currentPeriodEnd?: string | null }>
      })
      .then((d) => {
        if (!d) return
        setInvoices(d.invoices ?? [])
        setCurrentPeriodEnd(d.currentPeriodEnd ?? null)
      })
      .catch(() => { setInvoices([]); setCurrentPeriodEnd(null) })
  }, [])

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.assign(data.url)
      } else {
        showToast(data.error ?? "Impossible d'ouvrir le portail Stripe.", "error")
      }
    } catch {
      showToast("Erreur reseau. Verifie ta connexion.", "error")
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleChoosePlan(planId: PlanId) {
    const plan = PLANS.find((p) => p.id === planId)
    // Mapping UI → DB :
    // - discovery → trial (essai)
    // - custom → scale (legacy DB)
    // - starter, pro, business → identifiant identique
    //   (note : "business" pas encore dans l'enum DB, étape 6 du plan migration)
    const dbPlanId: string =
      planId === "discovery" ? "trial" :
      planId === "custom" ? "scale" :
      planId
    if (!plan || currentPlanId === dbPlanId) return
    // Sur-mesure : redirige vers contact (pas de checkout Stripe)
    if (planId === "custom") {
      window.location.assign("/contact?type=demo")
      return
    }
    // Découverte : pas de checkout (essai géré via trialEndsAt)
    if (planId === "discovery") return
    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.assign(data.url)
      } else {
        showToast("Pour changer de plan, contactez hello@lynaris.ai ou configurez Stripe dans vos intégrations.", "info")
      }
    } catch {
      showToast("Erreur réseau. Vérifiez votre connexion.", "error")
    } finally {
      setLoadingPlan(null)
    }
  }

  // KPI usage — utilisés via KpiTile dans la grille.
  const usageStats: Array<{
    label: string
    used: number | null
    max: number
    icon: React.ReactNode
    accent: string
  }> = [
    { label: "Actions utilisées", used: usageData?.actions ?? null, max: limits.actionsPerMonth, icon: <TrendingUp size={14} />, accent: "#E86F4D" },
    { label: "Agents actifs",      used: usageData?.agents  ?? null, max: limits.agents.length,    icon: <Bot size={14} />,         accent: "#34D399" },
    { label: "Minutes voix",       used: usageData?.voice   ?? null, max: limits.voiceMinutes,     icon: <Mic size={14} />,         accent: "#22D3EE" },
  ]

  return (
    <>
      {rechargeModal === "phone" && (
        <RechargeModal type="phone" onClose={() => setRechargeModal(null)} />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "12px 18px", borderRadius: 12,
          background: toast.type === "error" ? "rgba(239,68,68,0.15)" : toast.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(232,111,77,0.12)",
          border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : toast.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(232,111,77,0.30)"}`,
          color: toast.type === "error" ? "#f87171" : toast.type === "success" ? "#86efac" : "#FAFAFA",
          fontSize: 13, fontWeight: 500,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          maxWidth: 360,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.type === "error" ? "⚠" : toast.type === "success" ? "✓" : "ℹ"} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 960, padding: "28px 24px 64px", margin: "0 auto" }}>

        {/* ── Section 1 — Plan actuel + Usage ────────────────────────────── */}
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Plan actuel</SectionLabel>
          <GlassCard tint={planMeta.tint} radius={22} padding={24} hover={false}>
            {/* Header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    background: planMeta.chipBg,
                    color: planMeta.text,
                    border: `1px solid ${planMeta.chipBorder}`,
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {CURRENT_PLAN_LABEL[currentPlanId] ?? currentPlanId}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>
                  Ton plan actuel
                </span>
              </div>
              <GlassChip
                onClick={handleManageBilling}
                icon={<ExternalLink size={12} />}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  opacity: portalLoading ? 0.5 : 1,
                  cursor: portalLoading ? "not-allowed" : "pointer",
                  pointerEvents: portalLoading ? "none" : "auto",
                }}
              >
                {portalLoading ? "Chargement…" : "Gérer via Stripe"}
              </GlassChip>
            </div>

            {/* Usage grid 4 cols — 3 KpiTile + bloc renouvellement */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              {usageStats.map(({ label, used, max, icon, accent }) => {
                const isLoading = used === null
                const safeUsed = used ?? 0
                const pct = max > 0 ? Math.min(Math.round((safeUsed / max) * 100), 100) : 0
                const color = progressColor(pct)
                const valueStr = isLoading
                  ? null
                  : `${safeUsed.toLocaleString("fr-FR")} / ${max > 0 ? max.toLocaleString("fr-FR") : "—"}`
                return (
                  <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                    <KpiTile
                      label={label}
                      value={valueStr}
                      icon={icon}
                      accent={accent}
                    />
                    {!isLoading && max > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 4, paddingRight: 4 }}>
                        <ProgressBar used={safeUsed} max={max} />
                        <p style={{ fontSize: 10, color, margin: "4px 0 0", fontWeight: 600 }}>{pct}%</p>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Renouvellement */}
              <KpiTile
                label="Renouvellement"
                value={
                  currentPeriodEnd === undefined
                    ? null
                    : (currentPeriodEnd ?? "—")
                }
                icon={<CreditCard size={14} />}
                accent="#A78BFA"
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1 }}>
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="ly-card ly-card-hover"
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 10,
                  color: "rgba(250,250,250,0.78)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: portalLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CreditCard size={13} />
                Gérer ma méthode de paiement
              </button>
              <button
                type="button"
                onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 8px 24px -6px var(--accent-glow)",
                  transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                }}
              >
                <Zap size={13} />
                Passer Pro
              </button>
            </div>
          </GlassCard>
        </section>

        {/* ── Section 2 — Crédits ─────────────────────────────────────────── */}
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Crédits</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, maxWidth: 480 }}>

            {/* Crédits Téléphoniques */}
            <GlassCard
              tint="rgba(34,211,238,0.10)"
              radius={22}
              padding={24}
              hover={false}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(34,211,238,0.12)",
                      border: "1px solid rgba(34,211,238,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Phone size={15} style={{ color: "#22D3EE" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA", margin: 0 }}>
                      Crédits Téléphoniques
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(250,250,250,0.55)", margin: "2px 0 0" }}>
                      Marine · Appels entrants/sortants
                    </p>
                  </div>
                </div>
                {/* Auto-recharge toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="ly-badge"
                    style={{
                      color: autoRechargePhone ? "#22D3EE" : "rgba(250,250,250,0.45)",
                      borderColor: autoRechargePhone ? "rgba(34,211,238,0.3)" : undefined,
                      fontSize: 10,
                      padding: "2px 6px",
                    }}
                  >
                    Auto-recharge {autoRechargePhone ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoRechargePhone((v) => !v)}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 999,
                      border: "none",
                      background: autoRechargePhone ? "#22D3EE" : "rgba(255,255,255,0.12)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 220ms var(--ease-apple)",
                      flexShrink: 0,
                    }}
                    aria-label="Toggle auto-recharge téléphonique"
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: autoRechargePhone ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "white",
                        transition: "left 220ms var(--ease-apple)",
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Solde */}
              <div style={{ marginBottom: 16, position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 11, color: "rgba(250,250,250,0.55)", margin: "0 0 4px" }}>Solde actuel</p>
                {credits === null ? (
                  <div
                    style={{
                      height: 32,
                      width: 100,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      color: "#22D3EE",
                      margin: 0,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {(credits.phone ?? 0).toFixed(2).replace(".", ",")} €
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setRechargeModal("phone")}
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid rgba(34,211,238,0.25)",
                  background: "rgba(34,211,238,0.10)",
                  color: "#22D3EE",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Recharger
              </button>
            </GlassCard>

          </div>
        </section>

        {/* ── Section 3 — Changer de plan ────────────────────────────────── */}
        <section ref={plansRef} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <SectionLabel>Changer de plan</SectionLabel>
            {/* Toggle mensuel/annuel */}
            <GlassPanel level={3} radius={10} padding={3} sheen={false} style={{ display: "inline-flex" }}>
              <div style={{ display: "inline-flex", gap: 2 }}>
                {(["monthly", "annual"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBilling(opt)}
                    style={{
                      height: 30,
                      padding: "0 14px",
                      borderRadius: 7,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      background: billing === opt ? "rgba(255,255,255,0.10)" : "transparent",
                      color: billing === opt ? "#FAFAFA" : "rgba(250,250,250,0.55)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 220ms var(--ease-apple)",
                    }}
                  >
                    {opt === "monthly" ? (
                      "Mensuel"
                    ) : (
                      <>
                        Annuel
                        <span
                          style={{
                            background: "rgba(16,185,129,0.14)",
                            color: "#10B981",
                            fontSize: 9,
                            borderRadius: 4,
                            padding: "1px 5px",
                            fontWeight: 700,
                          }}
                        >
                          -15%
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Plans grid — 5 paliers (Découverte / Starter / Pro ⭐ / Business / Sur-mesure) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {PLANS.map((plan) => {
              // Mapping plan_id UI → valeur DB
              // discovery → trial, starter/pro → identique, business → "business" (étape 6),
              // custom → scale
              const dbId: string =
                plan.id === "discovery" ? "trial" :
                plan.id === "custom" ? "scale" :
                plan.id
              const isCurrent = currentPlanId === dbId
              const isPro = plan.isFeatured
              const price =
                plan.isFree
                  ? 0
                  : plan.isCustom
                    ? null
                    : billing === "monthly"
                      ? plan.monthly
                      : plan.annual

              const cardStyle: CSSProperties = {
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                ...(isPro
                  ? { boxShadow: "0 0 40px -8px var(--accent-glow), 0 8px 32px -12px rgba(0,0,0,0.5)" }
                  : {}),
              }

              return (
                <GlassCard
                  key={plan.id}
                  tint={isPro ? "rgba(232,111,77,0.16)" : undefined}
                  radius={22}
                  padding={20}
                  hover={!isCurrent}
                  style={cardStyle}
                >
                  {/* Glow top border for Pro */}
                  {isPro && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: "linear-gradient(90deg, var(--accent), #F4A988)",
                        zIndex: 2,
                      }}
                    />
                  )}

                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
                    {/* Badge */}
                    {isPro && (
                      <div style={{ marginBottom: 12 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(232,111,77,0.15)",
                            color: "var(--accent)",
                            border: "1px solid rgba(232,111,77,0.3)",
                            borderRadius: 6,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Zap size={8} />
                          Le plus populaire
                        </span>
                      </div>
                    )}

                    {/* Plan name */}
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#FAFAFA",
                        margin: isPro ? "0 0 8px" : "12px 0 8px",
                      }}
                    >
                      {plan.name}
                    </p>

                    {/* Price — Gratuit / prix€/mois / Sur devis */}
                    <div style={{ marginBottom: 16 }}>
                      {plan.isFree ? (
                        <span style={{ fontSize: 22, fontWeight: 700, color: plan.color }}>
                          Gratuit
                        </span>
                      ) : plan.isCustom ? (
                        <span
                          style={{ fontSize: 22, fontWeight: 700, color: plan.color }}
                        >
                          Sur devis
                        </span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                          <span
                            style={{
                              fontSize: 26,
                              fontWeight: 700,
                              color: "#FAFAFA",
                              letterSpacing: "-0.03em",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {price}
                          </span>
                          <span style={{ fontSize: 12, color: "rgba(250,250,250,0.55)" }}>€/mois</span>
                        </div>
                      )}
                    </div>

                    {/* Feature table */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 20,
                        flex: 1,
                      }}
                    >
                      {[
                        { label: "Agents", value: plan.agents },
                        { label: "Actions", value: plan.actions },
                        { label: "Voix", value: plan.voice },
                        { label: "Support", value: plan.support },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{ display: "flex", alignItems: "center", gap: 7 }}
                        >
                          <CheckCircle2
                            size={11}
                            style={{ color: "#10B981", flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 11, color: "rgba(250,250,250,0.78)" }}>
                            <span style={{ color: "rgba(250,250,250,0.55)" }}>{label} : </span>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() => handleChoosePlan(plan.id as PlanId)}
                      disabled={isCurrent || loadingPlan === plan.id}
                      style={{
                        height: 36,
                        borderRadius: 10,
                        border: isCurrent
                          ? "1px solid var(--glass-border)"
                          : isPro
                            ? "none"
                            : "1px solid var(--glass-border-strong)",
                        background: isCurrent
                          ? "rgba(255,255,255,0.05)"
                          : isPro
                            ? "var(--accent)"
                            : "transparent",
                        color: isCurrent
                          ? "rgba(250,250,250,0.45)"
                          : isPro
                            ? "white"
                            : "rgba(250,250,250,0.78)",
                        fontSize: 12,
                        fontWeight: 600,
                        width: "100%",
                        cursor:
                          isCurrent || loadingPlan === plan.id
                            ? "not-allowed"
                            : "pointer",
                        opacity: loadingPlan === plan.id ? 0.6 : 1,
                        transition: "all 220ms var(--ease-apple)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        boxShadow: isPro && !isCurrent ? "0 8px 24px -6px var(--accent-glow)" : "none",
                      }}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 size={12} />
                          Plan actuel
                        </>
                      ) : loadingPlan === plan.id ? (
                        "Chargement…"
                      ) : plan.isCustom ? (
                        "Nous contacter"
                      ) : plan.isFree ? (
                        "Essai en cours"
                      ) : (
                        "Sélectionner"
                      )}
                    </button>

                    {/* Garantie */}
                    {!plan.isFree && (
                      <p
                        style={{
                          fontSize: 10,
                          color: "rgba(250,250,250,0.45)",
                          margin: "10px 0 0",
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Shield size={9} style={{ color: "rgba(250,250,250,0.45)" }} />
                        30 jours satisfait ou remboursé
                      </p>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </section>

        {/* ── Section 4 — Historique des paiements ───────────────────────── */}
        <section>
          <SectionLabel>Historique des paiements</SectionLabel>
          <GlassPanel level={2} radius={22} padding={0} style={{ overflow: "hidden" }}>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 160px 1fr 110px 90px 60px",
                padding: "10px 20px",
                borderBottom: "1px solid var(--glass-border)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {["# Facture", "Date", "Description", "Montant TTC", "Statut", "PDF"].map((col) => (
                <span
                  key={col}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(250,250,250,0.45)",
                  }}
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Skeleton pendant chargement */}
            {invoices === null &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 160px 1fr 110px 90px 60px",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom: i < 2 ? "1px solid var(--glass-border)" : "none",
                    gap: 12,
                  }}
                >
                  {[160, 100, 200, 80, 60, 40].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        height: 14,
                        width: w,
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.06)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  ))}
                </div>
              ))}

            {/* Aucune facture */}
            {invoices !== null && invoices.length === 0 && (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "rgba(250,250,250,0.45)",
                  fontSize: 13,
                }}
              >
                Aucune facture pour le moment.
              </div>
            )}

            {/* Lignes réelles */}
            {invoices !== null &&
              invoices.map((inv, i) => {
                const statusLabel =
                  inv.status === "paid" ? "Payée" :
                  inv.status === "open" ? "En attente" :
                  inv.status === "void" ? "Annulée" :
                  inv.status === "uncollectible" ? "Irrécupérable" :
                  inv.status === "draft" ? "Brouillon" : "—"

                const statusColor =
                  inv.status === "paid" ? { bg: "rgba(16,185,129,0.10)", text: "#10B981", border: "rgba(16,185,129,0.22)" } :
                  inv.status === "open" ? { bg: "rgba(245,158,11,0.10)", text: "#F59E0B", border: "rgba(245,158,11,0.22)" } :
                  { bg: "rgba(82,82,91,0.10)", text: "rgba(250,250,250,0.55)", border: "rgba(82,82,91,0.22)" }

                return (
                  <div
                    key={inv.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 160px 1fr 110px 90px 60px",
                      alignItems: "center",
                      padding: "14px 20px",
                      borderBottom:
                        i < invoices.length - 1
                          ? "1px solid var(--glass-border)"
                          : "none",
                      transition: "background 220ms var(--ease-apple)",
                    }}
                  >
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(250,250,250,0.55)" }}>
                      {inv.number ?? inv.id.slice(0, 16)}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(250,250,250,0.55)" }}>{inv.date}</span>
                    <span style={{ fontSize: 12, color: "rgba(250,250,250,0.78)" }}>{inv.description}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
                      {inv.amount} {inv.currency}
                    </span>
                    <span
                      className="ly-badge"
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        borderColor: statusColor.border,
                      }}
                    >
                      {inv.status === "paid" && <CheckCircle2 size={10} />}
                      {statusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => inv.pdfUrl && downloadInvoice(inv.pdfUrl)}
                      disabled={!inv.pdfUrl}
                      className="ly-badge"
                      style={{
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: inv.pdfUrl ? "rgba(250,250,250,0.78)" : "rgba(250,250,250,0.35)",
                        cursor: inv.pdfUrl ? "pointer" : "not-allowed",
                        padding: "4px 8px",
                        opacity: inv.pdfUrl ? 1 : 0.5,
                      }}
                    >
                      <Download size={11} />
                      PDF
                    </button>
                  </div>
                )
              })}
          </GlassPanel>
        </section>
      </div>
    </>
  )
}
