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

  // Validations synchrones — doivent passer avant de démarrer le stream
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

  // Rate limiting via Redis (rapide — avant le stream)
  const rl = await checkRateLimit(request, "ai")
  if (rl !== null && !rl.success) {
    return rateLimitResponse(rl.reset)
  }

  // ─── Démarrer le stream IMMÉDIATEMENT ─────────────────────────────────────
  // Tout le travail DB (orgId, access, config, instance) se fait à l'intérieur
  // pour que les headers HTTP soient envoyés au client avant toute I/O lente.
  // Cela évite les timeouts 504 sur Vercel et Vercel CLI dev.
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let streamError = false
      let orgId: string | null = null
      let instanceId: string | null = null

      try {
        // Récupération orgId + vérification access en parallèle
        orgId = await getOrProvisionOrgId()

        const access = await checkPreTurnAccess(orgId, slug, [])
        if (!access.allowed) {
          const payload = buildAccessDeniedPayload(access.access)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: "access_denied", details: payload })}\n\n`
          ))
          controller.close()
          return
        }

        // Config DB + upsert agent instance en parallèle
        const [configRow, instanceRows] = await Promise.all([
          db.query.agentInstances.findFirst({
            where: and(
              eq(agentInstances.orgId, orgId),
              eq(agentInstances.agentSlug, slug)
            ),
            columns: { config: true },
          }).catch(() => null),
          db.insert(agentInstances)
            .values({ orgId, agentSlug: slug, isActive: true })
            .onConflictDoUpdate({
              target: [agentInstances.orgId, agentInstances.agentSlug],
              set: { isActive: true },
            })
            .returning({ id: agentInstances.id })
            .catch(() => null),
        ])

        instanceId = instanceRows?.[0]?.id ?? null

        const mergedConfig: Record<string, unknown> = {
          ...((configRow?.config ?? {}) as Record<string, unknown>),
          ...(body.config ?? {}),
        }

        // Démarrer le run agent
        const agentStream = streamAgent({
          agentSlug: slug,
          messages: body.messages,
          config: mergedConfig,
          orgId,
        })

        for await (const chunk of agentStream) {
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

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: clientError })}\n\n`))
          controller.close()
        } catch { /* stream already closed */ }
      }

      // Log action après fermeture du stream (fire-and-forget)
      if (orgId) {
        db.insert(actionLogs).values({
          orgId,
          agentInstanceId: instanceId,
          type: "conversation",
          status: streamError ? "error" : "success",
          payload: { agentSlug: slug },
        }).catch((logErr: unknown) => {
          logger.warn("[chat] action_log insert failed", { slug, err: String(logErr) })
        })
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
