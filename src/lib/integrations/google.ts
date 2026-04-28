// Google OAuth 2.0 — Calendar + Gmail scopes
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ")

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env["GOOGLE_CLIENT_ID"] ?? "",
    redirect_uri: `${process.env["NEXT_PUBLIC_APP_URL"]}/api/integrations/google/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
  scope: string
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env["GOOGLE_CLIENT_ID"] ?? "",
      client_secret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      redirect_uri: `${process.env["NEXT_PUBLIC_APP_URL"]}/api/integrations/google/callback`,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }

  const data = await response.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    token_type: string
    scope: string
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  }
}

export async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_at: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env["GOOGLE_CLIENT_ID"] ?? "",
      client_secret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) throw new Error("Google token refresh failed")

  const data = await response.json() as { access_token: string; expires_in: number }
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}
