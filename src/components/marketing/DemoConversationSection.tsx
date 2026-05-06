"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoMsg {
  id: string
  role: "user" | "agent"
  slug?: string
  agentName?: string
  content: string
  isJoin?: boolean
  card?: boolean
  delay: number
}

interface DemoStep {
  slug: string
  name: string
  desc: string
  triggerIds: string[]
  doneId: string
}

interface DemoMetric {
  label: string
  value: string
  color: string
}

interface Scenario {
  id: string
  label: string
  emoji: string
  chatTitle: string
  agentCount: string
  script: DemoMsg[]
  steps: DemoStep[]
  metrics: DemoMetric[]
  getTypingSlug: (shownCount: number) => string
}

// ─── Scénarios ────────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  // ── Kiné & Santé ──────────────────────────────────────────────────────────
  {
    id: "kine",
    label: "Santé",
    emoji: "🏥",
    chatTitle: "Gestion des appels entrants",
    agentCount: "2 assistants",
    getTypingSlug: (n) => (n < 2 ? "charles" : "marine"),
    script: [
      {
        id: "u1", role: "user",
        content: "Je viens de finir ma dernière séance. Tu as géré les appels cet après-midi ?",
        delay: 0,
      },
      {
        id: "a1", role: "agent", slug: "charles", agentName: "Charles",
        content: "Oui ! Marine a géré 3 appels pendant tes séances. Un nouveau patient a pris RDV.",
        delay: 1200,
      },
      {
        id: "join1", role: "agent", slug: "marine", agentName: "Marine", isJoin: true,
        content: "Marine, Agente Téléphonique, a rejoint la conversation",
        delay: 2400,
      },
      {
        id: "a2", role: "agent", slug: "marine", agentName: "Marine",
        content: "M. Fontaine a rappelé deux fois. J'ai vérifié ton agenda et proposé jeudi 14h30. Il a accepté.",
        delay: 3400,
      },
      {
        id: "a3", role: "agent", slug: "marine", agentName: "Marine", card: true,
        content: `RDV confirmé ✓\nJeudi 16 Jan — 14h30\nM. Thomas Fontaine\nMotif : Lombalgie aiguë\n\nSMS envoyé → +33 6 12 ·· ·· ··\n2 autres messages → rappel demain`,
        delay: 5000,
      },
      {
        id: "a4", role: "agent", slug: "charles", agentName: "Charles",
        content: "3 appels gérés, 1 nouveau RDV créé, 2 rappels planifiés demain matin 📋 Tu peux rentrer tranquillement.",
        delay: 7000,
      },
    ],
    steps: [
      { slug: "marine", name: "Marine décroche", desc: "Répond à la première sonnerie pendant tes séances.", triggerIds: ["a1"], doneId: "join1" },
      { slug: "marine", name: "Agenda vérifié", desc: "Consulte tes créneaux disponibles en temps réel.", triggerIds: ["a2"], doneId: "a3" },
      { slug: "charles", name: "SMS confirmé", desc: "Patient informé, rappels planifiés, récap envoyé.", triggerIds: ["a4"], doneId: "" },
    ],
    metrics: [
      { label: "Appels gérés", value: "3", color: "#22D3EE" },
      { label: "Nouveau RDV", value: "1", color: "#10B981" },
      { label: "Agents actifs", value: "2 / 9", color: "#F472B6" },
      { label: "SMS envoyés", value: "1", color: "#F59E0B" },
    ],
  },

  // ── PME Direction ─────────────────────────────────────────────────────────
  {
    id: "pme",
    label: "PME Direction",
    emoji: "💼",
    chatTitle: "Création de contenu LinkedIn",
    agentCount: "2 assistants",
    getTypingSlug: (n) => (n < 2 ? "charles" : n < 4 ? "lou" : "charles"),
    script: [
      {
        id: "u1", role: "user",
        content: "Écris un post LinkedIn pour annoncer notre nouveau service IA. Cible les dirigeants de PME.",
        delay: 0,
      },
      {
        id: "a1", role: "agent", slug: "charles", agentName: "Charles",
        content: "Je prends en charge ! Je délègue à Lou pour la rédaction du post LinkedIn.",
        delay: 1400,
      },
      {
        id: "join1", role: "agent", slug: "lou", agentName: "Lou", isJoin: true,
        content: "Lou, Agente Contenu & SEO, a rejoint la conversation",
        delay: 2800,
      },
      {
        id: "a2", role: "agent", slug: "lou", agentName: "Lou",
        content: "J'ai rédigé le post ! Voici ma proposition :",
        delay: 3600,
      },
      {
        id: "a3", role: "agent", slug: "lou", agentName: "Lou", card: true,
        content: `Les agents IA ne sont plus de la science-fiction.\n\nEn 2026, tes concurrents automatisent déjà :\n✅ Leurs appels entrants — 24h/24\n✅ Leur contenu LinkedIn — sans effort\n✅ Leur prospection — sans cold email\n\nTeste Lynaris gratuitement 14 jours →\n\n#AgentsIA #AutomatisationPME #IA2026`,
        delay: 5000,
      },
      {
        id: "a4", role: "agent", slug: "charles", agentName: "Charles",
        content: "Publication planifiée pour mardi à 09h42 🎯 Tu veux que j'envoie aussi un résumé à ton équipe par email ?",
        delay: 7200,
      },
    ],
    steps: [
      { slug: "charles", name: "Charles orchestre", desc: "Comprend l'instruction et délègue à l'agent le plus compétent.", triggerIds: ["a1"], doneId: "join1" },
      { slug: "lou", name: "Lou rédige", desc: "Crée le contenu, choisit les hashtags, optimise pour l'algorithme.", triggerIds: ["a2", "a3"], doneId: "a4" },
      { slug: "charles", name: "Publication planifiée", desc: "Charles confirme, planifie et te notifie quand c'est en ligne.", triggerIds: ["a4"], doneId: "" },
    ],
    metrics: [
      { label: "Généré en", value: "12 sec", color: "#10B981" },
      { label: "Publication", value: "Planifiée", color: "#7C3AED" },
      { label: "Agents actifs", value: "2 / 9", color: "#F472B6" },
      { label: "Actions", value: "3", color: "#F59E0B" },
    ],
  },

  // ── Commerce & Restaurant ─────────────────────────────────────────────────
  {
    id: "commerce",
    label: "Commerce",
    emoji: "🛍️",
    chatTitle: "Relance clients inactifs",
    agentCount: "2 assistants",
    getTypingSlug: (n) => (n < 2 ? "charles" : "elio"),
    script: [
      {
        id: "u1", role: "user",
        content: "Lance une relance pour les clients qui n'ont pas commandé depuis 2 mois.",
        delay: 0,
      },
      {
        id: "a1", role: "agent", slug: "charles", agentName: "Charles",
        content: "Je prends en charge ! Elio va analyser ton CRM et créer la séquence de relance.",
        delay: 1300,
      },
      {
        id: "join1", role: "agent", slug: "elio", agentName: "Elio", isJoin: true,
        content: "Elio, Agent Commercial, a rejoint la conversation",
        delay: 2500,
      },
      {
        id: "a2", role: "agent", slug: "elio", agentName: "Elio",
        content: "47 clients inactifs identifiés sur les 2 derniers mois. Séquence de relance prête.",
        delay: 3600,
      },
      {
        id: "a3", role: "agent", slug: "elio", agentName: "Elio", card: true,
        content: `Campagne relance — 47 contacts\n\n📧 Email J+0 : Offre exclusive -15%\n📱 SMS J+3 : Rappel chaleureux\n📞 Appel J+7 : VIP uniquement\n\nTaux de réactivation estimé : 28%\nCA récupérable : +2 300€`,
        delay: 5000,
      },
      {
        id: "a4", role: "agent", slug: "charles", agentName: "Charles",
        content: "Campagne lancée pour 47 contacts 🎯 Rapport de performance dans 7 jours sur WhatsApp.",
        delay: 7200,
      },
    ],
    steps: [
      { slug: "elio", name: "Elio analyse", desc: "Segmente ton CRM et identifie les clients à fort potentiel.", triggerIds: ["a1"], doneId: "join1" },
      { slug: "elio", name: "Séquence créée", desc: "3 points de contact, personnalisés par segment client.", triggerIds: ["a2", "a3"], doneId: "a4" },
      { slug: "charles", name: "Campagne lancée", desc: "47 contacts ciblés, rapport automatique dans 7 jours.", triggerIds: ["a4"], doneId: "" },
    ],
    metrics: [
      { label: "Contacts ciblés", value: "47", color: "#10B981" },
      { label: "Canaux", value: "3", color: "#7C3AED" },
      { label: "Agents actifs", value: "2 / 9", color: "#F472B6" },
      { label: "ROI estimé", value: "+28%", color: "#F59E0B" },
    ],
  },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export function DemoConversationSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [shown, setShown] = useState<string[]>([])
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const scenario = SCENARIOS[scenarioIdx]!

  // Détecter l'entrée dans le viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) { setVisible(true); obs.disconnect() }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Changer de scénario
  const switchScenario = useCallback((idx: number) => {
    setScenarioIdx(idx)
    setShown([])
    setAnimKey((k) => k + 1)
  }, [])

  // Animation séquentielle — se relance quand animKey ou scenarioIdx change
  useEffect(() => {
    if (!visible) return
    const s = SCENARIOS[scenarioIdx]!
    setShown([])
    const timers: ReturnType<typeof setTimeout>[] = []

    s.script.forEach((msg) => {
      timers.push(setTimeout(() => setShown((prev) => [...prev, msg.id]), msg.delay + 200))
    })

    const lastDelay = s.script.at(-1)?.delay ?? 0
    timers.push(setTimeout(() => setAnimKey((k) => k + 1), lastDelay + 5000))

    return () => timers.forEach(clearTimeout)
  }, [visible, animKey, scenarioIdx])

  // Auto-scroll vers le dernier message
  useEffect(() => {
    const t = setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
    }, 50)
    return () => clearTimeout(t)
  }, [shown])

  const visibleMessages = scenario.script.filter((m) => shown.includes(m.id))
  const typingSlug = scenario.getTypingSlug(shown.length)

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative overflow-hidden"
      aria-labelledby="demo-heading"
    >
      {/* Glow de fond */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <span className="ly-overline">Démo en direct</span>
          <h2
            id="demo-heading"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              margin: "12px 0 16px",
            }}
          >
            <span style={{ color: "#F5F5F7" }}>Vos agents </span>
            <span className="ly-gradient-text">collaborent pour vous</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#A1A1AA" }}>
            Choisissez votre secteur — voyez comment vos agents travaillent ensemble en temps réel.
          </p>
        </div>

        {/* Onglets de scénario */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 40,
            flexWrap: "wrap",
          }}
          role="tablist"
          aria-label="Choisir un scénario"
        >
          {SCENARIOS.map((s, idx) => {
            const active = scenarioIdx === idx
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchScenario(idx)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "rgba(232,111,77,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: active
                    ? "linear-gradient(135deg, rgba(232,111,77,0.25), rgba(200,82,47,0.15))"
                    : "rgba(255,255,255,0.04)",
                  color: active ? "#F5F5F7" : "rgba(245,245,247,0.45)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 220ms ease",
                  outline: "none",
                  boxShadow: active ? "0 0 20px rgba(232,111,77,0.12)" : "none",
                }}
              >
                <span style={{ fontSize: 15 }}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Layout démo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* ── Fenêtre de chat ── */}
          <div
            style={{
              background: "rgba(14,14,20,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(124,58,237,0.12), 0 24px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Barre de titre */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(30,30,42,0.8)",
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  color: "rgba(245,245,247,0.4)",
                  fontFamily: "monospace",
                  transition: "all 300ms",
                }}
              >
                {scenario.chatTitle}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "rgba(245,245,247,0.35)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                {scenario.agentCount}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              style={{
                height: 420,
                overflowY: "auto",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                scrollbarWidth: "none",
              }}
            >
              {visibleMessages.map((msg) => {
                if (msg.isJoin) {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "center",
                        animation: "fadeIn 0.3s ease",
                      }}
                    >
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <AgentAvatar slug={msg.slug!} size={16} />
                        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", whiteSpace: "nowrap" }}>
                          {msg.content}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                    </div>
                  )
                }

                if (msg.role === "user") {
                  return (
                    <div
                      key={msg.id}
                      style={{ display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.3s ease" }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "10px 14px",
                          borderRadius: "18px 18px 4px 18px",
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          fontSize: 13,
                          color: "#F5F5F7",
                          lineHeight: 1.55,
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeIn 0.3s ease" }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <AgentAvatar slug={msg.slug!} size={28} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "82%" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.5)", paddingLeft: 2 }}>
                        {msg.agentName}
                      </span>
                      {msg.card ? (
                        <div
                          style={{
                            padding: "12px 14px",
                            borderRadius: "4px 18px 18px 18px",
                            background: "rgba(124,58,237,0.08)",
                            border: "1px solid rgba(124,58,237,0.2)",
                            fontSize: 12,
                            color: "#E8E8F0",
                            lineHeight: 1.65,
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                          }}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "4px 18px 18px 18px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            fontSize: 13,
                            color: "#F5F5F7",
                            lineHeight: 1.55,
                          }}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Indicateur de frappe */}
              {shown.length > 0 && shown.length < scenario.script.length && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", animation: "fadeIn 0.3s ease" }}>
                  <AgentAvatar slug={typingSlug} size={28} />
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: "4px 18px 18px 18px",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "rgba(245,245,247,0.4)",
                          animation: `bounce 1.2s ${i * 0.2}s infinite`,
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barre de saisie simulée */}
            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(30,30,42,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                }}
              >
                <span style={{ fontSize: 12, color: "rgba(245,245,247,0.25)" }}>
                  Dis-moi ce que tu as en tête...
                </span>
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "#7C3AED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Panneau droit ── */}
          <div className="flex flex-col gap-5">
            {/* Étapes */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,245,247,0.3)",
                  margin: "0 0 16px",
                }}
              >
                Comment ça marche
              </p>

              {scenario.steps.map((step, i) => {
                const active = step.triggerIds.some((id) => shown.includes(id))
                const done = step.doneId ? shown.includes(step.doneId) : false
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      marginBottom: i < scenario.steps.length - 1 ? 16 : 0,
                      opacity: active || done ? 1 : 0.35,
                      transition: "opacity 0.4s",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <AgentAvatar slug={step.slug} size={36} />
                      {done && (
                        <div
                          style={{
                            position: "absolute", bottom: -2, right: -2,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "#10B981", border: "2px solid #0A0A0F",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          aria-hidden
                        >
                          <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                      {active && !done && (
                        <div
                          style={{
                            position: "absolute", bottom: -2, right: -2,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "#E86F4D", border: "2px solid #0A0A0F",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          aria-hidden
                        >
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white", animation: "pulse2 1s ease infinite" }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 13, fontWeight: 600, margin: "0 0 3px",
                          color: done ? "#10B981" : active ? "#F5F5F7" : "rgba(245,245,247,0.5)",
                          transition: "color 0.4s",
                        }}
                      >
                        {step.name}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0, lineHeight: 1.5 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Métriques */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {scenario.metrics.map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <p style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", margin: "0 0 6px", letterSpacing: "0.04em" }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: m.color, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Agents disponibles */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(245,245,247,0.3)",
                  margin: "0 0 12px",
                }}
              >
                Équipe disponible 24h/24
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba"].map((slug) => (
                  <div
                    key={slug}
                    style={{ position: "relative" }}
                    title={slug.charAt(0).toUpperCase() + slug.slice(1)}
                  >
                    <AgentAvatar slug={slug} size={34} />
                    <span
                      aria-hidden
                      style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#10B981", border: "1.5px solid #0A0A0F",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        @keyframes pulse2 { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </section>
  )
}
