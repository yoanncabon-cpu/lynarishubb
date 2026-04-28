export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { z } from "zod"

const schema = z.object({
  amount: z.number().min(5).max(500),
  type: z.enum(["phone", "api"]),
  org_id: z.string().optional(),
  org_email: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { amount, type, org_id, org_email } = parsed.data
  const orgId = org_id ?? request.headers.get("x-org-id") ?? "00000000-0000-0000-0000-000000000001"
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: type === "phone"
                ? "Credits telephoniques Lynaris - " + amount + " EUR"
                : "Credits API Lynaris - " + amount + " EUR",
              description: type === "phone"
                ? "Recharge credits telephoniques"
                : "Recharge credits API",
            },
          },
          quantity: 1,
        },
      ],
      success_url: appUrl + "/dashboard/billing?recharge=success&amount=" + amount + "&type=" + type,
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
