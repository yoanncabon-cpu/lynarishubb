"use client"

import React, { useState, useRef, useEffect, CSSProperties } from "react"
import {
  LayoutGrid, Plus, X, Users, Calendar, Lock, Share2,
  StickyNote, Trash2, Link2, Search,
  ChevronRight, FolderOpen, MoreHorizontal, Upload,
  Copy, Check, UserPlus, Download,
} from "lucide-react"
import { GlassCard } from "@/components/app/glass/GlassCard"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member { initials: string; color: string; name: string }

interface WorkspaceNote {
  id: string
  title: string
  content: string
  updatedAt: string
}

interface WorkspaceFile {
  id: string
  name: string
  type: string
  size: string
  updatedAt: string
}

interface Workspace {
  id: string
  name: string
  description: string
  icon: string
  color: string
  members: Member[]
  updatedAt: string
  shared: boolean
  notes: WorkspaceNote[]
  files: WorkspaceFile[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_SHARED: Workspace[] = [
  {
    id: "ws-1",
    name: "Stratégie commerciale",
    description: "Objectifs Q2, pipeline cibles, suivi des closing",
    icon: "📊",
    color: "#E86F4D",
    // Mock interne dashboard privé — données fictives pour démo
    members: [
      { initials: "YC", color: "#E86F4D", name: "Yoann Cabon" },
      { initials: "JM", color: "#7C3AED", name: "Julien Ménigoz" },
    ],
    updatedAt: "Aujourd'hui 10:14",
    shared: true,
    notes: [
      { id: "n1", title: "Objectifs Q2 2026", content: "MRR cible : 5 000€\nClients cibles : 3 cabinets médicaux, 2 restaurateurs\nPriorité : finaliser le closing Ménigoz", updatedAt: "Aujourd'hui 10:14" },
      { id: "n2", title: "Pipeline de vente", content: "Julien Ménigoz — Proposition envoyée ✅\nPierre Lambert — À relancer\nSophie Marchand — Démo à planifier", updatedAt: "Hier 16:30" },
    ],
    files: [
      { id: "f1", name: "Pitch deck Q2.pdf", type: "pdf", size: "2.4 MB", updatedAt: "22 avr." },
      { id: "f2", name: "Contrat Ménigoz.docx", type: "doc", size: "145 KB", updatedAt: "20 avr." },
    ],
  },
  {
    id: "ws-2",
    name: "Contenus Marketing",
    description: "Calendrier éditorial, briefs articles, posts LinkedIn",
    icon: "✍️",
    color: "#F472B6",
    members: [{ initials: "YC", color: "#E86F4D", name: "Yoann Cabon" }],
    updatedAt: "Hier 16:42",
    shared: true,
    notes: [
      { id: "n3", title: "Calendrier éditorial Avril", content: "Semaine 17 : Article 'Agents IA pour kiné'\nSemaine 18 : Post LinkedIn lancement Marine\nSemaine 19 : Étude de cas Ménigoz", updatedAt: "Hier 16:42" },
    ],
    files: [
      { id: "f3", name: "Charte graphique Lynaris.pdf", type: "pdf", size: "8.2 MB", updatedAt: "15 avr." },
    ],
  },
  {
    id: "ws-3",
    name: "Roadmap produit",
    description: "Features Q2–Q3, backlog agents, priorités design",
    icon: "🗺️",
    color: "#6366F1",
    members: [{ initials: "YC", color: "#E86F4D", name: "Yoann Cabon" }],
    updatedAt: "22 avr. 09:30",
    shared: true,
    notes: [
      { id: "n4", title: "Features prioritaires Q2", content: "✅ CRM contacts réels\n✅ Dashboard avatar\n🔲 Billing portal\n🔲 Onboarding amélioré\n🔲 Export conversations", updatedAt: "22 avr. 09:30" },
    ],
    files: [],
  },
]

const INIT_PRIVATE: Workspace[] = [
  {
    id: "ws-4",
    name: "Notes personnelles",
    description: "Idées, réflexions, brouillons non partagés",
    icon: "🔒",
    color: "#64748B",
    members: [{ initials: "YC", color: "#E86F4D", name: "Yoann Cabon" }],
    updatedAt: "Aujourd'hui 08:55",
    shared: false,
    notes: [
      { id: "n5", title: "Idées features 2026", content: "- Agent vocal pour restaurants\n- Intégration Zapier\n- Mode équipe multi-agents\n- Dashboard analytics avancé", updatedAt: "Aujourd'hui 08:55" },
    ],
    files: [],
  },
]

const ICON_OPTIONS = ["📊", "✍️", "🗺️", "📋", "💡", "🔐", "📁", "🚀", "⚡", "🎯", "💬", "📈"]
const COLOR_OPTIONS = ["#E86F4D", "#F472B6", "#6366F1", "#22D3EE", "#34D399", "#FBBF24", "#8B5CF6", "#64748B"]

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  bg: "#111114",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.07)",
  cardBorderHover: "rgba(255,255,255,0.14)",
  accent: "#E86F4D",
  textPrimary: "#F5F5F7",
  textMuted: "rgba(245,245,247,0.45)",
  textSecondary: "rgba(245,245,247,0.65)",
  panelBg: "#111114",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.1)",
}

const sectionLabel: CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "rgba(232,111,77,0.5)", margin: 0,
}

const inputStyle: CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  background: S.inputBg, border: `1px solid ${S.inputBorder}`,
  borderRadius: 8, color: S.textPrimary, fontSize: 13,
  outline: "none", boxSizing: "border-box",
}

// ─── WorkspaceCard ────────────────────────────────────────────────────────────

function WorkspaceCard({ workspace, onClick }: { workspace: Workspace; onClick: () => void }) {
  return (
    <GlassCard
      as="button"
      radius={18}
      padding={20}
      hover
      onClick={onClick}
      ariaLabel={workspace.name}
      style={{ textAlign: "left", width: "100%", display: "block" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${workspace.color}18`, border: `1px solid ${workspace.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {workspace.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {workspace.name}
              </h3>
              {workspace.shared
                ? <Share2 size={11} color={S.textMuted} />
                : <Lock size={11} color={S.textMuted} />}
            </div>
            <p style={{ fontSize: 12.5, color: S.textSecondary, margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {workspace.description}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {workspace.members.map((m, i) => (
              <div key={m.initials + i} title={m.name} style={{
                width: 24, height: 24, borderRadius: "50%", background: `${m.color}22`,
                border: `1.5px solid ${m.color}55`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 9, fontWeight: 700, color: m.color,
                marginLeft: i === 0 ? 0 : -6, zIndex: workspace.members.length - i, position: "relative",
              }}>{m.initials}</div>
            ))}
            <span style={{ fontSize: 11, color: S.textMuted, marginLeft: 8 }}>
              {workspace.members.length === 1 ? "1 membre" : `${workspace.members.length} membres`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={11} color={S.textMuted} />
            <span style={{ fontSize: 11, color: S.textMuted }}>{workspace.updatedAt}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ─── NewWorkspaceModal ─────────────────────────────────────────────────────────

function NewWorkspaceModal({
  isPrivate,
  onClose,
  onCreate,
}: {
  isPrivate: boolean
  onClose: () => void
  onCreate: (ws: Workspace) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("📋")
  const [color, setColor] = useState(isPrivate ? "#64748B" : "#E86F4D")
  const [shared, setShared] = useState(!isPrivate)

  function handleCreate() {
    if (!name.trim()) return
    const now = new Date()
    const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    onCreate({
      id: `ws-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Espace de travail",
      icon,
      color,
      members: [{ initials: "YC", color: "#E86F4D", name: "Yoann Cabon" }],
      updatedAt: `Aujourd'hui ${time}`,
      shared,
      notes: [],
      files: [],
    })
    onClose()
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(440px, calc(100vw - 32px))",
        background: "#161618", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        zIndex: 101, padding: 24, display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, margin: 0 }}>
            Nouvel espace {shared ? "partagé" : "privé"}
          </h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, padding: 4, display: "flex", borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Icon + Color */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Icône</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)} style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: "pointer",
                  background: icon === ic ? "rgba(232,111,77,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${icon === ic ? "rgba(232,111,77,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Couleur</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 100 }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{
                  width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                  border: `2px solid ${color === c ? "#fff" : "transparent"}`,
                  outline: "none",
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Nom *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Stratégie Q3, Notes client…"
            className="ly-input"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="En quoi consiste cet espace ?"
            rows={2}
            className="ly-input"
            style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }}
          />
        </div>

        {/* Visibility */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary, margin: "0 0 2px" }}>Espace partagé</p>
            <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>Visible par les membres de l&apos;équipe</p>
          </div>
          <button type="button" role="switch" aria-checked={shared} onClick={() => setShared(v => !v)} style={{
            width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
            background: shared ? "#E86F4D" : "rgba(255,255,255,0.12)", transition: "background 200ms", padding: 0,
          }}>
            <span style={{ position: "absolute", top: 3, left: shared ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 200ms", display: "block" }} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: S.textMuted, fontSize: 13, cursor: "pointer" }}>
            Annuler
          </button>
          <button type="button" onClick={handleCreate} disabled={!name.trim()} style={{
            height: 36, padding: "0 20px", borderRadius: 8, border: "none",
            background: name.trim() ? S.accent : "rgba(255,255,255,0.1)",
            color: name.trim() ? "#fff" : S.textMuted,
            fontSize: 13, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed",
            transition: "background 150ms",
          }}>
            Créer l&apos;espace
          </button>
        </div>
      </div>
    </>
  )
}

// ─── SlideInPanel ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function generateInviteToken(wsId: string): string {
  const base = btoa(`${wsId}-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)
  return base
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
  png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", svg: "🖼️",
  mp4: "🎥", mov: "🎥", zip: "🗜️", txt: "📋", csv: "📊",
}

function SlideInPanel({
  workspace,
  onClose,
  onDelete,
  onUpdate,
}: {
  workspace: Workspace
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (ws: Workspace) => void
}) {
  type PanelTab = "notes" | "fichiers" | "membres"
  const [tab, setTab] = useState<PanelTab>("notes")
  const [notes, setNotes] = useState<WorkspaceNote[]>(workspace.notes)
  const [activeNote, setActiveNote] = useState<WorkspaceNote | null>(notes[0] ?? null)
  const [noteContent, setNoteContent] = useState(notes[0]?.content ?? "")
  const [noteSearch, setNoteSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Fichiers state
  const [files, setFiles] = useState<WorkspaceFile[]>(workspace.files)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileHoverIds, setFileHoverIds] = useState<Set<string>>(new Set())

  // Membres / invite state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteToken] = useState(() => generateInviteToken(workspace.id))
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : "https://app.lynaris.ai"}/invite/${inviteToken}`

  function handleCopyLink() {
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    const newFiles: WorkspaceFile[] = picked.map(f => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      type: f.name.split(".").pop() ?? "file",
      size: formatBytes(f.size),
      updatedAt: "maintenant",
    }))
    const updated = [...newFiles, ...files]
    setFiles(updated)
    onUpdate({ ...workspace, files: updated })
  }

  function handleDeleteFile(id: string) {
    const updated = files.filter(f => f.id !== id)
    setFiles(updated)
    onUpdate({ ...workspace, files: updated })
  }

  function selectNote(n: WorkspaceNote) {
    setActiveNote(n)
    setNoteContent(n.content)
  }

  function saveNote() {
    if (!activeNote) return
    const updated = notes.map(n => n.id === activeNote.id
      ? { ...n, content: noteContent, updatedAt: "maintenant" }
      : n
    )
    setNotes(updated)
    onUpdate({ ...workspace, notes: updated })
  }

  function addNote() {
    const newNote: WorkspaceNote = { id: `note-${Date.now()}`, title: "Nouvelle note", content: "", updatedAt: "maintenant" }
    const updated = [newNote, ...notes]
    setNotes(updated)
    setActiveNote(newNote)
    setNoteContent("")
    setTimeout(() => textRef.current?.focus(), 50)
    onUpdate({ ...workspace, notes: updated })
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    if (activeNote?.id === id) {
      setActiveNote(updated[0] ?? null)
      setNoteContent(updated[0]?.content ?? "")
    }
    onUpdate({ ...workspace, notes: updated })
  }

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
    n.content.toLowerCase().includes(noteSearch.toLowerCase())
  )


  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 50 }} onClick={onClose} />
      <aside role="dialog" aria-label={workspace.name} style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(560px, 100vw)",
        background: S.panelBg,
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 51, display: "flex", flexDirection: "column",
        boxShadow: "-24px 0 80px rgba(0,0,0,0.5)",
        animation: "slideIn 220ms ease-out",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `${workspace.color}18`, border: `1px solid ${workspace.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>{workspace.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspace.name}
            </h2>
            <p style={{ fontSize: 11.5, color: S.textMuted, margin: 0 }}>{workspace.description}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.5)", display: "flex", padding: 6, borderRadius: 6 }}
                title="Supprimer l'espace"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.5)" }}>
                <Trash2 size={15} />
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#F87171" }}>Supprimer ?</span>
                <button type="button" onClick={() => { onDelete(workspace.id); onClose() }} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "none", background: "#F87171", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Oui</button>
                <button type="button" onClick={() => setConfirmDelete(false)} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: S.textMuted, fontSize: 11, cursor: "pointer" }}>Non</button>
              </div>
            )}
            <button type="button" onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, display: "flex", padding: 6, borderRadius: 6 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.textPrimary }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.textMuted }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {(["notes", "fichiers", "membres"] as PanelTab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer",
              color: tab === t ? S.textPrimary : S.textMuted,
              background: "none", border: "none",
              borderBottom: tab === t ? `2px solid ${workspace.color}` : "2px solid transparent",
              marginBottom: -1, transition: "color 150ms",
              textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Sidebar notes */}
            <div style={{ width: 180, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: "10px 10px 6px" }}>
                <div style={{ position: "relative" }}>
                  <Search size={12} color={S.textMuted} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="ly-input"
                    style={{ ...inputStyle, height: 30, paddingLeft: 28, fontSize: 12 }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredNotes.map(n => (
                  <button key={n.id} type="button" onClick={() => selectNote(n)} style={{
                    display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 12px",
                    width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none",
                    borderLeft: activeNote?.id === n.id ? `2px solid ${workspace.color}` : "2px solid transparent",
                    backgroundColor: activeNote?.id === n.id ? "rgba(255,255,255,0.04)" : "transparent",
                    transition: "background 100ms",
                  }}>
                    <StickyNote size={12} color={S.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: S.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                      <p style={{ fontSize: 10.5, color: S.textMuted, margin: 0 }}>{n.updatedAt}</p>
                    </div>
                  </button>
                ))}
                {filteredNotes.length === 0 && (
                  <p style={{ fontSize: 12, color: S.textMuted, padding: 12, textAlign: "center" }}>Aucune note</p>
                )}
              </div>
              <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button type="button" onClick={addNote} style={{
                  width: "100%", height: 30, borderRadius: 7, border: `1px dashed rgba(255,255,255,0.12)`,
                  background: "transparent", color: S.textMuted, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  <Plus size={12} /> Nouvelle note
                </button>
              </div>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {activeNote ? (
                <>
                  <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={e => {
                        const updated = notes.map(n => n.id === activeNote.id ? { ...n, title: e.target.value } : n)
                        setNotes(updated)
                        setActiveNote({ ...activeNote, title: e.target.value })
                      }}
                      style={{ background: "none", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: S.textPrimary, flex: 1, padding: 0 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={saveNote} style={{
                        height: 26, padding: "0 12px", borderRadius: 6, border: "none",
                        background: workspace.color, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}>Sauvegarder</button>
                      <button type="button" onClick={() => deleteNote(activeNote.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.5)", padding: 4, display: "flex", borderRadius: 5 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.5)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textRef}
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Commence à écrire…"
                    style={{
                      flex: 1, padding: "14px 16px", background: "none", border: "none",
                      outline: "none", resize: "none", color: S.textPrimary, fontSize: 13,
                      lineHeight: 1.65, fontFamily: "var(--font-geist-sans, sans-serif)",
                    }}
                  />
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
                  <StickyNote size={28} color="rgba(255,255,255,0.1)" />
                  <p style={{ fontSize: 13, color: S.textMuted, textAlign: "center", margin: 0 }}>Sélectionne une note ou crée-en une nouvelle.</p>
                  <button type="button" onClick={addNote} style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "none", background: workspace.color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    + Nouvelle note
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FICHIERS TAB ── */}
        {tab === "fichiers" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileUpload} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>{files.length} fichier{files.length !== 1 ? "s" : ""}</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                height: 30, padding: "0 12px", borderRadius: 7,
                border: `1px solid ${S.inputBorder}`, background: S.inputBg,
                color: S.textSecondary, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Upload size={12} /> Ajouter un fichier
              </button>
            </div>

            {files.length === 0 ? (
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "48px 0", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.08)", marginTop: 8, cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,111,77,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(232,111,77,0.03)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                <FolderOpen size={28} color="rgba(255,255,255,0.15)" />
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: S.textMuted, margin: "0 0 4px" }}>Aucun fichier dans cet espace</p>
                  <p style={{ fontSize: 12, color: "rgba(232,111,77,0.6)", margin: 0 }}>Cliquer pour ajouter des fichiers</p>
                </div>
              </div>
            ) : (
              files.map(f => {
                const ext = (f.name.split(".").pop() ?? "").toLowerCase()
                const isHovered = fileHoverIds.has(f.id)
                return (
                  <div key={f.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                      borderRadius: 10, background: isHovered ? "rgba(255,255,255,0.07)" : S.cardBg,
                      border: `1px solid ${isHovered ? S.cardBorderHover : S.cardBorder}`,
                      transition: "background 150ms, border-color 150ms",
                    }}
                    onMouseEnter={() => setFileHoverIds(prev => { const s = new Set(prev); s.add(f.id); return s })}
                    onMouseLeave={() => setFileHoverIds(prev => { const s = new Set(prev); s.delete(f.id); return s })}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{FILE_ICONS[ext] ?? "📄"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>{f.size} · {f.updatedAt}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4, opacity: isHovered ? 1 : 0, transition: "opacity 150ms" }}>
                      <button type="button" title="Télécharger" style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, display: "flex", padding: 5, borderRadius: 6 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.textPrimary }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.textMuted }}>
                        <Download size={13} />
                      </button>
                      <button type="button" title="Supprimer" onClick={() => handleDeleteFile(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.5)", display: "flex", padding: 5, borderRadius: 6 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.5)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <ChevronRight size={13} color={S.textMuted} style={{ opacity: isHovered ? 0 : 1, transition: "opacity 150ms", flexShrink: 0 }} />
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── MEMBRES TAB ── */}
        {tab === "membres" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
                {workspace.members.length} membre{workspace.members.length !== 1 ? "s" : ""}
              </p>
              {workspace.shared && (
                <button type="button" onClick={() => setShowInvite(v => !v)} style={{
                  height: 30, padding: "0 12px", borderRadius: 7,
                  border: `1px solid ${showInvite ? "rgba(232,111,77,0.4)" : S.inputBorder}`,
                  background: showInvite ? "rgba(232,111,77,0.1)" : S.inputBg,
                  color: showInvite ? S.accent : S.textSecondary,
                  fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  transition: "all 150ms",
                }}>
                  <UserPlus size={12} /> Inviter
                </button>
              )}
            </div>

            {/* Invite panel */}
            {showInvite && workspace.shared && (
              <div style={{
                padding: 16, borderRadius: 12,
                background: "rgba(232,111,77,0.06)",
                border: "1px solid rgba(232,111,77,0.2)",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary, margin: "0 0 6px" }}>Inviter par email</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="collaborateur@email.com"
                      className="ly-input"
                      style={{ ...inputStyle, flex: 1, height: 34, fontSize: 12 }}
                    />
                    <button type="button"
                      onClick={() => setInviteEmail("")}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 7, border: "none",
                        background: S.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}>
                      Envoyer
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary, margin: "0 0 6px" }}>Lien d&apos;invitation</p>
                  <p style={{ fontSize: 11, color: S.textMuted, margin: "0 0 8px" }}>Partage ce lien — il expire dans 7 jours.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{
                      flex: 1, height: 34, padding: "0 10px", borderRadius: 7,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", overflow: "hidden",
                    }}>
                      <span style={{ fontSize: 11, color: S.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inviteLink}
                      </span>
                    </div>
                    <button type="button" onClick={handleCopyLink} style={{
                      height: 34, padding: "0 12px", borderRadius: 7, border: "none", flexShrink: 0,
                      background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.08)",
                      color: copied ? "#34D399" : S.textSecondary,
                      fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      transition: "all 200ms",
                    }}>
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Members list */}
            {workspace.members.map((m, i) => (
              <div key={m.initials + i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 10, background: S.cardBg, border: `1px solid ${S.cardBorder}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: `${m.color}22`,
                  border: `2px solid ${m.color}55`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 700, color: m.color, flexShrink: 0,
                }}>{m.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary, margin: "0 0 1px" }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>{i === 0 ? "Propriétaire" : "Collaborateur"}</p>
                </div>
                {i > 0 && (
                  <button type="button" title="Retirer" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.4)", display: "flex", padding: 5, borderRadius: 6 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.4)" }}>
                    <MoreHorizontal size={14} />
                  </button>
                )}
              </div>
            ))}

            {!workspace.shared && (
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 12, color: S.textMuted, margin: 0 }}>
                  Cet espace est privé. Créez un espace partagé pour inviter des collaborateurs.
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LS_KEY_SHARED = "lynaris_workspaces_shared"
const LS_KEY_PRIVATE = "lynaris_workspaces_private"

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function saveLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

export default function WorkspacePage() {
  const [sharedSpaces, setSharedSpaces] = useState<Workspace[]>(INIT_SHARED)
  const [privateSpaces, setPrivateSpaces] = useState<Workspace[]>(INIT_PRIVATE)
  const [selected, setSelected] = useState<Workspace | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalPrivate, setModalPrivate] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadLS<Workspace[]>(LS_KEY_SHARED, INIT_SHARED)
    setSharedSpaces(saved)
    const savedPriv = loadLS<Workspace[]>(LS_KEY_PRIVATE, INIT_PRIVATE)
    setPrivateSpaces(savedPriv)
  }, [])

  function openModal(priv: boolean) { setModalPrivate(priv); setShowModal(true) }

  function handleCreate(ws: Workspace) {
    if (ws.shared) {
      setSharedSpaces(prev => { const next = [ws, ...prev]; saveLS(LS_KEY_SHARED, next); return next })
    } else {
      setPrivateSpaces(prev => { const next = [ws, ...prev]; saveLS(LS_KEY_PRIVATE, next); return next })
    }
  }

  function handleDelete(id: string) {
    setSharedSpaces(prev => { const next = prev.filter(ws => ws.id !== id); saveLS(LS_KEY_SHARED, next); return next })
    setPrivateSpaces(prev => { const next = prev.filter(ws => ws.id !== id); saveLS(LS_KEY_PRIVATE, next); return next })
  }

  function handleUpdate(updated: Workspace) {
    const update = (arr: Workspace[]) => arr.map(ws => ws.id === updated.id ? updated : ws)
    setSharedSpaces(prev => { const next = update(prev); saveLS(LS_KEY_SHARED, next); return next })
    setPrivateSpaces(prev => { const next = update(prev); saveLS(LS_KEY_PRIVATE, next); return next })
    if (selected?.id === updated.id) setSelected(updated)
  }

  return (
    <div style={{ minHeight: "100%", background: S.bg, padding: "32px 32px 64px", maxWidth: 900, margin: "0 auto" }}>
      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LayoutGrid size={20} color={S.accent} />
          <div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: S.textPrimary, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Espace de travail</h1>
            <p style={{ fontSize: 13, color: S.textMuted, margin: "6px 0 0" }}>Organisez vos projets et collaborez avec votre équipe</p>
          </div>
        </div>
        <button type="button" onClick={() => openModal(false)} style={{
          height: 38, padding: "0 16px", borderRadius: 10, border: "none",
          background: S.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 150ms",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}>
          <Plus size={15} /> Nouvel espace
        </button>
      </div>

      {/* ── Espaces partagés ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Share2 size={13} color="rgba(232,111,77,0.5)" />
          <p style={sectionLabel}>Espaces partagés</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {sharedSpaces.map(ws => (
            <WorkspaceCard key={ws.id} workspace={ws} onClick={() => setSelected(ws)} />
          ))}
          <button type="button" onClick={() => openModal(false)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 10, padding: 20, minHeight: 110, borderRadius: 14, background: "transparent",
            border: "1.5px dashed rgba(255,255,255,0.08)", cursor: "pointer",
            transition: "border-color 150ms, background 150ms", color: S.textMuted,
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(232,111,77,0.3)"; el.style.background = "rgba(232,111,77,0.03)"; el.style.color = S.accent }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "transparent"; el.style.color = S.textMuted }}>
            <Plus size={18} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Nouvel espace partagé</span>
          </button>
        </div>
      </section>

      {/* ── Mes espaces privés ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Lock size={13} color="rgba(232,111,77,0.5)" />
          <p style={sectionLabel}>Mes espaces privés</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {privateSpaces.map(ws => (
            <WorkspaceCard key={ws.id} workspace={ws} onClick={() => setSelected(ws)} />
          ))}
          <button type="button" onClick={() => openModal(true)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 10, padding: 20, minHeight: 110, borderRadius: 14, background: "transparent",
            border: "1.5px dashed rgba(255,255,255,0.08)", cursor: "pointer",
            transition: "border-color 150ms, background 150ms", color: S.textMuted,
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(232,111,77,0.3)"; el.style.background = "rgba(232,111,77,0.03)"; el.style.color = S.accent }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "transparent"; el.style.color = S.textMuted }}>
            <Plus size={18} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Nouvel espace privé</span>
          </button>
        </div>
      </section>

      {/* ── Footer invite ── */}
      <div style={{ marginTop: 48, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
        <Users size={16} color={S.textMuted} />
        <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
          Invitez des collaborateurs via{" "}
          <a href="/dashboard/team" style={{ color: S.accent, textDecoration: "none" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none" }}>
            la gestion d&apos;équipe
          </a>{" "}
          pour collaborer sur ces espaces.
        </p>
      </div>

      {/* ── Modals & panels ── */}
      {showModal && (
        <NewWorkspaceModal
          isPrivate={modalPrivate}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
      {selected && (
        <SlideInPanel
          workspace={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
