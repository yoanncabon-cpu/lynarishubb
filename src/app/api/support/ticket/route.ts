import { NextResponse } from "next/server"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { supportTickets } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { sendGmail } from "@/lib/emails/gmail"
import { emailLayout, emailButton, emailInfoRow, emailBadge } from "@/lib/emails/base-layout"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

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

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"])

function isImageUrl(url: string): boolean {
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase() ?? ""
  return IMAGE_EXTENSIONS.has(ext)
}

function fileNameFromUrl(url: string): string {
  return decodeURIComponent(url.split("?")[0]?.split("/").pop() ?? url)
}

// URL absolue prod pour les liens email — évite les liens localhost cassés en prod
function getPublicAppUrl(): string {
  const url = process.env["NEXT_PUBLIC_APP_URL"] ?? ""
  if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) return url
  return "https://lynarisai.com"
}

function buildEmailHtml(
  fields: z.infer<typeof TicketBodySchema>,
  ticketId: string,
  userEmail: string | null,
  attachmentUrls: string[]
): string {
  const priorityColorMap: Record<string, "blue" | "green" | "orange" | "red"> = {
    Faible: "blue",
    Normale: "green",
    Haute: "orange",
    Urgente: "red",
  }
  const priorityVariant = priorityColorMap[fields.priority] ?? "orange"
  const appUrl = getPublicAppUrl()
  const ticketUrl = `${appUrl}/dashboard/admin/tickets?ticket=${ticketId}`

  // Sépare images (preview inline) des autres fichiers (lien cliquable)
  const images = attachmentUrls.filter(isImageUrl)
  const otherFiles = attachmentUrls.filter((u) => !isImageUrl(u))

  const imagesBlock = images.length > 0
    ? `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(250,250,250,0.45);margin:0 0 12px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif">
        Captures d'écran (${images.length})
      </p>
      ${images.map((url) => `
        <a href="${url}" style="display:block;margin-bottom:12px;text-decoration:none">
          <img src="${url}" alt="Pièce jointe ticket" style="display:block;max-width:100%;height:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.07)" />
        </a>
      `).join("")}
    </div>` : ""

  const filesBlock = otherFiles.length > 0
    ? `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(250,250,250,0.45);margin:0 0 12px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif">
        Fichiers joints
      </p>
      ${otherFiles.map((url) => `
        <a href="${url}" style="display:block;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px 16px;margin-bottom:8px;color:#E86F4D;text-decoration:none;font-size:13px;font-family:system-ui,-apple-system,sans-serif;word-break:break-all">
          📎 ${fileNameFromUrl(url)}
        </a>
      `).join("")}
    </div>` : ""

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(232,111,77,0.15);color:#E86F4D;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;border:1px solid rgba(232,111,77,0.30)">
        TICKET ${ticketId}
      </span>
    </td></tr></table>

    <h1 style="font-size:24px;font-weight:700;color:#FAFAFA;margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:-0.02em">
      Nouveau ticket de support
    </h1>
    <p style="font-size:14px;color:rgba(250,250,250,0.55);margin:0 0 28px;font-family:system-ui,-apple-system,sans-serif">
      Reçu via le dashboard Lynaris
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      ${emailInfoRow("Sujet", `<strong style="color:#FAFAFA">${fields.subject}</strong>`)}
      ${emailInfoRow("Catégorie", fields.category)}
      ${emailInfoRow("Priorité", emailBadge(fields.priority, priorityVariant))}
      ${userEmail ? emailInfoRow("Utilisateur", `<a href="mailto:${userEmail}" style="color:#E86F4D;text-decoration:none">${userEmail}</a>`) : ""}
    </table>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(250,250,250,0.45);margin:0 0 12px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif">
        Description
      </p>
      <p style="font-size:14px;line-height:1.7;color:#FAFAFA;margin:0;white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif">${fields.description}</p>
    </div>

    ${imagesBlock}
    ${filesBlock}

    ${emailButton("Gérer ce ticket →", ticketUrl)}
  `

  return emailLayout(content)
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limiting : protège contre flood / DoS / spam de tickets
  // (10 requêtes par minute par IP)
  const rl = await checkRateLimit(req as never, "api")
  if (rl !== null && !rl.success) {
    return rateLimitResponse(rl.reset)
  }

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
