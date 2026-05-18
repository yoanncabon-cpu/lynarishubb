export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contents } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"

// Convertit le Markdown en HTML (même logique que create_document)
function mdToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/^(?!<[hup])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()

  if (orgId === ANON_ORG_ID) {
    return new NextResponse("Non authentifié", { status: 401 })
  }

  const [row] = await db
    .select({ title: contents.title, body: contents.body, createdAt: contents.createdAt })
    .from(contents)
    .where(and(eq(contents.id, id), eq(contents.orgId, orgId)))
    .limit(1)
    .catch(() => [])

  if (!row) {
    return new NextResponse("Document introuvable", { status: 404 })
  }

  const title = row.title ?? "Document"
  const body = row.body ?? ""
  const now = new Date(row.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const htmlContent = mdToHtml(body)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
<style>
  @media print {
    .no-print { display: none !important; }
    body { margin: 0; }
    h1,h2 { page-break-after: avoid; }
    p,li { orphans:3; widows:3; }
  }
  * { box-sizing: border-box; }
  body { font-family: Georgia,'Times New Roman',serif; max-width:820px; margin:0 auto; padding:40px 32px; color:#1C1C2A; line-height:1.75; font-size:16px; }
  .no-print { background:#F5F5F7; border-bottom:1px solid #ddd; padding:10px 16px; margin:-40px -32px 40px; display:flex; align-items:center; gap:12px; font-family:-apple-system,sans-serif; font-size:13px; color:#555; }
  .no-print button { background:#E86F4D; color:#fff; border:none; border-radius:6px; padding:7px 16px; font-size:13px; font-weight:600; cursor:pointer; }
  .doc-header { border-bottom:3px solid #E86F4D; padding-bottom:20px; margin-bottom:36px; }
  .doc-header h1 { font-size:2em; margin:0 0 8px; color:#0F0F1A; letter-spacing:-0.02em; }
  .doc-meta { font-family:-apple-system,sans-serif; font-size:13px; color:#888; }
  h1 { font-size:1.7em; margin-top:1.8em; color:#0F0F1A; }
  h2 { font-size:1.35em; color:#E86F4D; margin-top:2em; border-left:3px solid #E86F4D; padding-left:12px; }
  h3 { font-size:1.1em; font-weight:700; margin-top:1.5em; }
  p { margin:0.9em 0; }
  ul { padding-left:24px; margin:0.8em 0; }
  li { margin:0.4em 0; }
  strong { font-weight:700; }
  em { font-style:italic; }
</style>
</head>
<body>
<div class="no-print">
  <span>Document généré par Lynaris •</span>
  <button onclick="window.print()">Télécharger en PDF</button>
  <span style="color:#aaa">Imprimer → Enregistrer en PDF dans la boîte de dialogue système</span>
</div>
<div class="doc-header">
  <h1>${title.replace(/</g, "&lt;")}</h1>
  <div class="doc-meta">Généré le ${now} — Lynaris Hub</div>
</div>
${htmlContent}
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
