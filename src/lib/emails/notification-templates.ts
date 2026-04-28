import type { EmailTemplate } from "./templates"
import { emailLayout, emailButton } from "./base-layout"

const C = {
  text:   "#FAFAFA",
  muted:  "rgba(250,250,250,0.6)",
  subtle: "rgba(250,250,250,0.4)",
  accent: "#E86F4D",
  border: "rgba(255,255,255,0.07)",
  card:   "rgba(255,255,255,0.05)",
  danger: "#F87171",
}

// ── 1. Résumé hebdomadaire ────────────────────────────────────────────────────

export function weeklySummaryEmail(userName: string): EmailTemplate {
  const firstName = userName.split(" ")[0] ?? userName

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Bonjour ${firstName}, voici ton résumé</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Voici ce que tes agents ont accompli cette semaine.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px;background:${C.card};border:1px solid ${C.border};border-radius:12px">
      <tr>
        <td style="text-align:center;padding:20px 16px;border-right:1px solid ${C.border}">
          <p style="margin:0;font-size:28px;font-weight:700;color:${C.accent};font-family:system-ui">—</p>
          <p style="margin:6px 0 0;font-size:12px;color:${C.subtle};font-family:system-ui">Agents actifs</p>
        </td>
        <td style="text-align:center;padding:20px 16px;border-right:1px solid ${C.border}">
          <p style="margin:0;font-size:28px;font-weight:700;color:#A78BFA;font-family:system-ui">—</p>
          <p style="margin:6px 0 0;font-size:12px;color:${C.subtle};font-family:system-ui">Conversations</p>
        </td>
        <td style="text-align:center;padding:20px 16px">
          <p style="margin:0;font-size:28px;font-weight:700;color:#22D3EE;font-family:system-ui">—</p>
          <p style="margin:6px 0 0;font-size:12px;color:${C.subtle};font-family:system-ui">Actions réalisées</p>
        </td>
      </tr>
    </table>

    <div style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.muted};font-family:system-ui">
        Les statistiques détaillées sont disponibles sur ton dashboard.
      </p>
    </div>

    ${emailButton("Voir le dashboard", "https://lynarisai.com/dashboard")}
  `

  return {
    subject: "Ton résumé Lynaris de la semaine",
    text: `Bonjour ${firstName},\n\nVoici ton résumé Lynaris de la semaine.\n\nhttps://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 2. Alerte erreur agent ────────────────────────────────────────────────────

export function agentErrorAlertEmail(agentName: string, errorMessage: string): EmailTemplate {
  const agentSlug = agentName.toLowerCase()

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(239,68,68,0.15);color:#F87171;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(239,68,68,0.3)">
          Alerte agent
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.danger};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Ton agent ${agentName} a rencontré une erreur</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Une intervention peut être nécessaire.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${C.danger};font-family:system-ui">Détail de l'erreur</p>
      <code style="font-family:'Courier New',monospace;font-size:13px;color:${C.danger};background:rgba(239,68,68,0.06);padding:10px 12px;border-radius:6px;display:block;word-break:break-all;line-height:1.6;border:1px solid rgba(239,68,68,0.15)">${errorMessage}</code>
    </div>

    ${emailButton(`Voir l'agent ${agentName}`, `https://lynarisai.com/dashboard/agents/${agentSlug}`, "danger")}
  `

  return {
    subject: `Erreur détectée — Agent ${agentName}`,
    text: `Alerte — Agent ${agentName}\n\n${errorMessage}\n\nhttps://lynarisai.com/dashboard/agents/${agentSlug}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 3. Nouvelle fonctionnalité ────────────────────────────────────────────────

export function newFeaturesEmail(featureTitle: string, featureDescription: string): EmailTemplate {
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(232,111,77,0.15);color:${C.accent};font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(232,111,77,0.3)">
          Nouvelle fonctionnalité
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">${featureTitle}</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">${featureDescription}</p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(232,111,77,0.08);border:1px solid rgba(232,111,77,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.muted};font-family:system-ui">
        Cette fonctionnalité est disponible dès maintenant dans ton dashboard.
      </p>
    </div>

    ${emailButton("Découvrir maintenant", "https://lynarisai.com/dashboard")}
  `

  return {
    subject: `Nouveauté Lynaris — ${featureTitle}`,
    text: `Nouvelle fonctionnalité : ${featureTitle}\n\n${featureDescription}\n\nhttps://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 4. Conseil d'utilisation ──────────────────────────────────────────────────

export function usageTipsEmail(tipTitle: string, tipContent: string): EmailTemplate {
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(124,58,237,0.15);color:#A78BFA;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(124,58,237,0.3)">
          Conseil du mois
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">${tipTitle}</h1>

    <div style="height:1px;background:${C.border};margin:0 0 24px"></div>

    <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0;font-size:15px;color:${C.muted};line-height:1.7;font-family:system-ui">${tipContent}</p>
    </div>

    ${emailButton("Aller sur le dashboard", "https://lynarisai.com/dashboard")}
  `

  return {
    subject: `Conseil Lynaris — ${tipTitle}`,
    text: `Conseil — ${tipTitle}\n\n${tipContent}\n\nhttps://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}
