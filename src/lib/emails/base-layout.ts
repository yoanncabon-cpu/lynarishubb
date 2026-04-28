/**
 * Layout de base pour tous les emails Lynaris.
 * Compatible Gmail, Outlook, Apple Mail — tables HTML, CSS inline uniquement.
 * Design : thème sombre du site (#0C0C0F, #111114, accent #E86F4D).
 */

// URL absolue prod du logo — Gmail refuse les data:URI et les URLs localhost.
// On force l'asset prod (cross-env : dev local enverra aussi un logo qui charge).
// Override possible via EMAIL_LOGO_URL si CDN dédié plus tard.
const LOGO_URL =
  process.env["EMAIL_LOGO_URL"] ?? "https://lynarisai.com/logo.png"

export function emailLayout(content: string, footer?: string): string {
  const resolvedFooter =
    footer ??
    `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
      <tr>
        <td style="vertical-align:middle;font-size:13px;color:rgba(250,250,250,0.45);font-family:system-ui,-apple-system,sans-serif">
          Pour toute question :&nbsp;
        </td>
        <td style="vertical-align:middle">
          <a href="mailto:support@lynarisai.com" style="color:#E86F4D;text-decoration:none;font-weight:500;font-size:13px;font-family:system-ui,-apple-system,sans-serif">support@lynarisai.com</a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle">
        <img src="${LOGO_URL}" width="18" height="18" alt="Lynaris" style="display:block;border:0;outline:none;text-decoration:none;border-radius:4px" />
      </td>
      <td style="vertical-align:middle;padding-left:8px">
        <span style="font-size:12px;color:rgba(250,250,250,0.3);font-family:system-ui,-apple-system,sans-serif">Lynaris.ai &copy; 2026 &middot; Tous droits r&eacute;serv&eacute;s.</span>
      </td>
    </tr></table>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Lynaris</title>
  <style type="text/css">
    :root { color-scheme: dark; }
    body, table, td, div, p, a { color-scheme: dark; -webkit-text-size-adjust: 100%; }
    body { background-color: #0C0C0F !important; }
    @media (prefers-color-scheme: light) {
      body { background-color: #0C0C0F !important; }
      .email-outer { background-color: #0C0C0F !important; }
      .email-card { background-color: #111114 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0C0C0F;font-family:system-ui,-apple-system,sans-serif;color-scheme:dark">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer" style="background:#0C0C0F;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

        <!-- Card principale -->
        <tr><td class="email-card" style="background:#111114;border:1px solid rgba(255,255,255,0.07);border-bottom:none;border-radius:16px 16px 0 0;padding:40px 40px 32px">

          <!-- Logo hébergé sur lynarisai.com -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
            <tr>
              <td style="vertical-align:middle">
                <a href="https://lynarisai.com" style="text-decoration:none;display:inline-block">
                  <img src="${LOGO_URL}" width="36" height="36" alt="Lynaris" style="display:block;border:0;outline:none;text-decoration:none;border-radius:8px" />
                </a>
              </td>
              <td style="vertical-align:middle;padding-left:10px">
                <a href="https://lynarisai.com" style="text-decoration:none">
                  <span style="font-size:18px;font-weight:700;color:#FAFAFA;letter-spacing:-0.02em;font-family:system-ui,-apple-system,sans-serif">Lynaris</span>
                </a>
              </td>
            </tr>
          </table>

          <!-- Séparateur après logo -->
          <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:28px"></div>

          <!-- Contenu dynamique -->
          ${content}

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-top:none;border-radius:0 0 16px 16px;padding:24px 40px">
          ${resolvedFooter}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Bouton CTA inline-compatible email */
export function emailButton(
  text: string,
  url: string,
  variant: "primary" | "danger" | "neutral" = "primary"
): string {
  const bg =
    variant === "danger"
      ? "#EF4444"
      : variant === "neutral"
        ? "rgba(255,255,255,0.1)"
        : "#E86F4D"
  const color = variant === "neutral" ? "#FAFAFA" : "#FFFFFF"
  return `<a href="${url}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;border-radius:10px;padding:14px 28px;font-size:15px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;margin:8px 0">${text}</a>`
}

/**
 * Ligne d'info dans un tableau de détails (ex: Montant, Période, Facture).
 * À utiliser entre balises <table>...</table>.
 */
export function emailInfoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(250,250,250,0.45);width:140px;vertical-align:top;font-family:system-ui,-apple-system,sans-serif">${label}</td>
    <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#FAFAFA;font-weight:500;font-family:system-ui,-apple-system,sans-serif">${value}</td>
  </tr>`
}

/** Badge de statut coloré */
export function emailBadge(
  text: string,
  color: "green" | "orange" | "red" | "blue" | "purple" = "orange"
): string {
  const map: Record<string, { bg: string; fg: string }> = {
    green:  { bg: "rgba(52,211,153,0.15)",  fg: "#34D399" },
    orange: { bg: "rgba(232,111,77,0.15)",  fg: "#E86F4D" },
    red:    { bg: "rgba(239,68,68,0.15)",   fg: "#F87171" },
    blue:   { bg: "rgba(59,130,246,0.15)",  fg: "#60A5FA" },
    purple: { bg: "rgba(124,58,237,0.15)",  fg: "#A78BFA" },
  }
  const c = map[color] ?? map.orange
  return `<span style="display:inline-block;background:${c!.bg};color:${c!.fg};font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui,-apple-system,sans-serif;border:1px solid ${c!.fg}30">${text}</span>`
}
