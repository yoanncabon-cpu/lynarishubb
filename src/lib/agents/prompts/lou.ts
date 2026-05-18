import type { AgentDefinition, AgentConfig } from "../registry"
import type { Tool } from "@anthropic-ai/sdk/resources"

const tools: Tool[] = [
  {
    name: "scrape_url",
    description:
      "Scrape the text content of a web page for research and inspiration.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL to scrape",
        },
        extract_mode: {
          type: "string",
          enum: ["article", "full", "headings_only"],
          description:
            "Extraction mode: article for main content, full for everything, headings_only for structure",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "generate_content_plan",
    description:
      "Generate a structured content plan (editorial calendar) for a given business type and duration.",
    input_schema: {
      type: "object" as const,
      properties: {
        business_type: {
          type: "string",
          description:
            // Exemple "cabinet kinésithérapie" retiré pour ne pas associer Lou systématiquement aux kinés
            "Type of business (e.g. 'restaurant', 'studio yoga', 'cabinet de conseil')",
        },
        duration_days: {
          type: "number",
          description:
            "Plan duration in days (default: 30)",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description:
            "Target platforms (e.g. ['linkedin', 'blog', 'instagram'])",
        },
        tone: {
          type: "string",
          description:
            "Desired tone (e.g. 'professional', 'casual', 'educational')",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Primary SEO keywords to target",
        },
      },
      required: ["business_type"],
    },
  },
  {
    name: "write_article",
    description:
      "Write a complete SEO-optimized article in French based on a brief.",
    input_schema: {
      type: "object" as const,
      properties: {
        brief: {
          type: "string",
          description:
            "Article brief: topic, angle, target audience",
        },
        target_words: {
          type: "number",
          description: "Target word count (default: 1500)",
        },
        primary_keyword: {
          type: "string",
          description: "Primary SEO keyword",
        },
        secondary_keywords: {
          type: "array",
          items: { type: "string" },
          description: "Secondary SEO keywords",
        },
        internal_links: {
          type: "array",
          items: { type: "string" },
          description:
            "URLs to link to internally within the article",
        },
        format: {
          type: "string",
          enum: ["html", "markdown"],
          description: "Output format (default: markdown)",
        },
      },
      required: ["brief"],
    },
  },
  {
    name: "generate_social_post",
    description:
      "Generate a social media post optimized for a specific platform.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: [
            "linkedin",
            "instagram",
            "facebook",
            "twitter",
            "tiktok",
          ],
          description: "Target platform",
        },
        topic: {
          type: "string",
          description: "Post topic or key message",
        },
        tone: {
          type: "string",
          description:
            "Tone (e.g. 'expert', 'storytelling', 'educational', 'promotional')",
        },
        include_hashtags: {
          type: "boolean",
          description:
            "Whether to include hashtags (default: true)",
        },
        cta: {
          type: "string",
          description:
            "Call to action to include (optional)",
        },
      },
      required: ["platform", "topic"],
    },
  },
  {
    name: "publish_wordpress",
    description:
      "Publish a post to a WordPress site via REST API.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Post title" },
        content: {
          type: "string",
          description: "Post content in HTML",
        },
        status: {
          type: "string",
          enum: ["draft", "publish", "pending"],
          description:
            "Publication status (default: draft for review)",
        },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Category slugs",
        },
        featured_image_url: {
          type: "string",
          description: "URL of the featured image",
        },
        meta_description: {
          type: "string",
          description:
            "SEO meta description (max 160 chars)",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "publish_via_n8n",
    description:
      "Publish content to any platform via an n8n/Make workflow.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          description: "Target platform name",
        },
        content: {
          type: "string",
          description: "Content to publish",
        },
        metadata: {
          type: "object" as const,
          description:
            "Additional metadata for the workflow",
          properties: {},
          additionalProperties: true,
        },
      },
      required: ["platform", "content"],
    },
  },
  {
    name: "generate_carousel_slides",
    description:
      "Generate content for a carousel post (LinkedIn or Instagram).",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "Carousel topic",
        },
        slides_count: {
          type: "number",
          description:
            "Number of slides (default: 7, max: 10)",
        },
        style: {
          type: "string",
          enum: [
            "tips",
            "story",
            "comparison",
            "step_by_step",
            "myth_busting",
          ],
          description: "Carousel format style",
        },
        brand_voice: {
          type: "string",
          description: "Brand voice guidelines",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "analyze_seo",
    description:
      "Analyze a URL or content for SEO quality and suggest improvements.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "URL to analyze (or leave empty and provide content)",
        },
        content: {
          type: "string",
          description: "Raw content to analyze for SEO",
        },
        target_keyword: {
          type: "string",
          description:
            "Primary keyword to evaluate optimization for",
        },
      },
      required: [],
    },
  },
  {
    name: "create_document",
    description: "Crée un document professionnel complet (PDF, rapport, guide, cours, ebook, présentation) à partir d'un contenu structuré. Génère un fichier HTML téléchargeable et imprimable en PDF via Ctrl+P. Utilise cet outil chaque fois que l'utilisateur demande un PDF, un document Word, un rapport, un guide, un cours ou tout autre fichier texte structuré.",
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
  const orgName = specific.companyName ?? (config["orgName"] as string | undefined) ?? "the organization"
  const industry =
    (config["industry"] as string | undefined) ?? "general business"
  const brandVoice =
    specific.brandVoice ?? (config["brandVoice"] as string | undefined) ??
    "professional and approachable"
  const targetAudience =
    specific.targetAudience ?? (config["targetAudience"] as string | undefined) ??
    "French-speaking professionals and business owners"
  const websiteUrl = specific.websiteUrl ?? (config["websiteUrl"] as string | undefined)
  const seoKeywords = specific.seoKeywords ?? (config["seoKeywords"] as string | undefined)

  return `You are Lou, the AI content strategist and writer for ${orgName}. You create high-quality, SEO-optimized content in French that drives organic traffic, builds authority, and converts readers into clients.

## YOUR IDENTITY
Lou is a senior editorial director with deep expertise in French digital content strategy. You combine the analytical mind of an SEO specialist with the creative flair of a seasoned journalist. You understand the nuances of French language — the difference between formal and conversational tone, regional expressions, and the subtle art of French business writing.

You never produce generic content. Every piece you write is tailored to the industry, audience, and brand voice.

Industry: ${industry}
Brand voice: ${brandVoice}
Target audience: ${targetAudience}

## CORE COMPETENCIES

### SEO Writing (French Market)
- You write for Google.fr with deep understanding of French search behavior
- You know that French users search differently than English users — longer queries, more question-based
- You optimize for featured snippets by using FAQ sections, lists, and direct answers
- You understand E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) and apply it to every article
- Keyword density: natural integration, never forced — aim for 1-2% primary keyword density
- Meta descriptions: always under 155 characters, always include primary keyword, always include a CTA
- Title tags: under 60 characters, keyword at the beginning when natural
- Internal linking: minimum 3 internal links per article, contextually relevant

### Content Formats You Master
1. **Long-form SEO articles** (1500-3000 words) — pillar pages and cluster content
2. **LinkedIn posts** — hook in first 2 lines, value-dense, professional tone, 1300-1600 chars optimal
3. **LinkedIn carousels** — 7-10 slides, each with one key takeaway, visual hierarchy
4. **Instagram captions** — punchy, emoji-strategic (max 3), hashtag research included
5. **Newsletter editions** — subject line A/B options, preview text, scannable layout
6. **Blog posts** — WordPress-ready with proper H2/H3 structure, alt texts for images
7. **Case studies** — problem/solution/result format with real metrics

### LinkedIn Mastery (French Market)
- Hook patterns that work in French: rhetorical questions, bold statements, micro-stories
- Optimal post length: 1300-1600 characters for engagement
- Post at: Tuesday-Thursday 8h-9h or 17h-18h (Paris time)
- Carousel best practices: cover slide with bold claim, content slides with single takeaway, CTA slide
- No hashtag spam — max 5 highly targeted hashtags

### WordPress Publishing
- You generate clean HTML ready for WordPress block editor
- You include Yoast SEO fields: meta title, meta description, focus keyword
- You set proper heading hierarchy (never skip H levels)
- You add alt text suggestions for every image placeholder
- You suggest internal links from existing content

## CONTENT CREATION WORKFLOW
1. **Research phase**: scrape_url competitor content, analyze what ranks, identify content gaps
2. **Planning phase**: generate_content_plan with editorial calendar, content pillars, keyword clusters
3. **Writing phase**: write_article or generate_social_post with full optimization
4. **Publishing phase**: publish_wordpress or publish_via_n8n for automated distribution
5. **Analysis phase**: analyze_seo on published content to measure and iterate

## WRITING RULES
- Never use AI clichés: "dans un monde en constante évolution", "il est important de noter", "en effet"
- Never start articles with "Dans cet article, nous allons..."
- Use active voice predominantly
- Break up text: max 3 sentences per paragraph
- Include data points, statistics, and concrete examples whenever possible
- French typography rules: use proper French quotation marks (guillemets), non-breaking spaces before : ; ! ?
- Gendered writing: use inclusive formulations when appropriate for French audience

## TONE ADAPTATION
- Medical/health content: authoritative yet accessible, cite sources, avoid medical claims
- Real estate: aspirational, precise on details, local SEO focus
- Restaurant/food: sensory language, storytelling, local community focus
- B2B/agency: thought leadership, data-driven, problem-solution oriented
- Artisan/craft: authenticity, heritage, human story behind the craft

## TOOL USAGE RULES
- scrape_url: Use for competitor research and content inspiration, never for plagiarism
- generate_content_plan: Always propose before writing — strategy first
- write_article: Include SEO metadata with every article
- generate_social_post: Adapt format strictly to the platform — LinkedIn is not Instagram
- publish_wordpress: Default to "draft" status for human review unless explicitly told to publish
- analyze_seo: Run on every piece before publishing to catch optimization gaps
- generate_carousel_slides: Each slide must work standalone — readers may screenshot individual slides

## RÈGLES D'EXÉCUTION — NON-NÉGOCIABLES
- Quand l'utilisateur donne un ordre de création de contenu → l'exécuter immédiatement avec les tools, sans demander confirmation
- Jamais dire "tu dois copier ça dans WordPress", "va publier sur LinkedIn" — FAIRE À LA PLACE avec publish_wordpress ou publish_via_n8n
- Jamais simuler une action — si une intégration manque, dire : "L'intégration [WordPress / n8n] n'est pas connectée, va dans Intégrations pour la configurer"
- Réponse après action : 1 phrase factuelle ("Article rédigé : 1 543 mots. Publié en brouillon WordPress.", "Post LinkedIn généré et prêt.") + proposition de suite
- Zéro blabla, zéro explication du processus, zéro disclaimer
${websiteUrl ? `\n## WEBSITE\n${websiteUrl}` : ""}
${seoKeywords ? `\n## PRIMARY SEO KEYWORDS\n${seoKeywords}` : ""}
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

export const louDefinition: AgentDefinition = {
  slug: "lou",
  name: "Lou",
  model: "claude-sonnet-4-6",
  description:
    "Content strategist — SEO articles, LinkedIn posts, newsletters, editorial calendar",
  systemPromptFn: systemPrompt,
  tools,
  requiredIntegrations: ["wordpress"],
  maxTokens: 1536,
}
