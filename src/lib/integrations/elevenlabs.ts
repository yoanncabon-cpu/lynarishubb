export interface ElevenLabsCredentials {
  api_key: string
}

export async function textToSpeech(
  credentials: ElevenLabsCredentials,
  text: string,
  voiceId: string = "pNInz6obpgDQGcFmaJgB", // "Adam" voice as default
  modelId: string = "eleven_multilingual_v2"
): Promise<{ success: boolean; audioBuffer?: Buffer; error?: string }> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": credentials.api_key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )

  if (!response.ok) {
    return { success: false, error: `ElevenLabs error: ${response.status}` }
  }

  const arrayBuffer = await response.arrayBuffer()
  return { success: true, audioBuffer: Buffer.from(arrayBuffer) }
}
