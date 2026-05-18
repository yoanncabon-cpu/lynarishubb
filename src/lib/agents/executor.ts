import Anthropic from "@anthropic-ai/sdk"
import { logger } from "@/lib/logger"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { getAgent, type AgentConfig } from "./registry"
import { executeTool } from "./tools/index"
import type { EmailStyleConfig } from "@/lib/db/schema"
// routeRequest et providers non-Anthropic désactivés — tous les agents utilisent
// directement leur agentDef.model (Anthropic) pour éviter les appels LLM supplémentaires.
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrgPlanId, instrumentTurnComplete } from "./instrumentation"

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
})

// Garde les N derniers messages en respectant les paires tool_use/tool_result
const MAX_HISTORY = 20
function trimHistory(messages: MessageParam[]): MessageParam[] {
  if (messages.length <= MAX_HISTORY) return messages
  let trimmed = messages.slice(messages.length - MAX_HISTORY)
  // Ne pas commencer par un tool_result orphelin (son tool_use est coupé)
  const first = trimmed[0]
  if (
    first &&
    Array.isArray(first.content) &&
    (first.content as Array<{ type: string }>).some(b => b.type === "tool_result")
  ) {
    trimmed = trimmed.slice(2)
  }
  return trimmed
}

/**
 * Sanitise les messages avant envoi à Anthropic.
 * - Retire les messages user avec content vide (string vide ou tableau vide)
 * - Remplace les tool_result avec content vide par "{}" (jamais filtré, sinon orphelin)
 * - Filtre les null/undefined qui peuvent apparaître via .map(...) dans runAgent
 */
function sanitizeMessages(messages: MessageParam[]): MessageParam[] {
  // Étape 1 — corriger chaque message individuellement
  const fixed = messages
    .filter((m): m is MessageParam => m != null)
    .map(m => {
      if (m.role !== "user") return m

      // content null/undefined → placeholder
      if (m.content == null) {
        return { ...m, content: "…" } as MessageParam
      }

      // content array (tool_results) — s'assurer que chaque item a un content valide
      if (Array.isArray(m.content)) {
        const arr = m.content as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
        // Tableau vide → placeholder
        if (arr.length === 0) {
          return { ...m, content: "…" } as MessageParam
        }
        const fixedArr = arr.map((block: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (block?.type === "tool_result") {
            const c = block.content
            const isEmpty = !c || (Array.isArray(c) && c.length === 0) || (typeof c === "string" && c.trim() === "")
            if (isEmpty) return { ...block, content: "{}" }
          }
          return block
        })
        return { ...m, content: fixedArr } as any as MessageParam // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // content string vide → placeholder
      if (typeof m.content === "string" && m.content.trim() === "") {
        return { ...m, content: "…" } as MessageParam
      }

      return m
    })

  // Étape 2 — garantir l'alternance user/assistant (Anthropic l'exige)
  // Si un assistant vide a été exclu côté client, deux user messages se retrouvent consécutifs.
  // On insère un placeholder assistant pour rétablir l'alternance.
  const alternating: MessageParam[] = []
  for (const msg of fixed) {
    const last = alternating[alternating.length - 1]
    if (last && last.role === msg.role) {
      if (msg.role === "user") {
        // Deux user consécutifs : insérer un assistant placeholder entre eux
        alternating.push({ role: "assistant", content: "…" })
      } else {
        // Deux assistant consécutifs : remplacer par le dernier (le plus récent)
        alternating[alternating.length - 1] = msg
        continue
      }
    }
    alternating.push(msg)
  }

  return alternating
}

// System prompt mis en cache côté Anthropic (économie ~90% des input tokens système)
function cachedSystem(text: string) {
  return [{ type: "text" as const, text, cache_control: { type: "ephemeral" as const } }]
}

// Contact synchronisé depuis le carnet d'adresses utilisateur (page /dashboard/contacts)
interface UserContact {
  name?: string
  email?: string
  phone?: string
  company?: string
  role?: string
  category?: string
  primaryAgent?: string | null
  notes?: string
}

/**
 * Charge les contacts depuis organizations.settings.contacts (DB).
 * Utilisé quand le client n'a pas pu fournir le carnet (ex: cron jobs serveur).
 */
async function loadContactsFromDb(orgId: string): Promise<UserContact[]> {
  try {
    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)
    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const raw = settings["contacts"]
    return Array.isArray(raw) ? raw as UserContact[] : []
  } catch {
    return []
  }
}

/**
 * Génère le bloc date/heure Paris en temps réel.
 * Injecté EN TÊTE de chaque system prompt pour que les agents connaissent
 * toujours la date exacte et ne devinent jamais une année ou un jour faux.
 */
function buildTemporalContext(): string {
  const now = new Date()
  const parisFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
  const dateStr = parisFormatter.format(now)
  const timeStr = timeFormatter.format(now)

  return `# CONTEXTE TEMPOREL — TEMPS RÉEL

**Date actuelle (Paris) :** ${dateStr}
**Heure actuelle (Paris) :** ${timeStr}

RÈGLES ABSOLUES :
- N'invente JAMAIS une date. Utilise exclusivement la date ci-dessus.
- Pour "mercredi prochain", "la semaine prochaine", "dans 3 jours" : calcule à partir de la date ci-dessus.
- Ne dis JAMAIS "je suppose que nous sommes en…" — la date réelle t'est fournie.

---

`
}

/**
 * Augmente le system prompt d'un agent avec la date/heure Paris + le carnet d'adresses.
 * Ces blocs sont mis EN TÊTE du prompt pour maximiser leur visibilité par le LLM.
 */
function augmentSystemPrompt(base: string, config: AgentConfig): string {
  const raw = config["contacts"]

  // Toujours injecter le contexte temporel, même sans contacts
  const temporalBlock = buildTemporalContext()

  if (!Array.isArray(raw) || raw.length === 0) return temporalBlock + base

  const contacts = raw as UserContact[]
  const list = contacts
    .filter(c => c.name)
    .map(c => {
      const parts: string[] = [`- **${c.name}**`]
      const meta: string[] = []
      if (c.role)     meta.push(c.role)
      if (c.company)  meta.push(c.company)
      if (meta.length) parts.push(`(${meta.join(" · ")})`)
      if (c.email)    parts.push(`email: ${c.email}`)
      if (c.phone)    parts.push(`tél: ${c.phone}`)
      if (c.category) parts.push(`type: ${c.category}`)
      if (c.notes)    parts.push(`notes: ${c.notes}`)
      return parts.join(" — ")
    })
    .join("\n")

  if (!list) return base

  // Bloc EN TÊTE — temporel + contacts
  return temporalBlock + `# CARNET D'ADRESSES — DONNÉES TEMPS RÉEL DE L'UTILISATEUR

Tu disposes du carnet d'adresses complet de l'utilisateur, synchronisé en temps réel depuis sa page /dashboard/contacts. Voici la liste des ${contacts.length} contact(s) connu(s) :

${list}

## RÈGLES STRICTES SUR CES DONNÉES

1. **N'invente JAMAIS** que tu n'as pas accès aux contacts — tu les as ci-dessus.
2. **Ne demande JAMAIS** un email ou un téléphone si la personne figure ci-dessus — utilise directement la donnée.
3. **Ne dis JAMAIS** "je ne peux pas consulter de page" ou "donne-moi le numéro" pour quelqu'un qui est dans cette liste.
4. Si l'utilisateur écrit "envoie un SMS à Yoann" et que Yoann est dans la liste avec un numéro, **passe directement à l'action** : confirme le numéro trouvé, demande seulement le contenu du message si manquant, puis exécute send_sms.
5. Si la personne n'est PAS dans la liste, alors seulement demande ses coordonnées.

---

${base}`
}

export interface RunOptions {
  agentSlug: string
  messages: MessageParam[]
  config?: AgentConfig
  orgId: string
  conversationId?: string
  maxIterations?: number
  // Style visuel à appliquer aux emails envoyés par les tools (send_email, send_email_draft).
  // Récupéré du scheduled_job courant lors d'une exécution planifiée. null/undefined = preset Lynaris par défaut.
  emailStyle?: EmailStyleConfig | null
}

export interface RunResult {
  content: string
  toolCallsCount: number
  inputTokens: number
  outputTokens: number
  model: string
}

/**
 * Non-streaming run — executes agent with full tool use loop.
 * Returns final text response.
 */
export async function runAgent(options: RunOptions): Promise<RunResult> {
  const {
    agentSlug,
    messages,
    config = {},
    orgId,
    conversationId,
    maxIterations = 10,
    emailStyle,
  } = options

  const agentDef = getAgent(agentSlug)
  if (!agentDef) throw new Error(`Unknown agent: ${agentSlug}`)

  // Si pas de contacts fournis par le client (cas cron / tests serveur), charge depuis DB
  const effectiveConfig: AgentConfig = { ...config }
  if (!Array.isArray(effectiveConfig["contacts"])) {
    effectiveConfig["contacts"] = await loadContactsFromDb(orgId)
  }

  const systemPrompt = augmentSystemPrompt(agentDef.systemPromptFn(effectiveConfig), effectiveConfig)

  // Plan résolu une fois par appel (cache mémoire pendant la durée du run)
  const planId = await getOrgPlanId(orgId)

  let currentMessages: MessageParam[] = [...messages]
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let toolCallsCount = 0
  let iteration = 0

  const DEPRECATED_MODELS: Record<string, string> = { "claude-opus-4-6": "claude-opus-4-7" }
  const resolvedModel = DEPRECATED_MODELS[agentDef.model] ?? agentDef.model

  while (iteration < maxIterations) {
    iteration++

    const response = await anthropic.messages.create({
      model: resolvedModel,
      max_tokens: agentDef.maxTokens,
      system: cachedSystem(systemPrompt),
      messages: sanitizeMessages(trimHistory(currentMessages)),
      tools: agentDef.tools.length > 0 ? agentDef.tools : undefined,
    })

    totalInputTokens += response.usage.input_tokens
    totalOutputTokens += response.usage.output_tokens

    // Instrumentation : tracking coût réel + compteur client (fire-and-forget)
    void instrumentTurnComplete({
      orgId,
      agentSlug,
      planId,
      model: agentDef.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      providerRef: response.id,
    })

    // Extract text content
    const textBlocks = response.content.filter((b) => b.type === "text")
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use")

    // If no tool calls, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      const finalText = textBlocks
        .map((b) => ("text" in b ? b.text : ""))
        .join("")
      return {
        content: finalText,
        toolCallsCount,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        model: agentDef.model,
      }
    }

    // Process tool calls
    toolCallsCount += toolUseBlocks.length

    // Add assistant message with tool use blocks
    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
    ]

    // Execute each tool and collect results
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        if (toolUse.type !== "tool_use") return null

        const toolResult = await executeTool({
          toolName: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          orgId,
          agentSlug,
          conversationId,
          emailStyle,
        })

        const rc = toolResult.error
          ? JSON.stringify({ error: toolResult.error })
          : (JSON.stringify(toolResult.result ?? { status: "ok" }) ?? "{}")
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: rc || "{}",
        }
      })
    )

    const validResults = toolResults.filter(
      (r): r is NonNullable<typeof r> => r !== null
    )

    // Add tool results as user message
    currentMessages = [
      ...currentMessages,
      { role: "user", content: validResults },
    ]
  }

  return {
    content: "Maximum iterations reached without a final response.",
    toolCallsCount,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    model: agentDef.model,
  }
}

/**
 * Streaming run — yields text chunks as the agent responds.
 * Tool calls are executed transparently; only final text is streamed.
 */
export async function* streamAgent(
  options: RunOptions
): AsyncGenerator<string> {
  const {
    agentSlug,
    messages,
    config = {},
    orgId,
    conversationId,
    maxIterations = 10,
    emailStyle,
  } = options

  const agentDef = getAgent(agentSlug)
  if (!agentDef) throw new Error(`Unknown agent: ${agentSlug}`)

  // Si pas de contacts fournis par le client (cas cron / tests serveur), charge depuis DB
  const effectiveConfig: AgentConfig = { ...config }
  if (!Array.isArray(effectiveConfig["contacts"])) {
    effectiveConfig["contacts"] = await loadContactsFromDb(orgId)
  }

  const systemPrompt = augmentSystemPrompt(agentDef.systemPromptFn(effectiveConfig), effectiveConfig)

  // Modèle : utilise directement agentDef.model (Anthropic uniquement, tool use complet).
  // Le LLM router dynamique est désactivé — il ajoutait un appel Haiku supplémentaire
  // avant chaque turn et pouvait router vers GPT-4O / Mistral non configurés sur Vercel.
  const DEPRECATED_MODEL_MAP: Record<string, string> = {
    "claude-opus-4-6": "claude-opus-4-7",
  }
  const effectiveModel = DEPRECATED_MODEL_MAP[agentDef.model] ?? agentDef.model

  // ── Anthropic : flow complet avec tool use ────────────────────────────────────
  // Plan résolu une fois pour le run (utilisé par instrumentTurnComplete)
  const turnPlanId = await getOrgPlanId(orgId)

  let currentMessages: MessageParam[] = [...messages]
  let iteration = 0

  // Deadline 48s : évite le hard kill Vercel à 60s (Hobby plan)
  const streamDeadline = Date.now() + 48_000

  while (iteration < maxIterations) {
    iteration++

    if (Date.now() > streamDeadline) {
      yield "\n\n*(Délai dépassé. Réessaie ou simplifie ta demande.)*"
      return
    }

    let hasToolUse = false
    const toolUseInputs: Array<{
      id: string
      name: string
      inputStr: string
    }> = []
    const allContent: Anthropic.Messages.ContentBlockParam[] = []
    let stopReason: string | null = null

    // Stream the response
    const stream = anthropic.messages.stream({
      model: effectiveModel,
      max_tokens: agentDef.maxTokens,
      system: cachedSystem(systemPrompt),
      messages: sanitizeMessages(trimHistory(currentMessages)),
      tools: agentDef.tools.length > 0 ? agentDef.tools : undefined,
    })

    let currentToolId = ""
    let currentToolName = ""
    let currentToolInput = ""
    let currentText = ""

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          hasToolUse = true
          currentToolId = event.content_block.id
          currentToolName = event.content_block.name
          currentToolInput = ""
        } else if (event.content_block.type === "text") {
          currentText = ""
        }
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          const chunk = event.delta.text
          currentText += chunk
          yield chunk
        } else if (event.delta.type === "input_json_delta") {
          currentToolInput += event.delta.partial_json
        }
      } else if (event.type === "content_block_stop") {
        if (hasToolUse && currentToolId && currentToolName) {
          toolUseInputs.push({
            id: currentToolId,
            name: currentToolName,
            inputStr: currentToolInput,
          })
          currentToolId = ""
          currentToolName = ""
          currentToolInput = ""
        }
        if (currentText) {
          allContent.push({ type: "text", text: currentText })
          currentText = ""
        }
      } else if (event.type === "message_delta") {
        stopReason = event.delta.stop_reason ?? null
      }
    }

    // Instrumentation : tracking coût + compteur après fin du stream
    // (fire-and-forget, ne bloque pas le yield des chunks suivants)
    void (async () => {
      try {
        const finalMsg = await stream.finalMessage()
        await instrumentTurnComplete({
          orgId,
          agentSlug,
          planId: turnPlanId,
          model: effectiveModel,
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
          providerRef: finalMsg.id,
        })
      } catch (err) {
        logger.error("[executor] streamAgent instrumentation failed", { err: String(err) })
      }
    })()

    // Finalize tool use blocks into allContent
    for (const tu of toolUseInputs) {
      let parsedInput: Record<string, unknown> = {}
      try {
        parsedInput = JSON.parse(tu.inputStr) as Record<string, unknown>
      } catch (err) {
        logger.error("[executor] tool input parse error (allContent)", {
          tool: tu.name,
          toolId: tu.id,
          rawInput: tu.inputStr,
          err: err instanceof Error ? err.message : String(err),
        })
      }
      allContent.push({
        type: "tool_use",
        id: tu.id,
        name: tu.name,
        input: parsedInput,
      })
    }

    if (!hasToolUse || stopReason === "end_turn") {
      return
    }

    // Execute tool calls
    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: allContent },
    ]

    // Signal special events before executing tools
    for (const tu of toolUseInputs) {
      if (tu.name === "delegate_to_agent") {
        let parsedInput: Record<string, unknown> = {}
        try { parsedInput = JSON.parse(tu.inputStr) as Record<string, unknown> } catch {}
        const delegatedSlug = String(parsedInput["agent_slug"] ?? "")
        if (delegatedSlug) {
          yield `\x01{"type":"agent_join","agentSlug":"${delegatedSlug}"}\x01`
        }
      }
      if (tu.name === "show_email_format_picker") {
        // Mae rejoint visuellement dès qu'un email est demandé
        yield `\x01{"type":"agent_join","agentSlug":"mae"}\x01`
        yield `\x01{"type":"email_format_picker"}\x01`
      }
    }

    // Exécuter les outils et conserver les résultats bruts pour émettre les SSE
    const rawResults = await Promise.all(
      toolUseInputs.map(async (tu) => {
        let parsedInput: Record<string, unknown> = {}
        try {
          parsedInput = JSON.parse(tu.inputStr) as Record<string, unknown>
        } catch (err) {
          logger.error("[executor] tool input parse error (toolResults)", {
            tool: tu.name,
            toolId: tu.id,
            rawInput: tu.inputStr,
            err: err instanceof Error ? err.message : String(err),
          })
        }

        const result = await executeTool({
          toolName: tu.name,
          input: parsedInput,
          orgId,
          agentSlug,
          conversationId,
          emailStyle,
        })

        return { tu, parsedInput, result }
      })
    )

    // Émettre des cartes de contenu pour les outils qui créent des fichiers/images
    for (const { tu, parsedInput, result } of rawResults) {
      if (!result.error && result.result) {
        const r = result.result as Record<string, unknown>
        const url = r["url"] ? String(r["url"]) : null
        if (url && (tu.name === "create_document" || tu.name === "generate_image")) {
          const ev = {
            type: "content_created",
            contentType: tu.name === "create_document" ? "document" : "image",
            url,
            title: tu.name === "create_document"
              ? String(parsedInput["title"] ?? r["title"] ?? "Document")
              : String(parsedInput["prompt"] ?? "Image IA").slice(0, 80),
          }
          yield `\x01${JSON.stringify(ev)}\x01`
        }
      }
    }

    // Convertir en tool_results pour Anthropic
    const toolResults = rawResults.map(({ tu, result }) => {
      // JSON.stringify(undefined) === undefined (pas une string).
      // Anthropic rejette content null/vide → fallback sur "{}" si le résultat est indéfini.
      const toolContent =
        result.error
          ? JSON.stringify({ error: result.error })
          : (JSON.stringify(result.result ?? { status: "ok" }) ?? "{}")

      return {
        type: "tool_result" as const,
        tool_use_id: tu.id,
        content: toolContent || "{}",
      }
    })

    currentMessages = [
      ...currentMessages,
      { role: "user", content: toolResults },
    ]
  }
}
