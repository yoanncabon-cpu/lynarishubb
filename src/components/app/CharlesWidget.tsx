"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, Paperclip, FileText, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string
  file: File
  name: string
  type: "image" | "video" | "document"
  previewUrl?: string
  size: string
}

interface MockMessage {
  id?: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? "")
    }
    reader.readAsDataURL(file)
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getAttachmentType(file: File): "image" | "video" | "document" {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  return "document"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const suggestions = [
  "Veux-tu que Lou prépare le post du jour ?",
  "Mae a trié 12 emails ce matin — 2 urgents.",
  "Marine a géré 3 appels cette nuit.",
  "Elio a 5 nouveaux prospects à qualifier.",
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function CharlesWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<MockMessage[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis Charles. Comment puis-je t’aider aujourd’hui ?",
    },
  ])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestion] = useState(
    () => suggestions[Math.floor(Math.random() * suggestions.length)] ?? suggestions[0]
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    )
    return () => clearTimeout(t)
  }, [messages, open])

  // ─── File handlers ──────────────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const MAX = 5
    const remaining = MAX - attachments.length
    const toAdd = files.slice(0, remaining)

    const newAttachments: Attachment[] = toAdd.map((file) => {
      const att: Attachment = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: getAttachmentType(file),
        size: formatSize(file.size),
      }
      if (att.type === "image") {
        att.previewUrl = URL.createObjectURL(file)
      }
      return att
    })
    setAttachments((prev) => [...prev, ...newAttachments])
    if (e.target) e.target.value = ""
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  // ─── Send ───────────────────────────────────────────────────────────────────

  async function handleSend() {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return
    const content = input.trim()
    setInput("")

    const userMsg: MockMessage = {
      role: "user",
      content: content || "📎 " + attachments.map((a) => a.name).join(", "),
    }
    setMessages((prev) => [...prev, userMsg])

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: assistantId, isStreaming: true },
    ])
    setIsStreaming(true)

    // Build multimodal content if images attached
    type ImageContent = {
      type: "image"
      source: { type: "base64"; media_type: string; data: string }
    }
    type TextContent = { type: "text"; text: string }
    type MessageContent = string | Array<ImageContent | TextContent>

    const imageContents: ImageContent[] = []
    for (const att of attachments) {
      if (att.type === "image") {
        const base64 = await fileToBase64(att.file)
        imageContents.push({
          type: "image",
          source: { type: "base64", media_type: att.file.type, data: base64 },
        })
      }
    }

    const messageContent: MessageContent =
      imageContents.length > 0
        ? [...imageContents, { type: "text" as const, text: content || "Analyse cette image" }]
        : content

    setAttachments([])

    try {
      const history = messages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/agents/charles/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: messageContent }],
        }),
      })

      if (!res.ok || !res.body) throw new Error("API error")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") {
            setMessages((prev) =>
              prev.map((m) =>
                "id" in m && m.id === assistantId
                  ? { ...m, isStreaming: false }
                  : m
              )
            )
            setIsStreaming(false)
            return
          }
          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string }
            if (parsed.content) {
              accumulated += parsed.content
              setMessages((prev) =>
                prev.map((m) =>
                  "id" in m && m.id === assistantId
                    ? { ...m, content: accumulated }
                    : m
                )
              )
            }
          } catch {
            // incomplete JSON — skip
          }
        }
      }

      // Stream ended without [DONE]
      setMessages((prev) =>
        prev.map((m) =>
          "id" in m && m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          "id" in m && m.id === assistantId
            ? { ...m, content: "Une erreur est survenue. Réessaie.", isStreaming: false }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-80 rounded-2xl border border-[--ly-border] bg-[--ly-surface] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[--ly-border] bg-[--ly-elevated]">
              <AgentAvatar slug="charles" size={28} />
              <div>
                <p className="text-sm font-semibold text-[--ly-text]">Charles</p>
                <p className="text-xs text-[--ly-success] flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[--ly-success] animate-pulse"
                    aria-hidden="true"
                  />
                  En ligne
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto p-1 rounded-md text-[--ly-text-muted] hover:text-[--ly-text] hover:bg-[--ly-surface] transition-colors"
                aria-label="Fermer Charles"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-[--ly-primary] text-white rounded-tr-sm"
                        : "bg-[--ly-elevated] text-[--ly-text] rounded-tl-sm border border-[--ly-border]"
                    )}
                  >
                    {msg.content}
                    {msg.isStreaming && msg.content.length > 0 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 2,
                          height: 10,
                          background: "currentColor",
                          opacity: 0.7,
                          marginLeft: 2,
                          verticalAlign: "middle",
                          animation: "blink 1s step-end infinite",
                        }}
                      />
                    )}
                    {msg.isStreaming && msg.content.length === 0 && (
                      <span className="inline-flex gap-0.5 items-center">
                        <span style={{ animation: "blink 1s step-end infinite", animationDelay: "0ms" }} className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
                        <span style={{ animation: "blink 1s step-end infinite", animationDelay: "200ms" }} className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
                        <span style={{ animation: "blink 1s step-end infinite", animationDelay: "400ms" }} className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Suggestion */}
            <button
              type="button"
              onClick={() => setInput(suggestion)}
              className="w-full px-3 py-2 text-left text-xs text-[--ly-text-muted] hover:text-[--ly-text] bg-[--ly-elevated]/50 border-t border-[--ly-border] transition-colors"
            >
              <Sparkles
                className="inline h-3 w-3 mr-1 text-[--ly-primary-soft]"
                aria-hidden="true"
              />
              {suggestion}
            </button>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-2 border-t border-[--ly-border]">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative flex items-center gap-1.5 bg-[--ly-elevated] border border-[--ly-border] rounded-lg px-2 py-1 text-xs text-[--ly-text-muted] max-w-[140px]"
                  >
                    {att.type === "image" && att.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="h-6 w-6 rounded object-cover flex-shrink-0"
                      />
                    ) : att.type === "video" ? (
                      <Film className="h-3.5 w-3.5 flex-shrink-0 text-[--ly-primary-soft]" aria-hidden />
                    ) : (
                      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-[--ly-primary-soft]" aria-hidden />
                    )}
                    <span className="truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Supprimer ${att.name}`}
                      className="ml-auto flex-shrink-0 text-[--ly-text-dim] hover:text-[--ly-text] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-[--ly-border]">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                aria-hidden="true"
              />

              {/* Paperclip button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[--ly-text-muted] hover:text-[--ly-text] hover:bg-[--ly-elevated] transition-colors disabled:opacity-40"
                aria-label="Joindre un fichier"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                disabled={isStreaming}
                placeholder="Dis quelque chose à Charles..."
                className="flex-1 text-xs bg-[--ly-elevated] border border-[--ly-border] rounded-lg px-3 py-2 text-[--ly-text] placeholder:text-[--ly-text-dim] focus:outline-none focus:ring-1 focus:ring-[--ly-primary] disabled:opacity-50"
                aria-label="Message à Charles"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                className="h-8 w-8 rounded-lg bg-[--ly-primary] flex items-center justify-center text-white hover:bg-[--ly-primary-soft] transition-colors disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-shadow"
        aria-label={open ? "Fermer Charles" : "Ouvrir Charles"}
        aria-expanded={open}
      >
        <div style={{ position: "relative" }}>
          <AgentAvatar slug="charles" size={48} glow />
          {/* Badge pulsant */}
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#52B788",
              border: "2px solid #0C0C0E",
              boxShadow: "0 0 8px rgba(82,183,136,0.6)",
            }}
          />
        </div>
      </motion.button>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
