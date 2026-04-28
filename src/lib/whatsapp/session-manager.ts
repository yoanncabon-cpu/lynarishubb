import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import * as qrcode from "qrcode"
import pino from "pino"
import path from "path"
import fs from "fs"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { upsertIntegration, disconnectIntegration } from "@/lib/integrations/manager"
import { runAgent } from "@/lib/agents/executor"

// Logger Pino silencieux — Baileys exige une instance Pino réelle (avec .child())
const silentLogger = pino({ level: "silent" })

export type WAStatus = "connecting" | "qr" | "connected" | "disconnected" | "error"

export type WAEvent =
  | { type: "qr"; imageDataUrl: string }
  | { type: "connected"; phone: string }
  | { type: "disconnected" }
  | { type: "error"; message: string }

interface WASession {
  status: WAStatus
  socket: WASocket | null
  listeners: Set<(event: WAEvent) => void>
  phone: string | null
  // Historique de conversation par JID WhatsApp (en mémoire, pour la session courante)
  conversations: Map<string, MessageParam[]>
}

declare global {
  var _waSessions: Map<string, WASession> | undefined
}

function getSessions(): Map<string, WASession> {
  if (!global._waSessions) global._waSessions = new Map()
  return global._waSessions
}

function getAuthDir(orgId: string): string {
  const dir = path.join(process.cwd(), ".whatsapp-auth", orgId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function emit(session: WASession, event: WAEvent) {
  session.listeners.forEach((l) => l(event))
}

export function subscribeWA(orgId: string, listener: (e: WAEvent) => void): () => void {
  const sessions = getSessions()
  if (!sessions.has(orgId)) {
    sessions.set(orgId, { status: "disconnected", socket: null, listeners: new Set(), phone: null, conversations: new Map() })
  }
  const session = sessions.get(orgId)!
  session.listeners.add(listener)
  return () => session.listeners.delete(listener)
}

export function getWAStatus(orgId: string): WAStatus {
  return getSessions().get(orgId)?.status ?? "disconnected"
}

export function getWAPhone(orgId: string): string | null {
  return getSessions().get(orgId)?.phone ?? null
}

export async function initWASession(orgId: string): Promise<void> {
  const sessions = getSessions()

  // Réutilise la session existante si déjà connectée ou en attente de QR
  const existing = sessions.get(orgId)
  if (existing?.status === "connected" || existing?.status === "qr") return

  const authDir = getAuthDir(orgId)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version } = await fetchLatestBaileysVersion()

  const session: WASession = {
    status: "connecting",
    socket: null,
    listeners: existing?.listeners ?? new Set(),
    phone: null,
    conversations: existing?.conversations ?? new Map(),
  }
  sessions.set(orgId, session)

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
    },
    printQRInTerminal: false,
    logger: silentLogger,
    browser: ["Lynaris", "Chrome", "3.0"],
    generateHighQualityLinkPreview: false,
  })

  session.socket = sock

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      session.status = "qr"
      try {
        const imageDataUrl = await qrcode.toDataURL(qr, { width: 256, margin: 2 })
        emit(session, { type: "qr", imageDataUrl })
      } catch { /* ignore */ }
    }

    if (connection === "open") {
      session.status = "connected"
      const phone = sock.user?.id?.split(":")[0] ?? ""
      session.phone = phone
      emit(session, { type: "connected", phone })
      // Sauvegarder en DB
      try {
        await upsertIntegration(orgId, "whatsapp", {
          phone,
          auth_dir: authDir,
          connected_at: new Date().toISOString(),
        })
      } catch { /* ignore */ }
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode
      session.status = "disconnected"
      emit(session, { type: "disconnected" })
      if (reason !== DisconnectReason.loggedOut && reason !== DisconnectReason.forbidden) {
        setTimeout(() => void initWASession(orgId), 3000)
      } else {
        sessions.delete(orgId)
        fs.rmSync(authDir, { recursive: true, force: true })
        try { await disconnectIntegration(orgId, "whatsapp") } catch { /* ignore */ }
      }
    }
  })

  // ── Messages entrants → Charles ───────────────────────────────────────────────
  sock.ev.on("messages.upsert", ({ messages: incoming, type }) => {
    if (type !== "notify") return

    void (async () => {
      for (const msg of incoming) {
        // Ignorer : propres messages, status broadcasts, pas de contenu
        if (msg.key.fromMe || msg.key.remoteJid === "status@broadcast") continue

        const text =
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          ""

        if (!text.trim()) continue

        const jid = msg.key.remoteJid!
        const senderName = msg.pushName ?? jid.split("@")[0] ?? "Utilisateur"

        // Récupère ou initialise l'historique de conversation pour ce contact
        if (!session.conversations.has(jid)) {
          session.conversations.set(jid, [])
        }
        const history = session.conversations.get(jid)!

        // Indicateur de frappe
        try { await sock.sendPresenceUpdate("composing", jid) } catch { /* ignore */ }

        // Ajoute le message utilisateur à l'historique
        history.push({ role: "user", content: `[WhatsApp de ${senderName}]: ${text}` })

        // Limite l'historique à 20 messages (10 échanges)
        if (history.length > 20) history.splice(0, history.length - 20)

        try {
          const result = await runAgent({
            agentSlug: "charles",
            messages: history,
            orgId,
            config: { channel: "whatsapp", senderName, senderJid: jid },
          })

          const reply = result.content.trim()

          // Ajoute la réponse de Charles à l'historique
          history.push({ role: "assistant", content: reply })

          // Envoie la réponse WhatsApp
          await sock.sendMessage(jid, { text: reply }, { quoted: msg })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Erreur inconnue"
          await sock.sendMessage(jid, {
            text: `⚠ Charles n'a pas pu répondre : ${errMsg}`,
          })
        } finally {
          try { await sock.sendPresenceUpdate("paused", jid) } catch { /* ignore */ }
        }
      }
    })()
  })
}

export async function disconnectWA(orgId: string): Promise<void> {
  const sessions = getSessions()
  const session = sessions.get(orgId)
  if (session?.socket) {
    try { await session.socket.logout() } catch { /* ignore */ }
    session.socket.end(undefined)
  }
  sessions.delete(orgId)
  const authDir = getAuthDir(orgId)
  fs.rmSync(authDir, { recursive: true, force: true })
  try { await disconnectIntegration(orgId, "whatsapp") } catch { /* ignore */ }
}
