export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { initWASession, subscribeWA, getWAStatus, getWAPhone, type WAEvent } from "@/lib/whatsapp/session-manager"

export async function GET(_req: NextRequest) {
  const orgId = await getOrProvisionOrgId()

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const send = (data: unknown) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch { /* fermé */ }
      }

      // Si la session est déjà connectée (singleton survit aux rechargements),
      // on envoie immédiatement "connected" sans attendre de nouveaux événements.
      if (getWAStatus(orgId) === "connected") {
        send({ type: "connected", phone: getWAPhone(orgId) ?? "" })
        // Laisser le client fermer le SSE — ne pas appeler controller.close() ici
        return () => { /* rien */ }
      }

      send({ type: "connecting" })

      const unsub = subscribeWA(orgId, (event: WAEvent) => {
        send(event)
        // NE PAS fermer controller ici — si le serveur ferme le SSE,
        // le browser reçoit un onerror avant le onmessage (race condition).
        // Le client ferme le EventSource proprement après réception de "connected".
      })

      // Lance la session (non-bloquant)
      void initWASession(orgId).catch((err: unknown) => {
        send({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue" })
        try { controller.close() } catch { /* ignore */ }
      })

      // Cleanup si le client se déconnecte
      return () => { unsub() }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  })
}
