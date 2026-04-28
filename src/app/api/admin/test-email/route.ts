import { NextResponse } from "next/server"
import { sendGmail } from "@/lib/emails/gmail"
import { emailLayout } from "@/lib/emails/base-layout"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const to = process.env["ADMIN_EMAILS"]?.split(",")[0]?.trim() ?? "yoanncabon@gmail.com"
  const gmailUser = process.env["GMAIL_USER"] ?? "(non configuré)"

  const html = emailLayout(`
    <h1 style="font-size:22px;font-weight:700;color:#FAFAFA;margin:0 0 12px;font-family:system-ui">Email de test ✓</h1>
    <p style="font-size:15px;color:rgba(250,250,250,0.6);line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Si tu vois ce message, le pipeline email fonctionne correctement.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(250,250,250,0.45);width:160px;font-family:system-ui">Provider utilisé</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#34D399;font-weight:600;font-family:system-ui">Gmail SMTP (${gmailUser})</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:13px;color:rgba(250,250,250,0.45);font-family:system-ui">Photo de profil</td>
        <td style="padding:10px 0;font-size:13px;color:#34D399;font-weight:600;font-family:system-ui">Logo Lynaris automatique ✓</td>
      </tr>
    </table>
  `)

  const result = await sendGmail({
    to,
    from: `Lynaris <${gmailUser}>`,
    subject: "[Test] Pipeline email Lynaris — Gmail SMTP",
    html,
    text: `Email de test Lynaris.\n\nProvider : Gmail SMTP (${gmailUser})\nDestinataire : ${to}`,
  })

  return NextResponse.json({
    success: result.success,
    to,
    from: gmailUser,
    error: result.error,
  })
}
