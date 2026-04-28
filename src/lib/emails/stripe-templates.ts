import type { EmailTemplate } from "./templates"
import { emailLayout, emailButton, emailInfoRow } from "./base-layout"

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

function greeting(name?: string): string {
  if (!name) return "Bonjour,"
  const first = name.split(" ")[0] ?? name
  return `Bonjour ${first},`
}

function formatAmount(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
}

// ── 1. paymentSuccess ─────────────────────────────────────────────────────────

export interface PaymentSuccessParams {
  customerEmail: string
  customerName?: string
  amount: number
  currency: string
  planName: string
  invoiceId: string
  invoiceUrl?: string
  periodStart: string
  periodEnd: string
}

export function paymentSuccess(params: PaymentSuccessParams): EmailTemplate {
  const { customerName, amount, planName, invoiceId, invoiceUrl, periodStart, periodEnd } = params
  const amountFmt = formatAmount(amount)
  const invoiceBtn = invoiceUrl ? emailButton("Télécharger la facture", invoiceUrl, "neutral") : ""

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(52,211,153,0.15);color:#34D399;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(52,211,153,0.3)">
          Paiement confirmé ✓
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Paiement confirmé</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton paiement pour le plan <strong style="color:${C.text}">${planName}</strong> a bien été traité.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Montant TTC", `<span style="font-size:20px;font-weight:700;color:${C.accent}">${amountFmt}</span>`)}
      ${emailInfoRow("Période", `${periodStart} → ${periodEnd}`)}
      ${emailInfoRow("N° facture", `<span style="color:${C.subtle};font-size:13px">${invoiceId}</span>`)}
    </table>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:12px">${invoiceBtn}</td>
      <td>${emailButton("Accéder au dashboard", "https://lynarisai.com/dashboard")}</td>
    </tr></table>
  `

  return {
    subject: `Paiement confirmé — Plan ${planName} — ${amountFmt}`,
    text: `${greeting(customerName)}\n\nPaiement confirmé pour le plan ${planName} : ${amountFmt}.\nPériode : du ${periodStart} au ${periodEnd}\nN° facture : ${invoiceId}${invoiceUrl ? `\nFacture PDF : ${invoiceUrl}` : ""}\n\nhttps://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 2. paymentFailed ──────────────────────────────────────────────────────────

export interface PaymentFailedParams {
  customerEmail: string
  customerName?: string
  amount: number
  planName: string
  retryDate?: string
  updatePaymentUrl: string
}

export function paymentFailed(params: PaymentFailedParams): EmailTemplate {
  const { customerName, amount, planName, retryDate, updatePaymentUrl } = params
  const amountFmt = formatAmount(amount)
  const retryMsg = retryDate
    ? `Une nouvelle tentative sera effectuée ${retryDate}.`
    : "Sans action, ton accès sera suspendu prochainement."

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(239,68,68,0.15);color:#F87171;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(239,68,68,0.3)">
          Action requise
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.danger};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Paiement échoué</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton paiement de <strong style="color:${C.text}">${amountFmt}</strong> pour le plan <strong style="color:${C.text}">${planName}</strong> n'a pas pu être traité.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.danger};font-family:system-ui">${retryMsg}</p>
    </div>

    ${emailButton("Mettre à jour ma carte", updatePaymentUrl, "danger")}
  `

  return {
    subject: `Action requise — Échec du paiement ${planName} — ${amountFmt}`,
    text: `${greeting(customerName)}\n\nTon paiement de ${amountFmt} pour le plan ${planName} n'a pas pu être traité.\n\n${retryDate ? `Nouvelle tentative ${retryDate}.` : "Sans action, ton accès sera suspendu prochainement."}\n\nMets à jour ta carte : ${updatePaymentUrl}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 3. subscriptionRenewed ────────────────────────────────────────────────────

export interface SubscriptionRenewedParams {
  customerEmail: string
  customerName?: string
  amount: number
  planName: string
  nextRenewal: string
  invoiceUrl?: string
}

export function subscriptionRenewed(params: SubscriptionRenewedParams): EmailTemplate {
  const { customerName, amount, planName, nextRenewal, invoiceUrl } = params
  const amountFmt = formatAmount(amount)
  const invoiceBtn = invoiceUrl ? emailButton("Voir la facture", invoiceUrl, "neutral") : ""

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td>
        <span style="display:inline-block;background:rgba(52,211,153,0.15);color:#34D399;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;font-family:system-ui;border:1px solid rgba(52,211,153,0.3)">
          Renouvellement confirmé ✓
        </span>
      </td></tr>
    </table>

    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Abonnement renouvelé</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton abonnement <strong style="color:${C.text}">${planName}</strong> a été renouvelé avec succès.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Montant débité", `<span style="font-size:20px;font-weight:700;color:${C.accent}">${amountFmt}</span>`)}
      ${emailInfoRow("Prochaine échéance", `<strong style="color:${C.text}">${nextRenewal}</strong>`)}
    </table>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:12px">${invoiceBtn}</td>
      <td>${emailButton("Accéder au dashboard", "https://lynarisai.com/dashboard")}</td>
    </tr></table>
  `

  return {
    subject: `Renouvellement confirmé — Plan ${planName}`,
    text: `${greeting(customerName)}\n\nTon abonnement ${planName} a été renouvelé : ${amountFmt} débité.\nProchaine échéance : ${nextRenewal}${invoiceUrl ? `\nFacture : ${invoiceUrl}` : ""}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 4. subscriptionCancelled ──────────────────────────────────────────────────

export interface SubscriptionCancelledParams {
  customerEmail: string
  customerName?: string
  planName: string
  accessUntil: string
  reactivateUrl: string
}

export function subscriptionCancelled(params: SubscriptionCancelledParams): EmailTemplate {
  const { customerName, planName, accessUntil, reactivateUrl } = params

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Abonnement annulé</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton abonnement <strong style="color:${C.text}">${planName}</strong> a été annulé.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.muted};font-family:system-ui">
        Tu conserves l'accès à toutes les fonctionnalités jusqu'au
        <strong style="color:${C.text}">${accessUntil}</strong>.
        Après cette date, ton compte passera en mode lecture seule.
      </p>
    </div>

    ${emailButton("Réactiver mon abonnement", reactivateUrl)}
  `

  return {
    subject: `Ton abonnement ${planName} a été annulé`,
    text: `${greeting(customerName)}\n\nTon abonnement ${planName} a été annulé.\nAccès conservé jusqu'au ${accessUntil}.\n\nRéactiver : ${reactivateUrl}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 5. planChanged ────────────────────────────────────────────────────────────

export interface PlanChangedParams {
  customerEmail: string
  customerName?: string
  oldPlan: string
  newPlan: string
  newAmount: number
  effectiveDate: string
}

export function planChanged(params: PlanChangedParams): EmailTemplate {
  const { customerName, oldPlan, newPlan, newAmount, effectiveDate } = params
  const amountFmt = formatAmount(newAmount)

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Plan mis à jour</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton plan a été modifié avec succès.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      <tr>
        <td style="text-align:center;padding:20px 16px;background:${C.card};border-radius:10px 0 0 10px;border:1px solid ${C.border}">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.subtle};font-family:system-ui">Ancien plan</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:${C.subtle};font-family:system-ui">${oldPlan}</p>
        </td>
        <td style="text-align:center;width:48px;font-size:20px;color:${C.accent};font-family:system-ui">→</td>
        <td style="text-align:center;padding:20px 16px;background:rgba(232,111,77,0.08);border-radius:0 10px 10px 0;border:1px solid rgba(232,111,77,0.2)">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.accent};font-family:system-ui">Nouveau plan</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:${C.accent};font-family:system-ui">${newPlan}</p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px">
      ${emailInfoRow("Nouveau montant", `<strong style="color:${C.accent}">${amountFmt} / mois</strong>`)}
      ${emailInfoRow("Effectif le", `<strong style="color:${C.text}">${effectiveDate}</strong>`)}
    </table>

    ${emailButton("Accéder au dashboard", "https://lynarisai.com/dashboard")}
  `

  return {
    subject: `Ton plan a été mis à jour — ${oldPlan} → ${newPlan}`,
    text: `${greeting(customerName)}\n\nTon plan : ${oldPlan} → ${newPlan}.\nNouveau montant : ${amountFmt}/mois\nEffectif le : ${effectiveDate}\n\nhttps://lynarisai.com/dashboard\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}

// ── 6. trialEnding ────────────────────────────────────────────────────────────

export interface TrialEndingParams {
  customerEmail: string
  customerName?: string
  trialEndDate: string
  upgradeUrl: string
}

export function trialEnding(params: TrialEndingParams): EmailTemplate {
  const { customerName, trialEndDate, upgradeUrl } = params

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 10px;font-family:system-ui;letter-spacing:-0.02em">Ton essai se termine bientôt</h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting(customerName)} Ton essai gratuit se termine <strong style="color:${C.accent}">${trialEndDate}</strong>.
    </p>

    <div style="height:1px;background:${C.border};margin-bottom:24px"></div>

    <div style="background:rgba(232,111,77,0.08);border:1px solid rgba(232,111,77,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.muted};font-family:system-ui">
        Choisis un plan maintenant pour conserver tes agents, intégrations et configurations.
      </p>
    </div>

    ${emailButton("Choisir un plan", upgradeUrl)}
  `

  return {
    subject: `Ton essai Lynaris se termine bientôt — ${trialEndDate}`,
    text: `${greeting(customerName)}\n\nTon essai gratuit se termine ${trialEndDate}.\n\nChoisir un plan : ${upgradeUrl}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}
