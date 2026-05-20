"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: "success" | "error" | "info" | "agent"
  title: string
  message?: string
  agentSlug?: string
  duration?: number
}

interface NotificationContextValue {
  toast: (title: string, options?: Partial<Omit<Notification, "id" | "title">>) => string
  dismiss: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider")
  return ctx
}

// ─── Toast item ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<Notification["type"], string> = {
  success: "#10B981",
  error: "#EF4444",
  info: "#7C3AED",
  agent: "#E86F4D",
}

function ToastItem({
  notif,
  onDismiss,
  removing,
}: {
  notif: Notification
  onDismiss: (id: string) => void
  removing: boolean
}) {
  const duration = notif.duration ?? 4000
  const color = TYPE_COLORS[notif.type]
  const [progress, setProgress] = useState(100)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (removing) return
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [duration, removing])

  return (
    <div
      style={{
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        background: "rgba(20,20,28,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        animation: removing
          ? "ly-toast-out 200ms ease forwards"
          : "ly-toast-in 300ms ease",
        maxWidth: 380,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        {notif.type === "agent" && notif.agentSlug ? (
          <AgentAvatar slug={notif.agentSlug} size={28} />
        ) : (
          <div
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `${color}22`,
              border: `1.5px solid ${color}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {notif.type === "success" && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {notif.type === "error" && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4L10 10M10 4L4 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {notif.type === "info" && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="1" fill={color} />
                <path d="M7 7V10.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notif.title}
        </p>
        {notif.message && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.45,
            }}
          >
            {notif.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(notif.id)}
        aria-label="Fermer la notification"
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 2,
          color: "rgba(255,255,255,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "color 150ms",
          marginTop: -1,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)")}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: "0 0 0 14px",
          transition: "width 50ms linear",
        }}
      />
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_TOASTS = 4

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    // Clear auto-dismiss timer
    const t = timersRef.current.get(id)
    if (t !== undefined) {
      clearTimeout(t)
      timersRef.current.delete(id)
    }
    // Animate out then remove
    setRemoving(prev => new Set(prev).add(id))
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
      setRemoving(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 200)
  }, [])

  const toast = useCallback(
    (title: string, options?: Partial<Omit<Notification, "id" | "title">>): string => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const duration = options?.duration ?? 4000
      const notif: Notification = { id, title, type: "info", duration, ...options }

      setNotifications(prev => {
        const next = [notif, ...prev].slice(0, MAX_TOASTS)
        return next
      })

      const t = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, t)
      return id
    },
    [dismiss]
  )

  // Cleanup on unmount — capture ref value at effect time to avoid stale ref warning
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div
        className="ly-toast-container"
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 8,
          maxWidth: 380,
          pointerEvents: notifications.length === 0 ? "none" : "auto",
        }}
      >
        {notifications.map(n => (
          <ToastItem
            key={n.id}
            notif={n}
            onDismiss={dismiss}
            removing={removing.has(n.id)}
          />
        ))}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes ly-toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes ly-toast-out {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(40px) scale(0.96); }
        }
      `}</style>
    </NotificationContext.Provider>
  )
}

// ─── AgentNotification helper ─────────────────────────────────────────────────

export function AgentNotification({
  agentSlug,
  action,
  result,
}: {
  agentSlug: string
  action: string
  result: string
}) {
  const { toast } = useNotifications()
  React.useEffect(() => {
    toast(action, {
      type: "agent",
      agentSlug,
      message: result,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
