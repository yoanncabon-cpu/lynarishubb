// POST /api/billing/voice-pack — recharge pack voix Marine pour Starter
//
// Initie un Stripe Checkout Session one-shot pour acheter un pack
// 200 minutes Marine à 99€. Disponible uniquement pour le plan Starter
// (où marineVoiceMinutes = 0 et marineVoiceOption.available = true).
//
// Le crédit effectif des minutes se fait via le webhook Stripe à la
// confirmation du paiement (étape 9).

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { getOrgPlanId } from "@/lib/agents/instrumentation"
import { PLANS } from "@/lib/pricing/plans"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const planId = await getOrgPlanId(orgId)
  const plan = PLANS[planId]
  const option = plan.features.marineVoiceOption

  if (!option.available || !option.pricePerPack || !option.minutesPerPack) {
    return NextResponse.json(
      { error: "Voice pack non disponible sur ce plan" },
      { status: 403 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const customerEmail = data.user?.email ?? undefined

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"

  // Stripe price ID dédié au voice pack (env STRIPE_PRICE_VOICE_PACK)
  // Si non configuré, on crée un price_data inline (fallback dev)
  const presetPriceId = process.env["STRIPE_PRICE_VOICE_PACK"]?.trim() ?? ""

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        presetPriceId.length > 0
          ? { price: presetPriceId, quantity: 1 }
          : {
              price_data: {
                currency: "eur",
                unit_amount: Math.round(option.pricePerPack * 100),
                product_data: {
                  name: `Pack voix Marine — ${option.minutesPerPack} minutes`,
                  description:
                    "Recharge minutes pour Marine (option plan Starter)",
                },
              },
              quantity: 1,
            },
      ],
      invoice_creation: { enabled: true },
      success_url: `${appUrl}/dashboard/billing?voice_pack=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing`,
      client_reference_id: orgId,
      ...(customerEmail !== undefined ? { customer_email: customerEmail } : {}),
      metadata: {
        org_id: orgId,
        action: "voice_pack_purchase",
        minutes: String(option.minutesPerPack),
      },
      locale: "fr",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
