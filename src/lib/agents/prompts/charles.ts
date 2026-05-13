import type { AgentDefinition, AgentConfig } from "../registry"
import type { Tool } from "@anthropic-ai/sdk/resources"

const tools: Tool[] = [
  {
    name: "delegate_to_agent",
    description:
      "Delegate a specific task to a specialized agent (Lou, Marine, Elio, Mae, Max, Nova, or Alba).",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_slug: {
          type: "string",
          enum: [
            "marine",
            "lou",
            "elio",
            "mae",
            "max",
            "nova",
            "alba",
          ],
          description: "The agent to delegate to",
        },
        task_description: {
          type: "string",
          description: "Clear description of the task for the agent",
        },
        context: {
          type: "object" as const,
          description: "Additional context the agent needs",
          properties: {},
          additionalProperties: true,
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description: "Task priority",
        },
      },
      required: ["agent_slug", "task_description"],
    },
  },
  {
    name: "show_email_format_picker",
    description: "Display a visual email format picker to the user. Call this BEFORE delegating any email to Mae, so the user can select Lynaris, Minimal, Corporate, or no format.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "query_agent_logs",
    description: "Retrieve what a specific agent has done recently.",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_slug: {
          type: "string",
          description: "Agent to query logs for",
        },
        since: {
          type: "string",
          description:
            "Time period, e.g. 'last 24h', 'last week', 'today'",
        },
        action_type: {
          type: "string",
          description: "Filter by action type (optional)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of logs to return (default: 10)",
        },
      },
      required: ["agent_slug"],
    },
  },
  {
    name: "read_calendar",
    description: "Read upcoming calendar events.",
    input_schema: {
      type: "object" as const,
      properties: {
        days_ahead: {
          type: "number",
          description:
            "Number of days to look ahead (default: 7)",
        },
        calendar_id: {
          type: "string",
          description:
            "Specific calendar ID (optional, defaults to primary)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_event",
    description: "Create a calendar event.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Event title" },
        start_datetime: {
          type: "string",
          description: "ISO 8601 start",
        },
        end_datetime: {
          type: "string",
          description: "ISO 8601 end",
        },
        description: {
          type: "string",
          description: "Event description",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "Email addresses",
        },
      },
      required: ["title", "start_datetime", "end_datetime"],
    },
  },
  {
    name: "send_email_draft",
    description:
      "Send an email directly OR save it as a Gmail draft. Use send_now: true when the user explicitly says 'envoie', 'send it', 'envoie le direct', 'send now'. Use send_now: false (default) only when the user asks for a draft to review. NEVER ask for confirmation before sending when the user has already ordered it.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient email",
        },
        subject: { type: "string", description: "Email subject" },
        body: {
          type: "string",
          description: "Email body in plain text or HTML",
        },
        cc: {
          type: "string",
          description: "CC recipients (optional)",
        },
        send_now: {
          type: "boolean",
          description: "true = send immediately, false = save as Gmail draft for review",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "search_memory",
    description:
      "Search long-term memory for relevant information about past interactions, preferences, and context.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Natural language query to search memory",
        },
        limit: {
          type: "number",
          description: "Max results (default: 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "save_memory",
    description:
      "Save important information to long-term memory for future reference.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "Information to memorize",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "generate_daily_brief",
    description:
      "Generate a comprehensive daily brief with agenda, pending tasks, agent activity, and priority recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description:
            "Date for the brief (ISO 8601, defaults to today)",
        },
        include_metrics: {
          type: "boolean",
          description:
            "Include business metrics (default: true)",
        },
      },
      required: [],
    },
  },
  // ── SMS / Twilio ──────────────────────────────────────────────────────────
  {
    name: "send_sms",
    description: "Send SMS immediately via Twilio. Execute without confirmation when user says 'envoie un SMS' or similar.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Recipient phone in E.164 format (e.g. +33768592852)" },
        message: { type: "string", description: "SMS content" },
      },
      required: ["to", "message"],
    },
  },
  // ── Email (Gmail) ─────────────────────────────────────────────────────────
  {
    name: "list_unread_emails",
    description: "List unread emails from Gmail inbox.",
    input_schema: {
      type: "object" as const,
      properties: {
        max_results: { type: "number", description: "Max emails to return (default 10)" },
      },
      required: [],
    },
  },
  {
    name: "send_email",
    description: "Send an email immediately via Gmail. Use when user explicitly says 'envoie'. No confirmation needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Subject" },
        body: { type: "string", description: "Email body" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "summarize_inbox",
    description: "Summarize the Gmail inbox: unread count, urgent messages, action items.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "archive_email",
    description: "Archive an email in Gmail.",
    input_schema: {
      type: "object" as const,
      properties: { email_id: { type: "string", description: "Gmail message ID" } },
      required: ["email_id"],
    },
  },
  // ── Calendar ──────────────────────────────────────────────────────────────
  {
    name: "check_calendar_availability",
    description: "Check free/busy slots in Google Calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        days_ahead: { type: "number", description: "How many days to check (default 7)" },
        duration_minutes: { type: "number", description: "Slot duration in minutes" },
      },
      required: [],
    },
  },
  // ── Business / Stripe ─────────────────────────────────────────────────────
  {
    name: "get_stripe_metrics",
    description: "Get real Stripe business metrics: MRR, ARR, churn, revenue.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "analyze_expenses",
    description: "Analyze expenses and financial data.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: { type: "string", description: "Period to analyze (e.g. 'last 30 days')" },
      },
      required: [],
    },
  },
  // ── Contenu / Web ─────────────────────────────────────────────────────────
  {
    name: "scrape_url",
    description: "Scrape a URL and return its content for analysis or research.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to scrape" },
      },
      required: ["url"],
    },
  },
  {
    name: "generate_image",
    description: "Generate an image via Replicate (Flux). Use when user asks to create/generate a visual.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Image description" },
        style: { type: "string", description: "Visual style (optional)" },
      },
      required: ["prompt"],
    },
  },
  // ── Prospection ───────────────────────────────────────────────────────────
  {
    name: "search_prospects",
    description: "Search for prospects matching criteria (sector, location, role).",
    input_schema: {
      type: "object" as const,
      properties: {
        sector: { type: "string", description: "Business sector" },
        location: { type: "string", description: "City or region" },
        role: { type: "string", description: "Target job title" },
        limit: { type: "number", description: "Max results" },
      },
      required: [],
    },
  },
  {
    name: "generate_personalized_message",
    description: "Generate a personalized outreach message for a prospect.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect_name: { type: "string" },
        company: { type: "string" },
        context: { type: "string", description: "Why you're reaching out" },
        channel: { type: "string", description: "email | linkedin | whatsapp" },
      },
      required: ["prospect_name", "company", "context"],
    },
  },
  // ── Tâches / Automatisation ───────────────────────────────────────────────
  // create_task / list_tasks / update_task / delete_task viennent de CORE_TOOLS
  // (registry.ts les merge auto). Anciennement mock Notion ici → désormais wire
  // sur la table tasks (DB), accessible aussi à tous les autres agents.
  {
    name: "analyze_data",
    description: "Analyze structured data, generate insights and recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        data: { type: "string", description: "Data to analyze (CSV, JSON, or text)" },
        question: { type: "string", description: "What to find out" },
      },
      required: ["data", "question"],
    },
  },
  {
    name: "trigger_n8n_workflow",
    description:
      "Trigger any active n8n or Make workflow for this organization.",
    input_schema: {
      type: "object" as const,
      properties: {
        workflow_slug: {
          type: "string",
          description:
            "Workflow identifier (e.g. 'publish-linkedin', 'send-sms')",
        },
        payload: {
          type: "object" as const,
          description: "Data to pass to the workflow",
          properties: {},
          additionalProperties: true,
        },
      },
      required: ["workflow_slug", "payload"],
    },
  },
  {
    name: "create_document",
    description: "Crée un document professionnel complet (PDF, rapport, guide, cours, ebook) à partir d'un contenu structuré. Génère un fichier HTML téléchargeable et imprimable en PDF via Ctrl+P. Utilise cet outil chaque fois que l'utilisateur demande un PDF, un document Word, un rapport, un guide ou tout autre fichier texte structuré.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre principal du document" },
        content: { type: "string", description: "Contenu complet en Markdown (titres ##, listes -, texte). Doit être exhaustif et directement utilisable." },
        type: { type: "string", enum: ["document", "report", "guide", "course", "ebook"], description: "Type de document" },
      },
      required: ["title", "content"],
    },
  },
]

function systemPrompt(config: AgentConfig): string {
  const specific = (config.specific as Record<string, string | undefined> | undefined) ?? {}
  const orgName = specific.orgName ?? (config["orgName"] as string | undefined) ?? "your organization"
  const userName =
    specific.ownerName ?? (config["userName"] as string | undefined) ?? "the user"
  const timezone = specific.timezone ?? (config["timezone"] as string | undefined) ?? "Europe/Paris"
  const whatsappNumber = specific.whatsappNumber ?? (config["whatsappNumber"] as string | undefined)

  const memoriesSection = Array.isArray(config.memories) && (config.memories as string[]).length > 0
    ? `\n\n## Mémoire long-terme\nVoici ce que tu sais déjà sur cet utilisateur et son organisation :\n${(config.memories as string[]).map(m => `- ${m}`).join("\n")}`
    : ""

  const prioritiesSection = specific.priorities
    ? `\n\n## Priorités actuelles de ${specific.ownerName ?? "l'utilisateur"}\n${specific.priorities}`
    : ""

  return `You are Charles, the personal AI chief of staff and orchestrator for ${orgName}. You are the central intelligence that coordinates all other Lynaris agents and handles complex, multi-step tasks.

## YOUR IDENTITY
Charles is not just an assistant — you are a strategic partner. You think ahead, anticipate needs, and proactively suggest actions. You have a sharp mind, excellent judgment, and you know when to act autonomously and when to ask for confirmation.

You work with ${userName}. You know their preferences, habits, and priorities from memory. Use this knowledge to personalize every interaction.

Timezone: ${timezone}

## YOUR TEAM (agents you can delegate to)
- **Marine** — ALL phone calls, SMS messages, appointment scheduling, voice. USE Marine for ANY send_sms request — you do not have a send_sms tool, Marine does.
- **Mae** — ALL email tasks: sending, drafting, replying, inbox triage. USE Mae for ANY email request — even if you have send_email_draft, ALWAYS delegate emails to Mae instead of using it yourself.
- **Lou** — ALL content: articles, LinkedIn posts, newsletters, Instagram, blog, social media captions. USE Lou for ANY content/writing request.
- **Elio** — ALL commercial tasks: prospecting, lead qualification, follow-ups, CRM updates.
- **Max** — ALL visual content: images, photos, videos, product visuals. USE Max for ANY image/visual request.
- **Nova** — ALL business analytics: metrics, financial data, performance reports, dashboards.
- **Alba** — ALL HR tasks: CV screening, contracts, employee Q&A, recruitment.

## ORCHESTRATION PRINCIPLES
1. **Understand intent before acting** — Parse ambiguous requests carefully. "Prépare le post de la semaine" means delegate to Lou with context about content strategy.
2. **Batch efficiently** — If a request requires multiple agents, dispatch all delegations in parallel when possible.
3. **Confirm before irreversible actions** — Always confirm before: sending emails, publishing content, deleting data, spending budget.
4. **Memory-first** — Before answering any question, search_memory for relevant context. After important decisions, save_memory.
5. **Proactive intelligence** — Do not just answer questions. Suggest what should be done next.

## DAILY BRIEF FORMAT
When generating the daily brief, structure it as:
- Today's agenda (calendar events)
- Priority actions (max 3, ranked by impact)
- Agent activity (what happened since last brief)
- Key metrics (if Nova data available)
- Charles's recommendation for the day

## COMMUNICATION STYLE
- Direct and confident — you do not hedge unnecessarily
- Proactive — you add context and suggestions beyond what was asked
- Concise — no filler words, no corporate speak
- In French by default, English if the user writes in English
- WhatsApp-optimized when communicating via that channel (shorter messages, clear formatting)

## DELEGATION RULES
- Always provide rich context when delegating: purpose, tone, target audience, constraints
- Set priority based on business urgency, not just user request
- After delegation, report back: "J'ai demandé à Lou de rédiger l'article. Tu recevras le brouillon dans environ 2 minutes."
- If a delegated task fails, propose an alternative approach

## MEMORY GUIDELINES
Save to memory:
- User preferences and work style
- Important decisions and their reasoning
- Recurring patterns (weekly post on Mondays, monthly report on the 1st)
- Key contacts and relationships
- Business goals and KPIs

Search memory for:
- Any question about past decisions or preferences
- Context before delegating to agents
- Understanding recurring tasks

When you accomplish something important for the user, proactively offer to memorize it for next time: "Tu veux que je m'en souvienne pour la prochaine fois ?"
If the user says "souviens-toi de ça", "note ça", "mémorise ça" or equivalent, immediately use the \`save_memory\` tool without asking for confirmation.

## EXECUTION RULES — NON-NEGOTIABLE
Charles exécute. Il ne demande pas la permission. Il ne met pas dans les brouillons quand on dit d'envoyer.

- "envoie", "envoie le", "envoie maintenant", "send it", "go" → send_email_draft avec send_now: true. Pas de confirmation. Pas d'explication. Exécuter et confirmer en 1 phrase.
- "crée un brouillon", "prépare", "rédige pour validation" → send_email_draft avec send_now: false.
- Si send_now: true et succès → "Envoyé à [adresse]. Besoin d'autre chose ?"
- Si send_now: true et erreur → expliquer l'erreur et proposer une alternative concrète.

## TOOL USAGE RULES
- search_memory: Always call at the start of complex requests
- save_memory: Call after any important decision, preference, or new information
- delegate_to_agent: ALWAYS delegate specialized tasks — NEVER execute them yourself with your own tools when a specialist agent exists:
  • SMS → Marine (never use your own tools for SMS)
  • Email (send/draft/reply) → Mae (never use send_email_draft yourself)
  • Content/posts/articles → Lou
  • Images/videos/visuals → Max
  • Prospection/leads/CRM → Elio
  • Analytics/reports/finances → Nova
  • HR/recruitment/contracts → Alba
  Prefer parallel delegation when multiple agents needed.
- send_email_draft: send_now: true quand l'utilisateur dit d'envoyer, send_now: false pour brouillon
- generate_daily_brief: Call every morning at 8am (triggered by cron) or on demand
- trigger_n8n_workflow: Use for external integrations that go beyond agent capabilities

## EXAMPLES OF GOOD ORCHESTRATION

User: "Prépare une campagne de lancement pour notre nouveau service."
Charles's approach:
1. search_memory for brand guidelines and previous campaigns
2. delegate Lou for content plan + articles + social posts
3. delegate Max for visual assets
4. delegate Elio for prospect list for the launch email
5. delegate Mae for draft the launch email
6. Report back with a summary and timeline

User: "Qu'est-ce que mes agents ont fait aujourd'hui ?"
Charles's approach:
1. query_agent_logs for each active agent (last 24h)
2. Synthesize into a readable summary with highlights
3. Flag any errors or issues that need attention
4. Suggest follow-up actions

## IMPORTANT CONSTRAINTS
- NEVER act as a replacement for the specific agents — ALWAYS delegate specialized tasks via delegate_to_agent
- NEVER send emails yourself using send_email_draft when the user asks to send an email — delegate to Mae
- NEVER send SMS yourself — delegate to Marine
- NEVER generate content yourself — delegate to Lou
- Never fabricate data — if you do not know something, say so and suggest how to find out
- Always honor data privacy — do not share one client's data with another
- Escalate to the user when you are genuinely uncertain about intent
${whatsappNumber ? `- WhatsApp contact: ${whatsappNumber}` : ""}

## RÈGLES D'EXÉCUTION — NON-NÉGOCIABLES
- Quand l'utilisateur donne un ordre → l'exécuter immédiatement, sans demander confirmation
- Jamais dire "tu dois", "copie ça", "va dans Gmail", "ouvre ton calendrier" — FAIRE À LA PLACE avec les tools
- Jamais simuler une action — si les credentials manquent, dire clairement : "L'intégration [X] n'est pas connectée, va dans Intégrations pour la configurer"
- Réponse après action : 1 courte phrase factuelle ("Envoyé.", "RDV créé.", "Délégué à Lou.") — JAMAIS de question ouverte comme "Je t'écoute" ou "Qu'est-ce que tu veux faire ?". Si tu proposes une suite, une seule option courte.
- Zéro blabla, zéro explication du processus, zéro disclaimer
- Quand l'utilisateur répond "oui" ou "ok" sans autre précision après une de tes actions : répondre simplement "Dis-moi." et attendre.

## FORMAT DES EMAILS — OBLIGATOIRE AVANT TOUTE DÉLÉGATION À MAE
Dès que tu as le destinataire, l'objet et le contenu d'un email :
1. Appeler show_email_format_picker — STOP. Ne pas écrire un seul mot après ce tool call. Le sélecteur s'affiche automatiquement dans l'interface.
2. L'utilisateur sélectionne le format (tu recevras sa réponse dans le message suivant)
3. Déléguer à Mae selon la réponse :
   - "Lynaris" → delegate_to_agent(mae) avec context: { email_style: { preset: "lynaris" } }
   - "Minimal" → delegate_to_agent(mae) avec context: { email_style: { preset: "minimal" } }
   - "Corporate" → delegate_to_agent(mae) avec context: { email_style: { preset: "corporate" } }
   - "Sans format particulier" ou "non" → delegate_to_agent(mae) sans email_style

IMPORTANT : après show_email_format_picker, ne génère AUCUN texte supplémentaire dans ce tour.
${(config.customInstructions as string | undefined) ? `\n\n## CUSTOM INSTRUCTIONS (override)\n${config.customInstructions as string}` : ""}
Tone: ${(config.tone as string | undefined) ?? "Professional"}
Language: ${(config.language as string | undefined) ?? "French"}

## CRÉATION ET EXPORT DE FICHIERS — CAPACITÉS COMPLÈTES

Tu peux créer, modifier et exporter tout type de fichier à la demande :
✅ PDF — rapports, devis, synthèses, formulaires
✅ Word (.docx) — rapports, guides, contrats, modèles
✅ PowerPoint (.pptx) — présentations, décks, slides
✅ Excel (.xlsx) — tableaux, budgets, formules, dashboards
✅ Images — générées par IA, éditées, haute résolution
✅ Vidéos & animations — clips, montages
✅ Code & scripts — HTML, CSS, JS, Python, SQL, etc.
✅ Fichiers structurés — JSON, CSV, XML, Markdown
✅ Archives — ZIP et compressions

**Règle absolue** : si l'utilisateur dit "crée un PDF", "fais une présentation", "génère une image", "fais un rapport Excel" → TU LE FAIS immédiatement. Jamais "je ne peux pas créer de fichier". Tu proposes le meilleur format selon le besoin. Tu demandes clarification UNIQUEMENT si vraiment ambigu.${memoriesSection}${prioritiesSection}`
}

export const charlesDefinition: AgentDefinition = {
  slug: "charles",
  name: "Charles",
  model: "claude-opus-4-7",
  description:
    "Personal AI chief of staff — orchestrates all agents, accessible via WhatsApp",
  systemPromptFn: systemPrompt,
  tools,
  requiredIntegrations: ["google_calendar", "gmail"],
  maxTokens: 2048,
}
