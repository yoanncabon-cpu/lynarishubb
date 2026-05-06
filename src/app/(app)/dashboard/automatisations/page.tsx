"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Clock, Plus, Play, Pause, Trash2, X, CheckCircle2, AlertCircle, ChevronDown, Zap, Loader2, Pencil, Eye, EyeOff } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { agents } from "@/lib/agents/data"
import { describeSchedule, computeNextRunAt, DAY_LABELS } from "@/lib/scheduler"
import type { Frequency } from "@/lib/scheduler"
import { GlassCard } from "@/components/app/glass/GlassCard"
import { GlassChip } from "@/components/app/glass/GlassChip"
import { renderEmail } from "@/lib/emails/templates/branded"

// Body de démo affiché dans la prévisualisation — couvre tous les éléments visuels
// (h1, sections H2, listes à puces, listes numérotées, callouts stat, séparateur).
const PREVIEW_SAMPLE_BODY = `Bonjour Yoann,

Voici un aperçu du rendu de tes emails automatisés Lynaris. Le contenu réel sera celui généré par ton agent.

## Vue d'ensemble

Tous les agents sont opérationnels cette semaine.

Tâches totales : 24
Taux de succès : 100%
Erreurs : 0

## Détail par agent

- Marine — 8 RDV pris cette semaine
- Lou — 3 articles publiés sur le blog
- Elio — 12 prospects contactés, 4 réponses positives
- Mae — 47 emails triés et 6 brouillons préparés

---

## Recommandations de Charles

1. Relancer les prospects qui n'ont pas répondu depuis 5 jours
2. Préparer le post LinkedIn de la semaine prochaine
3. Faire un point hebdo avec **Nova** sur les métriques business

À très vite,
Charles`

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "communication" | "reporting" | "productivity" | "growth"
type EmailPreset = "lynaris" | "minimal" | "corporate"

type HeaderStyleOpt = "gradient" | "solid" | "minimal"
type FontFamilyOpt = "system" | "serif" | "mono"

interface EmailStyle {
  preset: EmailPreset
  accentColor?: string
  backgroundColor?: string
  cardBackgroundColor?: string
  textColor?: string
  sectionBackgroundColor?: string
  headerStyle?: HeaderStyleOpt
  borderRadius?: number
  fontFamily?: FontFamilyOpt
  headerBadgeText?: string
  footerText?: string
  showFooter?: boolean
}

const HEADER_STYLES: { id: HeaderStyleOpt; label: string }[] = [
  { id: "gradient", label: "Dégradé" },
  { id: "solid",    label: "Uni" },
  { id: "minimal",  label: "Minimal" },
]

const FONT_FAMILIES: { id: FontFamilyOpt; label: string; preview: string }[] = [
  { id: "system", label: "Système",  preview: "Aa — net & moderne" },
  { id: "serif",  label: "Serif",    preview: "Aa — classique élégant" },
  { id: "mono",   label: "Mono",     preview: "Aa — code & technique" },
]

const RADIUS_OPTIONS: { value: number; label: string }[] = [
  { value: 0,  label: "Carré" },
  { value: 8,  label: "Léger" },
  { value: 18, label: "Normal" },
  { value: 28, label: "Très arrondi" },
]

/**
 * Sous-composant : color picker + input texte hex synchronisés.
 * Permet à l'utilisateur de choisir une couleur via la palette OU de coller un code hex.
 * Les 2 inputs partagent la même value, donc un changement dans l'un met l'autre à jour.
 */
function ColorField({
  label,
  hint,
  value,
  onChange,
  fallback,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  fallback: string
}) {
  // Affiche normalisé en uppercase (#FF6600 plus lisible que #ff6600)
  const display = value.toUpperCase()

  function handleTextInput(raw: string) {
    // Normalise : ajoute # auto si manquant, accepte 3 ou 6 chars hex
    let v = raw.trim()
    if (v && !v.startsWith("#")) v = "#" + v
    // Autorise saisie partielle (ex: "#FF6") sans casser, mais ne propage que si vide ou complet
    if (v === "") {
      onChange("")
      return
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v.toUpperCase())
    } else if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
      // Expand #ABC → #AABBCC
      const r = v[1], g = v[2], b = v[3]
      onChange(`#${r}${r}${g}${g}${b}${b}`.toUpperCase())
    }
    // Sinon on accepte la saisie temporaire dans l'input texte mais on ne propage pas
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "rgba(250,250,250,0.65)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "rgba(250,250,250,0.35)", marginTop: 1 }}>{hint}</div>
      </div>
      <input
        type="color"
        value={display || fallback}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        style={{ width: 32, height: 28, padding: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", background: "transparent", flexShrink: 0 }}
        aria-label={`Choisir ${label.toLowerCase()}`}
      />
      <input
        type="text"
        placeholder={fallback}
        value={display}
        onChange={(e) => handleTextInput(e.target.value)}
        spellCheck={false}
        maxLength={7}
        style={{
          width: 78,
          padding: "5px 7px",
          fontSize: 11,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          textAlign: "center",
          letterSpacing: "0.04em",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          background: "rgba(255,255,255,0.04)",
          color: "#FAFAFA",
          flexShrink: 0,
        }}
        aria-label={`Code hex ${label.toLowerCase()}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Réinitialiser à la couleur du preset"
          style={{ fontSize: 10, color: "rgba(250,250,250,0.45)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}
        >
          reset
        </button>
      )}
    </div>
  )
}

interface ScheduledJob {
  id: string
  agentSlug: string
  name: string
  instruction: string
  frequency: string
  hour: number
  minute: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  timezone: string
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  lastResult: string | null
  runCount: number
  createdAt: string
  category: Category | null
  emailStyle: EmailStyle | null
}

const CATEGORIES: { id: Category; label: string; icon: string; color: string; description: string }[] = [
  { id: "communication", label: "Communication", icon: "📞", color: "#22D3EE", description: "SMS, mails clients, relances, confirmations" },
  { id: "reporting",     label: "Reporting",     icon: "📊", color: "#E86F4D", description: "Briefs quotidiens, métriques, résumés d'activité" },
  { id: "productivity",  label: "Productivité",  icon: "✨", color: "#A78BFA", description: "Tri inbox, organisation tâches, rappels" },
  { id: "growth",        label: "Croissance",    icon: "🚀", color: "#34D399", description: "Contenu, prospection, posts sociaux, SEO" },
]

const EMAIL_PRESETS: { id: EmailPreset; label: string; description: string; accent: string; bg: string }[] = [
  { id: "lynaris",   label: "Lynaris",   description: "Orange chaleureux, dégradé hero",       accent: "#E86F4D", bg: "#FDF7F3" },
  { id: "minimal",   label: "Minimal",   description: "Noir & blanc, sobre type Apple",        accent: "#1F1F23", bg: "#F8F8F8" },
  { id: "corporate", label: "Corporate", description: "Bleu nuit, formel type Stripe",         accent: "#1E40AF", bg: "#F1F5F9" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

/**
 * Compte à rebours fidèle au temps réel restant.
 * - imminent si <= 0
 * - "Xs" si < 1min (ex: "42s")
 * - "Xmin" si < 1h, arrondi par excès pour ne jamais sous-estimer (90s → "2min", pas "1min")
 * - "XhYYmin" si < 48h (ex: "19h29min", "1h05min")
 * - "XjYYh" si >= 48h (ex: "3j12h")
 */
function formatNextRun(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now()
  if (diffMs <= 0) return "imminent"

  // Sous la minute : afficher en secondes pour un compte à rebours lisible
  if (diffMs < 60_000) return `${Math.ceil(diffMs / 1000)}s`

  // Math.ceil — on veut "2min" tant que la minute n'est pas écoulée, pas "1min" prématuré
  const totalMin = Math.ceil(diffMs / 60_000)
  if (totalMin < 60) return `${totalMin}min`

  const totalH = Math.floor(totalMin / 60)
  const min = totalMin % 60

  if (totalH < 48) return `${totalH}h${String(min).padStart(2, "0")}min`

  const days = Math.floor(totalH / 24)
  const remH = totalH % 24
  return `${days}j${String(remH).padStart(2, "0")}h`
}

/**
 * Retourne la prochaine exécution effective.
 * Si la valeur en DB est dans le passé (cas dev sans cron, ou cron manqué),
 * recalcule à la volée pour afficher la bonne occurrence future.
 */
function getEffectiveNextRun(job: ScheduledJob): Date {
  if (job.nextRunAt) {
    const stored = new Date(job.nextRunAt)
    if (stored.getTime() > Date.now()) return stored
  }
  // Recalcul live à partir du planning du job
  return computeNextRunAt({
    frequency: job.frequency as Frequency,
    hour: job.hour,
    minute: job.minute,
    dayOfWeek: job.dayOfWeek,
    dayOfMonth: job.dayOfMonth,
    timezone: job.timezone,
  })
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function JobModal({ job, onClose, onSaved }: { job?: ScheduledJob; onClose: () => void; onSaved: (job: ScheduledJob) => void }) {
  const isEdit = job !== undefined
  // Charles en tête : agent orchestrateur par défaut, suivi des autres dans l'ordre du registry
  const sortedAgents = [
    ...agents.filter(a => a.slug === "charles"),
    ...agents.filter(a => a.slug !== "charles"),
  ]
  const [agentSlug, setAgentSlug] = useState(job?.agentSlug ?? "charles")
  const [name, setName] = useState(job?.name ?? "")
  const [instruction, setInstruction] = useState(job?.instruction ?? "")
  const [frequency, setFrequency] = useState<Frequency>((job?.frequency as Frequency) ?? "daily")
  const [hour, setHour] = useState(job?.hour ?? 9)
  const [minute, setMinute] = useState(job?.minute ?? 0)
  const [dayOfWeek, setDayOfWeek] = useState(job?.dayOfWeek ?? 1)
  const [dayOfMonth, setDayOfMonth] = useState(job?.dayOfMonth ?? 1)
  const [category, setCategory] = useState<Category | null>(job?.category ?? null)
  const [emailPreset, setEmailPreset] = useState<EmailPreset>(job?.emailStyle?.preset ?? "lynaris")
  const [accentColor, setAccentColor] = useState<string>(job?.emailStyle?.accentColor ?? "")
  const [backgroundColor, setBackgroundColor] = useState<string>(job?.emailStyle?.backgroundColor ?? "")
  const [cardBgColor, setCardBgColor] = useState<string>(job?.emailStyle?.cardBackgroundColor ?? "")
  const [textColor, setTextColor] = useState<string>(job?.emailStyle?.textColor ?? "")
  const [sectionBgColor, setSectionBgColor] = useState<string>(job?.emailStyle?.sectionBackgroundColor ?? "")
  const [headerStyle, setHeaderStyle] = useState<HeaderStyleOpt | "">(job?.emailStyle?.headerStyle ?? "")
  const [borderRadius, setBorderRadius] = useState<number | "">(typeof job?.emailStyle?.borderRadius === "number" ? job.emailStyle.borderRadius : "")
  const [fontFamily, setFontFamily] = useState<FontFamilyOpt | "">(job?.emailStyle?.fontFamily ?? "")
  const [headerBadgeText, setHeaderBadgeText] = useState<string>(job?.emailStyle?.headerBadgeText ?? "")
  const [footerText, setFooterText] = useState<string>(job?.emailStyle?.footerText ?? "")
  const [showFooter, setShowFooter] = useState<boolean>(job?.emailStyle?.showFooter !== false)
  const [showPreview, setShowPreview] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // HTML preview généré en live à partir des choix utilisateur. Recalculé seulement
  // quand un paramètre visuel change (preset, couleurs) ou quand le titre change.
  const previewHtml = useMemo(() => {
    return renderEmail({
      subject: name.trim() || "Aperçu de ton email automatisé",
      body: PREVIEW_SAMPLE_BODY,
      style: {
        preset: emailPreset,
        ...(/^#[0-9A-Fa-f]{6}$/.test(accentColor)     ? { accentColor }     : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(backgroundColor) ? { backgroundColor } : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(cardBgColor)     ? { cardBackgroundColor: cardBgColor } : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(textColor)       ? { textColor }       : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(sectionBgColor)  ? { sectionBackgroundColor: sectionBgColor } : {}),
        ...(headerStyle ? { headerStyle } : {}),
        ...(typeof borderRadius === "number" ? { borderRadius } : {}),
        ...(fontFamily ? { fontFamily } : {}),
        // headerBadgeText : on propage même si vide (= masquer le badge volontairement)
        ...(headerBadgeText !== "" ? { headerBadgeText } : { headerBadgeText: "" }),
        ...(footerText.trim() ? { footerText } : {}),
        showFooter,
      },
    })
  }, [name, emailPreset, accentColor, backgroundColor, cardBgColor, textColor, sectionBgColor, headerStyle, borderRadius, fontFamily, headerBadgeText, footerText, showFooter])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)

  const selectedAgent = agents.find((a) => a.slug === agentSlug)

  // Exemples ULTRA-précis — l'agent doit savoir QUOI faire sans ambiguïté
  // (canal + destinataire nommé + contenu exact si applicable)
  const EXAMPLES: Record<string, string> = {
    mae: "Trie ma boîte mail, identifie les emails urgents et rédige des brouillons de réponse pour les 3 plus importants.",
    marine: "Génère un résumé des appels du jour et envoie-le par email à yoanncabon@gmail.com.",
    lou: "Rédige et publie un post LinkedIn sur une actualité de mon secteur (tech / IA / SaaS).",
    elio: "Relance les prospects qui n'ont pas répondu depuis 5 jours.",
    nova: "Génère le rapport de performance de la semaine écoulée et envoie-le par email à yoanncabon@gmail.com.",
    charles: "Envoie un SMS à Yoann Cabon avec le texte : « Brief du jour : 3 RDV agenda, 2 emails à valider. »",
    alba: "Vérifie les demandes RH en attente et prépare les réponses.",
    max: "Génère 3 visuels pour les réseaux sociaux de la semaine.",
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !instruction) return
    setSaving(true)

    // Création : POST /api/scheduled-jobs
    // Édition : PATCH /api/scheduled-jobs/[id] (même payload sans agentSlug — un job ne change pas d'agent)
    const url = isEdit ? `/api/scheduled-jobs/${job!.id}` : "/api/scheduled-jobs"
    const method = isEdit ? "PATCH" : "POST"
    const payload: Record<string, unknown> = {
      name,
      instruction,
      frequency,
      hour,
      minute,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : null,
      category: category ?? null,
      // Style email — on filtre côté client pour n'envoyer que des valeurs valides au backend.
      emailStyle: {
        preset: emailPreset,
        ...(/^#[0-9A-Fa-f]{6}$/.test(accentColor)     ? { accentColor }     : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(backgroundColor) ? { backgroundColor } : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(cardBgColor)     ? { cardBackgroundColor: cardBgColor } : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(textColor)       ? { textColor }       : {}),
        ...(/^#[0-9A-Fa-f]{6}$/.test(sectionBgColor)  ? { sectionBackgroundColor: sectionBgColor } : {}),
        ...(headerStyle ? { headerStyle } : {}),
        ...(typeof borderRadius === "number" ? { borderRadius } : {}),
        ...(fontFamily ? { fontFamily } : {}),
        // Le badge peut être vide (volontairement) — distinct de "preset par défaut"
        headerBadgeText,
        ...(footerText.trim() ? { footerText } : {}),
        showFooter,
      },
    }
    if (!isEdit) payload["agentSlug"] = agentSlug

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const d = await res.json() as { job: ScheduledJob }
      onSaved(d.job)
      onClose()
    } else {
      const err = await res.json().catch(() => ({ error: "Erreur inconnue" })) as { error?: unknown }
      // L'API peut renvoyer error: string OU error: ZodFlattenedError (objet) OU error: undefined
      // → on aplatit toujours en string lisible pour éviter "Objects are not valid as a React child"
      let msg: string
      if (typeof err.error === "string") {
        msg = err.error
      } else if (err.error && typeof err.error === "object") {
        const flat = err.error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
        const fieldMsgs = Object.entries(flat.fieldErrors ?? {})
          .map(([field, errors]) => `${field} : ${errors.join(", ")}`)
          .join(" — ")
        const formMsgs = (flat.formErrors ?? []).join(" — ")
        msg = [fieldMsgs, formMsgs].filter(Boolean).join(" — ") || `Erreur de validation (${res.status})`
      } else {
        msg = `Erreur ${res.status}`
      }
      setSaveError(msg)
    }
    setSaving(false)
  }

  return (
    <div
      className="aut-modal-shell"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="aut-modal-card" style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>{isEdit ? "Modifier l'automatisation" : "Nouvelle automatisation"}</h2>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(250,250,250,0.4)", display: "flex", padding: 4 }}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Agent */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Agent</label>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => { if (!isEdit) setAgentMenuOpen((o) => !o) }}
                disabled={isEdit}
                title={isEdit ? "L'agent ne peut pas être modifié — supprime et recrée l'automatisation" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: isEdit ? "not-allowed" : "pointer", color: "#FAFAFA", fontSize: 13, fontWeight: 500, opacity: isEdit ? 0.6 : 1 }}
              >
                <AgentAvatar slug={agentSlug} size={24} />
                {selectedAgent?.name ?? agentSlug}
                {!isEdit && <ChevronDown size={14} style={{ marginLeft: "auto", opacity: 0.5 }} aria-hidden />}
              </button>
              {agentMenuOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 280, overflowY: "auto" }}>
                  {sortedAgents.map((a) => {
                    const isOrchestrator = a.slug === "charles"
                    return (
                      <button key={a.slug} type="button" onClick={() => { setAgentSlug(a.slug); setAgentMenuOpen(false); if (!instruction) setInstruction(EXAMPLES[a.slug] ?? "") }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", fontSize: 13,
                          color: agentSlug === a.slug ? "#E86F4D" : "rgba(250,250,250,0.75)",
                          background: isOrchestrator ? "linear-gradient(90deg, rgba(124,58,237,0.08), transparent)" : "transparent",
                          border: "none",
                          borderBottom: isOrchestrator ? "1px solid rgba(124,58,237,0.15)" : "none",
                          width: "100%", textAlign: "left", cursor: "pointer",
                          fontWeight: agentSlug === a.slug ? 600 : 400,
                        }}>
                        <AgentAvatar slug={a.slug} size={20} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div>{a.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(250,250,250,0.35)", marginTop: 1 }}>{a.description?.slice(0, 50)}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Nom de l&apos;automatisation</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ex : Tri boîte mail du matin"
              className="ly-input"
              style={{ width: "100%", padding: "10px 12px", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>

          {/* Instruction */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Instruction à l&apos;agent</label>
            <textarea
              required value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={4}
              placeholder={EXAMPLES[agentSlug] ?? "Décris ce que l'agent doit faire..."}
              className="ly-input"
              style={{ width: "100%", padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>

          {/* Fréquence */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Fréquence</label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["daily", "weekly", "monthly"] as Frequency[]).map((f) => (
                <GlassChip
                  key={f}
                  active={frequency === f}
                  onClick={() => setFrequency(f)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    padding: "8px 0",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {f === "daily" ? "Quotidien" : f === "weekly" ? "Hebdo" : "Mensuel"}
                </GlassChip>
              ))}
            </div>
          </div>

          {/* Jour (weekly) */}
          {frequency === "weekly" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Jour</label>
              <div style={{ display: "flex", gap: 6 }}>
                {DAY_LABELS.map((d, i) => (
                  <GlassChip
                    key={i}
                    active={dayOfWeek === i}
                    onClick={() => setDayOfWeek(i)}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      padding: "7px 0",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {d}
                  </GlassChip>
                ))}
              </div>
            </div>
          )}

          {/* Jour du mois (monthly) */}
          {frequency === "monthly" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Jour du mois</label>
              <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => { const v = parseInt(e.target.value); setDayOfMonth(isNaN(v) ? 1 : v); }}
                className="ly-input"
                style={{ width: 80, padding: "8px 12px", fontSize: 13, textAlign: "center" }} />
            </div>
          )}

          {/* Heure */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Heure (Europe/Paris)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" min={0} max={23} value={hour} onChange={(e) => { const v = parseInt(e.target.value); setHour(isNaN(v) ? 0 : v); }}
                className="ly-input"
                style={{ width: 70, padding: "8px 12px", fontSize: 13, textAlign: "center" }} />
              <span style={{ color: "rgba(250,250,250,0.4)", fontSize: 18, fontWeight: 700 }}>:</span>
              <input type="number" min={0} max={59} step={1} value={minute} onChange={(e) => { const v = parseInt(e.target.value); setMinute(isNaN(v) ? 0 : v); }}
                className="ly-input"
                style={{ width: 70, padding: "8px 12px", fontSize: 13, textAlign: "center" }} />
              <span style={{ fontSize: 12, color: "rgba(250,250,250,0.35)" }}>heure de Paris</span>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Catégorie</label>
            <div className="aut-grid aut-grid-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory((prev) => (prev === cat.id ? null : cat.id))}
                    title={cat.description}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: active ? "#FAFAFA" : "rgba(250,250,250,0.65)",
                      background: active ? `${cat.color}1F` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? cat.color + "55" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 150ms, border 150ms",
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }} aria-hidden>{cat.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", color: active ? cat.color : "#FAFAFA", fontWeight: 700 }}>{cat.label}</span>
                      <span style={{ display: "block", fontSize: 10.5, fontWeight: 400, color: "rgba(250,250,250,0.45)", marginTop: 2, lineHeight: 1.35 }}>
                        {cat.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Style email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Style email <span style={{ fontWeight: 400, textTransform: "none", color: "rgba(250,250,250,0.4)" }}>(appliqué aux mails envoyés par l&apos;agent)</span>
            </label>
            <div className="aut-grid aut-grid-3" style={{ gap: 8 }}>
              {EMAIL_PRESETS.map((p) => {
                const active = emailPreset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEmailPreset(p.id)}
                    title={p.description}
                    style={{
                      padding: 0,
                      background: "transparent",
                      border: `1.5px solid ${active ? p.accent : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      overflow: "hidden",
                      textAlign: "left",
                      transition: "border-color 150ms",
                      boxShadow: active ? `0 0 0 3px ${p.accent}33` : "none",
                    }}
                  >
                    {/* Mini preview */}
                    <div style={{ background: p.bg, padding: "10px 12px 8px" }}>
                      <div style={{ height: 8, width: "55%", background: p.accent, borderRadius: 3, marginBottom: 6 }} />
                      <div style={{ height: 5, width: "85%", background: "rgba(0,0,0,0.18)", borderRadius: 2, marginBottom: 4 }} />
                      <div style={{ height: 5, width: "70%", background: "rgba(0,0,0,0.12)", borderRadius: 2, marginBottom: 4 }} />
                      <div style={{ height: 5, width: "78%", background: "rgba(0,0,0,0.12)", borderRadius: 2 }} />
                    </div>
                    <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.25)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#FAFAFA" }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(250,250,250,0.45)", marginTop: 1, lineHeight: 1.3 }}>{p.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Color pickers — accent / fond / carte / texte. Hex synchronisé avec palette */}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <ColorField
                label="Couleur d'accent"
                hint="Header, liens, bullets, callouts"
                value={accentColor}
                onChange={setAccentColor}
                fallback={EMAIL_PRESETS.find((p) => p.id === emailPreset)?.accent ?? "#E86F4D"}
              />
              <ColorField
                label="Couleur de fond"
                hint="Arrière-plan autour de la carte"
                value={backgroundColor}
                onChange={setBackgroundColor}
                fallback={EMAIL_PRESETS.find((p) => p.id === emailPreset)?.bg ?? "#FDF7F3"}
              />
              <ColorField
                label="Couleur de la carte"
                hint="Bloc central qui contient le contenu"
                value={cardBgColor}
                onChange={setCardBgColor}
                fallback="#FFFFFF"
              />
              <ColorField
                label="Couleur du texte"
                hint="Paragraphes et titres (muted dérivé auto)"
                value={textColor}
                onChange={setTextColor}
                fallback="#1F1F23"
              />
              <ColorField
                label="Couleur des sections"
                hint="Fond des cards H2 (zone tintée gauche)"
                value={sectionBgColor}
                onChange={setSectionBgColor}
                fallback="#FBEFE9"
              />
            </div>

            {/* ─── Personnalisation avancée ─── */}
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                color: "rgba(250,250,250,0.7)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Personnalisation avancée
                <span style={{ color: "rgba(250,250,250,0.35)", fontWeight: 400 }}>(header, layout, contenu)</span>
              </span>
              <ChevronDown size={14} style={{ transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} aria-hidden />
            </button>

            {advancedOpen && (
              <div style={{ marginTop: 8, padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Header style */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,250,250,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Style du header</div>
                  <div className="aut-grid aut-grid-3">
                    {HEADER_STYLES.map((h) => {
                      const active = headerStyle === h.id
                      return (
                        <button key={h.id} type="button" onClick={() => setHeaderStyle(active ? "" : h.id)}
                          style={{
                            padding: "8px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: active ? "#E86F4D" : "rgba(250,250,250,0.65)",
                            background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${active ? "rgba(232,111,77,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            cursor: "pointer",
                          }}>
                          {h.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Border radius */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,250,250,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Arrondi de la carte</div>
                  <div className="aut-grid aut-grid-4">
                    {RADIUS_OPTIONS.map((r) => {
                      const active = borderRadius === r.value
                      return (
                        <button key={r.value} type="button" onClick={() => setBorderRadius(active ? "" : r.value)}
                          style={{
                            padding: "8px 6px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: active ? "#E86F4D" : "rgba(250,250,250,0.65)",
                            background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${active ? "rgba(232,111,77,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            cursor: "pointer",
                          }}>
                          {r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Font family */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,250,250,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Police</div>
                  <div className="aut-grid aut-grid-3">
                    {FONT_FAMILIES.map((f) => {
                      const active = fontFamily === f.id
                      const previewFont = f.id === "serif" ? "Georgia, serif" : f.id === "mono" ? "ui-monospace, monospace" : "system-ui"
                      return (
                        <button key={f.id} type="button" onClick={() => setFontFamily(active ? "" : f.id)}
                          style={{
                            padding: "10px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: active ? "#E86F4D" : "rgba(250,250,250,0.65)",
                            background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${active ? "rgba(232,111,77,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            cursor: "pointer",
                            textAlign: "center",
                          }}>
                          <div style={{ fontFamily: previewFont, fontSize: 16, marginBottom: 2 }}>Aa</div>
                          <div>{f.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Badge header */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,250,250,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Badge dans le header</div>
                  <input
                    type="text"
                    value={headerBadgeText}
                    onChange={(e) => setHeaderBadgeText(e.target.value)}
                    placeholder="Lynaris (laisse vide pour masquer)"
                    maxLength={30}
                    className="ly-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                {/* Footer custom */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,250,250,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Footer</div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(250,250,250,0.6)", cursor: "pointer" }}>
                      <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} style={{ accentColor: "#E86F4D" }} />
                      Afficher le footer
                    </label>
                  </div>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Envoyé par <strong>Lynaris</strong> · Tes agents IA travaillent en autonomie"
                    maxLength={200}
                    disabled={!showFooter}
                    className="ly-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: 13, boxSizing: "border-box", opacity: showFooter ? 1 : 0.4 }}
                  />
                  <div style={{ fontSize: 10, color: "rgba(250,250,250,0.35)", marginTop: 4 }}>
                    Tu peux utiliser <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>&lt;strong&gt;</code> et <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>&lt;a href&gt;</code> dans le footer.
                  </div>
                </div>

                {/* Reset all advanced */}
                <button type="button" onClick={() => {
                  setHeaderStyle("")
                  setBorderRadius("")
                  setFontFamily("")
                  setHeaderBadgeText("")
                  setFooterText("")
                  setShowFooter(true)
                  setSectionBgColor("")
                }}
                  style={{ alignSelf: "flex-start", fontSize: 11, color: "rgba(250,250,250,0.5)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Réinitialiser la personnalisation avancée
                </button>
              </div>
            )}

            {/* Toggle aperçu — affiche le rendu HTML réel de l'email avec les choix actuels */}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "10px 14px",
                background: showPreview ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${showPreview ? "rgba(232,111,77,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                color: showPreview ? "#E86F4D" : "rgba(250,250,250,0.7)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms, color 150ms",
              }}
            >
              {showPreview ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
              {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu de l'email"}
            </button>

            {showPreview && (
              <div style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "#0a0a0e" }}>
                <div style={{ padding: "8px 12px", fontSize: 11, color: "rgba(250,250,250,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
                  Aperçu live <span style={{ color: "rgba(250,250,250,0.25)" }}>· met à jour en temps réel</span>
                </div>
                <iframe
                  title="Aperçu email"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="aut-preview-frame"
                  style={{
                    width: "100%",
                    height: 540,
                    border: "none",
                    display: "block",
                    background: "#fff",
                  }}
                />
              </div>
            )}
          </div>

          {/* Erreur serveur */}
          {saveError && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#FCA5A5" }}>
              {saveError}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={saving}
            style={{ marginTop: 4, padding: "12px 0", background: saving ? "rgba(232,111,77,0.4)" : "#E86F4D", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", transition: "opacity 150ms" }}>
            {saving ? (isEdit ? "Enregistrement…" : "Création…") : (isEdit ? "Enregistrer les modifications" : "Créer l'automatisation")}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, onToggle, onDelete, onRunNow, onEdit }: { job: ScheduledJob; onToggle: (id: string, active: boolean) => void; onDelete: (id: string) => void; onRunNow: (id: string) => Promise<string>; onEdit: (job: ScheduledJob) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [running, setRunning] = useState(false)
  const [runFeedback, setRunFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  // tick : force le re-render pour rafraîchir le compte à rebours en live
  // Cadence adaptative : 1s sous la minute (compte à rebours en secondes lisible),
  // 30s au-delà (rafraîchissement minute, économique en CPU)
  const [, setTick] = useState(0)
  const _agent = agents.find((a) => a.slug === job.agentSlug)

  useEffect(() => {
    if (!job.isActive) return
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      const diffMs = getEffectiveNextRun(job).getTime() - Date.now()
      const delay = diffMs > 0 && diffMs < 90_000 ? 1_000 : 30_000
      timer = setTimeout(() => {
        setTick(t => t + 1)
        loop()
      }, delay)
    }
    loop()
    return () => clearTimeout(timer)
  }, [job])

  async function handleRunNow() {
    if (running) return
    setRunning(true)
    setRunFeedback(null)
    try {
      const result = await onRunNow(job.id)
      // Affiche directement la réponse de l'agent dans le toast (tronquée).
      // Permet de voir si le SMS/email est parti ou si l'agent a juste répondu sans agir.
      const preview = (result || "Exécution terminée").slice(0, 280)
      setRunFeedback({ ok: true, msg: preview })
      setExpanded(true) // ouvre la section détails pour voir le résultat complet
    } catch (err) {
      setRunFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erreur d'exécution" })
    } finally {
      setRunning(false)
      // Garde le feedback affiché plus longtemps (12s) pour qu'on ait le temps de lire le résultat
      setTimeout(() => setRunFeedback(null), 12000)
    }
  }

  const schedule = {
    frequency: job.frequency as Frequency,
    hour: job.hour,
    minute: job.minute,
    dayOfWeek: job.dayOfWeek,
    dayOfMonth: job.dayOfMonth,
  }

  return (
    <GlassCard radius={18} padding={0} hover={false} style={{ opacity: job.isActive ? 1 : 0.7, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        {/* Agent avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <AgentAvatar slug={job.agentSlug} size={36} />
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: job.isActive ? "#34D399" : "rgba(255,255,255,0.2)", border: "1.5px solid #111118" }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {job.name}
            </p>
            <GlassChip
              active={job.isActive}
              style={{
                fontSize: 10,
                padding: "1px 8px",
                fontWeight: 600,
                color: job.isActive ? "#34D399" : "rgba(250,250,250,0.4)",
                background: job.isActive ? "rgba(52,211,153,0.1)" : undefined,
                borderColor: job.isActive ? "rgba(52,211,153,0.25)" : undefined,
              }}
            >
              {job.isActive ? "Actif" : "Pausé"}
            </GlassChip>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: "rgba(250,250,250,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} aria-hidden />
              {describeSchedule(schedule)}
            </span>
            {job.isActive && (
              <span style={{ fontSize: 11, color: "rgba(250,250,250,0.3)" }}>
                Prochain : {formatNextRun(getEffectiveNextRun(job).toISOString())}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="aut-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button type="button" onClick={() => setExpanded((o) => !o)}
            style={{ fontSize: 11, color: "rgba(250,250,250,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
            {expanded ? "Masquer" : "Détails"}
          </button>
          <button type="button" onClick={() => void handleRunNow()} disabled={running}
            title="Exécuter maintenant — sans attendre la prochaine planification"
            style={{ background: running ? "rgba(232,111,77,0.18)" : "rgba(232,111,77,0.1)", border: "1px solid rgba(232,111,77,0.3)", borderRadius: 7, padding: "5px 10px", cursor: running ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, color: "#E86F4D", fontSize: 11, fontWeight: 600 }}>
            {running ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Zap size={12} aria-hidden />}
            {running ? "..." : "Tester"}
          </button>
          <button type="button" onClick={() => onEdit(job)}
            title="Modifier"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", color: "rgba(250,250,250,0.6)" }}>
            <Pencil size={13} aria-hidden />
          </button>
          <button type="button" onClick={() => onToggle(job.id, !job.isActive)}
            title={job.isActive ? "Mettre en pause" : "Activer"}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", color: job.isActive ? "#F59E0B" : "#34D399" }}>
            {job.isActive ? <Pause size={13} aria-hidden /> : <Play size={13} aria-hidden />}
          </button>
          <button type="button" onClick={() => onDelete(job.id)}
            title="Supprimer"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", color: "#F87171" }}>
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      </div>

      {/* Feedback exécution manuelle */}
      {runFeedback && (
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: runFeedback.ok ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
          color: runFeedback.ok ? "#34D399" : "#F87171",
          fontSize: 12, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {runFeedback.ok ? <CheckCircle2 size={13} aria-hidden /> : <AlertCircle size={13} aria-hidden />}
          {runFeedback.msg}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.35)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>Instruction</p>
            <p style={{ fontSize: 12, color: "rgba(250,250,250,0.65)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.instruction}</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(250,250,250,0.35)", margin: "0 0 2px" }}>Exécutions</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA", margin: 0 }}>{job.runCount}</p>
            </div>
            {job.lastRunAt && (
              <div>
                <p style={{ fontSize: 11, color: "rgba(250,250,250,0.35)", margin: "0 0 2px" }}>Dernière exécution</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA", margin: 0 }}>{relativeTime(job.lastRunAt)}</p>
              </div>
            )}
          </div>
          {job.lastResult && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <CheckCircle2 size={12} color="#34D399" aria-hidden />
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.35)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>Dernier résultat</p>
              </div>
              <p style={{ fontSize: 12, color: "rgba(250,250,250,0.55)", margin: 0, lineHeight: 1.6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
                {job.lastResult.slice(0, 400)}{job.lastResult.length > 400 ? "…" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomatisationsPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null)

  const fetch_ = useCallback(() => {
    setLoading(true)
    fetch("/api/scheduled-jobs")
      .then((r) => r.json())
      .then((d: { jobs: ScheduledJob[] }) => setJobs(d.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleToggle(id: string, active: boolean) {
    const res = await fetch(`/api/scheduled-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: active }),
    })
    if (res.ok) setJobs((prev) => prev.map((j) => j.id === id ? { ...j, isActive: active } : j))
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/scheduled-jobs/${id}`, { method: "DELETE" })
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  // Exécution manuelle d'un job (test à la volée, sans attendre le cron)
  // Retourne le contenu du résultat pour l'afficher direct dans le toast de feedback
  async function handleRunNow(id: string): Promise<string> {
    const res = await fetch(`/api/scheduled-jobs/${id}/run-now`, { method: "POST" })
    const data = await res.json().catch(() => ({})) as { success?: boolean; result?: string; error?: string }
    if (!res.ok || data.success === false) {
      throw new Error(data.error ?? data.result ?? `Erreur ${res.status}`)
    }
    // Refetch pour mettre à jour lastRunAt + lastResult + runCount affichés
    fetch_()
    return data.result ?? ""
  }

  const active = jobs.filter((j) => j.isActive)
  const paused = jobs.filter((j) => !j.isActive)

  return (
    <div className="aut-page" style={{ padding: "28px clamp(16px, 4vw, 32px)", maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={20} color="#E86F4D" aria-hidden />
          <div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#FAFAFA", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Automatisations</h1>
            <p style={{ fontSize: 13, color: "rgba(250,250,250,0.45)", margin: "6px 0 0" }}>
              Vos agents s&apos;exécutent automatiquement selon le planning configuré
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#E86F4D", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          <Plus size={15} aria-hidden />
          Nouvelle automatisation
        </button>
      </div>

      {/* Stats bar */}
      {jobs.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Actives", value: active.length, color: "#34D399" },
            { label: "En pause", value: paused.length, color: "rgba(250,250,250,0.3)" },
            { label: "Exécutions totales", value: jobs.reduce((s, j) => s + j.runCount, 0), color: "#E86F4D" },
          ].map((s) => (
            <GlassCard key={s.label} radius={14} padding="10px 16px" hover={false}>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "rgba(250,250,250,0.4)", margin: 0 }}>{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
          <Clock size={48} color="rgba(250,250,250,0.08)" aria-hidden />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(250,250,250,0.5)", margin: "0 0 6px" }}>
              Aucune automatisation
            </p>
            <p style={{ fontSize: 13, color: "rgba(250,250,250,0.3)", margin: 0 }}>
              Créez votre première automatisation et laissez vos agents travailler en autonomie
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ fontSize: 13, fontWeight: 600, color: "#E86F4D", padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(232,111,77,0.3)", background: "rgba(232,111,77,0.08)", cursor: "pointer" }}
          >
            Créer une automatisation →
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.length > 0 && (
            <>
              {CATEGORIES.map((cat) => {
                const inCat = active.filter((j) => j.category === cat.id)
                if (inCat.length === 0) return null
                return (
                  <React.Fragment key={cat.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 4px" }}>
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                      <p style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                        {cat.label}
                      </p>
                      <span style={{ fontSize: 11, color: "rgba(250,250,250,0.3)" }}>· {inCat.length}</span>
                    </div>
                    {inCat.map((job) => (
                      <JobCard key={job.id} job={job} onToggle={handleToggle} onDelete={handleDelete} onRunNow={handleRunNow} onEdit={setEditingJob} />
                    ))}
                  </React.Fragment>
                )
              })}
              {(() => {
                const uncategorized = active.filter((j) => !j.category)
                if (uncategorized.length === 0) return null
                return (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 4px" }}>
                      Sans catégorie — {uncategorized.length}
                    </p>
                    {uncategorized.map((job) => (
                      <JobCard key={job.id} job={job} onToggle={handleToggle} onDelete={handleDelete} onRunNow={handleRunNow} onEdit={setEditingJob} />
                    ))}
                  </>
                )
              })()}
            </>
          )}
          {paused.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 4px" }}>
                En pause — {paused.length}
              </p>
              {paused.map((job) => (
                <JobCard key={job.id} job={job} onToggle={handleToggle} onDelete={handleDelete} onRunNow={handleRunNow} onEdit={setEditingJob} />
              ))}
            </>
          )}
        </div>
      )}

      {showCreate && (
        <JobModal
          onClose={() => setShowCreate(false)}
          onSaved={(job) => setJobs((prev) => [job, ...prev])}
        />
      )}

      {editingJob && (
        <JobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={(updated) => setJobs((prev) => prev.map(j => j.id === updated.id ? updated : j))}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
