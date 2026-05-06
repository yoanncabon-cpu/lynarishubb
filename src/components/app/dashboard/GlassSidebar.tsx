"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Sparkles, Plug, MessageSquare, BarChart3,
  Users, CreditCard, Settings, Sparkle,
} from "lucide-react"
import { AgentAvatarGlass } from "@/components/app/glass/AgentAvatarGlass"
import { StatusDot } from "@/components/app/glass/StatusDot"
import { usePlan } from "@/hooks/usePlan"
import { PLAN_LABELS, PLAN_COLORS } from "@/lib/plans"

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/skills", label: "Compétences", icon: Sparkles },
  { href: "/dashboard/integrations", label: "Intégrations", icon: Plug },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
] as const

const FOOTER_NAV = [
  { href: "/dashboard/team", label: "Équipe", icon: Users },
  { href: "/dashboard/billing", label: "Facturation", icon: CreditCard },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
] as const

const AGENT_GROUPS = [
  { label: "Orchestration", agents: [{ slug: "charles", name: "Charles", color: "#7C3AED", role: "Chef d'orchestre", status: "online" as const }] },
  { label: "Marketing", agents: [
    { slug: "lou", name: "Lou", color: "#F472B6", role: "Contenu & SEO", status: "busy" as const },
    { slug: "elio", name: "Elio", color: "#10B981", role: "Commercial", status: "online" as const },
    { slug: "max", name: "Max", color: "#EC4899", role: "Photo & Vidéo", status: "busy" as const },
  ]},
  { label: "Operations", agents: [
    { slug: "marine", name: "Marine", color: "#22D3EE", role: "Téléphonique", status: "online" as const },
    { slug: "mae", name: "Mae", color: "#F59E0B", role: "Mail", status: "online" as const },
    { slug: "nova", name: "Nova", color: "#6366F1", role: "Analytics", status: "idle" as const },
    { slug: "alba", name: "Alba", color: "#8B5CF6", role: "RH", status: "idle" as const },
    { slug: "aria", name: "Aria", color: "#F97316", role: "Assistante Universelle", status: "online" as const },
  ]},
] as const

const NAV_ITEM_STYLE_BASE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 9,
  height: 36, padding: "0 10px", borderRadius: 10,
  fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em",
  textDecoration: "none", transition: "all 150ms cubic-bezier(0.22,1,0.36,1)",
  border: "1px solid transparent",
}

function NavItem({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        ...NAV_ITEM_STYLE_BASE,
        ...(active ? {
          background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.1))",
          border: "1px solid rgba(167,139,250,0.3)",
          color: "#F5F5F7",
        } : {
          color: "#71717A",
        }),
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      aria-current={active ? "page" : undefined}
    >
      {React.createElement(Icon as React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>, { size: 15, strokeWidth: 1.5, style: { color: active ? "#A78BFA" : "#52525B", flexShrink: 0 }, "aria-hidden": true })}
      {label}
    </Link>
  )
}

interface GlassSidebarProps {
  collapsed?: boolean
}

export function GlassSidebar({ collapsed = false }: GlassSidebarProps) {
  const pathname = usePathname()
  const { plan } = usePlan()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside style={{
      width: collapsed ? 52 : 240,
      height: "100%",
      background: "rgba(6,6,11,0.85)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      transition: "width 300ms cubic-bezier(0.22,1,0.36,1)",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 9,
        height: 56, padding: "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        textDecoration: "none", flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #7C3AED, #22D3EE)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 14px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5), transparent 55%)" }} />
          <span style={{ position: "relative", color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: "-0.04em" }}>L</span>
        </div>
        {!collapsed && (
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.04em", color: "#F5F5F7", fontFamily: "var(--font-fraunces-var, Georgia, serif)", fontStyle: "italic" }}>
            Lynaris
          </span>
        )}
      </Link>

      {/* Scrollable nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px 0", scrollbarWidth: "none" }}>
        {/* Primary nav */}
        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href, "exact" in item ? item.exact : false)} />
        ))}

        {/* Agent groups */}
        {AGENT_GROUPS.map((group) => (
          <div key={group.label} style={{ marginTop: 18 }}>
            {!collapsed && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717A", margin: "0 0 4px", padding: "0 10px" }}>
                {group.label}
              </p>
            )}
            {group.agents.map((agent) => {
              const active = isActive(`/dashboard/agents/${agent.slug}`)
              const isCharles = agent.slug === "charles"
              return (
                <Link
                  key={agent.slug}
                  href={`/dashboard/agents/${agent.slug}`}
                  style={{
                    ...NAV_ITEM_STYLE_BASE,
                    height: 38,
                    marginBottom: 1,
                    padding: "0 8px",
                    gap: 8,
                    ...(isCharles ? {
                      background: active
                        ? "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(124,58,237,0.12))"
                        : "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(124,58,237,0.04))",
                      border: "1px solid rgba(124,58,237,0.30)",
                      boxShadow: "0 0 12px rgba(124,58,237,0.12), inset 0 1px 0 rgba(167,139,250,0.08)",
                    } : active ? {
                      background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.08))",
                      border: `1px solid ${agent.color}30`,
                    } : { color: "#A1A1AA" }),
                  }}
                  onMouseEnter={(e) => { if (!active && !isCharles) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
                  onMouseLeave={(e) => { if (!active && !isCharles) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <AgentAvatarGlass name={agent.name} color={agent.color} size={26} radius="8px" />
                  {!collapsed && (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: isCharles || active ? "#F5F5F7" : "#A1A1AA", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{agent.name}</p>
                          {isCharles && (
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              color: "#A78BFA",
                              background: "rgba(124,58,237,0.18)",
                              border: "1px solid rgba(124,58,237,0.35)",
                              borderRadius: 4,
                              padding: "1px 5px",
                              lineHeight: 1.5,
                            }}>PRO</span>
                          )}
                        </div>
                        <p style={{ fontSize: 10, color: "#52525B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.role}</p>
                      </div>
                      <StatusDot status={agent.status} size={5} />
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
        <div style={{ height: 12 }} />
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 8px 8px" }}>
        {FOOTER_NAV.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
        ))}
        {/* Plan badge */}
        {!collapsed && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 10px", borderRadius: 10, marginTop: 4,
            background: `${PLAN_COLORS[plan]}26`,
            border: `1px solid ${PLAN_COLORS[plan]}40`,
          }}>
            <Sparkle size={13} color={PLAN_COLORS[plan]} strokeWidth={1.5} aria-hidden />
            <span style={{ fontSize: 12, fontWeight: 600, color: PLAN_COLORS[plan], letterSpacing: "-0.01em" }}>{PLAN_LABELS[plan]}</span>
          </div>
        )}
      </div>
    </aside>
  )
}
