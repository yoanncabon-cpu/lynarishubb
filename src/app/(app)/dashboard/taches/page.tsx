"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { CheckSquare, Plus, X, Trash2, Calendar as CalIcon, Flag } from "lucide-react"
import { GlassCard } from "@/components/app/glass/GlassCard"
import { GlassChip } from "@/components/app/glass/GlassChip"

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "todo" | "in_progress" | "done"
type TaskPriority = "low" | "medium" | "high"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdBy: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

const STATUSES: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo",        label: "À faire",  color: "#94A3B8" },
  { id: "in_progress", label: "En cours", color: "#F59E0B" },
  { id: "done",        label: "Terminé",  color: "#34D399" },
]

const PRIORITIES: { id: TaskPriority; label: string; color: string }[] = [
  { id: "low",    label: "Basse",   color: "#64748B" },
  { id: "medium", label: "Moyenne", color: "#F59E0B" },
  { id: "high",   label: "Haute",   color: "#EF4444" },
]

const _STATUS_META = Object.fromEntries(STATUSES.map((s) => [s.id, s])) as Record<TaskStatus, typeof STATUSES[number]>
const PRIORITY_META = Object.fromEntries(PRIORITIES.map((p) => [p.id, p])) as Record<TaskPriority, typeof PRIORITIES[number]>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDueDate(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000)
  const overdue = diffDays < 0
  let text: string
  if (diffDays === 0) text = "Aujourd'hui"
  else if (diffDays === 1) text = "Demain"
  else if (diffDays === -1) text = "Hier"
  else if (diffDays > 1 && diffDays < 7) text = `Dans ${diffDays} jours`
  else if (diffDays < -1 && diffDays > -7) text = `Il y a ${-diffDays} jours`
  else text = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  return { text, overdue }
}

// ─── Modal créer/éditer ─────────────────────────────────────────────────────

function TaskModal({ task, onClose, onSaved }: { task?: Task; onClose: () => void; onSaved: (t: Task) => void }) {
  const isEdit = task !== undefined
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium")
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ? task.dueDate.slice(0, 10) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    const url = isEdit ? `/api/tasks/${task!.id}` : "/api/tasks"
    const method = isEdit ? "PATCH" : "POST"
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate + "T12:00:00").toISOString() : null,
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json() as { task: Task }
      onSaved(data.task)
      onClose()
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string }
      setError(d.error ?? `Erreur ${res.status}`)
    }
    setSaving(false)
  }

  return (
    <div
      className="aut-modal-shell"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="aut-modal-card" style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "90dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>{isEdit ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(250,250,250,0.4)", display: "flex", padding: 4 }}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Titre */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Titre</label>
            <input
              required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              placeholder="ex : Finir la proposition pour Paul"
              className="ly-input"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "rgba(250,250,250,0.4)" }}>(optionnel)</span></label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Détails, notes, lien..."
              className="ly-input"
              style={{ width: "100%", padding: "10px 12px", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>

          {/* Statut + Priorité */}
          <div className="aut-grid aut-grid-2">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Statut</label>
              <div style={{ display: "flex", gap: 4 }}>
                {STATUSES.map((s) => (
                  <GlassChip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}
                    style={{ flex: 1, justifyContent: "center", padding: "7px 0", fontSize: 11, fontWeight: 600 }}>
                    {s.label}
                  </GlassChip>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Priorité</label>
              <div style={{ display: "flex", gap: 4 }}>
                {PRIORITIES.map((p) => (
                  <GlassChip key={p.id} active={priority === p.id} onClick={() => setPriority(p.id)}
                    style={{
                      flex: 1, justifyContent: "center", padding: "7px 0", fontSize: 11, fontWeight: 600,
                      color: priority === p.id ? p.color : undefined,
                      borderColor: priority === p.id ? p.color + "55" : undefined,
                      background: priority === p.id ? p.color + "1A" : undefined,
                    }}>
                    {p.label}
                  </GlassChip>
                ))}
              </div>
            </div>
          </div>

          {/* Échéance */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.55)", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Échéance <span style={{ fontWeight: 400, textTransform: "none", color: "rgba(250,250,250,0.4)" }}>(optionnel)</span></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="ly-input"
              style={{ padding: "10px 12px", fontSize: 13 }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            style={{ marginTop: 4, padding: "12px 0", background: saving ? "rgba(232,111,77,0.4)" : "#E86F4D", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? (isEdit ? "Enregistrement…" : "Création…") : (isEdit ? "Enregistrer" : "Créer la tâche")}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Card tâche ───────────────────────────────────────────────────────────────

function TaskCard({ task, onToggleStatus, onDelete, onEdit }: {
  task: Task
  onToggleStatus: (t: Task) => void
  onDelete: (id: string) => void
  onEdit: (t: Task) => void
}) {
  const due = formatDueDate(task.dueDate)
  const priorityMeta = PRIORITY_META[task.priority]
  const isDone = task.status === "done"

  return (
    <GlassCard radius={14} padding={0} hover={false} style={{ opacity: isDone ? 0.65 : 1, overflow: "hidden", borderLeft: `3px solid ${priorityMeta.color}` }}>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Checkbox toggle done */}
          <button
            type="button"
            onClick={() => onToggleStatus(task)}
            aria-label={isDone ? "Marquer à faire" : "Marquer terminé"}
            style={{
              flexShrink: 0,
              marginTop: 2,
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `1.5px solid ${isDone ? "#34D399" : "rgba(255,255,255,0.2)"}`,
              background: isDone ? "#34D399" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "all 150ms",
            }}
          >
            {isDone && <CheckSquare size={11} color="#0A0A0A" strokeWidth={3} aria-hidden />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <button type="button" onClick={() => onEdit(task)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%" }}>
              <p style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#FAFAFA",
                margin: 0,
                lineHeight: 1.4,
                textDecoration: isDone ? "line-through" : "none",
                textDecorationColor: "rgba(250,250,250,0.4)",
              }}>
                {task.title}
              </p>
              {task.description && (
                <p style={{ fontSize: 12, color: "rgba(250,250,250,0.55)", margin: "4px 0 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {task.description}
                </p>
              )}
            </button>
          </div>

          <button type="button" onClick={() => onDelete(task.id)}
            aria-label="Supprimer"
            style={{ flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", color: "rgba(250,250,250,0.3)", padding: 4, borderRadius: 6, display: "flex" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(250,250,250,0.3)" }}>
            <Trash2 size={13} aria-hidden />
          </button>
        </div>

        {/* Footer : priorité + due date */}
        {(due || task.createdBy.startsWith("agent:")) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 28, flexWrap: "wrap" }}>
            {due && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 500,
                color: due.overdue && !isDone ? "#F87171" : "rgba(250,250,250,0.5)",
              }}>
                <CalIcon size={11} aria-hidden />
                {due.text}
              </span>
            )}
            {task.createdBy.startsWith("agent:") && (
              <span style={{ fontSize: 10, color: "rgba(250,250,250,0.35)", fontStyle: "italic" }}>
                créé par {task.createdBy.replace("agent:", "")}
              </span>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "kanban"

export default function TachesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [view, setView] = useState<ViewMode>("list")
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all")

  const fetchTasks = useCallback(() => {
    setLoading(true)
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d: { tasks: Task[] }) => setTasks(d.tasks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleToggleStatus(t: Task) {
    // Cycle todo → in_progress → done → todo
    const next: TaskStatus = t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "done" : "todo"
    // Optimistic
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: next, completedAt: next === "done" ? new Date().toISOString() : null } : x))
    const res = await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) fetchTasks() // rollback via refetch en cas d'erreur
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (!res.ok) fetchTasks()
  }

  // Filtre priorité
  const filtered = useMemo(() => {
    return filterPriority === "all" ? tasks : tasks.filter((t) => t.priority === filterPriority)
  }, [tasks, filterPriority])

  // Stats
  const stats = useMemo(() => ({
    todo:        tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
    overdue:     tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
  }), [tasks])

  // Groupes pour la vue liste (par statut)
  const byStatus = useMemo(() => ({
    todo:        filtered.filter((t) => t.status === "todo"),
    in_progress: filtered.filter((t) => t.status === "in_progress"),
    done:        filtered.filter((t) => t.status === "done"),
  }), [filtered])

  return (
    <div className="aut-page" style={{ padding: "clamp(18px, 3vw, 28px) clamp(14px, 4vw, 32px)", maxWidth: 1480, margin: "0 auto", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckSquare size={20} color="#E86F4D" aria-hidden />
          <div>
            <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#FAFAFA", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Tâches</h1>
            <p style={{ fontSize: 13, color: "rgba(250,250,250,0.45)", margin: "4px 0 0" }}>
              Ta todo list — accessible aussi à tes agents
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#E86F4D", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} aria-hidden />
          Nouvelle tâche
        </button>
      </div>

      {/* Stats bar */}
      {tasks.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 22 }}>
          {[
            { label: "À faire",   value: stats.todo,        color: "#94A3B8" },
            { label: "En cours",  value: stats.in_progress, color: "#F59E0B" },
            { label: "Terminées", value: stats.done,        color: "#34D399" },
            { label: "En retard", value: stats.overdue,     color: "#EF4444" },
          ].map((s) => (
            <GlassCard key={s.label} radius={12} padding="10px 14px" hover={false}>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "rgba(250,250,250,0.4)", margin: 0 }}>{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Filtres + toggle vue */}
      {tasks.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(250,250,250,0.4)", marginRight: 4 }}>
              <Flag size={11} style={{ display: "inline", marginRight: 4 }} aria-hidden />
              Priorité :
            </span>
            <GlassChip active={filterPriority === "all"} onClick={() => setFilterPriority("all")}
              style={{ fontSize: 11, padding: "4px 10px" }}>Toutes</GlassChip>
            {PRIORITIES.map((p) => (
              <GlassChip key={p.id} active={filterPriority === p.id} onClick={() => setFilterPriority(p.id)}
                style={{
                  fontSize: 11, padding: "4px 10px",
                  color: filterPriority === p.id ? p.color : undefined,
                  borderColor: filterPriority === p.id ? p.color + "55" : undefined,
                  background: filterPriority === p.id ? p.color + "1A" : undefined,
                }}>
                {p.label}
              </GlassChip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["list", "kanban"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setView(mode)}
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: "5px 12px",
                  background: view === mode ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${view === mode ? "rgba(232,111,77,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  color: view === mode ? "#E86F4D" : "rgba(250,250,250,0.6)",
                  cursor: "pointer",
                }}>
                {mode === "list" ? "Liste" : "Kanban"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 64, borderRadius: 14, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
          <CheckSquare size={48} color="rgba(250,250,250,0.08)" aria-hidden />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(250,250,250,0.5)", margin: "0 0 6px" }}>
              Aucune tâche pour le moment
            </p>
            <p style={{ fontSize: 13, color: "rgba(250,250,250,0.3)", margin: 0 }}>
              Crée ta première tâche — Charles peut aussi en ajouter via les automatisations
            </p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)}
            style={{ fontSize: 13, fontWeight: 600, color: "#E86F4D", padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(232,111,77,0.3)", background: "rgba(232,111,77,0.08)", cursor: "pointer" }}>
            Créer une tâche →
          </button>
        </div>
      ) : view === "kanban" ? (
        // ─── Vue Kanban : 3 colonnes ──────────────────────────────────────
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {STATUSES.map((col) => {
            const colTasks = byStatus[col.id]
            return (
              <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px 6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: col.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(250,250,250,0.35)" }}>· {colTasks.length}</span>
                </div>
                {colTasks.length === 0 ? (
                  <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 12, color: "rgba(250,250,250,0.25)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 12 }}>
                    Vide
                  </div>
                ) : (
                  colTasks.map((t) => <TaskCard key={t.id} task={t} onToggleStatus={handleToggleStatus} onDelete={handleDelete} onEdit={setEditingTask} />)
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // ─── Vue Liste : groupée par statut ──────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STATUSES.map((s) => {
            const list = byStatus[s.id]
            if (list.length === 0) return null
            return (
              <React.Fragment key={s.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "12px 0 4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{s.label}</p>
                  <span style={{ fontSize: 11, color: "rgba(250,250,250,0.3)" }}>· {list.length}</span>
                </div>
                {list.map((t) => <TaskCard key={t.id} task={t} onToggleStatus={handleToggleStatus} onDelete={handleDelete} onEdit={setEditingTask} />)}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {showCreate && (
        <TaskModal onClose={() => setShowCreate(false)} onSaved={(t) => setTasks((prev) => [t, ...prev])} />
      )}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onSaved={(updated) => setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))} />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
