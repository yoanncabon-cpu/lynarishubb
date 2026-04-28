import { NextResponse } from "next/server"

export const runtime = "nodejs"

export interface MarineStatus {
  active_calls: number
  calls_today: number
  avg_duration_seconds: number
  last_call_at: string | null
  twilio_configured: boolean
  appointments_booked_today: number
}

export async function GET() {
  const twilioConfigured = !!(
    process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"]
  )

  const status: MarineStatus = {
    active_calls: 0,
    calls_today: 3,
    avg_duration_seconds: 127,
    last_call_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    twilio_configured: twilioConfigured,
    appointments_booked_today: 2,
  }

  return NextResponse.json(status)
}
