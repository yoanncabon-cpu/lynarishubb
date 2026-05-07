export type CalEventType = "rdv" | "contenu" | "automatisation" | "tache" | "autre"
export type CalEventStatus = "confirmed" | "tentative" | "cancelled"

export interface CalendarEventDisplay {
  id: string
  title: string
  date: string        // YYYY-MM-DD
  startAt: string     // ISO
  endAt: string       // ISO
  allDay: boolean
  time?: string       // HH:MM
  type: CalEventType | "action"
  agentSlug?: string
  status?: string
  color: string
  location?: string
  description?: string
  googleEventId?: string
  source: "calendar_events" | "scheduled_jobs" | "contents" | "action_logs" | "google" | "tasks"
  recordId?: string
  meta?: Record<string, unknown>
}

export interface CreateCalendarEventPayload {
  title: string
  description?: string | null
  startAt: string
  endAt: string
  allDay?: boolean
  type?: CalEventType
  agentSlug?: string | null
  color?: string | null
  location?: string | null
}

export type UpdateCalendarEventPayload = Partial<CreateCalendarEventPayload> & {
  status?: CalEventStatus
}
