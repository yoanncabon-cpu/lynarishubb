"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import { agents } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import {
  MessageSquare, Zap, ArrowRight, Plug, Clock, FileText, Send, RotateCcw,
  Sparkles, ArrowUpRight, Library, BarChart3, TrendingUp, Bot, ContactRound,
  Layers, LayoutGrid,
} from "lucide-react"
import { useActivityStream } from "@/hooks/useActivityStream"
import { VacationModeBanner, useVacationMode } from "@/components/app/VacationModeBanner"
import { usePlan } from "@/hooks/usePlan"
import { buildActivityLabel } from "@/lib/agents/action-labels"
import {
  GlassCard,
  GlassPanel,
  GlassChip,
  ActivityTimeline,
  VoiceLynarisCard,
  type ActivityItem,
} from "@/components/app/glass"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  if (!iso.includes("T") && !iso.includes("-")) return iso
  try {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (diffMin < 1) return "maintenant"
    if (diffMin < 60) return `${diffMin} min`
    const h = Math.floor(diffMin / 60)
    if (h < 24) return `${h}h`
    return h < 48 ? "hier" : new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  } catch { return iso }
}

// ─── AnimatedCounter — count-up easeOutCubic ─────────────────────────────────

function AnimatedCounter({ value, fallback = "—" }: { value: number | null | undefined; fallback?: string }) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (value === null || value === undefined) return
    const start = fromRef.current
    const target = value
    const duration = 900
    const startTime = performance.now()
    let raf = 0
    function tick(t: number) {
      const p = Math.min((t - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const current = Math.round(start + (target - start) * eased)
      setDisplay(current)
      fromRef.current = current
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  if (value === null || value === undefined) return <>{fallback}</>
  return <>{display.toLocaleString("fr-FR")}</>
}

const CHARLES_SUGGESTIONS = [
  "Rédige un email de relance",
  "Planifie ma semaine",
  "Analyse mes performances",
  "Crée un post LinkedIn",
] as const

// ─── Variants Framer Motion ──────────────────────────────────────────────────

const easeApple: [number, number, number, number] = [0.32, 0.72, 0, 1]

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeApple } },
}

const bentoContainerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
}

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show:   { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: easeApple } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { activities, connected, clearActivities } = useActivityStream()
  const vacation = useVacationMode()
  const { limits } = usePlan()
  const hasCharles = limits.agents.includes("charles")

  const [userName, setUserName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState("YC")
  const [stats, setStats] = useState<{ conversations: number; actions: number } | null>(null)
  const [charlesInput, setCharlesInput] = useState("")
  // Date initialisée à null pour éviter hydration mismatch : timezone serveur (UTC Vercel)
  // vs client (Europe/Paris UTC+1) génèrent des heures/greetings différents → erreur React #418.
  // On la set en useEffect côté client uniquement.
  const [now, setNow] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Live clock — init au mount + refresh chaque minute
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Stats — sync live : fetch initial + polling 5 min + refetch sur reprise d'onglet
  // Stats agrégées coûteuses (10 queries DB) → polling rare suffit, le SSE useActivityStream
  // gère déjà le live des activités unitaires.
  useEffect(() => {
    let cancelled = false
    function load() {
      fetch("/api/analytics")
        .then((r) => r.json())
        .then((d: { totals?: { conversations: number; actions: number } }) => {
          if (cancelled) return
          if (d.totals) setStats({ conversations: d.totals.conversations, actions: d.totals.actions })
        })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 300_000)
    function onVisibility() {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
        const { data } = await getSupabaseBrowserClient().auth.getUser()
        const user = data.user
        if (!user) return
        const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined
        setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? null)
        const raw = meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? ""
        const first = raw.split(" ")[0] ?? raw
        if (first) {
          setUserName(first)
          const parts = raw.trim().split(/\s+/)
          setInitials(
            parts.length >= 2
              ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
              : first.slice(0, 2).toUpperCase()
          )
        }
      } catch { /* SSR */ }
    }
    void load()
  }, [])

  function goCharles() {
    const q = charlesInput.trim()
    if (q) {
      localStorage.setItem("prefill_charles", q)
      localStorage.setItem("autosubmit_charles", "true")
    }
    router.push("/dashboard/agents/charles")
  }

  // Tant que `now` est null (SSR + 1er render client), on rend des placeholders
  // identiques côté serveur et client → pas d'hydration mismatch.
  const hour = now?.getHours() ?? 12
  const greeting = !now ? "Bienvenue" : hour < 5 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"
  const editorialWord = !now ? "journée" : hour < 12 ? "matinée" : hour < 18 ? "journée" : "soirée"
  const dayFmt = now
    ? (() => {
        const s = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
        return s.charAt(0).toUpperCase() + s.slice(1)
      })()
    : "—"
  const timeFmt = now ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"

  // Agents en ligne (statut live)
  const onlineCount = agents.filter((a) => a.status === "live" || a.status === "beta").length

  const recentActivities: ActivityItem[] = [...activities].reverse().slice(0, 6).map((ev) => {
    const slug = ev.agent ?? "charles"
    const agentData = agents.find((a) => a.slug === slug)
    const agentName = agentData?.name ?? slug
    return {
      slug,
      agentName,
      agentColor: agentData?.color ?? "#34D399",
      action: buildActivityLabel(ev.action ?? "", agentName, ev.payload ?? null),
      time: ev.time ? relTime(ev.time) : "maintenant",
    }
  })

  return (
    <>
      {vacation.active && <VacationModeBanner onDisable={vacation.disable} />}
      <div
        style={{
          padding: "clamp(18px, 3vw, 28px) clamp(14px, 4vw, 32px) clamp(20px, 3vw, 32px)",
          maxWidth: 1480,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ── Hero greeting éditorial ── */}
        <motion.header
          variants={heroVariants}
          initial="hidden"
          animate="show"
          style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 32 }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              flexShrink: 0,
              overflow: "hidden",
              background: avatarUrl
                ? "transparent"
                : "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              fontWeight: 700,
              color: "#fff",
              boxShadow:
                "0 0 0 2px rgba(232,111,77,0.34), 0 12px 28px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {avatarUrl
              ? <Image src={avatarUrl} alt="" width={60} height={60} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1
              style={{
                fontSize: "clamp(30px, 4.4vw, 48px)",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color: "#FAFAFA",
              }}
            >
              {greeting},{" "}
              <span className="lg-gradient-text" style={{ fontWeight: 700 }}>
                {userName || "ton équipe"}
              </span>
              <span
                aria-hidden
                style={{ color: "rgba(250,250,250,0.35)", fontWeight: 300, marginLeft: 6 }}
              >
                ·
              </span>{" "}
              <span
                className="fraunces"
                style={{ fontStyle: "italic", color: "rgba(250,250,250,0.78)", fontWeight: 400, letterSpacing: "-0.02em" }}
              >
                belle {editorialWord}
              </span>
            </h1>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginTop: 10,
                flexWrap: "wrap",
                fontSize: 13.5,
                color: "rgba(250,250,250,0.55)",
                letterSpacing: "-0.005em",
              }}
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{dayFmt}</span>
              <span aria-hidden style={{ color: "rgba(250,250,250,0.22)" }}>·</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "rgba(250,250,250,0.72)" }}>
                {timeFmt}
              </span>
              <span aria-hidden style={{ color: "rgba(250,250,250,0.22)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="lg-pulse-dot" aria-hidden />
                <span style={{ color: "#34D399", fontWeight: 600 }}>{onlineCount}</span>
                <span>agents en ligne</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <GlassChip icon={<MessageSquare size={12} />} ariaLabel="Conversations">
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#FAFAFA", marginRight: 4 }}>
                <AnimatedCounter value={stats?.conversations ?? null} />
              </span>
              <span style={{ color: "rgba(250,250,250,0.6)" }}>conv.</span>
            </GlassChip>
            <GlassChip icon={<Zap size={12} />} ariaLabel="Actions">
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#FAFAFA", marginRight: 4 }}>
                <AnimatedCounter value={stats?.actions ?? null} />
              </span>
              <span style={{ color: "rgba(250,250,250,0.6)" }}>actions</span>
            </GlassChip>
          </div>
        </motion.header>

        {/* ── Bento Grid avec stagger ── */}
        <motion.div
          className="lg-bento"
          variants={bentoContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Charles — mega-tuile signature */}
          {hasCharles && (
            <motion.div variants={tileVariants} className="lg-bento__charles">
              <GlassCard
                tint="rgba(124,58,237,0.22)"
                radius={24}
                padding={24}
                hover={false}
                specular
                iridescent
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <AgentAvatar slug="charles" size={48} />
                      <span
                        aria-hidden
                        className="lg-pulse-dot"
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          border: "2px solid #16161C",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: "rgba(196,181,253,0.7)",
                          margin: 0,
                        }}
                      >
                        Agent personnel · En ligne
                      </p>
                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#FAFAFA",
                          margin: "2px 0 0",
                          letterSpacing: "-0.025em",
                        }}
                      >
                        Charles
                      </p>
                    </div>
                    <Link
                      href="/dashboard/agents/charles"
                      className="lg-focus"
                      aria-label="Ouvrir Charles"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "7px 12px",
                        borderRadius: 10,
                        background: "rgba(124,58,237,0.20)",
                        border: "1px solid rgba(124,58,237,0.36)",
                        fontSize: 11.5,
                        color: "rgba(196,181,253,0.95)",
                        textDecoration: "none",
                        fontWeight: 600,
                        boxShadow: "0 4px 12px -4px rgba(124,58,237,0.4)",
                      }}
                    >
                      Ouvrir <ArrowUpRight size={11} />
                    </Link>
                  </div>

                  <p
                    style={{
                      fontSize: 14.5,
                      color: "rgba(250,250,250,0.82)",
                      margin: 0,
                      lineHeight: 1.55,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Demande-lui n&apos;importe quoi — il{" "}
                    <span className="fraunces" style={{ fontStyle: "italic", color: "rgba(196,181,253,0.95)" }}>
                      orchestre
                    </span>{" "}
                    tes agents, planifie tes journées, rédige tes emails.
                  </p>

                  <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                    <input
                      ref={inputRef}
                      value={charlesInput}
                      onChange={(e) => setCharlesInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") goCharles() }}
                      placeholder="Rédige un email, planifie ma semaine…"
                      aria-label="Demande à Charles"
                      className="lg-focus"
                      style={{
                        flex: 1,
                        height: 48,
                        padding: "0 18px",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid var(--glass-border)",
                        color: "#FAFAFA",
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                        transition: "border-color 220ms var(--ease-apple), background 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(167,139,250,0.6)"
                        e.target.style.background = "rgba(255,255,255,0.10)"
                        e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.18)"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "var(--glass-border)"
                        e.target.style.background = "rgba(255,255,255,0.07)"
                        e.target.style.boxShadow = "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={goCharles}
                      aria-label="Envoyer"
                      className="lg-focus"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        border: "none",
                        flexShrink: 0,
                        background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 28px -8px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
                        transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
                        ;(e.currentTarget as HTMLElement).style.boxShadow =
                          "0 14px 36px -8px rgba(124,58,237,0.75), inset 0 1px 0 rgba(255,255,255,0.20)"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                        ;(e.currentTarget as HTMLElement).style.boxShadow =
                          "0 10px 28px -8px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.15)"
                      }}
                    >
                      <Send size={18} color="#fff" />
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CHARLES_SUGGESTIONS.map((s) => (
                      <GlassChip
                        key={s}
                        onClick={() => { setCharlesInput(s); inputRef.current?.focus() }}
                      >
                        {s}
                      </GlassChip>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Travail */}
          <motion.div variants={tileVariants} className="lg-bento__travail">
            <BentoHubTile
              title="Travail"
              tagline="Contenus, docs, automatisations"
              href="/dashboard/contenus"
              tint="rgba(52,211,153,0.20)"
              accent="#34D399"
              icon={<Library size={20} />}
              entries={[
                { label: "Contenus",        icon: <Library size={13} />,    href: "/dashboard/contenus" },
                { label: "Documents",       icon: <FileText size={13} />,   href: "/dashboard/documents" },
                { label: "Workspace",       icon: <LayoutGrid size={13} />, href: "/dashboard/workspace" },
                { label: "Automatisations", icon: <Clock size={13} />,      href: "/dashboard/automatisations" },
              ]}
            />
          </motion.div>

          {/* Croissance */}
          <motion.div variants={tileVariants} className="lg-bento__croissance">
            <BentoHubTile
              title="Croissance"
              tagline="CRM, contacts, statistiques"
              href="/dashboard/analytics"
              tint="rgba(34,211,238,0.20)"
              accent="#22D3EE"
              icon={<TrendingUp size={20} />}
              entries={[
                { label: "CRM",          icon: <ContactRound size={13} />, href: "/dashboard/crm" },
                { label: "Contacts",     icon: <ContactRound size={13} />, href: "/dashboard/contacts" },
                { label: "Statistiques", icon: <BarChart3 size={13} />,    href: "/dashboard/analytics" },
              ]}
            />
          </motion.div>

          {/* Plateforme */}
          <motion.div variants={tileVariants} className="lg-bento__plateforme">
            <BentoHubTile
              title="Plateforme"
              tagline="Agents, intégrations, équipe"
              href="/dashboard/agents"
              tint="rgba(244,114,182,0.20)"
              accent="#F472B6"
              icon={<Layers size={20} />}
              entries={[
                { label: "Mes agents",    icon: <Bot size={13} />,      href: "/dashboard/agents" },
                { label: "Compétences",   icon: <Sparkles size={13} />, href: "/dashboard/skills" },
                { label: "Intégrations",  icon: <Plug size={13} />,     href: "/dashboard/integrations" },
              ]}
            />
          </motion.div>

          {/* Stat live tile */}
          <motion.div variants={tileVariants} className="lg-bento__live">
            <GlassCard tint="rgba(232,111,77,0.20)" radius={20} padding={20} hover={false} specular>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="lg-pulse-dot" aria-hidden />
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "rgba(250,250,250,0.6)",
                      margin: 0,
                    }}
                  >
                    Aujourd&apos;hui
                  </p>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 46,
                      fontWeight: 700,
                      color: "#FAFAFA",
                      letterSpacing: "-0.035em",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <AnimatedCounter value={stats?.actions ?? null} />
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(250,250,250,0.62)", marginTop: 8 }}>
                    actions agents ·{" "}
                    <span style={{ fontVariantNumeric: "tabular-nums", color: "rgba(250,250,250,0.85)" }}>
                      <AnimatedCounter value={stats?.conversations ?? null} />
                    </span>{" "}
                    conv.
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    fontSize: 12,
                    fontWeight: 600,
                    color: connected ? "#34D399" : "rgba(250,250,250,0.45)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {connected ? "● En direct" : "○ Reconnexion…"}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Voice tile — toggle micro + wake word */}
          <motion.div variants={tileVariants} className="lg-bento__voice">
            <VoiceLynarisCard />
          </motion.div>

          {/* Activité — large */}
          <motion.div variants={tileVariants} className="lg-bento__activity">
            <GlassPanel level={2} radius={22} padding={22}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className={connected ? "lg-pulse-dot" : ""}
                  aria-hidden
                  style={
                    !connected
                      ? {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.25)",
                          display: "inline-block",
                        }
                      : undefined
                  }
                />
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(250,250,250,0.82)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.10em",
                  }}
                >
                  Activité récente
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: connected ? "#34D399" : "rgba(250,250,250,0.45)",
                    fontWeight: 600,
                  }}
                >
                  {connected ? "En direct" : "Reconnexion…"}
                </span>
                {activities.length > 0 && (
                  <button
                    type="button"
                    onClick={clearActivities}
                    aria-label="Réinitialiser"
                    className="lg-chip lg-focus"
                    style={{
                      marginLeft: "auto",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 11,
                    }}
                  >
                    <RotateCcw size={11} /> Réinitialiser
                  </button>
                )}
              </div>

              {recentActivities.length === 0 ? (
                <div style={{ padding: "36px 24px", textAlign: "center" }}>
                  <div
                    aria-hidden
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: "rgba(232,111,77,0.10)",
                      border: "1px solid rgba(232,111,77,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                    }}
                  >
                    <Sparkles size={22} color="var(--accent)" />
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#FAFAFA",
                      margin: "0 0 4px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {connected ? "Aucune activité" : "Connexion en cours…"}
                  </p>
                  <p style={{ fontSize: 12.5, color: "rgba(250,250,250,0.52)", margin: "0 0 16px" }}>
                    Lance une conversation avec un agent pour démarrer
                  </p>
                  {hasCharles && (
                    <Link
                      href="/dashboard/agents/charles"
                      className="lg-focus"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "10px 18px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                        textDecoration: "none",
                        boxShadow: "0 10px 26px -8px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      Parler à Charles <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ) : (
                <ActivityTimeline items={recentActivities} />
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        /* ─── Bento Grid avec grid-template-areas (prévisible) ─── */
        .lg-bento {
          display: grid;
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(140px, auto);
          gap: 14px;
        }
        .lg-bento > div { min-width: 0; min-height: 0; }
        .lg-bento > div > * { height: 100%; }

        /* Tablette : 2 colonnes, Charles full width en haut */
        @media (min-width: 768px) and (max-width: 1279px) {
          .lg-bento {
            grid-template-columns: repeat(2, 1fr);
            grid-template-areas:
              "charles charles"
              "travail croissance"
              "plateforme voice"
              "live activity";
            gap: 16px;
          }
          .lg-bento__charles    { grid-area: charles; min-height: 280px; }
          .lg-bento__travail    { grid-area: travail; }
          .lg-bento__croissance { grid-area: croissance; }
          .lg-bento__plateforme { grid-area: plateforme; }
          .lg-bento__voice      { grid-area: voice; }
          .lg-bento__live       { grid-area: live; }
          .lg-bento__activity   { grid-area: activity; }
        }

        /* Desktop : 4 colonnes, Charles 2×2 (gauche), 4 hubs 2×2 (droite), Live + Activité bottom */
        @media (min-width: 1280px) {
          .lg-bento {
            grid-template-columns: repeat(4, 1fr);
            grid-template-areas:
              "charles charles travail croissance"
              "charles charles plateforme voice"
              "live live activity activity";
            gap: 18px;
          }
          .lg-bento__charles    { grid-area: charles; min-height: 380px; }
          .lg-bento__travail    { grid-area: travail; }
          .lg-bento__croissance { grid-area: croissance; }
          .lg-bento__plateforme { grid-area: plateforme; }
          .lg-bento__voice      { grid-area: voice; }
          .lg-bento__live       { grid-area: live; }
          .lg-bento__activity   { grid-area: activity; }
        }
      `}</style>
    </>
  )
}

// ─── BentoHubTile ─────────────────────────────────────────────────────────────

function BentoHubTile({
  title,
  tagline,
  href,
  tint,
  accent,
  icon,
  entries,
}: {
  title: string
  tagline: string
  href: string
  tint: string
  accent: string
  icon: React.ReactNode
  entries: { label: string; icon: React.ReactNode; href: string }[]
}) {
  // Pas de Link wrapper sur la carte (évite Link-nested invalide).
  // Header (icône + titre + arrow) = Link vers le hub principal.
  // Chaque chip d'entry = Link vers sa sous-page (cliquable individuellement).
  return (
    <GlassCard tint={tint} radius={20} padding={20} specular hover={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
        {/* Header — clic = page principale du hub */}
        <Link
          href={href}
          aria-label={`Aller à ${title}`}
          className="lg-focus"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            borderRadius: 12,
            margin: -4,
            padding: 4,
            transition: "background 220ms var(--ease-apple)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
          }}
        >
          <div
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: `${accent}28`,
              border: `1px solid ${accent}55`,
              color: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 4px 16px -6px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.10)`,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#FAFAFA", margin: 0, letterSpacing: "-0.015em" }}>
              {title}
            </p>
            <p style={{ fontSize: 11.5, color: "rgba(250,250,250,0.58)", margin: "2px 0 0" }}>
              {tagline}
            </p>
          </div>
          <ArrowUpRight size={15} style={{ color: "rgba(250,250,250,0.4)", flexShrink: 0 }} aria-hidden />
        </Link>

        {/* Chips entries — chacune cliquable vers sa sous-page */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
          {entries.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              aria-label={`Aller à ${e.label}`}
              className="lg-chip lg-focus"
              style={{
                textDecoration: "none",
                padding: "8px 14px",
                fontSize: 12,
                minHeight: 32,
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onMouseEnter={(el) => {
                ;(el.currentTarget as HTMLElement).style.borderColor = `${accent}55`
                ;(el.currentTarget as HTMLElement).style.background = `${accent}14`
                ;(el.currentTarget as HTMLElement).style.color = "#FAFAFA"
              }}
              onMouseLeave={(el) => {
                ;(el.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)"
                ;(el.currentTarget as HTMLElement).style.background = "var(--glass-3-bg)"
                ;(el.currentTarget as HTMLElement).style.color = "rgba(250,250,250,0.78)"
              }}
            >
              <span style={{ color: accent, display: "inline-flex", flexShrink: 0 }}>{e.icon}</span>
              {e.label}
            </Link>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
