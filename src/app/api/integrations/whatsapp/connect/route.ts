export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"

const schema = z.object({
  phone_number_id: z.string().min(5),
  access_token: z.string().min(20),
  waba_id: z.string().optional(),
  webhook_verify_token: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Validation légère du token via /me (sans bloquer si timeout)
  let tokenValid: boolean | null = null
  try {
    const testRes = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${parsed.data.access_token}`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (testRes.status === 401 || testRes.status === 400) {
      const errBody = await testRes.json().catch(() => ({})) as { error?: { message?: string } }
      return NextResponse.json(
        { error: `Token Meta invalide : ${errBody.error?.message ?? "accès refusé"}` },
        { status: 422 }
      )
    }
    tokenValid = testRes.ok
  } catch {
    // Timeout ou réseau → on laisse passer, l'utilisateur verra à l'usage
    tokenValid = null
  }

  const verifyToken =
    parsed.data.webhook_verify_token ??
    crypto.randomBytes(16).toString("hex")

  await upsertIntegration(orgId, "whatsapp", {
    phone_number_id: parsed.data.phone_number_id,
    access_token: parsed.data.access_token,
    waba_id: parsed.data.waba_id ?? null,
    webhook_verify_token: verifyToken,
  })

  return NextResponse.json({
    success: true,
    webhook_verify_token: verifyToken,
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lynarisai.com"}/api/webhooks/whatsapp`,
    token_validated: tokenValid,
  })
}
