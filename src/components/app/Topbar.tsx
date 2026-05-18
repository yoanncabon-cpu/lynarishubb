"use client"

import { Bell, ChevronDown, Menu, Search, Settings, LogOut, CreditCard, X, Zap } from "lucide-react"
import { logger } from "@/lib/logger"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { GlassPanel } from "@/components/app/glass"
import { usePlan } from "@/hooks/usePlan"
import { PLAN_LABELS, PLAN_COLORS } from "@/lib/plans"

// ─── Route label map ──────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  agents: "Agents",
  skills: "Compétences",
  integrations: "Intégrations",
  conversations: "Conversations",
  analytics: "Statistiques",
  team: "Équipe",
  billing: "Facturation",
  settings: "Paramètres",
  documents: "Documents",
  contacts: "Contacts",
  contenus: "Contenus",
  workspace: "Espace",
  automatisations: "Automatisations",
  crm: "CRM",
  support: "Support",
  admin: "Admin",
  tickets: "Tickets",
  provision: "Provision",
  create: "Nouveau",
  charles: "Charles",
  marine: "Marine",
  lou: "Lou",
  elio: "Elio",
  mae: "Mae",
  max: "Max",
  nova: "Nova",
  alba: "Alba",
}

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ""
  for (const seg of segments) {
    path += `/${seg}`
    const label = SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: path })
  }
  return crumbs
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string
  text: string
  time: string
  read: boolean
  agentSlug: string
}

interface TopbarProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Topbar({ onMenuClick, onSearchClick }: TopbarProps) {
  const pathname = usePathname()
  const { plan } = usePlan()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [initials, setInitials] = useState("YC")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const hasUnread = notifications.some((n) => !n.read)

  useEffect(() => {
    void (async () => {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
        const supabase = getSupabaseBrowserClient()
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) return
        const meta = user.user_metadata as Record<string, string> | undefined
        const photo = meta?.avatar_url ?? meta?.picture ?? null
        setAvatarUrl(photo)
        const email = user.email ?? ""
        setUserEmail(email)
        const name = meta?.full_name ?? meta?.name ?? localStorage.getItem("user_name") ?? ""
        if (name) {
          const parts = name.trim().split(/\s+/)
          const first = parts[0]?.[0] ?? ""
          const last = parts[parts.length - 1]?.[0] ?? ""
          setInitials(parts.length >= 2 ? (first + last).toUpperCase() : name.slice(0, 2).toUpperCase())
          setUserName(parts[0] ?? name)
        } else if (email) {
          setUserName(email.split("@")[0] ?? "")
        }
      } catch { /* ignore */ }
    })()
  }, [])

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() as Promise<{ notifications: NotificationItem[] }> : null)
      .then((data) => {
        if (data?.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications)
        }
      })
      .catch(() => { /* réseau indispo — liste vide */ })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const crumbs = buildBreadcrumbs(pathname)

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function removeNotif(id: string) {
    const previous = notifications
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      logger.error("[notifications] dismiss failed, rollback", { err: String(err) })
      setNotifications(previous)
    }
  }

  async function removeAllNotifs() {
    const previous = notifications
    setNotifications([])
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      logger.error("[notifications] clear all failed, rollback", { err: String(err) })
      setNotifications(previous)
    }
  }

  async function handleSignOut() {
    setUserMenuOpen(false)
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
    } catch { /* ignore */ }
    window.location.href = "/login"
  }

  return (
    <GlassPanel
      as="header"
      level={1}
      strong
      radius={22}
      aria-label="Barre supérieure"
      style={{
        height: 60,
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
      contentStyle={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 18px",
        height: "100%",
      }}
    >
      {/* Mobile burger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden lg-focus"
        aria-label="Ouvrir le menu"
        style={{
          padding: 6,
          borderRadius: 8,
          background: "transparent",
          border: "none",
          color: "rgba(250,250,250,0.65)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <nav
        className="hidden sm:flex items-center"
        style={{ gap: 6, fontSize: 13, flexShrink: 0 }}
        aria-label="Fil d'Ariane"
      >
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && (
              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 13, lineHeight: 1, userSelect: "none" }}>
                /
              </span>
            )}
            {i === crumbs.length - 1 ? (
              <span style={{ color: "#FAFAFA", fontWeight: 600, letterSpacing: "-0.01em" }}>{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                style={{
                  color: "rgba(250,250,250,0.5)",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 220ms var(--ease-apple)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FAFAFA" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,250,250,0.5)" }}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Search ⌘K — chip verre niveau 3 */}
      <button
        type="button"
        onClick={onSearchClick}
        className="lg-surface-3 lg-focus"
        aria-label="Rechercher (Cmd+K)"
        style={{
          flex: 1,
          maxWidth: 320,
          height: 36,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
          borderRadius: 12,
          cursor: "text",
          marginLeft: "auto",
          transition: "border-color 220ms var(--ease-apple), background 220ms var(--ease-apple)",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--glass-border-strong)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--glass-border)"
        }}
      >
        <Search size={14} style={{ color: "rgba(250,250,250,0.45)", flexShrink: 0 }} aria-hidden />
        <span style={{ flex: 1, fontSize: 12.5, color: "rgba(250,250,250,0.45)", textAlign: "left" }}>
          Rechercher dans Lynaris
        </span>
        <kbd
          style={{
            fontSize: 10,
            color: "rgba(250,250,250,0.55)",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid var(--glass-border)",
            borderRadius: 5,
            padding: "2px 6px",
            fontFamily: "var(--font-mono)",
            flexShrink: 0,
            letterSpacing: "0.04em",
            fontWeight: 600,
          }}
        >
          ⌘K
        </kbd>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
        {/* Badge plan — masqué petit écran */}
        <Link
          href="/dashboard/billing"
          className="lg-chip lg-focus hidden md:inline-flex"
          aria-label={`Plan ${PLAN_LABELS[plan]}`}
          style={{
            textDecoration: "none",
            color: PLAN_COLORS[plan],
            borderColor: `${PLAN_COLORS[plan]}38`,
            background: `${PLAN_COLORS[plan]}14`,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          <Zap size={11} />
          {PLAN_LABELS[plan]}
        </Link>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v)
              setUserMenuOpen(false)
            }}
            className="lg-focus"
            aria-label={hasUnread ? "Nouvelles notifications" : "Notifications"}
            aria-expanded={notifOpen}
            style={{
              position: "relative",
              width: 36,
              height: 36,
              borderRadius: 11,
              border: "1px solid transparent",
              background: notifOpen ? "rgba(255,255,255,0.07)" : "transparent",
              color: hasUnread ? "#FAFAFA" : "rgba(250,250,250,0.65)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 220ms var(--ease-apple)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = notifOpen ? "rgba(255,255,255,0.07)" : "transparent"
            }}
          >
            <Bell size={17} />
            {hasUnread && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#EF4444",
                  border: "2px solid #16161C",
                }}
              />
            )}
          </button>

          {notifOpen && (
            <GlassPanel
              level={1}
              strong
              radius={16}
              aria-label="Notifications"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 340,
                zIndex: 50,
                overflow: "hidden",
              }}
              contentStyle={{ padding: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px 10px",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", letterSpacing: "-0.01em" }}>
                  Notifications
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {hasUnread && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 600 }}
                    >
                      Tout lire
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={removeAllNotifs}
                      style={{ fontSize: 11, color: "rgba(250,250,250,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                    >
                      Effacer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Fermer"
                    style={{ display: "flex", color: "rgba(250,250,250,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "rgba(250,250,250,0.45)" }}>
                  Aucune notification
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "11px 16px",
                        borderBottom: "1px solid var(--glass-border)",
                        background: notif.read ? "transparent" : "rgba(232,111,77,0.05)",
                      }}
                    >
                      {!notif.read && (
                        <span
                          style={{
                            marginTop: 6,
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, paddingLeft: notif.read ? 16 : 0 }}>
                        <p style={{ fontSize: 13, color: "#FAFAFA", margin: 0, lineHeight: 1.4 }}>{notif.text}</p>
                        <p style={{ fontSize: 11, color: "rgba(250,250,250,0.45)", margin: "3px 0 0" }}>{notif.time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNotif(notif.id)}
                        aria-label="Supprimer la notification"
                        style={{
                          flexShrink: 0,
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(250,250,250,0.4)",
                          padding: 0,
                          marginTop: 2,
                          borderRadius: 4,
                          transition: "color 220ms var(--ease-apple)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444" }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(250,250,250,0.4)" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div ref={userMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((v) => !v)
              setNotifOpen(false)
            }}
            className="lg-focus"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="Menu utilisateur"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px 4px 4px",
              borderRadius: 11,
              border: "1px solid transparent",
              background: userMenuOpen ? "rgba(255,255,255,0.07)" : "transparent",
              cursor: "pointer",
              transition: "background 220ms var(--ease-apple)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = userMenuOpen ? "rgba(255,255,255,0.07)" : "transparent"
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: avatarUrl ? "transparent" : "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                overflow: "hidden",
                letterSpacing: "0.02em",
                boxShadow: avatarUrl ? "0 0 0 1px var(--glass-border-strong)" : "0 4px 14px -3px var(--accent-glow)",
              }}
            >
              {avatarUrl
                ? <Image src={avatarUrl} alt="" width={30} height={30} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>
            <ChevronDown
              size={13}
              style={{
                color: "rgba(250,250,250,0.55)",
                transform: userMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 220ms var(--ease-apple)",
              }}
              aria-hidden
            />
          </button>

          {userMenuOpen && (
            <div
              aria-label="Menu utilisateur"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 230,
                zIndex: 50,
                overflow: "hidden",
                borderRadius: 14,
                background: "rgba(12, 10, 20, 0.96)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#F5EFE6", margin: 0, letterSpacing: "-0.01em" }}>
                  {userName || initials}
                </p>
                <p style={{ fontSize: 11, color: "rgba(245,239,230,0.5)", margin: "3px 0 0", wordBreak: "break-all" }}>
                  {userEmail || "—"}
                </p>
              </div>
              <div style={{ padding: "6px 0" }}>
                {[
                  { label: "Paramètres", href: "/dashboard/settings", Icon: Settings },
                  { label: "Facturation", href: "/dashboard/billing", Icon: CreditCard },
                ].map(({ label, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13,
                      color: "rgba(245,239,230,0.8)",
                      textDecoration: "none",
                      transition: "background 160ms ease, color 160ms ease",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)"
                      ;(e.currentTarget as HTMLAnchorElement).style.color = "#F5EFE6"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,239,230,0.8)"
                    }}
                  >
                    <Icon size={14} aria-hidden style={{ flexShrink: 0, opacity: 0.7 }} />
                    {label}
                  </Link>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "6px 0" }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 16px",
                    fontSize: 13,
                    color: "#F87171",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 160ms ease",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                  }}
                >
                  <LogOut size={14} aria-hidden style={{ flexShrink: 0 }} />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}
