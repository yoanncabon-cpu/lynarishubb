// Centralized Resend client — thin wrapper over src/lib/emails/send.ts
// Exported functions used by auth callback and agent notifications.

import { sendEmail } from "@/lib/emails/send"
import { welcomeEmail } from "@/lib/emails/templates"
import { emailLayout, emailButton } from "@/lib/emails/base-layout"

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<{ success: boolean; id?: string; demo?: boolean }> {
  const trialEndsAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const result = await sendEmail({
    to,
    from: "Lynaris <support@lynarisai.com>",
    template: welcomeEmail({ name: firstName, trialEndsAt }),
    tags: ["welcome"],
  })

  return result
}

export async function sendAgentNotificationEmail(
  to: string,
  agentName: string,
  action: string,
  result: string
): Promise<{ success: boolean; id?: string }> {
  const content = `
    <!-- Badge succès -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:#D1FAE5;color:#065F46;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui,-apple-system,sans-serif">
          T&acirc;che termin&eacute;e &#10003;
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif">${agentName} a termin&eacute; une action</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif">
      <strong style="color:#111827">T&acirc;che :</strong> ${action}
    </p>

    <div style="height:1px;background:#E5E7EB;margin-bottom:24px"></div>

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-family:system-ui,-apple-system,sans-serif">${result}</p>
    </div>

    ${emailButton("Voir le résultat complet", "https://lynarisai.com/dashboard", "neutral")}
  `

  const template = {
    subject: `${agentName} a terminé : ${action}`,
    text: `${agentName} a terminé une action.\n\nTâche : ${action}\n\n${result}\n\nVoir le résultat complet : https://lynarisai.com/dashboard`,
    html: emailLayout(content),
  }

  const res = await sendEmail({ to, from: "Lynaris <support@lynarisai.com>", template })
  return { success: res.success, id: res.id }
}
