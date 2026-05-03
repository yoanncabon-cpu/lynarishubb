"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Search,
  FolderPlus,
  Upload,
  File,
  Folder,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronDown,
  FolderOpen,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc"

interface DocFile {
  id: string
  name: string
  size: string
  sizeBytes: number
  mimeType: string
  addedAt: number
  storagePath: string | null
}

interface DocFolder {
  id: string
  name: string
  files: DocFile[]
  addedAt: number
}

// DB row shape returned by Supabase
interface DbDocument {
  id: string
  org_id: string
  folder_id: string | null
  name: string
  type: "file" | "folder"
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  created_at: string
  updated_at: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function sortFiles(files: DocFile[], key: SortKey): DocFile[] {
  return [...files].sort((a, b) => {
    switch (key) {
      case "name-asc":  return a.name.localeCompare(b.name)
      case "name-desc": return b.name.localeCompare(a.name)
      case "date-asc":  return a.addedAt - b.addedAt
      case "date-desc": return b.addedAt - a.addedAt
      case "size-asc":  return a.sizeBytes - b.sizeBytes
      case "size-desc": return b.sizeBytes - a.sizeBytes
    }
  })
}

function sortFolders(folders: DocFolder[], key: SortKey): DocFolder[] {
  return [...folders].sort((a, b) => {
    switch (key) {
      case "name-asc":  return a.name.localeCompare(b.name)
      case "name-desc": return b.name.localeCompare(a.name)
      default:          return b.addedAt - a.addedAt
    }
  })
}

function dbToDocFile(row: DbDocument): DocFile {
  return {
    id: row.id,
    name: row.name,
    size: row.size_bytes ? formatFileSize(row.size_bytes) : "—",
    sizeBytes: row.size_bytes ?? 0,
    mimeType: row.mime_type ?? "Fichier",
    addedAt: new Date(row.created_at).getTime(),
    storagePath: row.storage_path,
  }
}

function dbToDocFolder(row: DbDocument): DocFolder {
  return {
    id: row.id,
    name: row.name,
    files: [],
    addedAt: new Date(row.created_at).getTime(),
  }
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date-desc", label: "Date (récent)" },
  { key: "date-asc",  label: "Date (ancien)" },
  { key: "name-asc",  label: "Nom A → Z" },
  { key: "name-desc", label: "Nom Z → A" },
  { key: "size-desc", label: "Taille (grand)" },
  { key: "size-asc",  label: "Taille (petit)" },
]

// ── Modals ────────────────────────────────────────────────────────────────────

function NameModal({
  title,
  initial,
  onConfirm,
  onClose,
}: {
  title: string
  initial: string
  onConfirm: (name: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(initial)

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        width: "min(420px,100%)",
        background: "rgba(28,28,36,0.9)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid var(--glass-border-strong)", borderRadius: 20,
        padding: "24px 24px 20px",
        boxShadow: "0 30px 80px -25px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{title}</p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) { onConfirm(value.trim()); onClose() }
            if (e.key === "Escape") onClose()
          }}
          placeholder="Nom du dossier"
          className="ly-input"
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{
            height: 38, padding: "0 16px", borderRadius: 11,
            border: "1px solid var(--glass-border)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(250,250,250,0.78)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>Annuler</button>
          <button
            type="button"
            onClick={() => { if (value.trim()) { onConfirm(value.trim()); onClose() } }}
            disabled={!value.trim()}
            style={{
              height: 38, padding: "0 18px", borderRadius: 11, border: "none",
              background: value.trim()
                ? "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)"
                : "rgba(232,111,77,0.35)",
              color: "white", fontSize: 13, fontWeight: 600,
              cursor: value.trim() ? "pointer" : "not-allowed",
              boxShadow: value.trim() ? "0 8px 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
              transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
            }}
          >Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  message,
  onConfirm,
  onClose,
}: {
  message: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        width: "min(400px,100%)",
        background: "rgba(28,28,36,0.9)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid var(--glass-border-strong)", borderRadius: 20,
        padding: "24px 24px 20px",
        boxShadow: "0 30px 80px -25px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(250,250,250,0.82)", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{
            height: 38, padding: "0 16px", borderRadius: 11,
            border: "1px solid var(--glass-border)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(250,250,250,0.78)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>Annuler</button>
          <button type="button" onClick={() => { onConfirm(); onClose() }} style={{
            height: 38, padding: "0 18px", borderRadius: 11, border: "none",
            background: "rgba(239,68,68,0.85)", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 8px 24px -8px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

// ── Folder card ───────────────────────────────────────────────────────────────

function FolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: DocFolder
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ position: "relative", width: 168 }}>
      <button
        type="button"
        onClick={onOpen}
        className="ly-card ly-card-hover"
        style={{
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          width: "100%", padding: "14px 14px 12px",
          borderRadius: 14,
          cursor: "pointer", textAlign: "left",
        }}
      >
        <Folder size={22} color="#F59E0B" aria-hidden style={{ marginBottom: 8 }} />
        <span style={{
          fontSize: 13, fontWeight: 500, color: "#F5F5F7",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          width: "100%", display: "block",
        }}>{folder.name}</span>
        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", marginTop: 2 }}>
          {folder.files.length} fichier{folder.files.length !== 1 ? "s" : ""}
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 24, height: 24, borderRadius: 6,
          border: "none", background: menuOpen ? "rgba(255,255,255,0.12)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(245,245,247,0.5)",
          transition: "background 0.15s",
        }}
        aria-label={`Options du dossier ${folder.name}`}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)" }}
        onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <MoreHorizontal size={14} />
      </button>

      {menuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setMenuOpen(false)} />
          <div
            ref={menuRef}
            style={{
              position: "absolute", top: 36, right: 0, zIndex: 101,
              background: "rgba(28,28,36,0.92)",
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
              border: "1px solid var(--glass-border-strong)",
              borderRadius: 12, overflow: "hidden",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
              minWidth: 160,
            }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename() }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "9px 14px", background: "none", border: "none",
                fontSize: 13, color: "#D4D4D8", cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none" }}
            >
              <Pencil size={13} /> Renommer
            </button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 10px" }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "9px 14px", background: "none", border: "none",
                fontSize: 13, color: "#F87171", cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none" }}
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch] = useState("")
  const [folders, setFolders] = useState<DocFolder[]>([])
  const [rootFiles, setRootFiles] = useState<DocFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("date-desc")
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef2 = useRef<HTMLInputElement>(null)

  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  type Modal =
    | { type: "create" }
    | { type: "rename"; folderId: string; current: string }
    | { type: "delete"; folderId: string; name: string }
    | { type: "deleteFile"; fileId: string; name: string }
    | null

  const [modal, setModal] = useState<Modal>(null)

  const openFolder = openFolderId ? folders.find((f) => f.id === openFolderId) ?? null : null

  // ── Chargement initial (racine) ───────────────────────────────────────────

  const loadRoot = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/documents")
      if (!res.ok) return
      const json = await res.json() as { documents: DbDocument[] }
      const docs = json.documents ?? []
      setFolders(docs.filter((d) => d.type === "folder").map(dbToDocFolder))
      setRootFiles(docs.filter((d) => d.type === "file").map(dbToDocFile))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadRoot() }, [loadRoot])

  // ── Chargement fichiers d'un dossier ──────────────────────────────────────

  const loadFolderFiles = useCallback(async (folderId: string) => {
    const res = await fetch(`/api/documents?folderId=${folderId}`)
    if (!res.ok) return
    const json = await res.json() as { documents: DbDocument[] }
    const files = (json.documents ?? []).filter((d) => d.type === "file").map(dbToDocFile)
    setFolders((prev) =>
      prev.map((fo) => (fo.id === folderId ? { ...fo, files } : fo))
    )
  }, [])

  function handleOpenFolder(folderId: string) {
    setOpenFolderId(folderId)
    void loadFolderFiles(folderId)
  }

  // ── Créer dossier ─────────────────────────────────────────────────────────

  async function createFolder(name: string) {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "folder" }),
    })
    if (!res.ok) return
    const json = await res.json() as { document: DbDocument }
    setFolders((prev) => [dbToDocFolder(json.document), ...prev])
  }

  // ── Upload fichiers ───────────────────────────────────────────────────────

  async function uploadFiles(rawFiles: File[], folderId: string | null) {
    if (!rawFiles.length) return
    setUploading(true)
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    try {
      for (const file of rawFiles) {
        let storagePath: string | null = null

        if (user) {
          const path = `${user.id}/${Date.now()}-${file.name}`
          const { error: storageError } = await supabase.storage
            .from("documents")
            .upload(path, file, { upsert: false })
          if (!storageError) storagePath = path
        }

        const body: Record<string, unknown> = {
          name: file.name,
          type: "file",
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }
        if (folderId) body.folderId = folderId
        if (storagePath) body.storagePath = storagePath

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) continue
        const json = await res.json() as { document: DbDocument }
        const docFile = dbToDocFile(json.document)

        if (folderId) {
          setFolders((prev) =>
            prev.map((fo) =>
              fo.id === folderId ? { ...fo, files: [docFile, ...fo.files] } : fo
            )
          )
        } else {
          setRootFiles((prev) => [docFile, ...prev])
        }
      }
    } finally {
      setUploading(false)
    }
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    void uploadFiles(Array.from(e.dataTransfer.files), openFolderId)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(e.target.files ?? []), openFolderId)
    if (e.target) e.target.value = ""
  }

  async function handleFolderInput(e: React.ChangeEvent<HTMLInputElement>) {
    const allFiles = Array.from(e.target.files ?? [])
    if (!allFiles.length) return

    const folderName =
      allFiles[0]?.webkitRelativePath?.split("/")[0] ?? "Dossier importé"

    // Créer le dossier en DB d'abord
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, type: "folder" }),
    })
    if (!res.ok) { if (e.target) e.target.value = ""; return }
    const json = await res.json() as { document: DbDocument }
    const newFolder = dbToDocFolder(json.document)
    setFolders((prev) => [newFolder, ...prev])

    await uploadFiles(allFiles, newFolder.id)
    if (e.target) e.target.value = ""
  }

  // ── Renommer dossier ──────────────────────────────────────────────────────

  async function renameFolder(folderId: string, name: string) {
    const res = await fetch(`/api/documents/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) return
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name } : f))
    )
  }

  // ── Supprimer dossier ─────────────────────────────────────────────────────

  async function deleteFolder(folderId: string) {
    await fetch(`/api/documents/${folderId}`, { method: "DELETE" })
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    if (openFolderId === folderId) setOpenFolderId(null)
  }

  // ── Supprimer fichier ─────────────────────────────────────────────────────

  async function deleteFile(fileId: string) {
    await fetch(`/api/documents/${fileId}`, { method: "DELETE" })
    if (openFolderId) {
      setFolders((prev) =>
        prev.map((fo) =>
          fo.id === openFolderId
            ? { ...fo, files: fo.files.filter((f) => f.id !== fileId) }
            : fo
        )
      )
    } else {
      setRootFiles((prev) => prev.filter((f) => f.id !== fileId))
    }
  }

  // ── Display ───────────────────────────────────────────────────────────────

  const currentFiles = openFolder ? openFolder.files : rootFiles

  const displayFiles = sortFiles(
    currentFiles.filter(
      (f) => !search || f.name.toLowerCase().includes(search.toLowerCase())
    ),
    sortKey
  )

  const displayFolders = !openFolder
    ? sortFolders(
        folders.filter(
          (f) => !search || f.name.toLowerCase().includes(search.toLowerCase())
        ),
        sortKey
      )
    : []

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Trier"

  return (
    <div style={{ padding: "32px 40px" }}>

      {/* ── Modals ── */}
      {modal?.type === "create" && (
        <NameModal
          title="Nouveau dossier"
          initial=""
          onConfirm={(name) => void createFolder(name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "rename" && (
        <NameModal
          title="Renommer le dossier"
          initial={modal.current}
          onConfirm={(name) => void renameFolder(modal.folderId, name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          message={`Supprimer le dossier "${modal.name}" et tous ses fichiers ?`}
          onConfirm={() => void deleteFolder(modal.folderId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "deleteFile" && (
        <ConfirmModal
          message={`Supprimer le fichier "${modal.name}" ?`}
          onConfirm={() => void deleteFile(modal.fileId)}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Header ── */}
      <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "#FAFAFA", margin: "0 0 20px", lineHeight: 1.1 }}>Mes contenus</h1>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setOpenFolderId(null)}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: openFolder ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: openFolder ? "rgba(245,245,247,0.5)" : "rgba(245,245,247,0.75)",
          }}>
            Mes documents
          </span>
        </button>
        {openFolder && (
          <>
            <ChevronRight size={12} color="rgba(245,245,247,0.35)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{openFolder.name}</span>
          </>
        )}
      </div>

      {/* ── Actions bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, height: 38,
          padding: "0 13px", width: 340,
          border: "1px solid var(--glass-border)", borderRadius: 11,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          transition: "border-color 220ms var(--ease-apple), background 220ms var(--ease-apple)",
        }}>
          <Search size={14} color="rgba(245,245,247,0.4)" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans mes documents..."
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: 13, color: "#FAFAFA", flex: 1,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {openFolder && (
            <button type="button" onClick={() => setOpenFolderId(null)} style={{
              display: "flex", alignItems: "center", gap: 5, height: 38, padding: "0 14px",
              border: "1px solid var(--glass-border)", borderRadius: 11,
              background: "rgba(255,255,255,0.04)", fontSize: 13,
              color: "rgba(250,250,250,0.78)", cursor: "pointer",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              transition: "all 220ms var(--ease-apple)",
            }}>
              <ArrowLeft size={13} /> Retour
            </button>
          )}

          {/* Tri */}
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setSortMenuOpen((o) => !o)} style={{
              display: "flex", alignItems: "center", gap: 5, height: 38, padding: "0 14px",
              border: "1px solid var(--glass-border)", borderRadius: 11,
              background: "rgba(255,255,255,0.04)", fontSize: 13,
              color: "rgba(250,250,250,0.78)", cursor: "pointer", whiteSpace: "nowrap",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              transition: "all 220ms var(--ease-apple)",
            }}>
              {currentSortLabel} <ChevronDown size={13} />
            </button>
            {sortMenuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setSortMenuOpen(false)} />
                <div style={{
                  position: "absolute", top: 42, right: 0, zIndex: 101,
                  background: "rgba(28,28,36,0.92)",
                  backdropFilter: "blur(28px) saturate(1.6)",
                  WebkitBackdropFilter: "blur(28px) saturate(1.6)",
                  border: "1px solid var(--glass-border-strong)",
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
                  minWidth: 180,
                }}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setSortKey(opt.key); setSortMenuOpen(false) }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "9px 14px", background: "none", border: "none",
                        fontSize: 13, color: sortKey === opt.key ? "#E86F4D" : "#D4D4D8",
                        cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none" }}
                    >
                      {opt.label}
                      {sortKey === opt.key && (
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#E86F4D", display: "inline-block",
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Import dossier depuis appareil */}
          {!openFolder && (
            <button type="button" onClick={() => folderInputRef2.current?.click()} style={{
              display: "flex", alignItems: "center", gap: 5, height: 38, padding: "0 14px",
              border: "1px solid var(--glass-border)", borderRadius: 11,
              background: "rgba(255,255,255,0.04)", fontSize: 13,
              color: "rgba(250,250,250,0.78)", cursor: "pointer",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              transition: "all 220ms var(--ease-apple)",
            }}>
              <FolderOpen size={13} aria-hidden /> Importer un dossier
            </button>
          )}
          <input
            ref={folderInputRef2}
            type="file"
            // @ts-expect-error — webkitdirectory est un attribut non-standard supporté par Chrome/Edge/Firefox
            webkitdirectory=""
            multiple
            onChange={handleFolderInput}
            style={{ display: "none" }}
          />

          {/* Ajouter fichiers */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", gap: 5, height: 38, padding: "0 16px",
              border: "none", borderRadius: 11,
              background: uploading
                ? "rgba(232,111,77,0.55)"
                : "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
              fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: uploading ? "none" : "0 8px 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
              transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
            }}
          >
            <Upload size={13} aria-hidden /> {uploading ? "Upload…" : "Ajouter"}
          </button>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileInput} style={{ display: "none" }} />
        </div>
      </div>

      {/* ── Dossiers (vue racine uniquement) ── */}
      {!openFolder && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "rgba(245,245,247,0.75)", margin: "0 0 12px" }}>Dossiers</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: 168, height: 76,
                borderRadius: 14, border: "1.5px dashed rgba(232,111,77,0.32)",
                background: "rgba(232,111,77,0.04)", fontSize: 13,
                color: "rgba(250,250,250,0.7)", cursor: "pointer", justifyContent: "center",
                transition: "all 220ms var(--ease-apple)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,111,77,0.6)"
                ;(e.currentTarget as HTMLElement).style.background = "rgba(232,111,77,0.10)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,111,77,0.32)"
                ;(e.currentTarget as HTMLElement).style.background = "rgba(232,111,77,0.04)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.7)"
              }}
            >
              <FolderPlus size={16} aria-hidden /> Nouveau dossier
            </button>

            {loading ? (
              <span style={{ fontSize: 13, color: "rgba(245,245,247,0.3)", alignSelf: "center" }}>
                Chargement…
              </span>
            ) : (
              displayFolders.map((fo) => (
                <FolderCard
                  key={fo.id}
                  folder={fo}
                  onOpen={() => handleOpenFolder(fo.id)}
                  onRename={() => setModal({ type: "rename", folderId: fo.id, current: fo.name })}
                  onDelete={() => setModal({ type: "delete", folderId: fo.id, name: fo.name })}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Fichiers ── */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "rgba(245,245,247,0.75)", margin: "0 0 12px" }}>
          {openFolder ? `Fichiers — ${openFolder.name}` : "Fichiers"}
        </h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          style={{
            minHeight: 200, borderRadius: 20,
            border: `2px dashed ${dragging ? "var(--accent)" : "var(--glass-border)"}`,
            background: dragging
              ? "rgba(232,111,77,0.10)"
              : "rgba(28,28,36,0.42)",
            backdropFilter: "blur(28px) saturate(1.6)",
            WebkitBackdropFilter: "blur(28px) saturate(1.6)",
            boxShadow: dragging
              ? "0 0 0 4px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            alignItems: displayFiles.length === 0 ? "center" : "stretch",
            justifyContent: displayFiles.length === 0 ? "center" : "flex-start",
            gap: 8, transition: "all 220ms var(--ease-apple)", padding: 24,
          }}
        >
          {displayFiles.length === 0 ? (
            <>
              <File size={28} color="rgba(245,245,247,0.3)" aria-hidden />
              <p style={{ fontSize: 14, color: "rgba(245,245,247,0.75)", margin: 0, textAlign: "center" }}>
                Déposez vos documents ici ou{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "none", border: "none", color: "#E86F4D",
                    fontSize: 14, cursor: "pointer", padding: 0,
                  }}
                >
                  parcourir
                </button>
              </p>
              <p style={{ fontSize: 12, color: "rgba(245,245,247,0.3)", margin: 0 }}>Taille max. 25 Mo</p>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {displayFiles.map((f) => (
                <div
                  key={f.id}
                  className="ly-surface"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 12,
                  }}
                >
                  <File size={16} color="rgba(245,245,247,0.45)" aria-hidden />
                  <span style={{ flex: 1, fontSize: 13, color: "#F5F5F7" }}>{f.name}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,245,247,0.3)", flexShrink: 0, marginRight: 8 }}>
                    {f.size}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "deleteFile", fileId: f.id, name: f.name })}
                    aria-label={`Supprimer ${f.name}`}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(245,245,247,0.3)", padding: 4,
                      display: "flex", borderRadius: 4, transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F87171" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,245,247,0.3)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
