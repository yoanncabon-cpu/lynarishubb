import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  // Validation signature Twilio — protège l'endpoint contre les appels non autorisés
  const authToken = process.env["TWILIO_AUTH_TOKEN"]
  if (authToken) {
    const twilioSignature = request.headers.get("x-twilio-signature") ?? ""
    const url = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/api/voice/incoming`
    // Lire formData avant de le consommer pour la validation
    const formDataForValidation = await request.formData()
    const params: Record<string, string> = {}
    formDataForValidation.forEach((value, key) => { params[key] = value.toString() })

    const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
    if (!isValid) {
      return new Response("Forbidden", { status: 403 })
    }

    // Reconstruire le body depuis les params déjà parsés
    const body = formDataForValidation
    return handleIncoming(request, body)
  }

  // Dev mode : TWILIO_AUTH_TOKEN absent → pas de validation
  const body = await request.formData()
  return handleIncoming(request, body)
}

async function handleIncoming(request: NextRequest, body: FormData): Promise<NextResponse> {
  const callSid = body.get("CallSid") as string ?? ""
  const from = body.get("From") as string ?? ""
  const to = body.get("To") as string ?? ""

  const orgId = request.nextUrl.searchParams.get("org") ?? "00000000-0000-0000-0000-000000000001"
  const agentSlug = request.nextUrl.searchParams.get("agent") ?? "marine"

  const host = request.headers.get("host") ?? "localhost:3001"
  const wsProtocol = host.startsWith("localhost") ? "ws" : "wss"
  const wsUrl = `${wsProtocol}://${host}/api/voice/stream?org=${encodeURIComponent(orgId)}&agent=${encodeURIComponent(agentSlug)}`

  console.info("[Voice] Incoming call", {
    callSid: callSid.slice(-6) || "unknown",
    from: from || "hidden",
    to: to || "unknown",
    orgId,
    agentSlug,
  })

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="org_id" value="${orgId}" />
      <Parameter name="agent_slug" value="${agentSlug}" />
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="from" value="${from}" />
      <Parameter name="to" value="${to}" />
    </Stream>
  </Connect>
</Response>`

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

// Status callback â€” called by Twilio at end of call (configure as statusCallback URL)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callSid = searchParams.get("CallSid") ?? "unknown"
  const callStatus = searchParams.get("CallStatus") ?? "unknown"
  console.info(`[Voice] Call ended (GET): ${callSid} â†’ ${callStatus}`)
  return new NextResponse("OK")
}
