import type { Metadata } from "next"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Changelog — Lynaris",
  description: "Toutes les mises à jour et nouvelles fonctionnalités de Lynaris.",
  // noindex temporaire — page à activer quand le contenu sera prêt.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Changelog — Lynaris",
    description: "Toutes les mises à jour et nouvelles fonctionnalités de Lynaris.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

const releases = [
  {
    version: "v1.4.0",
    date: "Avril 2026",
    title: "Wizard Super-pouvoirs + partage de conversations",
    type: "major",
    changes: [
      { icon: "✨", text: "Wizard multi-étapes pour créer du contenu" },
      { icon: "✨", text: "Modal partage conversation (Privée / Membres / Espace)" },
      { icon: "🐛", text: "Fix : Numéro de téléphone retiré de la page publique" },
    ],
  },
  {
    version: "v1.3.0",
    date: "Mars 2026",
    title: "Section Résultats + avatars SVG 3D",
    type: "major",
    changes: [
      { icon: "✨", text: "9 avatars SVG clay 3D uniques pour chaque agent" },
      { icon: "✨", text: "Section Résultats sur la landing page" },
      { icon: "✨", text: "Démo conversation animée" },
    ],
  },
  {
    version: "v1.2.0",
    date: "Février 2026",
    title: "Dashboard Intégrations + Documents",
    type: "major",
    changes: [
      { icon: "✨", text: "Catalogue 50+ intégrations avec logos SVG" },
      { icon: "✨", text: "Page Documents avec drag & drop" },
      { icon: "✨", text: "Historique des conversations enrichi" },
    ],
  },
  {
    version: "v1.1.0",
    date: "Janvier 2026",
    title: "Agents Chat + Streaming SSE",
    type: "major",
    changes: [
      { icon: "✨", text: "Chat en temps réel avec streaming SSE" },
      { icon: "✨", text: "Working panel avec étapes de progression" },
      { icon: "✨", text: "Upload de fichiers dans le chat" },
    ],
  },
  {
    version: "v1.0.1",
    date: "Décembre 2025",
    title: "Corrections et performances",
    type: "patch",
    changes: [
      { icon: "🐛", text: "Fix middleware auth routes" },
      { icon: "🔧", text: "Optimisation images avatars" },
    ],
  },
  {
    version: "v1.0.0",
    date: "Novembre 2025",
    title: "Launch",
    type: "launch",
    changes: [
      { icon: "🚀", text: "Lancement de Lynaris" },
      // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
      { icon: "✨", text: "Équipe IA Lynaris disponible" },
      { icon: "✨", text: "Intégrations Google, Twilio, ElevenLabs" },
    ],
  },
]

function versionBadgeStyle(type: string): React.CSSProperties {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    major: { bg: "rgba(124,58,237,0.15)", color: "#7C3AED", border: "rgba(124,58,237,0.4)" },
    patch: { bg: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "rgba(100,116,139,0.4)" },
    launch: { bg: "rgba(232,111,77,0.15)", color: "#E86F4D", border: "rgba(232,111,77,0.4)" },
  }
  const defaultColor = { bg: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "rgba(100,116,139,0.4)" }
  const c = colors[type] ?? defaultColor
  return {
    display: "inline-block",
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Fira Code', monospace",
    letterSpacing: "0.02em",
  }
}

export default function ChangelogPage() {
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>
      {/* Hero */}
      <section style={{ padding: "80px 24px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(232,111,77,0.15)",
            color: "#E86F4D",
            border: "1px solid rgba(232,111,77,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>Changelog</div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 800,
            color: "#F5F5F7",
            letterSpacing: "-0.02em",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}>
            Changelog
          </h1>
          <p style={{ fontSize: 18, color: "#A1A1AA", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Toutes les mises à jour de Lynaris
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 19,
            top: 0,
            bottom: 0,
            width: 2,
            background: "rgba(255,255,255,0.06)",
          }} />

          {releases.map((release, idx) => (
            <div key={release.version} style={{
              display: "flex",
              gap: 28,
              marginBottom: idx < releases.length - 1 ? 48 : 0,
              position: "relative",
            }}>
              {/* Dot */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: release.type === "launch"
                  ? "rgba(232,111,77,0.2)"
                  : release.type === "major"
                    ? "rgba(124,58,237,0.2)"
                    : "rgba(100,116,139,0.2)",
                border: `2px solid ${release.type === "launch" ? "rgba(232,111,77,0.6)" : release.type === "major" ? "rgba(124,58,237,0.6)" : "rgba(100,116,139,0.6)"}`,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                zIndex: 1,
                position: "relative",
              }}>
                {release.type === "launch" ? "🚀" : release.type === "major" ? "✨" : "🔧"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={versionBadgeStyle(release.type)}>{release.version}</span>
                  <span style={{ fontSize: 13, color: "#A1A1AA" }}>{release.date}</span>
                </div>

                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#F5F5F7",
                  margin: "0 0 16px",
                  lineHeight: 1.3,
                }}>
                  {release.title}
                </h3>

                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}>
                  {release.changes.map((change, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{change.icon}</span>
                      <span style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.6 }}>{change.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
