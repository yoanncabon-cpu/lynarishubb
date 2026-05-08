"use client"

import { useEffect } from "react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("[Dashboard Error]", { err: String(error), digest: error.digest })
  }, [error])

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "var(--font-geist-sans, -apple-system, sans-serif)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#EF4444"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "-0.02em",
          }}
        >
          Quelque chose s&apos;est mal pass&eacute;
        </h1>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
          }}
        >
          L&apos;&eacute;quipe Lynaris a &eacute;t&eacute; notifi&eacute;e automatiquement.
        </p>
        {error.digest && (
          <p
            style={{
              margin: "0 0 28px",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "var(--font-geist-mono, monospace)",
            }}
          >
            Ref&nbsp;: {error.digest}
          </p>
        )}
        {!error.digest && <div style={{ marginBottom: 28 }} />}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 38,
              padding: "0 18px",
              borderRadius: 9,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(252,165,165,0.85)",
              cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 7A6 6 0 1013 7M1 7V3M1 7H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            R&eacute;essayer
          </button>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 38,
              padding: "0 18px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
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
