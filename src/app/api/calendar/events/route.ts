export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { and, gte, lte, eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { calendarEvents, scheduledJobs, contents, actionLogs, agentInstances, tasks } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getGoogleCalendarCreds, fetchGoogleEvents, createGoogleEvent } from "@/lib/calendar/google-calendar"
import type { CalendarEventDisplay } from "@/lib/calendar/types"
import { cached } from "@/lib/cache/redis"
import { z } from "zod"

// ─── Type export (rétrocompat) ───────────────────────────────────────────────
export type { CalendarEventDisplay as CalendarEvent }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  rdv:            "#22D3EE",
  contenu:        "#F472B6",
  automatisation: "#7C3AED",
  tache:          "#FBBF24",
  autre:          "#94A3B8",
  action:         "#34D399",
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function toTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Helpers récurrence jobs ──────────────────────────────────────────────────

function jobOccurrences(anchor: Date, frequency: string, fromDate: Date, toDate: Date): Date[] {
  const MS_DAY  = 86_400_000
  const MS_WEEK = 7 * MS_DAY
  const results: Date[] = []
  let step: number | null = null
  if (frequency === "daily")  step = MS_DAY
  if (frequency === "weekly") step = MS_WEEK
  if (step !== null) {
    let t = anchor.getTime()
    while (t > fromDate.getTime()) t -= step
    while (t <= toDate.getTime()) {
      if (t >= fromDate.getTime()) results.push(new Date(t))
      t += step
    }
  } else if (frequency === "monthly") {
    let t = new Date(anchor)
    while (t > fromDate) t = new Date(t.getFullYear(), t.getMonth() - 1, t.getDate(), t.getHours(), t.getMinutes())
    while (t <= toDate) {
      if (t >= fromDate) results.push(new Date(t))
      t = new Date(t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes())
    }
  } else {
    if (anchor >= fromDate && anchor <= toDate) results.push(anchor)
  }
  return results
}

// ─── GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD ─────────────────

export async function GET(req: Request): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") ?? ""
  const to   = searchParams.get("to")   ?? ""

  if (!from || !to) return NextResponse.json({ error: "from et to requis" }, { status: 400 })

  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toDate   = new Date(`${to}T23:59:59.999Z`)

  const result = await cached<{ events: CalendarEventDisplay[]; googleConnected: boolean }>(
    `calendar:${orgId}:${from}:${to}`,
    120, // TTL 2 minutes
    async () => {
      // ── 5 queries DB + Google en parallèle ──────────────────────────────
      const [calRows, jobRows, contentRows, logRows, taskRows, creds] = await Promise.all([
        db.select().from(calendarEvents)
          .where(and(eq(calendarEvents.orgId, orgId), gte(calendarEvents.startAt, fromDate), lte(calendarEvents.startAt, toDate)))
          .catch(() => []),

        db.select().from(scheduledJobs)
          .where(and(eq(scheduledJobs.orgId, orgId), eq(scheduledJobs.isActive, true)))
          .limit(100).catch(() => []),

        db.select().from(contents)
          .where(and(eq(contents.orgId, orgId), gte(contents.createdAt, fromDate), lte(contents.createdAt, toDate)))
          .limit(200).catch(() => []),

        db.select({ id: actionLogs.id, createdAt: actionLogs.createdAt, type: actionLogs.type, status: actionLogs.status, slug: agentInstances.agentSlug })
          .from(actionLogs)
          .leftJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
          .where(and(eq(actionLogs.orgId, orgId), gte(actionLogs.createdAt, fromDate), lte(actionLogs.createdAt, toDate)))
          .orderBy(desc(actionLogs.createdAt)).limit(300).catch(() => []),

        db.select().from(tasks)
          .where(and(eq(tasks.orgId, orgId), gte(tasks.dueDate, fromDate), lte(tasks.dueDate, toDate)))
          .limit(200).catch(() => []),

        getGoogleCalendarCreds(orgId).catch(() => null),
      ])

      const all: CalendarEventDisplay[] = []
      let googleConnected = false

      // 1. calendarEvents
      for (const r of calRows) {
        const start = r.startAt.toISOString()
        all.push({
          id: r.id, recordId: r.id,
          title: r.title, description: r.description ?? undefined,
          date: isoDate(r.startAt), startAt: start, endAt: r.endAt.toISOString(),
          allDay: r.allDay, time: r.allDay ? undefined : toTime(start),
          type: r.type, agentSlug: r.agentSlug ?? undefined,
          color: r.color ?? TYPE_COLORS[r.type] ?? "#94A3B8",
          location: r.location ?? undefined, googleEventId: r.googleEventId ?? undefined,
          status: r.status, source: "calendar_events",
        })
      }

      // 2. scheduledJobs — occurrences récurrentes
      for (const j of jobRows) {
        const anchor = j.nextRunAt ?? j.lastRunAt
        if (!anchor) continue
        for (const d of jobOccurrences(anchor, j.frequency, fromDate, toDate)) {
          all.push({
            id: `job-${j.id}-${isoDate(d)}`, title: j.name, date: isoDate(d),
            startAt: d.toISOString(), endAt: d.toISOString(),
            allDay: false, time: toTime(d.toISOString()),
            type: "automatisation" as const, agentSlug: j.agentSlug,
            color: TYPE_COLORS["automatisation"] ?? "#7C3AED", status: "confirmed",
            source: "scheduled_jobs" as const,
          })
        }
      }

      // 3. contents
      for (const c of contentRows) {
        const d = c.createdAt
        all.push({
          id: `content-${c.id}`, title: c.title ?? "Contenu",
          date: isoDate(d), startAt: d.toISOString(), endAt: d.toISOString(),
          allDay: false, time: toTime(d.toISOString()),
          type: "contenu" as const, agentSlug: c.agentSlug,
          color: TYPE_COLORS["contenu"] ?? "#F472B6", status: c.status ?? "confirmed",
          source: "contents" as const,
        })
      }

      // 4. action_logs
      for (const r of logRows) {
        const d = r.createdAt
        all.push({
          id: `log-${r.id}`, title: `${r.slug ?? "Agent"} — ${r.type}`,
          date: isoDate(d), startAt: d.toISOString(), endAt: d.toISOString(),
          allDay: false, time: toTime(d.toISOString()),
          type: "action" as const, agentSlug: r.slug ?? undefined,
          color: TYPE_COLORS["action"] ?? "#34D399", status: r.status ?? undefined,
          source: "action_logs" as const,
        })
      }

      // 5. tasks
      for (const t of taskRows) {
        if (!t.dueDate) continue
        const d = t.dueDate
        const color = t.priority === "high" ? "#EF4444" : t.priority === "low" ? "#64748B" : "#FBBF24"
        all.push({
          id: `task-${t.id}`, recordId: t.id,
          title: t.title, description: t.description ?? undefined,
          date: isoDate(d), startAt: d.toISOString(), endAt: d.toISOString(),
          allDay: true, time: undefined, type: "tache" as const, color,
          status: t.status === "done" ? "cancelled" : "confirmed",
          source: "tasks" as const,
        })
      }

      // 6. Google Calendar
      if (creds) {
        try {
          googleConnected = true
          const gevents = await fetchGoogleEvents(creds.access_token, fromDate.toISOString(), toDate.toISOString())
          for (const g of gevents) {
            const startRaw = g.start.dateTime ?? g.start.date ?? ""
            const endRaw   = g.end.dateTime   ?? g.end.date   ?? ""
            const d        = new Date(startRaw)
            const isAllDay = !g.start.dateTime
            if (all.some(e => e.googleEventId === g.id)) continue
            all.push({
              id: `google-${g.id}`, title: g.summary ?? "(Sans titre)",
              date: isoDate(d), startAt: startRaw, endAt: endRaw,
              allDay: isAllDay, time: isAllDay ? undefined : toTime(startRaw),
              type: "rdv", googleEventId: g.id,
              color: "#22D3EE", status: g.status ?? "confirmed",
              location: g.location, description: g.description, source: "google",
            })
          }
        } catch { /* Google optionnel */ }
      }

      all.sort((a, b) => a.startAt < b.startAt ? -1 : 1)
      return { events: all, googleConnected }
    }
  )

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=120, stale-while-revalidate=240" },
  })
}

// ─── POST (création) ─────────────────────────────────────────────────────────

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  startAt:     z.string().datetime(),
  endAt:       z.string().datetime(),
  allDay:      z.boolean().default(false),
  type:        z.enum(["rdv", "contenu", "automatisation", "tache", "autre"]).default("rdv"),
  agentSlug:   z.string().nullish(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullish(),
  location:    z.string().max(500).nullish(),
})

export async function POST(req: Request): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const d = parsed.data
  let googleEventId: string | null = null
  let googleSynced  = false

  const rows = await db.insert(calendarEvents).values({
    orgId, title: d.title, description: d.description ?? null,
    startAt: new Date(d.startAt), endAt: new Date(d.endAt),
    allDay: d.allDay, type: d.type, agentSlug: d.agentSlug ?? null,
    color: d.color ?? null, location: d.location ?? null,
  }).returning()

  const row = rows[0]
  if (!row) return NextResponse.json({ error: "Insertion échouée" }, { status: 500 })

  // Sync Google
  try {
    const creds = await getGoogleCalendarCreds(orgId)
    if (creds) {
      const gPayload = {
        summary:     d.title,
        description: d.description ?? undefined,
        location:    d.location ?? undefined,
        start: d.allDay ? { date: d.startAt.slice(0, 10) } : { dateTime: d.startAt, timeZone: "Europe/Paris" },
        end:   d.allDay ? { date: d.endAt.slice(0, 10)   } : { dateTime: d.endAt,   timeZone: "Europe/Paris" },
      }
      const gEvent = await createGoogleEvent(creds.access_token, gPayload)
      if (gEvent?.id) {
        googleEventId = gEvent.id
        googleSynced  = true
        await db.update(calendarEvents).set({ googleEventId: gEvent.id }).where(eq(calendarEvents.id, row.id))
      }
    }
  } catch { /* Google optionnel */ }

  return NextResponse.json({ event: { ...row, googleEventId }, googleSynced }, { status: 201 })
}
