import { NextResponse } from "next/server"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { supportTickets } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { sendGmail } from "@/lib/emails/gmail"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"])

// ─── Validation ────────────────────────────────────────────────────────────────

const TicketBodySchema = z.object({
  subject: z.string().min(3, "Le sujet doit faire au moins 3 caractères.").max(200),
  category: z.enum(
    ["Bug / Erreur", "Problème de facturation", "Question sur un agent", "Intégration", "Autre"],
    { error: "Catégorie invalide." }
  ),
  priority: z.enum(["Faible", "Normale", "Haute", "Urgente"], { error: "Priorité invalide." }),
  description: z.string().min(10, "La description doit faire au moins 10 caractères.").max(5000),
})

// ─── HTML email builder ────────────────────────────────────────────────────────

function buildEmailHtml(
  fields: z.infer<typeof TicketBodySchema>,
  ticketId: string,
  userEmail: string | null,
  attachmentUrls: string[]
): string {
  const priorityColor: Record<string, string> = {
    Faible: "#6366F1",
    Normale: "#10B981",
    Haute: "#F59E0B",
    Urgente: "#EF4444",
  }

  const color = priorityColor[fields.priority] ?? "#E86F4D"

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Ticket ${ticketId}</title></head>
<body style="font-family:system-ui,sans-serif;background:#09090B;color:#FAFAFA;margin:0;padding:32px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#E86F4D;borderRadius:8px;padding:4px 12px;display:inline-block;marginBottom:24px;">
      <span style="font-size:12px;font-weight:700;letter-spacing:0.05em;color:#fff;">TICKET ${ticketId}</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;">Nouveau ticket de support</h1>
    <p style="font-size:14px;color:rgba(250,250,250,0.6);margin:0 0 32px;">Reçu via le dashboard Lynaris</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(250,250,250,0.45);width:120px;">Sujet</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px;font-weight:600;">${fields.subject}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(250,250,250,0.45);">Catégorie</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px;">${fields.category}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(250,250,250,0.45);">Priorité</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:12px;font-weight:700;color:${color};background:${color}20;border-radius:20px;padding:3px 10px;">${fields.priority}</span>
        </td>
      </tr>
      ${
        userEmail
          ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(250,250,250,0.45);">Utilisateur</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px;">${userEmail}</td>
      </tr>`
          : ""
      }
      ${
        attachmentUrls.length > 0
          ? `<tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(250,250,250,0.45);vertical-align:top;">Pièces jointes</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:13px;">${attachmentUrls.map(u => `<a href="${u}" style="color:#E86F4D;display:block;word-break:break-all;">${u.split("/").pop()}</a>`).join("")}</td>
      </tr>`
          : ""
      }
    </table>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="font-size:12px;font-weight:600;letter-spacing:0.06em;color:rgba(250,250,250,0.4);margin:0 0 12px;text-transform:uppercase;">Description</p>
      <p style="font-size:14px;line-height:1.7;color:#FAFAFA;margin:0;white-space:pre-wrap;">${fields.description}</p>
    </div>

    <a href="${process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"}/dashboard/admin/tickets?ticket=${ticketId}"
       style="display:inline-block;background:#E86F4D;color:#fff;text-decoration:none;border-radius:10px;padding:14px 28px;font-size:15px;font-weight:600;letter-spacing:-0.01em;">
      Gérer ce ticket →
    </a>
    <p style="font-size:12px;color:rgba(250,250,250,0.3);margin:16px 0 0;">
      Ou copie ce lien : ${process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"}/dashboard/admin/tickets?ticket=${ticketId}
    </p>
  </div>
</body>
</html>
  `.trim()
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // Parse FormData
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ success: false, error: "Corps de requête invalide." }, { status: 400 })
  }

  // Validate text fields
  const parsed = TicketBodySchema.safeParse({
    subject: fd.get("subject"),
    category: fd.get("category"),
    priority: fd.get("priority"),
    description: fd.get("description"),
  })
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Données invalides."
    return NextResponse.json({ success: false, error: firstMessage }, { status: 422 })
  }

  const fields = parsed.data
  const ticketId = `LYN-${Date.now().toString().slice(-6)}`

  // Authentification + email utilisateur
  const supabase = await createSupabaseServerClient()
  let userEmail: string | null = null
  try {
    const { data } = await supabase.auth.getUser()
    userEmail = data.user?.email ?? null
  } catch { /* session optionnelle */ }

  // Upload des pièces jointes vers Supabase Storage
  const rawFiles = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0)
  const filesToUpload = rawFiles.slice(0, MAX_FILES).filter(f => ALLOWED_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE)
  const attachmentUrls: string[] = []

  for (const file of filesToUpload) {
    try {
      const ext = file.name.split(".").pop() ?? "bin"
      const path = `tickets/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const arrayBuf = await file.arrayBuffer()
      const { error: uploadErr } = await supabase.storage
        .from("support-attachments")
        .upload(path, arrayBuf, { contentType: file.type, upsert: false })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(path)
        if (urlData.publicUrl) attachmentUrls.push(urlData.publicUrl)
      }
    } catch { /* fichier ignoré si upload échoue */ }
  }

  // Persister en DB — URLs des pièces jointes stockées dans pageUrl (JSON)
  try {
    const orgId = await getOrProvisionOrgId()
    await db.insert(supportTickets).values({
      orgId,
      ticketId,
      subject: fields.subject,
      category: fields.category,
      priority: fields.priority,
      description: fields.description,
      pageUrl: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null,
      userEmail: userEmail ?? null,
      status: "open",
    })
  } catch (err) {
    console.error("[support/ticket] DB insert error:", err)
  }

  // Envoyer via Gmail SMTP
  const { success, error } = await sendGmail({
    from: "Lynaris Support <support@lynarisai.com>",
    to: "support@lynarisai.com",
    ...(userEmail ? { replyTo: userEmail } : {}),
    subject: `[Support][${fields.priority}] ${fields.category} — ${fields.subject}`,
    html: buildEmailHtml(fields, ticketId, userEmail, attachmentUrls),
  })

  if (!success) {
    console.error("[support/ticket] Gmail error:", error)
  }

  return NextResponse.json({ success: true, ticketId })
}

// ─── GET — liste les tickets de l'org ─────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()

  try {
    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.orgId, orgId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(50)
    return NextResponse.json({ tickets })
  } catch (err) {
    // Table pas encore créée (migration non jouée) — retourne liste vide proprement
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("support_tickets") || msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json({ tickets: [] })
    }
    return NextResponse.json({ tickets: [], error: "DB unavailable" })
  }
}
