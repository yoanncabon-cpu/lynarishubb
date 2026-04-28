/**
 * Standalone WebSocket server for Marine voice calls.
 * Runs alongside Next.js on VOICE_WS_PORT (default 3001).
 *
 * Dependencies: ws, @types/ws (already installed)
 * Optional: @deepgram/sdk (npm install @deepgram/sdk for streaming STT)
 *
 * Start: npx tsx src/server/voice-ws.ts
 */

import { WebSocketServer, WebSocket } from "ws"
import type { IncomingMessage } from "http"
import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam, Tool, ContentBlock } from "@anthropic-ai/sdk/resources"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TwilioStartPayload {
  streamSid: string
  callSid: string
  customParameters: Record<string, string>
}

interface TwilioMediaPayload {
  track: string
  chunk: string
  timestamp: string
  payload: string // base64 mulaw
}

interface TwilioStopPayload {
  accountSid: string
  callSid: string
}

interface TwilioMediaEvent {
  event: "start" | "media" | "stop" | "connected" | "mark"
  sequenceNumber?: string
  start?: TwilioStartPayload
  media?: TwilioMediaPayload
  stop?: TwilioStopPayload
  streamSid?: string
}

interface CallSession {
  streamSid: string
  callSid: string
  orgId: string
  agentSlug: string
  messages: MessageParam[]
  transcript: string[]
  isProcessing: boolean
  ws: WebSocket
}

// ─── Lazy agent registry import ───────────────────────────────────────────────
// We import dynamically so this file can run standalone without full Next.js build
async function loadAgentRegistry(): Promise<typeof import("@/lib/agents/registry")> {
  // When running via tsx with path aliases, this resolves via tsconfig paths
  // In production, compile first or use the absolute path
  try {
    return await import("@/lib/agents/registry")
  } catch {
    // Fallback: direct relative path
    return await import("../lib/agents/registry")
  }
}

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"] ?? "",
})

// ─── Session store ────────────────────────────────────────────────────────────

const sessions = new Map<string, CallSession>()

// ─── TTS: ElevenLabs → mulaw for Twilio ───────────────────────────────────────

async function sendAudioToTwilio(session: CallSession, text: string): Promise<void> {
  const apiKey = process.env["ELEVENLABS_API_KEY"]
  if (!apiKey) {
    console.warn("[Voice] ELEVENLABS_API_KEY not set — skipping TTS")
    return
  }

  const voiceId = process.env["ELEVENLABS_VOICE_ID_MARINE"] ?? "pNInz6obpgDQGcFmaJgB"

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/basic", // mulaw
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.6, similarity_boost: 0.8 },
          output_format: "ulaw_8000",
        }),
      }
    )

    if (!response.ok || !response.body) {
      console.error("[Voice] ElevenLabs HTTP error", { status: response.status })
      return
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }

    const audioBuffer = Buffer.concat(chunks)
    const base64Audio = audioBuffer.toString("base64")

    // Twilio expects a media event with base64 payload
    const mediaEvent = JSON.stringify({
      event: "media",
      streamSid: session.streamSid,
      media: { payload: base64Audio },
    })

    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(mediaEvent)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    console.error("[Voice] TTS error", { error: message })
  }
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

async function sendGreeting(session: CallSession): Promise<void> {
  const { getAgent } = await loadAgentRegistry()
  const agentDef = getAgent(session.agentSlug)
  if (!agentDef) {
    console.error("[Voice] Agent not found", { slug: session.agentSlug })
    return
  }

  const greeting = await anthropic.messages.create({
    model: agentDef.model,
    max_tokens: 100,
    system: agentDef.systemPromptFn({ orgId: session.orgId }),
    messages: [
      { role: "user", content: "[CALL_START] Answer the phone with your standard greeting." },
    ],
  })

  const greetingText = greeting.content
    .filter((b: ContentBlock) => b.type === "text")
    .map((b: ContentBlock) => (b.type === "text" ? b.text : ""))
    .join("")

  if (!greetingText) return

  session.messages.push(
    { role: "user", content: "[CALL_START]" },
    { role: "assistant", content: greetingText }
  )
  session.transcript.push(`Marine: ${greetingText}`)

  await sendAudioToTwilio(session, greetingText)
}

// ─── Process user speech → Claude → TTS ──────────────────────────────────────

async function processUserSpeech(session: CallSession, userText: string): Promise<void> {
  if (session.isProcessing) return
  session.isProcessing = true
  session.transcript.push(`Patient: ${userText}`)

  const { getAgent } = await loadAgentRegistry()
  const agentDef = getAgent(session.agentSlug)
  if (!agentDef) {
    session.isProcessing = false
    return
  }

  session.messages.push({ role: "user", content: userText })

  try {
    let fullResponse = ""

    const stream = anthropic.messages.stream({
      model: agentDef.model,
      max_tokens: agentDef.maxTokens,
      system: agentDef.systemPromptFn({ orgId: session.orgId }),
      messages: session.messages,
      tools: agentDef.tools as Tool[],
    })

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text
      }
    }

    if (fullResponse) {
      session.messages.push({ role: "assistant", content: fullResponse })
      session.transcript.push(`Marine: ${fullResponse}`)
      await sendAudioToTwilio(session, fullResponse)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    console.error("[Voice] Claude error", { error: message })
  } finally {
    session.isProcessing = false
  }
}

// ─── WebSocket server ─────────────────────────────────────────────────────────

function createWss(port = 3001): WebSocketServer {
  const wss = new WebSocketServer({ port, path: "/api/voice/stream" })

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const urlStr = `http://localhost${req.url ?? "/"}`
    const url = new URL(urlStr)
    const orgId = url.searchParams.get("org") ?? "demo"
    const agentSlug = url.searchParams.get("agent") ?? "marine"

    let session: CallSession | null = null

    ws.on("message", (data: Buffer) => {
      let event: TwilioMediaEvent
      try {
        event = JSON.parse(data.toString()) as TwilioMediaEvent
      } catch {
        return
      }

      switch (event.event) {
        case "connected":
          console.info("[Voice] WebSocket connected")
          break

        case "start": {
          if (!event.start) break
          const { streamSid, callSid, customParameters } = event.start
          session = {
            streamSid,
            callSid,
            orgId: customParameters["org_id"] ?? orgId,
            agentSlug: customParameters["agent_slug"] ?? agentSlug,
            messages: [],
            transcript: [],
            isProcessing: false,
            ws,
          }
          sessions.set(streamSid, session)
          console.info("[Voice] Call started", {
            callSid: callSid.slice(-6),
            orgId: session.orgId,
          })

          // Fire and forget — greeting runs async
          void sendGreeting(session)
          break
        }

        case "media": {
          if (!session || !event.media) break
          // Full audio pipeline (Deepgram streaming STT) requires @deepgram/sdk.
          // When installed, pipe event.media.payload (base64 mulaw) to Deepgram WS,
          // collect transcript chunks, and call processUserSpeech on utterance_end.
          //
          // Stub: if a text transcript arrives via a sideband channel, use:
          // void processUserSpeech(session, transcribedText)
          break
        }

        case "stop": {
          if (!session) break
          console.info("[Voice] Call ended", {
            callSid: session.callSid.slice(-6),
            transcriptLines: session.transcript.length,
          })
          sessions.delete(session.streamSid)
          session = null
          break
        }

        default:
          break
      }
    })

    ws.on("close", () => {
      if (session) {
        sessions.delete(session.streamSid)
      }
    })

    ws.on("error", (err: Error) => {
      console.error("[Voice] WebSocket error", { error: err.message })
    })
  })

  console.info(`[Voice] WebSocket server listening on port ${port}`)
  return wss
}

export { createWss, processUserSpeech }
export type { CallSession }

// ─── Standalone entry point ───────────────────────────────────────────────────

const isMain =
  typeof require !== "undefined" && require.main === module

if (isMain) {
  const port = parseInt(process.env["VOICE_WS_PORT"] ?? "3001", 10)
  createWss(port)
}
