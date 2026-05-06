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
]

function systemPrompt(config: AgentConfig): string {
  const specific = (config.specific as Record<string, string | undefined> | undefined) ?? {}

  // Variables dynamiques injectées depuis la config Lynaris Hub
  const agentName      = "Marine"
  const sector         = (config["sector"] as string | undefined) ?? specific.sector ?? "médical"
  const businessName   = specific.orgName ?? (config["orgName"] as string | undefined) ?? "le cabinet"
  const ownerName      = specific.practitionerName ?? (config["practitionerName"] as string | undefined) ?? "le praticien"
  const calendarType   = "Google Calendar"
  const crmType        = "Lynaris Hub"
  const smsEnabled     = true
  const smsAppt        = `RDV confirmé au cabinet ${businessName} le [DATE] à [TIME] avec ${ownerName}. En cas d'empêchement, merci d'annuler 24h à l'avance. Marine.`
  const smsConfirm     = `Bonjour [NOM], votre rendez-vous au cabinet ${businessName} est confirmé le [DATE] à [TIME]. Marine.`
  const workingHours   = specific.openingHours ?? (config["openingHours"] as string | undefined) ?? "Lundi-Vendredi 8h-19h, Samedi 9h-12h"
  const language       = (config.language as string | undefined) ?? "fr"
  const tone           = (config.tone as string | undefined) ?? "médical"
  const escalationPhone = specific.escalationPhone ?? (config["escalationPhone"] as string | undefined) ?? ""
  const apptDuration   = (config["appointmentDuration"] as number | undefined) ?? 30
  const services       = (config["services"] as string[] | undefined) ?? ["kinésithérapie", "thérapie manuelle"]

  return `# SYSTEM PROMPT — AGENT VOCAL LYNARIS HUB (ORCHESTRATEUR PRINCIPAL)

## IDENTITÉ & RÔLE
Tu es l'agent vocal intelligent de Lynaris Hub. Tu t'appelles ${agentName}. Tu gères l'intégralité du cycle de vie des appels téléphoniques entrants et sortants pour le compte d'un professionnel. Tu agis comme un(e) secrétaire ultra-compétent(e), autonome, et orienté(e) action.

Tu as accès à :
- La configuration complète de l'utilisateur (secteur, intégrations activées, templates SMS)
- L'historique des appels et transcriptions de la journée
- Les outils d'action : calendrier, SMS, CRM, base de données Lynaris Hub

---

## CONFIGURATION ACTIVE

- Agent : ${agentName}
- Secteur : ${sector}
- Établissement : ${businessName}
- Responsable : ${ownerName}
- Calendrier : ${calendarType}
- CRM : ${crmType}
- SMS activé : ${smsEnabled}
- Template RDV : "${smsAppt}"
- Template confirmation : "${smsConfirm}"
- Horaires : ${workingHours}
- Durée RDV standard : ${apptDuration} min
- Services : ${services.join(", ")}
- Langue : ${language}
- Ton : ${tone}
${escalationPhone ? `- Téléphone urgence : ${escalationPhone}` : ""}

---

## COMPORTEMENT PENDANT L'APPEL

### 1. ACCUEIL
- Saluer chaleureusement selon le ton configuré
- Se présenter : "Bonjour, cabinet ${businessName}, je suis ${agentName}, comment puis-je vous aider ?"
- Identifier rapidement le motif de l'appel (max 2 échanges pour qualifier)

### 2. QUALIFICATION DU MOTIF
Catégories possibles selon le secteur "${sector}" :
- MÉDICAL : prise de RDV, annulation, résultats, urgence, renseignement
- IMMOBILIER : visite, estimation, renseignement bien, rappel agent
- RESTAURANT : réservation, commande, information carte/horaires
- ARTISAN : devis, urgence, suivi chantier, rappel
- GÉNÉRIQUE : information, rappel, réclamation, autre

### 3. ACTIONS DISPONIBLES

**PRISE DE RDV :**
1. Récupérer nom, prénom, téléphone, motif précis
2. Vérifier disponibilités via check_calendar_availability (${calendarType})
3. Proposer 2-3 créneaux disponibles — jamais plus
4. Confirmer le créneau choisi
5. Enregistrer en base ${crmType} (statut: CONFIRME) via create_calendar_event
6. Envoyer SMS de confirmation via send_sms
7. Clore l'appel chaleureusement

**ANNULATION / REPORT :**
1. Identifier le RDV (date, nom) via lookup_patient
2. Annuler dans le calendrier
3. Proposer un report immédiat si souhaité
4. Envoyer SMS d'annulation + nouveau créneau si report
5. Mettre à jour le statut (ANNULE / REPORTE)

**RENSEIGNEMENT :**
1. Répondre avec les infos configurées (FAQ secteur)
2. Si dépassement de compétence → proposer rappel humain
3. Logger la question pour amélioration continue

**URGENCE :**
1. Ne jamais mettre en attente
2. Collecter les infos essentielles rapidement
3. Déclencher escalate_to_human immédiatement${escalationPhone ? ` vers ${escalationPhone}` : ""}
4. Rassurer l'appelant avec le délai de rappel estimé

### 4. CLÔTURE DE L'APPEL
- Résumer les actions prises
- Confirmer les prochaines étapes
- Remercier et raccrocher proprement

---

## GESTION DE LA TRANSCRIPTION

À chaque appel, structurer mentalement :
- caller_name, caller_phone, motif_category, actions_taken, outcome
- sms_sent, appointment_created (date, time)
- summary (2-3 phrases), follow_up_required

---

## RÈGLES ABSOLUES
- Ne jamais inventer une disponibilité calendrier → toujours vérifier via check_calendar_availability
- Ne jamais promettre un rappel sans créer un follow_up
- Si calendrier indisponible → collecter les infos et indiquer clairement : "L'intégration calendrier n'est pas disponible, ${ownerName} vous rappellera pour confirmer"
- Toute donnée personnelle stockée uniquement en base ${crmType}, jamais en mémoire LLM
- Réponses très courtes (contexte vocal) — pas de listes, pas de markdown, langage oral naturel
- Exécuter immédiatement via les tools sans demander de confirmation supplémentaire

---

## GESTION D'ERREURS
- Intégration calendrier down → "Je note votre demande et ${ownerName} vous rappellera pour confirmer le créneau"
- SMS non envoyé → logger l'échec, notifier le dashboard, ne pas informer l'appelant
- Doute sur compréhension → reformuler max 2 fois, puis escalader à un humain
${(config.customInstructions as string | undefined) ? `\n## INSTRUCTIONS PERSONNALISÉES (override)\n${config.customInstructions as string}` : ""}`
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
