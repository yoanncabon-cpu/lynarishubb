// GET /api/billing/plan — plan actuel de l'org + features détaillées
//
// Utilisé par le dashboard /billing et l'UI pour gating fin (afficher/masquer
// des sections selon les features du plan).

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { getOrgPlanId } from "@/lib/agents/instrumentation"
import { PLANS, getFeatureList, getPlanBadge } from "@/lib/pricing/plans"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const planId = await getOrgPlanId(orgId)
  const plan = PLANS[planId]

  return NextResponse.json({
    orgId,
    planId,
    name: plan.name,
    tagline: plan.tagline,
    priceMonthly: plan.priceMonthly,
    priceAnnualMonthly: plan.priceAnnualMonthly,
    setupFee: plan.setupFee,
    minCommitmentMonths: plan.minCommitmentMonths,
    trialDays: plan.trialDays,
    badge: getPlanBadge(plan),
    features: plan.features,
    featureList: getFeatureList(plan),
    cta: plan.cta,
  })
}
