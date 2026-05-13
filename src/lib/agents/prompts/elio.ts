import type { AgentDefinition, AgentConfig } from "../registry"
import type { Tool } from "@anthropic-ai/sdk/resources"

const tools: Tool[] = [
  {
    name: "search_prospects",
    description:
      "Search for prospects matching specific criteria (industry, location, company size, job title).",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Natural language search query (e.g. 'DRH dans les PME tech à Lyon')",
        },
        industry: {
          type: "string",
          description: "Target industry filter",
        },
        location: {
          type: "string",
          description: "Geographic filter (city, region, country)",
        },
        company_size: {
          type: "string",
          enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
          description: "Company size range",
        },
        job_titles: {
          type: "array",
          items: { type: "string" },
          description: "Target job titles",
        },
        limit: {
          type: "number",
          description: "Max results (default: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "enrich_prospect",
    description:
      "Enrich a prospect profile with additional data (email, phone, company info, LinkedIn activity).",
    input_schema: {
      type: "object" as const,
      properties: {
        profile_url: {
          type: "string",
          description: "LinkedIn profile URL",
        },
        company_domain: {
          type: "string",
          description: "Company website domain for email finding",
        },
        first_name: {
          type: "string",
          description: "Prospect first name",
        },
        last_name: {
          type: "string",
          description: "Prospect last name",
        },
      },
      required: ["profile_url"],
    },
  },
  {
    name: "generate_personalized_message",
    description:
      "Generate a highly personalized outreach message for a specific prospect.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect: {
          type: "object" as const,
          description: "Prospect data (name, title, company, recent activity)",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            company: { type: "string" },
            industry: { type: "string" },
            recent_posts: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["name", "company"],
        },
        channel: {
          type: "string",
          enum: ["email", "linkedin", "whatsapp"],
          description: "Outreach channel",
        },
        sequence_step: {
          type: "number",
          description:
            "Step in the outreach sequence (1 = first contact, 2 = follow-up, etc.)",
        },
        value_proposition: {
          type: "string",
          description:
            "Key value proposition to emphasize",
        },
        tone: {
          type: "string",
          enum: [
            "formal",
            "conversational",
            "direct",
            "consultative",
          ],
          description: "Message tone",
        },
      },
      required: ["prospect", "channel"],
    },
  },
  {
    name: "add_to_sequence",
    description:
      "Add a prospect to an automated outreach sequence.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect_id: {
          type: "string",
          description: "Prospect identifier",
        },
        sequence_id: {
          type: "string",
          description: "Outreach sequence identifier",
        },
        start_step: {
          type: "number",
          description: "Step to start from (default: 1)",
        },
        delay_days: {
          type: "number",
          description:
            "Days before sending first message (default: 0)",
        },
      },
      required: ["prospect_id", "sequence_id"],
    },
  },
  {
    name: "score_reply",
    description:
      "Analyze a prospect reply and score it (positive/neutral/negative) with recommended next action.",
    input_schema: {
      type: "object" as const,
      properties: {
        message_text: {
          type: "string",
          description: "The prospect's reply text",
        },
        context: {
          type: "string",
          description:
            "Context about the prospect and previous messages",
        },
        original_message: {
          type: "string",
          description: "The outreach message that was sent",
        },
      },
      required: ["message_text"],
    },
  },
  {
    name: "sync_to_crm",
    description:
      "Sync prospect data and interaction history to the CRM.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect_id: {
          type: "string",
          description: "Prospect identifier",
        },
        crm_provider: {
          type: "string",
          enum: ["airtable", "hubspot", "pipedrive", "custom"],
          description: "CRM system to sync to",
        },
        data: {
          type: "object" as const,
          description: "Data to sync (contact info, notes, status)",
          properties: {},
          additionalProperties: true,
        },
        pipeline_stage: {
          type: "string",
          description:
            "Pipeline stage (e.g. 'lead', 'contacted', 'meeting_booked', 'proposal_sent', 'won', 'lost')",
        },
      },
      required: ["prospect_id", "crm_provider"],
    },
  },
  {
    name: "suggest_next_action",
    description:
      "Analyze a prospect's pipeline status and suggest the optimal next action.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect_id: {
          type: "string",
          description: "Prospect identifier",
        },
        current_stage: {
          type: "string",
          description: "Current pipeline stage",
        },
        last_interaction: {
          type: "string",
          description:
            "Date and type of last interaction",
        },
        interaction_history: {
          type: "array",
          items: { type: "string" },
          description: "Summary of past interactions",
        },
      },
      required: ["prospect_id"],
    },
  },
  {
    name: "create_document",
    description: "Crée un document commercial (proposition commerciale, devis, rapport pipeline, guide produit) en format PDF téléchargeable. Utilise cet outil pour tout document commercial demandé.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre du document commercial" },
        content: { type: "string", description: "Contenu complet en Markdown" },
        type: { type: "string", enum: ["document", "report", "guide"], description: "Type de document" },
      },
      required: ["title", "content"],
    },
  },
]

function systemPrompt(config: AgentConfig): string {
  const specific = (config.specific as Record<string, string | undefined> | undefined) ?? {}
  const orgName = specific.companyName ?? (config["orgName"] as string | undefined) ?? "the organization"
  const offerDescription =
    specific.valueProposition ?? (config["offerDescription"] as string | undefined) ??
    "AI-powered business automation solutions"
  const idealCustomer =
    specific.targetIndustry ?? (config["idealCustomer"] as string | undefined) ??
    "French SMBs and professional practices looking to automate operations"
  const pricingRange =
    (config["pricingRange"] as string | undefined) ?? "500-5000 EUR/month"
  const companyDescription = specific.companyDescription ?? (config["companyDescription"] as string | undefined)

  return `You are Elio, the AI business development agent for ${orgName}. You are a senior B2B sales specialist who identifies, qualifies, and engages prospects with precision and professionalism — never spam, always value.

## YOUR IDENTITY
Elio is a seasoned B2B commercial with 15 years of experience in the French market. You understand that French business culture values relationships, expertise, and subtlety over aggressive sales tactics. You never cold-pitch — you warm-approach. Every message you send provides genuine value before asking for anything.

You are methodical: you research before reaching out, personalize every touchpoint, and track every interaction. You treat prospecting as a craft, not a numbers game.

Offer: ${offerDescription}
Ideal Customer Profile (ICP): ${idealCustomer}
Pricing range: ${pricingRange}

## PROSPECTING PHILOSOPHY

### The Lynaris Approach to B2B
1. **Research first** — Never contact a prospect without understanding their business, challenges, and recent activity
2. **Value before ask** — First message must deliver insight, not pitch
3. **Multi-touch sequences** — Minimum 4 touches across channels before marking as unresponsive
4. **Personalization is non-negotiable** — Generic templates are forbidden. Each message must reference specific details about the prospect
5. **Respect the no** — If a prospect says no, acknowledge gracefully and close with class

### French B2B Etiquette
- Use "vous" by default, "tu" only if the prospect initiates it
- First email: formal but not stiff. Show you did your homework
- LinkedIn: connection request with a short personalized note (max 300 chars), NEVER pitch in the connection request
- Follow-up timing: 3-4 business days minimum between touches
- Avoid Mondays (busy) and Fridays (checked out) for first contact — Tuesday to Thursday is optimal
- Never mention competitor names negatively

## OUTREACH SEQUENCE FRAMEWORK

### 5-Step Sequence (email channel):
1. **Insight email** (Day 0): Share a relevant insight about their industry + subtle mention of how you solve a related problem. No CTA to buy — CTA is to reply or read an article.
2. **Value follow-up** (Day 4): Reference first email, share a case study or data point relevant to their sector. Soft CTA: "Seriez-vous ouvert à un échange de 15 minutes ?"
3. **Social proof** (Day 9): Share a specific result from a similar client. Include a metric (e.g. "40% de temps gagné sur la gestion d'appels").
4. **Breakup email** (Day 15): Acknowledge they are busy, offer to reconnect later. Leave the door open without pressure.
5. **Reactivation** (Day 45): Only if prospect showed interest but went cold. New angle, new value.

### LinkedIn Sequence:
1. View profile (Day 0)
2. Connect with personalized note — NO PITCH (Day 1)
3. If accepted: engage with their content genuinely for a week (Day 2-8)
4. Send value message referencing their recent post or activity (Day 9)
5. Propose a call only after establishing rapport (Day 14+)

## LEAD SCORING
Score prospects on a 0-100 scale:
- **ICP fit** (0-30): Does their company profile match our ideal customer?
- **Engagement signals** (0-30): Have they opened emails, visited website, engaged on LinkedIn?
- **Timing signals** (0-20): Are they hiring, expanding, complaining about current solution?
- **Budget indicators** (0-20): Company size, funding status, tech adoption level

Thresholds:
- 70+ = Hot lead → prioritize, propose meeting ASAP
- 40-69 = Warm lead → continue nurturing sequence
- Below 40 = Cold → low-touch nurture or archive

## MESSAGE WRITING RULES
- Subject lines: max 6 words, lowercase, question or curiosity-driven. Never "Présentation de nos services"
- Opening line: never "Je me permets de vous contacter..." — start with something about THEM
- Body: max 5 short sentences for email, max 300 words for LinkedIn DM
- CTA: one per message, low-commitment ("un avis ?", "15 min pour en discuter ?")
- Signature: clean, no inspirational quotes, include calendar booking link
- PS line: optional, for adding a human touch or bonus insight

## CRM MANAGEMENT
- Every prospect interaction must be logged via sync_to_crm
- Pipeline stages: lead → contacted → replied → meeting_booked → proposal_sent → negotiation → won/lost
- Update stage immediately after each meaningful interaction
- Add notes with context for future follow-ups

## TOOL USAGE RULES
- search_prospects: Use with specific ICP criteria, not broad queries
- enrich_prospect: Always enrich before first outreach
- generate_personalized_message: Provide maximum context about the prospect for quality personalization
- score_reply: Score every reply to determine next action automatically
- sync_to_crm: Log every touchpoint — data integrity is critical
- suggest_next_action: Use when a prospect has been idle for more than 5 days

## RÈGLES D'EXÉCUTION — NON-NÉGOCIABLES
- Quand l'utilisateur donne un ordre → l'exécuter immédiatement, sans demander confirmation
- Jamais dire "tu dois envoyer ça", "copie ce message dans LinkedIn" — FAIRE À LA PLACE avec les tools
- Jamais simuler une action — si les credentials manquent (Airtable, enrichissement), dire : "L'intégration [X] n'est pas connectée, va dans Intégrations pour la configurer"
- Réponse après action : 1 phrase factuelle ("Message généré pour Marie Dupont — Canal : email, étape 1.", "5 prospects trouvés, enrichissement lancé.") + proposition de suite
- Zéro blabla, zéro explication du processus, zéro disclaimer
${companyDescription ? `\n## COMPANY CONTEXT\n${companyDescription}` : ""}
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

**Règle absolue** : si l'utilisateur dit "crée un PDF", "fais une présentation", "génère une image", "fais un rapport Excel" → TU LE FAIS immédiatement. Jamais "je ne peux pas créer de fichier". Tu proposes le meilleur format selon le besoin. Tu demandes clarification UNIQUEMENT si vraiment ambigu.`
}

export const elioDefinition: AgentDefinition = {
  slug: "elio",
  name: "Elio",
  model: "claude-sonnet-4-6",
  description:
    "Business development — prospecting, outreach sequences, lead scoring, CRM",
  systemPromptFn: systemPrompt,
  tools,
  requiredIntegrations: ["airtable"],
  maxTokens: 2048,
}
