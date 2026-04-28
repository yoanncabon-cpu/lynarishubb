"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import {
  Search,
  Plus,
  Upload,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  X,
  Mail,
  Phone,
  StickyNote,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactStatus =
  | "Nouveau"
  | "Contacté"
  | "Qualifié"
  | "Proposition"
  | "Gagné"
  | "Perdu"

type SortDir = "asc" | "desc"
type SortKey = "name" | "company" | "status" | "lastContact" | "agent"
type TabId = "contacts" | "pipeline" | "segments"

interface ActivityItem {
  id: string
  type: "note" | "email" | "call"
  content: string
  date: string
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  status: ContactStatus
  lastContact: string
  agentSlug: string
  tags: string[]
  notes: string
  dealValue?: number
  activity: ActivityItem[]
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DS = {
  bg: "#111114",
  surface: "rgba(255,255,255,0.042)",
  elevated: "rgba(255,255,255,0.065)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.13)",
  orange: "#E86F4D",
  text: "#FAFAFA",
  muted: "rgba(250,250,250,0.5)",
  dim: "rgba(250,250,250,0.28)",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  radiusCard: 12,
  radiusBtn: 8,
}

const STATUS_CONFIG: Record<ContactStatus, { color: string; bg: string }> = {
  Nouveau:     { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  Contacté:    { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  Qualifié:    { color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  Proposition: { color: "#22D3EE", bg: "rgba(34,211,238,0.15)" },
  Gagné:       { color: "#34D399", bg: "rgba(52,211,153,0.15)" },
  Perdu:       { color: "#F87171", bg: "rgba(248,113,113,0.15)" },
}

const PIPELINE_COLUMNS: ContactStatus[] = [
  "Nouveau",
  "Contacté",
  "Qualifié",
  "Proposition",
  "Gagné",
  "Perdu",
]

const AGENT_OPTIONS = [
  { slug: "elio",   label: "Elio" },
  { slug: "mae",    label: "Mae" },
  { slug: "charles", label: "Charles" },
  { slug: "marine", label: "Marine" },
  { slug: "nova",   label: "Nova" },
]

const STATUS_OPTIONS: ContactStatus[] = [
  "Nouveau", "Contacté", "Qualifié", "Proposition", "Gagné", "Perdu",
]

const PAGE_SIZE = 10

// Aucune donnée mock — les contacts sont chargés depuis l'API uniquement

// ─── Utilities ────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = [
    "#E86F4D", "#3B82F6", "#8B5CF6", "#10B981",
    "#F59E0B", "#22D3EE", "#EC4899", "#6366F1",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] ?? "#E86F4D"
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    })
  } catch {
    return iso
  }
}

function relativeDate(iso: string): string {
  try {
    const now = new Date()
    const date = new Date(iso)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`
    return formatDate(iso)
  } catch {
    return iso
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ContactStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        borderRadius: 999,
        padding: "3px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  )
}

function ContactInitialsAvatar({
  firstName, lastName, size = 36,
}: { firstName: string; lastName: string; size?: number }) {
  const initials = getInitials(firstName, lastName)
  const color = getAvatarColor(`${firstName}${lastName}`)
  return (
    <div
      aria-label={`${firstName} ${lastName}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}33`,
        border: `1.5px solid ${color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: color,
        flexShrink: 0,
        letterSpacing: "0.03em",
      }}
    >
      {initials}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ContactFormData {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  status: ContactStatus
  agentSlug: string
  tags: string
  notes: string
  dealValue: string
}

const EMPTY_FORM: ContactFormData = {
  firstName: "", lastName: "", company: "", email: "",
  phone: "", status: "Nouveau", agentSlug: "elio",
  tags: "", notes: "", dealValue: "",
}

function ContactModal({
  contact,
  onClose,
  onSave,
}: {
  contact: Contact | null
  onClose: () => void
  onSave: (data: Partial<Contact>) => void
}) {
  const [form, setForm] = useState<ContactFormData>(() => {
    if (!contact) return EMPTY_FORM
    return {
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      status: contact.status,
      agentSlug: contact.agentSlug,
      tags: contact.tags.join(", "),
      notes: contact.notes,
      dealValue: contact.dealValue ? String(contact.dealValue) : "",
    }
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})

  function validate(): boolean {
    const next: Partial<Record<keyof ContactFormData, string>> = {}
    if (!form.firstName.trim()) next.firstName = "Prénom requis"
    if (!form.lastName.trim()) next.lastName = "Nom requis"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Email invalide"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const dealValue = form.dealValue ? parseInt(form.dealValue, 10) : undefined
    onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
      agentSlug: form.agentSlug,
      tags,
      notes: form.notes.trim(),
      dealValue,
    })
  }

  function field(label: string, key: keyof ContactFormData, opts?: {
    type?: string; required?: boolean; placeholder?: string
  }) {
    const inputStyle: React.CSSProperties = {
      width: "100%",
      padding: "9px 12px",
      borderRadius: DS.radiusBtn,
      border: `1px solid ${errors[key] ? DS.danger : DS.border}`,
      background: DS.surface,
      color: DS.text,
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: DS.muted }}>
          {label}{opts?.required && <span style={{ color: DS.danger }}> *</span>}
        </label>
        <input
          type={opts?.type ?? "text"}
          value={form[key]}
          placeholder={opts?.placeholder ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          style={inputStyle}
        />
        {errors[key] && (
          <span style={{ fontSize: 11, color: DS.danger }}>{errors[key]}</span>
        )}
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={contact ? "Modifier le contact" : "Nouveau contact"}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111113",
          border: `1px solid ${DS.border}`,
          borderRadius: DS.radiusCard,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: DS.text, margin: 0 }}>
            {contact ? "Modifier le contact" : "Nouveau contact"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: DS.muted, padding: 6, borderRadius: 6, display: "flex",
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {field("Prénom", "firstName", { required: true })}
          {field("Nom", "lastName", { required: true })}
        </div>
        {field("Entreprise", "company", { placeholder: "Nom de l'entreprise" })}
        {field("Email", "email", { type: "email", placeholder: "contact@example.com" })}
        {field("Téléphone", "phone", { type: "tel", placeholder: "+33 6 xx xx xx xx" })}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Statut select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: DS.muted }}>Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContactStatus }))}
              style={{
                padding: "9px 12px", borderRadius: DS.radiusBtn,
                border: `1px solid ${DS.border}`, background: "#111113",
                color: DS.text, fontSize: 13, outline: "none",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Agent select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: DS.muted }}>Agent assigné</label>
            <select
              value={form.agentSlug}
              onChange={(e) => setForm((f) => ({ ...f, agentSlug: e.target.value }))}
              style={{
                padding: "9px 12px", borderRadius: DS.radiusBtn,
                border: `1px solid ${DS.border}`, background: "#111113",
                color: DS.text, fontSize: 13, outline: "none",
              }}
            >
              {AGENT_OPTIONS.map((a) => (
                <option key={a.slug} value={a.slug}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {field("Valeur du deal (€)", "dealValue", { type: "number", placeholder: "ex: 490" })}
          {field("Tags (séparés par virgules)", "tags", { placeholder: "kiné, priorité" })}
        </div>

        {/* Notes textarea */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: DS.muted }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: DS.surface,
              color: DS.text, fontSize: 13, outline: "none", resize: "vertical",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: "transparent",
              color: DS.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "9px 18px", borderRadius: DS.radiusBtn,
              border: "none", background: DS.orange,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {contact ? "Enregistrer" : "Créer le contact"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  contact,
  onClose,
  onEdit,
  onStatusChange,
  onAgentChange,
  onNoteAdd,
}: {
  contact: Contact
  onClose: () => void
  onEdit: () => void
  onStatusChange: (status: ContactStatus) => void
  onAgentChange: (agentSlug: string) => void
  onNoteAdd: (content: string) => void
}) {
  const [noteInput, setNoteInput] = useState("")

  function submitNote() {
    const trimmed = noteInput.trim()
    if (!trimmed) return
    onNoteAdd(trimmed)
    setNoteInput("")
  }

  const activityIcon: Record<ActivityItem["type"], React.ReactNode> = {
    note:  <StickyNote size={13} aria-hidden />,
    email: <Mail size={13} aria-hidden />,
    call:  <Phone size={13} aria-hidden />,
  }

  return (
    <div
      style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 900,
        width: 400, background: "#111113",
        borderLeft: `1px solid ${DS.border}`,
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}
      role="complementary"
      aria-label="Détail du contact"
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${DS.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <ContactInitialsAvatar firstName={contact.firstName} lastName={contact.lastName} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 2px" }}>
            {contact.firstName} {contact.lastName}
          </p>
          <p style={{ fontSize: 12, color: DS.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contact.company}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: DS.muted, padding: 6, borderRadius: 6, display: "flex",
          }}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        {/* Contact info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {contact.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={14} color={DS.dim} aria-hidden />
              <span style={{ fontSize: 13, color: DS.text }}>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Phone size={14} color={DS.dim} aria-hidden />
              <span style={{ fontSize: 13, color: DS.text }}>{contact.phone}</span>
            </div>
          )}
          {contact.dealValue && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: DS.muted }}>Deal :</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: DS.success }}>
                {contact.dealValue}€/mois
              </span>
            </div>
          )}
        </div>

        {/* Status selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Statut
          </label>
          <select
            value={contact.status}
            onChange={(e) => onStatusChange(e.target.value as ContactStatus)}
            style={{
              padding: "8px 12px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: "#111113",
              color: DS.text, fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Agent selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Agent assigné
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgentAvatar slug={contact.agentSlug} size={28} />
            <select
              value={contact.agentSlug}
              onChange={(e) => onAgentChange(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: DS.radiusBtn,
                border: `1px solid ${DS.border}`, background: "#111113",
                color: DS.text, fontSize: 13, outline: "none", cursor: "pointer",
              }}
            >
              {AGENT_OPTIONS.map((a) => (
                <option key={a.slug} value={a.slug}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {contact.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11, fontWeight: 500, color: DS.muted,
                  background: DS.surface, border: `1px solid ${DS.border}`,
                  borderRadius: 999, padding: "2px 10px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Timeline
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...contact.activity].reverse().map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: DS.elevated, border: `1px solid ${DS.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: DS.muted, flexShrink: 0,
                  }}
                >
                  {activityIcon[item.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: DS.text, margin: "0 0 2px", lineHeight: 1.4 }}>
                    {item.content}
                  </p>
                  <p style={{ fontSize: 11, color: DS.dim, margin: 0 }}>{formatDate(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add note */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ajouter une note
          </label>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Rédiger une note..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote()
            }}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: DS.surface,
              color: DS.text, fontSize: 13, outline: "none", resize: "vertical",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={submitNote}
            style={{
              alignSelf: "flex-end", padding: "7px 14px", borderRadius: DS.radiusBtn,
              border: "none", background: DS.orange, color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Ajouter
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
          <a
            href={`mailto:${contact.email}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 14px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: DS.surface,
              color: DS.text, fontSize: 12, fontWeight: 600,
              textDecoration: "none", transition: "background 0.15s",
            }}
          >
            <Mail size={14} aria-hidden />
            Email
          </a>
          <a
            href={`tel:${contact.phone}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 14px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.border}`, background: DS.surface,
              color: DS.text, fontSize: 12, fontWeight: 600,
              textDecoration: "none", transition: "background 0.15s",
            }}
          >
            <Phone size={14} aria-hidden />
            Appeler
          </a>
          <button
            type="button"
            onClick={onEdit}
            style={{
              gridColumn: "1 / -1",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 14px", borderRadius: DS.radiusBtn,
              border: `1px solid ${DS.orange}44`, background: `${DS.orange}11`,
              color: DS.orange, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Pencil size={14} aria-hidden />
            Modifier le contact
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline Kanban ──────────────────────────────────────────────────────────

function KanbanView({
  contacts,
  onCardClick,
}: {
  contacts: Contact[]
  onCardClick: (contact: Contact) => void
}) {
  return (
    <div
      style={{
        display: "flex", gap: 14, overflowX: "auto",
        paddingBottom: 12, minHeight: 400,
      }}
    >
      {PIPELINE_COLUMNS.map((col) => {
        const cards = contacts.filter((c) => c.status === col)
        const cfg = STATUS_CONFIG[col]
        return (
          <div
            key={col}
            style={{
              minWidth: 240, flex: "0 0 240px",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: DS.radiusBtn,
                background: cfg.bg,
                border: `1px solid ${cfg.color}33`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{col}</span>
              <span
                style={{
                  fontSize: 11, fontWeight: 600, color: cfg.color,
                  background: `${cfg.color}22`, borderRadius: 999,
                  padding: "1px 8px",
                }}
              >
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            {cards.map((contact) => {
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onCardClick(contact)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 14px",
                    borderRadius: DS.radiusCard,
                    background: DS.surface,
                    border: `1px solid ${DS.border}`,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.background = DS.elevated
                    el.style.borderColor = DS.borderHover
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.background = DS.surface
                    el.style.borderColor = DS.border
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ContactInitialsAvatar firstName={contact.firstName} lastName={contact.lastName} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: DS.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: DS.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contact.company}
                      </p>
                    </div>
                  </div>

                  {/* Deal value */}
                  {contact.dealValue && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: DS.success }}>
                      {contact.dealValue}€/mois
                    </span>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <AgentAvatar slug={contact.agentSlug} size={20} />
                    <span style={{ fontSize: 10, color: DS.dim }}>{relativeDate(contact.createdAt)}</span>
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10, fontWeight: 500,
                            color: DS.dim, background: DS.elevated,
                            borderRadius: 999, padding: "1px 8px",
                            border: `1px solid ${DS.border}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}

            {cards.length === 0 && (
              <div
                style={{
                  padding: 20, borderRadius: DS.radiusCard,
                  border: `1px dashed ${DS.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 12, color: DS.dim }}>Aucun contact</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Segments View ────────────────────────────────────────────────────────────

const SAVED_SEGMENTS = [
  { id: "s1", label: "Kiné", filter: (c: Contact) => c.tags.includes("kiné"), count: 0 },
  { id: "s2", label: "Contacts chauds", filter: (c: Contact) => c.status === "Proposition" || c.status === "Qualifié", count: 0 },
  { id: "s3", label: "Gagnés ce mois", filter: (c: Contact) => c.status === "Gagné", count: 0 },
  { id: "s4", label: "Sans réponse", filter: (c: Contact) => c.status === "Contacté", count: 0 },
  { id: "s5", label: "Restauration", filter: (c: Contact) => c.tags.includes("restauration"), count: 0 },
]

function SegmentsView({
  contacts,
  onSegmentClick,
}: {
  contacts: Contact[]
  onSegmentClick: (filter: (c: Contact) => boolean, label: string) => void
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {SAVED_SEGMENTS.map((seg) => {
        const matchCount = contacts.filter(seg.filter).length
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => onSegmentClick(seg.filter, seg.label)}
            style={{
              textAlign: "left",
              padding: "18px 20px",
              borderRadius: DS.radiusCard,
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              cursor: "pointer",
              transition: "all 150ms ease",
              display: "flex", flexDirection: "column", gap: 8,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = DS.elevated
              el.style.borderColor = `${DS.orange}44`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = DS.surface
              el.style.borderColor = DS.border
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: DS.orange }}>
              {matchCount}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: DS.text }}>{seg.label}</span>
            <span style={{ fontSize: 11, color: DS.muted }}>Voir les contacts →</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── ColHeader (top-level to avoid react-hooks/static-components) ────────────

function ColHeader({
  label,
  sortable,
  activeSortKey,
  activeSortDir,
  onSort,
}: {
  label: string
  sortable?: SortKey
  activeSortKey: SortKey
  activeSortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = sortable !== undefined && activeSortKey === sortable
  return (
    <th
      style={{
        padding: "12px 14px",
        textAlign: "left",
        fontSize: 11,
        fontWeight: 600,
        color: active ? DS.orange : DS.dim,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none",
      }}
      onClick={sortable ? () => onSort(sortable) : undefined}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {sortable && active && (
          activeSortDir === "asc"
            ? <ChevronUp size={12} aria-hidden />
            : <ChevronDown size={12} aria-hidden />
        )}
      </span>
    </th>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("contacts")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "">("")
  const [agentFilter, setAgentFilter] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("lastContact")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [hoverRowId, setHoverRowId] = useState<string | null>(null)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [editContact, setEditContact] = useState<Contact | null | "new">(null)
  const [bulkAction, setBulkAction] = useState("")
  const [csvImporting, setCsvImporting] = useState(false)
  const csvInputRef = React.useRef<HTMLInputElement>(null)

  // ── Fetch contacts from API ──
  useEffect(() => {
    setLoadingContacts(true)
    fetch("/api/crm/contacts")
      .then((r) => r.json())
      .then((d: { contacts?: Contact[] }) => {
        setContacts(d.contacts ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingContacts(false))
  }, [])

  // ── Derived stats ──
  const totalContacts = contacts.length
  const enCours = contacts.filter((c) => ["Contacté", "Qualifié", "Proposition"].includes(c.status)).length
  const thisMonth = new Date().toISOString().slice(0, 7)
  const gagnesMonth = contacts.filter((c) => c.status === "Gagné" && c.lastContact.startsWith(thisMonth)).length
  const tauxConversion = totalContacts > 0
    ? Math.round((contacts.filter((c) => c.status === "Gagné").length / totalContacts) * 100)
    : 0

  // ── Filtered + sorted contacts ──
  const filteredContacts = useMemo(() => {
    let result = contacts

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (agentFilter) {
      result = result.filter((c) => c.agentSlug === agentFilter)
    }

    result = [...result].sort((a, b) => {
      let av: string = ""
      let bv: string = ""
      if (sortKey === "name") {
        av = `${a.lastName} ${a.firstName}`
        bv = `${b.lastName} ${b.firstName}`
      } else if (sortKey === "company") {
        av = a.company
        bv = b.company
      } else if (sortKey === "status") {
        av = a.status
        bv = b.status
      } else if (sortKey === "lastContact") {
        av = a.lastContact
        bv = b.lastContact
      } else if (sortKey === "agent") {
        av = a.agentSlug
        bv = b.agentSlug
      }
      const cmp = av.localeCompare(bv)
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [contacts, search, statusFilter, agentFilter, sortKey, sortDir])

  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE)
  const pagedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Sort toggle ──
  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setSortDir("desc")
      return key
    })
    setPage(1)
  }, [])

  // ── Selection ──
  function toggleSelectAll() {
    if (selected.size === pagedContacts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pagedContacts.map((c) => c.id)))
    }
  }
  function toggleSelectOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Bulk actions ──
  async function applyBulkAction() {
    if (!bulkAction || selected.size === 0) return
    const ids = [...selected]
    if (bulkAction === "delete") {
      setContacts((prev) => prev.filter((c) => !selected.has(c.id)))
      setSelected(new Set())
      if (detailContact && selected.has(detailContact.id)) setDetailContact(null)
      await Promise.all(ids.map((id) => fetch(`/api/crm/contacts/${id}`, { method: "DELETE" }).catch(() => {})))
    } else if (STATUS_OPTIONS.includes(bulkAction as ContactStatus)) {
      setContacts((prev) =>
        prev.map((c) =>
          selected.has(c.id) ? { ...c, status: bulkAction as ContactStatus } : c
        )
      )
      setSelected(new Set())
      await Promise.all(ids.map((id) => fetch(`/api/crm/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkAction }),
      }).catch(() => {})))
    } else if (AGENT_OPTIONS.some((a) => a.slug === bulkAction)) {
      setContacts((prev) =>
        prev.map((c) =>
          selected.has(c.id) ? { ...c, agentSlug: bulkAction } : c
        )
      )
      setSelected(new Set())
      await Promise.all(ids.map((id) => fetch(`/api/crm/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: bulkAction }),
      }).catch(() => {})))
    }
    setBulkAction("")
  }

  // ── CSV Import ──
  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setCsvImporting(true)
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const headers = lines[0]?.toLowerCase().split(",").map(h => h.trim().replace(/"/g, "")) ?? []
    const getCol = (row: string[], names: string[]) => {
      for (const n of names) {
        const idx = headers.indexOf(n)
        if (idx >= 0) return row[idx]?.replace(/"/g, "").trim() ?? ""
      }
      return ""
    }
    const newContacts: Contact[] = []
    for (const line of lines.slice(1)) {
      const cols = line.split(",")
      const firstName = getCol(cols, ["prenom", "firstname", "first_name", "prénom", "nom"])
      const lastName = getCol(cols, ["nom", "lastname", "last_name"])
      if (!firstName && !lastName) continue
      try {
        const res = await fetch("/api/crm/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName || lastName,
            lastName: firstName ? lastName : "",
            company: getCol(cols, ["entreprise", "company", "société"]),
            email: getCol(cols, ["email", "mail", "e-mail"]),
            phone: getCol(cols, ["telephone", "phone", "tel", "téléphone"]),
            status: getCol(cols, ["statut", "status"]) || "Nouveau",
          }),
        })
        const json = (await res.json()) as { contact?: Contact }
        if (json.contact) newContacts.push(json.contact)
      } catch { /* skip invalid row */ }
    }
    if (newContacts.length > 0) setContacts(prev => [...newContacts, ...prev])
    setCsvImporting(false)
  }

  // ── CRUD ──
  async function handleSaveContact(data: Partial<Contact>) {
    if (editContact === "new") {
      try {
        const res = await fetch("/api/crm/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const json = (await res.json()) as { contact?: Contact }
        if (json.contact) setContacts((prev) => [json.contact!, ...prev])
      } catch { /* ignore */ }
    } else if (editContact) {
      try {
        const res = await fetch(`/api/crm/contacts/${editContact.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const json = (await res.json()) as { contact?: Contact }
        if (json.contact) {
          setContacts((prev) => prev.map((c) => (c.id === editContact.id ? json.contact! : c)))
          if (detailContact?.id === editContact.id) setDetailContact(json.contact!)
        }
      } catch { /* ignore */ }
    }
    setEditContact(null)
  }

  async function handleDeleteContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    if (detailContact?.id === id) setDetailContact(null)
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
    try {
      await fetch(`/api/crm/contacts/${id}`, { method: "DELETE" })
    } catch { /* ignore */ }
  }

  async function handleStatusChange(id: string, status: ContactStatus) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    setDetailContact((prev) => (prev?.id === id ? { ...prev, status } : prev))
    try {
      await fetch(`/api/crm/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    } catch { /* ignore */ }
  }

  async function handleAgentChange(id: string, agentSlug: string) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, agentSlug } : c)))
    setDetailContact((prev) => (prev?.id === id ? { ...prev, agentSlug } : prev))
    try {
      await fetch(`/api/crm/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug }),
      })
    } catch { /* ignore */ }
  }

  function handleNoteAdd(id: string, content: string) {
    const newItem: ActivityItem = {
      id: `n${Date.now()}`,
      type: "note",
      content,
      date: new Date().toISOString().slice(0, 10),
    }
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, activity: [...c.activity, newItem] } : c
      )
    )
    setDetailContact((prev) =>
      prev?.id === id ? { ...prev, activity: [...prev.activity, newItem] } : prev
    )
  }

  // ── Tab style helper (pure) ──
  function getTabStyle(id: TabId): React.CSSProperties {
    const active = activeTab === id
    return {
      padding: "8px 18px",
      borderRadius: DS.radiusBtn,
      border: active ? `1px solid ${DS.orange}55` : "1px solid transparent",
      background: active ? `${DS.orange}18` : "transparent",
      color: active ? DS.orange : DS.muted,
      fontSize: 13,
      fontWeight: active ? 600 : 500,
      cursor: "pointer",
      transition: "all 150ms ease",
    }
  }

  return (
    <>
      <div
        style={{
          padding: "28px 32px",
          maxWidth: detailContact ? "calc(100% - 420px)" : 1140,
          transition: "max-width 0.25s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: DS.text, margin: "0 0 4px", letterSpacing: "-0.03em" }}>
              CRM
            </h1>
            <p style={{ fontSize: 13, color: DS.muted, margin: 0 }}>
              Gérez vos contacts et votre pipeline commercial
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleCSVImport}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={csvImporting}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: DS.radiusBtn,
                border: `1px solid ${DS.border}`, background: DS.surface,
                color: DS.text, fontSize: 13, fontWeight: 500,
                cursor: csvImporting ? "not-allowed" : "pointer",
                opacity: csvImporting ? 0.6 : 1,
              }}
            >
              <Upload size={14} aria-hidden />
              {csvImporting ? "Import…" : "Importer CSV"}
            </button>
            <button
              type="button"
              onClick={() => setEditContact("new")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: DS.radiusBtn,
                border: "none", background: DS.orange,
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={14} aria-hidden />
              Ajouter un contact
            </button>
          </div>
        </div>

        {/* ── Stats rapides ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Total contacts", value: totalContacts, color: DS.orange },
            { label: "En cours", value: enCours, color: "#22D3EE" },
            { label: "Gagnés ce mois", value: gagnesMonth, color: DS.success },
            { label: "Taux de conversion", value: `${tauxConversion}%`, color: "#8B5CF6" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: DS.radiusCard,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: DS.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex", gap: 4, marginBottom: 20,
            borderBottom: `1px solid ${DS.border}`, paddingBottom: 12,
          }}
        >
          {(["contacts", "pipeline", "segments"] as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              style={getTabStyle(tab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "contacts" ? "Contacts" : tab === "pipeline" ? "Pipeline" : "Segments"}
            </button>
          ))}
        </div>

        {/* ── Pipeline view ── */}
        {activeTab === "pipeline" && (
          <KanbanView
            contacts={filteredContacts}
            onCardClick={(c) => setDetailContact(c)}
          />
        )}

        {/* ── Segments view ── */}
        {activeTab === "segments" && (
          <SegmentsView
            contacts={contacts}
            onSegmentClick={(filter, label) => {
              setActiveTab("contacts")
              setSearch("")
              setStatusFilter("")
              setAgentFilter("")
              // Apply segment by switching to contacts tab with filtered data via a custom approach
              // We'll use search trick — actually apply filter via status
              const matched = contacts.filter(filter)
              if (label === "Kiné" || label === "Restauration") {
                // tag-based: set search to tag
                setSearch(label === "Kiné" ? "kiné" : "restauration")
              } else if (label === "Contacts chauds") {
                setStatusFilter("Qualifié")
              } else if (label === "Gagnés ce mois") {
                setStatusFilter("Gagné")
              } else if (label === "Sans réponse") {
                setStatusFilter("Contacté")
              }
              void matched
            }}
          />
        )}

        {/* ── Contacts table ── */}
        {activeTab === "contacts" && (
          <>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
                <Search
                  size={14}
                  color={DS.dim}
                  style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Rechercher un contact..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  style={{
                    width: "100%", padding: "9px 12px 9px 34px",
                    borderRadius: DS.radiusBtn, border: `1px solid ${DS.border}`,
                    background: DS.surface, color: DS.text, fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as ContactStatus | ""); setPage(1) }}
                style={{
                  padding: "9px 12px", borderRadius: DS.radiusBtn,
                  border: `1px solid ${DS.border}`, background: DS.surface,
                  color: statusFilter ? DS.text : DS.muted, fontSize: 13, outline: "none",
                }}
              >
                <option value="">Tous les statuts</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Agent filter */}
              <select
                value={agentFilter}
                onChange={(e) => { setAgentFilter(e.target.value); setPage(1) }}
                style={{
                  padding: "9px 12px", borderRadius: DS.radiusBtn,
                  border: `1px solid ${DS.border}`, background: DS.surface,
                  color: agentFilter ? DS.text : DS.muted, fontSize: 13, outline: "none",
                }}
              >
                <option value="">Tous les agents</option>
                {AGENT_OPTIONS.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.label}</option>
                ))}
              </select>

              {/* Reset filters */}
              {(search || statusFilter || agentFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setStatusFilter(""); setAgentFilter(""); setPage(1) }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "9px 12px", borderRadius: DS.radiusBtn,
                    border: `1px solid ${DS.border}`, background: "transparent",
                    color: DS.muted, fontSize: 12, cursor: "pointer",
                  }}
                >
                  <X size={12} aria-hidden />
                  Effacer
                </button>
              )}
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", marginBottom: 12,
                  borderRadius: DS.radiusBtn,
                  background: `${DS.orange}11`,
                  border: `1px solid ${DS.orange}33`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.orange }}>
                  {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: DS.radiusBtn,
                    border: `1px solid ${DS.border}`, background: "#111113",
                    color: DS.text, fontSize: 12, outline: "none",
                  }}
                >
                  <option value="">Choisir une action...</option>
                  <optgroup label="Changer le statut">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>→ {s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Assigner à un agent">
                    {AGENT_OPTIONS.map((a) => (
                      <option key={a.slug} value={a.slug}>Agent : {a.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Danger">
                    <option value="delete">Supprimer la sélection</option>
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={applyBulkAction}
                  disabled={!bulkAction}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 14px", borderRadius: DS.radiusBtn,
                    border: "none", background: bulkAction ? DS.orange : DS.border,
                    color: "#fff", fontSize: 12, fontWeight: 600,
                    cursor: bulkAction ? "pointer" : "not-allowed",
                  }}
                >
                  <Check size={12} aria-hidden />
                  Appliquer
                </button>
                <button
                  type="button"
                  onClick={() => { setSelected(new Set()); setBulkAction("") }}
                  style={{
                    marginLeft: "auto", background: "transparent", border: "none",
                    cursor: "pointer", color: DS.dim, display: "flex",
                  }}
                  aria-label="Annuler la sélection"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            )}

            {/* Table */}
            <div
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: DS.radiusCard,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <th style={{ padding: "12px 14px", width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selected.size === pagedContacts.length && pagedContacts.length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Tout sélectionner"
                          style={{ cursor: "pointer", accentColor: DS.orange }}
                        />
                      </th>
                      <ColHeader label="Nom" sortable="name" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Entreprise" sortable="company" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Email" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Téléphone" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Statut" sortable="status" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Dernier contact" sortable="lastContact" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <ColHeader label="Agent" sortable="agent" activeSortKey={sortKey} activeSortDir={sortDir} onSort={toggleSort} />
                      <th style={{ padding: "12px 14px", width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedContacts.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            textAlign: "center", padding: 48,
                            color: DS.dim, fontSize: 14,
                          }}
                        >
                          {loadingContacts
                            ? "Chargement…"
                            : contacts.length === 0
                            ? "Aucun prospect pour l'instant. Importe des contacts ou crée-en un."
                            : "Aucun contact trouvé"}
                        </td>
                      </tr>
                    )}
                    {pagedContacts.map((contact) => {
                      const isHovered = hoverRowId === contact.id
                      const isSelected = selected.has(contact.id)
                      return (
                        <tr
                          key={contact.id}
                          onMouseEnter={() => setHoverRowId(contact.id)}
                          onMouseLeave={() => setHoverRowId(null)}
                          style={{
                            borderBottom: `1px solid ${DS.border}`,
                            background: isSelected
                              ? `${DS.orange}08`
                              : isHovered
                              ? DS.elevated
                              : "transparent",
                            transition: "background 0.1s",
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "12px 14px", width: 40 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(contact.id)}
                              aria-label={`Sélectionner ${contact.firstName} ${contact.lastName}`}
                              style={{ cursor: "pointer", accentColor: DS.orange }}
                            />
                          </td>

                          {/* Name */}
                          <td
                            style={{ padding: "12px 14px", cursor: "pointer" }}
                            onClick={() => setDetailContact(contact)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <ContactInitialsAvatar
                                firstName={contact.firstName}
                                lastName={contact.lastName}
                                size={32}
                              />
                              <span style={{ fontSize: 13, fontWeight: 600, color: DS.text, whiteSpace: "nowrap" }}>
                                {contact.firstName} {contact.lastName}
                              </span>
                            </div>
                          </td>

                          {/* Company */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 13, color: DS.muted, whiteSpace: "nowrap" }}>
                              {contact.company}
                            </span>
                          </td>

                          {/* Email */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 13, color: DS.muted }}>
                              {contact.email || "—"}
                            </span>
                          </td>

                          {/* Phone */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 13, color: DS.muted, whiteSpace: "nowrap" }}>
                              {contact.phone || "—"}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "12px 14px" }}>
                            <StatusPill status={contact.status} />
                          </td>

                          {/* Last contact */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 13, color: DS.muted, whiteSpace: "nowrap" }}>
                              {relativeDate(contact.lastContact)}
                            </span>
                          </td>

                          {/* Agent */}
                          <td style={{ padding: "12px 14px" }}>
                            <AgentAvatar slug={contact.agentSlug} size={28} />
                          </td>

                          {/* Row actions */}
                          <td style={{ padding: "12px 10px", width: 48 }}>
                            {isHovered && (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => setDetailContact(contact)}
                                  aria-label="Voir le contact"
                                  title="Voir"
                                  style={{
                                    background: "transparent", border: "none",
                                    cursor: "pointer", color: DS.muted, padding: 5,
                                    borderRadius: 6, display: "flex",
                                  }}
                                >
                                  <Eye size={14} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditContact(contact); setDetailContact(null) }}
                                  aria-label="Modifier le contact"
                                  title="Modifier"
                                  style={{
                                    background: "transparent", border: "none",
                                    cursor: "pointer", color: DS.muted, padding: 5,
                                    borderRadius: 6, display: "flex",
                                  }}
                                >
                                  <Pencil size={14} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteContact(contact.id)}
                                  aria-label="Supprimer le contact"
                                  title="Supprimer"
                                  style={{
                                    background: "transparent", border: "none",
                                    cursor: "pointer", color: DS.danger, padding: 5,
                                    borderRadius: 6, display: "flex",
                                  }}
                                >
                                  <Trash2 size={14} aria-hidden />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderTop: `1px solid ${DS.border}`,
                  }}
                >
                  <span style={{ fontSize: 12, color: DS.muted }}>
                    {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""}
                    {" "}&mdash;{" "}
                    Page {page} / {totalPages}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Page précédente"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: DS.radiusBtn,
                        border: `1px solid ${DS.border}`, background: "transparent",
                        color: page === 1 ? DS.dim : DS.text,
                        cursor: page === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      <ChevronLeft size={14} aria-hidden />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={page === p ? "page" : undefined}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 32, height: 32, borderRadius: DS.radiusBtn,
                          border: `1px solid ${page === p ? DS.orange : DS.border}`,
                          background: page === p ? `${DS.orange}22` : "transparent",
                          color: page === p ? DS.orange : DS.text,
                          fontSize: 13, fontWeight: page === p ? 700 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Page suivante"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: DS.radiusBtn,
                        border: `1px solid ${DS.border}`, background: "transparent",
                        color: page === totalPages ? DS.dim : DS.text,
                        cursor: page === totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      <ChevronRight size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Detail Panel (slide-in right) ── */}
      {detailContact && (
        <DetailPanel
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onEdit={() => { setEditContact(detailContact); setDetailContact(null) }}
          onStatusChange={(status) => handleStatusChange(detailContact.id, status)}
          onAgentChange={(agentSlug) => handleAgentChange(detailContact.id, agentSlug)}
          onNoteAdd={(content) => handleNoteAdd(detailContact.id, content)}
        />
      )}

      {/* ── Modal (add / edit) ── */}
      {editContact !== null && (
        <ContactModal
          contact={editContact === "new" ? null : editContact}
          onClose={() => setEditContact(null)}
          onSave={handleSaveContact}
        />
      )}

      {/* ── Extra row actions hover fix: keep element stacking ── */}
      <style>{`
        input[type="checkbox"] { accent-color: ${DS.orange}; }
        select option { background: #111113; color: ${DS.text}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </>
  )
}
