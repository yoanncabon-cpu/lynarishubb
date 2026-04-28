import { sendGmail } from "./gmail"
import type { EmailTemplate } from "./templates"

interface SendEmailOptions {
  to: string | string[]
  from?: string
  template: EmailTemplate
  replyTo?: string
  tags?: string[] // ignoré avec Gmail, conservé pour compatibilité
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendGmail({
    to: options.to,
    from: options.from,
    subject: options.template.subject,
    html: options.template.html,
    text: options.template.text,
    replyTo: options.replyTo,
  })
}
