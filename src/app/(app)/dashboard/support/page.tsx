"use client"

import React, { useState, useEffect, useCallback, CSSProperties } from "react"
import Link from "next/link"
import {
  Mail,
  MessageCircle,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  X,
  Clock,
  Trash2,
  Paperclip,
  ImageIcon,
  FileText as FileTextIcon,
} from "lucide-react"
import { TicketChat } from "./_components/TicketChat"

// ─── Design tokens ─────────────────────────────────────────────────────────────

const S = {
  bg: "#111114",
  card: {
    background: "rgba(255,255,255,0.042)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "24px",
  } satisfies CSSProperties,
  cardHover: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  } satisfies CSSProperties,
  text: "#FAFAFA",
  textMuted: "rgba(250,250,250,0.45)",
  accent: "#E86F4D",
  inputBase: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#FAFAFA",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  } satisfies CSSProperties,
  btnPrimary: {
    background: "linear-gradient(135deg, #E86F4D, #C8522F)",
    border: "none",
    borderRadius: 10,
    color: "#FAFAFA",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    height: 40,
    paddingLeft: 20,
    paddingRight: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "opacity 150ms ease",
  } satisfies CSSProperties,
}

// ─── Statuts ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
}

const STATUS_COLORS: Record<string, string> = {
  open: "#F59E0B",
  in_progress: "#3B82F6",
  resolved: "#10B981",
  closed: "#6B7280",
}

// ─── Types ──────────────────────────────────────────────────────────────────────

type FormState = "idle" | "loading" | "sent" | "error"
type Tab = "new" | "list"

interface TicketForm {
  subject: string
  category: string
  priority: string
  description: string
}

const MAX_FILES = 5
const MAX_FILE_SIZE_MB = 10
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"]

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon size={13} aria-hidden />
  return <FileTextIcon size={13} aria-hidden />
}

function FileDropzone({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false
      return true
    })
    const merged = [...files, ...valid].slice(0, MAX_FILES)
    onChange(merged)
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt de fichiers"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "22px 16px",
          borderRadius: 10,
          border: `1.5px dashed ${dragging ? "rgba(232,111,77,0.7)" : "rgba(255,255,255,0.12)"}`,
          background: dragging ? "rgba(232,111,77,0.06)" : "rgba(255,255,255,0.03)",
          cursor: "pointer",
          transition: "border-color 150ms, background 150ms",
          outline: "none",
        }}
      >
        <Paperclip size={20} style={{ color: "rgba(250,250,250,0.3)" }} aria-hidden />
        <p style={{ fontSize: 13, color: "rgba(250,250,250,0.5)", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
          Glisse tes fichiers ici ou{" "}
          <span style={{ color: "#E86F4D", fontWeight: 600 }}>clique pour sélectionner</span>
        </p>
        <p style={{ fontSize: 11, color: "rgba(250,250,250,0.3)", margin: 0 }}>
          Images, PDF — max {MAX_FILE_SIZE_MB}Mo · {MAX_FILES} fichiers maximum
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Fichiers sélectionnés */}
      {files.length > 0 && (
        <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
              }}
            >
              <span style={{ color: "#E86F4D", flexShrink: 0 }}>
                <FileIcon mime={f.type} />
              </span>
              <span style={{ fontSize: 12.5, color: "#FAFAFA", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.name}
              </span>
              <span style={{ fontSize: 11, color: "rgba(250,250,250,0.35)", flexShrink: 0 }}>
                {(f.size / 1024 / 1024).toFixed(1)}Mo
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Supprimer ${f.name}`}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(250,250,250,0.3)", display: "flex", alignItems: "center",
                  padding: 2, borderRadius: 4, flexShrink: 0,
                  transition: "color 120ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.3)" }}
              >
                <X size={13} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface SupportTicket {
  id: string
  ticketId: string
  subject: string
  category: string
  priority: string
  description: string
  pageUrl: string | null
  userEmail: string | null
  status: string
  createdAt: string
  updatedAt: string
}

// ─── FAQ data ───────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Comment activer un agent ?",
    a: "Va dans Agents IA → sélectionne ton agent → configure les intégrations requises dans l'onglet Paramètres.",
  },
  {
    q: "Mon agent ne répond pas, que faire ?",
    a: "Vérifie que les clés API sont configurées dans Intégrations. Si le problème persiste, crée un ticket ci-dessous.",
  },
  {
    q: "Comment changer mon plan ?",
    a: "Va dans Facturation → clique sur 'Changer de plan'. Prend effet immédiatement.",
  },
  {
    q: "Mes emails ne partent pas avec Marine/Mae ?",
    a: "Vérifie que l'intégration Gmail est connectée et que les permissions email sont accordées.",
  },
  {
    q: "Comment exporter mes données ?",
    a: "Va dans Paramètres → Danger Zone → 'Exporter mes données'. Un fichier JSON sera téléchargé.",
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 30) return `il y a ${days} j`
  const months = Math.floor(days / 30)
  if (months === 1) return "il y a 1 mois"
  return `il y a ${months} mois`
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: S.text, margin: 0, marginBottom: subtitle ? 6 : 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13.5, color: S.textMuted, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
      )}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 0",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: S.text, lineHeight: 1.4 }}>{q}</span>
        {open
          ? <ChevronUp size={15} style={{ color: S.accent, flexShrink: 0 }} />
          : <ChevronDown size={15} style={{ color: S.textMuted, flexShrink: 0 }} />
        }
      </button>

      <div
        style={{
          maxHeight: open ? 200 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease-out",
        }}
      >
        <p style={{
          fontSize: 13.5,
          color: S.textMuted,
          lineHeight: 1.6,
          margin: 0,
          paddingBottom: 16,
        }}>
          {a}
        </p>
      </div>
    </div>
  )
}

// ─── TicketSkeleton ─────────────────────────────────────────────────────────────

function TicketSkeleton() {
  const bar = (w: string | number, h = 12): CSSProperties => ({
    background: "rgba(255,255,255,0.06)",
    borderRadius: 6,
    height: h,
    width: w,
    animation: "pulse 1.5s ease-in-out infinite",
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            ...S.card,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={bar(60, 20)} />
            <div style={bar(100)} />
          </div>
          <div style={bar("70%", 14)} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={bar(64)} />
            <div style={bar(64)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TicketDetailPanel ──────────────────────────────────────────────────────────

function TicketDetailPanel({
  ticket,
  onClose,
}: {
  ticket: SupportTicket
  onClose: () => void
}) {
  const statusColor = STATUS_COLORS[ticket.status] ?? "#6B7280"
  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 40,
        }}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Détail ticket ${ticket.ticketId}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: "100vw",
          background: "#14141C",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
          overflowY: "auto",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: S.textMuted, margin: 0, marginBottom: 4, textTransform: "uppercase" }}>
              {ticket.ticketId}
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: S.text, margin: 0, lineHeight: 1.3 }}>
              {ticket.subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} style={{ color: S.text }} />
          </button>
        </div>

        {/* Meta rows */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "0 16px",
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Statut",
              value: (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: statusColor,
                    background: `${statusColor}20`,
                    borderRadius: 20,
                    padding: "3px 10px",
                  }}
                >
                  {statusLabel}
                </span>
              ),
            },
            { label: "Catégorie", value: ticket.category },
            { label: "Priorité", value: ticket.priority },
            { label: "Date", value: formatRelativeDate(ticket.createdAt) },
            ...(ticket.userEmail ? [{ label: "Email", value: ticket.userEmail }] : []),
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 12.5, color: S.textMuted, flexShrink: 0 }}>{label}</span>
              {typeof value === "string" ? (
                <span style={{ fontSize: 13, color: S.text, fontWeight: 500, textAlign: "right" }}>{value}</span>
              ) : value}
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: S.textMuted, margin: 0, marginBottom: 10, textTransform: "uppercase" }}>
            Description
          </p>
          <p style={{ fontSize: 13.5, color: S.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
            {ticket.description}
          </p>
        </div>

        {/* Pièces jointes */}
        {ticket.pageUrl && (() => {
          let urls: string[] = []
          try { urls = JSON.parse(ticket.pageUrl) as string[] } catch { urls = [ticket.pageUrl] }
          if (!urls.length) return null
          return (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: S.textMuted, margin: 0, marginBottom: 10, textTransform: "uppercase" }}>
                Pièces jointes
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {urls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "7px 10px", borderRadius: 8,
                        background: "rgba(232,111,77,0.07)", border: "1px solid rgba(232,111,77,0.15)",
                        fontSize: 12.5, color: S.accent, textDecoration: "none",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      <Paperclip size={12} aria-hidden />
                      {decodeURIComponent(url.split("/").pop() ?? url)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}

        {/* Chat en direct */}
        <div style={{ marginTop: 24 }}>
          <TicketChat ticketId={ticket.ticketId} />
        </div>
      </div>
    </>
  )
}

// ─── TicketRow ──────────────────────────────────────────────────────────────────

function TicketRow({
  ticket,
  onSelect,
  onDelete,
}: {
  ticket: SupportTicket
  onSelect: (t: SupportTicket) => void
  onDelete: (ticketId: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const statusColor = STATUS_COLORS[ticket.status] ?? "#6B7280"
  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/support/ticket/${ticket.ticketId}`, { method: "DELETE" })
      if (res.ok) {
        onDelete(ticket.ticketId)
      }
    } catch {
      // Erreur silencieuse — l'UI reste inchangée
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      style={{
        ...S.card,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "background 150ms ease, border-color 150ms ease",
        ...(hovered ? S.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(ticket)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(ticket) }}
      aria-label={`Voir ticket ${ticket.ticketId} — ${ticket.subject}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Statut badge */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: statusColor,
              background: `${statusColor}20`,
              borderRadius: 20,
              padding: "2px 9px",
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
          {/* Ticket ID */}
          <span style={{ fontSize: 11, color: S.textMuted, fontWeight: 600 }}>{ticket.ticketId}</span>
        </div>

        {/* Date */}
        <span style={{ fontSize: 11.5, color: S.textMuted, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} aria-hidden />
          {formatRelativeDate(ticket.createdAt)}
        </span>
      </div>

      {/* Sujet */}
      <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0, marginBottom: 8, lineHeight: 1.4 }}>
        {ticket.subject}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Catégorie badge */}
          <span
            style={{
              fontSize: 11,
              color: "rgba(250,250,250,0.55)",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              padding: "2px 8px",
              fontWeight: 500,
            }}
          >
            {ticket.category}
          </span>
          {/* Priorité badge */}
          <span
            style={{
              fontSize: 11,
              color: "rgba(250,250,250,0.55)",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              padding: "2px 8px",
              fontWeight: 500,
            }}
          >
            {ticket.priority}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: S.accent, fontWeight: 600, flexShrink: 0 }}>
            Voir détails →
          </span>

          {/* Bouton suppression inline */}
          {confirmDelete ? (
            <div
              style={{ display: "flex", alignItems: "center", gap: 6 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span style={{ fontSize: 11.5, color: "rgba(239,68,68,0.9)", whiteSpace: "nowrap" }}>
                Supprimer ce ticket ?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Confirmer la suppression"
                style={{
                  background: deleting ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 6,
                  color: "#EF4444",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "3px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minHeight: 28,
                  transition: "background 150ms ease",
                }}
              >
                {deleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Confirmer"}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                aria-label="Annuler la suppression"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "rgba(250,250,250,0.55)",
                  cursor: "pointer",
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: "3px 10px",
                  minHeight: 28,
                  transition: "background 150ms ease",
                }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              aria-label={`Supprimer le ticket ${ticket.ticketId}`}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(250,250,250,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                borderRadius: 6,
                transition: "color 150ms ease, background 150ms ease",
                minHeight: 28,
                minWidth: 28,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.8)"
                ;(e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.25)"
                ;(e.currentTarget as HTMLElement).style.background = "transparent"
              }}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TicketsList ────────────────────────────────────────────────────────────────

function TicketsList({ onNewTicket }: { onNewTicket: () => void }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/support/ticket")
      const data = (await res.json()) as { tickets: SupportTicket[] }
      setTickets(data.tickets ?? [])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  // Retire le ticket supprimé de la liste locale
  const handleDelete = useCallback((ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId))
    // Fermer le panneau si le ticket supprimé était sélectionné
    setSelectedTicket((prev) => (prev?.ticketId === ticketId ? null : prev))
  }, [])

  if (loading) return <TicketSkeleton />

  if (tickets.length === 0) {
    return (
      <div
        style={{
          ...S.card,
          textAlign: "center",
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <MessageCircle size={32} style={{ color: S.textMuted, opacity: 0.5 }} />
        <p style={{ fontSize: 14, color: S.textMuted, margin: 0, lineHeight: 1.6 }}>
          Aucun ticket pour l&apos;instant.
          <br />
          <button
            type="button"
            onClick={onNewTicket}
            style={{ background: "none", border: "none", cursor: "pointer", color: S.accent, fontWeight: 600, fontSize: 14, padding: 0 }}
          >
            Crée ton premier ticket ci-dessous.
          </button>
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} onSelect={setSelectedTicket} onDelete={handleDelete} />
        ))}
      </div>

      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("new")
  const [ticketCount, setTicketCount] = useState<number | null>(null)

  const [form, setForm] = useState<TicketForm>({
    subject: "",
    category: "",
    priority: "Normale",
    description: "",
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [formState, setFormState] = useState<FormState>("idle")
  const [ticketId, setTicketId] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const formRef = React.useRef<HTMLDivElement>(null)

  // Charge le nombre de tickets pour l'afficher dans l'onglet
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/support/ticket")
        const data = (await res.json()) as { tickets: SupportTicket[] }
        setTicketCount(data.tickets?.length ?? 0)
      } catch {
        setTicketCount(0)
      }
    })()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function scrollToForm() {
    setActiveTab("new")
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formState === "loading") return

    // Validation côté client
    if (!form.subject.trim() || form.subject.trim().length < 3) {
      setErrorMsg("Le sujet doit faire au moins 3 caractères.")
      setFormState("error")
      return
    }
    if (!form.category) {
      setErrorMsg("Sélectionne une catégorie.")
      setFormState("error")
      return
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setErrorMsg("La description doit faire au moins 10 caractères.")
      setFormState("error")
      return
    }

    setFormState("loading")
    setErrorMsg("")

    try {
      const fd = new FormData()
      fd.append("subject", form.subject)
      fd.append("category", form.category)
      fd.append("priority", form.priority)
      fd.append("description", form.description)
      attachments.forEach(f => fd.append("files", f))

      const res = await fetch("/api/support/ticket", { method: "POST", body: fd })
      const data = (await res.json()) as { success: boolean; ticketId?: string; error?: string }

      if (data.success && data.ticketId) {
        setTicketId(data.ticketId)
        setFormState("sent")
        setTicketCount((n) => (n ?? 0) + 1)
      } else {
        setErrorMsg(data.error ?? "Erreur inconnue — réessaie.")
        setFormState("error")
      }
    } catch {
      setErrorMsg("Problème réseau — vérifie ta connexion et réessaie.")
      setFormState("error")
    }
  }

  const inputStyle = S.inputBase
  const labelStyle: CSSProperties = {
    fontSize: 12.5,
    fontWeight: 500,
    color: "rgba(250,250,250,0.6)",
    marginBottom: 6,
    display: "block",
    letterSpacing: "0.02em",
  }

  return (
    <main
      style={{
        background: S.bg,
        minHeight: "100vh",
        padding: "32px 24px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* ── Section 1 : Hero header ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: S.text, margin: 0, marginBottom: 8, letterSpacing: "-0.02em" }}>
              Support &amp; Aide
            </h1>
            <p style={{ fontSize: 15, color: S.textMuted, margin: 0, lineHeight: 1.6 }}>
              Nous sommes là pour t&apos;aider. Réponse sous 24h en semaine.
            </p>
          </div>

          {/* Statut badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(82,183,136,0.1)",
              border: "1px solid rgba(82,183,136,0.25)",
              borderRadius: 20,
              padding: "6px 12px",
              flexShrink: 0,
            }}
          >
            <Activity size={12} style={{ color: "#52B788" }} aria-hidden />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#52B788" }}>
              Tous les services opérationnels
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2 : 3 cards contact rapide ── */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Contact rapide" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {/* Email */}
          <a
            href="mailto:support@lynarisai.com"
            style={{ textDecoration: "none" }}
          >
            <ContactCard
              icon={<Mail size={18} style={{ color: S.accent }} />}
              title="Email"
              description="support@lynarisai.com"
              cta="Envoyer un email"
              ctaVariant="link"
            />
          </a>

          {/* Chat */}
          <button type="button" onClick={scrollToForm} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
            <ContactCard
              icon={<MessageCircle size={18} style={{ color: S.accent }} />}
              title="Ticket de support"
              description="Décris ton problème en détail"
              cta="Créer un ticket"
              ctaVariant="button"
            />
          </button>

          {/* Docs */}
          <Link href="/docs" style={{ textDecoration: "none" }}>
            <ContactCard
              icon={<BookOpen size={18} style={{ color: S.accent }} />}
              title="Documentation"
              description="Guides et tutoriels"
              cta="Consulter les docs"
              ctaVariant="link"
            />
          </Link>
        </div>
      </div>

      {/* ── Section 3 : Onglets ── */}
      <div style={{ marginBottom: 32 }}>
        {/* Tab bar */}
        <div
          role="tablist"
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 28,
          }}
        >
          {(
            [
              { id: "new" as Tab, label: "Nouveau ticket" },
              { id: "list" as Tab, label: `Mes tickets${ticketCount !== null ? ` (${ticketCount})` : ""}` },
            ] satisfies { id: Tab; label: string }[]
          ).map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${S.accent}` : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? S.text : S.textMuted,
                  transition: "color 150ms ease, border-color 150ms ease",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Onglet : Nouveau ticket ── */}
        {activeTab === "new" && (
          <div ref={formRef} style={{ scrollMarginTop: 24 }}>
            <SectionHeader
              title="Créer un ticket"
              subtitle="Notre équipe te répond dans les 24h ouvrées."
            />

            <div style={{ ...S.card }}>
              {formState === "sent" ? (
                /* Confirmation */
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <CheckCircle2 size={40} style={{ color: "#52B788", marginBottom: 16 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: S.text, margin: 0, marginBottom: 8 }}>
                    Ticket envoyé !
                  </h3>
                  <p style={{ fontSize: 14, color: S.textMuted, margin: 0, marginBottom: 16, lineHeight: 1.6 }}>
                    Ton ticket <strong style={{ color: S.accent }}>{ticketId}</strong> a bien été reçu.
                    <br />On te répond sous 24h ouvrées.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormState("idle")
                      setForm({ subject: "", category: "", priority: "Normale", description: "" })
                      setAttachments([])
                    }}
                    style={{ ...S.btnPrimary, margin: "0 auto" }}
                  >
                    Nouveau ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    {/* Sujet */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label htmlFor="subject" style={labelStyle}>Sujet *</label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        placeholder="Décris le problème en une ligne"
                        value={form.subject}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(232,111,77,0.5)" }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)" }}
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label htmlFor="category" style={labelStyle}>Catégorie *</label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={form.category}
                        onChange={handleChange}
                        style={{ ...inputStyle, appearance: "none", colorScheme: "dark" }}
                        onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "rgba(232,111,77,0.5)" }}
                        onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "rgba(255,255,255,0.08)" }}
                      >
                        <option value="" disabled>Sélectionner…</option>
                        <option value="Bug / Erreur">Bug / Erreur</option>
                        <option value="Problème de facturation">Problème de facturation</option>
                        <option value="Question sur un agent">Question sur un agent</option>
                        <option value="Intégration">Intégration</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    {/* Priorité */}
                    <div>
                      <label htmlFor="priority" style={labelStyle}>Priorité</label>
                      <select
                        id="priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        style={{ ...inputStyle, appearance: "none", colorScheme: "dark" }}
                        onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "rgba(232,111,77,0.5)" }}
                        onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "rgba(255,255,255,0.08)" }}
                      >
                        <option value="Faible">Faible</option>
                        <option value="Normale">Normale</option>
                        <option value="Haute">Haute</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label htmlFor="description" style={labelStyle}>Description *</label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        placeholder="Décris le problème en détail : étapes pour reproduire, comportement attendu vs observé…"
                        value={form.description}
                        onChange={handleChange}
                        rows={5}
                        style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(232,111,77,0.5)" }}
                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.08)" }}
                      />
                    </div>

                    {/* Pièces jointes */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>
                        Pièces jointes{" "}
                        <span style={{ color: S.textMuted, fontWeight: 400 }}>(optionnel)</span>
                      </label>
                      <FileDropzone files={attachments} onChange={setAttachments} />
                    </div>
                  </div>

                  {/* Erreur */}
                  {formState === "error" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 16,
                      }}
                    >
                      <AlertCircle size={14} style={{ color: "#F87171", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#F87171" }}>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={formState === "loading"}
                      style={{
                        ...S.btnPrimary,
                        opacity: formState === "loading" ? 0.65 : 1,
                        cursor: formState === "loading" ? "not-allowed" : "pointer",
                      }}
                    >
                      {formState === "loading" ? (
                        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Send size={14} />
                      )}
                      {formState === "loading" ? "Envoi…" : "Envoyer le ticket"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Onglet : Mes tickets ── */}
        {activeTab === "list" && (
          <div>
            <SectionHeader
              title="Mes tickets"
              subtitle="Historique de tes demandes de support."
            />
            <TicketsList onNewTicket={() => setActiveTab("new")} />
          </div>
        )}
      </div>

      {/* ── Section 4 : FAQ ── */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Questions fréquentes" />
        <div style={{ ...S.card, padding: "0 24px" }}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* ── Section 5 : Liens utiles ── */}
      <div>
        <SectionHeader title="Liens utiles" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <UsefulLink href="/docs" label="Documentation complète" description="Guides techniques et tutoriels" />
          <UsefulLink href="/changelog" label="Changelog" description="Nouvelles fonctionnalités" />
          <UsefulLink href="https://status.lynarisai.com" label="Statut des services" description="Uptime en temps réel" external />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </main>
  )
}

// ─── ContactCard ────────────────────────────────────────────────────────────────

function ContactCard({
  icon,
  title,
  description,
  cta,
  ctaVariant,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  ctaVariant: "link" | "button"
}) {
  const [hovered, setHovered] = useState(false)

  const baseStyle: CSSProperties = {
    ...S.card,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "background 150ms ease, border-color 150ms ease",
    height: "100%",
    ...(hovered ? S.cardHover : {}),
  }

  return (
    <div
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(232,111,77,0.1)",
          border: "1px solid rgba(232,111,77,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA", margin: 0, marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 12.5, color: "rgba(250,250,250,0.45)", margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "#E86F4D",
          marginTop: "auto",
          display: ctaVariant === "button" ? "inline-block" : "inline",
        }}
      >
        {cta} →
      </span>
    </div>
  )
}

// ─── UsefulLink ─────────────────────────────────────────────────────────────────

function UsefulLink({
  href,
  label,
  description,
  external = false,
}: {
  href: string
  label: string
  description: string
  external?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div
      style={{
        ...S.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        transition: "background 150ms ease, border-color 150ms ease",
        ...(hovered ? S.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#FAFAFA", margin: 0, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(250,250,250,0.4)", margin: 0 }}>{description}</p>
      </div>
      <ExternalLink size={14} style={{ color: "rgba(250,250,250,0.3)", flexShrink: 0 }} aria-hidden />
    </div>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  )
}
