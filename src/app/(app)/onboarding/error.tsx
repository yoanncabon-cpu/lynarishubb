"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function OnboardingError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    logger.error("[Onboarding Error]", { err: String(error), digest: error.digest })
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
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Quelque chose s&apos;est mal pass&eacute;
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          Une erreur est survenue pendant l&apos;onboarding.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              background: "rgba(232,111,77,0.12)",
              border: "1px solid rgba(232,111,77,0.3)",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(252,185,165,0.9)",
              cursor: "pointer",
            }}
          >
            R&eacute;essayer
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
          >
            Aller au dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
