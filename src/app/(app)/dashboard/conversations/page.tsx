"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Phone, Mail, MessageSquare, Download, Search, MessageCircle, Plus, Lock, Users, Trash2, RotateCcw, Send, Loader2 } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { GlassPanel, GlassChip } from "@/components/app/glass"

// ─── Types ──────────────────────────────────────────────────────────────────

type Channel = "voice" | "email" | "chat"
type FilterTab = "Toutes" | "Voix" | "Email" | "Chat"
type PrivacyTab = "Toutes" | "Privées" | "Partagées"
type Privacy = "private" | "shared"

interface ConvMessage {
  role: "agent" | "contact" | "system"
  content: string
  time: string
}

interface ConvAgent {
  slug: string
  name: string
  color: string
}

interface Conversation {
  id: string
  title: string
  agent: string
  agentSlug: string
  agentColor: string
  agents: ConvAgent[]
  contact: string
  channel: Channel
  summary: string
  lastMessage: string
  duration: string
  time: string
  status: "terminée" | "en cours"
  privacy: Privacy
  messages: ConvMessage[]
}

// ─── Channel config ──────────────────────────────────────────────────────────

const channelConfig: Record<Channel, { icon: typeof Phone; label: string; bg: string; color: string; border: string }> = {
  voice: { icon: Phone, label: "Voix", bg: "rgba(34,211,238,0.08)", color: "#22D3EE", border: "rgba(34,211,238,0.15)" },
  email: { icon: Mail, label: "Email", bg: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "rgba(245,158,11,0.15)" },
  chat: { icon: MessageSquare, label: "Chat", bg: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "rgba(124,58,237,0.15)" },
}

const CHANNEL_FILTER_MAP: Record<FilterTab, Channel | null> = {
  Toutes: null, Voix: "voice", Email: "email", Chat: "chat",
}

// ─── Conversations data (removed — loaded from API) ──────────────────────────

const _LEGACY_conversations: Conversation[] = [
  {
    id: "conv-001", title: "Création de contenu Instagram",
    agent: "Lou", agentSlug: "lou", agentColor: "#F472B6",
    agents: [
      { slug: "lou", name: "Lou", color: "#F472B6" },
      { slug: "charles", name: "Charles", color: "#7C3AED" },
    ],
    contact: "Yoann", channel: "chat",
    summary: "Création de posts Instagram avec validation Charles",
    lastMessage: "Publication planifiée pour mardi 9h42",
    duration: "8 messages", time: "il y a 2h", status: "terminée",
    privacy: "shared",
    messages: [
      { role: "contact", content: "Lou, crée-moi 3 posts Instagram pour la semaine prochaine.", time: "07:30" },
      { role: "agent", content: "Sur le coup ! Je prépare 3 concepts adaptés à votre audience.", time: "07:31" },
      { role: "system", content: "→ Charles validé le plan éditorial · 3 posts générés", time: "07:35" },
      { role: "agent", content: "Publication planifiée pour mardi 9h42, mercredi 12h00 et vendredi 18h30.", time: "07:40" },
    ],
  },
  {
    id: "conv-002", title: "Prospection LinkedIn PME",
    agent: "Elio", agentSlug: "elio", agentColor: "#10B981",
    agents: [{ slug: "elio", name: "Elio", color: "#10B981" }],
    contact: "Prospects", channel: "email",
    summary: "Campagne prospection LinkedIn PME Île-de-France",
    lastMessage: "5 nouveaux prospects qualifiés cette semaine",
    duration: "12 messages", time: "hier", status: "terminée",
    privacy: "private",
    messages: [
      { role: "contact", content: "Elio, lance la campagne prospection PME.", time: "09:00" },
      { role: "agent", content: "Campagne lancée. Ciblage PME Île-de-France, 50 prospects identifiés.", time: "09:05" },
      { role: "system", content: "✓ 5 réponses positives · Score moyen 74/100", time: "17:00" },
    ],
  },
  {
    // Mention Cabinet Ménigoz retirée — pas d'accord de citation
    id: "conv-003", title: "Cabinet de kinésithérapie — démo",
    agent: "Marine", agentSlug: "marine", agentColor: "#22D3EE",
    agents: [{ slug: "marine", name: "Marine", color: "#22D3EE" }],
    contact: "Patients cabinet partenaire", channel: "voice",
    summary: "Réception d'appels et prise de RDV",
    lastMessage: "Démo Marine — appels traités, 0 raté",
    duration: "démo", time: "il y a 3 jours", status: "terminée",
    privacy: "shared",
    messages: [
      { role: "agent", content: "Bonjour, cabinet partenaire, je suis Marine, comment puis-je vous aider ?", time: "08:00" },
      { role: "system", content: "📊 Démo Marine · 0 appel raté · plusieurs RDV créés", time: "18:00" },
    ],
  },
  {
    id: "conv-004", title: "Rapport financier mensuel",
    agent: "Nova", agentSlug: "nova", agentColor: "#6366F1",
    agents: [{ slug: "nova", name: "Nova", color: "#6366F1" }],
    contact: "Yoann", channel: "chat",
    summary: "Analyse des métriques financières de mars",
    lastMessage: "MRR en hausse de 12% ce mois",
    duration: "5 messages", time: "il y a 5 jours", status: "terminée",
    privacy: "private",
    messages: [
      { role: "contact", content: "Nova, génère le rapport financier de mars.", time: "09:00" },
      { role: "agent", content: "MRR : 4 820€ (+12%), 3 nouvelles souscriptions, 0 churns. Rapport envoyé par email.", time: "09:03" },
    ],
  },
  {
    id: "conv-005", title: "Tri email prioritaire",
    agent: "Mae", agentSlug: "mae", agentColor: "#F59E0B",
    agents: [{ slug: "mae", name: "Mae", color: "#F59E0B" }],
    contact: "Boîte mail", channel: "email",
    summary: "Tri et priorisation des emails entrants",
    lastMessage: "47 emails traités, 3 urgents identifiés",
    duration: "47 emails", time: "il y a 1 semaine", status: "terminée",
    privacy: "private",
    messages: [
      { role: "system", content: "📧 47 emails analysés · 3 urgents · 12 en attente de réponse · 32 archivés", time: "08:00" },
    ],
  },
  {
    id: "conv-006", title: "Campagne article SEO",
    agent: "Lou", agentSlug: "lou", agentColor: "#F472B6",
    agents: [{ slug: "lou", name: "Lou", color: "#F472B6" }],
    contact: "Yoann", channel: "chat",
    summary: "Rédaction et publication article SEO sur les agents IA",
    lastMessage: "Article 'Agents IA PME' publié, 1200 mots",
    duration: "6 messages", time: "il y a 2 semaines", status: "terminée",
    privacy: "shared",
    messages: [
      { role: "contact", content: "Lou, rédige un article SEO sur les agents IA pour les PME.", time: "10:00" },
      { role: "agent", content: "Article 'Agents IA PME' rédigé (1200 mots) et publié sur WordPress.", time: "10:25" },
      { role: "system", content: "✓ Publié sur WordPress · Score SEO 87/100", time: "10:25" },
    ],
  },
  {
    id: "conv-007", title: "Demande rapport hebdomadaire",
    agent: "Marine", agentSlug: "marine", agentColor: "#22D3EE",
    agents: [{ slug: "marine", name: "Marine", color: "#22D3EE" }],
    contact: "Mme Rousseau", channel: "voice",
    summary: "Prise de RDV kinésithérapie jeudi 9h30",
    lastMessage: "RDV confirmé jeudi 24 avril 9h30",
    duration: "2 min 14s", time: "il y a 12 min", status: "terminée",
    privacy: "private",
    messages: [
      // Mention Cabinet Ménigoz retirée — pas d'accord de citation
      { role: "agent", content: "Bonjour, cabinet partenaire, je suis Marine, comment puis-je vous aider ?", time: "09:14" },
      { role: "contact", content: "Bonjour, je voudrais prendre un rendez-vous en kinésithérapie s'il vous plaît.", time: "09:14" },
      { role: "agent", content: "Bien sûr ! Avez-vous déjà consulté chez nous auparavant ?", time: "09:14" },
      { role: "contact", content: "Oui, je suis patiente depuis 2022.", time: "09:15" },
      { role: "agent", content: "Parfait, Madame Rousseau. J'ai deux créneaux disponibles : jeudi 24 avril à 9h30 ou vendredi 25 avril à 14h00. Lequel vous convient le mieux ?", time: "09:15" },
      { role: "contact", content: "Jeudi 9h30, ce serait parfait.", time: "09:15" },
      { role: "agent", content: "C'est confirmé ! Rendez-vous jeudi 24 avril à 9h30 avec votre praticien. Un SMS de confirmation vous est envoyé. Bonne journée !", time: "09:16" },
      { role: "system", content: "📅 Événement créé dans Google Calendar · 📱 SMS de confirmation envoyé au +33 6 12 34 56 78", time: "09:16" },
    ],
  },
]

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("Toutes")
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyTab>("Toutes")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [chatStreaming, setChatStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatAbortRef = useRef<AbortController | null>(null)

  async function sendChatMessage() {
    if (!selected || !chatInput.trim() || chatStreaming) return
    const userText = chatInput.trim()
    setChatInput("")
    const userMsg: ConvMessage = { role: "contact", content: userText, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }
    const assistantId = crypto.randomUUID()
    const assistantMsg: ConvMessage = { role: "agent", content: "", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }
    setSelected(prev => prev ? { ...prev, messages: [...prev.messages, userMsg, assistantMsg] } : null)
    setChatStreaming(true)
    chatAbortRef.current = new AbortController()
    try {
      const history = selected.messages.map(m => ({
        role: m.role === "contact" ? "user" : "assistant" as const,
        content: m.content,
      })).filter(m => m.content)
      history.push({ role: "user", content: userText })
      const res = await fetch(`/api/agents/${selected.agentSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: chatAbortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string }
            if (parsed.error) { accumulated = parsed.error; break }
            if (parsed.content) {
              accumulated += parsed.content
              setSelected(prev => {
                if (!prev) return null
                const msgs = [...prev.messages]
                const last = msgs[msgs.length - 1]
                if (last?.role === "agent") msgs[msgs.length - 1] = { ...last, content: accumulated }
                return { ...prev, messages: msgs }
              })
            }
          } catch { /* ignore parse errors */ }
        }
      }
      // Persister les deux messages
      if (selected.id) {
        void fetch(`/api/conversations/${selected.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "user", content: userText }) })
        if (accumulated) void fetch(`/api/conversations/${selected.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "assistant", content: accumulated }) })
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setSelected(prev => {
          if (!prev) return null
          const msgs = [...prev.messages]
          if (msgs[msgs.length - 1]?.role === "agent") msgs[msgs.length - 1] = { ...msgs[msgs.length - 1]!, content: "Erreur de connexion. Réessaie." }
          return { ...prev, messages: msgs }
        })
      }
    } finally {
      setChatStreaming(false)
      void assistantId
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm("Supprimer cette conversation ?")) return
    setDeletingId(id)
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (selected?.id === id) setSelected(null)
    } finally {
      setDeletingId(null)
    }
  }

  async function resetConversation(id: string) {
    if (!confirm("Réinitialiser cette conversation ? Les messages seront supprimés.")) return
    setDeletingId(id)
    try {
      await fetch(`/api/conversations/${id}`, { method: "PATCH" })
      setConversations(prev => prev.map(c => c.id === id ? { ...c, lastMessage: "Pas encore de message", messages: [] } : c))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, messages: [] } : null)
    } finally {
      setDeletingId(null)
    }
  }

  function loadConversations() {
    setLoading(true)
    setFetchError(null)
    fetch("/api/conversations")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: { conversations: Conversation[] }) => {
        if (d.conversations?.length) setConversations(d.conversations)
        else setConversations([])
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Erreur inconnue"
        setFetchError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadConversations()
  }, []) // loadConversations est stable — pas de dépendances changeantes

  // Charge les messages quand l'ID de conversation change
  // Dépend de selected?.id uniquement — évite les boucles sur setSelected
  useEffect(() => {
    const selectedId = selected?.id
    if (!selectedId) return

    if ((selected?.messages.length ?? 0) > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      return
    }

    fetch(`/api/conversations/${selectedId}/messages`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ messages: Array<{ role: string; content: unknown; createdAt?: string; created_at?: string }> }>
      })
      .then(({ messages }) => {
        const mapped: ConvMessage[] = (messages ?? [])
          .filter(m => m.role === "user" || m.role === "assistant")
          .map(m => ({
            role: m.role === "user" ? "contact" : "agent" as ConvMessage["role"],
            content: typeof m.content === "string"
              ? m.content
              : (m.content as { text?: string })?.text ?? JSON.stringify(m.content),
            time: new Date((m.createdAt ?? m.created_at) as string).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          }))
        setSelected(prev => prev?.id === selectedId ? { ...prev, messages: mapped } : prev)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      })
      .catch(() => {
        // Fetch silencieux — ne casse pas l'UI
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  // counts kept for future use
  const _counts = {
    voice: conversations.filter(c => c.channel === "voice").length,
    email: conversations.filter(c => c.channel === "email").length,
    chat: conversations.filter(c => c.channel === "chat").length,
  }

  const filtered = conversations
    .filter(c => activeFilter === "Toutes" || c.channel === CHANNEL_FILTER_MAP[activeFilter])
    .filter(c => privacyFilter === "Toutes" || (privacyFilter === "Privées" ? c.privacy === "private" : c.privacy === "shared"))
    .filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.summary.toLowerCase().includes(search.toLowerCase()) ||
      c.agents.some(a => a.name.toLowerCase().includes(search.toLowerCase()))
    )

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 56px)",
      gap: 0,
      overflow: "hidden",
    }}>
      {/* ── LEFT PANEL: conversation list ──────────────── */}
      <GlassPanel
        as="aside"
        level={1}
        radius={0}
        className={selected ? "hidden md:flex" : "flex"}
        style={{
          width: "min(380px, 100%)",
          flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid var(--glass-border)",
          overflow: "hidden",
          height: "100%",
        }}
        contentStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 16px 12px", flexShrink: 0 }}>
          {/* Title row + new button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#F5EFE6", margin: 0 }}>
                Conversations
              </h1>
              <p style={{ fontSize: 12, color: "#71717A", margin: "3px 0 0" }}>
                {filtered.length} conversation{filtered.length > 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/dashboard/agents"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                height: 32, padding: "0 12px", borderRadius: 10,
                background: "var(--accent)", color: "white",
                fontSize: 12, fontWeight: 600, textDecoration: "none",
                flexShrink: 0,
                boxShadow: "0 8px 24px -8px var(--accent-glow)",
                transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
              }}
            >
              <Plus size={13} aria-hidden />
              Nouvelle
            </Link>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search
              size={13}
              color="rgba(250,250,250,0.42)"
              aria-hidden
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="ly-input"
              style={{
                paddingLeft: 32,
                fontSize: 12,
                height: 34,
                borderRadius: 9999,
              }}
            />
          </div>

          {/* Channel filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {(["Toutes", "Voix", "Email", "Chat"] as FilterTab[]).map((tab) => {
              const active = activeFilter === tab
              return (
                <GlassChip
                  key={tab}
                  active={active}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    height: 28,
                    fontSize: 11,
                    fontWeight: active ? 600 : 500,
                    padding: "0 10px",
                  }}
                >
                  {tab}
                </GlassChip>
              )
            })}
          </div>

          {/* Privacy filter tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["Toutes", "Privées", "Partagées"] as PrivacyTab[]).map((tab) => {
              const active = privacyFilter === tab
              return (
                <GlassChip
                  key={tab}
                  active={active}
                  onClick={() => setPrivacyFilter(tab)}
                  icon={
                    tab === "Privées" ? <Lock size={9} aria-hidden /> :
                    tab === "Partagées" ? <Users size={9} aria-hidden /> :
                    undefined
                  }
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    height: 28,
                    fontSize: 11,
                    fontWeight: active ? 600 : 500,
                    padding: "0 10px",
                  }}
                >
                  {tab}
                </GlassChip>
              )
            })}
          </div>
        </div>

        {/* Bannière d'erreur */}
        {fetchError && (
          <div style={{
            margin: "0 12px 8px",
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.22)",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#F87171",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexShrink: 0,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>
            <span>Impossible de charger les conversations.</span>
            <button
              type="button"
              onClick={loadConversations}
              style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0, flexShrink: 0 }}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent", padding: "4px 10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {loading ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#52525B", fontSize: 13 }}>
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#52525B", fontSize: 13 }}>
              Aucun résultat
            </div>
          ) : filtered.map((conv) => {
            const ch = channelConfig[conv.channel]
            const ChannelIcon = ch.icon
            const isSelected = selected?.id === conv.id
            return (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setSelected(conv) }}
                className="lg-surface-3"
                style={{
                  display: "flex", gap: 10, position: "relative",
                  padding: "12px 14px 12px 16px",
                  minHeight: 80,
                  cursor: "pointer",
                  borderRadius: 14,
                  borderLeft: `3px solid ${conv.agentColor}`,
                  background: isSelected ? `rgba(232,111,77,0.10)` : undefined,
                  transition: "transform 220ms var(--ease-apple), background 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                  outline: "none",
                  transform: "translateY(0)",
                  boxShadow: isSelected ? "0 12px 32px -16px rgba(232,111,77,0.45)" : undefined,
                }}
                onMouseEnter={(e) => {
                  setHoveredId(conv.id)
                  if (!isSelected) {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = "translateY(-1px)"
                    el.style.boxShadow = `0 12px 28px -18px rgba(${parseInt(conv.agentColor.slice(1,3),16)},${parseInt(conv.agentColor.slice(3,5),16)},${parseInt(conv.agentColor.slice(5,7),16)},0.45)`
                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredId(null)
                  if (!isSelected) {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = "translateY(0)"
                    el.style.boxShadow = ""
                  }
                }}
              >
                {/* Multi-agent avatars */}
                <div style={{ position: "relative", width: conv.agents.length > 1 ? 48 : 36, height: 36, flexShrink: 0 }}>
                  {conv.agents.slice(0, 2).map((ag, idx) => (
                    <div key={ag.slug} style={{
                      position: conv.agents.length > 1 ? "absolute" : "relative",
                      top: idx === 1 ? 12 : 0,
                      left: idx === 1 ? 14 : 0,
                      zIndex: 2 - idx,
                    }}>
                      <AgentAvatar slug={ag.slug} size={24} style={{ display: "block" }} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F5EFE6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.title}
                    </span>
                    <span style={{ fontSize: 10, color: "#52525B", flexShrink: 0, fontFamily: "ui-monospace,monospace" }}>{conv.time}</span>
                  </div>
                  {/* Agents + channel + privacy */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: conv.agentColor, fontWeight: 500 }}>
                      {conv.agents.map(a => a.name).join(" + ")}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "0px 5px", borderRadius: 4,
                      background: ch.bg, color: ch.color, fontSize: 10,
                    }}>
                      <ChannelIcon size={9} aria-hidden />{ch.label}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "0px 5px", borderRadius: 4,
                      background: conv.privacy === "private" ? "rgba(99,102,241,0.08)" : "rgba(16,185,129,0.08)",
                      color: conv.privacy === "private" ? "#818CF8" : "#34D399",
                      fontSize: 10,
                    }}>
                      {conv.privacy === "private"
                        ? <><Lock size={8} aria-hidden />Privée</>
                        : <><Users size={8} aria-hidden />Partagée</>
                      }
                    </span>
                  </div>
                  {/* Last message preview */}
                  <p style={{ fontSize: 12, color: "#A1A1AA", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.lastMessage}
                  </p>
                </div>
                {/* Actions on hover */}
                {hoveredId === conv.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}
                  >
                    <button
                      type="button"
                      title="Réinitialiser"
                      disabled={deletingId === conv.id}
                      onClick={() => void resetConversation(conv.id)}
                      className="lg-focus"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.06)", color: "#A1A1AA", cursor: "pointer", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      type="button"
                      title="Supprimer"
                      disabled={deletingId === conv.id}
                      onClick={() => void deleteConversation(conv.id)}
                      className="lg-focus"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(239,68,68,0.28)", background: "rgba(239,68,68,0.10)", color: "#EF4444", cursor: "pointer", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassPanel>

      {/* ── RIGHT PANEL: conversation detail ──────────── */}
      <GlassPanel
        level={1}
        strong
        radius={0}
        className={selected ? "flex" : "hidden md:flex"}
        style={{ flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0, height: "100%" }}
        contentStyle={{ padding: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        {selected ? (
          <>
            {/* Detail header */}
            <div style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--glass-border)",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Back button — mobile only */}
                <button
                  className="md:hidden lg-focus"
                  type="button"
                  onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", color: "#E86F4D", cursor: "pointer", fontSize: 22, lineHeight: 1, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, flexShrink: 0 }}
                  aria-label="Retour à la liste"
                >
                  ‹
                </button>
                {/* Multi-agent avatars in detail */}
                <div style={{ display: "flex", gap: -4 }}>
                  {selected.agents.slice(0, 3).map((ag, idx) => (
                    <div key={ag.slug} style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 3 - idx }}>
                      <AgentAvatar slug={ag.slug} size={36} glow={idx === 0} style={{ display: "block" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#F5EFE6", letterSpacing: "-0.02em" }}>
                      {selected.title}
                    </span>
                    {(() => {
                      const ch = channelConfig[selected.channel]
                      const Icon = ch.icon
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 5,
                          background: ch.bg, color: ch.color,
                          border: `1px solid ${ch.border}`, fontSize: 11,
                        }}>
                          <Icon size={10} aria-hidden />{ch.label}
                        </span>
                      )
                    })()}
                    <span style={{ fontSize: 12, color: "#52B788", background: "rgba(82,183,136,0.1)", border: "1px solid rgba(82,183,136,0.2)", borderRadius: 5, padding: "1px 7px" }}>
                      ✓ {selected.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#71717A", margin: "3px 0 0" }}>
                    via {selected.agents.map(a => a.name).join(" + ")} · {selected.duration} · {selected.time}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link
                  href={`/dashboard/agents/${selected.agentSlug}`}
                  className="lg-focus"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    height: 32, padding: "0 12px", borderRadius: 10,
                    background: "rgba(232,111,77,0.12)", border: "1px solid rgba(232,111,77,0.30)",
                    color: "var(--accent)", fontSize: 12, fontWeight: 600, textDecoration: "none",
                    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                    transition: "background 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
                  }}
                >
                  Voir l&apos;agent
                </Link>
                <button
                  type="button"
                  title="Réinitialiser la conversation"
                  onClick={() => void resetConversation(selected.id)}
                  className="lg-chip lg-focus"
                  style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 10px", color: "rgba(250,250,250,0.78)", fontSize: 12, cursor: "pointer" }}
                >
                  <RotateCcw size={12} /> Réinitialiser
                </button>
                <button
                  type="button"
                  title="Supprimer la conversation"
                  onClick={() => void deleteConversation(selected.id)}
                  className="lg-focus"
                  style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 10px", borderRadius: 9999, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 12, cursor: "pointer", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              <button
                type="button"
                onClick={() => {
                  const text = selected.messages.map(m =>
                    `[${m.time}] ${m.role === "agent" ? selected.agent : m.role === "contact" ? selected.contact : "Système"}: ${m.content}`
                  ).join("\n")
                  const blob = new Blob([text], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url; a.download = `${selected.id}.txt`; a.click()
                  URL.revokeObjectURL(url)
                }}
                className="lg-chip lg-focus"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 32, padding: "0 12px",
                  color: "rgba(250,250,250,0.7)", fontSize: 12, cursor: "pointer",
                }}
              >
                <Download size={13} aria-hidden /> Exporter
              </button>
              </div>
            </div>

            {/* Summary bar */}
            <div style={{
              padding: "10px 24px",
              background: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid var(--glass-border)",
              flexShrink: 0,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24,
            }}>
              <p style={{ fontSize: 12, color: "#A1A1AA", margin: 0, flex: 1, minWidth: 0 }}>
                <span style={{ color: "#52525B" }}>Résumé : </span>{selected.summary}
              </p>
              {/* Mini last-message preview */}
              {selected.messages.length > 0 && (() => {
                const last = selected.messages[selected.messages.length - 1]!
                return (
                  <div className="lg-surface-3" style={{
                    flexShrink: 0, maxWidth: 240,
                    borderRadius: 10, padding: "6px 10px",
                  }}>
                    <p style={{ fontSize: 10, color: "#52525B", margin: "0 0 2px", fontFamily: "ui-monospace,monospace" }}>
                      {last.role === "agent" ? selected.agent : last.role === "contact" ? selected.contact : "Système"} · {last.time}
                    </p>
                    <p style={{
                      fontSize: 11, color: "#A1A1AA", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {last.content}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              {selected.messages.map((msg, i) => {
                if (msg.role === "system") {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                      <span className="ly-badge" style={{
                        fontSize: 11, color: "#A1A1AA", textAlign: "center", maxWidth: "85%",
                        fontWeight: 500, letterSpacing: 0,
                      }}>{msg.content}</span>
                    </div>
                  )
                }
                const isAgent = msg.role === "agent"
                return (
                  <div key={i} style={{
                    display: "flex", gap: 10,
                    flexDirection: isAgent ? "row" : "row-reverse",
                    marginBottom: 14, alignItems: "flex-end",
                  }}>
                    {isAgent && <AgentAvatar slug={selected.agentSlug} size={28} style={{ flexShrink: 0, marginBottom: 2 }} />}
                    <div style={{ maxWidth: "68%" }}>
                      <div style={{
                        background: isAgent ? "rgba(255,255,255,0.07)" : "#E86F4D",
                        border: isAgent ? "1px solid rgba(255,255,255,0.1)" : "none",
                        borderRadius: isAgent ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                        padding: "10px 14px",
                        fontSize: 13, color: "#F5EFE6",
                        lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        backdropFilter: isAgent ? "blur(8px)" : "none",
                      }}>
                        {msg.content}
                      </div>
                      <p style={{
                        fontSize: 10, color: "#52525B", marginTop: 4,
                        textAlign: isAgent ? "left" : "right",
                        paddingLeft: isAgent ? 4 : 0, paddingRight: isAgent ? 0 : 4,
                        fontFamily: "ui-monospace,monospace",
                      }}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--glass-border)",
              flexShrink: 0,
              display: "flex", gap: 10, alignItems: "flex-end",
            }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChatMessage() }
                  }}
                  placeholder={`Continuer avec ${selected.agent}…`}
                  rows={1}
                  disabled={chatStreaming}
                  className="ly-input"
                  style={{
                    resize: "none",
                    fontSize: 13, lineHeight: 1.5,
                    fontFamily: "inherit", boxSizing: "border-box",
                    maxHeight: 120, overflowY: "auto",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void sendChatMessage()}
                disabled={!chatInput.trim() || chatStreaming}
                className="lg-focus"
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: chatInput.trim() && !chatStreaming ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  border: "1px solid",
                  borderColor: chatInput.trim() && !chatStreaming ? "transparent" : "var(--glass-border)",
                  cursor: chatInput.trim() && !chatStreaming ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
                  boxShadow: chatInput.trim() && !chatStreaming ? "0 8px 24px -8px var(--accent-glow)" : "none",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
                aria-label="Envoyer"
              >
                {chatStreaming
                  ? <Loader2 size={16} color="#E86F4D" style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={16} color={chatInput.trim() ? "#fff" : "#52525B"} />
                }
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 14,
            color: "#52525B",
          }}>
            <div className="lg-surface-3" style={{
              width: 56, height: 56, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageCircle size={24} color="#3F3F46" aria-hidden />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#71717A", margin: 0 }}>
                Sélectionne une conversation
              </p>
              <p style={{ fontSize: 12, color: "#3F3F46", margin: "4px 0 0" }}>
                {"Clique sur une conversation à gauche pour l'ouvrir"}
              </p>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
