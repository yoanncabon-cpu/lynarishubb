"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

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
      { href: "/docs", label: "Documentation" },
      { href: "/blog", label: "Blog" },
      { href: "/calculateur", label: "Calculateur ROI" },
      { href: "/status", label: "Statut des services" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
      { href: "/tarifs", label: "Tarifs" },
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

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const socials = [
  {
    href: "https://linkedin.com/company/lynaris",
    label: "LinkedIn",
    Icon: LinkedInIcon,
  },
  {
    href: "https://twitter.com/lynaris_ai",
    label: "Twitter / X",
    Icon: XIcon,
  },
]

export function Footer() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const logoSize = 32

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // Intégration newsletter à connecter (Resend ou ConvertKit)
    setSubmitted(true)
  }

  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] mt-auto" style={{ background: "#0A0A0F" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:2fr_1fr_1fr_1fr_1fr]">
          {/* Colonne brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <Image
                src="/logo.svg"
                alt="Lynaris"
                width={logoSize}
                height={logoSize}
                priority
                className="select-none"
              />
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
                marginBottom: 16,
              }}
            >
              Ton équipe IA. Qui exécute.
            </p>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: "#52525B" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F7")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes liens */}
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

        {/* Newsletter */}
        <div
          className="mt-10 rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {submitted ? (
            <p className="text-center text-[13px] text-[#A78BFA]">
              Merci ! Tu recevras les prochaines updates Lynaris.
            </p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="footer-email" className="block text-[13px] font-medium text-[#A1A1AA] mb-2 sm:mb-0 sm:inline sm:mr-3">
                  Reçois les updates Lynaris
                </label>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.fr"
                  required
                  className="flex-1 sm:w-56 rounded-lg px-3.5 py-2 text-[13px] text-[#F5F5F7] placeholder-[#52525B] outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                  }}
                >
                  S&apos;abonner →
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p style={{ fontSize: 12, color: "#71717A" }}>
            &copy;&nbsp;2026 Lynaris &mdash; Fait en France avec &hearts;
          </p>
          <p style={{ fontSize: 12, color: "#71717A" }}>
            v1.0.0
          </p>
        </div>
      </div>
    </footer>
  )
}
