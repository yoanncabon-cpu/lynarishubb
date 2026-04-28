"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"
import { motion, LayoutGroup } from "framer-motion"
import { GlassPanel } from "@/components/app/glass"
import { findActiveHub } from "./SpotlightNavConfig"
import { usePlan } from "@/hooks/usePlan"

interface Props {
  isAdmin: boolean
}

/**
 * Sub-nav contextuelle affichée sous la SpotlightTopBar uniquement quand
 * le hub courant a des sous-pages. Auto-hidden sur la home.
 */
export function SpotlightSubNav({ isAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { plan } = usePlan()
  const activeHub = findActiveHub(pathname)
  const isPro = plan === "pro" || plan === "custom"

  // Prefetch agressif au hover sur les chips de sous-navigation
  const prefetchItem = useCallback(
    (href: string) => {
      try { router.prefetch(href) } catch { /* */ }
    },
    [router]
  )

  if (!activeHub || activeHub.items.length === 0) return null
  if (activeHub.adminOnly && !isAdmin) return null

  return (
    <GlassPanel
      as="nav"
      level={2}
      radius={16}
      aria-label={`Sous-pages ${activeHub.label}`}
      style={{ flexShrink: 0, overflow: "hidden" }}
      contentStyle={{
        display: "flex",
        gap: 2,
        padding: "8px 12px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <LayoutGroup id={`subnav-${activeHub.id}`}>
        {activeHub.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const locked = item.proOnly && !isPro
          const Icon = item.icon
          const target = locked ? "/dashboard/billing" : item.href

          return (
            <Link
              key={item.href}
              href={target}
              aria-current={isActive ? "page" : undefined}
              title={locked ? "Disponible en Plan Pro" : undefined}
              className="lg-focus"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 13px",
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#FAFAFA" : "rgba(250,250,250,0.62)",
                textDecoration: "none",
                transition: "color 220ms var(--ease-apple)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                opacity: locked ? 0.6 : 1,
                letterSpacing: "-0.005em",
              }}
              onMouseEnter={(e) => {
                prefetchItem(target)
                if (!isActive) {
                  ;(e.currentTarget as HTMLElement).style.color = "#FAFAFA"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.62)"
                }
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="subnav-active-bg"
                  aria-hidden
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 10,
                    background: "rgba(232,111,77,0.14)",
                    border: "1px solid rgba(232,111,77,0.30)",
                    zIndex: 0,
                  }}
                />
              )}
              <Icon
                size={13}
                strokeWidth={isActive ? 2.4 : 2}
                style={{ color: isActive ? "var(--accent)" : "currentColor", flexShrink: 0, position: "relative", zIndex: 1 }}
                aria-hidden
              />
              <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
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
                    padding: "1px 5px",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </LayoutGroup>
    </GlassPanel>
  )
}
