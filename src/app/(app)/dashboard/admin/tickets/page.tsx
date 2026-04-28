"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { TicketChat } from "@/app/(app)/dashboard/support/_components/TicketChat"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  ticketId: string
  subject: string
  category: string
  priority: string
  description: string
  pageUrl: string | null
  userEmail: string | null
  status: "open" | "in_progress" | "resolved" | "closed"
  createdAt: string
  updatedAt: string
  orgId: string
  orgName: string | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: "rgba(239,68,68,0.12)", color: "#EF4444" },
  in_progress: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  resolved: { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
  closed: { bg: "rgba(100,116,139,0.12)", color: "#64748B" },
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Urgente: { bg: "rgba(239,68,68,0.12)", color: "#EF4444" },
  Haute: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  Normale: { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
  Faible: { bg: "rgba(99,102,241,0.12)", color: "#6366F1" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  label,
  bg,
  color,
}: {
  label: string
  bg: string
  color: string
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[120, 160, 120, 200, 120, 80, 80, 90, 80].map((w, i) => (
        <td key={i} style={{ padding: "14px 12px" }}>
          <div
            style={{
              height: 14,
              width: w,
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  )
}

// ─── Panel de détail ──────────────────────────────────────────────────────────

function DetailPanel({
  ticket,
  onClose,
  onUpdated,
  onDeleted,
}: {
  ticket: Ticket
  onClose: () => void
  onUpdated: (updated: Ticket) => void
  onDeleted: (ticketId: string) => void
}) {
  const [selectedStatus, setSelectedStatus] = useState<Ticket["status"]>(
    ticket.status
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Erreur inconnue.")
        return
      }
      const { ticket: updated } = (await res.json()) as { ticket: Ticket }
      onUpdated(updated)
    } catch {
      setError("Erreur réseau.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.ticketId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Erreur lors de la suppression.")
        return
      }
      onDeleted(ticket.ticketId)
      onClose()
    } catch {
      setError("Erreur réseau.")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const statusOptions: { value: Ticket["status"]; label: string }[] = [
    { value: "open", label: "Ouvert" },
    { value: "in_progress", label: "En cours" },
    { value: "resolved", label: "Résolu" },
    { value: "closed", label: "Fermé" },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
        aria-hidden
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal
        aria-label={`Ticket ${ticket.ticketId}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: "#0F0F10",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#E86F4D",
                letterSpacing: "0.06em",
              }}
            >
              {ticket.ticketId}
            </span>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#FAFAFA",
                margin: "4px 0 0",
                lineHeight: 1.3,
              }}
            >
              {ticket.subject}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "rgba(250,250,250,0.4)",
                margin: "4px 0 0",
              }}
            >
              {new Date(ticket.createdAt).toLocaleString("fr-FR")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(250,250,250,0.4)",
              cursor: "pointer",
              padding: 4,
              fontSize: 20,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Méta */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {[
            {
              label: "Client",
              value: ticket.userEmail ? (
                <a
                  href={`mailto:${ticket.userEmail}`}
                  style={{ color: "#E86F4D", textDecoration: "none" }}
                >
                  {ticket.userEmail}
                </a>
              ) : (
                <span style={{ color: "rgba(250,250,250,0.3)" }}>—</span>
              ),
            },
            {
              label: "Organisation",
              value: ticket.orgName ?? (
                <span style={{ color: "rgba(250,250,250,0.3)" }}>—</span>
              ),
            },
            {
              label: "Catégorie",
              value: ticket.category,
            },
            {
              label: "Priorité",
              value: (
                <Badge
                  label={ticket.priority}
                  {...(PRIORITY_COLORS[ticket.priority] ?? { bg: "rgba(255,255,255,0.08)", color: "#FAFAFA" })}
                />
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(250,250,250,0.4)",
                  width: 100,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 13, color: "#FAFAFA", flex: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "rgba(250,250,250,0.35)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Description
          </p>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "rgba(250,250,250,0.8)",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {ticket.description}
          </p>
        </div>

        {/* URL si présente */}
        {ticket.pageUrl && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "rgba(250,250,250,0.35)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Page concernée
            </p>
            <a
              href={ticket.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#E86F4D", wordBreak: "break-all" }}
            >
              {ticket.pageUrl}
            </a>
          </div>
        )}

        {/* Changement de statut */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "rgba(250,250,250,0.35)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Statut
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statusOptions.map((opt) => {
              const active = selectedStatus === opt.value
              const col = STATUS_COLORS[opt.value]
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: active
                      ? `1.5px solid ${col?.color ?? "#FAFAFA"}`
                      : "1.5px solid rgba(255,255,255,0.1)",
                    background: active
                      ? (col?.bg ?? "rgba(255,255,255,0.08)")
                      : "transparent",
                    color: active ? (col?.color ?? "#FAFAFA") : "rgba(250,250,250,0.45)",
                    transition: "all 150ms ease",
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat en direct */}
        <TicketChat ticketId={ticket.ticketId} />

        {/* Erreur */}
        {error && (
          <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error}</p>
        )}

        {/* Bouton enregistrer statut */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: saving ? "rgba(232,111,77,0.4)" : "#E86F4D",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background 150ms ease",
            minHeight: 44,
          }}
        >
          {saving ? "Enregistrement…" : "Enregistrer le statut"}
        </button>

        {/* Suppression du ticket */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
          {confirmDelete ? (
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span style={{ fontSize: 12.5, color: "rgba(239,68,68,0.9)", flex: 1 }}>
                Supprimer ce ticket définitivement ?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Confirmer la suppression"
                style={{
                  background: deleting ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.5)",
                  borderRadius: 8,
                  color: "#EF4444",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 44,
                  transition: "background 150ms ease",
                }}
              >
                {deleting
                  ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : <Trash2 size={14} aria-hidden />
                }
                {deleting ? "Suppression…" : "Confirmer"}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                aria-label="Annuler la suppression"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "rgba(250,250,250,0.55)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "8px 16px",
                  minHeight: 44,
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
              aria-label="Supprimer le ticket"
              style={{
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                color: "rgba(239,68,68,0.7)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                width: "100%",
                justifyContent: "center",
                transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"
                ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.5)"
                ;(e.currentTarget as HTMLElement).style.color = "#EF4444"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent"
                ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.7)"
              }}
            >
              <Trash2 size={14} aria-hidden />
              Supprimer le ticket
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selected, setSelected] = useState<Ticket | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Vérification admin au montage
  useEffect(() => {
    fetch("/api/admin/tickets?limit=1")
      .then((r) => {
        if (r.status === 403) router.push("/dashboard")
      })
      .catch(() => router.push("/dashboard"))
  }, [router])

  // Ouvrir automatiquement le ticket passé en query param (?ticket=LYN-XXXXXX)
  useEffect(() => {
    const ticketId = searchParams.get("ticket")
    if (!ticketId || tickets.length === 0) return
    const match = tickets.find((t) => t.ticketId === ticketId)
    if (match) setSelected(match)
  }, [searchParams, tickets])

  // Debounce recherche
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (priorityFilter) params.set("priority", priorityFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)
      params.set("limit", "100")

      const res = await fetch(`/api/admin/tickets?${params.toString()}`)
      if (res.ok) {
        const data = (await res.json()) as { tickets: Ticket[] }
        setTickets(data.tickets)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, debouncedSearch])

  useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  const totalOpen = tickets.filter((t) => t.status === "open").length

  function handleUpdated(updated: Ticket) {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelected(updated)
  }

  function handleDeleted(ticketId: string) {
    setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId))
    setSelected(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div
        style={{
          padding: "28px 32px",
          minHeight: "100vh",
          background: "#111114",
          color: "#FAFAFA",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Administration — Tickets support
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "rgba(250,250,250,0.4)",
                margin: "6px 0 0",
              }}
            >
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} au total
              {" · "}
              <span style={{ color: "#EF4444" }}>
                {totalOpen} ouvert{totalOpen !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <a
            href="/dashboard/admin/provision"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#0C0C0F",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Créer un compte client
          </a>
        </div>

        {/* Filtres */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#FAFAFA",
              fontSize: 13,
              padding: "8px 12px",
              cursor: "pointer",
              outline: "none",
              minHeight: 44,
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filtrer par priorité"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#FAFAFA",
              fontSize: 13,
              padding: "8px 12px",
              cursor: "pointer",
              outline: "none",
              minHeight: 44,
            }}
          >
            <option value="">Toutes les priorités</option>
            <option value="Faible">Faible</option>
            <option value="Normale">Normale</option>
            <option value="Haute">Haute</option>
            <option value="Urgente">Urgente</option>
          </select>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher sujet, email…"
            aria-label="Rechercher un ticket"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#FAFAFA",
              fontSize: 13,
              padding: "8px 14px",
              outline: "none",
              minWidth: 240,
              minHeight: 44,
            }}
          />
        </div>

        {/* Tableau */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {[
                    "ID",
                    "Client",
                    "Organisation",
                    "Sujet",
                    "Catégorie",
                    "Priorité",
                    "Statut",
                    "Date",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "rgba(250,250,250,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  : tickets.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: "40px 20px",
                          textAlign: "center",
                          color: "rgba(250,250,250,0.3)",
                          fontSize: 14,
                        }}
                      >
                        Aucun ticket trouvé.
                      </td>
                    </tr>
                  )
                  : tickets.map((ticket) => {
                    const prioCol = PRIORITY_COLORS[ticket.priority] ?? {
                      bg: "rgba(255,255,255,0.08)",
                      color: "#FAFAFA",
                    }
                    const statCol = STATUS_COLORS[ticket.status] ?? {
                      bg: "rgba(255,255,255,0.08)",
                      color: "#FAFAFA",
                    }
                    return (
                      <tr
                        key={ticket.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          transition: "background 120ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.025)"
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent"
                        }}
                      >
                        <td style={{ padding: "14px 12px", color: "#E86F4D", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {ticket.ticketId}
                        </td>
                        <td style={{ padding: "14px 12px", color: "rgba(250,250,250,0.6)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.userEmail ?? "—"}
                        </td>
                        <td style={{ padding: "14px 12px", color: "rgba(250,250,250,0.6)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.orgName ?? "—"}
                        </td>
                        <td style={{ padding: "14px 12px", color: "#FAFAFA", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.subject}
                        </td>
                        <td style={{ padding: "14px 12px", color: "rgba(250,250,250,0.55)", whiteSpace: "nowrap" }}>
                          {ticket.category}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <Badge label={ticket.priority} {...prioCol} />
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <Badge label={STATUS_LABELS[ticket.status] ?? ticket.status} {...statCol} />
                        </td>
                        <td style={{ padding: "14px 12px", color: "rgba(250,250,250,0.4)", whiteSpace: "nowrap", fontSize: 12 }}>
                          {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <button
                            type="button"
                            onClick={() => setSelected(ticket)}
                            style={{
                              background: "rgba(232,111,77,0.1)",
                              border: "1px solid rgba(232,111,77,0.2)",
                              borderRadius: 6,
                              color: "#E86F4D",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "6px 12px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              minHeight: 44,
                              transition: "background 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "rgba(232,111,77,0.18)"
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "rgba(232,111,77,0.1)"
                            }}
                          >
                            Voir / Gérer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel de détail */}
      {selected && (
        <DetailPanel
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
