"use client"

import { useEffect } from "react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("[App Error]", { err: String(error), digest: error.digest })
  }, [error])

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-geist-sans, -apple-system, sans-serif)",
        background: "#0A0A0B",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "-0.02em",
          }}
        >
          Quelque chose s&apos;est mal pass&eacute;
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          L&apos;&eacute;quipe Lynaris a &eacute;t&eacute; notifi&eacute;e automatiquement.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(252,165,165,0.9)",
              cursor: "pointer",
            }}
          >
            R&eacute;essayer
          </button>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
