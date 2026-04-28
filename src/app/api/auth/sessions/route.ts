import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export interface SessionData {
  id: string
  device: string
  ip: string
  date: string
  current: true
}

function parseUserAgent(ua: string): string {
  if (!ua) return "Navigateur inconnu"
  let os = "Inconnu"
  if (ua.includes("Windows NT 10") || ua.includes("Windows NT 11")) os = "Windows 10/11"
  else if (ua.includes("Windows NT 6")) os = "Windows"
  else if (ua.includes("Mac OS X")) os = "macOS"
  else if (ua.includes("iPhone")) os = "iPhone"
  else if (ua.includes("iPad")) os = "iPad"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("Linux")) os = "Linux"

  let browser = "Navigateur"
  if (ua.includes("Edg/")) browser = "Edge"
  else if (ua.includes("Chrome/") && !ua.includes("Chromium")) browser = "Chrome"
  else if (ua.includes("Firefox/")) browser = "Firefox"
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera"

  return `${browser} · ${os}`
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ sessions: [] })

  const ua = req.headers.get("user-agent") ?? ""
  const device = parseUserAgent(ua)

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const dateStr = `Aujourd'hui ${pad(now.getHours())}:${pad(now.getMinutes())}`

  const currentSession: SessionData = {
    id: `…${session.access_token.slice(-6)}`,
    device,
    ip: "—",
    date: dateStr,
    current: true,
  }

  return NextResponse.json({ sessions: [currentSession] })
}
