export type AgentStatus = "live" | "beta" | "roadmap"

export interface Agent {
  slug: string
  name: string
  emoji: string
  /** Avatar 3D Higgsfield — chemin public, ex: "/agents/avatars/marine.webp". */
  avatar?: string
  color: string
  role: string
  tagline: string
  description: string
  tags: string[]
  available: boolean
  status: AgentStatus
  availableFrom?: string // ISO date estimée pour "roadmap"
}

export const agents: Agent[] = [
  {
    slug: "marine",
    name: "Marine",
    emoji: "🎤️",
    avatar: "/agents/avatars/marine.webp",
    color: "#22D3EE",
    role: "Agent Téléphonique",
    tagline: "Décroche. Qualifie. Prend RDV. 24 / 7.",
    description:
      "Marine répond à tes appels entrants en moins de 2 secondes, détecte les urgences et gère les prises de rendez-vous sans jamais te déranger.",
    tags: ["Voix", "Agenda", "SMS"],
    available: true,
    status: "live",
  },
  {
    slug: "charles",
    name: "Charles",
    emoji: "🧠",
    avatar: "/agents/avatars/charles.webp",
    color: "#7C3AED",
    role: "Agent Personnel",
    tagline: "Ton chef d’orchestre IA disponible sur WhatsApp.",
    description:
      "Charles comprend tes instructions en langage naturel, délègue aux bons agents et te tient informé. Accès direct sur WhatsApp ou depuis le dashboard.",
    tags: ["Orchestration", "WhatsApp", "Mémoire"],
    available: true,
    status: "live",
  },
  {
    slug: "lou",
    name: "Lou",
    emoji: "✍️",
    avatar: "/agents/avatars/lou.webp",
    color: "#F472B6",
    role: "Agent Contenu & SEO",
    tagline: "Rédige, optimise, publie. Partout.",
    description:
      "Lou produit des articles, posts LinkedIn, newsletters et carrousels Instagram — et les publie directement sur tes plateformes. Fini la page blanche.",
    tags: ["SEO", "LinkedIn", "WordPress"],
    available: true,
    status: "live",
  },
  {
    slug: "elio",
    name: "Elio",
    emoji: "💼",
    avatar: "/agents/avatars/elio.webp",
    color: "#10B981",
    role: "Agent Commercial",
    tagline: "Prospecte, qualifie, relance. Automatiquement.",
    description:
      "Elio gère ton pipeline commercial : import de prospects, rédaction de messages personnalisés, scoring des réponses et relances automatisées.",
    tags: ["Prospection", "Email", "CRM"],
    available: true,
    status: "live",
  },
  {
    slug: "mae",
    name: "Mae",
    emoji: "📧",
    avatar: "/agents/avatars/mae.webp",
    color: "#F59E0B",
    role: "Agent Mail",
    tagline: "Ta boîte mail triée et gérée chaque matin.",
    description:
      "Mae trie tes emails par priorité, rédige des réponses que tu valides en un clic, et t’envoie un brief quotidien à 8 h avec les 3 points urgents.",
    tags: ["Gmail", "Tri", "Rédaction"],
    available: true,
    status: "live",
  },
  {
    slug: "max",
    name: "Max",
    emoji: "🎬",
    avatar: "/agents/avatars/max.webp",
    color: "#EC4899",
    role: "Agent Photo & Vidéo",
    tagline: "Génère, retouche, exporte. En secondes.",
    description:
      "Max génère des visuels professionnels, supprime les fonds, crée des variations produit et produit des templates de Reels — sans Photoshop.",
    tags: ["IA générative", "Flux", "Vidéo"],
    available: true,
    status: "live",
  },
  {
    slug: "nova",
    name: "Nova",
    emoji: "📊",
    avatar: "/agents/avatars/nova.webp",
    color: "#6366F1",
    role: "Agent Business",
    tagline: "Ton assistant stratégique avec tes vraies données.",
    description:
      "Nova agrège tes métriques Stripe, Shopify et banque pro, détecte les anomalies et te produit un rapport hebdomadaire avec 3 priorités actionnables.",
    tags: ["Analytics", "Stripe", "Rapport"],
    available: true,
    status: "live",
  },
  {
    slug: "alba",
    name: "Alba",
    emoji: "📋",
    avatar: "/agents/avatars/alba.webp",
    color: "#8B5CF6",
    role: "Agent RH",
    tagline: "CV triés, contrats rédigés, candidats contactés.",
    description:
      "Alba analyse les candidatures, rédige les messages aux candidats, planifie les entretiens et génère les contrats depuis tes templates.",
    tags: ["Recrutement", "Contrats", "RH"],
    available: true,
    status: "live",
  },
  {
    slug: "orion",
    name: "Orion",
    emoji: "🔧",
    avatar: "/agents/avatars/orion.webp",
    color: "#64748B",
    role: "Agent Automatisation",
    tagline: "Décris ton process en français. Orion le code.",
    description:
      "Orion crée des workflows Make et n8n à partir de ta description en langage naturel, les déploie sur ton instance et te confirme que tout fonctionne.",
    tags: ["n8n", "Make", "No-code"],
    available: true,
    status: "live",
  },
  {
    slug: "aria",
    name: "Aria",
    emoji: "🌟",
    color: "#F97316",
    role: "Assistante Universelle",
    tagline: "Direction. Marketing. Legal. Compta. Recrutement. Tout en une.",
    description:
      "Aria combine 12 rôles professionnels : direction, marketing, SEO, commercial, relation client, comptabilité, juridique, recrutement, facturation, e-commerce, social et analyse de données. Un seul agent pour tout piloter.",
    tags: ["Direction", "Marketing", "Comptabilité", "Juridique", "RH", "SEO", "Commercial"],
    available: true,
    status: "live" as const,
  },
]
