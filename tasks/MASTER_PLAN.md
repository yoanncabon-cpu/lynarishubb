# LYNARIS — MASTER IMPLEMENTATION PLAN
> Version: 2026-04-23 | Branch: master | Author: yoanncabon-cpu

---

## 0. ÉTAT ACTUEL & GAPS CRITIQUES

### Ce qui fonctionne aujourd'hui

| Composant | État | Notes |
|-----------|------|-------|
| Auth Supabase (middleware) | ✅ Opérationnel | Magic link + Google OAuth flow |
| Agent executor (streaming SSE) | ✅ Opérationnel | `streamAgent()` / `runAgent()` avec tool loop jusqu'à 10 iter |
| 9 agents définis (registry) | ✅ Opérationnel | Prompts complets, tools déclarés |
| Schema DB (Drizzle) | ✅ Opérationnel | 14 tables, pgvector, enums |
| API `/api/agents/[slug]/chat` | ✅ Opérationnel | SSE streaming, headers corrects |
| Stripe checkout session | ✅ Opérationnel | `/api/billing/checkout` avec Zod validation |
| Stripe webhook (signature verify) | ✅ Opérationnel | 5 events gérés, emails Resend |
| Integration manager (encrypt/decrypt) | ✅ Opérationnel | HMAC-AES, upsert/disconnect/list |
| n8n trigger (HMAC-signed) | ✅ Opérationnel | `triggerN8nWorkflow()` avec timeout 30s |
| Make trigger | ✅ Opérationnel | `triggerMakeScenario()` |
| Voice WebSocket server | ✅ Structure OK | ElevenLabs TTS opérationnel, Deepgram STT stub |
| Marketing pages | ✅ Pixel-perfect | Hero, Agents, Pricing, Footer |

### Gaps critiques (priorité décroissante)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| P0 | Auth header `x-org-id` hardcodé `"demo"` dans `/api/agents/[slug]/chat` | Critique — toutes les requêtes ignorent le vrai orgId | 1h |
| P0 | Tous les tool handlers sont des stubs/mocks | Zéro valeur métier — calendrier retourne des slots fictifs | 2-3j |
| P0 | Stripe webhook ne met pas à jour la DB | Subscription créée mais `organizations.plan` jamais changé | 2h |
| P1 | Deepgram STT non intégré dans voice-ws.ts | `media` event reçu mais non traité — Marine sourd | 4h |
| P1 | Messages non persistés en DB | Chat sans mémoire — rechargement perd tout | 3h |
| P1 | Google Calendar OAuth flow incomplet | Intégration clé de Marine non fonctionnelle | 4h |
| P2 | Pas de rate limiting sur API agents | Coûts Anthropic non maîtrisés | 2h |
| P2 | pgvector search_memory non implémenté | Charles sans mémoire long-terme | 3h |
| P2 | Replicate image generation stub | Max non fonctionnel | 2h |
| P3 | Pas de Supabase Realtime | Dashboard stale — polling manuel requis | 1j |
| P3 | Onboarding flow absent | First-time user experience nulle | 2j |
| P3 | Export CSV logs/analytics | Demandé par clients B2B | 4h |

---

## 1. AGENTS — IMPLÉMENTATION RÉELLE

### Architecture commune

Chaque agent suit ce pattern dans `src/lib/agents/prompts/{slug}.ts` :

```typescript
// Pattern d'implémentation uniforme
export const agentDefinition: AgentDefinition = {
  slug: "slug",
  name: "Name",
  model: "claude-sonnet-4-6" | "claude-opus-4-6",
  description: "...",
  systemPromptFn: (config: AgentConfig) => buildPrompt(config),
  tools: toolDefinitions,
  requiredIntegrations: ["provider1", "provider2"],
  maxTokens: 1024 | 4096 | 8192,
}
```

La config par org est stockée dans `agent_instances.config` (JSONB) et passée à `systemPromptFn()`.

---

### 1.1 Marine — Agent Téléphonique

**Modèle**: `claude-sonnet-4-6` | **maxTokens**: 1024 (voix = réponses courtes)

**System prompt** (déjà complet dans `src/lib/agents/prompts/marine.ts`) — voir fichier.

**Tools avec vrais handlers** — à implémenter dans `src/lib/agents/tools/marine.ts` :

```typescript
// src/lib/agents/tools/marine.ts
import { google } from "googleapis"
import { Twilio } from "twilio"
import { getIntegration } from "@/lib/integrations/manager"
import { db } from "@/lib/db"
import { actionLogs, conversations } from "@/lib/db/schema"

export async function checkCalendarAvailability(
  input: { date_range: string; duration_minutes?: number },
  ctx: ToolCallContext
): Promise<object> {
  const integration = await getIntegration(ctx.orgId, "google")
  if (!integration) throw new Error("Google Calendar non connecté")

  const creds = integration.credentials as {
    access_token: string
    refresh_token: string
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials(creds)

  const calendar = google.calendar({ version: "v3", auth })
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 7)

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: "primary" }],
    },
  })

  const busy = freebusy.data.calendars?.primary?.busy ?? []
  const duration = input.duration_minutes ?? 30
  const slots = computeAvailableSlots(busy, now, end, duration)

  await db.insert(actionLogs).values({
    orgId: ctx.orgId,
    agentInstanceId: null,
    conversationId: ctx.conversationId ?? null,
    type: "check_calendar_availability",
    status: "success",
    payload: { date_range: input.date_range, slots_found: slots.length },
  })

  return { available_slots: slots.slice(0, 6) }
}

export async function createCalendarEvent(
  input: {
    patient_name: string
    patient_phone?: string
    start_datetime: string
    end_datetime: string
    reason?: string
    notes?: string
  },
  ctx: ToolCallContext
): Promise<object> {
  const integration = await getIntegration(ctx.orgId, "google")
  if (!integration) throw new Error("Google Calendar non connecté")

  const auth = buildGoogleAuth(integration.credentials as GoogleCreds)
  const calendar = google.calendar({ version: "v3", auth })

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `RDV — ${input.patient_name}`,
      description: [input.reason, input.notes].filter(Boolean).join("\n"),
      start: { dateTime: input.start_datetime, timeZone: "Europe/Paris" },
      end: { dateTime: input.end_datetime, timeZone: "Europe/Paris" },
      extendedProperties: {
        private: {
          patient_phone: input.patient_phone ?? "",
          source: "lynaris_marine",
          org_id: ctx.orgId,
        },
      },
    },
  })

  await db.insert(actionLogs).values({
    orgId: ctx.orgId,
    conversationId: ctx.conversationId ?? null,
    type: "create_calendar_event",
    status: "success",
    payload: { event_id: event.data.id, patient: input.patient_name },
  })

  return {
    success: true,
    event_id: event.data.id,
    html_link: event.data.htmlLink,
    message: "Appointment created",
  }
}

export async function sendSms(
  input: { phone: string; message: string },
  ctx: ToolCallContext
): Promise<object> {
  const integration = await getIntegration(ctx.orgId, "twilio")
  if (!integration) throw new Error("Twilio non connecté")

  const creds = integration.credentials as {
    account_sid: string
    auth_token: string
    from_number: string
  }

  const client = new Twilio(creds.account_sid, creds.auth_token)

  const msg = await client.messages.create({
    to: input.phone,
    from: creds.from_number,
    body: input.message,
  })

  await db.insert(actionLogs).values({
    orgId: ctx.orgId,
    conversationId: ctx.conversationId ?? null,
    type: "send_sms",
    status: "success",
    payload: { to: input.phone, sid: msg.sid },
  })

  return { success: true, message_id: msg.sid, status: msg.status }
}
```

**Configuration par org** (stockée dans `agent_instances.config`) :
```json
{
  "orgName": "Cabinet Ménigoz",
  "practitionerName": "Dr. Ménigoz",
  "services": ["kinésithérapie", "thérapie manuelle", "ostéopathie"],
  "escalationPhone": "+33612345678",
  "appointmentDuration": 30,
  "openingHours": "Lundi-Vendredi 8h-19h, Samedi 9h-12h",
  "timezone": "Europe/Paris",
  "language": "fr",
  "smsFromName": "Cabinet Ménigoz",
  "maxAdvanceDays": 60,
  "blockedDates": ["2026-08-15", "2026-12-25"]
}
```

---

### 1.2 Charles — Agent Orchestrateur

**Modèle**: `claude-opus-4-6` | **maxTokens**: 8192

**System prompt complet** à maintenir dans `src/lib/agents/prompts/charles.ts` :

```
Tu es Charles, l'assistant personnel et chef d'orchestre IA de {orgName}.
Tu comprends les instructions en langage naturel et tu délègues aux bons agents spécialisés.

## TES CAPACITÉS
- Agenda: lecture, création et modification d'événements Google Calendar
- Email: rédaction de drafts Gmail pour validation
- Délégation: confier des tâches aux 8 autres agents IA
- Mémoire: stocker et retrouver des informations importantes (pgvector)
- Automatisation: déclencher des workflows n8n/Make
- Brief: générer le résumé matinal de l'activité

## PRINCIPES
1. Comprendre l'intention avant d'agir — reformule si ambigu
2. Toujours proposer une validation pour les actions irréversibles (emails envoyés, RV créés)
3. Pour chaque délégation, retourner le résultat à l'utilisateur
4. Mémoriser les préférences et patterns de l'utilisateur

## EXEMPLES D'INSTRUCTIONS
- "Résume mon agenda de la semaine" → read_calendar puis synthèse narrative
- "Délègue à Lou la rédaction d'un article sur l'IA médicale, 2000 mots, SEO" → delegate_to_agent
- "Crée un brief pour Marine avec les RDV d'aujourd'hui" → read_calendar + delegate_to_agent(marine)
- "Rappelle-moi dans 3 jours de rappeler Jean Dupont" → save_memory avec timestamp
```

**Tool: `delegate_to_agent` — implémentation réelle** :

```typescript
delegate_to_agent: async (input, ctx) => {
  const { agentSlug, taskDescription, context } = input as {
    agentSlug: string
    taskDescription: string
    context?: Record<string, unknown>
  }

  // Validate agent exists
  const { getAgent } = await import("@/lib/agents/registry")
  const agentDef = getAgent(agentSlug)
  if (!agentDef) return { error: `Agent ${agentSlug} not found` }

  // Check agent is active for this org
  const instance = await db.query.agentInstances.findFirst({
    where: and(
      eq(agentInstances.orgId, ctx.orgId),
      eq(agentInstances.agentSlug, agentSlug),
      eq(agentInstances.isActive, true)
    ),
  })
  if (!instance) return { error: `Agent ${agentSlug} not active for this org` }

  // Execute delegation
  const { runAgent } = await import("@/lib/agents/executor")
  const result = await runAgent({
    agentSlug,
    messages: [{ role: "user", content: taskDescription }],
    config: { ...(instance.config as object), ...(context ?? {}) },
    orgId: ctx.orgId,
  })

  // Log delegation
  await db.insert(actionLogs).values({
    orgId: ctx.orgId,
    type: "agent_delegation",
    status: "success",
    payload: { from: "charles", to: agentSlug, task: taskDescription.slice(0, 200) },
  })

  return {
    success: true,
    agent: agentSlug,
    result: result.content,
    tool_calls_used: result.toolCallsCount,
    tokens: result.inputTokens + result.outputTokens,
  }
}
```

**Tool: `search_memory` avec pgvector** :

```typescript
search_memory: async (input, ctx) => {
  const { query } = input as { query: string; limit?: number }

  // Generate embedding via OpenAI text-embedding-3-small or Anthropic
  // For now: use raw SQL cosine similarity
  const embedding = await generateEmbedding(query)

  const results = await db.execute(sql`
    SELECT id, content, source, created_at,
           1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
    FROM agent_memories
    WHERE org_id = ${ctx.orgId}
      AND agent_slug = 'charles'
      AND 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT ${input["limit"] ?? 5}
  `)

  return {
    results: results.rows.map((r) => ({
      content: r.content,
      similarity: r.similarity,
      source: r.source,
      date: r.created_at,
    })),
    query,
  }
}
```

---

### 1.3 Lou — Agent Contenu & SEO

**Modèle**: `claude-opus-4-6` | **maxTokens**: 8192

**Tool: `scrape_url` — implémentation réelle** :

```typescript
scrape_url: async (input) => {
  const { url } = input as { url: string }

  const response = await fetch(url, {
    headers: { "User-Agent": "Lynaris/1.0 (+https://lynarisai.com/bot)" },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const html = await response.text()

  // Extract readable content (basic — replace with @mozilla/readability if needed)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000)

  return {
    url,
    title: titleMatch?.[1] ?? "",
    content: cleanText,
    word_count: cleanText.split(/\s+/).length,
  }
}
```

**Tool: `publish_wordpress` — implémentation réelle** :

```typescript
publish_wordpress: async (input, ctx) => {
  const integration = await getIntegration(ctx.orgId, "wordpress")
  if (!integration) throw new Error("WordPress non connecté")

  const { site_url, app_password, username } = integration.credentials as {
    site_url: string
    app_password: string
    username: string
  }

  const credentials = Buffer.from(`${username}:${app_password}`).toString("base64")

  const response = await fetch(`${site_url}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      title: input["title"],
      content: input["content"],
      status: (input["status"] as string) ?? "draft",
      categories: input["categories"] ?? [],
      tags: input["tags"] ?? [],
      excerpt: input["excerpt"] ?? "",
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`WordPress: ${JSON.stringify(err)}`)
  }

  const post = await response.json()
  return { success: true, post_id: post.id, link: post.link, status: post.status }
}
```

---

### 1.4 Elio — Agent Commercial

**Modèle**: `claude-sonnet-4-6` | **maxTokens**: 4096

**Tool: `search_prospects` avec Dropcontact** :

```typescript
search_prospects: async (input, ctx) => {
  const { query, filters } = input as {
    query: string
    filters?: { company?: string; role?: string; location?: string }
  }

  // Recherche dans DB locale d'abord
  const localResults = await db.query.prospects.findMany({
    where: and(
      eq(prospects.orgId, ctx.orgId),
      or(
        ilike(prospects.fullName, `%${query}%`),
        ilike(prospects.company, `%${query}%`),
        ilike(prospects.email, `%${query}%`)
      )
    ),
    limit: 20,
  })

  if (localResults.length > 0) {
    return { results: localResults, source: "local_db", total: localResults.length }
  }

  // Fallback: Dropcontact enrichment (si configuré)
  const dropcontact = await getIntegration(ctx.orgId, "dropcontact").catch(() => null)
  if (dropcontact) {
    // POST https://api.dropcontact.io/b2b/v2/enrich
    // ...
  }

  return { results: [], source: "none", message: "No results found" }
}
```

**Tool: `add_to_sequence`** — persist en DB :

```typescript
add_to_sequence: async (input, ctx) => {
  const { prospect_id, sequence_id } = input as {
    prospect_id: string
    sequence_id: string
  }

  // Vérifier que le prospect appartient à l'org
  const prospect = await db.query.prospects.findFirst({
    where: and(
      eq(prospects.id, prospect_id),
      eq(prospects.orgId, ctx.orgId)
    ),
  })
  if (!prospect) throw new Error("Prospect not found")

  // Mettre à jour le statut
  await db
    .update(prospects)
    .set({ status: "contacted", metadata: sql`metadata || '{"sequence_id": "${sequence_id}"}'::jsonb` })
    .where(eq(prospects.id, prospect_id))

  await db.insert(actionLogs).values({
    orgId: ctx.orgId,
    type: "add_to_sequence",
    status: "success",
    payload: { prospect_id, sequence_id },
  })

  return { success: true, prospect_id, sequence_id }
}
```

---

### 1.5 Mae — Agent Mail

**Modèle**: `claude-sonnet-4-6` | **maxTokens**: 4096

**Tool: `list_unread_emails` avec Gmail API** :

```typescript
list_unread_emails: async (input, ctx) => {
  const integration = await getIntegration(ctx.orgId, "google")
  if (!integration) throw new Error("Gmail non connecté")

  const auth = buildGoogleAuth(integration.credentials as GoogleCreds)
  const gmail = google.gmail({ version: "v1", auth })

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: (input["limit"] as number) ?? 20,
  })

  const messages = await Promise.all(
    (list.data.messages ?? []).map(async (m) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      })
      const headers = Object.fromEntries(
        msg.data.payload?.headers?.map((h) => [h.name, h.value]) ?? []
      )
      return {
        id: m.id,
        from: headers["From"],
        subject: headers["Subject"],
        date: headers["Date"],
        snippet: msg.data.snippet,
        threadId: m.threadId,
      }
    })
  )

  return { emails: messages, count: messages.length }
}
```

---

### 1.6 Max — Agent Photo & Vidéo

**Modèle**: `claude-sonnet-4-6` | **maxTokens**: 2048

**Tool: `generate_image` avec Replicate Flux 1.1 Pro** :

```typescript
generate_image: async (input, ctx) => {
  const replicateToken = process.env["REPLICATE_API_TOKEN"]
  if (!replicateToken) throw new Error("REPLICATE_API_TOKEN non configuré")

  const { prompt, style, width, height, steps } = input as {
    prompt: string
    style?: string
    width?: number
    height?: number
    steps?: number
  }

  const enhancedPrompt = style
    ? `${prompt}, ${style} style, professional quality, sharp focus`
    : prompt

  // Start prediction
  const startResponse = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
        Prefer: "wait", // synchronous wait (up to 60s)
      },
      body: JSON.stringify({
        input: {
          prompt: enhancedPrompt,
          width: width ?? 1024,
          height: height ?? 1024,
          num_inference_steps: steps ?? 28,
          guidance: 3.5,
          output_format: "webp",
          output_quality: 90,
        },
      }),
    }
  )

  if (!startResponse.ok) {
    const err = await startResponse.text()
    throw new Error(`Replicate: ${err.slice(0, 200)}`)
  }

  const prediction = await startResponse.json()

  if (prediction.status === "succeeded" && prediction.output?.length > 0) {
    const imageUrl = prediction.output[0]

    // Store to Supabase Storage
    const storedUrl = await uploadToSupabaseStorage(ctx.orgId, imageUrl)

    await db.insert(actionLogs).values({
      orgId: ctx.orgId,
      type: "generate_image",
      status: "success",
      payload: { prompt: enhancedPrompt.slice(0, 200), url: storedUrl },
      costUsd: "0.04", // ~$0.04 per Flux 1.1 Pro image
    })

    return { success: true, url: storedUrl, prediction_id: prediction.id }
  }

  throw new Error(`Generation failed: ${prediction.error ?? "unknown"}`)
}
```

---

### 1.7 Nova — Agent Business

**Modèle**: `claude-opus-4-6` | **maxTokens**: 8192

**Tool: `get_stripe_metrics`** :

```typescript
get_stripe_metrics: async (input, ctx) => {
  const integration = await getIntegration(ctx.orgId, "stripe")
  if (!integration) throw new Error("Stripe non connecté")

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe((integration.credentials as { secret_key: string }).secret_key)

  const [customers, subscriptions, charges] = await Promise.all([
    stripe.customers.list({ limit: 1 }),
    stripe.subscriptions.list({ status: "active", limit: 100 }),
    stripe.charges.list({ limit: 100, created: { gte: getMonthStart() } }),
  ])

  const mrr = subscriptions.data.reduce((acc, sub) => {
    const monthly = sub.items.data.reduce((s, item) => {
      const amount = item.price.unit_amount ?? 0
      const isAnnual = item.price.recurring?.interval === "year"
      return s + (isAnnual ? amount / 12 : amount)
    }, 0)
    return acc + monthly
  }, 0)

  const currentMonthRevenue = charges.data
    .filter((c) => c.paid && !c.refunded)
    .reduce((acc, c) => acc + (c.amount ?? 0), 0)

  return {
    mrr_cents: mrr,
    mrr_formatted: `${(mrr / 100).toFixed(2)} EUR`,
    arr_cents: mrr * 12,
    active_subscriptions: subscriptions.data.length,
    total_customers: customers.total_count,
    current_month_revenue_cents: currentMonthRevenue,
  }
}
```

---

### 1.8 Alba — Agent RH

**Modèle**: `claude-sonnet-4-6` | **maxTokens**: 4096

**Tool: `parse_cv`** — extrait le texte d'un PDF via URL :

```typescript
parse_cv: async (input) => {
  const { file_url } = input as { file_url: string }

  const response = await fetch(file_url, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Cannot fetch CV: HTTP ${response.status}`)

  const contentType = response.headers.get("content-type") ?? ""
  const buffer = await response.arrayBuffer()

  // For PDFs: use pdf-parse (npm install pdf-parse)
  if (contentType.includes("pdf") || file_url.endsWith(".pdf")) {
    const pdf = await import("pdf-parse")
    const data = await pdf.default(Buffer.from(buffer))
    return {
      text: data.text.slice(0, 8000),
      pages: data.numpages,
      file_url,
      parsed: true,
    }
  }

  // For plain text/docx: basic text extraction
  const text = new TextDecoder().decode(buffer).slice(0, 8000)
  return { text, pages: 1, file_url, parsed: true }
}
```

---

### 1.9 Orion — Agent Automatisation

**Modèle**: `claude-opus-4-6` | **maxTokens**: 8192

**Tool: `generate_n8n_workflow`** :

```typescript
generate_n8n_workflow: async (input, ctx) => {
  const { description, trigger_type, integrations_needed } = input as {
    description: string
    trigger_type?: "webhook" | "schedule" | "manual"
    integrations_needed?: string[]
  }

  // Use Claude to generate valid n8n JSON
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const anthropic = new Anthropic()

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Generate a valid n8n workflow JSON for: ${description}
      
      Trigger type: ${trigger_type ?? "webhook"}
      Integrations: ${integrations_needed?.join(", ") ?? "none specified"}
      
      Return ONLY valid JSON that can be imported directly into n8n.
      Use n8n node types accurately (n8n-nodes-base.httpRequest, etc.).`,
    }],
  })

  const content = response.content[0]
  if (content.type !== "text") throw new Error("No response from Claude")

  // Extract JSON from response
  const jsonMatch = content.text.match(/```(?:json)?\n([\s\S]+?)\n```/)
  const workflowJson = jsonMatch?.[1] ?? content.text

  try {
    const parsed = JSON.parse(workflowJson)
    return { success: true, workflow_json: parsed, description }
  } catch {
    return { success: false, error: "Could not parse workflow JSON", raw: workflowJson.slice(0, 500) }
  }
}
```

---

## 2. CHAT STREAMING — FRONTEND

### 2.1 AgentChatTab — SSE Real Streaming

```typescript
// src/hooks/useAgentChat.ts
import { useState, useCallback, useRef } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  toolCalls?: ToolCall[]
}

interface ToolCall {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

export function useAgentChat(agentSlug: string, orgId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)
    setError(null)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
    ])

    abortRef.current = new AbortController()

    try {
      const response = await fetch(`/api/agents/${agentSlug}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": orgId, // FIX P0: pass real orgId
        },
        body: JSON.stringify({
          messages: messages
            .concat(userMsg)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break

          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string }
            if (parsed.error) {
              setError(parsed.error)
              break
            }
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              )
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      // Persist to DB after stream complete
      await persistMessages(orgId, agentSlug, userMsg, assistantId, messages)

    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      }
    } finally {
      setIsStreaming(false)
    }
  }, [agentSlug, orgId, messages, isStreaming])

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { messages, isStreaming, error, sendMessage, stopStream }
}
```

### 2.2 Persistence des messages en DB

```typescript
// src/lib/chat/persist.ts
import { db } from "@/lib/db"
import { conversations, messages, agentInstances } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function getOrCreateConversation(
  orgId: string,
  agentSlug: string,
  conversationId?: string
): Promise<string> {
  if (conversationId) return conversationId

  const instance = await db.query.agentInstances.findFirst({
    where: and(
      eq(agentInstances.orgId, orgId),
      eq(agentInstances.agentSlug, agentSlug)
    ),
  })

  const [conv] = await db
    .insert(conversations)
    .values({
      orgId,
      agentInstanceId: instance?.id ?? null,
      channel: "chat",
      startedAt: new Date(),
    })
    .returning({ id: conversations.id })

  return conv.id
}

export async function persistMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  model?: string,
  tokensInput?: number,
  tokensOutput?: number
): Promise<void> {
  await db.insert(messages).values({
    conversationId,
    role,
    content: JSON.stringify([{ type: "text", text: content }]),
    model,
    tokensInput,
    tokensOutput,
    createdAt: new Date(),
  })
}
```

### 2.3 Markdown rendering avec react-markdown

```tsx
// src/components/chat/AssistantMessage.tsx
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Props {
  content: string
  isStreaming?: boolean
}

export function AssistantMessage({ content, isStreaming }: Props) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const lang = /language-(\w+)/.exec(className || "")?.[1]
            return lang ? (
              <SyntaxHighlighter
                style={oneDark}
                language={lang}
                PreTag="div"
                className="rounded-lg text-xs"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5" />
      )}
    </div>
  )
}
```

---

## 3. BASE DE DONNÉES — QUERIES RÉELLES

### 3.1 Queries Drizzle manquantes à ajouter dans `src/lib/db/queries.ts`

```typescript
import { db } from "./index"
import {
  organizations, users, agentInstances, conversations,
  messages, actionLogs, prospects, usageEvents, agentMemories
} from "./schema"
import { eq, and, desc, gte, count, sum, sql } from "drizzle-orm"

// ─── Organizations ────────────────────────────────────────────────────────────

export async function getOrgById(id: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, id),
    with: { users: true, integrations: { columns: { provider: true, status: true } } },
  })
}

export async function updateOrgPlan(
  orgId: string,
  plan: "trial" | "starter" | "pro" | "scale",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  return db
    .update(organizations)
    .set({ plan, stripeCustomerId, stripeSubscriptionId })
    .where(eq(organizations.id, orgId))
    .returning()
}

export async function createOrg(name: string, ownerEmail: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)

  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      plan: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    })
    .returning()

  return org
}

// ─── Action Logs ──────────────────────────────────────────────────────────────

export async function getRecentActionLogs(orgId: string, limit = 50) {
  return db.query.actionLogs.findMany({
    where: eq(actionLogs.orgId, orgId),
    orderBy: desc(actionLogs.createdAt),
    limit,
    with: { agentInstance: { columns: { agentSlug: true } } },
  })
}

export async function getActionLogStats(orgId: string, sinceDate: Date) {
  return db
    .select({
      type: actionLogs.type,
      total: count(),
      successCount: sql<number>`SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)`,
      errorCount: sql<number>`SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)`,
      totalCost: sum(actionLogs.costUsd),
    })
    .from(actionLogs)
    .where(
      and(
        eq(actionLogs.orgId, orgId),
        gte(actionLogs.createdAt, sinceDate)
      )
    )
    .groupBy(actionLogs.type)
    .orderBy(desc(count()))
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversationWithMessages(
  conversationId: string,
  orgId: string
) {
  return db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      eq(conversations.orgId, orgId)
    ),
    with: {
      messages: {
        orderBy: messages.createdAt,
      },
    },
  })
}

export async function getConversationsByAgent(
  orgId: string,
  agentSlug: string,
  limit = 20
) {
  return db
    .select({
      id: conversations.id,
      channel: conversations.channel,
      startedAt: conversations.startedAt,
      endedAt: conversations.endedAt,
      summary: conversations.summary,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .innerJoin(agentInstances, eq(conversations.agentInstanceId, agentInstances.id))
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.orgId, orgId),
        eq(agentInstances.agentSlug, agentSlug)
      )
    )
    .groupBy(conversations.id)
    .orderBy(desc(conversations.startedAt))
    .limit(limit)
}

// ─── Usage / Analytics ────────────────────────────────────────────────────────

export async function getUsageSummary(orgId: string, sinceDate: Date) {
  return db
    .select({
      metric: usageEvents.metric,
      totalQuantity: sum(usageEvents.quantity),
      totalCost: sum(usageEvents.costUsd),
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.orgId, orgId),
        gte(usageEvents.createdAt, sinceDate)
      )
    )
    .groupBy(usageEvents.metric)
}

// ─── Prospects ────────────────────────────────────────────────────────────────

export async function getProspectsByStatus(orgId: string) {
  return db
    .select({
      status: prospects.status,
      count: count(),
    })
    .from(prospects)
    .where(eq(prospects.orgId, orgId))
    .groupBy(prospects.status)
}
```

### 3.2 RLS Policies Supabase

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

-- Fonction helper: récupère l'org_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations: un user ne voit que son org
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth.user_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = auth.user_org_id());

-- Users: visibles dans la même org
CREATE POLICY "users_select" ON users
  FOR SELECT USING (org_id = auth.user_org_id());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Integrations: seulement sa propre org
CREATE POLICY "integrations_all" ON integrations
  FOR ALL USING (org_id = auth.user_org_id());

-- Agent instances
CREATE POLICY "agent_instances_all" ON agent_instances
  FOR ALL USING (org_id = auth.user_org_id());

-- Conversations & messages (via org_id)
CREATE POLICY "conversations_all" ON conversations
  FOR ALL USING (org_id = auth.user_org_id());

CREATE POLICY "messages_all" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE org_id = auth.user_org_id()
    )
  );

-- Action logs: read-only pour users, write via service role
CREATE POLICY "action_logs_select" ON action_logs
  FOR SELECT USING (org_id = auth.user_org_id());

-- Prospects
CREATE POLICY "prospects_all" ON prospects
  FOR ALL USING (org_id = auth.user_org_id());

-- Agent memories
CREATE POLICY "agent_memories_all" ON agent_memories
  FOR ALL USING (org_id = auth.user_org_id());
```

### 3.3 Indexes optimaux

```sql
-- Conversations: listing par agent + date
CREATE INDEX conversations_agent_started_idx
  ON conversations(org_id, agent_instance_id, started_at DESC);

-- Messages: récupération d'une conversation
CREATE INDEX messages_conv_created_idx
  ON messages(conversation_id, created_at ASC);

-- Action logs: dashboard analytics
CREATE INDEX action_logs_org_type_date_idx
  ON action_logs(org_id, type, created_at DESC);

-- Usage events: billing queries
CREATE INDEX usage_events_org_metric_date_idx
  ON usage_events(org_id, metric, created_at DESC);

-- Prospects: kanban par status
CREATE INDEX prospects_org_status_created_idx
  ON prospects(org_id, status, created_at DESC);

-- Agent memories: vector similarity search
CREATE INDEX agent_memories_embedding_idx
  ON agent_memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
-- Note: nécessite pgvector installé dans Supabase
-- Activer: CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 4. API ROUTES — IMPLÉMENTATION COMPLÈTE

### 4.1 Fix P0: `x-org-id` dans `/api/agents/[slug]/chat`

```typescript
// src/app/api/agents/[slug]/chat/route.ts — version corrigée
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getUserWithOrg } from "@/lib/db/queries"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Auth: récupérer le vrai orgId
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userWithOrg = await getUserWithOrg(user.id)
  if (!userWithOrg) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const orgId = userWithOrg.orgId

  // Rate limiting (Upstash Redis)
  const rateLimitResult = await checkRateLimit(orgId, "chat", 50) // 50 req/min
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retry_after: rateLimitResult.retryAfter },
      { status: 429 }
    )
  }

  // ... reste de la route avec orgId réel
}
```

### 4.2 Route `/api/agents/[slug]/logs`

```typescript
// src/app/api/agents/[slug]/logs/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getConversationsByAgent, getRecentActionLogs } from "@/lib/db/queries"
import { requireAuth } from "@/lib/auth/server"

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  since: z.string().datetime().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { orgId } = await requireAuth(request)

  const { searchParams } = new URL(request.url)
  const query = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 422 })
  }

  const [conversations, logs] = await Promise.all([
    getConversationsByAgent(orgId, slug, query.data.limit),
    getRecentActionLogs(orgId, query.data.limit),
  ])

  return NextResponse.json({
    conversations,
    logs: logs.filter((l) => l.agentInstance?.agentSlug === slug),
    meta: { slug, orgId, limit: query.data.limit },
  })
}
```

### 4.3 Route `/api/agents/[slug]/run` (one-shot)

```typescript
// src/app/api/agents/[slug]/run/route.ts
import { runAgent } from "@/lib/agents/executor"
import { requireAuth } from "@/lib/auth/server"
import { persistMessage, getOrCreateConversation } from "@/lib/chat/persist"
import { z } from "zod"

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
})

export const maxDuration = 120

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { orgId } = await requireAuth(request)

  const body = bodySchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 422 })
  }

  const conversationId = await getOrCreateConversation(
    orgId,
    slug,
    body.data.conversationId
  )

  await persistMessage(conversationId, "user", body.data.message)

  const result = await runAgent({
    agentSlug: slug,
    messages: [{ role: "user", content: body.data.message }],
    config: body.data.config ?? {},
    orgId,
    conversationId,
  })

  await persistMessage(
    conversationId,
    "assistant",
    result.content,
    result.model,
    result.inputTokens,
    result.outputTokens
  )

  // Track usage
  await trackUsage(orgId, "llm_tokens", result.inputTokens + result.outputTokens)

  return NextResponse.json({
    content: result.content,
    conversationId,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      toolCalls: result.toolCallsCount,
    },
  })
}
```

### 4.4 Route `/api/integrations/[provider]` — connect/disconnect

```typescript
// src/app/api/integrations/[provider]/route.ts
import { z } from "zod"
import { upsertIntegration, disconnectIntegration, getIntegration } from "@/lib/integrations/manager"
import { requireAuth } from "@/lib/auth/server"

const connectSchema = z.object({
  credentials: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { orgId } = await requireAuth(request)

  const body = connectSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 422 })
  }

  // Validate credentials before saving
  const validation = await validateIntegrationCredentials(
    provider,
    body.data.credentials
  )
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Invalid credentials: ${validation.error}` },
      { status: 400 }
    )
  }

  await upsertIntegration(
    orgId,
    provider as IntegrationProvider,
    body.data.credentials,
    body.data.metadata
  )

  return NextResponse.json({ success: true, provider, status: "connected" })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { orgId } = await requireAuth(request)

  await disconnectIntegration(orgId, provider as IntegrationProvider)

  return NextResponse.json({ success: true, provider, status: "disconnected" })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { orgId } = await requireAuth(request)

  const integration = await getIntegration(orgId, provider as IntegrationProvider)
  if (!integration) {
    return NextResponse.json({ connected: false, provider })
  }

  // Never return credentials in GET
  return NextResponse.json({
    connected: true,
    provider,
    status: integration.status,
    connectedAt: integration.connectedAt,
    lastRefreshedAt: integration.lastRefreshedAt,
    metadata: integration.metadata,
  })
}
```

---

## 5. STRIPE — BILLING COMPLET

### 5.1 Fix critique: Webhook doit mettre à jour la DB

```typescript
// src/app/api/webhooks/stripe/route.ts — sections manquantes à ajouter
import { updateOrgPlan } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { organizations, invoices } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Dans le switch(event.type):

case "checkout.session.completed": {
  const session = event.data.object
  const orgId = session.metadata?.["org_id"]
  if (!orgId) break

  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : null

  // Déterminer le plan depuis les line items
  if (session.mode === "subscription" && subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    })
    const priceId = sub.items.data[0]?.price?.id
    const plan = PRICE_TO_PLAN[priceId ?? ""] ?? "starter"

    await updateOrgPlan(orgId, plan, customerId ?? undefined, subscriptionId)
  }
  break
}

case "customer.subscription.updated": {
  const subscription = event.data.object
  const orgId = subscription.metadata?.["org_id"]
  if (!orgId) break

  const priceId = subscription.items.data[0]?.price?.id
  const plan = PRICE_TO_PLAN[priceId ?? ""] ?? "starter"

  if (subscription.status === "active" || subscription.status === "trialing") {
    await updateOrgPlan(orgId, plan)
  } else if (subscription.status === "past_due") {
    // Downgrade gracieux — garder le plan actuel mais alerter
    await sendUsageAlert(orgId, "payment_past_due")
  }
  break
}

case "customer.subscription.deleted": {
  const subscription = event.data.object
  const orgId = subscription.metadata?.["org_id"]
  if (!orgId) break

  await updateOrgPlan(orgId, "trial")
  break
}

case "invoice.payment_succeeded": {
  const invoice = event.data.object
  const orgId = invoice.subscription_details?.metadata?.["org_id"]
    ?? invoice.metadata?.["org_id"]
  if (!orgId) break

  // Persist invoice in DB
  await db.insert(invoices).values({
    orgId,
    stripeInvoiceId: invoice.id,
    amountCents: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "eur",
    status: "paid",
    periodStart: invoice.period_start
      ? new Date(invoice.period_start * 1000).toISOString().split("T")[0]
      : null,
    periodEnd: invoice.period_end
      ? new Date(invoice.period_end * 1000).toISOString().split("T")[0]
      : null,
  })
  break
}
```

### 5.2 Mapping Price IDs → Plans

```typescript
// src/lib/billing/plans.ts
export const PRICE_TO_PLAN: Record<string, "starter" | "pro" | "scale"> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? ""]: "starter",
  [process.env.STRIPE_PRICE_STARTER_ANNUAL ?? ""]: "starter",
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? ""]: "pro",
  [process.env.STRIPE_PRICE_PRO_ANNUAL ?? ""]: "pro",
  [process.env.STRIPE_PRICE_SCALE_MONTHLY ?? ""]: "scale",
  [process.env.STRIPE_PRICE_SCALE_ANNUAL ?? ""]: "scale",
}

export const PLAN_LIMITS = {
  trial: {
    agentsActive: 1,
    messagesPerMonth: 100,
    storageGb: 0.5,
    teamMembers: 1,
    voiceMinutesPerMonth: 0,
  },
  starter: {
    agentsActive: 3,
    messagesPerMonth: 1000,
    storageGb: 5,
    teamMembers: 3,
    voiceMinutesPerMonth: 60,
  },
  pro: {
    agentsActive: 9,
    messagesPerMonth: 10000,
    storageGb: 50,
    teamMembers: 10,
    voiceMinutesPerMonth: 300,
  },
  scale: {
    agentsActive: 9,
    messagesPerMonth: Infinity,
    storageGb: 500,
    teamMembers: Infinity,
    voiceMinutesPerMonth: Infinity,
  },
} as const
```

### 5.3 Plan enforcement middleware

```typescript
// src/lib/billing/enforce.ts
import { getUserWithOrg } from "@/lib/db/queries"
import { getUsageSummary } from "@/lib/db/queries"
import { PLAN_LIMITS } from "./plans"

export async function checkPlanLimit(
  orgId: string,
  metric: keyof typeof PLAN_LIMITS.trial
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const org = await getUserWithOrg(orgId) // get org plan
  const plan = (org?.organization?.plan ?? "trial") as keyof typeof PLAN_LIMITS
  const limit = PLAN_LIMITS[plan][metric] as number

  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const usage = await getUsageSummary(orgId, since)
  const current = Number(usage.find((u) => u.metric === metric)?.totalQuantity ?? 0)

  return { allowed: current < limit, current, limit }
}
```

---

## 6. AUTH — SUPABASE FLOW

### 6.1 Auth helper server-side

```typescript
// src/lib/auth/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getUserWithOrg } from "@/lib/db/queries"
import { NextRequest, NextResponse } from "next/server"

export async function requireAuth(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError("Not authenticated")
  }

  const userWithOrg = await getUserWithOrg(user.id)

  if (!userWithOrg) {
    throw new UnauthorizedError("User record not found — org not provisioned")
  }

  return {
    userId: user.id,
    orgId: userWithOrg.orgId,
    role: userWithOrg.role,
    org: userWithOrg.organization,
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}
```

### 6.2 Organisation créée au signup

```typescript
// src/app/api/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { createOrg } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`)

  const cookieStore = await cookies()
  const supabase = createServerClient(...)

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Check if user already has org
  const existing = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  })

  if (!existing) {
    // First login — create org
    const orgName = user.user_metadata?.["full_name"] ?? user.email?.split("@")[0] ?? "Mon Org"
    const org = await createOrg(orgName, user.email!)

    await db.insert(users).values({
      id: user.id,
      orgId: org.id,
      email: user.email!,
      fullName: user.user_metadata?.["full_name"] ?? null,
      role: "owner",
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
```

---

## 7. INTÉGRATIONS — CHAQUE PROVIDER

### 7.1 Google OAuth (Calendar + Gmail)

```typescript
// src/app/api/integrations/google/route.ts
import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
)

// GET /api/integrations/google → redirect to Google consent
export async function GET(request: NextRequest) {
  const { orgId } = await requireAuth(request)

  const state = Buffer.from(JSON.stringify({ orgId })).toString("base64url")

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    state,
    prompt: "consent", // force refresh_token
  })

  return NextResponse.redirect(authUrl)
}
```

```typescript
// src/app/api/integrations/google/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=oauth_failed`)
  }

  const { orgId } = JSON.parse(Buffer.from(state, "base64url").toString())

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  // Get user info for metadata
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
  const { data: profile } = await oauth2.userinfo.get()

  await upsertIntegration(orgId, "google", {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
  }, {
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  })

  return NextResponse.redirect(`${APP_URL}/dashboard/integrations?connected=google`)
}
```

### 7.2 Twilio — connect flow

```typescript
// Credentials needed: account_sid, auth_token, from_number (phone number)
// Validation: ping Twilio API to verify credentials

async function validateTwilioCredentials(creds: {
  account_sid: string
  auth_token: string
  from_number: string
}): Promise<{ valid: boolean; error?: string }> {
  try {
    const Twilio = (await import("twilio")).default
    const client = new Twilio(creds.account_sid, creds.auth_token)
    // Verify account exists
    await client.api.accounts(creds.account_sid).fetch()
    // Verify phone number belongs to account
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: creds.from_number })
    if (numbers.length === 0) {
      return { valid: false, error: `Phone number ${creds.from_number} not found in account` }
    }
    return { valid: true }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Invalid credentials" }
  }
}
```

### 7.3 ElevenLabs — validation

```typescript
async function validateElevenLabsCredentials(creds: { api_key: string }) {
  const response = await fetch("https://api.elevenlabs.io/v1/user", {
    headers: { "xi-api-key": creds.api_key },
  })
  if (!response.ok) return { valid: false, error: "Invalid API key" }
  const user = await response.json()
  return { valid: true, metadata: { subscription: user.subscription?.tier } }
}
```

### 7.4 Replicate — validation

```typescript
async function validateReplicateCredentials(creds: { api_token: string }) {
  const response = await fetch("https://api.replicate.com/v1/account", {
    headers: { Authorization: `Bearer ${creds.api_token}` },
  })
  if (!response.ok) return { valid: false, error: "Invalid API token" }
  return { valid: true }
}
```

### 7.5 n8n — connect via webhook URL + secret

Les credentials n8n sont un `webhook_url` (URL d'un webhook trigger dans n8n) et un `secret` (pour HMAC).
Pas de validation serveur-side possible sans accès n8n — on fait un test ping :

```typescript
async function validateN8nCredentials(creds: { webhook_url: string; secret: string }) {
  try {
    const body = JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })
    const signature = await signHmac(body, creds.secret)
    const response = await fetch(creds.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lynaris-Signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    return { valid: response.ok || response.status < 500, statusCode: response.status }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Connection failed" }
  }
}
```

---

## 8. VOIX MARINE — TWILIO + DEEPGRAM + ELEVENLABS

### 8.1 TwiML incoming call

```typescript
// src/app/api/voice/incoming/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { validateRequest } from "twilio"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("x-twilio-signature") ?? ""

  // Verify Twilio signature
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? ""
  const url = process.env.NEXT_PUBLIC_APP_URL + "/api/voice/incoming"

  const params = Object.fromEntries(new URLSearchParams(body))
  const valid = validateRequest(twilioAuthToken, signature, url, params)

  if (!valid && process.env.NODE_ENV === "production") {
    return new Response("Forbidden", { status: 403 })
  }

  const orgId = params["To"]
    ? await getOrgByTwilioNumber(params["To"]) ?? "demo"
    : "demo"

  const wsUrl = process.env.VOICE_WS_URL ?? "wss://your-domain.com/api/voice/stream"

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}?org=${orgId}&amp;agent=marine">
      <Parameter name="org_id" value="${orgId}" />
      <Parameter name="agent_slug" value="marine" />
    </Stream>
  </Connect>
</Response>`

  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  })
}
```

### 8.2 Deepgram STT integration dans voice-ws.ts

```typescript
// Ajouter dans src/server/voice-ws.ts
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk"

interface DeepgramConnection {
  send: (data: Buffer) => void
  finish: () => void
}

function createDeepgramConnection(
  session: CallSession,
  onTranscript: (text: string, isFinal: boolean) => void
): DeepgramConnection {
  const deepgramKey = process.env.DEEPGRAM_API_KEY
  if (!deepgramKey) {
    console.warn("[Voice] DEEPGRAM_API_KEY not set")
    return { send: () => {}, finish: () => {} }
  }

  const deepgram = createClient(deepgramKey)

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "fr",
    punctuate: true,
    smart_format: true,
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
  })

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript
    if (!transcript) return

    const isFinal = data.is_final && data.speech_final
    onTranscript(transcript, isFinal)
  })

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error("[Voice] Deepgram error", err)
  })

  return {
    send: (data: Buffer) => {
      if (connection.getReadyState() === 1) { // OPEN
        connection.send(data)
      }
    },
    finish: () => connection.finish(),
  }
}

// Dans le case "start":
case "start": {
  if (!event.start) break
  // ... create session ...

  let pendingTranscript = ""

  const dgConn = createDeepgramConnection(session, (text, isFinal) => {
    pendingTranscript = text
    if (isFinal && pendingTranscript.trim().length > 2) {
      void processUserSpeech(session, pendingTranscript.trim())
      pendingTranscript = ""
    }
  })

  session.dgConn = dgConn
  break
}

// Dans le case "media":
case "media": {
  if (!session?.dgConn || !event.media?.payload) break
  const audioBuffer = Buffer.from(event.media.payload, "base64")
  session.dgConn.send(audioBuffer)
  break
}
```

### 8.3 ElevenLabs streaming avec interruption

```typescript
// Amélioration: envoyer TTS par chunks pour réduire la latence
async function sendAudioToTwilioStreaming(
  session: CallSession,
  text: string
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID_MARINE ?? "pNInz6obpgDQGcFmaJgB"

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey!,
        "Content-Type": "application/json",
        Accept: "audio/basic",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5", // faster for voice
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.1 },
        output_format: "ulaw_8000",
      }),
    }
  )

  if (!response.ok || !response.body) return

  // Stream chunks directly to Twilio (lower latency)
  const reader = response.body.getReader()
  const CHUNK_SIZE = 3200 // 200ms of mulaw audio

  let buffer = Buffer.alloc(0)

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      // Send remaining buffer
      if (buffer.length > 0 && session.ws.readyState === 1) {
        session.ws.send(JSON.stringify({
          event: "media",
          streamSid: session.streamSid,
          media: { payload: buffer.toString("base64") },
        }))
      }
      break
    }

    buffer = Buffer.concat([buffer, value])

    while (buffer.length >= CHUNK_SIZE) {
      const chunk = buffer.subarray(0, CHUNK_SIZE)
      buffer = buffer.subarray(CHUNK_SIZE)

      if (session.ws.readyState === 1) {
        session.ws.send(JSON.stringify({
          event: "media",
          streamSid: session.streamSid,
          media: { payload: chunk.toString("base64") },
        }))
      }
    }
  }
}
```

---

## 9. TOOLS — IMPLÉMENTATION RÉELLE (SUMMARY)

Toutes les tools handlers sont actuellement des stubs dans `src/lib/agents/tools/index.ts`.

**Plan de migration** :

1. Créer `src/lib/agents/tools/` avec un fichier par agent :
   - `marine.ts` — Google Calendar + Twilio SMS
   - `charles.ts` — Google Calendar + Gmail + pgvector memory + delegate
   - `lou.ts` — scrape_url + wordpress + n8n publish
   - `elio.ts` — DB prospects CRUD + Dropcontact
   - `mae.ts` — Gmail API complet
   - `max.ts` — Replicate Flux 1.1 + Supabase Storage
   - `nova.ts` — Stripe metrics
   - `alba.ts` — PDF parse + Google Calendar interviews
   - `orion.ts` — Claude codegen + n8n deploy API

2. Refactorer `index.ts` pour importer depuis ces fichiers :

```typescript
// src/lib/agents/tools/index.ts — après refactor
import { marineTools } from "./marine"
import { charlesTools } from "./charles"
// ... etc

const toolHandlers = {
  ...marineTools,
  ...charlesTools,
  ...louTools,
  ...elioTools,
  ...maeTools,
  ...maxTools,
  ...novaTools,
  ...albaTools,
  ...orionTools,
}
```

3. **Action log** dans chaque tool handler :

```typescript
// Pattern standard pour chaque tool
async function myTool(input: unknown, ctx: ToolCallContext) {
  const start = Date.now()
  try {
    const result = await doActualWork(input)

    await db.insert(actionLogs).values({
      orgId: ctx.orgId,
      conversationId: ctx.conversationId ?? null,
      type: "tool_name",
      status: "success",
      payload: sanitizeForLog(input, result),
      durationMs: Date.now() - start,
    })

    return result
  } catch (err) {
    await db.insert(actionLogs).values({
      orgId: ctx.orgId,
      type: "tool_name",
      status: "error",
      errorMessage: err instanceof Error ? err.message : "unknown",
      durationMs: Date.now() - start,
    })
    throw err
  }
}
```

---

## 10. DASHBOARD — TOUTES LES PAGES

### 10.1 `/dashboard` — Vue d'ensemble

**State** : `orgStats`, `recentLogs`, `agentActivity`, `activeAgentsCount`

**API calls** :
- `GET /api/dashboard/stats` → `{ messagesThisMonth, activeAgents, callsToday, automationsRun }`
- `GET /api/agents/activity?limit=10` → dernières actions

**Composants** :
- `StatsGrid` — 4 KPI cards avec skeleton loading
- `AgentActivityFeed` — liste temps réel des dernières actions
- `ActiveAgentsStatus` — état de chaque agent (actif/inactif)

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react"
import { requireAuth } from "@/lib/auth/server"
import { getRecentActionLogs, getActionLogStats } from "@/lib/db/queries"

export default async function DashboardPage() {
  const { orgId } = await requireAuth(/* request from cookies */)

  const since = new Date()
  since.setMonth(since.getMonth() - 1)

  const [logs, stats] = await Promise.all([
    getRecentActionLogs(orgId, 10),
    getActionLogStats(orgId, since),
  ])

  return (
    <div className="space-y-6">
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid stats={stats} />
      </Suspense>
      <ActivityFeed logs={logs} />
    </div>
  )
}
```

### 10.2 `/dashboard/agents/[slug]` — Page agent

**State** :
- `isActive` — depuis `agent_instances.is_active`
- `config` — depuis `agent_instances.config`
- `conversations` — historique paginé
- `activeTab` — "chat" | "logs" | "settings"

**Optimistic update pour toggle activation** :

```typescript
async function toggleAgent(slug: string, currentState: boolean) {
  // Optimistic update
  setIsActive(!currentState)

  try {
    const res = await fetch(`/api/agents/${slug}/toggle`, { method: "POST" })
    if (!res.ok) throw new Error("Toggle failed")
  } catch {
    // Revert
    setIsActive(currentState)
    toast.error("Failed to toggle agent")
  }
}
```

### 10.3 `/dashboard/integrations`

```typescript
// Pattern: fetch all integrations status, render connect/disconnect per provider
const PROVIDERS = [
  { id: "google", name: "Google (Calendar + Gmail)", icon: "..." },
  { id: "twilio", name: "Twilio", icon: "..." },
  { id: "elevenlabs", name: "ElevenLabs", icon: "..." },
  { id: "n8n", name: "n8n", icon: "..." },
  { id: "make", name: "Make", icon: "..." },
  { id: "stripe", name: "Stripe", icon: "..." },
  { id: "replicate", name: "Replicate", icon: "..." },
  { id: "wordpress", name: "WordPress", icon: "..." },
] as const

// GET /api/integrations/status → { provider: "google", status: "connected" | "disconnected" }[]
```

### 10.4 `/dashboard/billing`

**State** : `currentPlan`, `usage`, `invoices`

```typescript
// Skeleton states par défaut, real data via RSC
export default async function BillingPage() {
  const { orgId, org } = await requireAuth(...)

  const since = new Date()
  since.setDate(1)

  const [usage, invoices] = await Promise.all([
    getUsageSummary(orgId, since),
    db.query.invoices.findMany({
      where: eq(invoices.orgId, orgId),
      orderBy: desc(invoices.createdAt),
      limit: 12,
    }),
  ])

  return <BillingView plan={org.plan} usage={usage} invoices={invoices} />
}
```

---

## 11. FEATURES MANQUANTES À AJOUTER

### 11.1 Rate Limiting (Upstash Redis)

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiters = {
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 m"),
    prefix: "rl:chat",
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 m"),
    prefix: "rl:api",
  }),
  voice: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:voice",
  }),
}

export async function checkRateLimit(
  orgId: string,
  type: keyof typeof limiters,
  customLimit?: number
): Promise<{ success: boolean; retryAfter?: number }> {
  const limiter = limiters[type]
  const { success, reset } = await limiter.limit(orgId)

  return {
    success,
    retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
  }
}
```

### 11.2 Supabase Realtime pour le Dashboard

```typescript
// src/hooks/useRealtimeLogs.ts
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export function useRealtimeLogs(orgId: string) {
  const [logs, setLogs] = useState<ActionLog[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const channel = supabase
      .channel(`action_logs:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "action_logs",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as ActionLog, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [orgId])

  return logs
}
```

### 11.3 Export CSV

```typescript
// src/app/api/export/logs/route.ts
export async function GET(request: NextRequest) {
  const { orgId } = await requireAuth(request)
  const { searchParams } = new URL(request.url)

  const since = searchParams.get("since")
    ? new Date(searchParams.get("since")!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const logs = await db.query.actionLogs.findMany({
    where: and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, since)),
    orderBy: desc(actionLogs.createdAt),
    limit: 10000,
  })

  const header = "id,type,status,agent,duration_ms,cost_usd,created_at\n"
  const rows = logs.map((l) =>
    [l.id, l.type, l.status, "", l.durationMs ?? "", l.costUsd ?? "", l.createdAt.toISOString()].join(",")
  ).join("\n")

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lynaris-logs-${Date.now()}.csv"`,
    },
  })
}
```

### 11.4 Onboarding Flow (first-time user)

```
Steps:
1. Nom de l'organisation (pré-rempli depuis signup)
2. Secteur d'activité (cabinet médical / e-commerce / startup / autre)
3. Premier agent à activer (suggestion basée sur le secteur)
4. Connexion d'une première intégration (Google ou n8n selon l'agent)
5. Test de l'agent en mode sandbox
6. "Votre premier agent est prêt !"

State: organizations.settings.onboarding_completed = true
Route: /dashboard/onboarding (redirect si non complété)
```

### 11.5 Agent Scheduling (cron)

```typescript
// src/app/api/cron/agents/route.ts
// Vercel Cron: */5 * * * * (every 5 minutes)
export const config = { runtime: "nodejs" }

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all orgs with scheduled agent tasks
  const scheduledTasks = await db.query.agentInstances.findMany({
    where: and(
      eq(agentInstances.isActive, true),
      sql`config->>'cron_enabled' = 'true'`
    ),
  })

  for (const task of scheduledTasks) {
    const config = task.config as { cron_message?: string; cron_expression?: string }
    if (!config.cron_message) continue

    await runAgent({
      agentSlug: task.agentSlug,
      messages: [{ role: "user", content: config.cron_message }],
      config: task.config as Record<string, unknown>,
      orgId: task.orgId,
    })
  }

  return NextResponse.json({ processed: scheduledTasks.length })
}
```

### 11.6 API Key Management

```sql
-- Nouvelle table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,      -- SHA-256 de la clé
  key_prefix TEXT NOT NULL,           -- "lyn_" + 8 premiers chars pour display
  scopes TEXT[] NOT NULL DEFAULT '{}', -- ["agents:read", "agents:write"]
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX api_keys_org_id_idx ON api_keys(org_id);
CREATE INDEX api_keys_hash_idx ON api_keys(key_hash);
```

```typescript
// Génération: lyn_ + 32 chars base64url
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(24)
  const key = "lyn_" + random.toString("base64url")
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  const prefix = key.slice(0, 12)
  return { key, hash, prefix }
}
```

---

## 12. SÉCURITÉ

### 12.1 Webhook signature verification

```typescript
// src/lib/crypto.ts — fonctions existantes
export async function signHmac(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  return Buffer.from(sig).toString("hex")
}

export async function verifyHmac(
  body: string,
  secret: string,
  signature: string
): Promise<boolean> {
  const expected = await signHmac(body, secret)
  // Constant-time comparison
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  )
}
```

### 12.2 Input sanitization

```typescript
// Toutes les API routes utilisent Zod — patterns:
const messageSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(10_000, "Message too long")
    .trim()
    .refine((s) => !/<script/i.test(s), "HTML not allowed"),
})

// Sanitiser les payloads avant log
function sanitizeForLog(input: unknown, result: unknown) {
  const str = JSON.stringify({ input, result })
  return JSON.parse(str.slice(0, 5000)) // Cap at 5KB
}
```

### 12.3 CORS pour API publique

```typescript
// src/app/api/public/[...]/route.ts
const ALLOWED_ORIGINS = [
  "https://lynarisai.com",
  "https://app.lynarisai.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
]

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}
```

### 12.4 Audit logs pour actions sensibles

```typescript
// Logger tout: login, plan change, agent toggle, integration connect/disconnect
async function auditLog(
  orgId: string,
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>,
  request?: NextRequest
) {
  await db.insert(auditLogs).values({
    orgId,
    userId,
    action,
    ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    userAgent: request?.headers.get("user-agent") ?? null,
    metadata: metadata ?? {},
  })
}
```

---

## 13. PERFORMANCE

### 13.1 React Suspense boundaries

```tsx
// Chaque section du dashboard est wrappée
<Suspense fallback={<KPICardsSkeleton />}>
  <KPICards orgId={orgId} />
</Suspense>

<Suspense fallback={<AgentListSkeleton />}>
  <AgentList orgId={orgId} />
</Suspense>
```

### 13.2 Redis caching strategy

```typescript
// src/lib/cache.ts
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh))
  return fresh
}

// Usage patterns:
// Agent registry: TTL 3600s (1h) — change rarement
// Dashboard stats: TTL 60s — OK si légèrement stale
// Integration status: TTL 300s (5min)
// Prospect counts: TTL 120s

export const cacheKeys = {
  agentInstances: (orgId: string) => `org:${orgId}:agents`,
  dashboardStats: (orgId: string) => `org:${orgId}:stats`,
  integrationStatus: (orgId: string) => `org:${orgId}:integrations`,
}
```

### 13.3 DB query optimization

```typescript
// Problème: N+1 sur action_logs avec agentInstance
// Fix: utiliser .with() pour eager loading

// Mauvais
const logs = await db.query.actionLogs.findMany({ where: ... })
for (const log of logs) {
  const instance = await db.query.agentInstances.findFirst({ where: ... }) // N+1
}

// Bon
const logs = await db.query.actionLogs.findMany({
  where: eq(actionLogs.orgId, orgId),
  with: {
    agentInstance: { columns: { agentSlug: true } }, // JOIN unique
  },
  limit: 50,
})
```

### 13.4 Next.js streaming RSC

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react"

// Chaque composant async est streamé indépendamment
export default function DashboardPage() {
  return (
    <div>
      {/* Rendu immédiatement */}
      <PageHeader title="Dashboard" />

      {/* Streamé dès que prêt */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />  {/* async component avec DB query */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed />  {/* async component avec DB query */}
      </Suspense>
    </div>
  )
}
```

---

## 14. TESTS

### 14.1 Unit tests pour tools/

```typescript
// src/lib/agents/tools/__tests__/marine.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkCalendarAvailability, createCalendarEvent } from "../marine"

// Mock Google Calendar
vi.mock("googleapis", () => ({
  google: {
    auth: { OAuth2: vi.fn(() => ({ setCredentials: vi.fn() })) },
    calendar: vi.fn(() => ({
      freebusy: { query: vi.fn().mockResolvedValue({ data: { calendars: { primary: { busy: [] } } } }) },
      events: { insert: vi.fn().mockResolvedValue({ data: { id: "evt_123", htmlLink: "https://..." } }) },
    })),
  },
}))

vi.mock("@/lib/integrations/manager", () => ({
  getIntegration: vi.fn().mockResolvedValue({
    status: "connected",
    credentials: { access_token: "fake", refresh_token: "fake" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: { insert: vi.fn(() => ({ values: vi.fn() })) },
}))

describe("checkCalendarAvailability", () => {
  it("returns available slots", async () => {
    const result = await checkCalendarAvailability(
      { date_range: "tomorrow", duration_minutes: 30 },
      { orgId: "org_123", agentSlug: "marine", toolName: "check_calendar_availability", input: {} }
    )
    expect(result).toHaveProperty("available_slots")
    expect(Array.isArray((result as any).available_slots)).toBe(true)
  })

  it("throws when Google not connected", async () => {
    const { getIntegration } = await import("@/lib/integrations/manager")
    vi.mocked(getIntegration).mockResolvedValueOnce(null)

    await expect(
      checkCalendarAvailability({ date_range: "tomorrow" }, { orgId: "org_123", agentSlug: "marine", toolName: "", input: {} })
    ).rejects.toThrow("Google Calendar non connecté")
  })
})
```

### 14.2 Integration tests pour API routes

```typescript
// src/app/api/agents/__tests__/chat.test.ts
import { describe, it, expect, vi } from "vitest"
import { POST } from "../[slug]/chat/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/agents/executor", () => ({
  streamAgent: async function* () {
    yield "Bonjour, je suis Marine. "
    yield "Comment puis-je vous aider ?"
  },
}))

vi.mock("@/lib/auth/server", () => ({
  requireAuth: vi.fn().mockResolvedValue({ orgId: "org_test", userId: "usr_test" }),
}))

describe("POST /api/agents/[slug]/chat", () => {
  it("streams SSE events", async () => {
    const request = new NextRequest("http://localhost/api/agents/marine/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Bonjour" }],
      }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: "marine" }) })

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("text/event-stream")

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let full = ""

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
    }

    expect(full).toContain("data:")
    expect(full).toContain("[DONE]")
  })

  it("returns 404 for unknown agent", async () => {
    const request = new NextRequest("http://localhost/api/agents/unknown/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    })

    const response = await POST(request, { params: Promise.resolve({ slug: "unknown" }) })
    expect(response.status).toBe(404)
  })
})
```

### 14.3 E2E auth flow (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test"

test("magic link signup flow", async ({ page }) => {
  await page.goto("/signup")

  await page.fill('[name="email"]', "test@example.com")
  await page.click('button[type="submit"]')

  await expect(page.locator("text=Vérifiez votre email")).toBeVisible()
})

test("authenticated user redirected to dashboard", async ({ page, context }) => {
  // Set auth cookies (from Supabase test session)
  await context.addCookies([/* supabase session cookies */])

  await page.goto("/login")
  await expect(page).toHaveURL("/dashboard")
})

test("unauthenticated user redirected from dashboard", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL("/login")
})
```

---

## 15. DÉPLOIEMENT

### 15.1 Vercel config (`vercel.json`)

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "functions": {
    "src/app/api/agents/*/chat/route.ts": { "maxDuration": 60 },
    "src/app/api/agents/*/run/route.ts": { "maxDuration": 120 },
    "src/app/api/webhooks/stripe/route.ts": { "maxDuration": 30 }
  },
  "crons": [
    {
      "path": "/api/cron/agents",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/usage-rollup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 15.2 Variables d'environnement — checklist complète

```bash
# ── Supabase ─────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=            # ✅ configuré
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # vérifier
SUPABASE_SERVICE_ROLE_KEY=           # pour migrations + RLS bypass

# ── DB ───────────────────────────────────────────────────
DATABASE_URL=                        # ✅ configuré

# ── Anthropic ────────────────────────────────────────────
ANTHROPIC_API_KEY=                   # ✅ configuré

# ── Stripe ───────────────────────────────────────────────
STRIPE_SECRET_KEY=                   # à configurer
STRIPE_PUBLISHABLE_KEY=              # à configurer
STRIPE_WEBHOOK_SECRET=               # généré par: stripe listen --print-secret
STRIPE_PRICE_STARTER_MONTHLY=        # ID price Stripe
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_SCALE_MONTHLY=
STRIPE_PRICE_SCALE_ANNUAL=

# ── Google OAuth ─────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Twilio ───────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# ── ElevenLabs ───────────────────────────────────────────
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_MARINE=          # ex: pNInz6obpgDQGcFmaJgB (Bella)

# ── Deepgram ─────────────────────────────────────────────
DEEPGRAM_API_KEY=

# ── Replicate ────────────────────────────────────────────
REPLICATE_API_TOKEN=

# ── Resend (email) ───────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM_EMAIL=                   # ex: noreply@lynarisai.com

# ── Upstash Redis ────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── App config ───────────────────────────────────────────
NEXT_PUBLIC_APP_URL=                 # ex: https://app.lynarisai.com
INTEGRATIONS_ENCRYPTION_KEY=        # ✅ configuré (32 bytes hex)
CRON_SECRET=                         # aléatoire, 32 chars
VOICE_WS_PORT=3001                   # pour le serveur voice standalone
VOICE_WS_URL=                        # wss://... URL publique du WS
```

### 15.3 Supabase migrations order

```bash
# Ordre d'exécution (dans supabase/migrations/)
001_create_enums.sql
002_create_organizations.sql
003_create_users.sql
004_create_integrations.sql
005_create_agent_instances.sql
006_create_conversations.sql
007_create_messages.sql
008_create_action_logs.sql
009_create_n8n_runs.sql
010_create_agent_memories.sql   # nécessite pgvector
011_create_prospects.sql
012_create_prospecting_sequences.sql
013_create_usage_events.sql
014_create_invoices.sql
015_create_audit_logs.sql
016_create_api_keys.sql          # nouvelle table
017_rls_policies.sql
018_indexes.sql
019_functions.sql                # auth.user_org_id(), etc.
```

```bash
# Commandes
supabase db push                  # push migrations to remote
supabase db reset                 # reset local dev DB
drizzle-kit push                  # sync schema changes

# Activer pgvector sur Supabase (une seule fois)
# Dashboard > Database > Extensions > enable vector
```

### 15.4 Twilio webhook setup

```bash
# Configurer le webhook incoming call dans Twilio Console:
# Phone Numbers > Your Number > Voice Configuration
# A call comes in: Webhook
# URL: https://app.lynarisai.com/api/voice/incoming
# Method: HTTP POST

# Voice WebSocket server: déployer séparément sur Railway/Render/Fly
# ou sur un VPS avec PM2:
npx tsx src/server/voice-ws.ts
# ou
pm2 start --interpreter tsx src/server/voice-ws.ts --name lynaris-voice
```

### 15.5 Stripe webhook setup

```bash
# Dev local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed  # test

# Production: Stripe Dashboard > Developers > Webhooks
# URL: https://app.lynarisai.com/api/webhooks/stripe
# Events à activer:
#   checkout.session.completed
#   customer.subscription.updated
#   customer.subscription.deleted
#   invoice.payment_succeeded
#   invoice.payment_failed
```

---

## 16. ORDRE DE PRIORITÉ D'IMPLÉMENTATION

### Sprint 1 — Fondations critiques (1 semaine)
1. **Fix P0**: `x-org-id` dans chat route → auth réel avec `requireAuth()`
2. **Fix P0**: Stripe webhook → `updateOrgPlan()` en DB
3. **Fix P1**: Persister messages en DB après chaque chat
4. Google Calendar tool handler réel (Marine)
5. Twilio SMS tool handler réel (Marine)

### Sprint 2 — Voice Pipeline (1 semaine)
1. Deepgram SDK installé + intégré dans voice-ws.ts
2. Deepgram WebSocket connection par session
3. Chunk streaming ElevenLabs → latence réduite
4. Enregistrement conversation (DB) en fin d'appel
5. Tests appel complet avec vrai numéro Twilio

### Sprint 3 — Outils essentiels (1 semaine)
1. Gmail list/read/draft (Mae)
2. Replicate image generation (Max)
3. pgvector search_memory (Charles)
4. Stripe metrics (Nova)
5. Prospects DB CRUD (Elio)

### Sprint 4 — Infrastructure (1 semaine)
1. Rate limiting Upstash sur toutes les API routes
2. Supabase Realtime pour action_logs
3. Export CSV
4. Onboarding flow
5. API key management

### Sprint 5 — Polish & Tests (1 semaine)
1. Unit tests tools/
2. Integration tests API routes
3. E2E auth flow
4. Performance: Suspense boundaries + Redis cache
5. Audit logs pour actions sensibles

---

*Fin du Master Plan — 2026-04-23*
