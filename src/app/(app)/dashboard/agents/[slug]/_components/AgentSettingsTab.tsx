"use client"

import { useState, useEffect, useRef } from "react"
import { Save, Check, Play, Pause, Copy, Phone } from "lucide-react"
import type { Agent } from "@/lib/agents/data"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentSettings {
  // Generic
  displayName: string
  customInstructions: string
  tone: "Professionnel" | "Décontracté" | "Formel" | "Chaleureux"
  language: "Français" | "English" | "Español"
  autonomy: boolean
  notifications: boolean
  isActive: boolean
  // Agent-specific (free-form)
  specific: Record<string, string>
}

type SaveState = "idle" | "loading" | "success" | "error"

interface SpecificField {
  key: string
  label: string
  placeholder: string
  helper: string
  type?: "text" | "textarea" | "number"
}

// ─── Agent-specific fields ────────────────────────────────────────────────────

const AGENT_SPECIFIC_FIELDS: Record<string, SpecificField[]> = {
  marine: [
    // Placeholders Cabinet Ménigoz / Dr. Ménigoz retirés — pas d'accord de citation
    { key: "orgName", label: "Nom de l'organisation", placeholder: "Nom de votre cabinet", helper: "Nom utilisé par Marine pour se présenter" },
    { key: "practitionerName", label: "Nom du praticien", placeholder: "Dr. Dupont", helper: "Marine mentionnera ce nom lors des urgences" },
    { key: "services", label: "Services proposés", placeholder: "Kinésithérapie, Thérapie manuelle...", helper: "Séparés par des virgules" },
    { key: "escalationPhone", label: "Téléphone d'urgence", placeholder: "+33612345678", helper: "Numéro où transférer les urgences" },
    { key: "openingHours", label: "Horaires d'ouverture", placeholder: "Lundi-Vendredi 8h-19h, Samedi 9h-12h", helper: "Marine les annoncera aux patients" },
    { key: "appointmentDuration", label: "Durée RDV (minutes)", placeholder: "30", helper: "Durée par défaut d'un rendez-vous", type: "number" },
  ],
  charles: [
    { key: "ownerName", label: "Ton prénom", placeholder: "Yoann", helper: "Charles t'appellera par ton prénom" },
    { key: "whatsappNumber", label: "Numéro WhatsApp", placeholder: "+33612345678", helper: "Numéro où Charles te contacte" },
    { key: "timezone", label: "Fuseau horaire", placeholder: "Europe/Paris", helper: "Pour les rappels et briefs" },
    { key: "priorities", label: "Priorités actuelles", placeholder: "Lancer la campagne LinkedIn, Préparer la démo client...", helper: "Charles en tiendra compte dans ses briefings", type: "textarea" },
  ],
  lou: [
    { key: "brandVoice", label: "Voix de marque", placeholder: "Experte, accessible, moderne", helper: "Ton de voix pour le contenu produit" },
    { key: "targetAudience", label: "Audience cible", placeholder: "PME françaises, dirigeants 30-50 ans", helper: "Audience principale de tes contenus" },
    { key: "websiteUrl", label: "URL du site WordPress", placeholder: "https://mon-site.com", helper: "Pour la publication automatique" },
    { key: "linkedinProfile", label: "Profil LinkedIn", placeholder: "https://linkedin.com/in/...", helper: "Pour cibler les posts LinkedIn" },
    { key: "seoKeywords", label: "Mots-clés SEO prioritaires", placeholder: "agent IA, automatisation PME...", helper: "Séparés par des virgules", type: "textarea" },
  ],
  elio: [
    { key: "companyName", label: "Nom de ton entreprise", placeholder: "Lynaris", helper: "Utilisé dans les messages de prospection" },
    { key: "companyDescription", label: "Description (1 phrase)", placeholder: "On aide les PME à automatiser leurs ops avec des agents IA", helper: "Le pitch qu'Elio utilisera" },
    { key: "targetIndustry", label: "Secteur cible", placeholder: "Cabinets médicaux, Agences web...", helper: "Industries à prospecter en priorité" },
    { key: "valueProposition", label: "Valeur ajoutée", placeholder: "Gain de 10h/semaine, ROI en 3 mois", helper: "Argument principal d'Elio", type: "textarea" },
  ],
  mae: [
    { key: "emailSignature", label: "Signature email", placeholder: "Cordialement,\nYoann Cabon\nLynaris", helper: "Utilisée par Mae dans ses brouillons", type: "textarea" },
    { key: "prioritySenders", label: "Expéditeurs prioritaires", placeholder: "client@important.com, vip@autre.com", helper: "Emails de ces personnes = urgents" },
    { key: "autoArchive", label: "Auto-archiver après", placeholder: "newsletters, promotions", helper: "Catégories à archiver automatiquement" },
  ],
  max: [
    { key: "defaultStyle", label: "Style visuel par défaut", placeholder: "Minimaliste, dark, professionnel", helper: "Style appliqué si rien n'est précisé" },
    { key: "brandColors", label: "Couleurs de marque", placeholder: "#E86F4D, #0C0C0E, #F5F5F7", helper: "Codes hex séparés par des virgules" },
    { key: "logoDescription", label: "Description du logo", placeholder: "Logo Lynaris — lettre L stylisée orange sur fond sombre", helper: "Max l'intégrera dans les visuels" },
  ],
  nova: [
    { key: "currency", label: "Devise", placeholder: "EUR", helper: "Devise principale de tes finances" },
    { key: "mrr_goal", label: "Objectif MRR", placeholder: "10000", helper: "En euros — Nova trackera l'écart", type: "number" },
    { key: "alertThreshold", label: "Seuil d'alerte MRR (% chute)", placeholder: "10", helper: "Nova alerte si le MRR baisse de ce % en une semaine", type: "number" },
    { key: "reportDay", label: "Jour du rapport hebdo", placeholder: "Lundi", helper: "Jour où Nova génère le rapport" },
  ],
  alba: [
    { key: "companyName", label: "Nom de l'entreprise", placeholder: "Lynaris", helper: "Utilisé dans les contrats et messages" },
    { key: "defaultContractType", label: "Type de contrat par défaut", placeholder: "CDI", helper: "CDI, CDD, Stage, Alternance, Freelance" },
    { key: "jobCriteria", label: "Critères de recrutement", placeholder: "3+ ans XP, TypeScript, remote-friendly...", helper: "Alba scorera les CVs sur ces critères", type: "textarea" },
    { key: "hrContact", label: "Email RH", placeholder: "rh@entreprise.com", helper: "Pour les notifications d'entretien" },
  ],
  aria: [
    { key: "orgName", label: "Nom de l'organisation", placeholder: "Ma Startup", helper: "Aria mentionnera ce nom dans ses interactions" },
    { key: "industry", label: "Secteur d'activité", placeholder: "E-commerce, Conseil, Santé...", helper: "Pour personnaliser les conseils sectoriels" },
    { key: "teamSize", label: "Taille de l'équipe", placeholder: "5 personnes", helper: "Aria adapte ses recommandations RH" },
    { key: "legalEntity", label: "Forme juridique", placeholder: "SAS, SARL, Auto-entrepreneur...", helper: "Pour la rédaction de documents légaux" },
    { key: "accountingEmail", label: "Email comptable", placeholder: "compta@mon-entreprise.fr", helper: "Pour l'envoi automatique des factures" },
    { key: "invoicePrefix", label: "Préfixe factures", placeholder: "FAC-2026-", helper: "Préfixe utilisé pour la numérotation des factures" },
  ],
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const TONE_OPTIONS: AgentSettings["tone"][] = ["Professionnel", "Décontracté", "Formel", "Chaleureux"]
const LANG_OPTIONS: AgentSettings["language"][] = ["Français", "English", "Español"]


function buildDefaults(agentName: string): AgentSettings {
  return {
    displayName: agentName,
    customInstructions: "",
    tone: "Professionnel",
    language: "Français",
    autonomy: false,
    notifications: false,
    isActive: true,
    specific: {},
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.35)",
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 150ms",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 30,
}

const sectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.25)",
  margin: 0,
  paddingBottom: 4,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
}

const helperStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: "rgba(255,255,255,0.25)",
  lineHeight: 1.4,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
}

function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        gap: 12,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
          {label}
        </p>
        {description && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          position: "relative",
          width: 36,
          height: 20,
          borderRadius: 999,
          border: "none",
          background: checked ? "#7C3AED" : "rgba(255,255,255,0.1)",
          cursor: "pointer",
          transition: "background 200ms",
          padding: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            transition: "left 200ms",
            display: "block",
          }}
        />
      </button>
    </label>
  )
}

function SkeletonLoader() {
  const skeletonRow: React.CSSProperties = {
    height: 36,
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    opacity: 0.5,
    animation: "pulse 1.5s ease-in-out infinite",
  }
  const skeletonLabel: React.CSSProperties = {
    height: 10,
    width: "30%",
    borderRadius: 4,
    background: "rgba(255,255,255,0.06)",
    opacity: 0.5,
    marginBottom: 8,
    animation: "pulse 1.5s ease-in-out infinite",
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.2; }
        }
      `}</style>
      <div style={{ ...sectionStyle, gap: 20 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div style={{ ...skeletonLabel, animationDelay: `${i * 0.1}s` }} />
            <div style={{ ...skeletonRow, animationDelay: `${i * 0.1 + 0.05}s` }} />
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function focusInput(el: HTMLElement | null) {
  if (!el) return
  el.style.borderColor = "rgba(124,58,237,0.5)"
}

function blurInput(el: HTMLElement | null) {
  if (!el) return
  el.style.borderColor = "rgba(255,255,255,0.08)"
}

// ─── ElevenLabsConnectSection ─────────────────────────────────────────────────

function ElevenLabsConnectSection() {
  const [agentId, setAgentId] = useState("")
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [loaded, setLoaded] = useState(false)
  const [syncState, setSyncState] = useState<"idle" | "loading" | "success" | "error">("idle")

  useEffect(() => {
    fetch("/api/integrations/elevenlabs/agent-id")
      .then(r => r.json() as Promise<{ agent_id: string | null; connected: boolean }>)
      .then(data => {
        setCurrentId(data.agent_id)
        setConnected(data.connected)
        if (data.agent_id) setAgentId(data.agent_id)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  async function handleSave() {
    if (!agentId.trim()) return
    setSaveState("loading")
    try {
      const res = await fetch("/api/integrations/elevenlabs/agent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId.trim() }),
      })
      if (res.ok) {
        setCurrentId(agentId.trim())
        setSaveState("success")
        setTimeout(() => setSaveState("idle"), 2500)
      } else {
        const err = await res.json() as { error?: string }
        setSaveState("error")
        setTimeout(() => setSaveState("idle"), 3000)
        console.error("[ElevenLabs agent-id]", err.error)
      }
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }

  async function handleSync() {
    setSyncState("loading")
    try {
      const res = await fetch("/api/agents/marine/elevenlabs-sync", { method: "POST" })
      const data = await res.json() as { synced?: boolean; error?: string; skipped?: boolean; reason?: string }
      if (data.synced) {
        setSyncState("success")
      } else if (data.skipped) {
        // skipped = clé API manquante ou agent_id non configuré — pas une erreur bloquante
        setSyncState("success")
        console.warn("[ElevenLabs sync] skipped:", data.reason)
      } else {
        setSyncState("error")
        console.error("[ElevenLabs sync]", data.error ?? data.reason)
      }
    } catch {
      setSyncState("error")
    }
    setTimeout(() => setSyncState("idle"), 3000)
  }

  return (
    <div style={{ ...sectionStyle }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {/* ElevenLabs icon — simple waveform SVG */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: "#A855F7", flexShrink: 0 }}>
          <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 6v12M22 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p style={{ ...sectionTitleStyle, margin: 0 }}>ElevenLabs Conversational AI</p>
      </div>

      {!loaded ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Chargement…</p>
      ) : !connected ? (
        <p style={{ fontSize: 12, color: "rgba(232,111,77,0.7)", margin: 0 }}>
          ElevenLabs non connecté — va dans <strong style={{ color: "rgba(255,255,255,0.5)" }}>Intégrations → ElevenLabs</strong> pour entrer ta clé API d&apos;abord.
        </p>
      ) : (
        <>
          <div>
            <label style={labelStyle}>Agent ID ElevenLabs</label>
            <p style={{ ...helperStyle, marginTop: 0, marginBottom: 8 }}>
              L&apos;ID de ton agent Conversational AI ElevenLabs (format <code style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>xxxxxxxxxxxxxxxxxxxxxxxx</code>).
              Trouve-le dans ElevenLabs → Conversational AI → ton agent → Settings.
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                placeholder="Colle ici l'Agent ID ElevenLabs"
                style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12 }}
                onFocus={e => focusInput(e.currentTarget)}
                onBlur={e => blurInput(e.currentTarget)}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === "loading" || !agentId.trim()}
                style={{
                  flexShrink: 0, height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid rgba(168,85,247,0.3)",
                  background: saveState === "success" ? "rgba(34,197,94,0.12)" : "rgba(168,85,247,0.12)",
                  color: saveState === "success" ? "#86efac" : saveState === "error" ? "#f87171" : "#C084FC",
                  fontSize: 12, fontWeight: 600,
                  opacity: (!agentId.trim() || saveState === "loading") ? 0.5 : 1,
                  transition: "all 150ms",
                }}
              >
                {saveState === "loading" ? "…" : saveState === "success" ? "✓ Sauvé" : saveState === "error" ? "Erreur" : "Sauvegarder"}
              </button>
            </div>
            {saveState === "error" && (
              <p style={{ ...helperStyle, color: "rgba(248,113,113,0.8)", marginTop: 6 }}>
                Erreur — assure-toi que l&apos;intégration ElevenLabs est bien connectée.
              </p>
            )}
          </div>

          {currentId && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22C55E",
                  boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                }} />
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Agent configuré : <code style={{ fontSize: 10, color: "rgba(168,85,247,0.8)" }}>{currentId.slice(0, 14)}…</code>
                </p>
              </div>

              {/* Sync prompt button */}
              <button
                type="button"
                onClick={handleSync}
                disabled={syncState === "loading"}
                style={{
                  marginTop: 10,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid rgba(168,85,247,0.2)",
                  background: syncState === "success" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.06)",
                  color: syncState === "success" ? "#86efac" : syncState === "error" ? "#f87171" : "rgba(192,132,252,0.8)",
                  fontSize: 11, fontWeight: 500,
                  opacity: syncState === "loading" ? 0.6 : 1,
                  transition: "all 150ms",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                {syncState === "loading" ? "Synchronisation…" : syncState === "success" ? "Prompt synchronisé !" : syncState === "error" ? "Erreur sync" : "Synchroniser le prompt maintenant"}
              </button>
              <p style={{ ...helperStyle, marginTop: 4 }}>
                Pousse le prompt de Marine vers ElevenLabs. Se fait aussi automatiquement à chaque sauvegarde.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── TelephonieSectionMarine ──────────────────────────────────────────────────

const SECTORS = [
  { value: "médical", label: "Médical / Santé", description: "Kiné, médecin, dentiste, ostéo…" },
  { value: "restaurant", label: "Restaurant / Bar", description: "Réservations, commandes, horaires" },
  { value: "artisan", label: "Artisan / BTP", description: "Devis, urgences, suivi chantier" },
  { value: "immobilier", label: "Immobilier", description: "Visites, estimations, rappels" },
  { value: "commerce", label: "Commerce / Retail", description: "Info produit, stock, SAV" },
  { value: "générique", label: "Autre / Générique", description: "Standard téléphonique multi-usage" },
]

function TelephonieSectionMarine({
  orgId,
  sector,
  onSectorChange,
}: {
  orgId: string | null
  sector: string
  onSectorChange: (v: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.lynaris.pro"
  const webhookUrl = orgId
    ? `${appUrl}/api/voice/incoming?org=${orgId}`
    : `${appUrl}/api/voice/incoming?org=VOTRE_ORG_ID`

  function handleCopy() {
    void navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ ...sectionStyle }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Phone size={13} style={{ color: "#22D3EE", flexShrink: 0 }} />
        <p style={{ ...sectionTitleStyle, margin: 0 }}>Téléphonie</p>
      </div>

      {/* Secteur */}
      <div>
        <label style={labelStyle}>Type d&apos;activité</label>
        <p style={{ ...helperStyle, marginTop: 0, marginBottom: 8 }}>
          Définit le comportement de Marine selon ton secteur.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SECTORS.map(s => {
            const isSelected = (sector || "médical") === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onSectorChange(s.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${isSelected ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.07)"}`,
                  background: isSelected ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.025)",
                  transition: "border-color 150ms, background 150ms",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)" }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)" }}
              >
                <div style={{
                  width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isSelected ? "#22D3EE" : "rgba(255,255,255,0.2)"}`,
                  background: isSelected ? "#22D3EE" : "transparent",
                  transition: "all 150ms",
                }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#22D3EE" : "rgba(255,255,255,0.75)" }}>
                    {s.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {s.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Webhook URL Twilio */}
      <div>
        <label style={labelStyle}>URL Twilio (Appel entrant)</label>
        <p style={{ ...helperStyle, marginTop: 0, marginBottom: 8 }}>
          Colle cette URL dans <strong style={{ color: "rgba(255,255,255,0.55)" }}>Twilio → Numéros de téléphone → Webhook &quot;Appel entrant&quot;</strong>
        </p>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.25)",
            fontSize: 11, color: "rgba(255,255,255,0.5)",
            fontFamily: "var(--font-geist-mono, monospace)",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
          }}>
            {webhookUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copier l'URL"
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              color: copied ? "#22C55E" : "rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        {!orgId && (
          <p style={{ ...helperStyle, color: "rgba(232,111,77,0.7)", marginTop: 6 }}>
            Connecte-toi pour voir ton URL personnalisée.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── VoicePicker ─────────────────────────────────────────────────────────────

interface VoiceItem {
  voice_id: string
  name: string
  preview_url: string | null
  gender: string
  accent: string
  description: string
}

function VoicePickerSection({
  selectedVoiceId,
  onSelect,
}: {
  selectedVoiceId: string
  onSelect: (voiceId: string) => void
}) {
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch("/api/voices/elevenlabs")
      .then(r => r.json() as Promise<{ voices: VoiceItem[]; error?: string }>)
      .then(data => {
        if (data.error) setError(data.error)
        setVoices(data.voices ?? [])
      })
      .catch(() => setError("Impossible de charger les voix"))
      .finally(() => setLoading(false))
  }, [])

  function handlePreview(voice: VoiceItem) {
    if (!voice.preview_url) return
    if (playingId === voice.voice_id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = voice.preview_url
      void audioRef.current.play().then(() => setPlayingId(voice.voice_id)).catch(() => setPlayingId(null))
    } else {
      const audio = new Audio(voice.preview_url)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      void audio.play().then(() => setPlayingId(voice.voice_id)).catch(() => setPlayingId(null))
    }
  }

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  if (loading) {
    return (
      <div style={{ ...sectionStyle }}>
        <p style={sectionTitleStyle}>Voix ElevenLabs</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Chargement des voix…</p>
      </div>
    )
  }

  if (error || voices.length === 0) {
    return (
      <div style={{ ...sectionStyle }}>
        <p style={sectionTitleStyle}>Voix ElevenLabs</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
          {error ?? "Aucune voix disponible — configure ELEVENLABS_API_KEY"}
        </p>
      </div>
    )
  }

  return (
    <div style={{ ...sectionStyle }}>
      <p style={sectionTitleStyle}>Voix ElevenLabs</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 4px" }}>
        Choisis la voix que Marine utilisera lors des appels téléphoniques.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {voices.map(voice => {
          const isSelected = selectedVoiceId === voice.voice_id
          const isPlaying = playingId === voice.voice_id
          return (
            <div
              key={voice.voice_id}
              onClick={() => onSelect(voice.voice_id)}
              role="option"
              aria-selected={isSelected}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                border: `1px solid ${isSelected ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.07)"}`,
                background: isSelected ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.025)",
                cursor: "pointer",
                transition: "border-color 150ms, background 150ms",
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)"
              }}
              onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"
              }}
            >
              {/* Radio dot */}
              <div style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isSelected ? "#22D3EE" : "rgba(255,255,255,0.2)"}`,
                background: isSelected ? "#22D3EE" : "transparent",
                transition: "border-color 150ms, background 150ms",
              }} />

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#22D3EE" : "rgba(255,255,255,0.8)" }}>
                  {voice.name}
                </p>
                {(voice.accent || voice.gender || voice.description) && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {[voice.gender, voice.accent, voice.description].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              {/* Preview button */}
              {voice.preview_url && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handlePreview(voice) }}
                  aria-label={isPlaying ? "Arrêter la preview" : "Écouter la preview"}
                  style={{
                    flexShrink: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: isPlaying ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)",
                    color: isPlaying ? "#22D3EE" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 150ms, color 150ms",
                  }}
                >
                  {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentSettingsTab({ agent, onNameChange }: { agent: Agent; onNameChange?: (name: string) => void }) {
  const [settings, setSettings] = useState<AgentSettings>(() => buildDefaults(agent.name))
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastIsError, setToastIsError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storageKey = `agent-settings-${agent.slug}`
  const specificFields = AGENT_SPECIFIC_FIELDS[agent.slug] ?? []

  // Load from API on mount, fallback to localStorage
  useEffect(() => {
    fetch(`/api/agents/${agent.slug}/settings`)
      .then((r) => r.json())
      .then((data: { settings: Partial<AgentSettings>; isActive?: boolean; orgId?: string }) => {
        if (data.orgId) setOrgId(data.orgId)
        const { displayName: _ignored, ...rest } = data.settings
        setSettings((prev) => ({
          ...prev,
          ...rest,
          // isActive est retourné séparément par l'API
          isActive: typeof data.isActive === "boolean" ? data.isActive : (prev.isActive),
          // cast explicite des booléens (JSON parse peut retourner autre chose)
          autonomy: typeof rest.autonomy === "boolean" ? rest.autonomy : prev.autonomy,
          notifications: typeof rest.notifications === "boolean" ? rest.notifications : prev.notifications,
          specific: { ...prev.specific, ...(rest.specific as Record<string, string> ?? {}) },
        }))
        setLoaded(true)
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            const { displayName: _ignored, ...cached } = JSON.parse(raw) as Partial<AgentSettings>
            setSettings((prev) => ({ ...prev, ...cached }))
          }
        } catch {
          // ignore malformed
        }
        setLoaded(true)
      })
  }, [agent.slug, storageKey])

  function showToast(msg: string, isError = false) {
    setToastMsg(msg)
    setToastIsError(isError)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000)
  }

  async function handleSave() {
    setSaveState("loading")
    try {
      const res = await fetch(`/api/agents/${agent.slug}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        localStorage.setItem(storageKey, JSON.stringify(settings))
        setSaveState("success")
        showToast("Paramètres sauvegardés")
        if (settings.displayName.trim()) onNameChange?.(settings.displayName.trim())
        // Sync ElevenLabs agent prompt si Marine
        if (agent.slug === "marine") {
          void fetch(`/api/agents/${agent.slug}/elevenlabs-sync`, { method: "POST" }).catch(() => {})
        }
        setTimeout(() => setSaveState("idle"), 2500)
      } else {
        setSaveState("error")
        showToast("Erreur lors de la sauvegarde", true)
        setTimeout(() => setSaveState("idle"), 2500)
      }
    } catch {
      setSaveState("error")
      showToast("Erreur lors de la sauvegarde", true)
      setTimeout(() => setSaveState("idle"), 2500)
    }
  }

  function setSpecific(key: string, value: string) {
    setSettings((s) => ({ ...s, specific: { ...s.specific, [key]: value } }))
  }

  const charCount = settings.customInstructions.length
  const charOver = charCount > 1000

  const textareaBaseStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    outline: "none",
    resize: "none" as const,
    lineHeight: 1.5,
    boxSizing: "border-box" as const,
    transition: "border-color 150ms",
  }

  if (!loaded) {
    return (
      <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
        <div style={{ maxWidth: 480 }}>
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%", position: "relative" }}>
      <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Section 1: Identité */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Identité</p>

          <div>
            <label htmlFor="setting-name" style={labelStyle}>
              Nom affiché
            </label>
            <input
              id="setting-name"
              type="text"
              value={settings.displayName}
              onChange={(e) => setSettings((s) => ({ ...s, displayName: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => focusInput(e.currentTarget)}
              onBlur={(e) => blurInput(e.currentTarget)}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <label htmlFor="setting-instructions" style={{ ...labelStyle, marginBottom: 0 }}>
                Instructions personnalisées
              </label>
              <span style={{ fontSize: 10, color: charOver ? "#ef4444" : "rgba(255,255,255,0.25)" }}>
                {charCount}/1000
              </span>
            </div>
            <textarea
              id="setting-instructions"
              value={settings.customInstructions}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setSettings((s) => ({ ...s, customInstructions: e.target.value }))
                }
              }}
              placeholder={`Instructions spécifiques pour ${agent.name}...`}
              rows={4}
              style={textareaBaseStyle}
              onFocus={(e) => focusInput(e.currentTarget)}
              onBlur={(e) => blurInput(e.currentTarget)}
            />
          </div>
        </div>

        {/* Section 3: Configuration avancée (agent-specific) */}
        {specificFields.length > 0 && (
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Configuration avancée</p>

            {specificFields.map((field) => {
              const value = settings.specific[field.key] ?? ""
              const fieldId = `specific-${field.key}`

              if (field.type === "textarea") {
                return (
                  <div key={field.key}>
                    <label htmlFor={fieldId} style={labelStyle}>
                      {field.label}
                    </label>
                    <textarea
                      id={fieldId}
                      value={value}
                      onChange={(e) => setSpecific(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      style={textareaBaseStyle}
                      onFocus={(e) => focusInput(e.currentTarget)}
                      onBlur={(e) => blurInput(e.currentTarget)}
                    />
                    <p style={helperStyle}>{field.helper}</p>
                  </div>
                )
              }

              if (field.type === "number") {
                return (
                  <div key={field.key}>
                    <label htmlFor={fieldId} style={labelStyle}>
                      {field.label}
                    </label>
                    <input
                      id={fieldId}
                      type="number"
                      value={value}
                      onChange={(e) => setSpecific(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onFocus={(e) => focusInput(e.currentTarget)}
                      onBlur={(e) => blurInput(e.currentTarget)}
                    />
                    <p style={helperStyle}>{field.helper}</p>
                  </div>
                )
              }

              return (
                <div key={field.key}>
                  <label htmlFor={fieldId} style={labelStyle}>
                    {field.label}
                  </label>
                  <input
                    id={fieldId}
                    type="text"
                    value={value}
                    onChange={(e) => setSpecific(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={(e) => focusInput(e.currentTarget)}
                    onBlur={(e) => blurInput(e.currentTarget)}
                  />
                  <p style={helperStyle}>{field.helper}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Section ElevenLabs — Marine uniquement */}
        {agent.slug === "marine" && <ElevenLabsConnectSection />}

        {/* Section Téléphonie — Marine uniquement */}
        {agent.slug === "marine" && (
          <TelephonieSectionMarine
            orgId={orgId}
            sector={settings.specific["sector"] ?? ""}
            onSectorChange={(v) => setSpecific("sector", v)}
          />
        )}

        {/* Section Voice ElevenLabs — Marine uniquement */}
        {agent.slug === "marine" && (
          <VoicePickerSection
            selectedVoiceId={settings.specific["elevenLabsVoiceId"] ?? ""}
            onSelect={(voiceId) => setSpecific("elevenLabsVoiceId", voiceId)}
          />
        )}

        {/* Section 5: Voix & Langue */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Voix et Langue</p>

          <div>
            <label htmlFor="setting-tone" style={labelStyle}>
              Ton de voix
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="setting-tone"
                value={settings.tone}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, tone: e.target.value as AgentSettings["tone"] }))
                }
                style={selectStyle}
                onFocus={(e) => focusInput(e.currentTarget)}
                onBlur={(e) => blurInput(e.currentTarget)}
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t} style={{ background: "#1a1a2e" }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="setting-language" style={labelStyle}>
              Langue
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="setting-language"
                value={settings.language}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    language: e.target.value as AgentSettings["language"],
                  }))
                }
                style={selectStyle}
                onFocus={(e) => focusInput(e.currentTarget)}
                onBlur={(e) => blurInput(e.currentTarget)}
              >
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l} style={{ background: "#1a1a2e" }}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Comportement */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Comportement</p>

          <Switch
            checked={settings.autonomy}
            onChange={(val) => setSettings((s) => ({ ...s, autonomy: val }))}
            label="Autonomie complète"
            description="L'agent agit sans demander validation"
          />

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          <Switch
            checked={settings.notifications}
            onChange={(val) => setSettings((s) => ({ ...s, notifications: val }))}
            label="Notifications email"
            description="Recevoir un email à chaque action"
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "loading"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 36,
            borderRadius: 8,
            border: "none",
            background: "#7C3AED",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: saveState === "loading" ? "not-allowed" : "pointer",
            opacity: saveState === "loading" ? 0.7 : 1,
            transition: "opacity 150ms",
            alignSelf: "flex-start",
            padding: "0 20px",
            minWidth: 160,
          }}
        >
          {saveState === "success" ? (
            <>
              <Check size={14} />
              Sauvegardé
            </>
          ) : saveState === "loading" ? (
            "Sauvegarde..."
          ) : (
            <>
              <Save size={14} />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "10px 16px",
            borderRadius: 10,
            background: toastIsError ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.12)",
            border: toastIsError
              ? "1px solid rgba(239,68,68,0.25)"
              : "1px solid rgba(34,197,94,0.2)",
            color: toastIsError ? "#f87171" : "#86efac",
            fontSize: 13,
            fontWeight: 500,
            zIndex: 50,
            backdropFilter: "blur(8px)",
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}
