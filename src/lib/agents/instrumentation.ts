// ─────────────────────────────────────────────────────────────────────────────
// Instrumentation executor agents — usage + cost-protection
// ─────────────────────────────────────────────────────────────────────────────
//
// Module utilisé par l'executor (runAgent / streamAgent) pour :
// 1. Vérifier les permissions du plan AVANT chaque tour
// 2. Tracker la consommation (compteur client + coût réel) APRÈS chaque tour
//
// Centralisé ici pour ne pas polluer executor.ts avec la logique pricing.

import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  AGENT_SLUGS,
  PLANS,
  planSchema,
  type AgentSlug,
  type PlanId,
} from "@/lib/pricing/plans"
import { canUseAgent } from "@/lib/pricing/permissions"
import type { AccessResult } from "@/lib/pricing/permissions"
import { consumeAction } from "@/lib/usage/service"
import { trackUsage } from "@/lib/cost-protection/service"
import { checkProtection } from "@/lib/cost-protection/service"
import type { AnthropicModel } from "@/lib/cost-protection/economy-mode"
import type { ActionType } from "@/lib/cost-protection/criticality"

// ─── Helpers : validation slug + plan ────────────────────────────────────────

/**
 * Valide qu'une string est un AgentSlug officiel.
 * Les agents custom (Business+) qui ne sont pas dans AGENT_SLUGS
 * retournent null — on les laisse passer côté instrumentation
 * (tracking sous "custom_agent" générique).
 */
export function validateAgentSlug(slug: string): AgentSlug | null {
  return (AGENT_SLUGS as readonly string[]).includes(slug)
    ? (slug as AgentSlug)
    : null
}

/**
 * Charge le planId de l'org. Fallback 'discovery' si absent ou invalide.
 */
export async function getOrgPlanId(orgId: string): Promise<PlanId> {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { planId: true },
    })
    if (!org?.planId) return "discovery"
    const parsed = planSchema.safeParse(org.planId)
    return parsed.success ? parsed.data : "discovery"
  } catch {
    return "discovery"
  }
}

// ─── Pre-turn : check d'accès ────────────────────────────────────────────────

export type PreTurnResult =
  | { readonly allowed: true; readonly planId: PlanId }
  | {
      readonly allowed: false
      readonly access: AccessResult
      readonly planId: PlanId
    }

/**
 * Vérifie qu'une action peut démarrer (avant l'appel Anthropic).
 * Combine canUseAgent + permissions du plan.
 *
 * @param selectedAgents Slugs des agents déjà actifs sur l'org (pour Starter limit 3)
 */
export async function checkPreTurnAccess(
  orgId: string,
  agentSlug: string,
  selectedAgents: readonly AgentSlug[] = []
): Promise<PreTurnResult> {
  const planId = await getOrgPlanId(orgId)

  // Agents custom (hors AGENT_SLUGS) : on saute le check canUseAgent et on laisse passer
  const validSlug = validateAgentSlug(agentSlug)
  if (validSlug === null) return { allowed: true, planId }

  const access = canUseAgent(planId, validSlug, selectedAgents)
  if (!access.allowed) {
    return { allowed: false, access, planId }
  }

  return { allowed: true, planId }
}

// ─── Post-turn : tracking ────────────────────────────────────────────────────

export interface TurnInstrumentationInput {
  readonly orgId: string
  readonly agentSlug: string
  readonly planId: PlanId
  readonly model: string
  readonly inputTokens: number
  readonly outputTokens: number
  /** Si true, l'appel a tourné en mode économie (modèle dégradé). */
  readonly economyModeUsed?: boolean
  /** Type d'action pour le tracking (par défaut "chat"). */
  readonly actionType?: ActionType
  /** Référence provider pour audit (request_id Anthropic, etc.). */
  readonly providerRef?: string
}

const KNOWN_MODELS = new Set<AnthropicModel>([
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
])

function toAnthropicModel(model: string): AnthropicModel {
  if ((KNOWN_MODELS as Set<string>).has(model)) return model as AnthropicModel
  // Fallback raisonnable : Sonnet (modèle médian, le plus utilisé)
  return "claude-sonnet-4-6"
}

/**
 * Instrumente un tour d'agent terminé : tracke le coût réel + décrémente
 * le compteur client.
 *
 * Fire-and-forget : ne bloque pas la réponse si tracking échoue (logged).
 */
export async function instrumentTurnComplete(
  input: TurnInstrumentationInput
): Promise<void> {
  const validSlug = validateAgentSlug(input.agentSlug)
  if (validSlug === null) {
    // Agent custom : tracking allégé (pas dans AGENT_SLUGS, donc pas
    // dans la matrice de criticité). On track juste le coût.
    return
  }

  const actionType: ActionType = input.actionType ?? "chat"

  // 1. Tracking coût réel (interne, admin only)
  try {
    await trackUsage({
      orgId: input.orgId,
      planId: input.planId,
      agentSlug: validSlug,
      actionType,
      cost: {
        provider: "anthropic",
        model: toAnthropicModel(input.model),
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
      },
      ...(input.providerRef !== undefined ? { providerRef: input.providerRef } : {}),
      economyModeUsed: input.economyModeUsed ?? false,
    })
  } catch (err) {
    console.error("[instrumentation] trackUsage failed", { orgId: input.orgId, err })
  }

  // 2. Compteur client (visible dashboard)
  try {
    await consumeAction(input.orgId, validSlug, actionType)
  } catch (err) {
    console.error("[instrumentation] consumeAction failed", { orgId: input.orgId, err })
  }
}

/**
 * Détermine le mode protection courant pour une action donnée.
 * À appeler AVANT l'appel Anthropic en mode ACTIF (en mode ALERTE retourne
 * toujours `{ mode: 'normal' }`).
 *
 * Wrapper léger autour de checkProtection (cost-protection/service.ts).
 */
export async function checkActionProtection(
  orgId: string,
  planId: PlanId,
  agentSlug: string,
  actionType: ActionType = "chat"
): Promise<
  | { readonly mode: "normal" }
  | { readonly mode: "economy" }
  | { readonly mode: "blocked"; readonly reason: string }
  | { readonly mode: "passthrough"; readonly reason: string }
> {
  const validSlug = validateAgentSlug(agentSlug)
  if (validSlug === null) return { mode: "normal" }

  const result = await checkProtection(orgId, planId, validSlug, actionType)
  if (result.mode === "normal") return { mode: "normal" }
  if (result.mode === "economy") return { mode: "economy" }
  if (result.mode === "hard_cap_blocked") {
    return { mode: "blocked", reason: result.reason }
  }
  return { mode: "passthrough", reason: result.reason }
}

/**
 * Vérifie qu'on peut consommer N actions avant l'appel.
 * Utilise consumeAction qui combine permissions + DB update.
 *
 * Note : on consomme 1 action ICI (pré-flight), pas après l'appel.
 * Si l'appel échoue côté Anthropic, l'action est quand même comptée
 * (c'est le comportement attendu : on facture la tentative).
 */
export async function consumePreFlightAction(
  orgId: string,
  agentSlug: string,
  actionType: ActionType = "chat"
): Promise<{ ok: true } | { ok: false; access: AccessResult }> {
  const validSlug = validateAgentSlug(agentSlug)
  if (validSlug === null) return { ok: true }

  const result = await consumeAction(orgId, validSlug, actionType, 1)
  if (!result.ok) return { ok: false, access: result.access }
  return { ok: true }
}

/**
 * Format de réponse stream/run quand un check échoue (canUseAgent ou
 * canConsumeActions). Renvoyé au client pour qu'il affiche le message
 * + bouton upgrade.
 */
export function buildAccessDeniedPayload(access: AccessResult): {
  error: string
  reason: string
  upgradeTo: PlanId | null
  upgradeUrl: string
  planName: string | null
} {
  if (access.allowed) {
    return {
      error: "PLAN_LIMIT_REACHED",
      reason: "",
      upgradeTo: null,
      upgradeUrl: "/dashboard/billing",
      planName: null,
    }
  }
  const targetPlan = PLANS[access.upgradeTo]
  return {
    error: "PLAN_LIMIT_REACHED",
    reason: access.reason,
    upgradeTo: access.upgradeTo,
    upgradeUrl: `/dashboard/billing?upgrade=${access.upgradeTo}`,
    planName: targetPlan.name,
  }
}
