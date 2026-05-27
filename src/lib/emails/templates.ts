import { emailLayout, emailButton, emailInfoRow } from "./base-layout"

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Couleurs dark mode — alignées avec le site
const C = {
  text:    "#FAFAFA",
  muted:   "rgba(250,250,250,0.6)",
  subtle:  "rgba(250,250,250,0.4)",
  accent:  "#E86F4D",
  border:  "rgba(255,255,255,0.07)",
  card:    "rgba(255,255,255,0.05)",
  danger:  "#F87171",
  success: "#34D399",
}

// ── 1. welcomeEmail ───────────────────────────────────────────────────────────

export function welcomeEmail(params: {
  name: string
  trialEndsAt: string
}): EmailTemplate {
  const { name, trialEndsAt } = params
  const firstName = name.split(" ")[0] ?? name

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:-0.02em">Bienvenue sur Lynaris, ${firstName}&nbsp;!</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif">
      Ton essai gratuit est actif jusqu'au <strong style="color:${C.accent}">${trialEndsAt}</strong>.
      Suis ces 3&nbsp;étapes pour démarrer.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:28px"></div>

    <!-- Étapes -->
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px">
      <tr>
        <td style="vertical-align:top;padding-bottom:20px">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:top">
              <div style="width:28px;height:28px;background:#E86F4D;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#FFFFFF;font-family:system-ui">1</div>
            </td>
            <td style="vertical-align:top;padding-left:14px">
              <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:${C.text};font-family:system-ui">Connecte Google Calendar</p>
              <p style="margin:4px 0 0;font-size:13px;color:${C.muted};font-family:system-ui">Pour activer Marine, ton agent téléphonique.</p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align:top;padding-bottom:20px">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:top">
              <div style="width:28px;height:28px;background:#E86F4D;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#FFFFFF;font-family:system-ui">2</div>
            </td>
            <td style="vertical-align:top;padding-left:14px">
              <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:${C.text};font-family:system-ui">Active tes premiers agents</p>
              <p style="margin:4px 0 0;font-size:13px;color:${C.muted};font-family:system-ui">Marine, Charles ou Elio selon ton activité.</p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align:top">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:top">
              <div style="width:28px;height:28px;background:#E86F4D;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#FFFFFF;font-family:system-ui">3</div>
            </td>
            <td style="vertical-align:top;padding-left:14px">
              <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:${C.text};font-family:system-ui">Utilise Charles via WhatsApp</p>
              <p style="margin:4px 0 0;font-size:13px;color:${C.muted};font-family:system-ui">Donne-lui une tâche en langage naturel et il orchestre le reste.</p>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>

    ${emailButton("Accéder au dashboard", "https://lynarisai.com/dashboard")}
  `

  return {
    subject: "Bienvenue sur Lynaris ! Ton essai de 14 jours démarre maintenant",
    text: `Bonjour ${firstName},\n\nTon essai gratuit Lynaris est actif jusqu'au ${trialEndsAt}.\n\n1. Connecte Google Calendar pour activer Marine\n2. Active tes premiers agents\n3. Utilise Charles via WhatsApp\n\nAccéder au dashboard : https://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 2. trialEndingEmail ───────────────────────────────────────────────────────

export function trialEndingEmail(params: {
  name: string
  daysLeft: number
  starterUrl: string
}): EmailTemplate {
  const { name, daysLeft, starterUrl } = params
  const firstName = name.split(" ")[0] ?? name
  const plural = daysLeft > 1 ? "s" : ""

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Plus que ${daysLeft}&nbsp;jour${plural}, ${firstName}</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Ton essai gratuit expire bientôt. Passe à un plan payant pour ne pas perdre tes agents et intégrations.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(232,111,77,0.08);border:1px solid rgba(232,111,77,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${C.text};font-family:system-ui">Plan Essentiel — 197&nbsp;€/mois</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">
        <tr><td style="padding:3px 0;font-size:14px;color:${C.muted};font-family:system-ui">&bull;&nbsp; 3 agents actifs au choix</td></tr>
        <tr><td style="padding:3px 0;font-size:14px;color:${C.muted};font-family:system-ui">&bull;&nbsp; 500 actions/mois</td></tr>
        <tr><td style="padding:3px 0;font-size:14px;color:${C.muted};font-family:system-ui">&bull;&nbsp; 100 minutes voix</td></tr>
        <tr><td style="padding:3px 0;font-size:14px;color:${C.muted};font-family:system-ui">&bull;&nbsp; Support email prioritaire</td></tr>
      </table>
    </div>

    ${emailButton("Choisir mon plan", starterUrl)}
  `

  return {
    subject: `Votre essai Lynaris expire dans ${daysLeft} jour${plural}`,
    text: `Bonjour ${firstName},\n\nTon essai Lynaris expire dans ${daysLeft} jour${plural}.\n\nPasse au plan Essentiel à 197 €/mois.\n\n${starterUrl}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 3. invoiceEmail ───────────────────────────────────────────────────────────

export function invoiceEmail(params: {
  name: string
  amount: string
  period: string
  invoiceUrl: string
}): EmailTemplate {
  const { name, amount, period, invoiceUrl } = params
  const firstName = name.split(" ")[0] ?? name

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Paiement confirmé ✓</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Bonjour ${firstName}, ta facture Lynaris pour la période <strong style="color:${C.text}">${period}</strong> est disponible.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      ${emailInfoRow("Période", period)}
      ${emailInfoRow("Montant TTC", `<span style="font-size:20px;font-weight:700;color:${C.accent}">${amount}</span>`)}
    </table>

    ${emailButton("Télécharger la facture", invoiceUrl)}
  `

  return {
    subject: `Facture Lynaris — ${period}`,
    text: `Bonjour ${firstName},\n\nTa facture Lynaris pour ${period} est disponible : ${amount}.\n\nConsulter : ${invoiceUrl}\n\nMerci.\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 4. paymentFailedEmail ─────────────────────────────────────────────────────

export function paymentFailedEmail(params: {
  name: string
  amount: string
  retryUrl: string
}): EmailTemplate {
  const { name, amount, retryUrl } = params
  const firstName = name.split(" ")[0] ?? name

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.danger};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Action requise — Échec de paiement</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      Bonjour ${firstName}, nous n'avons pas pu débiter <strong style="color:${C.text}">${amount}</strong> sur ta carte enregistrée.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.danger};font-family:system-ui">
        Sans action de ta part, ton abonnement sera suspendu dans <strong>7&nbsp;jours</strong>.
      </p>
    </div>

    ${emailButton("Mettre à jour ma carte", retryUrl, "danger")}
  `

  return {
    subject: "Échec de paiement Lynaris — action requise",
    text: `Bonjour ${firstName},\n\nNous n'avons pas pu débiter ${amount}.\n\nMets à jour ta carte : ${retryUrl}\n\nSans action, suspension dans 7 jours.\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 5. teamInviteEmail ────────────────────────────────────────────────────────

export function teamInviteEmail(params: {
  orgName: string
  inviterName: string
  role: "admin" | "member"
  message?: string
  signupUrl: string
}): EmailTemplate {
  const { orgName, inviterName, role, message, signupUrl } = params
  const roleLabel = role === "admin" ? "Admin" : "Membre"

  const messageBlock = message
    ? `<div style="background:${C.card};border-left:3px solid ${C.accent};border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:${C.muted};font-style:italic;font-family:system-ui">&laquo;&nbsp;${message}&nbsp;&raquo;</p>
       </div>`
    : ""

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Tu es invité(e) à rejoindre ${orgName}</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      <strong style="color:${C.text}">${inviterName}</strong> t'invite à rejoindre
      <strong style="color:${C.text}">${orgName}</strong> sur Lynaris en tant que
      <strong style="color:${C.accent}">${roleLabel}</strong>.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    ${messageBlock}

    ${emailButton("Accepter l'invitation", signupUrl)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.subtle};font-family:system-ui">Ce lien expire dans 7&nbsp;jours.</p>
  `

  return {
    subject: `Tu es invité(e) à rejoindre ${orgName} sur Lynaris`,
    text: `Bonjour,\n\n${inviterName} t'invite à rejoindre ${orgName} sur Lynaris en tant que ${roleLabel}.\n\nAccepter : ${signupUrl}\n\nCe lien expire dans 7 jours.\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 6. teamRemovalEmail ───────────────────────────────────────────────────────

export function teamRemovalEmail(params: {
  memberName: string
  orgName: string
  removedByName: string
}): EmailTemplate {
  const { memberName, orgName, removedByName } = params
  const firstName = memberName.split(" ")[0] ?? memberName

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:-0.02em">
      Ton accès à ${orgName} a été retiré
    </h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif">
      Bonjour <strong style="color:${C.text}">${firstName}</strong>,<br><br>
      <strong style="color:${C.text}">${removedByName}</strong> a retiré ton compte de l'espace de travail
      <strong style="color:${C.text}">${orgName}</strong> sur Lynaris.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:${C.card};border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.6;font-family:system-ui">
        Tu n'as plus accès aux agents, conversations et paramètres de cet espace.<br>
        Si tu penses qu'il s'agit d'une erreur, contacte directement
        <strong style="color:${C.text}">${removedByName}</strong> ou l'administrateur de l'espace.
      </p>
    </div>

    <p style="font-size:13px;color:${C.subtle};margin:0;font-family:system-ui">L'équipe Lynaris</p>
  `

  return {
    subject: `Ton accès à ${orgName} sur Lynaris a été retiré`,
    text: `Bonjour ${firstName},\n\n${removedByName} a retiré ton compte de l'espace de travail ${orgName} sur Lynaris.\n\nTu n'as plus accès aux agents, conversations et paramètres de cet espace.\n\nSi tu penses qu'il s'agit d'une erreur, contacte ${removedByName}.\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}
