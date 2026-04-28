"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Clock, Plus, Play, Pause, Trash2, X, CheckCircle2, AlertCircle, ChevronDown, Zap, Loader2, Pencil } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { agents } from "@/lib/agents/data"
import { describeSchedule, computeNextRunAt, DAY_LABELS } from "@/lib/scheduler"
import type { Frequency } from "@/lib/scheduler"
import { GlassCard } from "@/components/app/glass/GlassCard"
import { GlassChip } from "@/components/app/glass/GlassChip"

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

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
 * Compte à rebours format "XhYYmin" : montre la durée restante avant la prochaine exécution.
 * - imminent si <= 0
 * - "Xmin" si < 1h
 * - "XhYYmin" si < 48h (ex: "19h29min", "1h05min")
 * - "XjYYh" si >= 48h (ex: "3j12h")
 */
function formatNextRun(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now()
  if (diffMs <= 0) return "imminent"

  const totalMin = Math.round(diffMs / 60_000)
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
    orion: "Vérifie que tous les workflows automatisés ont bien tourné cette nuit.",
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
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
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
              <input type="number" min={0} max={59} step={5} value={minute} onChange={(e) => { const v = parseInt(e.target.value); setMinute(isNaN(v) ? 0 : v); }}
                className="ly-input"
                style={{ width: 70, padding: "8px 12px", fontSize: 13, textAlign: "center" }} />
              <span style={{ fontSize: 12, color: "rgba(250,250,250,0.35)" }}>heure de Paris</span>
            </div>
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
  // tick : force le re-render toutes les 30s pour rafraîchir "dans X min" en live
  const [, setTick] = useState(0)
  const agent = agents.find((a) => a.slug === job.agentSlug)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

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
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
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
    <div style={{ padding: "28px 32px", maxWidth: 760 }}>
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
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
                Actives — {active.length}
              </p>
              {active.map((job) => (
                <JobCard key={job.id} job={job} onToggle={handleToggle} onDelete={handleDelete} onRunNow={handleRunNow} onEdit={setEditingJob} />
              ))}
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
