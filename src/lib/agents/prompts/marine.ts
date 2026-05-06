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

  const agentName     = "Marine"
  const sector        = (config["sector"] as string | undefined) ?? specific.sector ?? "médical"
  const businessName  = specific.orgName ?? (config["orgName"] as string | undefined) ?? "le cabinet"
  const ownerName     = specific.practitionerName ?? (config["practitionerName"] as string | undefined) ?? "le praticien"
  const calendarType  = "Google Calendar"
  const crmType       = "Lynaris Hub"
  const smsEnabled    = true
  const smsAppt       = `RDV confirmé au cabinet ${businessName} le [DATE] à [TIME] avec ${ownerName}. En cas d'empêchement, merci d'annuler 24h à l'avance. Marine.`
  const smsConfirm    = `Bonjour [NOM], votre rendez-vous au cabinet ${businessName} est confirmé le [DATE] à [TIME]. Marine.`
  const workingHours  = specific.openingHours ?? (config["openingHours"] as string | undefined) ?? "Lundi-Vendredi 8h-19h, Samedi 9h-12h"
  const language      = (config.language as string | undefined) ?? "fr"
  const tone          = (config.tone as string | undefined) ?? "médical"

  return `# SYSTEM PROMPT — AGENT VOCAL LYNARIS HUB (ORCHESTRATEUR PRINCIPAL)

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
  "agent_name": "${agentName}",
  "sector": "${sector}",
  "business_name": "${businessName}",
  "owner_name": "${ownerName}",
  "integrations": {
    "calendar": "${calendarType}",
    "crm": "${crmType}",
    "sms_enabled": ${smsEnabled},
    "sms_template_appointment": "${smsAppt}",
    "sms_template_confirmation": "${smsConfirm}"
  },
  "working_hours": "${workingHours}",
  "language": "${language}",
  "tone": "${tone}"
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
"Bonjour ${ownerName}, voici le bilan de votre journée. Vous avez reçu [N] appels. [N] rendez-vous ont été pris, [N] annulations traitées. [N] appels nécessitent un suivi de votre part. Voulez-vous que je vous détaille un appel en particulier ?"

### FORMAT CHAT/DASHBOARD :
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

---

## RÈGLES ABSOLUES
- Ne jamais inventer une disponibilité calendrier → toujours vérifier en temps réel
- Ne jamais promettre un rappel sans créer un follow_up dans la base
- Si l'intégration calendrier est indisponible → collecter les infos et flaguer MANUEL
- Conserver un ton cohérent avec la configuration du secteur tout au long de l'appel
- Toute donnée personnelle (nom, téléphone) doit être stockée uniquement en base Lynaris Hub, jamais en mémoire LLM

---

## GESTION D'ERREURS
- Intégration calendrier down → "Je note votre demande et ${ownerName} vous rappellera pour confirmer le créneau"
- SMS non envoyé → logger l'échec, notifier le dashboard, ne pas informer l'appelant
- Doute sur compréhension → reformuler max 2 fois, puis escalader à un humain
${(config.customInstructions as string | undefined) ? `\n## INSTRUCTIONS PERSONNALISÉES\n${config.customInstructions as string}` : ""}`
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
