import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"
import type { Transporter } from "nodemailer"
import { Resend } from "resend"

let transporter: Transporter | null = null
let resendClient: Resend | null = null

function getTransporter(): Transporter | null {
  const user = process.env["GMAIL_USER"]
  const pass = process.env["GMAIL_APP_PASSWORD"]
  if (!user || !pass) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    })
  }
  return transporter
}

function getResend(): Resend | null {
  const key = process.env["RESEND_API_KEY"]
  if (!key) return null
  if (!resendClient) resendClient = new Resend(key)
  return resendClient
}

interface GmailEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  from?: string
  attachments?: Array<{
    filename: string
    content: Buffer | Uint8Array
    contentType: string
  }>
}

export async function sendGmail(
  options: GmailEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const fromUser = process.env["GMAIL_USER"] ?? "support@lynarisai.com"
  const fallbackFrom = options.from ?? `Lynaris <${fromUser}>`
  const toField = Array.isArray(options.to) ? options.to.join(", ") : options.to

  // Priorité 1 — Resend
  // Le domaine lynarisai.com est validé chez Resend (DKIM/SPF/DMARC alignés).
  // Envoyer via Resend garantit l'authentification DMARC complète et fait
  // sauter le bandeau "expéditeur non vérifié" de Gmail.
  const resend = getResend()
  const customFromEmail = process.env["RESEND_FROM_EMAIL"] ?? ""
  if (resend && customFromEmail && customFromEmail !== "onboarding@resend.dev") {
    const fromName = process.env["RESEND_FROM_NAME"] ?? "Lynaris"
    const resendFrom = options.from ?? `${fromName} <${customFromEmail}>`
    try {
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: toField,
        subject: options.subject,
        html: options.html,
        text: options.text ?? "",
        replyTo: options.replyTo ?? customFromEmail,
        attachments: (options.attachments ?? []).map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content),
        })),
      })
      if (error) {
        logger.warn("[email] Resend échec, fallback Gmail SMTP", { err: error.message })
      } else {
        logger.info("[email] Envoyé via Resend", { to: toField, from: customFromEmail, id: data?.id })
        return { success: true }
      }
    } catch (err) {
      logger.error("[email] Resend exception, fallback Gmail SMTP", { err: err instanceof Error ? err.message : String(err) })
    }
  }

  // Priorité 2 — Gmail SMTP (fallback uniquement si Resend indisponible)
  const transport = getTransporter()
  if (transport) {
    try {
      await transport.sendMail({
        from: fallbackFrom, to: toField,
        subject: options.subject, html: options.html,
        text: options.text, replyTo: options.replyTo,
        attachments: (options.attachments ?? []).map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content),
          contentType: a.contentType,
        })),
      })
      logger.info("[gmail] Envoyé via Gmail SMTP (fallback)", { to: toField })
      return { success: true }
    } catch (err) {
      logger.error("[gmail] Erreur Gmail SMTP", { err: err instanceof Error ? err.message : String(err) })
    }
  }

  logger.warn("[email] Aucun provider n'a réussi. Vérifie RESEND_API_KEY ou GMAIL_APP_PASSWORD dans .env")
  return { success: false, error: "No email provider available" }
}
