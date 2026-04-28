import Link from "next/link"
import { LynarisLogo } from "@/components/shared/LynarisLogo"

export default function NotFound() {
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
      {/* Grid pattern background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(34,211,238,0.06) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 480,
          width: "100%",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <LynarisLogo size={52} showWordmark={false} />
        </div>

        {/* 404 */}
        <div
          aria-hidden
          style={{
            fontSize: "clamp(80px, 18vw, 160px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 24,
            userSelect: "none",
          }}
        >
          404
        </div>

        {/* Texts */}
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "-0.02em",
          }}
        >
          Cette page n&apos;existe pas (ou plus).
        </h1>
        <p
          style={{
            margin: "0 0 40px",
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
          }}
        >
          Elle a peut-&ecirc;tre &eacute;t&eacute; d&eacute;plac&eacute;e, renomm&eacute;e ou supprim&eacute;e.
        </p>

        {/* Quick links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              transition: "all 150ms",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Accueil
          </Link>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
            }}
          >
            Dashboard
          </Link>

          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid rgba(124,58,237,0.35)",
              background: "rgba(124,58,237,0.1)",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(167,139,250,0.9)",
              textDecoration: "none",
            }}
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  )
}
