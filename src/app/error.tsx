"use client"

import { useEffect } from "react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("[Global Error]", { err: String(error), digest: error.digest })
  }, [error])

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0A0A0B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-geist-sans, -apple-system, sans-serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle red glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 440,
          width: "100%",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
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
            margin: "0 0 8px",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          L&apos;&eacute;quipe Lynaris a &eacute;t&eacute; notifi&eacute;e automatiquement.
        </p>
        {error.digest && (
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-geist-mono, monospace)",
            }}
          >
            Ref&nbsp;: {error.digest}
          </p>
        )}
        {!error.digest && <div style={{ marginBottom: 32 }} />}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 7A6 6 0 1013 7M1 7V3M1 7H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            R&eacute;essayer
          </button>

          <Link
            href="/"
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
            Retour &agrave; l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
