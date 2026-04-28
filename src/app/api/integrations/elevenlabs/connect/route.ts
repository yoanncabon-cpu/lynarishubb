export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import { z } from "zod"

const schema = z.object({
  api_key: z.string().min(32),
  voice_id_marine: z.string().optional(), // Voice ID for Marine agent
  model_id: z.string().default("eleven_multilingual_v2"),
})

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Validate the API key by fetching voices
  let voices: Array<{ voice_id: string; name: string }> = []
  try {
    const testRes = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": parsed.data.api_key },
    })
    if (!testRes.ok) {
      return NextResponse.json({ error: "ClÃ© API ElevenLabs invalide." }, { status: 422 })
    }
    const data = await testRes.json() as { voices: Array<{ voice_id: string; name: string }> }
    voices = data.voices?.slice(0, 20) ?? []
  } catch {
    return NextResponse.json({ error: "Impossible de joindre ElevenLabs." }, { status: 422 })
  }

  await upsertIntegration(orgId, "elevenlabs", {
    api_key: parsed.data.api_key,
    voice_id_marine: parsed.data.voice_id_marine ?? null,
    model_id: parsed.data.model_id,
  })
  return NextResponse.json({ success: true, provider: "elevenlabs", voices, message: "ElevenLabs connectÃ© avec succÃ¨s." })
}
