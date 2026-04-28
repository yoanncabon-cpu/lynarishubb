export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import { generateHmacSecret } from "@/lib/crypto"
import { z } from "zod"

const schema = z.object({
  webhook_url: z.string().min(8, "L'URL du webhook est requise"),
  secret: z.string().optional(),
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

  const secret = parsed.data.secret ?? generateHmacSecret()

  await upsertIntegration(orgId, "make", {
    webhook_url: parsed.data.webhook_url,
    secret,
  })

  return NextResponse.json({
    success: true,
    provider: "make",
    secret,
    message: "Make connected. Save the secret â€” it won't be shown again.",
  })
}
