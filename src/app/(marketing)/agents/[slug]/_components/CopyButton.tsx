"use client"

import { useState } from "react"

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback pour navigateurs sans Clipboard API
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontSize: 11,
        borderRadius: 6,
        color: copied ? "#22D3EE" : "#71717A",
        padding: "4px 10px",
        border: `1px solid ${copied ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.08)"}`,
        background: "transparent",
        cursor: "pointer",
        transition: "color 150ms ease, border-color 150ms ease",
      }}
    >
      {copied ? "Copié ✓" : "Copier"}
    </button>
  )
}
