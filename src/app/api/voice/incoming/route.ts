import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function POST(request: NextRequest) {
  // Validation signature Twilio — protege l'endpoint contre les appels non autorises
  const authToken = process.env["TWILIO_AUTH_TOKEN"]
  if (authToken) {
    const twilioSignature = request.headers.get("x-twilio-signature") ?? ""
    const url = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/api/voice/incoming`
    const formDataForValidation = await request.formData()
    const params: Record<string, string> = {}
    formDataForValidation.forEach((value, key) => { params[key] = value.toString() })

    const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
    if (!isValid) {
      return new Response("Forbidden", { status: 403 })
    }

    return handleIncoming(request, formDataForValidation)
  }

  // Dev mode : TWILIO_AUTH_TOKEN absent -> pas de validation
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

  logger.info("[Voice] Incoming call", {
    callSid: callSid.slice(-6) || "unknown",
    from: from || "hidden",
    to: to || "unknown",
    orgId,
    agentSlug,
  })

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(wsUrl)}">
      <Parameter name="org_id" value="${escapeXml(orgId)}" />
      <Parameter name="agent_slug" value="${escapeXml(agentSlug)}" />
      <Parameter name="callSid" value="${escapeXml(callSid)}" />
      <Parameter name="from" value="${escapeXml(from)}" />
      <Parameter name="to" value="${escapeXml(to)}" />
    </Stream>
  </Connect>
</Response>`

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

// Status callback — appele par Twilio en fin d'appel (configurer comme statusCallback URL)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callSid = searchParams.get("CallSid") ?? "unknown"
  const callStatus = searchParams.get("CallStatus") ?? "unknown"
  logger.info("[Voice] Call ended (GET)", { callSid, callStatus })
  return new NextResponse("OK")
}
