export type ModelTier = "sonnet" | "opus"
export type AgentCategory =
  | "communication"
  | "orchestration"
  | "contenu"
  | "commercial"
  | "business"
  | "rh"

export interface AgentSkillEntry {
  slug: string
  name: string
  color: string
  role: string
  tagline: string
  category: AgentCategory
  model: string
  modelTier: ModelTier
  integrations: string[]
  tools: string[]
}

export const AGENT_SKILLS: AgentSkillEntry[] = [
  {
    slug: "marine",
    name: "Marine",
    color: "#22D3EE",
    role: "Agent Téléphonique",
    tagline: "Décroche. Qualifie. Prend RDV. 24 / 7.",
    category: "communication",
    model: "Sonnet 4.6",
    modelTier: "sonnet",
    integrations: ["Google Calendar", "Twilio", "ElevenLabs"],
    tools: [
      "Vérifier créneaux agenda",
      "Créer rendez-vous",
      "Envoyer SMS confirmation",
      "Escalade urgences",
      "Rechercher patient",
      "Liste de rappel",
    ],
  },
  {
    slug: "charles",
    name: "Charles",
    color: "#7C3AED",
    role: "Agent Personnel",
    tagline: "Ton chef d’orchestre disponible sur WhatsApp.",
    category: "orchestration",
    model: "Opus 4.6",
    modelTier: "opus",
    integrations: ["Gmail", "Google Calendar", "WhatsApp"],
    tools: [
      "Déléguer aux agents",
      "Consulter logs agents",
      "Lire / créer événements",
      "Brouillons email",
      "Mémoire long-terme pgvector",
      "Brief quotidien",
      "Déclencher workflows n8n",
    ],
  },
  {
    slug: "lou",
    name: "Lou",
    color: "#F472B6",
    role: "Agent Contenu & SEO",
    tagline: "Rédige, optimise, publie. Partout.",
    category: "contenu",
    model: "Opus 4.6",
    modelTier: "opus",
    integrations: ["WordPress", "n8n / Make", "LinkedIn", "Instagram"],
    tools: [
      "Analyser URL",
      "Plan éditorial",
      "Rédiger article",
      "Post LinkedIn / carrousel",
      "Publier WordPress",
      "Publier via n8n",
      "Analyse SEO",
    ],
  },
  {
    slug: "elio",
    name: "Elio",
    color: "#10B981",
    role: "Agent Commercial",
    tagline: "Prospecte, qualifie, relance. Automatiquement.",
    category: "commercial",
    model: "Sonnet 4.6",
    modelTier: "sonnet",
    integrations: ["Gmail", "Dropcontact", "Hunter"],
    tools: [
      "Importer prospects",
      "Messages personnalisés",
      "Scoring réponses",
      "Relances automatisées",
      "Kanban pipeline",
      "Séquences email",
    ],
  },
  {
    slug: "mae",
    name: "Mae",
    color: "#F59E0B",
    role: "Agent Mail",
    tagline: "Ta boîte mail triée et gérée chaque matin.",
    category: "communication",
    model: "Sonnet 4.6",
    modelTier: "sonnet",
    integrations: ["Gmail", "Outlook"],
    tools: [
      "Trier emails par priorité",
      "Rédiger réponses",
      "Brief quotidien 8h",
      "Hiérarchiser urgences",
    ],
  },
  {
    slug: "max",
    name: "Max",
    color: "#EC4899",
    role: "Agent Photo & Vidéo",
    tagline: "Génère, retouche, exporte. En secondes.",
    category: "contenu",
    model: "Sonnet 4.6",
    modelTier: "sonnet",
    integrations: ["Replicate", "Supabase Storage"],
    tools: [
      "Générer visuels Flux 1.1 Pro",
      "Supprimer arrière-plan",
      "Variations produit",
      "Templates Reels",
      "Exporter formats multiples",
    ],
  },
  {
    slug: "nova",
    name: "Nova",
    color: "#6366F1",
    role: "Agent Business",
    tagline: "Ton assistant stratégique avec tes vraies données.",
    category: "business",
    model: "Opus 4.6",
    modelTier: "opus",
    integrations: ["Stripe", "Shopify", "Qonto"],
    tools: [
      "Agréger métriques",
      "Détecter anomalies",
      "Rapport hebdomadaire",
      "3 priorités actionnables",
    ],
  },
  {
    slug: "alba",
    name: "Alba",
    color: "#8B5CF6",
    role: "Agent RH",
    tagline: "CV triés, contrats rédigés, candidats contactés.",
    category: "rh",
    model: "Sonnet 4.6",
    modelTier: "sonnet",
    integrations: ["Gmail", "Google Calendar"],
    tools: [
      "Analyser candidatures",
      "Contacter candidats",
      "Planifier entretiens",
      "Générer contrats",
    ],
  }
]

export const CATEGORIES = [
  { value: "tous", label: "Tous", color: "#A78BFA" },
  { value: "communication", label: "Communication", color: "#22D3EE" },
  { value: "orchestration", label: "Orchestration", color: "#7C3AED" },
  { value: "contenu", label: "Contenu", color: "#F472B6" },
  { value: "commercial", label: "Commercial", color: "#10B981" },
  { value: "business", label: "Business", color: "#6366F1" },
  { value: "rh", label: "RH", color: "#8B5CF6" },
] as const
