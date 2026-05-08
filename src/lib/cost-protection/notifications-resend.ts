// ─────────────────────────────────────────────────────────────────────────────
// Implémentation Resend du NotificationProvider
// ─────────────────────────────────────────────────────────────────────────────
//
// Provider concret qui envoie les emails via Resend (priorité dans gmail.ts).
// Remplace le stub de notifications.ts en production.
//
// Idempotence : flag DB (notifiedAdmin70, etc.) géré côté service.ts.
// Cache Upstash optionnel pour dedup ultra-rapide :
//   protection:notif:{orgId}:{type}:{periodStart} TTL 31j

import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/emails/send"
import {
  adminCostAlert70,
  adminCostAlert90,
  adminCostAlert100,
  adminCostAlert130,
  clientUpsellAt90,
} from "@/lib/emails/protection-templates"
import { COST_PROTECTION_ADMIN_EMAIL } from "./config"
import { getNextPlan } from "@/lib/pricing/plans"
import type {
  NotificationContext,
  NotificationProvider,
} from "./notifications"

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"
const ADMIN_DASHBOARD_URL = `${APP_URL}/dashboard/admin/protection`

/**
 * Envoie un email admin avec gestion d'erreur silencieuse.
 * Les erreurs sont logguées mais ne propagent pas (le service tracking
 * doit continuer même si Resend tombe).
 */
async function sendToAdmin(
  template: ReturnType<typeof adminCostAlert70>,
  tag: string
): Promise<void> {
  try {
    await sendEmail({
      to: COST_PROTECTION_ADMIN_EMAIL,
      template,
      tags: [tag, "cost-protection", "admin"],
    })
  } catch (err) {
    logger.error("[cost-protection] sendToAdmin failed", { tag, err: String(err) })
  }
}

/**
 * Provider Resend pour les notifications cost-protection.
 *
 * Toutes les méthodes sont fire-and-forget (catchent leurs erreurs).
 * Idempotence garantie côté service.ts via les flags DB
 * (notifiedAdmin70 / notifiedClient90 / etc.).
 */
export const resendNotificationProvider: NotificationProvider = {
  notifyAdmin70: async (ctx: NotificationContext) => {
    const template = adminCostAlert70({
      orgName: ctx.orgName,
      orgId: ctx.orgId,
      planId: ctx.planId,
      currentCostEuros: ctx.currentCostEuros,
      budgetEuros: ctx.budgetEuros,
      ratio: ctx.ratio,
      adminUrl: ADMIN_DASHBOARD_URL,
    })
    await sendToAdmin(template, "admin-alert-70")
  },

  notifyAdmin90: async (ctx: NotificationContext) => {
    const template = adminCostAlert90({
      orgName: ctx.orgName,
      orgId: ctx.orgId,
      planId: ctx.planId,
      currentCostEuros: ctx.currentCostEuros,
      budgetEuros: ctx.budgetEuros,
      ratio: ctx.ratio,
      adminUrl: ADMIN_DASHBOARD_URL,
    })
    await sendToAdmin(template, "admin-alert-90")
  },

  notifyClientUpsell90: async (ctx: NotificationContext) => {
    // On a besoin de l'email du client — lookup via DB côté caller serait
    // plus propre, mais pour l'instant on passe via le ctx (à enrichir plus tard).
    // Pas d'envoi possible sans email — on log juste.
    const suggested = getNextPlan(ctx.planId)
    const upgradeUrl = `${APP_URL}/dashboard/billing?upgrade=${suggested}`

    const template = clientUpsellAt90({
      customerEmail: "", // sera renseigné par le caller via wrapper
      currentPlanId: ctx.planId,
      suggestedPlanId: suggested,
      upgradeUrl,
    })

    // Stub en l'absence d'email — sera complété quand le service tracking
    // aura accès à l'email du customer (lookup organizations.users).
    logger.info("[cost-protection] client upsell email prepared", {
      orgId: ctx.orgId,
      subject: template.subject,
    })
  },

  alertAdmin100: async (ctx: NotificationContext) => {
    const template = adminCostAlert100({
      orgName: ctx.orgName,
      orgId: ctx.orgId,
      planId: ctx.planId,
      currentCostEuros: ctx.currentCostEuros,
      budgetEuros: ctx.budgetEuros,
      ratio: ctx.ratio,
      adminUrl: ADMIN_DASHBOARD_URL,
    })
    await sendToAdmin(template, "admin-alert-100")
  },

  alertAdmin130: async (ctx: NotificationContext) => {
    const template = adminCostAlert130({
      orgName: ctx.orgName,
      orgId: ctx.orgId,
      planId: ctx.planId,
      currentCostEuros: ctx.currentCostEuros,
      budgetEuros: ctx.budgetEuros,
      ratio: ctx.ratio,
      adminUrl: ADMIN_DASHBOARD_URL,
    })
    await sendToAdmin(template, "admin-alert-130")
  },
}
