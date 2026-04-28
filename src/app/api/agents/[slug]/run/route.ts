import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { runAgent } from "@/lib/agents/executor"
import { getAgent } from "@/lib/agents/registry"

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
  const messages: MessageParam[] = [{ role: "user", content: body.message }]

  try {
    const result = await runAgent({
      agentSlug: slug,
      messages,
      config: body.config ?? {},
      orgId,
      conversationId: body.conversationId,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent run failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
