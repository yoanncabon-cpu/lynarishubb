import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { n8nRuns } from "@/lib/db/schema"
import { getIntegration } from "@/lib/integrations/manager"
import { verifyN8nWebhook } from "@/lib/integrations/n8n"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

interface N8nCallbackPayload {
  run_id: string
  org_id: string
  workflow: string
  status: "success" | "error"
  output?: Record<string, unknown>
  error?: string
  execution_id?: string
  duration_ms?: number
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("x-lynaris-signature") ?? ""
  const orgId = request.headers.get("x-lynaris-org") ?? ""

  if (!orgId) {
    return NextResponse.json({ error: "Missing X-Lynaris-Org header" }, { status: 400 })
  }

  // Récupère le secret n8n depuis les credentials de l'org en DB
  const integration = await getIntegration(orgId, "n8n")
  const n8nSecret =
    (integration?.credentials["secret"] as string | undefined) ??
    process.env["N8N_WEBHOOK_SECRET"]

  if (!n8nSecret) {
    return NextResponse.json({ error: "n8n integration not configured" }, { status: 401 })
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing X-Lynaris-Signature header" }, { status: 401 })
  }

  const valid = await verifyN8nWebhook(body, signature, n8nSecret)
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: N8nCallbackPayload
  try {
    payload = JSON.parse(body) as N8nCallbackPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Met à jour le run dans la DB
  await db
    .update(n8nRuns)
    .set({
      status: payload.status,
      output: payload.output ?? null,
      completedAt: new Date(),
      n8nExecutionId: payload.execution_id ?? null,
    })
    .where(eq(n8nRuns.id, payload.run_id))

  logger.info("n8n webhook reçu", {
    run_id: payload.run_id,
    org_id: orgId,
    workflow: payload.workflow,
    status: payload.status,
    duration_ms: payload.duration_ms,
  })

  return NextResponse.json({ received: true, run_id: payload.run_id })
}
