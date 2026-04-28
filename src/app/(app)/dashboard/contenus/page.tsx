"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Library,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  Globe,
  Mail,
  FileText,
  Image,
  Video,
  Workflow,
  Phone,
  BarChart3,
  MessageSquare,
  MessageCircle,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { GlassCard, GlassPanel, GlassChip } from "@/components/app/glass"
import { agents } from "@/lib/agents/data"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string
  attachmentType: string
  storageUrl: string
  mimeType?: string
  width?: number
  height?: number
  position: number
}

interface ContentItem {
  id: string
  agentSlug: string
  contentType: string
  platform?: string
  title: string
  description?: string
  status: string
  externalUrl?: string
  viewsCount: number
  likesCount: number
  commentsCount: number
  sharesCount: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  thumbnail?: Attachment | null
}

interface ContentDetail extends ContentItem {
  body?: string
  attachments: Attachment[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  social_post:  { label: "Post social",     Icon: Globe,         color: "#3B82F6" },
  article:      { label: "Article",          Icon: FileText,      color: "#8B5CF6" },
  email:        { label: "Email",            Icon: Mail,          color: "#F59E0B" },
  sms:          { label: "SMS",              Icon: MessageCircle, color: "#22C55E" },
  image:        { label: "Visuel",           Icon: Image,         color: "#EC4899" },
  video:        { label: "Vidéo",            Icon: Video,         color: "#EF4444" },
  document:     { label: "Document",         Icon: FileText,      color: "#6366F1" },
  workflow:     { label: "Workflow",         Icon: Workflow,      color: "#64748B" },
  call_summary: { label: "Résumé appel",     Icon: Phone,         color: "#22D3EE" },
  report:       { label: "Rapport",          Icon: BarChart3,     color: "#10B981" },
  conversation: { label: "Conversation",     Icon: MessageSquare, color: "#A78BFA" },
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  linkedin:  { label: "LinkedIn",   color: "#0077B5" },
  instagram: { label: "Instagram",  color: "#E1306C" },
  wordpress: { label: "WordPress",  color: "#21759B" },
  gmail:     { label: "Gmail",      color: "#EA4335" },
  whatsapp:  { label: "WhatsApp",   color: "#25D366" },
  twitter:   { label: "Twitter/X",  color: "#1DA1F2" },
}

const TAB_FILTERS = [
  { key: "all",         label: "Tous" },
  { key: "social_post", label: "Posts" },
  { key: "article",     label: "Articles" },
  { key: "email",       label: "Emails" },
  { key: "sms",         label: "SMS" },
  { key: "image",       label: "Visuels" },
  { key: "document",    label: "Documents" },
  { key: "conversation",label: "Conversations" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LucideIcon = React.FC<{ size?: number; color?: string; style?: React.CSSProperties }>

function TypeIcon({ cfg }: { cfg: { Icon: React.ElementType; color: string } }) {
  const Icon = cfg.Icon as LucideIcon
  return <Icon size={36} color={cfg.color} style={{ opacity: 0.6 }} />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({
  item,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  item: ContentItem
  onOpen: (item: ContentItem) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const typeConf = TYPE_CONFIG[item.contentType] ?? { label: item.contentType, Icon: FileText, color: "#64748B" }
  const platformConf = item.platform ? PLATFORM_CONFIG[item.platform] : null
  const agentData = agents.find((a) => a.slug === item.agentSlug)
  const agentColor = agentData?.color ?? "#E86F4D"
  const hasStats = item.viewsCount > 0 || item.likesCount > 0 || item.commentsCount > 0

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [menuOpen])

  return (
    <GlassCard
      tint={`rgba(${hexToRgb(agentColor)},0.12)`}
      radius={18}
      padding={0}
      onClick={() => onOpen(item)}
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 140,
          background: item.thumbnail
            ? "transparent"
            : `linear-gradient(135deg, rgba(${hexToRgb(typeConf.color)},0.18), rgba(${hexToRgb(typeConf.color)},0.04))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail.storageUrl}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <TypeIcon cfg={typeConf} />
        )}

        {/* Badges superposés */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            zIndex: 2,
          }}
        >
          <span
            className="ly-badge"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: typeConf.color,
              background: `rgba(${hexToRgb(typeConf.color)},0.2)`,
              border: `1px solid rgba(${hexToRgb(typeConf.color)},0.32)`,
            }}
          >
            {typeConf.label}
          </span>
          {platformConf && (
            <span
              className="ly-badge"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: platformConf.color,
                background: `rgba(${hexToRgb(platformConf.color)},0.2)`,
                border: `1px solid rgba(${hexToRgb(platformConf.color)},0.32)`,
              }}
            >
              {platformConf.label}
            </span>
          )}
        </div>

        {/* Menu "..." */}
        <div
          ref={menuRef}
          style={{ position: "absolute", top: 8, right: 8, zIndex: 3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="lg-focus"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid var(--glass-border)",
              borderRadius: 10,
              padding: "4px 6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "rgba(250,250,250,0.7)",
            }}
            aria-label="Actions"
          >
            <MoreHorizontal size={14} aria-hidden />
          </button>

          {menuOpen && (
            <GlassPanel
              level={2}
              radius={12}
              padding={0}
              strong
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                overflow: "hidden",
                zIndex: 50,
                minWidth: 180,
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              }}
            >
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    color: "rgba(250,250,250,0.78)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <ExternalLink size={13} aria-hidden />
                  Voir sur la plateforme
                </a>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDuplicate(item.id) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  fontSize: 13,
                  color: "rgba(250,250,250,0.78)",
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                <Copy size={13} aria-hidden />
                Dupliquer
              </button>
              <div style={{ height: 1, background: "var(--glass-border)", margin: "2px 0" }} />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(item.id) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  fontSize: 13,
                  color: "#F87171",
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                <Trash2 size={13} aria-hidden />
                Archiver
              </button>
            </GlassPanel>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
        {/* Agent badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AgentAvatar slug={item.agentSlug} size={20} />
          <span style={{ fontSize: 11, color: "rgba(250,250,250,0.5)", fontWeight: 500 }}>
            {agentData?.name ?? item.agentSlug}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#FAFAFA",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.4,
          }}
        >
          {item.title}
        </p>

        {/* Description */}
        {item.description && (
          <p
            style={{
              fontSize: 12,
              color: "rgba(250,250,250,0.5)",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {item.description}
          </p>
        )}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Date */}
          <span style={{ fontSize: 11, color: "rgba(250,250,250,0.35)", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} aria-hidden />
            {formatDate(item.createdAt)}
          </span>

          {/* Stats */}
          {hasStats && (
            <div style={{ display: "flex", gap: 8 }}>
              {item.viewsCount > 0 && (
                <span style={{ fontSize: 11, color: "rgba(250,250,250,0.4)" }}>
                  👁 {item.viewsCount.toLocaleString("fr-FR")}
                </span>
              )}
              {item.likesCount > 0 && (
                <span style={{ fontSize: 11, color: "rgba(250,250,250,0.4)" }}>
                  ❤️ {item.likesCount.toLocaleString("fr-FR")}
                </span>
              )}
              {item.commentsCount > 0 && (
                <span style={{ fontSize: 11, color: "rgba(250,250,250,0.4)" }}>
                  💬 {item.commentsCount.toLocaleString("fr-FR")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ContentDetailModal({
  contentId,
  onClose,
  onDuplicate,
  onDelete,
}: {
  contentId: string
  onClose: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [detail, setDetail] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [currentImg, setCurrentImg] = useState(0)

  useEffect(() => {
    fetch(`/api/contents/${contentId}`)
      .then((r) => r.json())
      .then((d: { content: ContentDetail }) => {
        setDetail(d.content)
        setEditTitle(d.content.title)
        setEditBody(d.content.body ?? "")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [contentId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  async function saveEdits() {
    if (!detail) return
    const res = await fetch(`/api/contents/${contentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    })
    if (res.ok) {
      const d = await res.json() as { content: ContentDetail }
      setDetail((prev) => prev ? { ...prev, title: d.content.title, body: d.content.body } : prev)
      setEditing(false)
    }
  }

  const typeConf = detail ? (TYPE_CONFIG[detail.contentType] ?? { label: detail.contentType, Icon: FileText, color: "#64748B" }) : null
  const platformConf = detail?.platform ? PLATFORM_CONFIG[detail.platform] : null
  const images = detail?.attachments.filter((a) => a.attachmentType === "image" || a.attachmentType === "thumbnail") ?? []

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <GlassPanel
        level={2}
        radius={22}
        padding={0}
        strong
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--glass-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {detail && <AgentAvatar slug={detail.agentSlug} size={28} />}
            {typeConf && (
              <span
                className="ly-badge"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: typeConf.color,
                  background: `rgba(${hexToRgb(typeConf.color)},0.16)`,
                  border: `1px solid rgba(${hexToRgb(typeConf.color)},0.28)`,
                }}
              >
                {typeConf.label}
              </span>
            )}
            {platformConf && (
              <span
                className="ly-badge"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: platformConf.color,
                  background: `rgba(${hexToRgb(platformConf.color)},0.16)`,
                  border: `1px solid rgba(${hexToRgb(platformConf.color)},0.28)`,
                }}
              >
                {platformConf.label}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {detail?.externalUrl && (
              <a
                href={detail.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lg-focus"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent)",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(232,111,77,0.32)",
                  background: "rgba(232,111,77,0.1)",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={12} aria-hidden />
                Voir sur la plateforme
              </a>
            )}
            {!editing && (
              <GlassChip icon={<Edit2 size={12} />} onClick={() => setEditing(true)}>
                Modifier
              </GlassChip>
            )}
            <GlassChip icon={<Copy size={12} />} onClick={() => { onDuplicate(contentId); onClose() }}>
              Dupliquer
            </GlassChip>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="lg-focus"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(250,250,250,0.45)",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <span style={{ fontSize: 13, color: "rgba(250,250,250,0.35)" }}>Chargement…</span>
            </div>
          ) : detail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Images gallery */}
              {images.length > 0 && (
                <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 280, border: "1px solid var(--glass-border)" }}>
                  <img
                    src={images[currentImg]?.storageUrl}
                    alt={detail.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentImg((i) => (i - 1 + images.length) % images.length)}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: 999,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                        }}
                      >
                        <ChevronLeft size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentImg((i) => (i + 1) % images.length)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: 999,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "#fff",
                          display: "flex",
                        }}
                      >
                        <ChevronRight size={18} aria-hidden />
                      </button>
                      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                        {images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentImg(i)}
                            style={{
                              width: i === currentImg ? 18 : 6,
                              height: 6,
                              borderRadius: 999,
                              background: i === currentImg ? "#fff" : "rgba(255,255,255,0.45)",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 200ms var(--ease-apple)",
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Title */}
              {editing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="ly-input lg-focus"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    borderColor: "rgba(232,111,77,0.4)",
                    padding: "10px 14px",
                    width: "100%",
                  }}
                />
              ) : (
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FAFAFA", margin: 0, lineHeight: 1.3 }}>
                  {detail.title}
                </h2>
              )}

              {/* Date + metadata */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "rgba(250,250,250,0.45)" }}>
                  Créé le {formatDate(detail.createdAt)}
                </span>
                {detail.viewsCount > 0 && (
                  <span style={{ fontSize: 12, color: "rgba(250,250,250,0.45)" }}>
                    👁 {detail.viewsCount.toLocaleString("fr-FR")} vues
                  </span>
                )}
                {detail.likesCount > 0 && (
                  <span style={{ fontSize: 12, color: "rgba(250,250,250,0.45)" }}>
                    ❤️ {detail.likesCount.toLocaleString("fr-FR")} likes
                  </span>
                )}
              </div>

              {/* Body */}
              {editing ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="ly-input lg-focus"
                  style={{
                    fontSize: 13,
                    color: "rgba(250,250,250,0.88)",
                    borderColor: "rgba(232,111,77,0.4)",
                    padding: "12px 14px",
                    width: "100%",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />
              ) : detail.body ? (
                <div
                  className="ly-surface"
                  style={{
                    fontSize: 13,
                    color: "rgba(250,250,250,0.78)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  {detail.body}
                </div>
              ) : null}

              {/* Edit actions */}
              {editing && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => void saveEdits()}
                    className="lg-focus"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--accent)",
                      border: "1px solid rgba(232,111,77,0.6)",
                      borderRadius: 999,
                      padding: "8px 18px",
                      cursor: "pointer",
                      boxShadow: "0 8px 24px var(--accent-glow)",
                    }}
                  >
                    Enregistrer
                  </button>
                  <GlassChip onClick={() => { setEditing(false); setEditTitle(detail.title); setEditBody(detail.body ?? "") }}>
                    Annuler
                  </GlassChip>
                </div>
              )}

              {/* Danger zone */}
              <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => { onDelete(contentId); onClose() }}
                  className="lg-focus"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#F87171",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.25)",
                    borderRadius: 999,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={12} aria-hidden />
                  Archiver ce contenu
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "rgba(250,250,250,0.45)", textAlign: "center", padding: "48px 0" }}>
              Contenu introuvable
            </p>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContenuPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeType, setActiveType] = useState("all")
  const [activeAgent, setActiveAgent] = useState("all")
  const [sort, setSort] = useState<"recent" | "oldest">("recent")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)
  const agentMenuRef = useRef<HTMLDivElement>(null)

  const fetchItems = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeType !== "all") params.set("type", activeType)
    if (activeAgent !== "all") params.set("agent", activeAgent)
    if (search) params.set("search", search)
    params.set("limit", "48")

    fetch(`/api/contents?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items: ContentItem[] }) => {
        let sorted = d.items ?? []
        if (sort === "oldest") sorted = [...sorted].reverse()
        setItems(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeType, activeAgent, search, sort])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setAgentMenuOpen(false)
      }
    }
    if (agentMenuOpen) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [agentMenuOpen])

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/contents/${id}/duplicate`, { method: "POST" })
    if (res.ok) fetchItems()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/contents/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const activeAgentData = activeAgent !== "all" ? agents.find((a) => a.slug === activeAgent) : null

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Library size={20} color="var(--accent)" aria-hidden />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
              Mes contenus
            </h1>
            <p style={{ fontSize: 12, color: "rgba(250,250,250,0.45)", margin: "2px 0 0" }}>
              Tout ce que vos agents ont produit — centralisé et réutilisable
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GlassChip>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,250,250,0.55)" }}>
              Calendrier — bientôt
            </span>
          </GlassChip>
        </div>
      </div>

      {/* Type tabs */}
      <div
        data-tour="contents-filters"
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap",
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {TAB_FILTERS.map((tab) => (
          <GlassChip
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            active={activeType === tab.key}
          >
            {tab.label}
          </GlassChip>
        ))}
      </div>

      {/* Search + filters bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {/* Search */}
        <div
          className="ly-surface lg-focus"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 200,
            borderRadius: 12,
            padding: "0 14px",
            height: 40,
          }}
        >
          <Search size={14} color="rgba(250,250,250,0.4)" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans mes contenus…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#FAFAFA",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(250,250,250,0.45)", padding: 2, display: "flex" }}
              aria-label="Effacer la recherche"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>

        {/* Agent filter */}
        <div ref={agentMenuRef} style={{ position: "relative" }}>
          <GlassChip
            onClick={() => setAgentMenuOpen((o) => !o)}
            active={activeAgent !== "all"}
            icon={activeAgentData ? <AgentAvatar slug={activeAgentData.slug} size={18} /> : undefined}
            style={{ height: 40, padding: "0 14px", fontSize: 13 }}
          >
            {activeAgentData ? activeAgentData.name : "Agent"}
          </GlassChip>

          {agentMenuOpen && (
            <GlassPanel
              level={2}
              radius={12}
              padding={0}
              strong
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 6,
                overflow: "hidden",
                zIndex: 50,
                minWidth: 180,
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveAgent("all"); setAgentMenuOpen(false) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "9px 14px",
                  fontSize: 13,
                  color: activeAgent === "all" ? "var(--accent)" : "rgba(250,250,250,0.78)",
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: activeAgent === "all" ? 600 : 400,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                Tous les agents
              </button>
              {agents.map((a) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => { setActiveAgent(a.slug); setAgentMenuOpen(false) }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    color: activeAgent === a.slug ? "var(--accent)" : "rgba(250,250,250,0.78)",
                    background: "transparent",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: activeAgent === a.slug ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <AgentAvatar slug={a.slug} size={18} />
                  {a.name}
                </button>
              ))}
            </GlassPanel>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
          className="ly-input lg-focus"
          style={{
            height: 40,
            padding: "0 14px",
            fontSize: 13,
            color: "rgba(250,250,250,0.7)",
            borderRadius: 12,
            cursor: "pointer",
          }}
        >
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="lg-surface-2"
              style={{
                height: 280,
                borderRadius: 18,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <GlassPanel
          level={2}
          radius={20}
          padding="72px 24px"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <Library size={48} color="rgba(250,250,250,0.12)" aria-hidden />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(250,250,250,0.6)", margin: "0 0 6px" }}>
              {search || activeType !== "all" || activeAgent !== "all"
                ? "Aucun résultat pour ces filtres"
                : "Aucun contenu pour l'instant"}
            </p>
            <p style={{ fontSize: 13, color: "rgba(250,250,250,0.35)", margin: 0 }}>
              {search || activeType !== "all" || activeAgent !== "all"
                ? "Essayez d'élargir vos critères de recherche"
                : "Discutez avec un agent pour créer votre premier contenu"}
            </p>
          </div>
          {!search && activeType === "all" && activeAgent === "all" && (
            <Link
              href="/dashboard/agents"
              className="lg-focus"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent)",
                padding: "9px 20px",
                borderRadius: 999,
                border: "1px solid rgba(232,111,77,0.32)",
                background: "rgba(232,111,77,0.1)",
                textDecoration: "none",
                boxShadow: "0 6px 18px var(--accent-glow)",
              }}
            >
              Voir mes assistants →
            </Link>
          )}
        </GlassPanel>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onOpen={setSelectedId.bind(null, item.id)}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedId && (
        <ContentDetailModal
          contentId={selectedId}
          onClose={() => setSelectedId(null)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
