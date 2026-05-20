"use client"

import { Bell, ChevronDown, Search, Settings, LogOut, CreditCard, X, Zap, Menu } from "lucide-react"
import { logger } from "@/lib/logger"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, LayoutGroup } from "framer-motion"
import { GlassPanel } from "@/components/app/glass"
import { LynarisLogo } from "@/components/shared/LynarisLogo"
import { usePlan } from "@/hooks/usePlan"
import { PLAN_LABELS, PLAN_COLORS } from "@/lib/plans"
import { NAV_HUBS, findActiveHub } from "./SpotlightNavConfig"

interface NotificationItem {
  id: string
  text: string
  time: string
  read: boolean
  agentSlug: string
}

interface Props {
  onMenuClick: () => void
  onSearchClick: () => void
  isAdmin: boolean
}

export function SpotlightTopBar({ onMenuClick, onSearchClick, isAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { plan, limits } = usePlan()

  // Prefetch agressif au hover : déclenche le téléchargement des assets
  // dès que la souris approche du hub, avant même le clic.
  const prefetchHub = useCallback(
    (href: string) => {
      try { router.prefetch(href) } catch { /* */ }
    },
    [router]
  )
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
  const isPro = plan === "pro" || plan === "custom"
  const activeHub = findActiveHub(pathname)
  const visibleHubs = NAV_HUBS.filter((h) => !h.adminOnly || isAdmin)

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

  // Notifications — sync live : fetch initial + polling 2 min + refetch sur reprise d'onglet
  // 30s était trop agressif (chaque appel = 1 query DB join). Le visibility refetch couvre
  // le cas "user revient sur l'onglet", on n'a pas besoin de poll plus serré.
  useEffect(() => {
    let cancelled = false
    function load() {
      fetch("/api/notifications")
        .then((r) => (r.ok ? (r.json() as Promise<{ notifications: NotificationItem[] }>) : null))
        .then((data) => {
          if (cancelled) return
          if (data?.notifications) {
            setNotifications(data.notifications)
          }
        })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 300_000) // 5 min — notifs ne sont pas temps-réel
    function onVisibility() {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Effacement réel : DELETE /api/notifications met notification_dismissed_at en DB.
  // Optimistic update pour ressenti instantané. Si l'API échoue, on rollback.
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
      aria-label="Barre supérieure Lynaris"
      style={{ height: "clamp(52px, 8vw, 60px)", flexShrink: 0, position: "relative", zIndex: 40 }}
      contentStyle={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(8px, 1.5vw, 12px)",
        padding: "0 clamp(12px, 3vw, 18px)",
        height: "100%",
      }}
    >
      {/* Logo — retour vers la home publique */}
      <Link
        href="/"
        aria-label="Lynaris — site public"
        className="lg-focus"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
          padding: "4px 4px 4px 0",
          borderRadius: 9,
        }}
      >
        <div
          className="lg-surface-3 lg-sheen"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LynarisLogo size={20} showWordmark={false} />
        </div>
        <span
          className="hidden md:inline"
          style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#FAFAFA" }}
        >
          Lynaris
        </span>
      </Link>

      {/* Hubs centraux — desktop only — magic underline via layoutId */}
      <LayoutGroup id="spotlight-hub">
        <nav
          className="hidden lg:flex"
          aria-label="Sections principales"
          style={{
            gap: 2,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          {visibleHubs.map((hub) => {
            const isActive = activeHub?.id === hub.id
            const Icon = hub.icon
            return (
              <Link
                key={hub.id}
                href={hub.href}
                aria-current={isActive ? "page" : undefined}
                className="lg-focus"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 11,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#FAFAFA" : "rgba(250,250,250,0.65)",
                  textDecoration: "none",
                  transition: "color 220ms var(--ease-apple)",
                  letterSpacing: "-0.005em",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  prefetchHub(hub.href)
                  if (!isActive) {
                    ;(e.currentTarget as HTMLElement).style.color = "#FAFAFA"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.65)"
                  }
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="hub-active-bg"
                    aria-hidden
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 11,
                      background: "rgba(232,111,77,0.16)",
                      border: "1px solid rgba(232,111,77,0.32)",
                      boxShadow: "0 0 24px -6px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.05)",
                      zIndex: 0,
                    }}
                  />
                )}
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2.4 : 2}
                  style={{ color: isActive ? "var(--accent)" : "currentColor", flexShrink: 0, position: "relative", zIndex: 1 }}
                  aria-hidden
                />
                <span style={{ position: "relative", zIndex: 1 }}>{hub.label}</span>
              </Link>
            )
          })}
        </nav>
      </LayoutGroup>

      {/* Mobile : nom du hub actif */}
      <div
        className="lg:hidden"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 600,
          color: "#FAFAFA",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {activeHub?.label ?? "Lynaris"}
      </div>

      {/* Search ⌘K */}
      <button
        type="button"
        onClick={onSearchClick}
        className="lg-surface-3 lg-focus hidden sm:flex"
        aria-label="Rechercher (Cmd+K)"
        style={{
          width: "clamp(160px, 22vw, 200px)",
          height: 36,
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
          borderRadius: 11,
          cursor: "text",
          flexShrink: 0,
        }}
      >
        <Search size={14} style={{ color: "rgba(250,250,250,0.45)", flexShrink: 0 }} aria-hidden />
        <span style={{ flex: 1, fontSize: 12, color: "rgba(250,250,250,0.45)", textAlign: "left" }}>
          Rechercher
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

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Search — icône seule sur mobile < 640px (la barre ⌘K est hidden sm:hidden) */}
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Rechercher"
          className="flex sm:hidden lg-focus"
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            border: "1px solid transparent",
            background: "transparent",
            color: "rgba(250,250,250,0.65)",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 220ms var(--ease-apple)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
        >
          <Search size={17} />
        </button>

        {/* Badge plan */}
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
              className="ly-notif-panel"
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
                    className="lg-focus"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(250,250,250,0.45)", background: "none", border: "none", cursor: "pointer", padding: 8, minWidth: 32, minHeight: 32, borderRadius: 8 }}
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
                        <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, paddingLeft: notif.read ? 16 : 0 }}>
                        <p style={{ fontSize: 13, color: "#FAFAFA", margin: 0, lineHeight: 1.4 }}>{notif.text}</p>
                        <p style={{ fontSize: 11, color: "rgba(250,250,250,0.45)", margin: "3px 0 0" }}>{notif.time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNotif(notif.id)}
                        aria-label="Supprimer"
                        className="lg-focus"
                        style={{
                          flexShrink: 0,
                          minWidth: 32,
                          minHeight: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(250,250,250,0.4)",
                          padding: 8,
                          borderRadius: 8,
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

        {/* User avatar */}
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
              className="hidden md:inline-block"
              style={{
                color: "rgba(250,250,250,0.55)",
                transform: userMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 220ms var(--ease-apple)",
              }}
              aria-hidden
            />
          </button>

          {userMenuOpen && (
            <GlassPanel
              level={1}
              strong
              radius={16}
              aria-label="Menu utilisateur"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "min(220px, calc(100vw - 32px))",
                zIndex: 50,
                overflow: "hidden",
              }}
              contentStyle={{ padding: 0 }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--glass-border)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", margin: 0, letterSpacing: "-0.01em" }}>
                  {userName || initials}
                </p>
                <p style={{ fontSize: 11, color: "rgba(250,250,250,0.5)", margin: "2px 0 0", wordBreak: "break-all" }}>
                  {userEmail || "—"}
                </p>
              </div>
              <div style={{ padding: "4px 0" }}>
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
                      padding: "9px 14px",
                      fontSize: 13,
                      color: "rgba(250,250,250,0.7)",
                      textDecoration: "none",
                      transition: "background 220ms var(--ease-apple), color 220ms var(--ease-apple)",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"
                      ;(e.currentTarget as HTMLAnchorElement).style.color = "#FAFAFA"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,250,250,0.7)"
                    }}
                  >
                    <Icon size={14} aria-hidden style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--glass-border)", padding: "4px 0" }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 14px",
                    fontSize: 13,
                    color: "#EF4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 220ms var(--ease-apple)",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.10)"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                  }}
                >
                  <LogOut size={14} aria-hidden style={{ flexShrink: 0 }} />
                  Se déconnecter
                </button>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>

      {/* Bouton hamburger — mobile only, caché sur desktop (lg+) */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="flex items-center justify-center lg:hidden lg-focus"
        style={{
          width: 36, height: 36, borderRadius: 11,
          border: "1px solid transparent",
          background: "transparent",
          color: "rgba(250,250,250,0.75)",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 220ms var(--ease-apple)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
      >
        <Menu size={18} />
      </button>

      {/* Eviter unused warning sur limits */}
      <span hidden>{isPro ? "" : ""}{limits.agents.length}</span>
    </GlassPanel>
  )
}
