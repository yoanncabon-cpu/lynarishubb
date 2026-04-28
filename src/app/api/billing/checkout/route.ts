import { type NextRequest, NextResponse } from "next/server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { z } from "zod"
import { PLANS, type PlanId } from "@/lib/pricing/plans"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  // Support both planId-based (new) and direct price_id (legacy) flows
  planId: z.string().optional(),
  annual: z.boolean().optional().default(false),
  // Legacy
  price_id: z.string().optional(),
  // org_id et org_email ignorés — récupérés depuis la session serveur
  billing: z.enum(["monthly", "annual"]).optional().default("monthly"),
})

export async function POST(request: NextRequest) {
  // Authentification — orgId depuis la session, jamais depuis le body client
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const org_id = await getOrProvisionOrgId()
  const org_email = user.email ?? ""

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { planId, annual, price_id: legacyPriceId, billing } = parsed.data

  // "annual" (bool) ou billing === "annual" (string) → même résultat
  const isAnnual = annual || billing === "annual"

  // Resolve priceId: prefer planId lookup over legacy price_id
  let priceId: string | undefined

  if (planId) {
    const plan = PLANS.find((p) => p.id === (planId as PlanId))
    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 400 })
    }
    priceId = isAnnual ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly
    if (!priceId) {
      return NextResponse.json(
        { error: "Plan ou période non disponible — Stripe price ID manquant" },
        { status: 400 }
      )
    }
  } else if (legacyPriceId) {
    priceId = legacyPriceId
  } else {
    return NextResponse.json({ error: "planId ou price_id requis" }, { status: 400 })
  }

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"
  const billingMode = isAnnual ? "annual" : "monthly"

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      client_reference_id: org_id,
      customer_email: org_email,
      metadata: { org_id, billing: billingMode, ...(planId ? { plan_id: planId } : {}) },
      subscription_data: {
        metadata: { org_id },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "fr",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
