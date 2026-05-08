import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const authToken = process.env["TWILIO_AUTH_TOKEN"]

  // Parse formData avant validation (un seul .formData() autorisé)
  const body = await request.formData()
  const params: Record<string, string> = {}
  body.forEach((v, k) => { params[k] = v.toString() })

  if (authToken) {
    const sig = request.headers.get("x-twilio-signature") ?? ""
    const url = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/api/voice/status`
    if (!twilio.validateRequest(authToken, sig, url, params)) {
      return new Response("Forbidden", { status: 403 })
    }
  }

  const callSid    = params["CallSid"]    ?? null
  const callStatus = params["CallStatus"] ?? null
  const callDuration = params["CallDuration"] ?? null
  const orgId      = request.nextUrl.searchParams.get("org")

  logger.info("[Voice] Call status update", {
    callSid: callSid?.slice(-6) ?? "unknown",
    status:   callStatus ?? "unknown",
    duration: callDuration ?? "0",
    orgId:    orgId ?? "(no org param)",
  })

  if (!orgId) {
    // Twilio n'a pas fourni de org param — log et ignore sans erreur
    return NextResponse.json({ received: true, warning: "no org param" })
  }

  // TODO Phase 9 — persister le record d'appel en DB
  // await db.update(conversations).set({
  //   endedAt: new Date(),
  //   metadata: { callSid, callStatus, callDuration },
  // }).where(eq(conversations.externalId, callSid))

  return NextResponse.json({ received: true })
}
