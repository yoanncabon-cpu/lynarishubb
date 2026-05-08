export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { getAppUrl } from "@/lib/app-url"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { z } from "zod"

const schema = z.object({
  amount: z.number().min(5).max(500),
  type: z.enum(["phone", "api"]),
  org_email: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { amount, type, org_email } = parsed.data
  const appUrl = getAppUrl()

  try {
    const stripe = getStripeClient()
    const productName = type === "phone"
      ? `Recharge crédits téléphoniques — ${amount.toFixed(2)} €`
      : `Recharge crédits API — ${amount.toFixed(2)} €`
    const productDescription = type === "phone"
      ? "Crédits utilisables pour les appels Marine (entrants/sortants)"
      : "Crédits utilisables pour les appels API agents Lynaris"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
          quantity: 1,
        },
      ],
      // Génère une invoice Stripe pour ce paiement one-shot — apparaît
      // dans /api/billing/invoices comme l'historique des abonnements.
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: productName,
          metadata: {
            org_id: orgId,
            credit_type: type,
            amount_eur: String(amount),
            action: "credit_recharge",
          },
          footer: "Merci pour ta confiance — équipe Lynaris",
        },
      },
      success_url: appUrl + "/dashboard/billing?recharge=success&session_id={CHECKOUT_SESSION_ID}&amount=" + amount + "&type=" + type,
      cancel_url: appUrl + "/dashboard/billing",
      client_reference_id: orgId,
      customer_email: org_email,
      metadata: {
        org_id: orgId,
        credit_type: type,
        amount_eur: String(amount),
        action: "credit_recharge",
      },
      locale: "fr",
      allow_promotion_codes: true,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
