// ─────────────────────────────────────────────────────────────────────────────
// Notifications cost-protection — interface
// ─────────────────────────────────────────────────────────────────────────────
//
// Définit l'interface des notifications déclenchées par le service de
// tracking. Implémentation concrète des emails via Resend → étape 14
// (templates protection-templates.ts).
//
// Pattern : ces fonctions sont async, à appeler HORS transaction DB
// (sinon on bloque le lock). Le service tracking les déclenche via
// `void notifyAdmin70(...)` après commit.

import { logger } from "@/lib/logger"
import type { PlanId } from "@/lib/pricing/plans"
import type { ProtectionThreshold } from "./config"

export interface NotificationContext {
  readonly orgId: string
  readonly orgName: string
  readonly planId: PlanId
  readonly currentCostEuros: number
  readonly budgetEuros: number
  readonly ratio: number
}

export interface NotificationProvider {
  /** 70% : notif admin uniquement (état nominal, pas d'urgence) */
  notifyAdmin70(ctx: NotificationContext): Promise<void>
  /** 90% : notif admin + email upsell client */
  notifyAdmin90(ctx: NotificationContext): Promise<void>
  notifyClientUpsell90(ctx: NotificationContext): Promise<void>
  /** 100% : alerte admin (mode ALERTE) ou bascule éco (mode ACTIF) */
  alertAdmin100(ctx: NotificationContext): Promise<void>
  /** 130% : alerte critique admin (mode ALERTE) ou hard cap (mode ACTIF) */
  alertAdmin130(ctx: NotificationContext): Promise<void>
}

/**
 * Provider stub — log uniquement, pas d'envoi réel.
 * Remplacé à l'étape 14 par l'implémentation Resend.
 */
export const stubNotificationProvider: NotificationProvider = {
  notifyAdmin70: async (ctx) => {
    logger.info("[cost-protection] admin notif 70%", {
      orgId: ctx.orgId,
      ratio: ctx.ratio,
    })
  },
  notifyAdmin90: async (ctx) => {
    logger.info("[cost-protection] admin notif 90%", {
      orgId: ctx.orgId,
      ratio: ctx.ratio,
    })
  },
  notifyClientUpsell90: async (ctx) => {
    logger.info("[cost-protection] client upsell 90%", {
      orgId: ctx.orgId,
      planId: ctx.planId,
    })
  },
  alertAdmin100: async (ctx) => {
    logger.warn("[cost-protection] admin alert 100%", {
      orgId: ctx.orgId,
      ratio: ctx.ratio,
    })
  },
  alertAdmin130: async (ctx) => {
    logger.warn("[cost-protection] admin alert 130% critique", {
      orgId: ctx.orgId,
      ratio: ctx.ratio,
    })
  },
}

/**
 * Map palier → fonction notification.
 * Permet au service tracking de déclencher tous les paliers franchis
 * en un seul appel.
 */
export async function dispatchNotification(
  provider: NotificationProvider,
  threshold: ProtectionThreshold,
  ctx: NotificationContext
): Promise<void> {
  switch (threshold) {
    case "notify_admin":
      await provider.notifyAdmin70(ctx)
      return
    case "notify_client":
      await Promise.all([
        provider.notifyAdmin90(ctx),
        provider.notifyClientUpsell90(ctx),
      ])
      return
    case "economy_mode":
      await provider.alertAdmin100(ctx)
      return
    case "hard_cap":
      await provider.alertAdmin130(ctx)
      return
  }
}
