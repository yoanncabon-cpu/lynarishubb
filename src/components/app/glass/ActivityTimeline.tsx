"use client"

import React from "react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { ExternalLink } from "lucide-react"

export interface ActivityItem {
  slug: string
  agentName: string
  agentColor: string
  action: string
  time: string
  href?: string
}

export interface ActivityTimelineProps {
  items: ActivityItem[]
  emptyState?: React.ReactNode
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

/**
 * Timeline d'activité — cartes cliquables, chaque item navigue vers l'agent ou la conversation.
 */
export function ActivityTimeline({ items, emptyState }: ActivityTimelineProps) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, idx) => {
        const rgb = hexToRgb(item.agentColor)
        const href = item.href ?? `/dashboard/agents/${item.slug}`
        return (
          <a
            key={`${item.slug}-${idx}`}
            href={href}
            className="lg-surface-3 lg-sheen"
            style={{
              borderRadius: 14,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderLeft: `3px solid rgba(${rgb}, 0.55)`,
              cursor: "pointer",
              textDecoration: "none",
              transition: "background 120ms, box-shadow 120ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = `rgba(${rgb}, 0.06)`
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 0 1px rgba(${rgb}, 0.18)`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = ""
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = ""
            }}
          >
            <AgentAvatar slug={item.slug} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(250,250,250,0.88)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 600, color: item.agentColor }}>{item.agentName}</span>
                <span style={{ color: "rgba(250,250,250,0.38)", margin: "0 6px" }}>·</span>
                {item.action}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(250,250,250,0.45)",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {item.time}
              </span>
              <ExternalLink size={11} color="rgba(250,250,250,0.25)" aria-hidden />
            </div>
          </a>
        )
      })}
    </div>
  )
}
