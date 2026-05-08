// POST /api/billing/sync — Resynchronise le planId DB depuis Stripe.
//
// Utilisé en filet de sécurité quand le webhook + la route activate ont raté
// (utilisateur qui ferme l'onglet, webhook non livré, etc.). On lit l'abonnement
// actif côté Stripe et on le réécrit en DB.

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { getPlanFromStripePriceId } from "@/lib/pricing/stripe-resolver"
import type { PlanId } from "@/lib/pricing/plans"

type DbPlan = "trial" | "starter" | "pro" | "scale"

const LEGACY_PLAN_MAP: Record<PlanId, DbPlan> = {
  discovery: "trial",
  starter:   "starter",
  pro:       "pro",
  business:  "pro",
  custom:    "scale",
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { stripeCustomerId: true, planId: true },
  })

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
    apiVersion: "2026-03-25.dahlia",
  })

  // 1. Trouver le customer Stripe — soit déjà lié, soit lookup par email
  let customerId = org?.stripeCustomerId ?? null
  if (!customerId && user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 5 })
    customerId = list.data[0]?.id ?? null
  }

  if (!customerId) {
    return NextResponse.json({
      error: "Aucun client Stripe trouvé pour cet email",
      planId: org?.planId ?? "discovery",
    }, { status: 404 })
  }

  // 2. Récupérer la subscription active la plus récente.
  //    On accepte aussi trialing / past_due — l'UI doit suivre le plan choisi.
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price"],
  })

  const active = subs.data.find((s) =>
    s.status === "active" || s.status === "trialing" || s.status === "past_due"
  )

  if (!active) {
    return NextResponse.json({
      error: "Aucun abonnement actif trouvé sur Stripe",
      customerId,
    }, { status: 404 })
  }

  const priceId = active.items?.data?.[0]?.price?.id
  if (!priceId) {
    return NextResponse.json({ error: "Price ID introuvable" }, { status: 500 })
  }

  const planId = getPlanFromStripePriceId(priceId)
  if (!planId) {
    return NextResponse.json({
      error: "Price ID inconnu — vérifie les variables STRIPE_PRICE_*",
      priceId,
    }, { status: 500 })
  }

  const billingCycle = (active.items?.data?.[0]?.price?.recurring?.interval === "year")
    ? "annual"
    : "monthly"

  await db.update(organizations)
    .set({
      planId,
      plan: LEGACY_PLAN_MAP[planId],
      planBillingCycle: billingCycle,
      planActivatedAt: new Date(),
      stripeCustomerId: customerId,
      stripeSubscriptionId: active.id,
    })
    .where(eq(organizations.id, orgId))

  logger.info("[billing/sync] Plan resynchronisé", { orgId, planId, billingCycle, customerId })

  return NextResponse.json({
    success: true,
    planId,
    billingCycle,
    subscriptionId: active.id,
  })
}
