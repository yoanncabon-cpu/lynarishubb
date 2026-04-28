"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react"
import { Send, Loader2, MessageSquare } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string
  ticketId: string
  senderType: "client" | "admin"
  senderEmail: string | null
  content: string
  createdAt: string
}

export interface TicketChatProps {
  ticketId: string
  currentUserEmail?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: TicketMessage }) {
  const isClient = msg.senderType === "client"

  const bubbleStyle: CSSProperties = isClient
    ? {
        alignSelf: "flex-end",
        background: "rgba(232,111,77,0.12)",
        border: "1px solid rgba(232,111,77,0.2)",
        borderRadius: "16px 16px 4px 16px",
        padding: "10px 14px",
        maxWidth: "80%",
        color: "#FAFAFA",
        fontSize: 13.5,
      }
    : {
        alignSelf: "flex-start",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px 16px 16px 4px",
        padding: "10px 14px",
        maxWidth: "80%",
        color: "#FAFAFA",
        fontSize: 13.5,
      }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isClient ? "flex-end" : "flex-start" }}>
      <div style={bubbleStyle}>
        <p style={{ margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.content}
        </p>
      </div>
      <span
        style={{
          fontSize: 11,
          color: "rgba(250,250,250,0.35)",
          marginTop: 4,
          paddingLeft: isClient ? 0 : 4,
          paddingRight: isClient ? 4 : 0,
        }}
      >
        {isClient ? "Vous" : "Support Lynaris"} · {formatTime(msg.createdAt)}
      </span>
    </div>
  )
}

// ─── Skeleton messages ────────────────────────────────────────────────────────

function MessageSkeleton() {
  const bar = (w: number | string, align: "left" | "right" = "left"): CSSProperties => ({
    background: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    height: 44,
    width: w,
    animation: "pulse 1.5s ease-in-out infinite",
    alignSelf: align === "right" ? "flex-end" : "flex-start",
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
      <div style={bar("60%", "left")} />
      <div style={bar("45%", "right")} />
      <div style={bar("55%", "left")} />
    </div>
  )
}

// ─── TicketChat ───────────────────────────────────────────────────────────────

export function TicketChat({ ticketId }: TicketChatProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [dbNotReady, setDbNotReady] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/ticket/${ticketId}/messages`)
      if (!res.ok) {
        if (res.status === 503) {
          setDbNotReady(true)
        }
        return
      }
      const data = (await res.json()) as {
        messages?: TicketMessage[]
        dbNotReady?: boolean
      }
      if (data.dbNotReady) {
        setDbNotReady(true)
        return
      }
      setMessages(data.messages ?? [])
      setDbNotReady(false)
    } catch {
      // Erreur réseau silencieuse — on réessaie au prochain poll
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  // Fetch initial + polling toutes les 5 secondes
  useEffect(() => {
    void fetchMessages()
    intervalRef.current = setInterval(() => {
      void fetchMessages()
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchMessages])

  // Auto-scroll vers le bas quand les messages changent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    // Optimistic update
    const optimistic: TicketMessage = {
      id: `optimistic-${Date.now()}`,
      ticketId,
      senderType: "client",
      senderEmail: null,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput("")
    setSending(true)

    try {
      const res = await fetch(`/api/support/ticket/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      })

      if (res.ok) {
        const data = (await res.json()) as { message?: TicketMessage }
        if (data.message) {
          // Remplace l'optimistic par le message réel
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id ? (data.message as TicketMessage) : m
            )
          )
        }
      } else {
        // Rollback optimistic si erreur
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      }
    } catch {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  if (dbNotReady) {
    return (
      <div
        style={{
          padding: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <MessageSquare size={16} style={{ color: "rgba(250,250,250,0.3)", flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "rgba(250,250,250,0.45)", margin: 0, lineHeight: 1.5 }}>
          Chat disponible après configuration DB — lance la migration <code style={{ fontSize: 12 }}>0005_ticket-messages.sql</code>.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 360,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MessageSquare size={14} style={{ color: "rgba(250,250,250,0.4)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "rgba(250,250,250,0.35)",
            textTransform: "uppercase",
          }}
        >
          Conversation
        </span>
      </div>

      {/* Zone messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {loading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "rgba(250,250,250,0.3)",
              textAlign: "center",
              margin: "auto",
              lineHeight: 1.6,
            }}
          >
            Aucun message pour l&apos;instant.
            <br />
            Envoie un message pour commencer.
          </p>
        ) : (
          messages.map((msg) => <Bubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={2}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          aria-label="Message"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#FAFAFA",
            fontSize: 13.5,
            lineHeight: 1.5,
            padding: "8px 12px",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            opacity: sending ? 0.5 : 1,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !input.trim()}
          aria-label="Envoyer"
          style={{
            background:
              sending || !input.trim()
                ? "rgba(232,111,77,0.25)"
                : "linear-gradient(135deg, #E86F4D, #C8522F)",
            border: "none",
            borderRadius: 8,
            width: 40,
            height: 40,
            flexShrink: 0,
            cursor: sending || !input.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 150ms ease",
          }}
        >
          {sending ? (
            <Loader2 size={16} style={{ color: "#FAFAFA", animation: "spin 1s linear infinite" }} />
          ) : (
            <Send size={15} style={{ color: "#FAFAFA" }} />
          )}
        </button>
      </div>
    </div>
  )
}
