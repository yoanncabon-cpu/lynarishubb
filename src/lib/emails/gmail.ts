import nodemailer from "nodemailer"
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
}

export async function sendGmail(
  options: GmailEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const fromUser = process.env["GMAIL_USER"] ?? "support@lynarisai.com"
  const fromField = options.from ?? `Lynaris <${fromUser}>`
  const toField = Array.isArray(options.to) ? options.to.join(", ") : options.to

  // Priorité 1 — Gmail SMTP (photo de profil Google Workspace associée automatiquement)
  const transport = getTransporter()
  if (transport) {
    try {
      await transport.sendMail({
        from: fromField, to: toField,
        subject: options.subject, html: options.html,
        text: options.text, replyTo: options.replyTo,
      })
      console.info("[gmail] Envoyé via Gmail SMTP →", toField)
      return { success: true }
    } catch (err) {
      console.error("[gmail] Erreur Gmail SMTP:", err instanceof Error ? err.message : err)
    }
  }

  // Priorité 2 — Resend (backup si Gmail SMTP indisponible)
  const resend = getResend()
  const customFromEmail = process.env["RESEND_FROM_EMAIL"] ?? ""
  if (resend && customFromEmail && customFromEmail !== "onboarding@resend.dev") {
    const fromName = process.env["RESEND_FROM_NAME"] ?? "Lynaris"
    const resendFrom = `${fromName} <${customFromEmail}>`
    try {
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: toField,
        subject: options.subject,
        html: options.html,
        text: options.text ?? "",
        replyTo: options.replyTo ?? fromField,
      })
      if (error) {
        console.warn("[email] Resend échec:", error.message)
      } else {
        console.info("[email] Envoyé via Resend →", toField, "| from:", customFromEmail, "| id:", data?.id)
        return { success: true }
      }
    } catch (err) {
      console.error("[email] Resend exception:", err instanceof Error ? err.message : err)
    }
  }

  console.warn("[email] Aucun provider n'a réussi. Vérifie RESEND_API_KEY dans .env")
  return { success: false, error: "No email provider available" }
}
