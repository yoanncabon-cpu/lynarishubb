"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, type LucideIcon } from "lucide-react"
import { GlassPanel, NavGroup } from "@/components/app/glass"
import { LynarisLogo } from "@/components/shared/LynarisLogo"
import { NAV_HUBS } from "./SpotlightNavConfig"
import { usePlan } from "@/hooks/usePlan"

interface Props {
  open: boolean
  onClose: () => void
  isAdmin: boolean
}

export function SpotlightMobileDrawer({ open, onClose, isAdmin }: Props) {
  const pathname = usePathname()
  const { plan } = usePlan()
  const isPro = plan === "pro" || plan === "custom"

  if (!open) return null

  const hubs = NAV_HUBS.filter((h) => !h.adminOnly || isAdmin)

  return (
    <div
      className="lg:hidden"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
      }}
    >
      <div
        aria-hidden
        onClick={onClose}
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
        aria-label="Navigation"
        style={{
          position: "relative",
          margin: 16,
          width: "clamp(260px, 75vw, 300px)",
          height: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        contentStyle={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: "1px solid var(--glass-border)",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            onClick={onClose}
            aria-label="Lynaris — site public"
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <div
              className="lg-surface-3 lg-sheen"
              style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <LynarisLogo size={20} showWordmark={false} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "#FAFAFA" }}>
              Lynaris
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="lg-focus"
            style={{
              padding: 10,
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: "rgba(250,250,250,0.55)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav
          style={{ flex: 1, overflowY: "auto", padding: "8px 0 12px" }}
          aria-label="Navigation principale"
        >
          {hubs.map((hub) => (
            <NavGroup key={hub.id} label={hub.label}>
              {/* Lien direct vers le hub si Accueil ou autres */}
              {hub.id === "accueil" && (
                <DrawerItem
                  href={hub.href}
                  label={hub.label}
                  active={pathname === hub.href}
                  onClick={onClose}
                  Icon={hub.icon}
                />
              )}
              {hub.items.map((item) => {
                const locked = item.proOnly && !isPro
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <DrawerItem
                    key={item.href}
                    href={locked ? "/dashboard/billing" : item.href}
                    label={item.label}
                    active={!locked && isActive}
                    onClick={onClose}
                    Icon={item.icon}
                    locked={locked}
                  />
                )
              })}
            </NavGroup>
          ))}
        </nav>
      </GlassPanel>
    </div>
  )
}

function DrawerItem({
  href,
  label,
  active,
  onClick,
  Icon,
  locked,
}: {
  href: string
  label: string
  active: boolean
  onClick: () => void
  Icon: LucideIcon
  locked?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="lg-focus"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 44,
        padding: "10px 14px",
        margin: "0 10px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        opacity: locked ? 0.55 : 1,
        background: active ? "rgba(232,111,77,0.16)" : "transparent",
        color: active ? "#FAFAFA" : "rgba(250,250,250,0.7)",
        border: active ? "1px solid rgba(232,111,77,0.30)" : "1px solid transparent",
        transition: "background 220ms var(--ease-apple)",
      }}
    >
      <Icon size={15} style={{ color: active ? "var(--accent)" : "currentColor", flexShrink: 0 }} aria-hidden />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {locked && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(232,111,77,0.14)", border: "1px solid rgba(232,111,77,0.28)", borderRadius: 6, padding: "2px 7px" }}>
          PRO
        </span>
      )}
    </Link>
  )
}
