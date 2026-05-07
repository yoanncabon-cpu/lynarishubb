import { getIntegration } from "@/lib/integrations/manager"

// ─── Credentials helper ───────────────────────────────────────────────────────
// Logique identique à getGoogleCreds dans src/lib/agents/tools/index.ts
// Copie indépendante — ne pas importer tools/index.ts (évite effets de bord)

export async function getGoogleCalendarCreds(orgId: string): Promise<{ access_token: string } | null> {
  const integration = await getIntegration(orgId, "google").catch(() => null)
  if (!integration?.credentials) return null
  const creds = integration.credentials as Record<string, string>

  // Chemin Pipedream Connect (connecté via le catalogue intégrations)
  if (creds["connected_via"] === "pipedream" && creds["pipedream_account_id"]) {
    try {
      const { getPipedreamConnection } = await import("@/lib/integrations/pipedream")
      const account = await getPipedreamConnection(creds["pipedream_account_id"]) as {
        credentials?: { oauth_access_token?: string; access_token?: string }
      }
      const token = account.credentials?.oauth_access_token ?? account.credentials?.access_token
      if (token) return { access_token: token }
    } catch { /* fallback ci-dessous */ }
    return null
  }

  // Chemin OAuth natif (/api/integrations/google/connect)
  const expiresAt = creds["expires_at"] ? Number(creds["expires_at"]) : 0
  if (expiresAt && Date.now() > expiresAt - 60_000 && creds["refresh_token"]) {
    try {
      const { refreshGoogleToken } = await import("@/lib/integrations/google")
      const newCreds = await refreshGoogleToken(creds["refresh_token"])
      if (newCreds) return { access_token: newCreds.access_token }
    } catch { /* continuer avec le token actuel */ }
  }
  if (!creds["access_token"]) return null
  return { access_token: creds["access_token"] }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleCalEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end:   { dateTime?: string; date?: string; timeZone?: string }
  status?: string
  htmlLink?: string
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function fetchGoogleEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<GoogleCalEvent[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
  url.searchParams.set("timeMin", timeMin)
  url.searchParams.set("timeMax", timeMax)
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("maxResults", "500")
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json() as { items?: GoogleCalEvent[] }
  return data.items ?? []
}

export async function createGoogleEvent(
  accessToken: string,
  payload: {
    summary: string
    description?: string
    location?: string
    start: { dateTime?: string; date?: string; timeZone?: string }
    end:   { dateTime?: string; date?: string; timeZone?: string }
  },
  calendarId = "primary"
): Promise<{ id: string } | null> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) return null
  const data = await res.json() as { id: string }
  return data
}

export async function updateGoogleEvent(
  accessToken: string,
  eventId: string,
  payload: Partial<Parameters<typeof createGoogleEvent>[1]>,
  calendarId = "primary"
): Promise<void> {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )
}

export async function deleteGoogleEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  )
}
