import { type NextRequest, NextResponse } from "next/server"
import { verifyMakeWebhook } from "@/lib/integrations/make"

export const runtime = "nodejs"

interface MakeCallbackPayload {
  run_id: string
  org_id: string
  workflow: string
  status: "success" | "error"
  output?: Record<string, unknown>
  error?: string
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("x-lynaris-signature") ?? ""
  const orgId = request.headers.get("x-lynaris-org") ?? ""

  if (!orgId) {
    return NextResponse.json({ error: "Missing X-Lynaris-Org header" }, { status: 400 })
  }

  // HMAC obligatoire — refuse si signature absente ou secret non configuré.
  // Avant : `if (signature && secret)` permettait un bypass total si l'attaquant
  // ne mettait simplement pas de header de signature. Trou de sécurité critique.
  const makeSecret = process.env["MAKE_WEBHOOK_SECRET"]
  if (!makeSecret) {
    return NextResponse.json(
      { error: "Webhook misconfigured" },
      { status: 500 }
    )
  }
  if (!signature) {
    return NextResponse.json(
      { error: "Missing X-Lynaris-Signature header" },
      { status: 401 }
    )
  }
  const valid = await verifyMakeWebhook(body, signature, makeSecret)
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: MakeCallbackPayload
  try {
    payload = JSON.parse(body) as MakeCallbackPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.info("[Make callback]", {
    run_id: payload.run_id,
    org_id: orgId,
    workflow: payload.workflow,
    status: payload.status,
  })

  return NextResponse.json({ received: true, run_id: payload.run_id })
}
