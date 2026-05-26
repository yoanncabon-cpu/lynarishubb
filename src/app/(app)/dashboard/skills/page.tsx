"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { GlassCard } from "@/components/app/glass/GlassCard"
import {
  ThumbsUp,
  Presentation,
  Image,
  Mic,
  Palette,
  Video,
  BarChart2,
  FileText,
  BookOpen,
  Phone,
  MessageSquare,
  Clock,
  Send,
  X,
  Copy,
  Check,
} from "lucide-react"

// LinkedIn icon (not in this lucide version)
const LinkedInSvg: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 24,
  color = "currentColor",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

// ─── Agent color map ──────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  lou: "#F472B6",
  max: "#FB923C",
  mae: "#FBBF24",
  marine: "#22D3EE",
  elio: "#34D399",
  charles: "#A78BFA",
  nova: "#818CF8",
  alba: "#C084FC",
}

function getAgentColor(slug: string): string {
  return AGENT_COLORS[slug] ?? "#E86F4D"
}

// ─── Skill data ───────────────────────────────────────────────────────────────

type LucideIcon = React.FC<{ size?: number; color?: string; strokeWidth?: number }>

type SkillFlow = "generate" | "upload" | "campaign" | "setup"

interface SkillItem {
  id: string
  title: string
  tagline: string
  agentSlug: string
  agentName: string
  agentRole: string
  icon: LucideIcon
  ctaLabel?: string
  category: "contenu" | "commercial" | "automatisation"
  flow: SkillFlow
  placeholder?: string
  fileUrlLabel?: string
  fileUrlPlaceholder?: string
}

const SKILLS: SkillItem[] = [
  // ─── Création de contenus ─────────────────────────────────────────────────
  {
    id: "post-reseaux",
    title: "Créer un post pour les réseaux sociaux",
    tagline: "Créez des visuels prêts à poster pour vos réseaux sociaux en un seul clic",
    agentSlug: "lou",
    agentName: "Lou",
    agentRole: "Agente SEO",
    icon: ThumbsUp,
    category: "contenu",
    flow: "campaign",
    placeholder: "Décrivez le sujet du post, le ton souhaité, les mots-clés importants...",
  },
  {
    id: "presentation",
    title: "Générer une présentation",
    tagline: "Transformez vos idées en présentations claires et percutantes.",
    agentSlug: "lou",
    agentName: "Lou",
    agentRole: "Agente SEO",
    icon: Presentation,
    category: "contenu",
    flow: "generate",
    placeholder: "Sujet, public cible, nombre de slides souhaité, informations clés à inclure...",
  },
  {
    id: "supprimer-fond",
    title: "Effacer l'arrière-plan d'une image",
    tagline: "Supprimez l'arrière-plan de vos images en un instant pour des visuels propres.",
    agentSlug: "max",
    agentName: "Max",
    agentRole: "Agent Photo & Vidéo",
    icon: Image,
    category: "contenu",
    flow: "upload",
    placeholder: "Instructions supplémentaires (format de sortie, zones à conserver...)",
    fileUrlLabel: "URL de l'image",
    fileUrlPlaceholder: "https://exemple.com/photo.jpg",
  },
  {
    id: "audio-texte",
    title: "Convertir un audio en texte",
    tagline: "Transformez vos enregistrements audio en transcriptions précises et exploitables.",
    agentSlug: "mae",
    agentName: "Mae",
    agentRole: "Agente Mail",
    icon: Mic,
    category: "contenu",
    flow: "upload",
    placeholder: "Instructions (langue, format attendu, points à mettre en évidence...)",
    fileUrlLabel: "URL de l'audio",
    fileUrlPlaceholder: "https://exemple.com/enregistrement.mp3",
  },
  {
    id: "creer-image",
    title: "Créer une image",
    tagline: "Générez de nouvelles images à partir de vos consignes ou transformez vos fichiers existants.",
    agentSlug: "max",
    agentName: "Max",
    agentRole: "Agent Photo & Vidéo",
    icon: Palette,
    category: "contenu",
    flow: "generate",
    placeholder: "Décrivez l'image souhaitée : style, couleurs, sujet, format...",
  },
  {
    id: "creer-video",
    title: "Créer une vidéo",
    tagline: "Générez des vidéos à partir de vos consignes ou transformez vos fichiers existants en contenu vidéo.",
    agentSlug: "max",
    agentName: "Max",
    agentRole: "Agent Photo & Vidéo",
    icon: Video,
    category: "contenu",
    flow: "generate",
    placeholder: "Décrivez la vidéo souhaitée : scène, durée, style, ambiance...",
  },
  {
    id: "audit-seo",
    title: "Réaliser un audit SEO",
    tagline: "Analysez votre site et obtenez des recommandations pour booster votre SEO.",
    agentSlug: "lou",
    agentName: "Lou",
    agentRole: "Agente SEO",
    icon: BarChart2,
    category: "contenu",
    flow: "generate",
    placeholder: "URL de votre site ou page à auditer, secteur d'activité, mots-clés cibles...",
  },
  {
    id: "article-blog",
    title: "Créer un article de blog",
    tagline: "Rédigez automatiquement des articles complets, optimisés et prêts à publier.",
    agentSlug: "lou",
    agentName: "Lou",
    agentRole: "Agente SEO",
    icon: FileText,
    category: "contenu",
    flow: "generate",
    placeholder: "Sujet, angle éditorial, public cible, longueur souhaitée, mots-clés SEO...",
  },
  // ─── Campagne sur mesure ──────────────────────────────────────────────────
  {
    id: "campagne-blog",
    title: "Campagne d'articles de blog",
    tagline: "Planifiez, générez et publiez des articles réguliers pour attirer plus de trafic.",
    agentSlug: "lou",
    agentName: "Lou",
    agentRole: "Agente SEO",
    icon: BookOpen,
    ctaLabel: "Lancer cette campagne",
    category: "commercial",
    flow: "campaign",
    placeholder: "Thématiques, fréquence de publication, public cible, objectifs SEO...",
  },
  {
    id: "campagne-linkedin",
    title: "Campagne de prospection LinkedIn",
    tagline: "Trouvez et contactez automatiquement vos prospects idéaux sur LinkedIn.",
    agentSlug: "elio",
    agentName: "Elio",
    agentRole: "Agent Commercial",
    icon: LinkedInSvg,
    ctaLabel: "Lancer cette campagne",
    category: "commercial",
    flow: "campaign",
    placeholder: "Secteur cible, poste du prospect, message d'accroche, objectifs...",
  },
  {
    id: "campagne-appels",
    title: "Campagne d'appels sortants",
    tagline: "Lancez et gérez des appels automatisés pour toucher vos clients efficacement.",
    agentSlug: "elio",
    agentName: "Elio",
    agentRole: "Agent Commercial",
    icon: Phone,
    ctaLabel: "Lancer cette campagne",
    category: "commercial",
    flow: "campaign",
    placeholder: "Liste cible, script d'appel, objectif (RDV, qualification, relance)...",
  },
  // ─── Agents autonomes ────────────────────────────────────────────────────
  {
    id: "agent-support",
    title: "Agent de support client",
    tagline: "Répondez rapidement aux demandes de vos clients et améliorez leur expérience d'assistance.",
    agentSlug: "marine",
    agentName: "Marine",
    agentRole: "Agent Téléphonique",
    icon: MessageSquare,
    ctaLabel: "Créer un agent",
    category: "automatisation",
    flow: "setup",
    placeholder: "Décrivez votre activité, les questions fréquentes de vos clients, le ton souhaité...",
  },
  {
    id: "agent-standard",
    title: "Agent de standard téléphonique",
    tagline: "Prenez en charge les appels entrants, accueillez vos interlocuteurs et redirigez-les efficacement.",
    agentSlug: "marine",
    agentName: "Marine",
    agentRole: "Agent Téléphonique",
    icon: Phone,
    ctaLabel: "Créer un agent",
    category: "automatisation",
    flow: "setup",
    placeholder: "Nom de l'entreprise, horaires d'ouverture, services proposés, numéros de redirection...",
  },
]

const GROUPS: Array<{
  key: "contenu" | "commercial" | "automatisation"
  overline: string
  label: string
  sub: string
}> = [
  {
    key: "contenu",
    overline: "Création",
    label: "Création de contenus",
    sub: "Créez rapidement du contenu avec l'aide de vos assistants.",
  },
  {
    key: "commercial",
    overline: "Campagne",
    label: "Campagne sur mesure",
    sub: "Lancez des campagnes personnalisées adaptées à vos objectifs et à votre audience.",
  },
  {
    key: "automatisation",
    overline: "Automatisation",
    label: "Agents autonomes",
    sub: "Gérez vos interactions clients automatiquement, que ce soit par chat, appel ou support en ligne.",
  },
]

// ─── Social toggle data ──────────────────────────────────────────────────────

type SocialNetwork = "linkedin" | "facebook" | "instagram" | "twitter" | "youtube" | "tiktok"

const SOCIAL_NETWORKS: Array<{
  id: SocialNetwork
  label: string
  icon: React.FC<{ size?: number }>
  color: string
}> = [
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    color: "#0077B5",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
      </svg>
    ),
    color: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    color: "#1877F2",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "#000000",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000" />
      </svg>
    ),
    color: "#FF0000",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
    color: "#010101",
  },
]

// ─── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  step: 1 | 2 | 3 | 4
  description: string
  networks: Record<SocialNetwork, boolean>
  scheduling: "now" | "planned"
  date: string
  time: string
  fileUrl: string
  loading: boolean
  result: string | null
  errorMsg: string | null
}

const INITIAL_WIZARD: WizardState = {
  step: 1,
  description: "",
  networks: { linkedin: false, facebook: false, instagram: false, twitter: false, youtube: false, tiktok: false },
  scheduling: "planned",
  date: "",
  time: "",
  fileUrl: "",
  loading: false,
  result: null,
  errorMsg: null,
}

function hasNetworkStep(skill: SkillItem): boolean {
  return skill.flow === "campaign" && (skill.id === "post-reseaux" || skill.id === "campagne-blog")
}

// ─── Message builder ──────────────────────────────────────────────────────────

function buildMessage(skill: SkillItem, state: WizardState): string {
  const nets = (Object.keys(state.networks) as SocialNetwork[])
    .filter((k) => state.networks[k])
    .map((s) => SOCIAL_NETWORKS.find((n) => n.id === s)?.label ?? s)
    .join(", ")

  const scheduleInfo =
    state.scheduling === "now"
      ? "Publication immédiate."
      : state.date && state.time
        ? `Planifié le ${state.date} à ${state.time}.`
        : ""

  switch (skill.id) {
    case "post-reseaux":
      return [
        `Crée un post optimisé pour les réseaux sociaux suivants : ${nets || "tous les réseaux"}.`,
        `Contenu / contexte : ${state.description}`,
        scheduleInfo,
      ]
        .filter(Boolean)
        .join("\n")

    case "presentation":
      return `Génère une présentation professionnelle complète sur le sujet suivant :\n${state.description}`

    case "supprimer-fond":
      return [
        `Supprime l'arrière-plan de l'image suivante.`,
        state.fileUrl ? `URL de l'image : ${state.fileUrl}` : "",
        state.description ? `Instructions : ${state.description}` : "",
      ]
        .filter(Boolean)
        .join("\n")

    case "audio-texte":
      return [
        `Transcris l'audio suivant en texte précis et formaté.`,
        state.fileUrl ? `URL de l'audio : ${state.fileUrl}` : "",
        state.description ? `Instructions : ${state.description}` : "",
      ]
        .filter(Boolean)
        .join("\n")

    case "creer-image":
      return `Génère une image avec la description suivante :\n${state.description}`

    case "creer-video":
      return `Génère une vidéo avec la description suivante :\n${state.description}`

    case "audit-seo":
      return `Réalise un audit SEO complet et détaillé pour :\n${state.description}\n\nFournis des recommandations priorisées et actionnables.`

    case "article-blog":
      return `Rédige un article de blog complet, optimisé SEO, sur :\n${state.description}\n\nInclus titre H1, méta-description, intertitres H2/H3, et un CTA final.`

    case "campagne-blog":
      return [
        `Lance une campagne d'articles de blog.`,
        `Contexte et objectifs : ${state.description}`,
        nets ? `Canaux de diffusion : ${nets}` : "",
        scheduleInfo,
      ]
        .filter(Boolean)
        .join("\n")

    case "campagne-linkedin":
      return [
        `Lance une campagne de prospection LinkedIn.`,
        `Contexte et cible : ${state.description}`,
        scheduleInfo,
      ]
        .filter(Boolean)
        .join("\n")

    case "campagne-appels":
      return [
        `Lance une campagne d'appels sortants.`,
        `Contexte et objectif : ${state.description}`,
        scheduleInfo,
      ]
        .filter(Boolean)
        .join("\n")

    case "agent-support":
      return `Configure-toi en tant qu'agent de support client.\nDescription du contexte et des besoins :\n${state.description}`

    case "agent-standard":
      return `Configure-toi en tant qu'agent de standard téléphonique.\nDescription du contexte et des besoins :\n${state.description}`

    default:
      return state.description
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
  },
  modal: {
    background: "#111113",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    width: "100%",
    maxWidth: 560,
    padding: "28px 28px",
    position: "relative" as const,
    boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
  },
  closeBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(250,250,250,0.28)",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    transition: "color 0.15s",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(250,250,250,0.4)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    background: "rgba(255,255,255,0.042)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 14,
    color: "#FAFAFA",
    resize: "vertical" as const,
    fontFamily: "inherit",
    lineHeight: 1.6,
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  },
  btnPrimary: {
    height: 38,
    paddingLeft: 20,
    paddingRight: 20,
    background: "linear-gradient(135deg, #E86F4D, #D05A38)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  btnSecondary: {
    height: 38,
    paddingLeft: 16,
    paddingRight: 16,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "rgba(250,250,250,0.5)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  input: {
    background: "rgba(255,255,255,0.042)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: "#FAFAFA",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  },
}

// ─── Wizard steps ─────────────────────────────────────────────────────────────

function Step1({
  skill,
  state,
  onChange,
  onFileUrlChange,
  onAction,
  ctaLabel,
  canProceed,
}: {
  skill: SkillItem
  state: WizardState
  onChange: (v: string) => void
  onFileUrlChange: (v: string) => void
  onAction: () => void
  ctaLabel: string
  canProceed: boolean
}) {
  const IconComp = skill.icon
  const agentColor = getAgentColor(skill.agentSlug)

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        {/* Big icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `rgba(${hexToRgb(agentColor)}, 0.12)`,
            border: `1px solid rgba(${hexToRgb(agentColor)}, 0.2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <IconComp size={22} color={agentColor} strokeWidth={1.7} />
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#FAFAFA",
            margin: "0 0 6px",
            lineHeight: 1.35,
            paddingRight: 32,
          }}
        >
          {skill.title}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(250,250,250,0.45)",
            margin: "0 0 20px",
            lineHeight: 1.55,
          }}
        >
          {skill.tagline}
        </p>
      </div>

      {/* File URL field — upload flow only */}
      {skill.flow === "upload" && (
        <div style={{ marginBottom: 16 }}>
          <div style={S.label}>{skill.fileUrlLabel ?? "URL du fichier"}</div>
          <input
            type="url"
            style={{ ...S.input, width: "100%" }}
            placeholder={skill.fileUrlPlaceholder ?? "https://..."}
            value={state.fileUrl}
            onChange={(e) => onFileUrlChange(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={S.label}>
          {skill.flow === "upload" ? "Instructions (facultatif)" : "Descriptif"}
        </div>
        <textarea
          style={S.textarea}
          placeholder={skill.placeholder ?? "Décrivez l'idée, le ton et le message..."}
          value={state.description}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
          }}
        />
      </div>

      {/* Ask agent link */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "rgba(250,250,250,0.4)",
            fontSize: 12,
            fontWeight: 500,
            textDecoration: "underline",
            textDecorationColor: "rgba(250,250,250,0.15)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(250,250,250,0.75)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(250,250,250,0.4)"
          }}
        >
          <AgentAvatar slug={skill.agentSlug} size={16} />
          Demander de l&apos;aide à {skill.agentName}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          style={{
            ...S.btnPrimary,
            opacity: canProceed ? 1 : 0.4,
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
          onClick={onAction}
          disabled={!canProceed}
          onMouseEnter={(e) => {
            if (canProceed) {
              e.currentTarget.style.background = "linear-gradient(135deg, #F47856, #E86F4D)"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #E86F4D, #D05A38)"
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </>
  )
}

function Step2({
  state,
  onToggle,
  onBack,
  onNext,
}: {
  skill: SkillItem
  state: WizardState
  onToggle: (n: SocialNetwork) => void
  onBack: () => void
  onNext: () => void
}) {
  const hasSelection = Object.values(state.networks).some(Boolean)

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#FAFAFA",
            margin: "0 0 6px",
            lineHeight: 1.35,
            paddingRight: 32,
          }}
        >
          Sélectionner les réseaux pour la planification du post
        </h2>
        <p style={{ fontSize: 13, color: "rgba(250,250,250,0.45)", margin: 0, lineHeight: 1.55 }}>
          Choisissez le ou les réseaux sociaux où vous souhaitez publier.
        </p>
      </div>

      {/* Instagram gradient def */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ig-grad-skills" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {SOCIAL_NETWORKS.map((net) => {
          const active = state.networks[net.id]
          const bg =
            net.id === "instagram"
              ? "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)"
              : net.color
          return (
            <button
              key={net.id}
              onClick={() => onToggle(net.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: active ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.028)",
                border: `1px solid ${active ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.15s",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <net.icon size={17} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA" }}>
                  {net.label}
                </span>
              </div>
              {/* Toggle pill */}
              <div
                style={{
                  width: 42,
                  height: 24,
                  borderRadius: 12,
                  background: active ? "#E86F4D" : "rgba(255,255,255,0.12)",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: active ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          style={S.btnSecondary}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
            e.currentTarget.style.color = "#FAFAFA"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
            e.currentTarget.style.color = "rgba(250,250,250,0.5)"
          }}
        >
          ← Retour
        </button>
        <button
          style={{
            ...S.btnPrimary,
            opacity: hasSelection ? 1 : 0.4,
            cursor: hasSelection ? "pointer" : "not-allowed",
          }}
          onClick={onNext}
          disabled={!hasSelection}
          onMouseEnter={(e) => {
            if (hasSelection) {
              e.currentTarget.style.background = "linear-gradient(135deg, #F47856, #E86F4D)"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #E86F4D, #D05A38)"
          }}
        >
          Suivant →
        </button>
      </div>
    </>
  )
}

function Step3({
  state,
  onChange,
  onBack,
  onCreate,
}: {
  skill: SkillItem
  state: WizardState
  onChange: (patch: Partial<WizardState>) => void
  onBack: () => void
  onCreate: () => void
}) {
  const isPlanned = state.scheduling === "planned"
  const canCreate = !isPlanned || (state.date.trim() !== "" && state.time.trim() !== "")

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#FAFAFA",
            margin: "0 0 6px",
            lineHeight: 1.35,
            paddingRight: 32,
          }}
        >
          Définir la date et l&apos;heure de publication
        </h2>
        <p style={{ fontSize: 13, color: "rgba(250,250,250,0.45)", margin: 0, lineHeight: 1.55 }}>
          Planifiez la publication ou publiez dès maintenant.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {/* Planifier */}
        <button
          onClick={() => onChange({ scheduling: "planned" })}
          style={{
            flex: 1,
            padding: "14px 16px",
            background: isPlanned ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.028)",
            border: `1px solid ${isPlanned ? "rgba(232,111,77,0.35)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Clock
            size={22}
            color={isPlanned ? "#E86F4D" : "rgba(250,250,250,0.28)"}
            strokeWidth={1.8}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: isPlanned ? "#FAFAFA" : "rgba(250,250,250,0.45)",
            }}
          >
            Planifier
          </span>
        </button>

        {/* Publier maintenant */}
        <button
          onClick={() => onChange({ scheduling: "now" })}
          style={{
            flex: 1,
            padding: "14px 16px",
            background: !isPlanned ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.028)",
            border: `1px solid ${!isPlanned ? "rgba(232,111,77,0.35)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Send
            size={22}
            color={!isPlanned ? "#E86F4D" : "rgba(250,250,250,0.28)"}
            strokeWidth={1.8}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: !isPlanned ? "#FAFAFA" : "rgba(250,250,250,0.45)",
            }}
          >
            Publier maintenant
          </span>
        </button>
      </div>

      {/* Date + time conditional */}
      {isPlanned && (
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={S.label}>Date</div>
            <input
              type="date"
              value={state.date}
              onChange={(e) => onChange({ date: e.target.value })}
              style={{ ...S.input, width: "100%", colorScheme: "dark" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={S.label}>Heure</div>
            <input
              type="time"
              value={state.time}
              onChange={(e) => onChange({ time: e.target.value })}
              style={{ ...S.input, width: "100%", colorScheme: "dark" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(232,111,77,0.5)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
              }}
            />
          </div>
        </div>
      )}
      {!isPlanned && <div style={{ height: 28 }} />}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          style={S.btnSecondary}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
            e.currentTarget.style.color = "#FAFAFA"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
            e.currentTarget.style.color = "rgba(250,250,250,0.5)"
          }}
        >
          ← Retour
        </button>
        <button
          style={{
            ...S.btnPrimary,
            opacity: canCreate ? 1 : 0.4,
            cursor: canCreate ? "pointer" : "not-allowed",
          }}
          onClick={onCreate}
          disabled={!canCreate}
          onMouseEnter={(e) => {
            if (canCreate) {
              e.currentTarget.style.background = "linear-gradient(135deg, #F47856, #E86F4D)"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #E86F4D, #D05A38)"
          }}
        >
          Lancer →
        </button>
      </div>
    </>
  )
}

// ─── Step 4 — result view ─────────────────────────────────────────────────────

function StepResult({
  skill,
  loading,
  result,
  errorMsg,
  onBack,
  onClose,
}: {
  skill: SkillItem
  loading: boolean
  result: string | null
  errorMsg: string | null
  onBack: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!result) return
    void navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0 40px" }}>
        <style>{`@keyframes lynaris-spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid rgba(232,111,77,0.2)",
            borderTopColor: "#E86F4D",
            borderRadius: "50%",
            animation: "lynaris-spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p style={{ color: "rgba(250,250,250,0.55)", fontSize: 14, margin: "0 0 4px" }}>
          {skill.agentName} génère votre contenu...
        </p>
        <p style={{ color: "rgba(250,250,250,0.28)", fontSize: 12, margin: 0 }}>
          Cela peut prendre quelques secondes.
        </p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <>
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <X size={20} color="#F87171" />
          </div>
          <p style={{ color: "#F87171", fontSize: 14, margin: "0 0 8px", fontWeight: 600 }}>
            Erreur lors de la génération
          </p>
          <p style={{ color: "rgba(250,250,250,0.5)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {errorMsg}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={S.btnSecondary}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
              e.currentTarget.style.color = "#FAFAFA"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
              e.currentTarget.style.color = "rgba(250,250,250,0.5)"
            }}
          >
            ← Modifier
          </button>
          <button
            style={S.btnPrimary}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #F47856, #E86F4D)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #E86F4D, #D05A38)"
            }}
          >
            Fermer
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#FAFAFA", margin: 0 }}>
            Résultat
          </h2>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8,
              padding: "6px 12px",
              color: copied ? "#34D399" : "rgba(250,250,250,0.6)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: "14px 16px",
            maxHeight: 340,
            overflowY: "auto",
            fontSize: 13,
            color: "rgba(250,250,250,0.85)",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {result}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          style={S.btnSecondary}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
            e.currentTarget.style.color = "#FAFAFA"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
            e.currentTarget.style.color = "rgba(250,250,250,0.5)"
          }}
        >
          ← Modifier
        </button>
        <button
          style={S.btnPrimary}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #F47856, #E86F4D)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #E86F4D, #D05A38)"
          }}
        >
          Fermer
        </button>
      </div>
    </>
  )
}

// ─── Wizard modal ─────────────────────────────────────────────────────────────

function SkillWizardModal({
  skill,
  onClose,
}: {
  skill: SkillItem
  onClose: () => void
}) {
  const router = useRouter()
  const [state, setState] = useState<WizardState>({ ...INITIAL_WIZARD })
  const mounted = useRef(true)

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  function patch(p: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...p }))
  }

  async function handleCreate() {
    const message = buildMessage(skill, state)

    if (skill.flow === "generate") {
      patch({ step: 4, loading: true, result: null, errorMsg: null })
      try {
        const res = await fetch(`/api/agents/${skill.agentSlug}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        })
        if (!mounted.current) return
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string }
          patch({ loading: false, errorMsg: errBody.error ?? `Erreur ${res.status}` })
          return
        }
        const data = (await res.json()) as { content?: string; error?: string }
        if (!mounted.current) return
        if (data.error) {
          patch({ loading: false, errorMsg: data.error })
          return
        }
        patch({ loading: false, result: data.content ?? "" })
      } catch {
        if (!mounted.current) return
        patch({ loading: false, errorMsg: "Impossible de joindre le serveur. Réessaie." })
      }
      return
    }

    // upload / campaign / setup → navigate to agent with pre-filled message
    localStorage.setItem("lynaris_prefill_message", message)
    router.push(`/dashboard/agents/${skill.agentSlug}`)
  }

  function handleStepNext() {
    if (skill.flow !== "campaign") {
      void handleCreate()
      return
    }
    if (state.step === 1) {
      patch({ step: hasNetworkStep(skill) ? 2 : 3 })
    } else if (state.step === 2) {
      patch({ step: 3 })
    }
  }

  function handleBack() {
    if (state.step === 4) {
      patch({ step: 1, loading: false, result: null, errorMsg: null })
      return
    }
    if (state.step === 3) {
      patch({ step: hasNetworkStep(skill) ? 2 : 1 })
    } else if (state.step === 2) {
      patch({ step: 1 })
    }
  }

  // CTA label for Step 1
  const step1CtaLabel: Record<SkillFlow, string> = {
    generate: "Générer →",
    upload: `Envoyer à ${skill.agentName} →`,
    campaign: "Suivant →",
    setup: "Configurer →",
  }

  // Step 1 can-proceed logic
  const step1CanProceed =
    skill.flow === "upload"
      ? state.fileUrl.trim() !== ""
      : state.description.trim() !== ""

  // Progress bars — only for campaign flow
  const isCampaign = skill.flow === "campaign"
  const totalSteps = isCampaign ? (hasNetworkStep(skill) ? 3 : 2) : 0
  const currentDisplay =
    state.step === 3
      ? hasNetworkStep(skill)
        ? 3
        : 2
      : (state.step as number)

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Close */}
        <button
          style={S.closeBtn}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FAFAFA"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(250,250,250,0.28)"
          }}
        >
          <X size={18} />
        </button>

        {/* Step progress bars — campaign only, hidden on step 4 */}
        {isCampaign && state.step !== 4 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background: i + 1 <= currentDisplay ? "#E86F4D" : "rgba(255,255,255,0.1)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {state.step === 1 && (
          <Step1
            skill={skill}
            state={state}
            onChange={(v) => patch({ description: v })}
            onFileUrlChange={(v) => patch({ fileUrl: v })}
            onAction={handleStepNext}
            ctaLabel={step1CtaLabel[skill.flow]}
            canProceed={step1CanProceed}
          />
        )}
        {state.step === 2 && (
          <Step2
            skill={skill}
            state={state}
            onToggle={(n) =>
              patch({ networks: { ...state.networks, [n]: !state.networks[n] } })
            }
            onBack={handleBack}
            onNext={handleStepNext}
          />
        )}
        {state.step === 3 && (
          <Step3
            skill={skill}
            state={state}
            onChange={patch}
            onBack={handleBack}
            onCreate={() => void handleCreate()}
          />
        )}
        {state.step === 4 && (
          <StepResult
            skill={skill}
            loading={state.loading}
            result={state.result}
            errorMsg={state.errorMsg}
            onBack={handleBack}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  onOpen,
}: {
  skill: SkillItem
  onOpen: (s: SkillItem) => void
}) {
  const IconComp = skill.icon
  const agentColor = getAgentColor(skill.agentSlug)
  const agentRgb = hexToRgb(agentColor)

  return (
    <GlassCard radius={20} padding={18} hover>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: "100%",
        }}
      >
        {/* Header: icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: `rgba(${agentRgb}, 0.12)`,
              border: `1px solid rgba(${agentRgb}, 0.2)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconComp size={17} color={agentColor} strokeWidth={1.7} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#FAFAFA",
              lineHeight: 1.3,
            }}
          >
            {skill.title}
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: "rgba(250,250,250,0.45)",
            margin: 0,
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {skill.tagline}
        </p>

        {/* Agent badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AgentAvatar slug={skill.agentSlug} size={20} />
          <span style={{ fontSize: 12, color: "rgba(250,250,250,0.4)" }}>
            {skill.agentName}, {skill.agentRole}
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => onOpen(skill)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
            borderRadius: 8,
            background: "rgba(232,111,77,0.1)",
            border: "1px solid rgba(232,111,77,0.25)",
            fontSize: 12,
            color: "var(--accent)",
            fontWeight: 600,
            transition: "background 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
            cursor: "pointer",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(232,111,77,0.18)"
            e.currentTarget.style.borderColor = "rgba(232,111,77,0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(232,111,77,0.1)"
            e.currentTarget.style.borderColor = "rgba(232,111,77,0.25)"
          }}
        >
          {skill.ctaLabel ?? "Créer avec ce super-pouvoir"}
        </button>
      </div>
    </GlassCard>
  )
}

// ─── Hex to RGB helper ────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const [activeSkill, setActiveSkill] = useState<SkillItem | null>(null)

  return (
    <div
      style={{
        padding: "28px 32px",
        maxWidth: 1080,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 700,
            color: "#FAFAFA",
            margin: "0 0 6px",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}
        >
          Super-pouvoirs
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(250,250,250,0.5)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Lancez des actions IA en quelques secondes.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {GROUPS.map((group, idx) => {
          const skills = SKILLS.filter((s) => s.category === group.key)
          if (!skills.length) return null
          return (
            <section
              key={group.key}
              style={{ marginTop: idx === 0 ? 0 : 40 }}
            >
              {/* Overline */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(232,111,77,0.6)",
                  marginBottom: 6,
                }}
              >
                {group.overline}
              </div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#FAFAFA",
                  margin: "0 0 4px",
                  lineHeight: 1.3,
                }}
              >
                {group.label}
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(250,250,250,0.45)",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                {group.sub}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                }}
              >
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} onOpen={setActiveSkill} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {activeSkill && (
        <SkillWizardModal skill={activeSkill} onClose={() => setActiveSkill(null)} />
      )}
    </div>
  )
}
