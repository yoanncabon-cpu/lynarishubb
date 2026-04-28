import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendEmail } from "@/lib/emails/send"

const bodySchema = z.object({
  email: z.string().email("Adresse email invalide"),
})

// Rate limiting simple en mémoire (1 req / 30s par IP)
// Convient pour le volume actuel — remplacer par Upstash si trafic élevé
const rateMap = new Map<string, number>()
const RATE_WINDOW_MS = 30_000

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  const lastRequest = rateMap.get(ip)
  const now = Date.now()

  if (lastRequest && now - lastRequest < RATE_WINDOW_MS) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessaie dans 30 secondes." },
      { status: 429 }
    )
  }
  rateMap.set(ip, now)

  // Validation
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Email invalide." },
      { status: 400 }
    )
  }

  const { email } = parsed.data

  // Email de confirmation
  await sendEmail({
    to: email,
    from: "Lynaris <support@lynarisai.com>",
    template: {
      subject: "Bienvenue dans la newsletter Lynaris",
      text: [
        "Merci de t'être abonné à la newsletter Lynaris !",
        "",
        "Tu recevras nos prochains articles, retours d'expérience et nouveautés produit directement dans ta boîte mail.",
        "",
        "À bientôt,",
        "L'équipe Lynaris",
        "https://lynarisai.com",
      ].join("\n"),
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090B;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#14141C;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px">
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#F5F5F7;letter-spacing:-0.02em">
              Bienvenue dans la newsletter Lynaris
            </p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(245,245,247,0.7)">
              Merci de t&apos;être abonné·e !
            </p>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:rgba(245,245,247,0.7)">
              Tu recevras nos prochains articles, retours d&apos;expérience et nouveautés produit directement dans ta boîte mail.
            </p>
            <a href="https://lynarisai.com/blog"
               style="display:inline-block;background:#E86F4D;color:white;text-decoration:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600">
              Lire les articles →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.06)">
            <p style="margin:0;font-size:13px;color:rgba(245,245,247,0.3)">
              Tu reçois cet email car tu t&apos;es inscrit sur <a href="https://lynarisai.com" style="color:#E86F4D;text-decoration:none">lynarisai.com</a>.
              Pour te désinscrire, réponds à cet email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
    tags: ["newsletter"],
  })

  return NextResponse.json({ success: true })
}
