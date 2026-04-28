import React from "react"
import Link from "next/link"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "60px 24px", gap: 16, textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#F5F5F7", margin: "0 0 6px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: 0, maxWidth: 280, lineHeight: 1.6 }}>{description}</p>
      </div>
      {action && (
        action.href
          ? <Link href={action.href} style={{ height: 36, padding: "0 18px", borderRadius: 8, background: "#E86F4D", color: "white", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{action.label}</Link>
          : <button type="button" onClick={action.onClick} style={{ height: 36, padding: "0 18px", borderRadius: 8, background: "#E86F4D", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>{action.label}</button>
      )}
    </div>
  )
}
