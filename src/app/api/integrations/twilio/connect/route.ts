export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import { z } from "zod"

const schema = z.object({
  account_sid: z.string().min(34).startsWith("AC"),
  auth_token: z.string().min(32),
  phone_number: z.string().min(10), // E.164 format e.g. +33612345678
  twiml_app_sid: z.string().optional(),
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
  // Test the credentials by calling Twilio API
  try {
    const testRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${parsed.data.account_sid}.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${parsed.data.account_sid}:${parsed.data.auth_token}`).toString("base64")}`,
        },
      }
    )
    if (!testRes.ok) {
      return NextResponse.json({ error: "Identifiants Twilio invalides. VÃ©rifiez votre Account SID et Auth Token." }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Twilio. VÃ©rifiez vos identifiants." }, { status: 422 })
  }

  await upsertIntegration(orgId, "twilio", {
    account_sid: parsed.data.account_sid,
    auth_token: parsed.data.auth_token,
    phone_number: parsed.data.phone_number,
    twiml_app_sid: parsed.data.twiml_app_sid ?? null,
  })
  return NextResponse.json({ success: true, provider: "twilio", message: "Twilio connectÃ© avec succÃ¨s." })
}
