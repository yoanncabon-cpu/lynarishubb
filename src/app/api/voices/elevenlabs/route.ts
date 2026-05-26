import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url: string | null
  labels: Record<string, string>
  category: string
  description?: string
}

export interface VoiceItem {
  voice_id: string
  name: string
  preview_url: string | null
  gender: string
  accent: string
  description: string
  category: string
}

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request as never, "api")
  if (rl !== null && !rl.success) return rateLimitResponse(rl.reset)

  await getOrProvisionOrgId()

  const apiKey = process.env["ELEVENLABS_API_KEY"]
  if (!apiKey) {
    return NextResponse.json({ voices: [], error: "ELEVENLABS_API_KEY non configurée" })
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ voices: [], error: `ElevenLabs ${res.status}` }, { status: 502 })
    }

    const data = await res.json() as { voices: ElevenLabsVoice[] }

    const voices: VoiceItem[] = data.voices
      .filter(v => v.category === "premade" || v.category === "professional" || v.category === "cloned")
      .slice(0, 30)
      .map(v => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        gender: v.labels["gender"] ?? "",
        accent: v.labels["accent"] ?? "",
        description: v.labels["description"] ?? v.description ?? "",
        category: v.category,
      }))

    return NextResponse.json({ voices })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ voices: [], error: msg }, { status: 500 })
  }
}
