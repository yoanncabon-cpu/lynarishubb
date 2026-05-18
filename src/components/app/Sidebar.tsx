"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Plug,
  MessageSquare,
  CreditCard,
  Settings,
  X,
  Bot,
  Library,
  Clock,
  LifeBuoy,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  ContactRound,
  LayoutGrid,
  Users,
  FileText,
  Sparkles,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { LynarisLogo } from "@/components/shared/LynarisLogo"
import { GlassPanel, NavGroup } from "@/components/app/glass"
import { usePlan } from "@/hooks/usePlan"
import { PLAN_LABELS, PLAN_COLORS } from "@/lib/plans"

// ─── Nav structure groupée ────────────────────────────────────────

interface NavItemDef {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  proOnly?: boolean
  tour?: string
}

const NAV_GROUPS: { label: string; items: NavItemDef[] }[] = [
  {
    label: "Pinned",
    items: [
      { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true, tour: "sidebar-home" },
      { href: "/dashboard/agents", label: "Mes agents", icon: Bot, tour: "sidebar-assistants" },
    ],
  },
  {
    label: "Travail",
    items: [
      { href: "/dashboard/contenus", label: "Contenus", icon: Library, proOnly: true, tour: "sidebar-contents" },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/workspace", label: "Espace de travail", icon: LayoutGrid },
      { href: "/dashboard/automatisations", label: "Automatisations", icon: Clock },
    ],
  },
  {
    label: "Croissance",
    items: [
      { href: "/dashboard/crm", label: "CRM", icon: ContactRound, proOnly: true },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users },
      { href: "/dashboard/analytics", label: "Statistiques", icon: BarChart3, proOnly: true },
    ],
  },
  {
    label: "Plateforme",
    items: [
      { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
      { href: "/dashboard/skills", label: "Compétences", icon: Sparkles },
      { href: "/dashboard/integrations", label: "Intégrations", icon: Plug, tour: "sidebar-integrations" },
      { href: "/dashboard/team", label: "Équipe", icon: Briefcase },
    ],
  },
]

const ACCOUNT_ITEMS: NavItemDef[] = [
  { href: "/dashboard/billing", label: "Facturation", icon: CreditCard },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
]

const ADMIN_ITEMS: NavItemDef[] = [
  { href: "/dashboard/admin/tickets", label: "Tickets", icon: ShieldCheck },
  { href: "/dashboard/admin/provision", label: "Provision", icon: ShieldCheck },
]

// ─── Item ─────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
  tour,
  locked,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  onClick?: () => void
  tour?: string
  locked?: boolean
}) {
  const [hover, setHover] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      // Désactive le prefetch RSC : les pages dashboard/* font des queries DB lourdes,
      // les prefetch en arrière-plan ajoutent 80+ requêtes sur le rendu initial.
      // Coût : +150-300ms quand l'user clique. Bénéfice : Network panel propre + DB économisée.
      prefetch={false}
      data-tour={tour}
      title={collapsed ? label : locked ? "Disponible en Plan Pro" : undefined}
      aria-current={active ? "page" : undefined}
      className="lg-focus"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 38,
        padding: collapsed ? "0" : "0 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        margin: collapsed ? "0 6px" : "0 8px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        opacity: locked ? 0.55 : 1,
        background: active
          ? "rgba(232,111,77,0.16)"
          : hover
            ? "rgba(255,255,255,0.06)"
            : "transparent",
        color: active
          ? "#FAFAFA"
          : hover
            ? "rgba(250,250,250,0.92)"
            : "rgba(250,250,250,0.65)",
        border: active ? "1px solid rgba(232,111,77,0.32)" : "1px solid transparent",
        transition: "background 220ms var(--ease-apple), color 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {active && !collapsed && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -2,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 999,
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent-glow)",
          }}
        />
      )}
      <Icon
        size={16}
        strokeWidth={2}
        style={{ color: active ? "var(--accent)" : "currentColor", flexShrink: 0 }}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          {locked && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--accent)",
                background: "rgba(232,111,77,0.14)",
                border: "1px solid rgba(232,111,77,0.28)",
                borderRadius: 5,
                padding: "1px 6px",
                flexShrink: 0,
              }}
            >
              PRO
            </span>
          )}
        </>
      )}
    </Link>
  )
}

// ─── Props ────────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

// ─── Main ─────────────────────────────────────────────────────────

const COLLAPSE_KEY = "lg-sidebar-collapsed"

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { plan, limits, loading: planLoading } = usePlan()
  const isPro = plan === "pro" || plan === "custom"
  const hasCharles = limits.agents.includes("charles")

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(COLLAPSE_KEY)
    if (saved === "1") setCollapsed(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
  }, [collapsed, mounted])

  useEffect(() => {
    fetch("/api/admin/tickets?limit=1")
      .then((r) => setIsAdmin(r.ok))
      .catch(() => {})
  }, [])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  const width = collapsed ? 76 : 264

  const inner = (closeOnNav?: () => void) => (
    <>
      {/* ── Logo + collapse btn ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "12px 8px" : "14px 14px 12px",
          justifyContent: collapsed ? "center" : "space-between",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          aria-label="Lynaris — accueil"
          onClick={closeOnNav}
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
        >
          <div
            className="lg-surface-3 lg-sheen"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LynarisLogo size={22} showWordmark={false} />
          </div>
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "#FAFAFA" }}>
              Lynaris
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Réduire la sidebar"
            className="lg-focus"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "rgba(250,250,250,0.45)",
              cursor: "pointer",
            }}
            title="Réduire"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden"
            style={{
              padding: 4,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "rgba(250,250,250,0.55)",
              cursor: "pointer",
            }}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Charles card — Pro/Scale uniquement ── */}
      {hasCharles && !collapsed && (
        <div style={{ padding: "6px 14px 10px" }}>
          <Link
            href="/dashboard/agents/charles"
            onClick={closeOnNav}
            className="lg-focus"
            style={{
              display: "block",
              textDecoration: "none",
              borderRadius: 14,
              padding: 12,
              background: isActive("/dashboard/agents/charles")
                ? "linear-gradient(135deg, rgba(124,58,237,0.28) 0%, rgba(167,139,250,0.10) 100%)"
                : "linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(167,139,250,0.06) 100%)",
              border: `1px solid ${isActive("/dashboard/agents/charles") ? "rgba(167,139,250,0.45)" : "rgba(124,58,237,0.24)"}`,
              transition: "border-color 220ms var(--ease-apple)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <AgentAvatar slug="charles" size={32} />
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#34D399",
                    border: "1.5px solid #16161C",
                  }}
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", lineHeight: 1.2 }}>Charles</div>
                <div style={{ fontSize: 11, color: "rgba(196,181,253,0.78)", marginTop: 2 }}>Demande-moi</div>
              </div>
              <ArrowUpRight size={14} style={{ color: "rgba(196,181,253,0.6)", flexShrink: 0 }} />
            </div>
          </Link>
        </div>
      )}

      {/* ── Nav scrollable ── */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 0 8px",
          scrollbarWidth: "thin",
        }}
        aria-label="Navigation principale"
      >
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} label={group.label} collapsed={collapsed}>
            {group.items.map((item) => {
              const locked = item.proOnly && !isPro
              return (
                <NavItem
                  key={item.href}
                  href={locked ? "/dashboard/billing" : item.href}
                  label={item.label}
                  icon={item.icon}
                  active={!locked && isActive(item.href, item.exact)}
                  collapsed={collapsed}
                  onClick={closeOnNav}
                  tour={item.tour}
                  locked={locked}
                />
              )
            })}
          </NavGroup>
        ))}

        {isAdmin && (
          <NavGroup label="Administration" collapsed={collapsed}>
            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                collapsed={collapsed}
                onClick={closeOnNav}
              />
            ))}
          </NavGroup>
        )}

        <NavGroup label="Compte" collapsed={collapsed}>
          {ACCOUNT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={collapsed}
              onClick={closeOnNav}
            />
          ))}
        </NavGroup>
      </nav>

      {/* ── Footer : plan card + tour ── */}
      <div style={{ padding: collapsed ? "8px 6px" : "10px 12px", flexShrink: 0 }}>
        {planLoading ? (
          <div
            style={{
              height: collapsed ? 36 : 64,
              borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              animation: "skeleton-pulse 1.5s ease-in-out infinite",
            }}
          />
        ) : collapsed ? (
          <div
            title={`Plan ${PLAN_LABELS[plan]}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 36,
              borderRadius: 10,
              background: `${PLAN_COLORS[plan]}22`,
              border: `1px solid ${PLAN_COLORS[plan]}40`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: PLAN_COLORS[plan], letterSpacing: "0.04em" }}>
              {PLAN_LABELS[plan].slice(0, 2).toUpperCase()}
            </span>
          </div>
        ) : (
          <div
            className="lg-surface-3 lg-sheen"
            style={{
              borderRadius: 14,
              padding: 12,
              borderColor: `${PLAN_COLORS[plan]}3D`,
              background: `linear-gradient(135deg, ${PLAN_COLORS[plan]}1A 0%, rgba(36,36,46,0.32) 100%)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: plan === "trial" || plan === "decouverte" ? 10 : 0 }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: PLAN_COLORS[plan],
                  boxShadow: `0 0 8px ${PLAN_COLORS[plan]}80`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "rgba(250,250,250,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                  Plan
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{PLAN_LABELS[plan]}</div>
              </div>
            </div>
            {(plan === "trial" || plan === "decouverte") && (
              <Link
                href="/dashboard/billing"
                onClick={closeOnNav}
                className="lg-focus"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 32,
                  borderRadius: 9,
                  background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 6px 20px -4px var(--accent-glow)",
                  transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                }}
              >
                Passer Pro
                <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        )}

        {!collapsed && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              type="button"
              title="Refaire le tour guidé"
              data-tour="help-menu"
              onClick={async () => {
                await fetch("/api/onboarding/reset", { method: "POST" })
                window.location.assign("/dashboard")
              }}
              className="lg-focus"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                flex: 1,
                height: 32,
                borderRadius: 9,
                border: "1px solid var(--glass-border)",
                background: "transparent",
                color: "rgba(250,250,250,0.55)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 220ms var(--ease-apple), color 220ms var(--ease-apple)",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#FAFAFA"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                ;(e.currentTarget as HTMLButtonElement).style.color = "rgba(250,250,250,0.55)"
              }}
            >
              <HelpCircle size={13} />
              Tour guidé
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Réduire la sidebar"
              className="lg-focus"
              title="Réduire"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "1px solid var(--glass-border)",
                background: "transparent",
                color: "rgba(250,250,250,0.55)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ChevronsLeft size={14} />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Étendre la sidebar"
            className="lg-focus"
            title="Étendre"
            style={{
              width: "100%",
              height: 32,
              marginTop: 8,
              borderRadius: 9,
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "rgba(250,250,250,0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronsRight size={14} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop — sidebar verre flottante */}
      <GlassPanel
        as="aside"
        level={1}
        strong
        radius={22}
        aria-label="Navigation latérale"
        className="hidden md:flex"
        style={{
          width,
          height: "calc(100dvh - 32px)",
          flexShrink: 0,
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 320ms var(--ease-apple)",
        }}
        contentStyle={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}
      >
        {inner()}
      </GlassPanel>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            display: "flex",
          }}
        >
          <div
            aria-hidden
            onClick={onMobileClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(7,7,10,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          <GlassPanel
            as="aside"
            level={1}
            strong
            radius={22}
            aria-label="Navigation latérale"
            style={{
              position: "relative",
              margin: 16,
              width: 280,
              maxWidth: "85vw",
              height: "calc(100dvh - 32px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            contentStyle={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}
          >
            {inner(onMobileClose)}
          </GlassPanel>
        </div>
      )}
    </>
  )
}
