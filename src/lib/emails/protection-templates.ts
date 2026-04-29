// ─────────────────────────────────────────────────────────────────────────────
// Email templates — cost-protection
// ─────────────────────────────────────────────────────────────────────────────
//
// Templates émis par le service cost-protection sur chaque palier franchi :
// - 70%  : adminCostAlert70   (interne admin)
// - 90%  : adminCostAlert90   (interne admin) + clientUpsellAt90 (vers client)
// - 100% : adminCostAlert100  (interne admin)
// - 130% : adminCostAlert130  (interne admin, urgence)
//
// Tous les templates utilisent emailLayout (cohérence design system).

import type { EmailTemplate } from "./templates"
import { emailLayout, emailButton, emailInfoRow } from "./base-layout"
import { PLANS, type PlanId } from "@/lib/pricing/plans"

const C = {
  text:    "#FAFAFA",
  muted:   "rgba(250,250,250,0.6)",
  subtle:  "rgba(250,250,250,0.4)",
  accent:  "#E86F4D",
  border:  "rgba(255,255,255,0.07)",
  card:    "rgba(255,255,255,0.05)",
  amber:   "#F59E0B",
  orange:  "#F97316",
  red:     "#EF4444",
  redDeep: "#DC2626",
  green:   "#10B981",
}

// ─── Types communs ──────────────────────────────────────────────────────────

export interface AdminAlertParams {
  readonly orgName: string
  readonly orgId: string
  readonly planId: PlanId
  readonly currentCostEuros: number
  readonly budgetEuros: number
  readonly ratio: number
  readonly adminUrl?: string
}

export interface ClientUpsellParams {
  readonly customerName?: string
  readonly customerEmail: string
  readonly currentPlanId: PlanId
  readonly suggestedPlanId: PlanId
  readonly upgradeUrl: string
}

// ─── Helper formatage ────────────────────────────────────────────────────────

function fmtEuros(n: number): string {
  return `${n.toFixed(2)} €`
}

function fmtPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

// ─── 1. adminCostAlert70 — état nominal, pas d'urgence ──────────────────────

export function adminCostAlert70(params: AdminAlertParams): EmailTemplate {
  const planName = PLANS[params.planId].name
  const adminLink = params.adminUrl ?? "https://lynarisai.com/dashboard/admin/protection"

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(245,158,11,0.15);color:${C.amber};font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;font-family:system-ui;border:1px solid rgba(245,158,11,0.30);text-transform:uppercase;letter-spacing:0.06em">
        🟡 70 % — Notification admin
      </span>
    </td></tr></table>

    <h1 style="font-size:22px;font-weight:700;color:${C.text};margin:0 0 8px;font-family:system-ui;letter-spacing:-0.02em">
      Org ${params.orgName} à 70 % de son budget
    </h1>
    <p style="font-size:14px;color:${C.muted};margin:0 0 20px;font-family:system-ui">
      État nominal — aucune action requise. Surveillance pour détecter la
      tendance.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Conso ce mois", `<strong style="color:${C.amber}">${fmtEuros(params.currentCostEuros)}</strong>`)}
      ${emailInfoRow("Budget", fmtEuros(params.budgetEuros))}
      ${emailInfoRow("Ratio", `<strong style="color:${C.amber}">${fmtPct(params.ratio)}</strong>`)}
    </table>

    ${emailButton("Voir le détail admin", adminLink)}
  `

  return {
    subject: `🟡 [${params.orgName}] 70% du budget ${planName}`,
    text: `${params.orgName} (${planName}) atteint 70% de son budget : ${fmtEuros(params.currentCostEuros)} / ${fmtEuros(params.budgetEuros)}.\n\nDashboard : ${adminLink}`,
    html: emailLayout(content),
  }
}

// ─── 2. adminCostAlert90 — vigilance ────────────────────────────────────────

export function adminCostAlert90(params: AdminAlertParams): EmailTemplate {
  const planName = PLANS[params.planId].name
  const adminLink = params.adminUrl ?? "https://lynarisai.com/dashboard/admin/protection"

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(249,115,22,0.15);color:${C.orange};font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;font-family:system-ui;border:1px solid rgba(249,115,22,0.30);text-transform:uppercase;letter-spacing:0.06em">
        🟠 90 % — Vigilance
      </span>
    </td></tr></table>

    <h1 style="font-size:22px;font-weight:700;color:${C.text};margin:0 0 8px;font-family:system-ui;letter-spacing:-0.02em">
      ${params.orgName} approche de la limite de marge
    </h1>
    <p style="font-size:14px;color:${C.muted};margin:0 0 20px;font-family:system-ui">
      90 % du budget consommé. Un email d'upsell a été envoyé au client en
      parallèle (template clientUpsellAt90).
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Conso ce mois", `<strong style="color:${C.orange}">${fmtEuros(params.currentCostEuros)}</strong>`)}
      ${emailInfoRow("Budget", fmtEuros(params.budgetEuros))}
      ${emailInfoRow("Ratio", `<strong style="color:${C.orange}">${fmtPct(params.ratio)}</strong>`)}
    </table>

    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.20);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:${C.muted};font-family:system-ui;line-height:1.6">
        💡 <strong style="color:${C.orange}">Recommandation</strong> : si la
        conso continue à ce rythme, l'org dépassera le budget avant la fin du
        mois. Suivre l'évolution sur 24-48 h, contacter le client si besoin.
      </p>
    </div>

    ${emailButton("Voir le détail admin", adminLink)}
  `

  return {
    subject: `🟠 [${params.orgName}] 90% du budget ${planName}`,
    text: `${params.orgName} (${planName}) à 90% du budget : ${fmtEuros(params.currentCostEuros)} / ${fmtEuros(params.budgetEuros)}.\nClient notifié pour upsell.\n\nDashboard : ${adminLink}`,
    html: emailLayout(content),
  }
}

// ─── 3. adminCostAlert100 — limite atteinte ─────────────────────────────────

export function adminCostAlert100(params: AdminAlertParams): EmailTemplate {
  const planName = PLANS[params.planId].name
  const adminLink = params.adminUrl ?? "https://lynarisai.com/dashboard/admin/protection"

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(239,68,68,0.15);color:${C.red};font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;font-family:system-ui;border:1px solid rgba(239,68,68,0.30);text-transform:uppercase;letter-spacing:0.06em">
        🔴 100 % — Limite atteinte
      </span>
    </td></tr></table>

    <h1 style="font-size:22px;font-weight:700;color:${C.text};margin:0 0 8px;font-family:system-ui;letter-spacing:-0.02em">
      Marge cible dépassée pour ${params.orgName}
    </h1>
    <p style="font-size:14px;color:${C.muted};margin:0 0 20px;font-family:system-ui">
      Le budget mensuel est atteint — la marge n'est plus garantie sur cette
      org. En mode ALERTE, aucune bascule auto. En mode ACTIF, les modèles
      passeraient en économie.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Conso ce mois", `<strong style="color:${C.red}">${fmtEuros(params.currentCostEuros)}</strong>`)}
      ${emailInfoRow("Budget", fmtEuros(params.budgetEuros))}
      ${emailInfoRow("Dépassement", `<strong style="color:${C.red}">+${fmtEuros(params.currentCostEuros - params.budgetEuros)}</strong>`)}
    </table>

    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.20);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:${C.muted};font-family:system-ui;line-height:1.6">
        ⚠️ <strong style="color:${C.red}">Action recommandée</strong> :
        contacter le client pour proposer un upgrade. Si la conso continue,
        on basculera en mode économie / hard cap (selon mode global).
      </p>
    </div>

    ${emailButton("Voir le détail admin", adminLink, "danger")}
  `

  return {
    subject: `🔴 [${params.orgName}] 100% — limite de marge atteinte`,
    text: `URGENT : ${params.orgName} (${planName}) à 100% du budget.\n${fmtEuros(params.currentCostEuros)} / ${fmtEuros(params.budgetEuros)}.\nDépassement : +${fmtEuros(params.currentCostEuros - params.budgetEuros)}.\n\nContacter client pour upgrade.\n${adminLink}`,
    html: emailLayout(content),
  }
}

// ─── 4. adminCostAlert130 — alerte critique ──────────────────────────────────

export function adminCostAlert130(params: AdminAlertParams): EmailTemplate {
  const planName = PLANS[params.planId].name
  const adminLink = params.adminUrl ?? "https://lynarisai.com/dashboard/admin/protection"
  const margin = 1 - params.currentCostEuros / (params.budgetEuros / 0.30)

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(220,38,38,0.20);color:${C.redDeep};font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;font-family:system-ui;border:1px solid rgba(220,38,38,0.40);text-transform:uppercase;letter-spacing:0.06em">
        🚨 130 % — Critique
      </span>
    </td></tr></table>

    <h1 style="font-size:22px;font-weight:700;color:${C.redDeep};margin:0 0 8px;font-family:system-ui;letter-spacing:-0.02em">
      Marge effondrée pour ${params.orgName}
    </h1>
    <p style="font-size:14px;color:${C.muted};margin:0 0 20px;font-family:system-ui">
      Dépassement critique de 30 % au-dessus du budget. La marge brute sur
      cette org est tombée à <strong style="color:${C.red}">${(margin * 100).toFixed(1)} %</strong>
      (cible : 70 %). En mode ACTIF, hard cap activé sur les actions non critiques.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px">
      ${emailInfoRow("Plan", planName)}
      ${emailInfoRow("Conso ce mois", `<strong style="color:${C.redDeep}">${fmtEuros(params.currentCostEuros)}</strong>`)}
      ${emailInfoRow("Budget", fmtEuros(params.budgetEuros))}
      ${emailInfoRow("Ratio", `<strong style="color:${C.redDeep}">${fmtPct(params.ratio)}</strong>`)}
      ${emailInfoRow("Marge actuelle", `<strong style="color:${C.red}">${(margin * 100).toFixed(1)} %</strong>`)}
    </table>

    <div style="background:rgba(220,38,38,0.10);border:1px solid rgba(220,38,38,0.30);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:${C.text};font-family:system-ui;font-weight:600;line-height:1.6">
        🚨 Action immédiate
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:${C.muted};font-family:system-ui;line-height:1.6">
        Contacter le client sous 24 h pour proposer un upgrade vers
        ${params.planId === "pro" ? "Business" : params.planId === "business" ? "Sur-mesure" : "le plan supérieur"}.
        Marine reste disponible (action critique). Les autres actions
        non critiques sont bloquées en mode ACTIF.
      </p>
    </div>

    ${emailButton("Voir le détail admin", adminLink, "danger")}
  `

  return {
    subject: `🚨 [${params.orgName}] CRITIQUE — 130% du budget, marge effondrée`,
    text: `CRITIQUE : ${params.orgName} (${planName}) à ${fmtPct(params.ratio)} du budget.\n${fmtEuros(params.currentCostEuros)} / ${fmtEuros(params.budgetEuros)}.\nMarge : ${(margin * 100).toFixed(1)}% (cible 70%).\n\nAction immédiate : contacter pour upgrade.\n${adminLink}`,
    html: emailLayout(content),
  }
}

// ─── 5. clientUpsellAt90 — invitation à upgrade ─────────────────────────────

export function clientUpsellAt90(params: ClientUpsellParams): EmailTemplate {
  const currentPlan = PLANS[params.currentPlanId]
  const suggestedPlan = PLANS[params.suggestedPlanId]
  const greeting = params.customerName
    ? `Bonjour ${params.customerName.split(" ")[0]}`
    : "Bonjour"

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:${C.text};margin:0 0 8px;font-family:system-ui;letter-spacing:-0.02em">
      Tu utilises beaucoup tes agents Lynaris ! 🚀
    </h1>
    <p style="font-size:15px;color:${C.muted};line-height:1.6;margin:0 0 24px;font-family:system-ui">
      ${greeting}, tu approches de la limite de ton plan
      <strong style="color:${C.text}">${currentPlan.name}</strong>. Pour
      continuer à profiter de tes agents sans interruption, le plan
      <strong style="color:${C.accent}">${suggestedPlan.name}</strong> est
      probablement plus adapté à ton usage.
    </p>

    <div style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px;margin-bottom:24px">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
        <tr>
          <td style="text-align:center;padding:8px;border-right:1px solid ${C.border}">
            <p style="margin:0 0 4px;font-size:11px;color:${C.subtle};text-transform:uppercase;letter-spacing:0.08em;font-family:system-ui">
              Plan actuel
            </p>
            <p style="margin:0;font-size:18px;font-weight:700;color:${C.subtle};font-family:system-ui">
              ${currentPlan.name}
            </p>
          </td>
          <td style="text-align:center;padding:8px">
            <p style="margin:0 0 4px;font-size:11px;color:${C.accent};text-transform:uppercase;letter-spacing:0.08em;font-family:system-ui">
              Recommandé
            </p>
            <p style="margin:0;font-size:18px;font-weight:700;color:${C.accent};font-family:system-ui">
              ${suggestedPlan.name}
            </p>
          </td>
        </tr>
      </table>
    </div>

    ${emailButton(`Découvrir ${suggestedPlan.name}`, params.upgradeUrl)}

    <p style="font-size:12px;color:${C.subtle};margin:20px 0 0;font-family:system-ui;line-height:1.5">
      Pas pressé ? Tes agents continuent de fonctionner normalement
      jusqu'à la fin de la période. Tu peux changer de plan à tout moment
      depuis ton dashboard.
    </p>
  `

  return {
    subject: `Tu utilises beaucoup Lynaris — passe à ${suggestedPlan.name} pour économiser`,
    text: `${greeting},\n\nTu approches de la limite de ${currentPlan.name}. Le plan ${suggestedPlan.name} serait plus adapté à ton usage.\n\nDécouvrir : ${params.upgradeUrl}\n\nL'équipe Lynaris`,
    html: emailLayout(content),
  }
}
