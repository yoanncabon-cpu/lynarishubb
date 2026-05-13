import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { logger } from "@/lib/logger"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { streamAgent } from "@/lib/agents/executor"
import { getAgent } from "@/lib/agents/registry"
import { db } from "@/lib/db"
import { agentInstances, actionLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  buildAccessDeniedPayload,
  checkPreTurnAccess,
} from "@/lib/agents/instrumentation"

export const runtime = "nodejs"
export const maxDuration = 60

interface ChatRequestBody {
  messages: MessageParam[]
  config?: Record<string, unknown>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limiting via Upstash Redis (type "ai" = 10 req/1min)
  // Si Redis non configuré (dev local sans .env), checkRateLimit retourne null → fallback permissif
  const rl = await checkRateLimit(request, "ai")
  if (rl !== null && !rl.success) {
    return rateLimitResponse(rl.reset)
  }

  const agent = getAgent(slug)
  if (!agent) {
    return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })
  }

  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 })
  }

  const orgId = await getOrProvisionOrgId()

  // Gating plan : vérifie que l'agent est accessible sur le plan courant
  // (ex: Marine refusée sur Starter, 4e agent refusé sur Starter, etc.)
  const access = await checkPreTurnAccess(orgId, slug, [])
  if (!access.allowed) {
    return NextResponse.json(buildAccessDeniedPayload(access.access), {
      status: 403,
    })
  }

  // Load saved agent config from DB
  let dbConfig: Record<string, unknown> = {}
  try {
    const row = await db.query.agentInstances.findFirst({
      where: and(
        eq(agentInstances.orgId, orgId),
        eq(agentInstances.agentSlug, slug)
      ),
      columns: { config: true },
    })
    if (row?.config) {
      dbConfig = row.config as Record<string, unknown>
    }
  } catch (dbErr) {
    logger.warn("[chat] DB config unavailable — proceeding with empty config", { slug, err: String(dbErr) })
  }

  // Merge: DB config + request body config (body overrides DB)
  const mergedConfig: Record<string, unknown> = {
    ...dbConfig,
    ...(body.config ?? {}),
  }

  const encoder = new TextEncoder()

  // Upsert agent instance — needed for action_log FK
  let instanceId: string | null = null
  try {
    const rows = await db
      .insert(agentInstances)
      .values({ orgId, agentSlug: slug, isActive: true })
      .onConflictDoUpdate({
        target: [agentInstances.orgId, agentInstances.agentSlug],
        set: { isActive: true },
      })
      .returning({ id: agentInstances.id })
    instanceId = rows[0]?.id ?? null
  } catch (upsertErr) {
    logger.warn("[chat] agentInstance upsert failed — log FK will be null", { slug, err: String(upsertErr) })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let streamError = false
      try {
        const agentStream = streamAgent({
          agentSlug: slug,
          messages: body.messages,
          config: mergedConfig,
          orgId,
        })

        for await (const chunk of agentStream) {
          // Marker spécial émis par l'executor pour les délégations inter-agents
          if (chunk.startsWith("\x01") && chunk.endsWith("\x01")) {
            const data = `data: ${chunk.slice(1, -1)}\n\n`
            controller.enqueue(encoder.encode(data))
          } else {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (err) {
        streamError = true
        const errStr = String(err)
        logger.error("[chat] Stream error", { slug, err: errStr })
        // Classify error type for client-side friendlyError matching
        let clientError = "Erreur de traitement de la requête"
        if (/authentication_error|invalid.*api.?key|no api key|401/i.test(errStr)) {
          clientError = "authentication_error"
        } else if (/rate_limit|429|too many/i.test(errStr)) {
          clientError = "rate_limit_error"
        } else if (/overloaded|529|503/i.test(errStr)) {
          clientError = "overloaded_error"
        } else if (/not_found|model.*not.*found|404/i.test(errStr)) {
          clientError = "model_not_found_error"
        } else if (/timeout|timed out/i.test(errStr)) {
          clientError = "timeout_error"
        } else if (/context_length|too long|max_tokens/i.test(errStr)) {
          clientError = "context_length_error"
        }
        const errorData = `data: ${JSON.stringify({ error: clientError })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }

      // Écriture action_log après chaque conversation
      try {
        await db.insert(actionLogs).values({
          orgId,
          agentInstanceId: instanceId,
          type: "conversation",
          status: streamError ? "error" : "success",
          payload: { agentSlug: slug },
        })
      } catch (logErr) {
        logger.warn("[chat] action_log insert failed", { slug, err: String(logErr) })
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  })
}
