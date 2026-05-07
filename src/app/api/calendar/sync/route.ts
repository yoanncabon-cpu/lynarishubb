export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calendarEvents } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getGoogleCalendarCreds, fetchGoogleEvents } from "@/lib/calendar/google-calendar"

export async function POST(req: Request): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  const body  = await req.json().catch(() => ({}) as Record<string, string>)
  const from  = (body as { from?: string; to?: string }).from ?? new Date(Date.now() - 30 * 86400_000).toISOString()
  const to    = (body as { from?: string; to?: string }).to   ?? new Date(Date.now() + 60 * 86400_000).toISOString()

  const creds = await getGoogleCalendarCreds(orgId)
  if (!creds) return NextResponse.json({ error: "Google Calendar non connecté" }, { status: 400 })

  const gevents = await fetchGoogleEvents(creds.access_token, from, to)
  let synced = 0, errors = 0

  for (const g of gevents) {
    try {
      const startRaw = g.start.dateTime ?? g.start.date ?? ""
      const endRaw   = g.end.dateTime   ?? g.end.date   ?? ""
      if (!startRaw) continue
      const isAllDay = !g.start.dateTime
      await db.insert(calendarEvents).values({
        orgId,
        title:            g.summary ?? "(Sans titre)",
        description:      g.description ?? null,
        startAt:          new Date(startRaw),
        endAt:            new Date(endRaw || startRaw),
        allDay:           isAllDay,
        type:             "rdv",
        location:         g.location ?? null,
        googleEventId:    g.id,
        googleCalendarId: "primary",
        status:           (g.status as "confirmed" | "tentative" | "cancelled") ?? "confirmed",
      }).onConflictDoNothing()
      synced++
    } catch { errors++ }
  }

  return NextResponse.json({ synced, errors, total: gevents.length })
}
