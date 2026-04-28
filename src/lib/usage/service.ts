// ─────────────────────────────────────────────────────────────────────────────
// Usage tracking service — couche client (compteurs visibles dashboard)
// ─────────────────────────────────────────────────────────────────────────────
//
// Responsabilités :
// 1. consumeAction(orgId, agent, actionType, count) : décrémente le quota
//    actions du mois courant. Vérifie d'abord les permissions du plan.
// 2. consumeVoiceMinutes(orgId, minutes) : décrémente le quota voix Marine.
//    Cas spécial Starter : on consomme depuis voicePackMinutesRemaining
//    si Marine n'est pas incluse.
// 3. getCurrentUsage(orgId) : retourne les compteurs pour affichage UI.
//
// Garanties :
// - Transactions atomiques sur les compteurs
// - Vérification permissions avant toute consommation (Result<T,E>)
// - Cohérence : si l'org n'a pas de ligne org_usage_counters, on en crée une
//
// ⚠️ Pas de coût RÉEL ici — c'est l'affaire de cost-protection/service.ts.
// La séparation client/interne est volontaire (RLS, expostion API, etc.).

import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  organizations,
  orgUsageCounters,
  usageLedger,
} from "@/lib/db/schema"
import {
  canConsumeActions,
  canConsumeVoiceMinutes,
} from "@/lib/pricing/permissions"
import {
  PLANS,
  planSchema,
  type AgentSlug,
  type PlanId,
} from "@/lib/pricing/plans"
import type { AccessResult } from "@/lib/pricing/permissions"
import type { ActionType } from "@/lib/cost-protection/criticality"

// ─── Types publics ──────────────────────────────────────────────────────────

export interface CurrentUsage {
  readonly actions: number
  readonly voiceMinutes: number
  readonly ragDocs: number
  readonly teamMembers: number
  readonly voicePackMinutesRemaining: number
  readonly periodStart: Date
  readonly periodEnd: Date
}

export type ConsumeResult =
  | { readonly ok: true; readonly newCount: number }
  | { readonly ok: false; readonly access: AccessResult }

// ─── Helpers internes ───────────────────────────────────────────────────────

const PERIOD_DAYS = 30

function newPeriod(): { start: Date; end: Date } {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + PERIOD_DAYS)
  return { start, end }
}

/**
 * Récupère le plan courant de l'org depuis la DB.
 * Utilise `planId` (nouvelle colonne) avec fallback sur 'discovery' si invalide.
 */
async function getOrgPlan(orgId: string): Promise<PlanId> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { planId: true },
  })
  if (!org?.planId) return "discovery"
  const parsed = planSchema.safeParse(org.planId)
  return parsed.success ? parsed.data : "discovery"
}

/**
 * Crée la ligne org_usage_counters si elle n'existe pas.
 * Idempotent (ON CONFLICT DO NOTHING).
 */
async function ensureCountersRow(
  tx: typeof db,
  orgId: string
): Promise<void> {
  const { start, end } = newPeriod()
  await tx.execute(
    sql`INSERT INTO org_usage_counters
        (org_id, period_start, period_end, actions_used, voice_minutes_used,
         rag_docs_count, team_members_count, voice_pack_minutes_remaining, updated_at)
        VALUES (${orgId}, ${start.toISOString()}, ${end.toISOString()}, 0, 0, 0, 1, 0, NOW())
        ON CONFLICT (org_id) DO NOTHING`
  )
}

// ─── consumeAction ──────────────────────────────────────────────────────────

/**
 * Décrémente le quota actions de l'org pour le mois courant.
 * Vérifie d'abord la permission via canConsumeActions().
 *
 * @returns ConsumeResult — `ok: true` avec newCount si autorisé,
 *                          `ok: false` avec access (raison + upgradeTo) sinon.
 */
export async function consumeAction(
  orgId: string,
  agent: AgentSlug,
  actionType: ActionType,
  count = 1
): Promise<ConsumeResult> {
  const planId = await getOrgPlan(orgId)

  // Lecture du compteur courant pour vérifier la permission
  const current = await db.query.orgUsageCounters.findFirst({
    where: eq(orgUsageCounters.orgId, orgId),
    columns: { actionsUsed: true },
  })
  const usedActions = current?.actionsUsed ?? 0

  const access = canConsumeActions(planId, usedActions, count)
  if (!access.allowed) {
    return { ok: false, access }
  }

  // Transaction atomique : insert ledger + update counter
  let newCount = usedActions + count
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)

    // Update atomique (UPDATE ... SET counter = counter + N)
    await tx
      .update(orgUsageCounters)
      .set({
        actionsUsed: sql`${orgUsageCounters.actionsUsed} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))

    // Ledger immuable
    await tx.insert(usageLedger).values({
      orgId,
      agentSlug: agent,
      actionType,
      count,
    })

    // Re-lecture pour avoir la vraie valeur post-update (atomique)
    const updated = await tx.query.orgUsageCounters.findFirst({
      where: eq(orgUsageCounters.orgId, orgId),
      columns: { actionsUsed: true },
    })
    if (updated) newCount = updated.actionsUsed
  })

  return { ok: true, newCount }
}

// ─── consumeVoiceMinutes ────────────────────────────────────────────────────

/**
 * Décrémente le quota voix Marine de l'org.
 *
 * Cas spécial Starter (`marineVoiceMinutes === 0`) :
 * - Si `voicePackMinutesRemaining` > 0 et suffisant : consomme depuis le pack
 * - Sinon : refus avec invitation à recharger le pack 99€/200min
 *
 * Sinon (Pro / Business / Custom / Discovery) :
 * - Vérification quota mensuel via canConsumeVoiceMinutes
 * - Update voice_minutes_used
 */
export async function consumeVoiceMinutes(
  orgId: string,
  minutes: number
): Promise<ConsumeResult> {
  if (minutes <= 0) {
    return { ok: true, newCount: 0 }
  }

  const planId = await getOrgPlan(orgId)
  const plan = PLANS[planId]
  const planMinutes = plan.features.marineVoiceMinutes

  // Cas Starter : Marine en option via voice pack
  if (planMinutes === 0) {
    return consumeFromVoicePack(orgId, minutes)
  }

  // Cas standard : quota plan
  const current = await db.query.orgUsageCounters.findFirst({
    where: eq(orgUsageCounters.orgId, orgId),
    columns: { voiceMinutesUsed: true },
  })
  const usedMinutes = current?.voiceMinutesUsed ?? 0

  const access = canConsumeVoiceMinutes(planId, usedMinutes, minutes)
  if (!access.allowed) {
    return { ok: false, access }
  }

  let newCount = usedMinutes + minutes
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)
    await tx
      .update(orgUsageCounters)
      .set({
        voiceMinutesUsed: sql`${orgUsageCounters.voiceMinutesUsed} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))

    const updated = await tx.query.orgUsageCounters.findFirst({
      where: eq(orgUsageCounters.orgId, orgId),
      columns: { voiceMinutesUsed: true },
    })
    if (updated) newCount = updated.voiceMinutesUsed
  })

  return { ok: true, newCount }
}

/**
 * Consomme des minutes depuis le voice pack Starter (option 99€/200min).
 * Refuse si pas assez de solde.
 */
async function consumeFromVoicePack(
  orgId: string,
  minutes: number
): Promise<ConsumeResult> {
  const current = await db.query.orgUsageCounters.findFirst({
    where: eq(orgUsageCounters.orgId, orgId),
    columns: { voicePackMinutesRemaining: true },
  })
  const remaining = current?.voicePackMinutesRemaining ?? 0

  if (remaining < minutes) {
    return {
      ok: false,
      access: {
        allowed: false,
        reason: `Pack voix Marine épuisé. Recharge 200 min — 99 € pour continuer.`,
        upgradeTo: "pro",
      },
    }
  }

  let newCount = remaining - minutes
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)
    await tx
      .update(orgUsageCounters)
      .set({
        voicePackMinutesRemaining: sql`${orgUsageCounters.voicePackMinutesRemaining} - ${minutes}`,
        voiceMinutesUsed: sql`${orgUsageCounters.voiceMinutesUsed} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))

    const updated = await tx.query.orgUsageCounters.findFirst({
      where: eq(orgUsageCounters.orgId, orgId),
      columns: { voicePackMinutesRemaining: true },
    })
    if (updated) newCount = updated.voicePackMinutesRemaining
  })

  return { ok: true, newCount }
}

// ─── addVoicePackMinutes ────────────────────────────────────────────────────

/**
 * Ajoute des minutes au pack voix Starter (après achat one-shot Stripe).
 * À appeler depuis le webhook Stripe quand un paiement voice pack est confirmé.
 */
export async function addVoicePackMinutes(
  orgId: string,
  minutes: number
): Promise<{ newBalance: number }> {
  let newBalance = 0
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)
    await tx
      .update(orgUsageCounters)
      .set({
        voicePackMinutesRemaining: sql`${orgUsageCounters.voicePackMinutesRemaining} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))

    const updated = await tx.query.orgUsageCounters.findFirst({
      where: eq(orgUsageCounters.orgId, orgId),
      columns: { voicePackMinutesRemaining: true },
    })
    if (updated) newBalance = updated.voicePackMinutesRemaining
  })
  return { newBalance }
}

// ─── getCurrentUsage ────────────────────────────────────────────────────────

/**
 * Retourne les compteurs actuels de l'org.
 * Si pas de ligne en DB, retourne des compteurs à zéro (avec période courante).
 *
 * Utilisé par GET /api/billing/usage et le dashboard /billing.
 */
export async function getCurrentUsage(orgId: string): Promise<CurrentUsage> {
  const row = await db.query.orgUsageCounters.findFirst({
    where: eq(orgUsageCounters.orgId, orgId),
  })

  if (!row) {
    const { start, end } = newPeriod()
    return {
      actions: 0,
      voiceMinutes: 0,
      ragDocs: 0,
      teamMembers: 1,
      voicePackMinutesRemaining: 0,
      periodStart: start,
      periodEnd: end,
    }
  }

  return {
    actions: row.actionsUsed,
    voiceMinutes: row.voiceMinutesUsed,
    ragDocs: row.ragDocsCount,
    teamMembers: row.teamMembersCount,
    voicePackMinutesRemaining: row.voicePackMinutesRemaining,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
  }
}

// ─── Helpers RAG / team (utilisés par /api/documents et /api/team) ──────────

/**
 * Met à jour le compteur de documents RAG.
 * Appelé après un upload réussi dans Supabase Storage.
 */
export async function setRagDocsCount(
  orgId: string,
  count: number
): Promise<void> {
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)
    await tx
      .update(orgUsageCounters)
      .set({
        ragDocsCount: count,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))
  })
}

/**
 * Met à jour le compteur de membres équipe.
 * Appelé après une invitation acceptée ou un retrait de membre.
 */
export async function setTeamMembersCount(
  orgId: string,
  count: number
): Promise<void> {
  await db.transaction(async (tx) => {
    await ensureCountersRow(tx as unknown as typeof db, orgId)
    await tx
      .update(orgUsageCounters)
      .set({
        teamMembersCount: count,
        updatedAt: new Date(),
      })
      .where(eq(orgUsageCounters.orgId, orgId))
  })
}
