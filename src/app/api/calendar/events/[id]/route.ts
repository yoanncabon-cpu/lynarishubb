export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { calendarEvents } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getGoogleCalendarCreds, updateGoogleEvent, deleteGoogleEvent } from "@/lib/calendar/google-calendar"
import { z } from "zod"

const updateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  startAt:     z.string().datetime().optional(),
  endAt:       z.string().datetime().optional(),
  allDay:      z.boolean().optional(),
  type:        z.enum(["rdv", "contenu", "automatisation", "tache", "autre"]).optional(),
  agentSlug:   z.string().nullish(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullish(),
  location:    z.string().max(500).nullish(),
  status:      z.enum(["confirmed", "tentative", "cancelled"]).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id }  = await params
  const orgId   = await getOrProvisionOrgId()
  const body    = await req.json().catch(() => null)
  const parsed  = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const d = parsed.data
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (d.title       !== undefined) set["title"]       = d.title
  if (d.description !== undefined) set["description"] = d.description
  if (d.startAt     !== undefined) set["startAt"]     = new Date(d.startAt)
  if (d.endAt       !== undefined) set["endAt"]       = new Date(d.endAt)
  if (d.allDay      !== undefined) set["allDay"]      = d.allDay
  if (d.type        !== undefined) set["type"]        = d.type
  if (d.agentSlug   !== undefined) set["agentSlug"]   = d.agentSlug
  if (d.color       !== undefined) set["color"]       = d.color
  if (d.location    !== undefined) set["location"]    = d.location
  if (d.status      !== undefined) set["status"]      = d.status

  const rows = await db.update(calendarEvents)
    .set(set)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.orgId, orgId)))
    .returning()

  if (!rows[0]) return NextResponse.json({ error: "Event introuvable" }, { status: 404 })

  const row = rows[0]

  if (row.googleEventId) {
    try {
      const creds = await getGoogleCalendarCreds(orgId)
      if (creds) {
        await updateGoogleEvent(creds.access_token, row.googleEventId, {
          summary:     d.title,
          description: d.description ?? undefined,
          location:    d.location ?? undefined,
          ...(d.startAt ? { start: d.allDay ? { date: d.startAt.slice(0, 10) } : { dateTime: d.startAt, timeZone: "Europe/Paris" } } : {}),
          ...(d.endAt   ? { end:   d.allDay ? { date: d.endAt.slice(0, 10)   } : { dateTime: d.endAt,   timeZone: "Europe/Paris" } } : {}),
        })
      }
    } catch { /* silencieux */ }
  }

  return NextResponse.json({ event: row })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const orgId  = await getOrProvisionOrgId()

  const existing = await db.query.calendarEvents.findFirst({
    where: and(eq(calendarEvents.id, id), eq(calendarEvents.orgId, orgId)),
    columns: { googleEventId: true, googleCalendarId: true },
  })

  if (!existing) return NextResponse.json({ error: "Event introuvable" }, { status: 404 })

  await db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.orgId, orgId)))

  if (existing.googleEventId) {
    try {
      const creds = await getGoogleCalendarCreds(orgId)
      if (creds) await deleteGoogleEvent(creds.access_token, existing.googleEventId)
    } catch { /* silencieux */ }
  }

  return NextResponse.json({ success: true })
}
