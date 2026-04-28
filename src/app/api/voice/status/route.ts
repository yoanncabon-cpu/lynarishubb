import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = await request.formData()

  const callSid = body.get("CallSid") as string | null
  const callStatus = body.get("CallStatus") as string | null
  const callDuration = body.get("CallDuration") as string | null
  const orgId = request.nextUrl.searchParams.get("org") ?? "00000000-0000-0000-0000-000000000001"

  console.info("[Voice] Call status update", {
    callSid: callSid?.slice(-6) ?? "unknown",
    status: callStatus ?? "unknown",
    duration: callDuration ?? "0",
    orgId,
  })

  // TODO: Phase 9 â€” persist call record to DB, generate summary via Claude Haiku
  // await db.update(conversations).set({
  //   endedAt: new Date(),
  //   metadata: { callSid, callStatus, callDuration },
  // }).where(eq(conversations.externalId, callSid))

  return NextResponse.json({ received: true })
}
