// GET /api/billing/usage — usage courant de l'org (compteurs visibles client)
//
// Utilisé par le dashboard /billing pour afficher les barres de progression
// (actions / voix / RAG / membres équipe).
//
// ⚠️ N'expose JAMAIS le coût réel ni les seuils protection (admin only).

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { getCurrentUsage } from "@/lib/usage/service"
import { getOrgPlanId } from "@/lib/agents/instrumentation"
import { PLANS } from "@/lib/pricing/plans"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const [usage, planId] = await Promise.all([
    getCurrentUsage(orgId),
    getOrgPlanId(orgId),
  ])
  const plan = PLANS[planId]

  // Limites courantes du plan (sentinels -1 / 'all' déjà résolus)
  const limits = {
    actions:
      plan.features.monthlyActions === -1 ? null : plan.features.monthlyActions,
    voiceMinutes:
      plan.features.marineVoiceMinutes === -1
        ? null
        : plan.features.marineVoiceMinutes,
    ragDocs:
      plan.features.ragMaxDocs === -1 ? null : plan.features.ragMaxDocs,
    teamMembers:
      plan.features.teamMembers === -1 ? null : plan.features.teamMembers,
  }

  return NextResponse.json({
    orgId,
    planId,
    period: {
      start: usage.periodStart.toISOString(),
      end: usage.periodEnd.toISOString(),
    },
    usage: {
      actions: usage.actions,
      voiceMinutes: usage.voiceMinutes,
      ragDocs: usage.ragDocs,
      teamMembers: usage.teamMembers,
      voicePackMinutesRemaining: usage.voicePackMinutesRemaining,
    },
    limits,
  })
}
