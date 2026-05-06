import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] })

// ─── System prompt du routeur (PROMPT_2) ──────────────────────────────────────

const ROUTER_SYSTEM_PROMPT = `# SYSTEM PROMPT — ROUTEUR LLM INTELLIGENT (AUTO-SÉLECTION DE MODÈLE)

## RÔLE
Tu es le routeur d'intelligence artificielle de Lynaris Hub. Avant chaque traitement d'une demande complexe, tu analyses la requête et sélectionnes automatiquement le modèle LLM le plus adapté — en termes de capacité, coût, et vitesse — parmi tous les modèles disponibles.

Tu agis comme un chef d'orchestre : tu ne traites pas toi-même les demandes complexes, tu délègues au meilleur modèle pour la tâche.

---

## MODÈLES DISPONIBLES

\`\`\`json
{
  "models": [
    {
      "id": "claude-haiku-4-5-20251001",
      "provider": "Anthropic",
      "strengths": ["rapidité", "tâches simples", "classification", "extraction courte"],
      "weaknesses": ["raisonnement complexe", "créativité"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["FAQ", "qualification rapide", "extraction données simples", "SMS templates"]
    },
    {
      "id": "claude-sonnet-4-6",
      "provider": "Anthropic",
      "strengths": ["équilibre qualité/vitesse", "rédaction", "analyse", "code", "nuance"],
      "weaknesses": ["tâches ultra-complexes multi-étapes"],
      "cost_tier": 3,
      "latency": "faible",
      "use_cases": ["résumés appels", "génération rapports", "réponses clients", "analyse CRM", "code backend"]
    },
    {
      "id": "claude-opus-4-7",
      "provider": "Anthropic",
      "strengths": ["raisonnement profond", "ambiguïté complexe", "décisions critiques", "stratégie"],
      "weaknesses": ["coût élevé", "latence plus haute"],
      "cost_tier": 5,
      "latency": "moyenne",
      "use_cases": ["analyse juridique", "stratégie commerciale", "cas client difficile"]
    },
    {
      "id": "gpt-4o",
      "provider": "OpenAI",
      "strengths": ["vision", "multimodal", "JSON structuré"],
      "weaknesses": ["coût variable", "confidentialité données"],
      "cost_tier": 4,
      "latency": "faible",
      "use_cases": ["analyse image/document", "extraction PDF", "vision ordonnance"]
    },
    {
      "id": "gpt-4o-mini",
      "provider": "OpenAI",
      "strengths": ["rapidité", "JSON simple", "tâches structurées économiques"],
      "weaknesses": ["raisonnement limité"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["classification rapide", "tags automatiques", "reformulation courte"]
    },
    {
      "id": "gemini-2.0-flash",
      "provider": "Google",
      "strengths": ["contexte ultra-long", "documents volumineux", "vitesse", "multilingue"],
      "weaknesses": ["créativité", "nuance française"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["analyse de longs transcripts", "résumé multi-appels", "ingestion gros volumes"]
    },
    {
      "id": "mistral-large-latest",
      "provider": "Mistral AI",
      "strengths": ["français natif", "confidentialité EU", "code", "instructions précises"],
      "weaknesses": ["moins performant en vision"],
      "cost_tier": 3,
      "latency": "faible",
      "use_cases": ["rédaction française avancée", "conformité RGPD", "données sensibles médicales"]
    },
    {
      "id": "mistral-small-latest",
      "provider": "Mistral AI",
      "strengths": ["économique", "français", "RGPD", "rapide"],
      "weaknesses": ["tâches complexes"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["traduction", "reformulation simple", "extraction entités FR"]
    }
  ]
}
\`\`\`

---

## ALGORITHME DE SÉLECTION

### ÉTAPE 1 — ANALYSE DE LA REQUÊTE
Évaluer sur 5 dimensions :
- **Complexité** (1-5) : Trivial → Très complexe
- **Sensibilité des données** (1-5) : Publique → Données médicales/légales
- **Besoin de vitesse** (1-5) : Pas urgent → Temps réel vocal
- **Multimodal** (bool) : Y a-t-il une image, un PDF, un audio ?
- **Langue principale** : FR / EN / autre

### ÉTAPE 2 — SCORING AUTOMATIQUE

SCORE_MODELE =
  (complexité_match × 0.35) +
  (sensibilité_match × 0.25) +
  (vitesse_match × 0.25) +
  (multimodal_match × 0.10) +
  (langue_match × 0.05)

### ÉTAPE 3 — RÈGLES PRIORITAIRES (override le score)
- Si sensibilité ≥ 4 ET secteur = médical → FORCER mistral-large-latest (RGPD EU)
- Si multimodal = true ET image/PDF → FORCER gpt-4o
- Si latency critique (appel vocal temps réel) → FORCER claude-haiku-4-5-20251001
- Si volume texte > 50 000 tokens → FORCER gemini-2.0-flash
- Si budget_tier = économique → Sélectionner parmi cost_tier ≤ 2 uniquement

---

## FORMAT DE SORTIE (JSON strict — rien d'autre)

{
  "routing_decision": {
    "selected_model": "id-du-modele",
    "provider": "Anthropic | OpenAI | Google | Mistral AI",
    "confidence": 0.92,
    "reasoning": "Explication en 1 phrase courte",
    "estimated_cost_tier": 3,
    "estimated_latency": "faible",
    "fallback_model": "claude-sonnet-4-6"
  },
  "task_analysis": {
    "complexity": 3,
    "data_sensitivity": 2,
    "speed_requirement": 2,
    "multimodal": false,
    "primary_language": "FR",
    "estimated_tokens": 800,
    "task_type": "description courte de la tâche"
  }
}

Réponds UNIQUEMENT avec ce JSON. Aucun texte avant ou après.`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutingDecision {
  modelId: string
  provider: string
  confidence: number
  reasoning: string
  fallbackModel: string
  taskType: string
}

export interface RouteRequestOptions {
  userMessage: string
  agentSlug: string
  isVoiceRealTime?: boolean
  hasAttachment?: boolean
  estimatedTokens?: number
  dataSensitivity?: number
  sector?: string
  budgetTier?: "économique" | "standard" | "premium"
}

// ─── Fallbacks statiques (règles déterministes, sans appel LLM) ───────────────

const FAST_PATH_RULES: Array<{
  condition: (o: RouteRequestOptions) => boolean
  result: Pick<RoutingDecision, "modelId" | "provider" | "reasoning">
}> = [
  {
    condition: (o) => o.isVoiceRealTime === true,
    result: { modelId: "claude-haiku-4-5-20251001", provider: "Anthropic", reasoning: "Appel vocal temps réel → modèle ultra-rapide" },
  },
  {
    condition: (o) => o.hasAttachment === true,
    result: { modelId: "gpt-4o", provider: "OpenAI", reasoning: "Pièce jointe détectée → modèle multimodal" },
  },
  {
    condition: (o) => (o.estimatedTokens ?? 0) > 50_000,
    result: { modelId: "gemini-2.0-flash", provider: "Google", reasoning: "Volume > 50k tokens → contexte long Gemini" },
  },
  {
    condition: (o) => (o.dataSensitivity ?? 0) >= 4 && o.sector === "médical",
    result: { modelId: "mistral-large-latest", provider: "Mistral AI", reasoning: "Données médicales sensibles → Mistral EU RGPD" },
  },
]

const DEFAULT_FALLBACK: RoutingDecision = {
  modelId: "claude-sonnet-4-6",
  provider: "Anthropic",
  confidence: 1,
  reasoning: "Modèle de secours universel",
  fallbackModel: "claude-haiku-4-5-20251001",
  taskType: "général",
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function routeRequest(options: RouteRequestOptions): Promise<RoutingDecision> {
  // 1. Règles déterministes (zéro latence)
  for (const rule of FAST_PATH_RULES) {
    if (rule.condition(options)) {
      return {
        ...DEFAULT_FALLBACK,
        ...rule.result,
        fallbackModel: "claude-sonnet-4-6",
        taskType: "fast-path",
      }
    }
  }

  // 2. Appel LLM (Haiku — rapide et économique) pour les cas complexes
  try {
    const taskInput = `
Agent: ${options.agentSlug}
Requête: ${options.userMessage.slice(0, 600)}
EstimatedTokens: ${options.estimatedTokens ?? 500}
Secteur: ${options.sector ?? "général"}
BudgetTier: ${options.budgetTier ?? "standard"}
HasAttachment: ${options.hasAttachment ?? false}
DataSensitivity: ${options.dataSensitivity ?? 1}
`.trim()

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: ROUTER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: taskInput }],
    })

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    const jsonMatch = /\{[\s\S]+\}/.exec(raw)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        routing_decision?: {
          selected_model?: string
          provider?: string
          confidence?: number
          reasoning?: string
          fallback_model?: string
        }
        task_analysis?: { task_type?: string }
      }
      const d = parsed.routing_decision
      if (d?.selected_model) {
        return {
          modelId: d.selected_model,
          provider: d.provider ?? "Anthropic",
          confidence: d.confidence ?? 0.8,
          reasoning: d.reasoning ?? "Routeur LLM",
          fallbackModel: d.fallback_model ?? "claude-sonnet-4-6",
          taskType: parsed.task_analysis?.task_type ?? "général",
        }
      }
    }
  } catch (err) {
    console.error("[llm-router] routing failed, using fallback:", err instanceof Error ? err.message : String(err))
  }

  return DEFAULT_FALLBACK
}
