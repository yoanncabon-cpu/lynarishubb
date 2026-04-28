import { type NextRequest } from "next/server"

export const runtime = "nodejs"

/**
 * Next.js App Router does not support native WebSocket upgrades.
 * The real WebSocket server lives in src/server/voice-ws.ts and runs
 * standalone on VOICE_WS_PORT (default 3001).
 *
 * This route exists only as a fallback to return a clear error
 * if someone accidentally hits this endpoint via HTTP.
 *
 * See RUNBOOK.md for production WebSocket setup.
 */
export async function GET(request: NextRequest) {
  const upgrade = request.headers.get("upgrade")

  if (upgrade?.toLowerCase() === "websocket") {
    return new Response(
      "WebSocket endpoint requires the standalone voice server (src/server/voice-ws.ts). See RUNBOOK.md.",
      { status: 501 }
    )
  }

  return new Response("Expected WebSocket upgrade", { status: 426 })
}
