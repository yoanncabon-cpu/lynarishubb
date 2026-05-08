import { logger } from "@/lib/logger"

const GH_API = "https://graph.facebook.com/v19.0"

/** Envoie un message texte WhatsApp */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<boolean> {
  const res = await fetch(`${GH_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    logger.error("[WhatsApp] sendMessage failed", { err: JSON.stringify(err) })
  }
  return res.ok
}

/** Marque un message comme lu (double coche bleue) */
export async function markWhatsAppRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  await fetch(`${GH_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => { /* silently ignore */ })
}
