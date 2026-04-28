import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BLOG_ARTICLES } from "@/lib/blog/articles"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  return {
    title: `${article.title} — Blog Lynaris`,
    description: article.excerpt,
  }
}

function formatDate(iso: string): string {
  const parts = iso.split("-")
  const year = parseInt(parts[0] ?? "2026", 10)
  const month = parseInt(parts[1] ?? "1", 10)
  const day = parseInt(parts[2] ?? "1", 10)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

/** Sanitisation HTML côté serveur — supprime scripts et event handlers */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const article = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  const others = BLOG_ARTICLES.filter((a) => a.slug !== slug).slice(0, 2)

  return (
    <div style={{ background: "#09090B", minHeight: "100vh", color: "#F5F5F7" }}>
      {/* Top nav */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 56,
            fontSize: 14,
          }}
        >
          <Link
            href="/"
            style={{ color: "#A1A1AA", textDecoration: "none" }}
          >
            Lynaris
          </Link>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
          <Link
            href="/blog"
            style={{ color: "#A1A1AA", textDecoration: "none" }}
          >
            Blog
          </Link>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
          <span
            style={{
              color: "#F5F5F7",
              maxWidth: 260,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {article.title}
          </span>
        </div>
      </div>

      {/* Article header */}
      <header style={{ padding: "56px 24px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingInline: 24 }}>
          {/* Category + agent badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <span
              style={{
                display: "inline-block",
                background: `${article.categoryColor}22`,
                color: article.categoryColor,
                border: `1px solid ${article.categoryColor}44`,
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {article.category}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: `${article.agentColor}18`,
                color: article.agentColor,
                border: `1px solid ${article.agentColor}33`,
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: `${article.agentColor}33`,
                  border: `1.5px solid ${article.agentColor}66`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {article.agent[0]}
              </span>
              par {article.agent}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "#F5F5F7",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            {article.title}
          </h1>

          {/* Excerpt */}
          <p
            style={{
              fontSize: 18,
              color: "#A1A1AA",
              lineHeight: 1.65,
              margin: "0 0 28px",
              maxWidth: 680,
            }}
          >
            {article.excerpt}
          </p>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 14,
              color: "#71717A",
              flexWrap: "wrap",
            }}
          >
            <span>{formatDate(article.publishedAt)}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span>{article.readTime} de lecture</span>
          </div>
        </div>
      </header>

      {/* Article content */}
      <main style={{ padding: "48px 0" }}>
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
        />
      </main>

      {/* Retour au blog */}
      <div style={{ padding: "0 24px 48px", maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/blog"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#E86F4D",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 16px",
            background: "rgba(232,111,77,0.08)",
            border: "1px solid rgba(232,111,77,0.2)",
            borderRadius: 8,
            transition: "background 150ms ease, border-color 150ms ease",
          }}
        >
          ← Retour au blog
        </Link>
      </div>

      {/* Read also */}
      {others.length > 0 && (
        <section
          style={{
            padding: "48px 24px 64px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#F5F5F7",
                margin: "0 0 24px",
              }}
            >
              Lire aussi
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {others.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="blog-card"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 22,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      alignSelf: "flex-start",
                      background: `${a.categoryColor}22`,
                      color: a.categoryColor,
                      border: `1px solid ${a.categoryColor}44`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {a.category}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#F5F5F7",
                      lineHeight: 1.4,
                    }}
                  >
                    {a.title}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#A1A1AA",
                      lineHeight: 1.6,
                    }}
                  >
                    {a.readTime} de lecture
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        style={{
          padding: "48px 24px 80px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: "0 auto",
            textAlign: "center",
            background: "rgba(232,111,77,0.08)",
            border: "1px solid rgba(232,111,77,0.2)",
            borderRadius: 20,
            padding: "40px 32px",
          }}
        >
          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#F5F5F7",
              margin: "0 0 12px",
            }}
          >
            Tester Lynaris gratuitement
          </h3>
          <p
            style={{
              fontSize: 15,
              color: "#A1A1AA",
              marginBottom: 28,
              lineHeight: 1.65,
            }}
          >
            Déployez votre premier agent vocal IA en moins d&apos;une heure. Sans engagement.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              background: "#E86F4D",
              color: "white",
              textDecoration: "none",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Commencer gratuitement →
          </Link>
        </div>
      </section>
    </div>
  )
}
