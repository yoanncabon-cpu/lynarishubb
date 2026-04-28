import Stripe from "stripe"

export function getStripeClient(secretKey?: string): Stripe {
  const key = secretKey ?? process.env["STRIPE_SECRET_KEY"] ?? ""
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" })
}

export async function createCheckoutSession(params: {
  priceId: string
  orgId: string
  orgEmail: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string }> {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orgId,
    customer_email: params.orgEmail,
    metadata: { org_id: params.orgId },
  })
  return { url: session.url ?? params.cancelUrl }
}

export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const stripe = getStripeClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return { url: session.url }
}
