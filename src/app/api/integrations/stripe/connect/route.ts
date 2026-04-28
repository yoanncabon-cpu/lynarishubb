export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import { z } from "zod"

const schema = z.object({
  secret_key: z.string().startsWith("sk_"),
  publishable_key: z.string().startsWith("pk_"),
  webhook_secret: z.string().startsWith("whsec_").optional(),
})

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Validate the key by calling Stripe balance API
  try {
    const testRes = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${parsed.data.secret_key}`,
      },
    })
    if (!testRes.ok) {
      return NextResponse.json({ error: "ClÃ© Stripe invalide. VÃ©rifiez votre Secret Key." }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Stripe." }, { status: 422 })
  }

  await upsertIntegration(orgId, "stripe", {
    secret_key: parsed.data.secret_key,
    publishable_key: parsed.data.publishable_key,
    webhook_secret: parsed.data.webhook_secret ?? null,
  })
  return NextResponse.json({ success: true, provider: "stripe", message: "Stripe connectÃ© avec succÃ¨s." })
}
