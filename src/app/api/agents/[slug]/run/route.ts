import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { runAgent } from "@/lib/agents/executor"
import { getAgent } from "@/lib/agents/registry"
import type { EmailStyleConfig } from "@/lib/db/schema"
import { agentInstances } from "@/lib/db/schema"
import { db } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  buildAccessDeniedPayload,
  checkPreTurnAccess,
} from "@/lib/agents/instrumentation"

export const runtime = "nodejs"
export const maxDuration = 60

interface RunRequestBody {
  message: string
  config?: Record<string, unknown>
  conversationId?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rl = await checkRateLimit(request as never, "api")
  if (rl !== null && !rl.success) return rateLimitResponse(rl.reset)

  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) {
    return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })
  }

  let body: RunRequestBody
  try {
    body = await request.json() as RunRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 })
  }

  // En délégation interne (Charles → Mae etc.), l'orgId est passé en header pour bypasser l'auth cookie
  const delegationOrgId = request.headers.get("x-internal-org-id")
  const orgId = delegationOrgId ?? await getOrProvisionOrgId()

  // Gating plan : vérifie que l'agent est accessible. Skip pour la délégation
  // interne (Charles peut déléguer à n'importe quel agent même sur Starter).
  if (delegationOrgId === null) {
    const access = await checkPreTurnAccess(orgId, slug, [])
    if (!access.allowed) {
      return NextResponse.json(buildAccessDeniedPayload(access.access), {
        status: 403,
      })
    }
  }

  const messages: MessageParam[] = [{ role: "user", content: body.message }]

  // Extraire email_style du config de délégation (passé par Charles)
  const rawConfig = body.config ?? {}
  const emailStyle = (rawConfig["email_style"] as EmailStyleConfig | undefined) ?? null
  const cleanConfig = { ...rawConfig }
  delete cleanConfig["email_style"]

  // Charge la config DB de l'instance agent (même logique que le chat route)
  // afin que les agents délégués aient accès à orgName, practitionerName, etc.
  const dbConfig = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, slug)),
    columns: { config: true },
  }).catch(() => null)
  const mergedConfig = { ...((dbConfig?.config ?? {}) as Record<string, unknown>), ...cleanConfig }

  try {
    const result = await runAgent({
      agentSlug: slug,
      messages,
      config: mergedConfig,
      orgId,
      conversationId: body.conversationId,
      emailStyle,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent run failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
