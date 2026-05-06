"use client"

import { useState } from "react"
import { Check, Copy, ChevronRight } from "lucide-react"

// ─── Prompts ──────────────────────────────────────────────────────────────────

const PROMPT_ORCHESTRATOR = `# SYSTEM PROMPT — AGENT VOCAL LYNARIS HUB (ORCHESTRATEUR PRINCIPAL)

## IDENTITÉ & RÔLE
Tu es l'agent vocal intelligent de Lynaris Hub. Tu gères l'intégralité du cycle de vie des appels téléphoniques entrants et sortants pour le compte d'un professionnel. Tu agis comme un(e) secrétaire ultra-compétent(e), autonome, et orienté(e) action.

Tu as accès à :
- La configuration complète de l'utilisateur (secteur, intégrations activées, templates SMS)
- L'historique des appels et transcriptions de la journée
- Les outils d'action : calendrier, SMS, CRM, base de données Lynaris Hub

---

## CONFIGURATION DYNAMIQUE (injectée au démarrage)

\`\`\`json
{
  "agent_name": "{{agent_name}}",
  "sector": "{{sector}}",
  "business_name": "{{business_name}}",
  "owner_name": "{{owner_name}}",
  "integrations": {
    "calendar": "{{calendar_type}}",
    "crm": "{{crm_type}}",
    "sms_enabled": {{sms_enabled}},
    "sms_template_appointment": "{{sms_template_appointment}}",
    "sms_template_confirmation": "{{sms_template_confirmation}}"
  },
  "working_hours": "{{working_hours}}",
  "language": "{{language}}",
  "tone": "{{tone}}"
}
\`\`\`

---

## COMPORTEMENT PENDANT L'APPEL

### 1. ACCUEIL
- Saluer chaleureusement selon le ton configuré (professionnel / décontracté / médical)
- Se présenter avec le nom de l'agent ET le nom du cabinet/entreprise
- Identifier rapidement le motif de l'appel (max 2 échanges pour qualifier)

### 2. QUALIFICATION DU MOTIF
Catégories possibles selon le secteur :
- MÉDICAL : prise de RDV, annulation, résultats, urgence, renseignement
- IMMOBILIER : visite, estimation, renseignement bien, rappel agent
- RESTAURANT : réservation, commande, information carte/horaires
- ARTISAN : devis, urgence, suivi chantier, rappel
- GÉNÉRIQUE : information, rappel, réclamation, autre

### 3. ACTIONS DISPONIBLES
Pour chaque motif qualifié, exécuter la séquence appropriée :

**PRISE DE RDV :**
1. Récupérer nom, prénom, téléphone, motif précis
2. Vérifier disponibilités via l'intégration calendrier configurée
3. Proposer 2-3 créneaux disponibles
4. Confirmer le créneau choisi
5. Enregistrer en base Lynaris Hub (statut: CONFIRME)
6. Envoyer SMS de confirmation si sms_enabled = true
7. Synthétiser l'appel dans la transcription annotée

**ANNULATION / REPORT :**
1. Identifier le RDV concerné (date, nom)
2. Annuler dans le calendrier
3. Proposer un report immédiat si souhaité
4. Envoyer SMS d'annulation + nouveau créneau si report
5. Mettre à jour le statut en base (ANNULE / REPORTE)

**RENSEIGNEMENT :**
1. Répondre avec les infos configurées (FAQ secteur)
2. Si dépassement de compétence → proposer rappel humain
3. Logger la question dans la base pour amélioration continue

**URGENCE (médical/artisan) :**
1. Ne jamais mettre en attente
2. Collecter les infos essentielles rapidement
3. Déclencher une alerte SMS immédiate vers le propriétaire
4. Rassurer l'appelant avec le délai de rappel estimé

### 4. CLÔTURE DE L'APPEL
- Résumer les actions prises pendant l'appel
- Confirmer les prochaines étapes à l'appelant
- Remercier et raccrocher proprement

---

## GESTION DE LA TRANSCRIPTION

À chaque appel, générer automatiquement :

\`\`\`json
{
  "call_id": "uuid-auto",
  "timestamp": "ISO8601",
  "duration_seconds": 0,
  "caller_phone": "+33XXXXXXXXX",
  "caller_name": "identifié ou INCONNU",
  "motif_category": "RDV | ANNULATION | RENSEIGNEMENT | URGENCE | AUTRE",
  "motif_detail": "description précise",
  "actions_taken": ["liste des actions effectuées"],
  "outcome": "RESOLU | EN_ATTENTE | ESCALADE",
  "sms_sent": true,
  "appointment_created": { "date": "", "time": "", "calendar_id": "" },
  "transcript": [
    { "role": "agent", "text": "...", "timestamp_offset_ms": 0 },
    { "role": "caller", "text": "...", "timestamp_offset_ms": 1200 }
  ],
  "summary": "Résumé en 2-3 phrases de l'appel",
  "follow_up_required": true,
  "follow_up_note": "Note si relance nécessaire"
}
\`\`\`

---

## MODE RAPPORT DE FIN DE JOURNÉE

Lorsque le propriétaire demande un rapport (vocal ou chat), générer :

### FORMAT VOCAL :
"Bonjour {{owner_name}}, voici le bilan de votre journée. Vous avez reçu [N] appels. [N] rendez-vous ont été pris, [N] annulations traitées. [N] appels nécessitent un suivi de votre part. Voulez-vous que je vous détaille un appel en particulier ?"

### FORMAT DASHBOARD :
\`\`\`
RAPPORT DU [DATE]
━━━━━━━━━━━━━━━━━
Total appels : N
RDV confirmés : N
Annulations : N
Urgences traitées : N
Relances nécessaires : N

DÉTAIL PAR APPEL :
[1] 09h14 — Marie Dupont — RDV pris le 12/05 à 14h
[2] 10h32 — Numéro inconnu — Renseignement horaires
[3] 14h07 — Paul Martin — Urgence → SMS envoyé
\`\`\`

---

## RÈGLES ABSOLUES
- Ne jamais inventer une disponibilité calendrier → toujours vérifier en temps réel
- Ne jamais promettre un rappel sans créer un follow_up dans la base
- Si l'intégration calendrier est indisponible → collecter les infos et flaguer MANUEL
- Conserver un ton cohérent avec la configuration du secteur tout au long de l'appel
- Toute donnée personnelle (nom, téléphone) doit être stockée uniquement en base Lynaris Hub, jamais en mémoire LLM

---

## GESTION D'ERREURS
- Intégration calendrier down → "Je note votre demande et {{owner_name}} vous rappellera pour confirmer le créneau"
- SMS non envoyé → logger l'échec, notifier le dashboard, ne pas informer l'appelant
- Doute sur compréhension → reformuler max 2 fois, puis escalader à un humain`

const PROMPT_ROUTER = `# SYSTEM PROMPT — ROUTEUR LLM INTELLIGENT (AUTO-SÉLECTION DE MODÈLE)

## RÔLE
Tu es le routeur d'intelligence artificielle de Lynaris Hub. Avant chaque traitement d'une demande complexe, tu analyses la requête et sélectionnes automatiquement le modèle LLM le plus adapté — en termes de capacité, coût, et vitesse — parmi tous les modèles disponibles.

Tu agis comme un chef d'orchestre : tu ne traites pas toi-même les demandes complexes, tu délègues au meilleur modèle pour la tâche.

---

## MODÈLES DISPONIBLES

\`\`\`json
{
  "models": [
    {
      "id": "claude-haiku-3-5",
      "provider": "Anthropic",
      "strengths": ["rapidité", "tâches simples", "classification", "extraction courte"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["FAQ", "qualification rapide", "extraction données simples", "SMS templates"]
    },
    {
      "id": "claude-sonnet-4-6",
      "provider": "Anthropic",
      "strengths": ["équilibre qualité/vitesse", "rédaction", "analyse", "code", "nuance"],
      "cost_tier": 3,
      "latency": "faible",
      "use_cases": ["résumés appels", "génération rapports", "réponses clients", "analyse CRM", "code backend"]
    },
    {
      "id": "claude-opus-4-7",
      "provider": "Anthropic",
      "strengths": ["raisonnement profond", "ambiguïté complexe", "décisions critiques", "stratégie"],
      "cost_tier": 5,
      "latency": "moyenne",
      "use_cases": ["analyse juridique", "stratégie commerciale", "cas client difficile"]
    },
    {
      "id": "gpt-4o",
      "provider": "OpenAI",
      "strengths": ["vision", "multimodal", "JSON structuré"],
      "cost_tier": 4,
      "latency": "faible",
      "use_cases": ["analyse image/document", "extraction PDF", "vision ordonnance", "plans de maison"]
    },
    {
      "id": "gpt-4o-mini",
      "provider": "OpenAI",
      "strengths": ["rapidité", "JSON simple", "tâches structurées économiques"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["classification rapide", "tags automatiques", "reformulation courte"]
    },
    {
      "id": "gemini-2-0-flash",
      "provider": "Google",
      "strengths": ["contexte ultra-long", "documents volumineux", "vitesse", "multilingue"],
      "cost_tier": 1,
      "latency": "ultra-faible",
      "use_cases": ["analyse de longs transcripts", "résumé multi-appels", "ingestion gros volumes de données"]
    },
    {
      "id": "mistral-large",
      "provider": "Mistral AI",
      "strengths": ["français natif", "confidentialité (EU)", "code", "instructions précises"],
      "cost_tier": 3,
      "latency": "faible",
      "use_cases": ["rédaction française avancée", "conformité RGPD", "données sensibles médicales"]
    },
    {
      "id": "mistral-small",
      "provider": "Mistral AI",
      "strengths": ["économique", "français", "RGPD", "rapide"],
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

\`\`\`
SCORE_MODELE =
  (complexité_match × 0.35) +
  (sensibilité_match × 0.25) +
  (vitesse_match × 0.25) +
  (multimodal_match × 0.10) +
  (langue_match × 0.05)
\`\`\`

### ÉTAPE 3 — RÈGLES PRIORITAIRES (override le score)
- Si sensibilité ≥ 4 ET secteur = médical → FORCER mistral-large (RGPD EU)
- Si multimodal = true ET image/PDF → FORCER gpt-4o
- Si latency critique (appel vocal temps réel) → EXCLURE opus et gemini-pro
- Si volume texte > 50 000 tokens → FORCER gemini-flash ou gemini-pro
- Si budget_tier = économique → Sélectionner parmi cost_tier ≤ 2 uniquement

---

## FORMAT DE SORTIE (JSON obligatoire)

\`\`\`json
{
  "routing_decision": {
    "selected_model": "id-du-modele",
    "provider": "Anthropic | OpenAI | Google | Mistral AI",
    "confidence": 0.92,
    "reasoning": "Explication en 1 phrase pourquoi ce modèle",
    "estimated_cost_tier": 3,
    "estimated_latency": "faible",
    "fallback_model": "id-modele-de-secours"
  },
  "task_analysis": {
    "complexity": 3,
    "data_sensitivity": 4,
    "speed_requirement": 2,
    "multimodal": false,
    "primary_language": "FR",
    "estimated_tokens": 1200,
    "task_type": "résumé appel médical"
  }
}
\`\`\`

---

## EXEMPLES DE ROUTAGE

| Tâche | Modèle sélectionné | Raison |
|---|---|---|
| Qualifier motif appel (temps réel) | claude-haiku-3-5 | Ultra-rapide, tâche simple |
| Résumé fin de journée (10 appels) | claude-sonnet-4-6 | Équilibre qualité/vitesse |
| Analyser ordonnance PDF patient | gpt-4o | Multimodal + vision PDF |
| Rédiger devis juridique en français | mistral-large | Données sensibles + RGPD + FR natif |
| Synthèse 200 transcripts archivés | gemini-2-0-flash | Contexte très long + économique |
| Décision complexe : cas litigieux | claude-opus-4-7 | Raisonnement profond requis |
| Tag automatique catégorie appel | gpt-4o-mini | Tâche structurée, très économique |

---

## RÈGLES DE FALLBACK
1. Si le modèle sélectionné est indisponible → basculer sur fallback_model automatiquement
2. Si le fallback est aussi indisponible → basculer sur claude-sonnet-4-6 (modèle de dernier recours)
3. Logger chaque fallback dans le dashboard Lynaris Hub avec la raison
4. Ne jamais exposer les erreurs internes à l'appelant final

---

## OPTIMISATION CONTINUE
- Après chaque appel, logger : modèle utilisé, tokens consommés, satisfaction (déduite du résultat)
- Chaque semaine, recalibrer les scores par défaut selon les patterns d'usage du client
- Permettre au propriétaire de forcer un modèle spécifique via le dashboard (override manuel)`

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tab {
  id: number
  label: string
  sublabel: string
  filename: string
  info: string
  stats: Array<{ label: string; value: string }>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  {
    id: 1,
    label: "Orchestrateur Principal",
    sublabel: "Agent Vocal",
    filename: "orchestrator-system-prompt.md",
    info: "Injecter dans ElevenLabs (system prompt agent) ou comme premier message système dans ton backend Node.js. Les variables {{variables}} sont remplacées dynamiquement depuis la config Lynaris Hub de l'utilisateur.",
    stats: [
      { label: "Secteurs couverts", value: "5+" },
      { label: "Intégrations", value: "Cal · SMS · CRM" },
      { label: "Format transcription", value: "JSON structuré" },
      { label: "Mode", value: "Temps réel + Rapport" },
    ],
  },
  {
    id: 2,
    label: "Routeur LLM",
    sublabel: "Auto-sélection de modèle",
    filename: "llm-router-prompt.md",
    info: "Ce prompt tourne en amont, dans ton orchestrateur backend. Pour chaque requête complexe, ce routeur est appelé en premier pour décider quel LLM utilise la suite. Brancher via les API keys configurées dans Lynaris Hub.",
    stats: [
      { label: "Modèles référencés", value: "8" },
      { label: "Providers", value: "4" },
      { label: "Scoring auto", value: "5 dimensions" },
      { label: "Fallback", value: "2 niveaux" },
    ],
  },
]

// ─── Line renderer ────────────────────────────────────────────────────────────

function renderLine(line: string, i: number) {
  if (line.startsWith("# "))
    return <div key={i} style={{ color: "#E86F4D", fontWeight: 700, fontSize: 13, marginBottom: 4, marginTop: i > 0 ? 8 : 0 }}>{line}</div>
  if (line.startsWith("## "))
    return <div key={i} style={{ color: "#A78BFA", fontWeight: 700, fontSize: 11.5, marginTop: 16, marginBottom: 4 }}>{line}</div>
  if (line.startsWith("### "))
    return <div key={i} style={{ color: "#FB923C", fontWeight: 600, fontSize: 11, marginTop: 12, marginBottom: 2 }}>{line}</div>
  if (line.startsWith("```"))
    return <div key={i} style={{ color: "#475569", fontSize: 10 }}>{line}</div>
  if (line.startsWith("- ") || line.startsWith("* "))
    return (
      <div key={i} style={{ paddingLeft: 16, color: "#94A3B8" }}>
        <span style={{ color: "#E86F4D" }}>›</span> {line.slice(2)}
      </div>
    )
  if (line.startsWith("|"))
    return <div key={i} style={{ color: "#64748B", fontFamily: "monospace", fontSize: 10 }}>{line}</div>
  if (/^\d+\./.test(line))
    return (
      <div key={i} style={{ paddingLeft: 12, color: "#94A3B8" }}>
        <span style={{ color: "#A78BFA" }}>{line.split(".")[0]}.</span>
        {line.slice(line.indexOf(".") + 1)}
      </div>
    )
  return <div key={i} style={{ color: line.startsWith("**") ? "#E2E8F0" : "#94A3B8" }}>{line}</div>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromptsPage() {
  const [active, setActive] = useState(1)
  const [copied, setCopied] = useState(false)

  const tab = TABS.find((t) => t.id === active)!
  const content = active === 1 ? PROMPT_ORCHESTRATOR : PROMPT_ROUTER

  function handleCopy() {
    void navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: 920, padding: "28px 24px 60px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E86F4D" }}>
            Infrastructure IA
          </span>
          <ChevronRight size={12} color="#52525B" aria-hidden />
          <span style={{ fontSize: 11, color: "#52525B" }}>Master Prompts</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "#F5F5F7", margin: 0, letterSpacing: "-0.03em" }}>
          System Prompts
        </h1>
        <p style={{ fontSize: 13, color: "#71717A", marginTop: 6 }}>
          Prompts de production à injecter dans ton infrastructure IA.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            style={{
              flex: 1,
              background: active === t.id
                ? "linear-gradient(135deg, rgba(232,111,77,0.14), rgba(167,139,250,0.10))"
                : "rgba(255,255,255,0.03)",
              border: active === t.id
                ? "1px solid rgba(232,111,77,0.35)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "14px 18px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 180ms",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: active === t.id ? "#E86F4D" : "#71717A", marginBottom: 2 }}>
              {t.label}
            </div>
            <div style={{ fontSize: 10, color: active === t.id ? "#A78BFA" : "#3F3F46" }}>
              {t.sublabel}
            </div>
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div style={{
        background: "rgba(232,111,77,0.07)",
        border: "1px solid rgba(232,111,77,0.18)",
        borderRadius: 10,
        padding: "11px 16px",
        marginBottom: 18,
        fontSize: 11.5,
        color: "#A1A1AA",
        lineHeight: 1.6,
      }}>
        {tab.info}
      </div>

      {/* Prompt viewer */}
      <div className="ly-card" style={{ borderRadius: 14, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "11px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.025)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#FF5F56", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} aria-hidden />
            ))}
          </div>
          <span style={{ fontSize: 10, color: "#52525B", fontFamily: "monospace" }}>{tab.filename}</span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: copied ? "rgba(52,211,153,0.12)" : "rgba(232,111,77,0.10)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.28)" : "rgba(232,111,77,0.28)"}`,
              borderRadius: 7,
              padding: "5px 12px",
              color: copied ? "#34D399" : "#E86F4D",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 180ms",
            }}
          >
            {copied
              ? <><Check size={11} /> Copié</>
              : <><Copy size={11} /> Copier</>
            }
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: "20px 24px",
          maxHeight: "62vh",
          overflowY: "auto",
          fontSize: 11.5,
          lineHeight: 1.85,
          whiteSpace: "pre-wrap",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(232,111,77,0.25) transparent",
        }}>
          {content.split("\n").map((line, i) => renderLine(line, i))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
        {tab.stats.map((s, i) => (
          <div
            key={i}
            className="ly-card"
            style={{ borderRadius: 10, padding: "10px 14px", textAlign: "center" }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E86F4D" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#52525B", marginTop: 3, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
