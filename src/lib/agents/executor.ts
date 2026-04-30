import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { getAgent, type AgentConfig } from "./registry"
import { executeTool } from "./tools/index"
import type { EmailStyleConfig } from "@/lib/db/schema"
import { detectProvider, streamOpenAI, streamGemini, type ProviderMessage } from "./providers"
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
 * Augmente le system prompt d'un agent avec le carnet d'adresses utilisateur.
 * Le bloc est mis EN TÊTE du prompt pour maximiser sa visibilité par le LLM.
 */
function augmentSystemPrompt(base: string, config: AgentConfig): string {
  const raw = config["contacts"]
  // Log debug temporaire pour vérifier que les contacts arrivent bien côté serveur
  console.log("[augmentSystemPrompt] contacts reçus :", Array.isArray(raw) ? `${raw.length} contact(s)` : `type=${typeof raw}`)

  if (!Array.isArray(raw) || raw.length === 0) return base

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

  // Bloc EN TÊTE — premier paragraphe lu par le modèle, donc priorité absolue
  return `# CARNET D'ADRESSES — DONNÉES TEMPS RÉEL DE L'UTILISATEUR

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

  while (iteration < maxIterations) {
    iteration++

    const response = await anthropic.messages.create({
      model: agentDef.model,
      max_tokens: agentDef.maxTokens,
      system: cachedSystem(systemPrompt),
      messages: trimHistory(currentMessages),
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

        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(
            toolResult.error ? { error: toolResult.error } : toolResult.result
          ),
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

  // Modèle effectif : priorité au choix de l'utilisateur dans les settings
  const effectiveModel =
    (effectiveConfig.modelId as string | undefined) ??
    (effectiveConfig.model as string | undefined) ??
    agentDef.model
  const provider = detectProvider(effectiveModel)

  // ── Providers non-Anthropic : pas de tool use, yield texte uniquement ────────
  if (provider === "openai" || provider === "gemini") {
    const providerMessages: ProviderMessage[] = messages
      .filter(m => typeof m.content === "string")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content as string }))

    const stream = provider === "openai"
      ? streamOpenAI(effectiveModel, systemPrompt, providerMessages)
      : streamGemini(effectiveModel, systemPrompt, providerMessages)

    for await (const chunk of stream) {
      yield chunk
    }
    return
  }

  // ── Anthropic : flow complet avec tool use ────────────────────────────────────
  // Plan résolu une fois pour le run (utilisé par instrumentTurnComplete)
  const turnPlanId = await getOrgPlanId(orgId)

  let currentMessages: MessageParam[] = [...messages]
  let iteration = 0

  while (iteration < maxIterations) {
    iteration++

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
      messages: trimHistory(currentMessages),
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
        console.error("[executor] streamAgent instrumentation failed", err)
      }
    })()

    // Finalize tool use blocks into allContent
    for (const tu of toolUseInputs) {
      let parsedInput: Record<string, unknown> = {}
      try {
        parsedInput = JSON.parse(tu.inputStr) as Record<string, unknown>
      } catch (err) {
        console.error('[executor] tool input parse error (allContent)', {
          tool: tu.name,
          toolId: tu.id,
          rawInput: tu.inputStr,
          error: err instanceof Error ? err.message : String(err),
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

    const toolResults = await Promise.all(
      toolUseInputs.map(async (tu) => {
        let parsedInput: Record<string, unknown> = {}
        try {
          parsedInput = JSON.parse(tu.inputStr) as Record<string, unknown>
        } catch (err) {
          console.error('[executor] tool input parse error (toolResults)', {
            tool: tu.name,
            toolId: tu.id,
            rawInput: tu.inputStr,
            error: err instanceof Error ? err.message : String(err),
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

        return {
          type: "tool_result" as const,
          tool_use_id: tu.id,
          content: JSON.stringify(
            result.error ? { error: result.error } : result.result
          ),
        }
      })
    )

    currentMessages = [
      ...currentMessages,
      { role: "user", content: toolResults },
    ]
  }
}
