import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { VERTICALS } from "@/lib/verticals/data"
import Link from "next/link"

interface Props { params: Promise<{ vertical: string }> }

export async function generateStaticParams() {
  return VERTICALS.map(v => ({ vertical: v.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vertical: slug } = await params
  const v = VERTICALS.find(v => v.slug === slug)
  if (!v) return {}
  return {
    title: `${v.name} — Agent vocal IA | Lynaris`,
    description: v.hero.subtitle.slice(0, 160),
    openGraph: {
      title: `${v.name} — Agent vocal IA | Lynaris`,
      description: v.hero.subtitle.slice(0, 160),
      type: "website",
      locale: "fr_FR",
      siteName: "Lynaris",
    },
  }
}

export default async function VerticalPage({ params }: Props) {
  const { vertical: slug } = await params
  const v = VERTICALS.find(v => v.slug === slug)
  if (!v) notFound()

  return (
    <div style={{ background: "#0A0A0B", color: "#F5F5F7", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: `${v.color}15`, border: `1px solid ${v.color}30`, fontSize: 13, color: v.color, marginBottom: 24, fontWeight: 500 }}>
          ● Agent vocal × {v.name}
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 20px" }}>
          {v.hero.title}
        </h1>
        <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.6 }}>
          {v.hero.subtitle}
        </p>
        {v.hero.stat && (
          <div style={{ display: "inline-block", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: "#F5F5F7", marginBottom: 40 }}>
            ✓ {v.hero.stat}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup?plan=decouverte" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: v.color, color: "#0A0A0B", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            Démarrer l&apos;essai gratuit — 14 jours
          </Link>
          <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", color: "#F5F5F7", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
            Voir une démo live
          </Link>
        </div>
      </section>

      {/* Bénéfices */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 40px" }}>Ce que votre agent vocal fait pour vous</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {v.benefits.map((b, i) => (
            <div key={i} style={{ padding: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#F5F5F7" }}>{b.title}</h3>
              <p style={{ fontSize: 14, color: "#A1A1AA", margin: 0, lineHeight: 1.6 }}>{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cas client si dispo */}
      {v.caseStudy && (
        <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
          <blockquote style={{ padding: "32px", background: `${v.color}08`, border: `1px solid ${v.color}25`, borderRadius: 20, margin: 0 }}>
            <p style={{ fontSize: 18, color: "#F5F5F7", fontStyle: "italic", lineHeight: 1.6, margin: "0 0 20px" }}>
              &ldquo;{v.caseStudy.quote}&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: v.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#0A0A0B" }}>
                {v.caseStudy.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", margin: 0 }}>{v.caseStudy.name}</p>
                <p style={{ fontSize: 12, color: "#A1A1AA", margin: 0 }}>{v.caseStudy.role}</p>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: v.color, fontWeight: 600 }}>Résultat : {v.caseStudy.result}</p>
          </blockquote>
          {/* Cabinet pilote — détails sous NDA. Aucune mention nominative tant qu'un accord de citation n'est pas signé. */}
        </section>
      )}

      {/* FAQ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 32px" }}>Questions fréquentes</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {v.faq.map((item, i) => (
            <details key={i} style={{ padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
              <summary style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", cursor: "pointer" }}>{item.q}</summary>
              <p style={{ fontSize: 14, color: "#A1A1AA", margin: "12px 0 0", lineHeight: 1.6 }}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ textAlign: "center", padding: "60px 24px 100px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 16px" }}>Prêt à déléguer vos appels ?</h2>
        <p style={{ fontSize: 16, color: "#A1A1AA", margin: "0 0 32px" }}>14 jours gratuits. Activation en 48h. Sans carte bancaire.</p>
        <Link href="/signup?plan=decouverte" style={{ display: "inline-flex", padding: "16px 36px", borderRadius: 14, background: v.color, color: "#0A0A0B", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>
          Démarrer l&apos;essai gratuit →
        </Link>
      </section>
    </div>
  )
}
