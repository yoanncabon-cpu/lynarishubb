"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  Crown,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Languages,
  UserCircle2,
  Mail,
  Briefcase,
  MoreHorizontal,
} from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "owner" | "admin" | "member"
type MemberStatus = "active" | "invited"

interface TeamMember {
  id?: string
  name: string
  email: string
  role: Role
  initial: string
  color: string
  lastSeen: string
  jobTitle?: string
  status: MemberStatus
}

interface AgentAccessMap {
  [agentSlug: string]: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_KEY_PREFIX = "lynaris_team_access_"
const WORKSPACE_NAME_KEY = "lynaris_workspace_name"
const WORKSPACE_SLUG_KEY = "lynaris_workspace_slug"

const AVATAR_COLORS = [
  "#7C3AED", "#10B981", "#F59E0B", "#22D3EE",
  "#EC4899", "#6366F1", "#8B5CF6", "#64748B",
  "#E86F4D", "#34D399",
]

interface DbMember {
  id: string
  email: string
  fullName: string | null
  role: "owner" | "admin" | "member"
  createdAt: string
  jobTitle?: string
}

function dbMemberToTeamMember(m: DbMember, idx: number): TeamMember {
  const name = m.fullName ?? m.email.split("@")[0] ?? "?"
  const initial = name.charAt(0).toUpperCase()
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? "#7C3AED"
  return {
    id: m.id,
    name,
    email: m.email,
    role: m.role,
    initial,
    color,
    lastSeen: "—",
    jobTitle: m.jobTitle,
    status: "active",
  }
}

const ALL_AGENTS = [
  { slug: "charles", name: "Charles", color: "#7C3AED" },
  { slug: "marine",  name: "Marine",  color: "#22D3EE" },
  { slug: "lou",     name: "Lou",     color: "#F472B6" },
  { slug: "elio",    name: "Elio",    color: "#10B981" },
  { slug: "mae",     name: "Mae",     color: "#F59E0B" },
  { slug: "max",     name: "Max",     color: "#EC4899" },
  { slug: "nova",    name: "Nova",    color: "#6366F1" },
  { slug: "alba",    name: "Alba",    color: "#8B5CF6" },
  { slug: "aria",    name: "Aria",    color: "#F97316" },
]

const DEFAULT_AGENT_ACCESS: AgentAccessMap = Object.fromEntries(
  ALL_AGENTS.map((a) => [a.slug, true])
)

const TIMEZONES = [
  "Europe/Paris", "Europe/London", "Europe/Berlin",
  "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Asia/Dubai",
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

const glassCard: React.CSSProperties = { borderRadius: 16, overflow: "hidden" }

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px",
  fontSize: 13, boxSizing: "border-box",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, paddingRight: 32, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#A1A1AA",
  marginBottom: 7, letterSpacing: "0.02em",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#52525B", margin: "0 0 10px" }}>
      {children}
    </p>
  )
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "owner") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Crown size={10} color="#F59E0B" />
      <span style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Propriétaire
      </span>
    </span>
  )
  if (role === "admin") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Shield size={10} color="#A78BFA" />
      <span style={{ background: "rgba(124,58,237,0.12)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Admin
      </span>
    </span>
  )
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Users size={10} color="#94A3B8" />
      <span style={{ background: "rgba(100,116,139,0.12)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.25)", borderRadius: 5, fontSize: 11, padding: "2px 7px", fontWeight: 600 }}>
        Membre
      </span>
    </span>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  if (status === "invited") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "rgba(251,191,36,0.08)", color: "#FCD34D",
      border: "1px solid rgba(251,191,36,0.2)", borderRadius: 5,
      fontSize: 10, padding: "2px 7px", fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FCD34D", display: "inline-block" }} />
      En attente
    </span>
  )
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "rgba(16,185,129,0.08)", color: "#34D399",
      border: "1px solid rgba(16,185,129,0.2)", borderRadius: 5,
      fontSize: 10, padding: "2px 7px", fontWeight: 600,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: "#10B981",
        display: "inline-block", boxShadow: "0 0 6px #10B98180",
        animation: "pulse-dot 2s ease-in-out infinite",
      }} />
      Actif
    </span>
  )
}

function MemberAvatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${member.color}cc, ${member.color}55)`,
      border: `1.5px solid ${member.color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "white",
      boxShadow: `0 0 0 3px ${member.color}10`,
    }}>
      {member.initial}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10, border: "none",
      background: checked ? "#7C3AED" : "rgba(255,255,255,0.1)",
      position: "relative", cursor: "pointer", transition: "background 150ms", padding: 0, flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        transition: "left 150ms", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(400px, calc(100vw - 32px))",
        background: "rgba(18,18,24,0.97)", backdropFilter: "blur(40px)",
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

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#E86F4D", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  // Modal "Créer un profil"
  const [createOpen, setCreateOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName,  setLastName]  = useState("")
  const [createEmail,    setCreateEmail]    = useState("")
  const [createRole,     setCreateRole]     = useState<"admin" | "member">("member")
  const [createJobTitle, setCreateJobTitle] = useState("")
  const [createLoading,  setCreateLoading]  = useState(false)
  const [createError,    setCreateError]    = useState<string | null>(null)

  // Role dropdown + remove confirm
  const [roleDropdown,   setRoleDropdown]   = useState<string | null>(null)
  const [confirmRemove,  setConfirmRemove]  = useState<string | null>(null)
  const [actionsOpen,    setActionsOpen]    = useState<string | null>(null)

  // Agent access
  const [openAccordion,       setOpenAccordion]       = useState<string | null>(null)
  const [agentAccessByMember, setAgentAccessByMember] = useState<Record<string, AgentAccessMap>>({})
  const [savingAccess,        setSavingAccess]         = useState<string | null>(null)

  // Workspace settings
  const [wsName,    setWsName]    = useState("Lynaris")
  const [wsSlug,    setWsSlug]    = useState("lynaris")
  const [wsTz,      setWsTz]      = useState("Europe/Paris")
  const [wsLang,    setWsLang]    = useState("fr")
  const [savingWs,  setSavingWs]  = useState<"name" | "slug" | null>(null)

  const { toasts, setToasts, push } = useToast()

  // ── Charger membres ──────────────────────────────────────────────────────────
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

  // ── localStorage workspace ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(WORKSPACE_NAME_KEY)
      if (savedName) setWsName(savedName)
      const savedSlug = localStorage.getItem(WORKSPACE_SLUG_KEY)
      if (savedSlug) setWsSlug(savedSlug)
    } catch { /* ignore */ }
  }, [])

  // ── Escape ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCreateOpen(false)
        setRoleDropdown(null)
        setConfirmRemove(null)
        setActionsOpen(null)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // ── Agent access ─────────────────────────────────────────────────────────────
  function loadAgentAccess(email: string): AgentAccessMap {
    if (agentAccessByMember[email]) return agentAccessByMember[email]
    try {
      const raw = localStorage.getItem(`${ACCESS_KEY_PREFIX}${email}`)
      if (raw) return JSON.parse(raw) as AgentAccessMap
    } catch { /* ignore */ }
    return { ...DEFAULT_AGENT_ACCESS }
  }

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
    setTimeout(() => { setSavingAccess(null); push("Accès agents sauvegardé") }, 400)
  }

  // ── Role change (persisté en DB) ─────────────────────────────────────────────
  const [roleChanging, setRoleChanging] = useState<string | null>(null)

  async function changeRole(email: string, newRole: "admin" | "member") {
    const member = members.find((m) => m.email === email)
    if (!member?.id) return

    setRoleChanging(email)
    setActionsOpen(null)

    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, role: newRole }),
      })
      if (res.ok) {
        setMembers((m) => m.map((mbr) => mbr.email === email ? { ...mbr, role: newRole } : mbr))
        push("Rôle mis à jour")
      } else {
        const d = await res.json() as { error?: string }
        push(d.error ?? "Erreur lors du changement de rôle", "error")
      }
    } catch {
      push("Erreur réseau", "error")
    } finally {
      setRoleChanging(null)
    }
  }

  // ── Remove (persisté en DB) ───────────────────────────────────────────────────
  const [memberRemoving, setMemberRemoving] = useState<string | null>(null)

  async function removeMember(email: string) {
    const member = members.find((m) => m.email === email)
    if (!member?.id) return

    setMemberRemoving(email)
    setConfirmRemove(null)

    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      })
      if (res.ok) {
        setMembers((m) => m.filter((mbr) => mbr.email !== email))
        push("Membre retiré")
      } else {
        const d = await res.json() as { error?: string }
        push(d.error ?? "Erreur lors de la suppression", "error")
      }
    } catch {
      push("Erreur réseau", "error")
    } finally {
      setMemberRemoving(null)
    }
  }

  // ── Open create modal ────────────────────────────────────────────────────────
  function openCreate() {
    setFirstName(""); setLastName(""); setCreateEmail("")
    setCreateRole("member"); setCreateJobTitle(""); setCreateError(null)
    setCreateOpen(true)
  }

  // ── Submit create ────────────────────────────────────────────────────────────
  const firstInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (createOpen) setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [createOpen])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = createEmail.trim()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || null

    if (!trimmedEmail) { setCreateError("L'email est requis"); return }
    setCreateLoading(true)
    setCreateError(null)

    try {
      const res = await fetch("/api/team/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          fullName,
          role: createRole,
          jobTitle: createJobTitle.trim() || undefined,
        }),
      })
      const data = await res.json() as {
        success?: boolean
        error?: string
        member?: { id: string; email: string; fullName: string | null; role: string }
      }

      if (res.ok && data.success && data.member) {
        const idx = members.length
        const name = data.member.fullName ?? data.member.email.split("@")[0] ?? "?"
        const newMember: TeamMember = {
          id: data.member.id,
          name,
          email: data.member.email,
          role: data.member.role as Role,
          initial: name.charAt(0).toUpperCase(),
          color: AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? "#7C3AED",
          lastSeen: "—",
          jobTitle: createJobTitle.trim() || undefined,
          status: "invited",
        }
        setMembers((prev) => [...prev, newMember])
        setCreateOpen(false)
        push(`Profil créé — ${data.member.email} a reçu un email d'activation`)
      } else {
        setCreateError(data.error ?? "Une erreur est survenue")
      }
    } catch {
      setCreateError("Erreur réseau — réessaie")
    } finally {
      setCreateLoading(false)
    }
  }

  // ── Workspace ────────────────────────────────────────────────────────────────
  function saveWsName() {
    setSavingWs("name")
    localStorage.setItem(WORKSPACE_NAME_KEY, wsName)
    setTimeout(() => { setSavingWs(null); push("Nom sauvegardé") }, 400)
  }

  function saveWsSlug() {
    setSavingWs("slug")
    localStorage.setItem(WORKSPACE_SLUG_KEY, wsSlug)
    setTimeout(() => { setSavingWs(null); push("Slug sauvegardé") }, 400)
  }

  const editableMembers = members.filter((m) => m.role !== "owner")
  const adminCount = members.filter((m) => m.role === "admin").length
  const pendingCount = members.filter((m) => m.status === "invited").length

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 920, padding: "24px 24px 60px", margin: "0 auto" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Mon équipe
          </h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>
            Gérez les accès, rôles et permissions de votre espace de travail.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#E86F4D", color: "white",
            height: 38, padding: "0 18px", borderRadius: 9,
            border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(232,111,77,0.35)",
            transition: "opacity 150ms, box-shadow 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1" }}
        >
          <UserPlus size={14} />
          Créer un profil collaborateur
        </button>
      </div>

      {/* ── Stats pills ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Membres", value: members.length, icon: <Users size={12} />, color: "#A1A1AA" },
          { label: "Admins",  value: adminCount,    icon: <Shield size={12} />, color: "#A78BFA" },
          { label: "En attente", value: pendingCount, icon: <Mail size={12} />, color: "#FCD34D" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 14px", borderRadius: 999,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            fontSize: 12, color,
          }}>
            {icon}
            <span style={{ fontWeight: 700, color: "#F5F5F7" }}>{value}</span>
            <span style={{ color: "#52525B" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Members table ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <SectionLabel>Membres</SectionLabel>
        <div className="ly-card" style={{ ...glassCard, overflow: "visible" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 150px 110px 110px 100px",
            padding: "10px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {["Membre", "Rôle", "Statut", "Dernière connexion", "Actions"].map((col) => (
              <span key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3F3F46" }}>
                {col}
              </span>
            ))}
          </div>

          {membersLoading ? (
            <div style={{ padding: "28px 20px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", opacity: 1 - i * 0.25 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 12, width: "35%", borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ height: 10, width: "22%", borderRadius: 4, background: "rgba(255,255,255,0.03)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <UserCircle2 size={40} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", margin: "0 0 4px" }}>Aucun membre trouvé</p>
              <p style={{ fontSize: 12, color: "rgba(245,245,247,0.2)", margin: 0 }}>Commence par créer un profil collaborateur</p>
            </div>
          ) : (
            members.map((member, i) => (
              <div
                key={member.email}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 150px 110px 110px 100px",
                  alignItems: "center",
                  padding: "13px 20px",
                  borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  opacity: memberRemoving === member.email ? 0.4 : 1,
                  pointerEvents: memberRemoving === member.email ? "none" : "auto",
                  transition: "opacity 200ms, background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
              >
                {/* Member info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <MemberAvatar member={member} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {member.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#52525B", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {member.email}
                    </p>
                    {member.jobTitle && (
                      <p style={{ fontSize: 10, color: "#3F3F46", margin: "1px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                        <Briefcase size={9} /> {member.jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <RoleBadge role={member.role} />

                {/* Status */}
                <StatusBadge status={member.status} />

                {/* Last seen */}
                <span style={{ fontSize: 12, color: "#52525B" }}>{member.lastSeen}</span>

                {/* Actions */}
                {member.role === "owner" ? (
                  <span style={{ fontSize: 11, color: "#3F3F46" }}>—</span>
                ) : (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setActionsOpen(actionsOpen === member.email ? null : member.email)}
                      style={{
                        width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)",
                        background: actionsOpen === member.email ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                        color: "#71717A", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", padding: 0, transition: "all 150ms", outline: "none",
                      }}
                    >
                      <MoreHorizontal size={13} />
                    </button>

                    {actionsOpen === member.email && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setActionsOpen(null)} />
                        <div style={{
                          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                          background: "rgba(16,16,22,0.97)", backdropFilter: "blur(24px)",
                          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 5,
                          minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          animation: "slideIn 0.12s ease-out",
                        }}>
                          {/* Change role sub-options */}
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#3F3F46", padding: "4px 8px 6px", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
                            Changer le rôle
                          </p>
                          {(["admin", "member"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              disabled={roleChanging === member.email}
                              onClick={() => void changeRole(member.email, r)}
                              style={{
                                width: "100%", height: 32, borderRadius: 7, border: "none",
                                background: member.role === r ? "rgba(255,255,255,0.05)" : "transparent",
                                color: member.role === r ? "#F5F5F7" : "#A1A1AA",
                                fontSize: 12, cursor: roleChanging === member.email ? "not-allowed" : "pointer",
                                textAlign: "left", padding: "0 8px", display: "flex", alignItems: "center", gap: 7,
                                transition: "background 100ms", opacity: roleChanging === member.email ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => { if (member.role !== r) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)" }}
                              onMouseLeave={(e) => { if (member.role !== r) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                            >
                              {r === "admin" ? <Shield size={11} style={{ color: "#A78BFA" }} /> : <Users size={11} style={{ color: "#71717A" }} />}
                              {r === "admin" ? "Admin" : "Membre"}
                              {member.role === r && <span style={{ marginLeft: "auto", color: "#E86F4D", fontSize: 10 }}>actuel</span>}
                            </button>
                          ))}
                          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "5px 0" }} />
                          <button
                            type="button"
                            onClick={() => { setConfirmRemove(member.email); setActionsOpen(null) }}
                            style={{
                              width: "100%", height: 32, borderRadius: 7, border: "none",
                              background: "transparent", color: "#F87171",
                              fontSize: 12, cursor: "pointer", textAlign: "left",
                              padding: "0 8px", display: "flex", alignItems: "center", gap: 7,
                              transition: "background 100ms",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.07)" }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                          >
                            <Trash2 size={11} /> Retirer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Agent access ────────────────────────────────────────────────────── */}
      {editableMembers.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <SectionLabel>Accès agents par membre</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {editableMembers.map((member) => {
              const isOpen = openAccordion === member.email
              const access = agentAccessByMember[member.email] ?? DEFAULT_AGENT_ACCESS

              return (
                <div key={member.email} className="ly-card" style={{ ...glassCard, overflow: "visible" }}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion(member.email)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 18px", background: "none", border: "none", cursor: "pointer", gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MemberAvatar member={member} size={30} />
                      <div style={{ textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>{member.name}</span>
                        <span style={{ marginLeft: 8 }}><RoleBadge role={member.role} /></span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "#52525B" }}>{isOpen ? "Fermer" : "Configurer"}</span>
                      <ChevronDown size={14} color="#52525B" style={{ transition: "transform 200ms", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 18px 18px" }}>
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
                              <Toggle checked={enabled} onChange={() => toggleAgent(member.email, agent.slug)} />
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
                            height: 34, padding: "0 16px", borderRadius: 8, border: "none",
                            background: "#E86F4D", color: "white", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                            opacity: savingAccess === member.email ? 0.6 : 1, transition: "opacity 150ms",
                          }}
                        >
                          {savingAccess === member.email
                            ? <><RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Sauvegarde...</>
                            : "Sauvegarder l'accès"}
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

      {/* ── Workspace settings ───────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Paramètres de l&apos;espace de travail</SectionLabel>
        <div className="ly-card" style={{ ...glassCard, overflow: "visible", padding: "20px 22px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Nom de l&apos;espace</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={wsName} onChange={(e) => setWsName(e.target.value)} className="ly-input" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={saveWsName} disabled={savingWs === "name"} style={saveBtn(savingWs === "name")}>
                {savingWs === "name" ? <RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : "Sauvegarder"}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Slug URL</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#52525B", flexShrink: 0, whiteSpace: "nowrap" }}>https://app.lynaris.ai/</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={11} /> Timezone
              </label>
              <select value={wsTz} onChange={(e) => setWsTz(e.target.value)} className="ly-input" style={selectStyle}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
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

      {/* ── Create profile modal ─────────────────────────────────────────────── */}
      {createOpen && (
        <>
          <div onClick={() => !createLoading && setCreateOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 50 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: "min(480px, calc(100vw - 32px))",
            background: "rgba(14,14,20,0.97)", backdropFilter: "blur(40px) saturate(1.5)",
            WebkitBackdropFilter: "blur(40px) saturate(1.5)",
            border: "1px solid rgba(255,255,255,0.11)",
            borderRadius: 20, padding: 28,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
            zIndex: 51, animation: "modalIn 0.18s ease-out",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", margin: "0 0 3px", letterSpacing: "-0.02em" }}>
                  Créer un profil collaborateur
                </h2>
                <p style={{ fontSize: 12, color: "#52525B", margin: 0 }}>
                  Un email d&apos;activation sera envoyé automatiquement
                </p>
              </div>
              <button type="button" onClick={() => !createLoading && setCreateOpen(false)} style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#71717A", padding: 0, flexShrink: 0,
              }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Prénom + Nom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <Field label="Prénom">
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Marie"
                    className="ly-input"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Nom">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="ly-input"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Email */}
              <Field label="Email professionnel" required>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="marie@exemple.fr"
                  className="ly-input"
                  style={inputStyle}
                />
              </Field>

              {/* Poste */}
              <Field label="Poste / Fonction">
                <input
                  type="text"
                  value={createJobTitle}
                  onChange={(e) => setCreateJobTitle(e.target.value)}
                  placeholder="Office Manager, Responsable..."
                  className="ly-input"
                  style={inputStyle}
                />
              </Field>

              {/* Rôle */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Rôle</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(["member", "admin"] as const).map((r) => {
                    const active = createRole === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCreateRole(r)}
                        style={{
                          padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                          border: active ? "1px solid rgba(232,111,77,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          background: active ? "rgba(232,111,77,0.1)" : "rgba(255,255,255,0.03)",
                          transition: "all 150ms",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          {r === "admin"
                            ? <Shield size={12} color={active ? "#E86F4D" : "#71717A"} />
                            : <Users size={12} color={active ? "#E86F4D" : "#71717A"} />}
                          <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#F5F5F7" : "#71717A" }}>
                            {r === "admin" ? "Admin" : "Membre"}
                          </span>
                          {active && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#E86F4D" }} />}
                        </div>
                        <p style={{ fontSize: 11, color: "#52525B", margin: 0, lineHeight: 1.4 }}>
                          {r === "admin"
                            ? "Configure les agents et intégrations"
                            : "Discute avec les agents, consulte l'activité"}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error */}
              {createError && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "10px 12px",
                  borderRadius: 8, background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)", marginBottom: 16,
                }}>
                  <AlertCircle size={13} color="#F87171" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#F87171" }}>{createError}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => !createLoading && setCreateOpen(false)}
                  style={{
                    flex: 1, height: 42, borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)", color: "#A1A1AA",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    flex: 2, height: 42, borderRadius: 10, border: "none",
                    background: createLoading ? "rgba(232,111,77,0.45)" : "#E86F4D",
                    color: "white", fontSize: 13, fontWeight: 600,
                    cursor: createLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 150ms",
                    boxShadow: createLoading ? "none" : "0 2px 10px rgba(232,111,77,0.3)",
                  }}
                >
                  {createLoading ? (
                    <><RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Création en cours...</>
                  ) : (
                    <><UserPlus size={14} /> Créer le profil</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Confirm remove ───────────────────────────────────────────────────── */}
      {confirmRemove && (
        <ConfirmModal
          message="Retirer ce membre de l'équipe ? Cette action est réversible."
          onConfirm={() => void removeMember(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes modalIn { from { opacity: 0; transform: translate(-50%,-48%) scale(0.97); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1a1a24; color: #F5F5F7; }
      `}</style>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function saveBtn(loading: boolean): React.CSSProperties {
  return {
    height: 40, padding: "0 14px", borderRadius: 8, border: "none",
    background: loading ? "rgba(232,111,77,0.45)" : "#E86F4D",
    color: "white", fontSize: 12, fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: 6,
    flexShrink: 0, transition: "background 150ms",
    opacity: loading ? 0.7 : 1,
  }
}
