"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LynarisLogo } from "@/components/shared/LynarisLogo"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

const AGENTS_DROPDOWN = [
  { slug: "marine", name: "Marine", role: "Téléphonique" },
  { slug: "charles", name: "Charles", role: "Orchestrateur" },
  { slug: "lou", name: "Lou", role: "Contenu & SEO" },
  { slug: "elio", name: "Elio", role: "Commercial" },
  { slug: "mae", name: "Mae", role: "Mail" },
  { slug: "max", name: "Max", role: "Photo & Vidéo" },
  { slug: "nova", name: "Nova", role: "Business" },
  { slug: "alba", name: "Alba", role: "RH" },
] as const

const navLinks = [
  { href: "/agents", label: "Agents", hasDropdown: true },
  { href: "/tarifs", label: "Tarifs", hasDropdown: false },
  { href: "/blog", label: "Blog", hasDropdown: false },
  { href: "/docs", label: "Docs", hasDropdown: false },
]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [agentsOpen, setAgentsOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const agentsRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 20)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(window.scrollY / docHeight, 1))
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close agents dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (agentsRef.current && !agentsRef.current.contains(e.target as Node)) {
        setAgentsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-[2px]"
        style={{
          width: `${scrollProgress * 100}%`,
          background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
          transition: "width 0.1s linear",
        }}
        aria-hidden
      />

      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "backdrop-blur-[48px] [-webkit-backdrop-filter:blur(48px)]"
            : "bg-transparent"
        )}
        style={{
          backgroundColor: isScrolled ? "rgba(10,10,15,0.65)" : "transparent",
          borderBottom: isScrolled
            ? "1px solid rgba(124,58,237,0.18)"
            : "1px solid transparent",
        }}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Lynaris — accueil">
            <LynarisLogo size={36} showWordmark={true} />
          </Link>

          {/* Links desktop */}
          <ul className="hidden md:flex items-center gap-0.5" role="list">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              if (link.hasDropdown) {
                return (
                  <li key={link.href} ref={agentsRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setAgentsOpen(!agentsOpen)}
                      onMouseEnter={() => setAgentsOpen(true)}
                      onMouseLeave={() => setAgentsOpen(false)}
                      className={cn(
                        "relative flex items-center gap-1 px-4 py-2 text-[13px] font-medium transition-colors tracking-[-0.01em]",
                        isActive || agentsOpen
                          ? "text-[#F5F5F7]"
                          : "text-[#71717A] hover:text-[#F5F5F7]"
                      )}
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          agentsOpen ? "rotate-180" : ""
                        )}
                      />
                      {(isActive || agentsOpen) && (
                        <span
                          className="absolute h-px"
                          style={{
                            bottom: 2,
                            left: 14,
                            right: 14,
                            background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
                          }}
                        />
                      )}
                    </button>

                    {/* Agents dropdown */}
                    <AnimatePresence>
                      {agentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute top-[calc(100%+4px)] left-0 rounded-2xl border p-3 shadow-2xl"
                          style={{
                            background: "rgba(14,14,20,0.96)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(124,58,237,0.2)",
                            width: "min(380px, calc(100vw - 32px))",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
                          }}
                          onMouseEnter={() => setAgentsOpen(true)}
                          onMouseLeave={() => setAgentsOpen(false)}
                        >
                          <div className="grid grid-cols-3 gap-1">
                            {AGENTS_DROPDOWN.map(({ slug, name, role }) => (
                              <Link
                                key={slug}
                                href={`/agents/${slug}`}
                                className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors hover:bg-white/5"
                                onClick={() => setAgentsOpen(false)}
                              >
                                <AgentAvatar slug={slug} size={36} glow />
                                <span className="text-[12px] font-semibold text-[#F5F5F7] leading-tight">{name}</span>
                                <span className="text-[10px] text-[#71717A] leading-tight text-center">{role}</span>
                              </Link>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <Link
                              href="/agents"
                              className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
                              onClick={() => setAgentsOpen(false)}
                            >
                              Voir tous les agents →
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              }
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 text-[13px] font-medium transition-colors tracking-[-0.01em]",
                      isActive
                        ? "text-[#F5F5F7]"
                        : "text-[#71717A] hover:text-[#F5F5F7]"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute h-px"
                        style={{
                          bottom: 2,
                          left: 14,
                          right: 14,
                          background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
                        }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-[#71717A] hover:text-[#F5F5F7] hover:bg-white/5 transition-all"
            >
              Se connecter
            </Link>
            <Link
              href="/tarifs"
              className="group relative inline-flex h-9 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #E86F4D 0%, #C8522F 100%)",
                boxShadow: "0 0 20px rgba(232,111,77,0.35)",
              }}
            >
              <span className="relative z-10">Essai gratuit</span>
              <svg
                className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              {/* Shimmer */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-600"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                }}
                aria-hidden
              />
            </Link>
          </div>

          {/* CTA mobile — directement visible, pas de hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-lg px-3 text-[12px] font-medium text-[#71717A] hover:text-[#F5F5F7] hover:bg-white/5 transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #E86F4D 0%, #C8522F 100%)",
                boxShadow: "0 0 16px rgba(232,111,77,0.35)",
              }}
            >
              Essai gratuit
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}
