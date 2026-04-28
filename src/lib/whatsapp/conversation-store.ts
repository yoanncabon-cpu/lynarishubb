/**
 * Historique de conversation WhatsApp en mémoire (global singleton).
 * Clé : `orgId:senderPhone` — max 20 messages (10 échanges).
 */
import type { MessageParam } from "@anthropic-ai/sdk/resources"

declare global {
  var _waConversations: Map<string, MessageParam[]> | undefined
}

function getStore(): Map<string, MessageParam[]> {
  if (!global._waConversations) global._waConversations = new Map()
  return global._waConversations
}

export function getHistory(orgId: string, senderPhone: string): MessageParam[] {
  const key = `${orgId}:${senderPhone}`
  if (!getStore().has(key)) getStore().set(key, [])
  return getStore().get(key)!
}

export function pushHistory(
  orgId: string,
  senderPhone: string,
  msg: MessageParam
): void {
  const history = getHistory(orgId, senderPhone)
  history.push(msg)
  // Garder max 20 messages (10 échanges)
  if (history.length > 20) history.splice(0, history.length - 20)
}
