"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Users, Zap, Puzzle, FileText, Users2, CreditCard, Settings, X, MessageSquare } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"
import { usePlan } from "@/hooks/usePlan"
import { PLAN_LABELS, PLAN_COLORS } from "@/lib/plans"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/agents", label: "Assistants", icon: Users },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/skills", label: "Super-pouvoirs", icon: Zap },
  { href: "/dashboard/integrations", label: "Intégrations", icon: Puzzle },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
] as const

const BOTTOM_ITEMS = [
  { href: "/dashboard/team", label: "Équipe", icon: Users2 },
  { href: "/dashboard/billing", label: "Facturation", icon: CreditCard },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
] as const

const MOBILE_BOTTOM_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/agents", label: "Agents", icon: Users },
  { href: "/dashboard/conversations", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/integrations", label: "Intégrations", icon: Puzzle },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
] as const

export interface LimovaNavProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const SIDEBAR_BASE_STYLE: React.CSSProperties = {
  height: "100%",
  background: "rgba(10,10,11,0.92)",
  backdropFilter: "blur(40px) saturate(1.6)",
  WebkitBackdropFilter: "blur(40px) saturate(1.6)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
}

function LogoHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #E86F4D 0%, #F4956E 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(232,111,77,0.35)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", letterSpacing: "-0.03em" }}>Lynaris</span>
      </Link>
      {onClose && (
        <button type="button" onClick={onClose} style={{
          width: 26, height: 26, borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(245,245,247,0.5)",
        }} aria-label="Fermer le menu">
          <X size={13} />
        </button>
      )}
    </div>
  )
}

function UserProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const sb = getSupabaseBrowserClient()
    sb.auth.getUser().then(({ data }: { data: { user: { id: string; email?: string; user_metadata: Record<string, unknown> } | null } }) => {
      const u = data.user
      if (!u) return
      const meta = u.user_metadata as { avatar_url?: string; full_name?: string; name?: string } | undefined
      setAvatarUrl(meta?.avatar_url ?? null)
      const name = meta?.full_name ?? meta?.name ?? u.email?.split("@")[0] ?? null
      setDisplayName(name ? name.split(" ")[0] ?? name : null)
      setEmail(u.email ?? null)
    })
  }, [])

  const initials = displayName ? displayName[0]?.toUpperCase() ?? "?" : email?.[0]?.toUpperCase() ?? "?"

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "9px 10px", marginTop: 4,
      borderRadius: 9,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", background: "linear-gradient(135deg, #7C3AED, #E86F4D)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName ?? "avatar"} width={28} height={28} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{initials}</span>
        )}
      </div>
      {/* Nom */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#F5F5F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName ?? email ?? "…"}
        </p>
        {displayName && email && (
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(245,245,247,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </p>
        )}
      </div>
    </div>
  )
}

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { plan } = usePlan()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px", overflowY: "auto", scrollbarWidth: "none" }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : false)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onLinkClick} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              fontSize: 13.5, fontWeight: active ? 600 : 400,
              color: active ? "#F5F5F7" : "rgba(245,245,247,0.52)",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
              borderLeft: active ? "2px solid #E86F4D" : "2px solid transparent",
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            aria-current={active ? "page" : undefined}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.7} color={active ? "#E86F4D" : "rgba(245,245,247,0.4)"} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onLinkClick} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              fontSize: 13.5,
              color: active ? "#F5F5F7" : "rgba(245,245,247,0.5)",
              background: active ? "rgba(255,255,255,0.07)" : "transparent",
              textDecoration: "none", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <Icon size={15} strokeWidth={1.7} color="rgba(245,245,247,0.4)" aria-hidden />
              {item.label}
            </Link>
          )
        })}
        {/* Plan badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 10px", marginTop: 4, borderRadius: 8,
          background: `${PLAN_COLORS[plan]}1a`, border: `1px solid ${PLAN_COLORS[plan]}33`,
        }}>
          <Zap size={12} color={PLAN_COLORS[plan]} aria-hidden />
          <span style={{ fontSize: 12, fontWeight: 600, color: PLAN_COLORS[plan] }}>{PLAN_LABELS[plan]}</span>
        </div>
        {/* Profil utilisateur */}
        <UserProfile />
      </div>
    </>
  )
}

export function LimovaNav({ mobileOpen, onMobileClose }: LimovaNavProps) {
  const pathname = usePathname()
  const [touchStart, setTouchStart] = useState<number | null>(null)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0]?.clientX ?? null)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0]?.clientX ?? 0
    if (touchEnd - touchStart > 80) {
      onMobileClose?.()
    }
    setTouchStart(null)
  }

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside
        className="hidden md:flex flex-col"
        style={{ ...SIDEBAR_BASE_STYLE, width: 220, flexShrink: 0 }}
      >
        <LogoHeader />
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ display: "flex" }}>
          {/* Backdrop */}
          <div
            aria-hidden
            onClick={onMobileClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          {/* Drawer panel */}
          <aside
            style={{
              ...SIDEBAR_BASE_STYLE,
              position: "relative", zIndex: 10,
              width: 260, flexShrink: 0,
              animation: "slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <LogoHeader onClose={onMobileClose} />
            <NavContent onLinkClick={onMobileClose} />
          </aside>
        </div>
      )}

      {/* Mobile bottom navigation bar — visible only on mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(10,10,11,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex" }}>
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const active = isActive(item.href, "exact" in item ? item.exact : false)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1, padding: "10px 0",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  textDecoration: "none",
                }}
              >
                <Icon size={20} color={active ? "#E86F4D" : "#71717A"} strokeWidth={active ? 2 : 1.7} aria-hidden />
                <span style={{ fontSize: 10, color: active ? "#E86F4D" : "#71717A", fontWeight: active ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
