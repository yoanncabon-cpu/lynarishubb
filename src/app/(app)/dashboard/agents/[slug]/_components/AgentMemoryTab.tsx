"use client"

import { useState } from "react"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { useCharlesMemory, type Memory } from "@/hooks/useCharlesMemory"

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  contact: { bg: "rgba(34,211,238,0.12)", text: "#22D3EE" },
  préférence: { bg: "rgba(124,58,237,0.12)", text: "#A78BFA" },
  deadline: { bg: "rgba(239,68,68,0.12)", text: "#F87171" },
  rdv: { bg: "rgba(16,185,129,0.12)", text: "#34D399" },
  projet: { bg: "rgba(232,111,77,0.12)", text: "#E86F4D" },
  note: { bg: "rgba(245,158,11,0.12)", text: "#FBBF24" },
}

function tagStyle(tag: string) {
  const lower = tag.toLowerCase()
  for (const key of Object.keys(TAG_COLORS)) {
    if (lower.includes(key)) return TAG_COLORS[key]!
  }
  return { bg: "rgba(255,255,255,0.08)", text: "rgba(245,245,247,0.6)" }
}

function ImportanceDot({ level }: { level: 1 | 2 | 3 }) {
  const map: Record<1 | 2 | 3, { color: string; label: string }> = {
    1: { color: "#6A6A7A", label: "Faible" },
    2: { color: "#FBBF24", label: "Normal" },
    3: { color: "#EF4444", label: "Critique" },
  }
  const { color, label } = map[level]
  return (
    <span
      title={label}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: level === 3 ? `0 0 6px ${color}80` : undefined,
        flexShrink: 0,
      }}
      aria-label={label}
    />
  )
}

const PRESET_TAGS = ["contact", "préférence", "deadline", "rdv", "projet", "note"]

export function AgentMemoryTab() {
  const { memories, loading, addMemory, deleteMemory } = useCharlesMemory()
  const [content, setContent] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [importance, setImportance] = useState<1 | 2 | 3>(2)
  const [saving, setSaving] = useState(false)

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function addCustomTag() {
    const t = customTag.trim().toLowerCase()
    if (t && !selectedTags.includes(t)) {
      setSelectedTags((prev) => [...prev, t])
    }
    setCustomTag("")
  }

  async function handleSave() {
    if (!content.trim() || saving) return
    setSaving(true)
    try {
      await addMemory(content.trim(), selectedTags, importance)
      setContent("")
      setSelectedTags([])
      setImportance(2)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Add memory form */}
      <div
        style={{
          background: "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.18)",
          borderRadius: 14,
          padding: "18px 20px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A78BFA",
            margin: "0 0 12px",
          }}
        >
          Ajouter un souvenir
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ex: Jean Dupont préfère les réunions le matin..."
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F5F7",
            fontSize: 13,
            lineHeight: 1.6,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(124,58,237,0.5)"
          }}
          onBlur={(e) => {
            ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.12)"
          }}
        />

        {/* Tag selection */}
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {PRESET_TAGS.map((tag) => {
            const active = selectedTags.includes(tag)
            const s = tagStyle(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${active ? s.text : "rgba(255,255,255,0.12)"}`,
                  background: active ? s.bg : "transparent",
                  color: active ? s.text : "rgba(245,245,247,0.45)",
                  transition: "all 0.15s",
                  outline: "none",
                }}
              >
                {tag}
              </button>
            )
          })}

          {/* Custom tag input */}
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCustomTag() }
            }}
            placeholder="+ tag custom"
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 11,
              border: "1px dashed rgba(255,255,255,0.18)",
              background: "transparent",
              color: "rgba(245,245,247,0.5)",
              outline: "none",
              width: 100,
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Importance + save row */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", fontWeight: 600 }}>
            Importance :
          </span>
          {([1, 2, 3] as const).map((lvl) => {
            const colors = { 1: "#6A6A7A", 2: "#FBBF24", 3: "#EF4444" }
            const labels = { 1: "Faible", 2: "Normal", 3: "Critique" }
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setImportance(lvl)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  border: `1px solid ${importance === lvl ? colors[lvl] : "rgba(255,255,255,0.1)"}`,
                  background: importance === lvl ? `${colors[lvl]}18` : "transparent",
                  color: importance === lvl ? colors[lvl] : "rgba(245,245,247,0.4)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  outline: "none",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: colors[lvl],
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {labels[lvl]}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!content.trim() || saving}
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: content.trim() && !saving ? "#7C3AED" : "rgba(255,255,255,0.08)",
              color: content.trim() && !saving ? "#ffffff" : "rgba(245,245,247,0.3)",
              fontSize: 12,
              fontWeight: 600,
              cursor: content.trim() && !saving ? "pointer" : "not-allowed",
              transition: "background 0.15s",
              outline: "none",
              fontFamily: "inherit",
            }}
          >
            {saving ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Plus size={13} />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Memory list */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
          <Loader2 size={16} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "rgba(245,245,247,0.4)" }}>Chargement...</span>
        </div>
      ) : memories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)" }}>
            Aucun souvenir enregistré. Ajoutez des informations que Charles doit retenir.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {memories.map((memory: Memory) => (
            <MemoryCard key={memory.id} memory={memory} onDelete={deleteMemory} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        textarea::placeholder {
          color: rgba(245,245,247,0.25);
        }
      `}</style>
    </div>
  )
}

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: Memory
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  const date = new Date(memory.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    await onDelete(memory.id)
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: deleting ? 0.4 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Importance dot */}
      <div style={{ paddingTop: 3 }}>
        <ImportanceDot level={memory.importance} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            color: "#F5F5F7",
            margin: "0 0 8px",
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {memory.content}
        </p>

        {/* Tags + date */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          {memory.tags.map((tag) => {
            const s = tagStyle(tag)
            return (
              <span
                key={tag}
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: s.bg,
                  color: s.text,
                  border: `1px solid ${s.text}30`,
                }}
              >
                {tag}
              </span>
            )
          })}
          <span
            style={{
              fontSize: 10,
              color: "rgba(245,245,247,0.3)",
              marginLeft: memory.tags.length > 0 ? 4 : 0,
            }}
          >
            {date}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        aria-label="Supprimer ce souvenir"
        style={{
          padding: 6,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "rgba(245,245,247,0.25)",
          cursor: deleting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s",
          flexShrink: 0,
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!deleting) (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(245,245,247,0.25)"
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
