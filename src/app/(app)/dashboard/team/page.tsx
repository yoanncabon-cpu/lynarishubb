"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  Crown,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Languages,
} from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "owner" | "admin" | "member"

interface TeamMember {
  name: string
  email: string
  role: Role
  initial: string
  color: string
  lastSeen: string
}

interface PendingInvite {
  email: string
  role: "admin" | "member"
  sentAt: string
}

interface AgentAccessMap {
  [agentSlug: string]: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INVITES_KEY = "lynaris_team_invites"
const ACCESS_KEY_PREFIX = "lynaris_team_access_"
const WORKSPACE_NAME_KEY = "lynaris_workspace_name"
const WORKSPACE_SLUG_KEY = "lynaris_workspace_slug"

const INITIAL_INVITES: PendingInvite[] = []

// Palette de couleurs pour les avatars générés
const AVATAR_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#22D3EE", "#EC4899", "#6366F1", "#8B5CF6", "#64748B"]

interface DbMember {
  id: string
  email: string
  fullName: string | null
  role: "owner" | "admin" | "member"
  createdAt: string
}

function dbMemberToTeamMember(m: DbMember, idx: number): TeamMember {
  const name = m.fullName ?? m.email.split("@")[0] ?? "?"
  const initial = name.charAt(0).toUpperCase()
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? "#7C3AED"
  return { name, email: m.email, role: m.role, initial, color, lastSeen: "—" }
}

const ALL_AGENTS = [
  { slug: "marine", name: "Marine", color: "#22D3EE" },
  { slug: "charles", name: "Charles", color: "#7C3AED" },
  { slug: "lou", name: "Lou", color: "#F472B6" },
  { slug: "elio", name: "Elio", color: "#10B981" },
  { slug: "mae", name: "Mae", color: "#F59E0B" },
  { slug: "max", name: "Max", color: "#EC4899" },
  { slug: "nova", name: "Nova", color: "#6366F1" },
  { slug: "alba", name: "Alba", color: "#8B5CF6" },
]

const DEFAULT_AGENT_ACCESS: AgentAccessMap = Object.fromEntries(
  ALL_AGENTS.map((a) => [a.slug, true])
)

const TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Dubai",
]

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastItem { id: string; message: string; type: "success" | "error" }

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const push = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = crypto.randomUUID()
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }, [])
  return { toasts, setToasts, push }
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
          borderRadius: 12, backdropFilter: "blur(32px)",
          background: t.type === "error" ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)",
          border: `1px solid ${t.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideIn 0.2s ease-out",
          minWidth: 280, maxWidth: 380,
        }}>
          {t.type === "error"
            ? <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            : <CheckCircle2 size={15} color="#34D399" style={{ flexShrink: 0, marginTop: 1 }} />}
          <span style={{ fontSize: 13, color: "#F5F5F7", flex: 1, lineHeight: 1.5 }}>{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", padding: 2, flexShrink: 0, display: "flex" }}>
            <X size={13} />
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

// Surface verre niveau 2 — radius 18 cohérent avec le langage Liquid Glass
const glassCard: React.CSSProperties = {
  borderRadius: 18,
  overflow: "hidden",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  fontSize: 13,
  boxSizing: "border-box",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: 32,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#A1A1AA",
  marginBottom: 7,
  letterSpacing: "0.02em",
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  if (role === "owner") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Crown size={11} color="#F59E0B" />
      <span style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Propriétaire
      </span>
    </span>
  )
  if (role === "admin") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Shield size={11} color="#A78BFA" />
      <span style={{ background: "rgba(124,58,237,0.15)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Admin
      </span>
    </span>
  )
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Users size={11} color="#94A3B8" />
      <span style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.3)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Membre
      </span>
    </span>
  )
}

// ─── Member avatar ────────────────────────────────────────────────────────────

function MemberAvatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${member.color}cc, ${member.color}66)`,
      border: `1px solid ${member.color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "white",
    }}>
      {member.initial}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none",
        background: checked ? "#7C3AED" : "rgba(255,255,255,0.1)",
        position: "relative", cursor: "pointer",
        transition: "background 150ms", padding: 0, flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        transition: "left 150ms", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#52525B", margin: "0 0 10px" }}>
      {children}
    </p>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(400px, calc(100vw - 32px))",
        background: "rgba(18,18,24,0.95)", backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 24,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", zIndex: 61,
      }}>
        <p style={{ fontSize: 14, color: "#F5F5F7", margin: "0 0 20px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#A1A1AA", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Annuler
          </button>
          <button type="button" onClick={onConfirm} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.12)", color: "#F87171", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Retirer
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  // ── State ──
  const [members, setMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [invites, setInvites] = useState<PendingInvite[]>(INITIAL_INVITES)

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [inviteMsg, setInviteMsg] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Role dropdown
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null)

  // Confirm remove
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // Agent access accordions (email -> open)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [agentAccessByMember, setAgentAccessByMember] = useState<Record<string, AgentAccessMap>>({})
  const [savingAccess, setSavingAccess] = useState<string | null>(null)

  // Workspace settings
  const [wsName, setWsName] = useState("Lynaris")
  const [wsSlug, setWsSlug] = useState("lynaris")
  const [wsTz, setWsTz] = useState("Europe/Paris")
  const [wsLang, setWsLang] = useState("fr")
  const [savingWs, setSavingWs] = useState<"name" | "slug" | null>(null)

  const { toasts, setToasts, push } = useToast()

  // ── Charger membres depuis l'API ──
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/team/members")
        if (res.ok) {
          const data = await res.json() as { members: DbMember[] }
          setMembers(data.members.map((m, i) => dbMemberToTeamMember(m, i)))
        }
      } catch { /* silencieux */ } finally {
        setMembersLoading(false)
      }
    })()
  }, [])

  // ── Charger invites / workspace depuis localStorage ──
  useEffect(() => {
    try {
      const rawInv = localStorage.getItem(INVITES_KEY)
      if (rawInv) setInvites(JSON.parse(rawInv) as PendingInvite[])
      const savedWsName = localStorage.getItem(WORKSPACE_NAME_KEY)
      if (savedWsName) setWsName(savedWsName)
      const savedWsSlug = localStorage.getItem(WORKSPACE_SLUG_KEY)
      if (savedWsSlug) setWsSlug(savedWsSlug)
    } catch { /* ignore */ }
  }, [])

  function persist(updated: TeamMember[]) {
    setMembers(updated)
  }

  function persistInvites(updated: PendingInvite[]) {
    setInvites(updated)
    try { localStorage.setItem(INVITES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
  }

  function loadAgentAccess(email: string): AgentAccessMap {
    if (agentAccessByMember[email]) return agentAccessByMember[email]
    try {
      const raw = localStorage.getItem(`${ACCESS_KEY_PREFIX}${email}`)
      if (raw) return JSON.parse(raw) as AgentAccessMap
    } catch { /* ignore */ }
    return { ...DEFAULT_AGENT_ACCESS }
  }

  // ── Escape key ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setInviteOpen(false)
        setRoleDropdown(null)
        setConfirmRemove(null)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // ── Accordion open → load access ──
  function toggleAccordion(email: string) {
    if (openAccordion === email) {
      setOpenAccordion(null)
    } else {
      const access = loadAgentAccess(email)
      setAgentAccessByMember((prev) => ({ ...prev, [email]: access }))
      setOpenAccordion(email)
    }
  }

  function toggleAgent(email: string, slug: string) {
    setAgentAccessByMember((prev) => {
      const current = prev[email] ?? { ...DEFAULT_AGENT_ACCESS }
      return { ...prev, [email]: { ...current, [slug]: !current[slug] } }
    })
  }

  function saveAccess(email: string) {
    setSavingAccess(email)
    try {
      localStorage.setItem(`${ACCESS_KEY_PREFIX}${email}`, JSON.stringify(agentAccessByMember[email]))
    } catch { /* ignore */ }
    setTimeout(() => {
      setSavingAccess(null)
      push("Accès agents sauvegardé")
    }, 400)
  }

  // ── Role change ──
  function changeRole(email: string, newRole: "admin" | "member") {
    persist(members.map((m) => m.email === email ? { ...m, role: newRole } : m))
    setRoleDropdown(null)
    push(`Rôle mis à jour`)
  }

  // ── Remove ──
  function removeMember(email: string) {
    persist(members.filter((m) => m.email !== email))
    setConfirmRemove(null)
    push("Membre retiré")
  }

  // ── Invite modal ──
  function openInviteModal() {
    setInviteEmail("")
    setInviteRole("member")
    setInviteMsg("")
    setInviteError(null)
    setInviteOpen(true)
  }

  function closeInviteModal() {
    if (inviteLoading) return
    setInviteOpen(false)
    setInviteError(null)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inviteEmail.trim()
    if (!emailRegex.test(trimmed)) {
      setInviteError("Adresse email invalide")
      return
    }
    setInviteLoading(true)
    setInviteError(null)
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          role: inviteRole,
          message: inviteMsg || undefined,
          orgName: wsName,
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        const newInvite: PendingInvite = { email: trimmed, role: inviteRole, sentAt: "A l'instant" }
        persistInvites([...invites, newInvite])
        setInviteOpen(false)
        push(`Invitation envoyée à ${trimmed}`)
      } else {
        setInviteError(data.error ?? "Une erreur est survenue")
      }
    } catch {
      setInviteError("Erreur réseau — réessaie")
    } finally {
      setInviteLoading(false)
    }
  }

  // ── Invite actions ──
  function revokeInvite(email: string) {
    persistInvites(invites.filter((i) => i.email !== email))
    push(`Invitation révoquée`)
  }

  function resendInvite(email: string) {
    push(`Invitation renvoyée à ${email}`)
  }

  // ── Workspace save ──
  function saveWsName() {
    setSavingWs("name")
    localStorage.setItem(WORKSPACE_NAME_KEY, wsName)
    setTimeout(() => { setSavingWs(null); push("Nom de l'espace sauvegardé") }, 400)
  }

  function saveWsSlug() {
    setSavingWs("slug")
    localStorage.setItem(WORKSPACE_SLUG_KEY, wsSlug)
    setTimeout(() => { setSavingWs(null); push("Slug sauvegardé") }, 400)
  }

  // ── Non-owner members for accordions ──
  const editableMembers = members.filter((m) => m.role !== "owner")

  // ── Input focus refs ──
  const emailInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inviteOpen) setTimeout(() => emailInputRef.current?.focus(), 50)
  }, [inviteOpen])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, padding: "24px 24px 60px", margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>Mon équipe</h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Gérez les accès, rôles et permissions de votre espace de travail.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="ly-badge" style={{ height: 36, padding: "0 14px", fontSize: 12, color: "#71717A", fontWeight: 600 }}>
            <Users size={13} />
            {members.length} membres
          </div>
          <button
            type="button"
            onClick={openInviteModal}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#E86F4D", color: "white",
              height: 36, padding: "0 16px", borderRadius: 8,
              border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1" }}
          >
            <UserPlus size={14} />
            Inviter un collaborateur
          </button>
        </div>
      </div>

      {/* ── Members table ── */}
      <section style={{ marginBottom: 28 }}>
        <SectionLabel>Membres</SectionLabel>
        <div className="ly-card" style={glassCard}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 170px 150px 130px",
            padding: "10px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
          }}>
            {["Membre", "Rôle", "Dernière connexion", "Actions"].map((col) => (
              <span key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3F3F46" }}>
                {col}
              </span>
            ))}
          </div>

          {membersLoading ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "rgba(245,245,247,0.35)" }}>
              Chargement des membres…
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "rgba(245,245,247,0.35)" }}>
              Aucun membre trouvé dans cette organisation.
            </div>
          ) : members.map((member, i) => (
            <div
              key={member.email}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 170px 150px 130px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
            >
              {/* Member info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MemberAvatar member={member} size={40} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>{member.name}</p>
                  <p style={{ fontSize: 11, color: "#52525B", margin: "2px 0 0" }}>{member.email}</p>
                </div>
              </div>

              {/* Role */}
              <RoleBadge role={member.role} />

              {/* Last seen */}
              <span style={{ fontSize: 12, color: "#71717A" }}>{member.lastSeen}</span>

              {/* Actions */}
              {member.role === "owner" ? (
                <span style={{ fontSize: 11, color: "#3F3F46" }}>—</span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                  {/* Role dropdown */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setRoleDropdown(roleDropdown === member.email ? null : member.email)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        height: 28, padding: "0 8px", borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)", color: "#A1A1AA",
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      <Shield size={10} />
                      Rôle
                      <ChevronDown size={10} />
                    </button>
                    {roleDropdown === member.email && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setRoleDropdown(null)} />
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
                          background: "rgba(18,18,24,0.97)", backdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                          padding: 4, minWidth: 150,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}>
                          {(["admin", "member"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => changeRole(member.email, r)}
                              style={{
                                width: "100%", height: 32, borderRadius: 7, border: "none",
                                background: member.role === r ? "rgba(255,255,255,0.06)" : "transparent",
                                color: member.role === r ? "#F5F5F7" : "#A1A1AA",
                                fontSize: 12, cursor: "pointer", textAlign: "left",
                                padding: "0 10px", display: "flex", alignItems: "center", gap: 7,
                              }}
                            >
                              {r === "admin"
                                ? <Shield size={11} style={{ color: "#A78BFA" }} />
                                : <Users size={11} style={{ color: "#71717A" }} />}
                              {r === "admin" ? "Admin" : "Membre"}
                              {member.role === r && <span style={{ marginLeft: "auto", color: "#E86F4D", fontSize: 10 }}>actuel</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    title="Retirer ce membre"
                    onClick={() => setConfirmRemove(member.email)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: "1px solid rgba(248,113,113,0.15)",
                      background: "rgba(248,113,113,0.06)", color: "#F87171",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0, flexShrink: 0,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pending invites ── */}
      {invites.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Invitations en attente ({invites.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invites.map((inv) => (
              <div key={inv.email} className="ly-card" style={{
                ...glassCard,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", overflow: "visible", flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, color: "#52525B", flexShrink: 0,
                  }}>
                    <Send size={13} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>{inv.email}</p>
                    <span style={{ fontSize: 11, color: "#52525B", margin: "2px 0 0", display: "block" }}>
                      <span style={{ marginRight: 8 }}><RoleBadge role={inv.role} /></span>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#52525B", marginLeft: "auto", flexShrink: 0 }}>{inv.sentAt}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => resendInvite(inv.email)}
                    style={{
                      height: 28, padding: "0 10px", borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)", color: "#A1A1AA",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <RefreshCw size={10} /> Renvoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => revokeInvite(inv.email)}
                    style={{
                      height: 28, padding: "0 10px", borderRadius: 6,
                      border: "1px solid rgba(248,113,113,0.15)",
                      background: "rgba(248,113,113,0.06)", color: "#F87171",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <X size={10} /> Révoquer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Agent access per member ── */}
      {editableMembers.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Accès agents par membre</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {editableMembers.map((member) => {
              const isOpen = openAccordion === member.email
              const access = agentAccessByMember[member.email] ?? DEFAULT_AGENT_ACCESS

              return (
                <div key={member.email} className="ly-card" style={{ ...glassCard, overflow: "visible" }}>
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(member.email)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MemberAvatar member={member} size={32} />
                      <div style={{ textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>{member.name}</span>
                        <span style={{ marginLeft: 8 }}><RoleBadge role={member.role} /></span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "#52525B" }}>
                        {isOpen ? "Fermer" : "Configurer l'accès"}
                      </span>
                      <ChevronDown
                        size={14}
                        color="#52525B"
                        style={{ transition: "transform 200ms", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </div>
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      padding: "16px 18px 18px",
                    }}>
                      <p style={{ fontSize: 12, color: "#71717A", margin: "0 0 14px" }}>
                        Agents accessibles pour {member.name.split(" ")[0]}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
                        {ALL_AGENTS.map((agent) => {
                          const enabled = access[agent.slug] ?? true
                          return (
                            <button
                              key={agent.slug}
                              type="button"
                              onClick={() => toggleAgent(member.email, agent.slug)}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 10px", borderRadius: 8,
                                border: enabled ? `1px solid ${agent.color}44` : "1px solid rgba(255,255,255,0.06)",
                                background: enabled ? `${agent.color}14` : "rgba(255,255,255,0.03)",
                                cursor: "pointer", transition: "all 150ms",
                              }}
                            >
                              <AgentAvatar slug={agent.slug} size={22} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? "#F5F5F7" : "#52525B" }}>
                                {agent.name}
                              </span>
                              <Toggle
                                checked={enabled}
                                onChange={() => toggleAgent(member.email, agent.slug)}
                              />
                            </button>
                          )
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => saveAccess(member.email)}
                          disabled={savingAccess === member.email}
                          style={{
                            height: 34, padding: "0 16px", borderRadius: 8,
                            border: "none", background: "#E86F4D", color: "white",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                            opacity: savingAccess === member.email ? 0.6 : 1,
                            transition: "opacity 150ms",
                          }}
                        >
                          {savingAccess === member.email ? (
                            <><RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Sauvegarde...</>
                          ) : (
                            "Sauvegarder l'accès"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Workspace settings ── */}
      <section>
        <SectionLabel>Param&egrave;tres de l&apos;espace de travail</SectionLabel>
        <div className="ly-card" style={{ ...glassCard, overflow: "visible", padding: "20px 22px" }}>
          {/* Workspace name */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Nom de l&apos;espace</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="ly-input"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={saveWsName} disabled={savingWs === "name"} style={saveBtn(savingWs === "name")}>
                {savingWs === "name" ? <RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : "Sauvegarder"}
              </button>
            </div>
          </div>

          {/* Slug */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Slug URL</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#52525B", flexShrink: 0, whiteSpace: "nowrap" }}>
                https://app.lynaris.ai/
              </span>
              <input
                value={wsSlug}
                onChange={(e) => setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="ly-input"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={saveWsSlug} disabled={savingWs === "slug"} style={saveBtn(savingWs === "slug")}>
                {savingWs === "slug" ? <RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : "Sauvegarder"}
              </button>
            </div>
          </div>

          {/* Timezone + Language */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={11} /> Timezone
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={wsTz}
                  onChange={(e) => setWsTz(e.target.value)}
                  className="ly-input"
                  style={{ ...selectStyle }}
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                <Languages size={11} /> Langue par défaut
              </label>
              <select value={wsLang} onChange={(e) => setWsLang(e.target.value)} className="ly-input" style={selectStyle}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Invite modal ── */}
      {inviteOpen && (
        <>
          <div
            onClick={closeInviteModal}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 50 }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: "min(460px, calc(100vw - 32px))",
            background: "rgba(18,18,24,0.95)", backdropFilter: "blur(40px) saturate(1.4)",
            WebkitBackdropFilter: "blur(40px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 28,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)",
            zIndex: 51,
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", margin: 0, letterSpacing: "-0.02em" }}>
                Inviter un collaborateur
              </h2>
              <button type="button" onClick={closeInviteModal} style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#71717A", padding: 0,
              }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleInvite}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email *</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="ly-input"
                  style={{ ...inputStyle }}
                />
              </div>

              {/* Role radio cards */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Rôle</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(["admin", "member"] as const).map((r) => {
                    const active = inviteRole === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteRole(r)}
                        style={{
                          padding: "10px 12px", borderRadius: 10,
                          border: active ? "1px solid rgba(232,111,77,0.35)" : "1px solid rgba(255,255,255,0.08)",
                          background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.04)",
                          cursor: "pointer", textAlign: "left", transition: "all 150ms",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {r === "admin"
                            ? <Shield size={12} color={active ? "#E86F4D" : "#71717A"} />
                            : <Users size={12} color={active ? "#E86F4D" : "#71717A"} />}
                          <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#F5F5F7" : "#71717A" }}>
                            {r === "admin" ? "Admin" : "Membre"}
                          </span>
                          {active && (
                            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#E86F4D" }} />
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "#52525B", margin: 0, lineHeight: 1.4 }}>
                          {r === "admin"
                            ? "Peut configurer les agents et les intégrations"
                            : "Peut discuter avec les agents et voir l'activité"}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Personal message */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Message personnalisé <span style={{ color: "#3F3F46", fontWeight: 400 }}>(optionnel)</span></label>
                <textarea
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  rows={3}
                  placeholder="Rejoins mon équipe sur Lynaris pour gérer nos agents IA..."
                  className="ly-input"
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                    lineHeight: 1.5,
                    minHeight: 72,
                  }}
                />
              </div>

              {/* Error */}
              {inviteError && (
                <p style={{ fontSize: 12, color: "#F87171", margin: "-8px 0 14px", display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertCircle size={12} /> {inviteError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={closeInviteModal}
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)", color: "#A1A1AA",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    flex: 2, height: 40, borderRadius: 10, border: "none",
                    background: inviteLoading ? "rgba(232,111,77,0.5)" : "#E86F4D",
                    color: "white", fontSize: 13, fontWeight: 600,
                    cursor: inviteLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, transition: "background 150ms",
                  }}
                >
                  {inviteLoading ? (
                    <><RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Envoi...</>
                  ) : (
                    <>Envoyer l&apos;invitation <Send size={13} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Confirm remove ── */}
      {confirmRemove && (
        <ConfirmModal
          message={`Retirer ce membre de l'équipe ? Cette action est réversible.`}
          onConfirm={() => removeMember(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} dismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #1a1a24; color: #F5F5F7; }
      `}</style>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function saveBtn(loading: boolean): React.CSSProperties {
  return {
    height: 40, padding: "0 14px", borderRadius: 8, border: "none",
    background: loading ? "rgba(232,111,77,0.5)" : "#E86F4D",
    color: "white", fontSize: 12, fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: 6,
    flexShrink: 0, transition: "background 150ms",
    opacity: loading ? 0.7 : 1,
  }
}
