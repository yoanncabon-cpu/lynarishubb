import Link from "next/link"

const footerColumns = [
  {
    title: "Agents",
    links: [
      { href: "/agents", label: "Tous les agents" },
      { href: "/agents/charles", label: "Charles" },
      { href: "/agents/lou", label: "Lou" },
      { href: "/agents/elio", label: "Elio" },
      { href: "/agents/mae", label: "Mae" },
    ],
  },
  {
    title: "Ressources",
    links: [
      // Liens vers /cas-clients et /changelog retirés — pages en noindex tant que le contenu n'est pas prêt
      { href: "/docs", label: "Documentation" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      // Liens vers /carrieres et /presse retirés — pages en noindex tant que le contenu n'est pas prêt
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/legal/cgu", label: "CGU" },
      { href: "/legal/confidentialite", label: "Confidentialité" },
      { href: "/legal/mentions-legales", label: "Mentions" },
      { href: "/legal/rgpd", label: "RGPD" },
    ],
  },
]

export function Footer() {
  const logoSize = 32

  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] mt-auto" style={{ background: "#0A0A0F" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div
          className="grid gap-8"
          // 4 colonnes : brand + 3 colonnes de liens (Agents, Ressources, Entreprise, Légal)
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Brand col */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize * 0.28,
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #22D3EE)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 60%)" }}
                />
                <span className="relative z-10 text-white select-none" style={{ fontWeight: 800, fontSize: logoSize * 0.45 }}>
                  L
                </span>
              </div>
              <span style={{ color: "#F5F5F7", fontWeight: 700, fontSize: 18, letterSpacing: "-0.04em" }}>
                Lynaris
              </span>
            </Link>
            <p
              style={{
                fontSize: 13,
                color: "#71717A",
                lineHeight: 1.6,
                maxWidth: 220,
              }}
            >
              Ton équipe IA. Qui exécute.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#F5F5F7",
                  marginBottom: 12,
                  letterSpacing: "0.02em",
                }}
              >
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-[#F5F5F7] transition-colors"
                      style={{ fontSize: 13, color: "#71717A" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p style={{ fontSize: 12, color: "#71717A" }}>
            &copy;&nbsp;2026 Lynaris &mdash; Fait en France avec &hearts; et Claude
          </p>
          <p style={{ fontSize: 12, color: "#71717A" }}>
            v1.0.0
          </p>
        </div>
      </div>
    </footer>
  )
}
