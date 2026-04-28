export interface DeepgramCredentials {
  api_key: string
}

export interface TranscriptChunk {
  text: string
  isFinal: boolean
  confidence: number
}

/**
 * Transcribe audio buffer using Deepgram REST API (non-streaming, for short clips).
 * For real-time streaming STT, use getDeepgramStreamingUrl() with a WebSocket client.
 */
export async function transcribeAudio(
  credentials: DeepgramCredentials,
  audioBuffer: Buffer,
  mimeType: string = "audio/wav"
): Promise<{ transcript: string; confidence: number }> {
  const response = await fetch(
    "https://api.deepgram.com/v1/listen?language=fr&model=nova-2&smart_format=true&punctuate=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${credentials.api_key}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(audioBuffer),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Deepgram error: ${err}`)
  }

  interface DeepgramResponse {
    results?: {
      channels?: Array<{
        alternatives?: Array<{
          transcript: string
          confidence: number
        }>
      }>
    }
  }

  const data = (await response.json()) as DeepgramResponse

  const alt = data.results?.channels?.[0]?.alternatives?.[0]
  return {
    transcript: alt?.transcript ?? "",
    confidence: alt?.confidence ?? 0,
  }
}

/**
 * Returns Deepgram streaming WebSocket URL for real-time STT.
 * Use with a WebSocket client to pipe Twilio mulaw audio in real-time.
 *
 * Events to listen for on the Deepgram WS:
 * - "Results" with is_final=true → completed utterance
 * - "UtteranceEnd" → silence detected, process accumulated text
 */
export function getDeepgramStreamingUrl(apiKey: string): string {
  const params = new URLSearchParams({
    language: "fr",
    model: "nova-2",
    encoding: "mulaw",
    sample_rate: "8000",
    channels: "1",
    punctuate: "true",
    interim_results: "true",
    utterance_end_ms: "1000",
    vad_events: "true",
  })
  return `wss://api.deepgram.com/v1/listen?${params.toString()}&token=${apiKey}`
}
