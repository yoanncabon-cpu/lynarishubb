"use client"

import React from "react"

export interface NavGroupProps {
  label?: string
  children: React.ReactNode
  collapsed?: boolean
}

/**
 * Section labellisée dans la sidebar verre.
 */
export function NavGroup({ label, children, collapsed = false }: NavGroupProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && !collapsed && (
        <div
          style={{
            padding: "6px 14px 4px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "rgba(250,250,250,0.38)",
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{children}</div>
    </div>
  )
}
