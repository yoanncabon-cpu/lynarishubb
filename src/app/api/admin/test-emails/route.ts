import { NextResponse } from "next/server"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { sendGmail } from "@/lib/emails/gmail"
import { welcomeEmail, teamInviteEmail } from "@/lib/emails/templates"
import {
  paymentSuccess,
  paymentFailed,
  subscriptionRenewed,
  subscriptionCancelled,
  planChanged,
  trialEnding,
} from "@/lib/emails/stripe-templates"
import {
  weeklySummaryEmail,
  agentErrorAlertEmail,
  newFeaturesEmail,
  usageTipsEmail,
} from "@/lib/emails/notification-templates"
import { getAppUrl } from "@/lib/app-url"

// Délai entre chaque envoi pour éviter le rate limiting Gmail
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface EmailResult {
  name: string
  success: boolean
  error?: string
}

// POST /api/admin/test-emails
// Body: { to: string }
// Envoie TOUS les types d'emails du site à l'adresse fournie
export async function POST(request: Request) {
  const isAdmin = await isLynarisAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as { to?: string }
  const to = body.to

  if (!to || typeof to !== "string") {
    return NextResponse.json(
      { error: "Paramètre `to` manquant ou invalide" },
      { status: 400 }
    )
  }

  // Capture dans une constante typée pour que TS la suive dans la closure
  const recipient: string = to
  const results: EmailResult[] = []
  const appUrl = getAppUrl()

  // Utilitaire : envoie un email et collecte le résultat
  async function send(name: string, subject: string, html: string, text: string) {
    try {
      const res = await sendGmail({ to: recipient, subject, html, text })
      results.push({ name, success: res.success, error: res.error })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[test-emails] Erreur sur "${name}":`, message)
      results.push({ name, success: false, error: message })
    }
    await delay(500)
  }

  // 1. welcome
  const welcome = welcomeEmail({ name: "Yoann", trialEndsAt: "3 mai 2026" })
  await send("welcome", welcome.subject, welcome.html, welcome.text)

  // 2. trial_ending (stripe-templates)
  const trial = trialEnding({
    customerEmail: to,
    customerName: "Yoann",
    trialEndDate: "dans 2 jours, le 27 avril",
    upgradeUrl: `${appUrl}/dashboard/billing`,
  })
  await send("trial_ending", trial.subject, trial.html, trial.text)

  // 3. payment_success
  const pSuccess = paymentSuccess({
    customerEmail: to,
    customerName: "Yoann",
    amount: 149,
    currency: "eur",
    planName: "Pro",
    invoiceId: "inv_test123",
    invoiceUrl: "https://invoice.stripe.com/test",
    periodStart: "1 mai 2026",
    periodEnd: "1 juin 2026",
  })
  await send("payment_success", pSuccess.subject, pSuccess.html, pSuccess.text)

  // 4. payment_failed
  const pFailed = paymentFailed({
    customerEmail: to,
    customerName: "Yoann",
    amount: 149,
    planName: "Pro",
    retryDate: "dans 3 jours",
    updatePaymentUrl: `${appUrl}/dashboard/billing`,
  })
  await send("payment_failed", pFailed.subject, pFailed.html, pFailed.text)

  // 5. subscription_renewed
  const subRenewed = subscriptionRenewed({
    customerEmail: to,
    customerName: "Yoann",
    amount: 149,
    planName: "Pro",
    nextRenewal: "1 juin 2026",
    invoiceUrl: "https://invoice.stripe.com/test",
  })
  await send("subscription_renewed", subRenewed.subject, subRenewed.html, subRenewed.text)

  // 6. subscription_cancelled
  const subCancelled = subscriptionCancelled({
    customerEmail: to,
    customerName: "Yoann",
    planName: "Pro",
    accessUntil: "31 mai 2026",
    reactivateUrl: `${appUrl}/dashboard/billing`,
  })
  await send("subscription_cancelled", subCancelled.subject, subCancelled.html, subCancelled.text)

  // 7. plan_changed
  const pChanged = planChanged({
    customerEmail: to,
    customerName: "Yoann",
    oldPlan: "Essentiel",
    newPlan: "Pro",
    newAmount: 149,
    effectiveDate: "25 avril 2026",
  })
  await send("plan_changed", pChanged.subject, pChanged.html, pChanged.text)

  // 8. weekly_summary — signature : weeklySummaryEmail(userName: string)
  const weekly = weeklySummaryEmail("Yoann")
  await send("weekly_summary", weekly.subject, weekly.html, weekly.text)

  // 9. agent_error — signature : agentErrorAlertEmail(agentName: string, errorMessage: string)
  const agentErr = agentErrorAlertEmail(
    "Marine",
    "WebSocket timeout après 30s"
  )
  await send("agent_error", agentErr.subject, agentErr.html, agentErr.text)

  // 10. new_features — signature : newFeaturesEmail(featureTitle: string, featureDescription: string)
  const newFeatures = newFeaturesEmail(
    "Chat en direct sur les tickets",
    "Tu peux maintenant échanger en temps réel avec tes clients directement depuis le dashboard."
  )
  await send("new_features", newFeatures.subject, newFeatures.html, newFeatures.text)

  // 11. usage_tips — signature : usageTipsEmail(tipTitle: string, tipContent: string)
  const tips = usageTipsEmail(
    "Optimise Marine pour tes appels",
    "Configure les horaires d'ouverture dans les paramètres de Marine pour qu'elle gère automatiquement les appels hors horaires."
  )
  await send("usage_tips", tips.subject, tips.html, tips.text)

  // 12. team_invite
  const invite = teamInviteEmail({
    orgName: "Lynaris Test",
    inviterName: "Yoann",
    role: "admin",
    signupUrl: `${appUrl}/signup?invite=test123`,
  })
  await send("team_invite", invite.subject, invite.html, invite.text)

  const sent = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    total: results.length,
    sent,
    failed,
    results,
  })
}
