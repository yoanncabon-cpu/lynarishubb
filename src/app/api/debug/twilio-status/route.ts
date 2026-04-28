export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

/**
 * Diagnostic Twilio : interroge l'API Twilio pour le statut final d'un SMS
 * (queued / sent / delivered / failed / undelivered).
 * Récupère aussi les infos compte (trial vs paid) pour expliquer pourquoi
 * un SMS "queued" peut ne jamais être livré.
 *
 * Usage : /api/debug/twilio-status?sid=SMxxx (le SID est dans les logs [send_sms] OK)
 */
export async function GET(req: NextRequest) {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"]
  const authToken = process.env["TWILIO_AUTH_TOKEN"]
  const fromNumber = process.env["TWILIO_PHONE_NUMBER"]

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio non configuré dans .env" }, { status: 500 })
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const sid = new URL(req.url).searchParams.get("sid")

  // 1. Info compte (trial ou non)
  const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const account = accRes.ok ? await accRes.json() as { type?: string; status?: string; friendly_name?: string } : null

  // 2. Numéros vérifiés (Trial uniquement — Verified Caller IDs)
  const verifiedRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/OutgoingCallerIds.json`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const verified = verifiedRes.ok
    ? (await verifiedRes.json() as { outgoing_caller_ids?: Array<{ phone_number: string; friendly_name: string }> }).outgoing_caller_ids ?? []
    : []

  // 3. Statut du SMS spécifique si SID fourni
  let messageStatus = null
  if (sid) {
    const msgRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`, {
      headers: { Authorization: `Basic ${auth}` },
    })
    if (msgRes.ok) {
      const data = await msgRes.json() as {
        status?: string
        error_code?: number | null
        error_message?: string | null
        to?: string
        from?: string
        date_sent?: string
        date_updated?: string
      }
      messageStatus = data
    }
  }

  // 4. 10 derniers SMS envoyés depuis ce compte (debug rapide)
  const recentRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=10`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const recent = recentRes.ok
    ? (await recentRes.json() as { messages?: Array<{ sid: string; to: string; status: string; error_code: number | null; error_message: string | null; date_sent: string }> }).messages ?? []
    : []

  return NextResponse.json({
    account: {
      type: account?.type,
      isTrial: account?.type === "Trial",
      status: account?.status,
      name: account?.friendly_name,
    },
    fromNumber,
    verifiedNumbers: verified.map(v => ({ phone: v.phone_number, name: v.friendly_name })),
    queriedMessage: messageStatus,
    recentMessages: recent.map(m => ({
      sid: m.sid,
      to: m.to,
      status: m.status,
      errorCode: m.error_code,
      errorMessage: m.error_message,
      dateSent: m.date_sent,
    })),
    note: "Si account.isTrial === true et que ton numéro destinataire n'est pas dans verifiedNumbers → Twilio accepte (queued) mais ne livre JAMAIS. Solution : ajouter le numéro dans console.twilio.com → Phone Numbers → Verified Caller IDs.",
  })
}
