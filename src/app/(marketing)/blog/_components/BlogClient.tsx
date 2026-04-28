"use client"

import { useState } from "react"
import Link from "next/link"
import { BLOG_ARTICLES } from "@/lib/blog/articles"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BlogClient() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    if (!EMAIL_REGEX.test(email)) return
    setError(false)
    setLoading(true)
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#111114", minHeight: "100vh", color: "#FAFAFA" }}>
      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(232,111,77,0.12)",
            color: "#E86F4D",
            border: "1px solid rgba(232,111,77,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>Blog</div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 800,
            color: "#F5F5F7",
            letterSpacing: "-0.02em",
            margin: "0 0 20px",
            lineHeight: 1.1,
          }}>
            Le blog Lynaris
          </h1>
          <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Actualités IA, automatisation et stratégie pour les entrepreneurs
          </p>
        </div>
      </section>

      {/* Articles grid */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {BLOG_ARTICLES.map((article) => (
            <Link
              href={`/blog/${article.slug}`}
              key={article.slug}
              className="blog-card"
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 28,
                cursor: "pointer",
              }}
            >
              {/* Category badge */}
              <span style={{
                display: "inline-block",
                alignSelf: "flex-start",
                background: `${article.categoryColor}22`,
                color: article.categoryColor,
                border: `1px solid ${article.categoryColor}44`,
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                {article.category}
              </span>

              {/* Title */}
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#F5F5F7",
                lineHeight: 1.4,
                margin: 0,
              }}>
                {article.title}
              </h2>

              {/* Excerpt */}
              <p style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.7, margin: 0, flexGrow: 1 }}>
                {article.excerpt}
              </p>

              {/* Footer */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `${article.agentColor}22`,
                    border: `1.5px solid ${article.agentColor}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: article.agentColor,
                  }}>
                    {article.agent[0]}
                  </div>
                  <span style={{ fontSize: 13, color: "#A1A1AA" }}>{article.agent}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>·</span>
                  <span style={{ fontSize: 13, color: "#A1A1AA" }}>{article.readTime}</span>
                </div>
                <span style={{ fontSize: 13, color: "#E86F4D", fontWeight: 600 }}>Lire →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section style={{
        padding: "64px 24px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: "#F5F5F7", margin: "0 0 8px" }}>
            Restez informé
          </h3>
          <p style={{ fontSize: 15, color: "#A1A1AA", marginBottom: 28, lineHeight: 1.6 }}>
            Recevez nos derniers articles sur l&apos;IA et l&apos;automatisation, chaque semaine.
          </p>
          {submitted ? (
            <div style={{
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 12,
              padding: "16px 24px",
              color: "#34D399",
              fontSize: 15,
              fontWeight: 600,
            }}>
              Merci ! Tu recevras notre prochain article.
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(false) }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSubscribe() }}
                  style={{
                    flex: "1 1 220px",
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "#F5F5F7",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => void handleSubscribe()}
                  disabled={loading || !EMAIL_REGEX.test(email)}
                  style={{
                    background: loading ? "rgba(232,111,77,0.6)" : "#E86F4D",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading || !EMAIL_REGEX.test(email) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: !EMAIL_REGEX.test(email) && !loading ? 0.6 : 1,
                    transition: "opacity 150ms ease, background 150ms ease",
                  }}
                >
                  {loading ? "Envoi…" : "S’abonner"}
                </button>
              </div>
              {error && (
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#EF4444" }}>
                  Une erreur est survenue. Réessaie dans quelques secondes.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
