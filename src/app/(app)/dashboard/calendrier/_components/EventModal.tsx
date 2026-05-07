"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { X, MapPin, AlignLeft, Clock } from "lucide-react"
import { DatePickerPopover } from "./DatePickerPopover"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ACCENT  = "#E86F4D"
const VIOLET  = "#7C3AED"
const CYAN    = "#22D3EE"
const PINK    = "#F472B6"
const GREEN   = "#34D399"
const YELLOW  = "#FBBF24"

const SWATCHES = [
  { color: ACCENT,  label: "Orange" },
  { color: CYAN,    label: "Cyan" },
  { color: VIOLET,  label: "Violet" },
  { color: PINK,    label: "Rose" },
  { color: GREEN,   label: "Vert" },
  { color: YELLOW,  label: "Jaune" },
]

const TYPES = [
  { value: "rdv",            label: "RDV",           icon: "🗓️" },
  { value: "contenu",        label: "Contenu",        icon: "📝" },
  { value: "automatisation", label: "Automatisation", icon: "⚡" },
  { value: "tache",          label: "Tâche",          icon: "✅" },
  { value: "autre",          label: "Autre",          icon: "📌" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventFormData {
  title: string
  type: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  location: string
  notes: string
  color: string
}

export interface EventModalProps {
  mode: "create" | "edit"
  initialData?: Partial<EventFormData>
  initialDate?: Date | null
  onSave: (data: EventFormData) => Promise<void> | void
  onDelete?: () => Promise<void> | void
  onClose: () => void
}

function padDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function padTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventModal({ mode, initialData, initialDate, onSave, onDelete, onClose }: EventModalProps) {
  const now = initialDate ?? new Date()
  const defaultStart = padDateLocal(now)
  const defaultStartTime = padTime(now)
  const endPlus1h = new Date(now.getTime() + 60 * 60 * 1000)

  const [form, setForm] = useState<EventFormData>({
    title:     initialData?.title     ?? "",
    type:      initialData?.type      ?? "rdv",
    startDate: initialData?.startDate ?? defaultStart,
    startTime: initialData?.startTime ?? defaultStartTime,
    endDate:   initialData?.endDate   ?? defaultStart,
    endTime:   initialData?.endTime   ?? padTime(endPlus1h),
    allDay:    initialData?.allDay    ?? false,
    location:  initialData?.location  ?? "",
    notes:     initialData?.notes     ?? "",
    color:     initialData?.color     ?? ACCENT,
  })

  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Fermeture Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const set = useCallback(<K extends keyof EventFormData>(key: K, val: EventFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { titleRef.current?.focus(); return }
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try { await onDelete?.() }
    finally { setDeleting(false) }
  }

  // ─── Styles inline ──────────────────────────────────────────────────────────

  const backdrop: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 9000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    animation: "fadeIn 150ms ease-out both",
  }

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    background: "rgba(14,14,22,0.96)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
    animation: "scaleIn 180ms cubic-bezier(0.34,1.56,0.64,1) both",
  }

  const header: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 0",
  }

  const body: React.CSSProperties = {
    padding: "16px 20px 0",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  }

  const footer: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: 16,
    gap: 10,
  }

  const inputBase: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10,
    color: "#FAFAFA",
    fontSize: 14,
    outline: "none",
    transition: "border-color 150ms",
    fontFamily: "inherit",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "rgba(250,250,250,0.4)",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
        .ev-input:focus { border-color: rgba(232,111,77,0.5) !important; }
        .ev-input::placeholder { color: rgba(250,250,250,0.25); }
        .ev-input::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        .ev-textarea:focus { border-color: rgba(232,111,77,0.5) !important; }
        .ev-textarea::placeholder { color: rgba(250,250,250,0.25); }
      `}</style>

      <div style={backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label={mode === "create" ? "Créer un événement" : "Modifier l'événement"}>
        <div style={card}>

          {/* Header */}
          <div style={header}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA", letterSpacing: "-0.02em" }}>
              {mode === "create" ? "Nouvel événement" : "Modifier l'événement"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(250,250,250,0.55)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 120ms",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            <div style={body}>

              {/* Titre */}
              <input
                ref={titleRef}
                className="ev-input"
                type="text"
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Titre de l'événement"
                required
                style={{
                  ...inputBase,
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 16,
                  fontWeight: 600,
                  boxSizing: "border-box",
                }}
              />

              {/* Type chips */}
              <div>
                <span style={labelStyle}>Type</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TYPES.map(t => {
                    const active = form.type === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set("type", t.value)}
                        aria-pressed={active}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 12px", borderRadius: 999,
                          fontSize: 12, fontWeight: 600,
                          cursor: "pointer",
                          background: active ? `${form.color}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${active ? `${form.color}50` : "rgba(255,255,255,0.08)"}`,
                          color: active ? form.color : "rgba(250,250,250,0.5)",
                          transition: "all 150ms",
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{t.icon}</span>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dates */}
              <div>
                <span style={labelStyle}>
                  <Calendar size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  Date &amp; Heure
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Toggle journée */}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "fit-content" }}>
                    <div
                      onClick={() => set("allDay", !form.allDay)}
                      style={{
                        width: 36, height: 20, borderRadius: 999,
                        background: form.allDay ? ACCENT : "rgba(255,255,255,0.12)",
                        position: "relative", cursor: "pointer", transition: "background 200ms",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div style={{
                        position: "absolute", top: 2, left: form.allDay ? 17 : 2,
                        width: 14, height: 14, borderRadius: "50%",
                        background: "#fff",
                        transition: "left 200ms cubic-bezier(0.34,1.56,0.64,1)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(250,250,250,0.6)", userSelect: "none" }}>Journée entière</span>
                  </label>

                  {/* Date/heure début */}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <DatePickerPopover
                        value={form.startDate}
                        onChange={v => set("startDate", v)}
                        placeholder="Date de début"
                      />
                    </div>
                    {!form.allDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, ...inputBase, padding: "8px 12px", width: 110, flexShrink: 0 }}>
                        <Clock size={13} style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0 }} />
                        <input
                          className="ev-input"
                          type="time"
                          value={form.startTime}
                          onChange={e => set("startTime", e.target.value)}
                          style={{ background: "none", border: "none", color: "#FAFAFA", fontSize: 13, outline: "none", flex: 1, fontFamily: "inherit" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Date/heure fin */}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <DatePickerPopover
                        value={form.endDate}
                        onChange={v => set("endDate", v)}
                        placeholder="Date de fin"
                      />
                    </div>
                    {!form.allDay && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, ...inputBase, padding: "8px 12px", width: 110, flexShrink: 0 }}>
                        <Clock size={13} style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0 }} />
                        <input
                          className="ev-input"
                          type="time"
                          value={form.endTime}
                          onChange={e => set("endTime", e.target.value)}
                          style={{ background: "none", border: "none", color: "#FAFAFA", fontSize: 13, outline: "none", flex: 1, fontFamily: "inherit" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lieu */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, ...inputBase, padding: "10px 12px" }}>
                <MapPin size={14} style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0 }} />
                <input
                  className="ev-input"
                  type="text"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  placeholder="Lieu (optionnel)"
                  style={{ background: "none", border: "none", color: "#FAFAFA", fontSize: 13, outline: "none", flex: 1, fontFamily: "inherit" }}
                />
              </div>

              {/* Notes */}
              <div style={{ display: "flex", gap: 8, ...inputBase, padding: "10px 12px", alignItems: "flex-start" }}>
                <AlignLeft size={14} style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0, marginTop: 2 }} />
                <textarea
                  className="ev-textarea"
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Notes (optionnel)"
                  rows={3}
                  style={{
                    background: "none", border: "none", color: "#FAFAFA", fontSize: 13,
                    outline: "none", flex: 1, resize: "none", fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Couleur */}
              <div>
                <span style={labelStyle}>Couleur</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {SWATCHES.map(sw => (
                    <button
                      key={sw.color}
                      type="button"
                      onClick={() => set("color", sw.color)}
                      aria-label={sw.label}
                      aria-pressed={form.color === sw.color}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: sw.color,
                        border: form.color === sw.color
                          ? `2px solid #fff`
                          : "2px solid transparent",
                        cursor: "pointer",
                        boxShadow: form.color === sw.color ? `0 0 0 3px ${sw.color}40` : "none",
                        transition: "all 150ms",
                        outline: "none",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={footer}>
              <div style={{ display: "flex", gap: 8 }}>
                {mode === "edit" && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: "9px 16px", borderRadius: 10,
                      background: confirmDel ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${confirmDel ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: confirmDel ? "#EF4444" : "rgba(250,250,250,0.45)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "all 150ms",
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting ? "Suppression…" : confirmDel ? "Confirmer la suppression" : "Supprimer"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "9px 18px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(250,250,250,0.6)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "background 120ms",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  style={{
                    padding: "9px 20px", borderRadius: 10,
                    background: saving || !form.title.trim() ? "rgba(232,111,77,0.35)" : ACCENT,
                    border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: saving || !form.title.trim() ? "not-allowed" : "pointer",
                    transition: "background 150ms",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {saving ? "Enregistrement…" : mode === "create" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
