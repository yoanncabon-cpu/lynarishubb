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

  // L'UUID est la protection — accessible sans session (document partageable).
  // On cherche par ID uniquement (pas d'orgId requis pour la vue).
  const orgId = await getOrProvisionOrgId().catch(() => ANON_ORG_ID)

  const [row] = await db
    .select({ title: contents.title, body: contents.body, createdAt: contents.createdAt })
    .from(contents)
    .where(
      orgId !== ANON_ORG_ID
        ? and(eq(contents.id, id), eq(contents.orgId, orgId))
        : eq(contents.id, id)  // Si pas auth → cherche par UUID seul
    )
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

  const appUrl = (process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynaris.pro").replace(/\/$/, "")

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title.replace(/</g, "&lt;")} — Lynaris</title>
<!-- Favicon Lynaris -->
<link rel="icon" type="image/svg+xml" href="${appUrl}/favicon.svg">
<link rel="shortcut icon" href="${appUrl}/favicon.ico">
<style>
  @media print {
    .no-print { display: none !important; }
    body { margin: 0; padding: 20px 32px; }
    h1,h2 { page-break-after: avoid; }
    p,li { orphans:3; widows:3; }
    img { max-width:100%; page-break-inside: avoid; }
  }
  * { box-sizing: border-box; }
  body { font-family: Georgia,'Times New Roman',serif; max-width:820px; margin:0 auto; padding:0; color:#1C1C2A; line-height:1.75; font-size:16px; }
  .no-print {
    background:#0F0F1A; border-bottom:2px solid rgba(232,111,77,0.3);
    padding:12px 24px; display:flex; align-items:center; gap:16px;
    font-family:-apple-system,sans-serif; font-size:13px; color:rgba(250,250,250,0.65);
    position:sticky; top:0; z-index:100;
  }
  .lynaris-logo { display:flex; align-items:center; gap:8px; text-decoration:none; }
  .lynaris-logo svg { width:24px; height:24px; flex-shrink:0; }
  .lynaris-logo span { font-size:15px; font-weight:700; color:#FAFAFA; letter-spacing:-0.03em; }
  .no-print .divider { width:1px; height:18px; background:rgba(255,255,255,0.15); }
  .btn-pdf {
    display:inline-flex; align-items:center; gap:6px;
    background:linear-gradient(135deg,#E86F4D 0%,#C8522F 100%);
    color:#fff; border:none; border-radius:8px; padding:8px 18px;
    font-size:13px; font-weight:600; cursor:pointer;
    box-shadow:0 4px 14px rgba(232,111,77,0.35);
    transition:opacity 150ms;
  }
  .btn-pdf:hover { opacity:0.88; }
  .print-hint { font-size:11px; color:rgba(250,250,250,0.4); }
  .doc-body { padding:40px 32px; }
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
  img { max-width:100%; border-radius:8px; margin:12px 0; display:block; }
</style>
</head>
<body>
<!-- Barre Lynaris -->
<div class="no-print">
  <a class="lynaris-logo" href="${appUrl}" target="_blank" rel="noopener">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#F5922F"/>
          <stop offset="100%" stop-color="#D4530A"/>
        </linearGradient>
      </defs>
      <polygon points="0,0 24,0 40,18 40,65 100,65 100,100 0,100" fill="url(#lg)"/>
      <polygon points="58,0 100,0 100,42" fill="url(#lg)"/>
    </svg>
    <span>Lynaris</span>
  </a>
  <div class="divider"></div>
  <button class="btn-pdf" onclick="window.print()">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Enregistrer en PDF
  </button>
  <span class="print-hint">Dans la boîte de dialogue → choisir "Enregistrer en PDF"</span>
</div>

<!-- Corps du document -->
<div class="doc-body">
  <div class="doc-header">
    <h1>${title.replace(/</g, "&lt;")}</h1>
    <div class="doc-meta">Généré le ${now} par Lynaris</div>
  </div>
  ${htmlContent}
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
