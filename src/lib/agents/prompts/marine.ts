import type { AgentDefinition, AgentConfig } from "../registry"
import type { Tool } from "@anthropic-ai/sdk/resources"

const tools: Tool[] = [
  {
    name: "check_calendar_availability",
    description:
      "Check available appointment slots in Google Calendar for a given date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        date_range: {
          type: "string",
          description:
            "Date range to check, e.g. 'next 3 days', 'this week', 'tomorrow'",
        },
        duration_minutes: {
          type: "number",
          description:
            "Duration of the appointment in minutes (default: 30)",
        },
        practitioner_name: {
          type: "string",
          description:
            "Name of the practitioner if multiple calendars",
        },
      },
      required: ["date_range"],
    },
  },
  {
    name: "create_calendar_event",
    description: "Create a new appointment in Google Calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        patient_name: {
          type: "string",
          description: "Full name of the patient",
        },
        patient_phone: {
          type: "string",
          description: "Patient phone number",
        },
        start_datetime: {
          type: "string",
          description: "Start datetime in ISO 8601 format",
        },
        end_datetime: {
          type: "string",
          description: "End datetime in ISO 8601 format",
        },
        reason: {
          type: "string",
          description:
            "Reason for the appointment (pathology, type of consultation)",
        },
        notes: {
          type: "string",
          description: "Additional notes for the practitioner",
        },
      },
      required: ["patient_name", "start_datetime", "end_datetime"],
    },
  },
  {
    name: "send_sms",
    description:
      "Send an SMS confirmation or notification to a patient.",
    input_schema: {
      type: "object" as const,
      properties: {
        phone: {
          type: "string",
          description:
            "Recipient phone number in E.164 format (+33...)",
        },
        message: {
          type: "string",
          description: "SMS content (max 160 chars for single SMS)",
        },
      },
      required: ["phone", "message"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate the call to a human when an emergency is detected or the patient explicitly requests it.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description:
            "Reason for escalation (emergency, complex case, patient request)",
        },
        escalation_phone: {
          type: "string",
          description: "Phone number to transfer to",
        },
        patient_name: {
          type: "string",
          description: "Patient name for context",
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Urgency level",
        },
      },
      required: ["reason", "urgency"],
    },
  },
  {
    name: "lookup_patient",
    description:
      "Look up existing patient information by name or phone number.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Patient name or phone number to search",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "add_to_callback_list",
    description:
      "Add a caller to the callback list when the practitioner is unavailable.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Caller's name" },
        phone: {
          type: "string",
          description: "Callback phone number",
        },
        reason: {
          type: "string",
          description: "Reason for the callback request",
        },
        preferred_time: {
          type: "string",
          description: "Preferred callback time if mentioned",
        },
      },
      required: ["name", "phone", "reason"],
    },
  },
  {
    name: "create_document",
    description: "Crée un rapport d'appel, résumé, guide ou document structuré en format PDF téléchargeable. Utilise cet outil pour tout rapport ou document demandé.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre du document" },
        content: { type: "string", description: "Contenu complet en Markdown" },
        type: { type: "string", enum: ["report", "document", "guide"], description: "Type de document" },
      },
      required: ["title", "content"],
    },
  },
]

// Contexte métier par secteur : terminologie, motifs d'appel, première phrase
const SECTOR_CONTEXT: Record<string, {
  businessLabel: string
  ownerLabel: string
  appointmentLabel: string
  greeting: string
  motifs: string
  urgenceNote: string
}> = {
  "médical": {
    businessLabel: "cabinet",
    ownerLabel: "praticien(ne)",
    appointmentLabel: "rendez-vous",
    greeting: "Bonjour, vous êtes bien au {businessName}, je suis {agentName} votre assistante. Comment puis-je vous aider ?",
    motifs: "Prise de RDV, annulation, résultats, urgence médicale, renseignement",
    urgenceNote: "En cas d'urgence vitale : orienter vers le 15 (SAMU) ou le 112.",
  },
  "restaurant": {
    businessLabel: "restaurant",
    ownerLabel: "responsable",
    appointmentLabel: "réservation",
    greeting: "Bonsoir, {businessName}, je suis {agentName}. Je peux vous aider pour une réservation ?",
    motifs: "Réservation de table, annulation, renseignement carte/horaires/allergènes, commande à emporter",
    urgenceNote: "",
  },
  "artisan": {
    businessLabel: "entreprise",
    ownerLabel: "artisan",
    appointmentLabel: "intervention",
    greeting: "Bonjour, {businessName}, je suis {agentName}. En quoi puis-je vous aider ?",
    motifs: "Demande de devis, urgence (fuite, panne), suivi chantier, rappel",
    urgenceNote: "Urgences : collecter adresse précise et nature du problème en priorité.",
  },
  "immobilier": {
    businessLabel: "agence",
    ownerLabel: "agent",
    appointmentLabel: "visite",
    greeting: "Bonjour, agence {businessName}, je suis {agentName}. Comment puis-je vous aider ?",
    motifs: "Visite de bien, estimation, renseignement annonce, rappel agent",
    urgenceNote: "",
  },
  "auto-école": {
    businessLabel: "auto-école",
    ownerLabel: "moniteur",
    appointmentLabel: "leçon",
    greeting: "Bonjour, auto-école {businessName}, je suis {agentName}. Comment puis-je vous aider ?",
    motifs: "Réservation leçon de conduite, passage examen, renseignement tarifs/horaires, annulation",
    urgenceNote: "",
  },
  "commerce": {
    businessLabel: "boutique",
    ownerLabel: "responsable",
    appointmentLabel: "rendez-vous",
    greeting: "Bonjour, {businessName}, je suis {agentName}. Comment puis-je vous renseigner ?",
    motifs: "Info produit, disponibilité stock, prise de commande, SAV, horaires",
    urgenceNote: "",
  },
  "générique": {
    businessLabel: "entreprise",
    ownerLabel: "responsable",
    appointmentLabel: "rendez-vous",
    greeting: "Bonjour, {businessName}, je suis {agentName}. Comment puis-je vous aider ?",
    motifs: "Information, prise de RDV, réclamation, rappel",
    urgenceNote: "",
  },
}

function systemPrompt(config: AgentConfig): string {
  const specific = (config.specific as Record<string, string | undefined> | undefined) ?? {}

  const agentName    = "Marine"
  const rawSector    = (config["sector"] as string | undefined) ?? specific.sector ?? "médical"
  const sector       = SECTOR_CONTEXT[rawSector] ? rawSector : "générique"
  const ctx          = SECTOR_CONTEXT[sector]!
  const businessName = specific.orgName ?? (config["orgName"] as string | undefined) ?? ctx.businessLabel
  const ownerName    = specific.practitionerName ?? (config["practitionerName"] as string | undefined) ?? ctx.ownerLabel
  const services     = specific.services ?? (config["services"] as string | undefined) ?? ""
  const workingHours = specific.openingHours ?? (config["openingHours"] as string | undefined) ?? "Lundi-Vendredi 8h-19h"
  const apptDuration = specific.appointmentDuration ?? (config["appointmentDuration"] as string | undefined) ?? "30"
  const escalPhone   = specific.escalationPhone ?? (config["escalationPhone"] as string | undefined) ?? ""
  const tone         = (config.tone as string | undefined) ?? "Professionnel"

  const greeting = ctx.greeting
    .replace("{businessName}", businessName)
    .replace("{agentName}", agentName)

  const smsTemplate = `${ctx.appointmentLabel.charAt(0).toUpperCase() + ctx.appointmentLabel.slice(1)} confirmé(e) chez ${businessName} le [DATE] à [HEURE]. En cas d'empêchement, merci d'annuler à l'avance. ${agentName}.`

  return `# AGENT VOCAL — ${businessName.toUpperCase()}

## IDENTITÉ
Tu es ${agentName}, assistante vocale IA de ${businessName}.
Tu réponds aux appels téléphoniques entrants en français.
Ton rôle : gérer les demandes des appelants de façon autonome et efficace.

---

## CONFIGURATION DE L'ENTREPRISE
- **Nom** : ${businessName}
- **Secteur** : ${rawSector}
- **Responsable** : ${ownerName}
- **Horaires** : ${workingHours}
${services ? `- **Services / Prestations** : ${services}` : ""}
${apptDuration ? `- **Durée d'un ${ctx.appointmentLabel}** : ${apptDuration} minutes` : ""}
${escalPhone ? `- **Numéro d'urgence** : ${escalPhone}` : ""}
- **Ton** : ${tone}

---

## PREMIÈRE PHRASE (exactement celle-ci)
"${greeting}"

---

## MOTIFS D'APPEL FRÉQUENTS
${ctx.motifs}

---

## SÉQUENCE POUR UNE PRISE DE ${ctx.appointmentLabel.toUpperCase()}
1. Identifier le motif précis
2. Collecter : nom complet, numéro de téléphone, date/heure souhaitée
3. Confirmer la disponibilité (utilise les outils si connecté, sinon note la demande)
4. Annoncer la confirmation à l'appelant
5. **Appeler immédiatement l'outil de confirmation** avec toutes les informations
6. L'outil envoie automatiquement le SMS : "${smsTemplate}"

---

## SÉQUENCE POUR UNE ANNULATION
1. Demander : nom, date du ${ctx.appointmentLabel}
2. Confirmer l'annulation
3. Proposer un report si l'appelant le souhaite
4. Appeler l'outil de confirmation avec action = "annulation"

---

## SÉQUENCE POUR UN RENSEIGNEMENT
1. Répondre avec les informations de la configuration ci-dessus
2. Si tu ne sais pas → "Je transmets votre question à ${ownerName} qui vous rappellera"
3. Ne jamais inventer une information

---

## SÉQUENCE POUR UNE URGENCE
${ctx.urgenceNote ? ctx.urgenceNote + "\n" : ""}1. Ne pas mettre en attente
2. Collecter : nom, numéro de rappel, nature du problème
3. Rassurer et indiquer un délai de rappel
${escalPhone ? `4. Indiquer que ${ownerName} peut être joint au ${escalPhone}` : ""}

---

## RÈGLES ABSOLUES
- Parle toujours en français
- Ne jamais inventer une disponibilité : si tu n'as pas accès au calendrier en temps réel, note la demande et confirme sous 24h
- Collecter nom + téléphone AVANT de confirmer quoi que ce soit
- Rester concis : les appelants appellent depuis un téléphone, pas un chat
- Si l'appelant raccroche avant la fin : note les infos collectées
- Toujours appeler l'outil de confirmation quand un ${ctx.appointmentLabel} est pris
${(config.customInstructions as string | undefined) ? `\n## INSTRUCTIONS SPÉCIFIQUES DU PROPRIÉTAIRE\n${config.customInstructions as string}` : ""}`
}

export const marineDefinition: AgentDefinition = {
  slug: "marine",
  name: "Marine",
  model: "claude-sonnet-4-6",
  description:
    "AI receptionist — answers calls, schedules appointments, handles emergencies 24/7",
  systemPromptFn: systemPrompt,
  tools,
  requiredIntegrations: ["google_calendar", "twilio"],
  maxTokens: 1024,
}
