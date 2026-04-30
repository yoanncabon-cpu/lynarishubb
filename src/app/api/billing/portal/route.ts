import { NextResponse } from "next/server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getAppUrl } from "@/lib/app-url"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  if (!process.env["STRIPE_SECRET_KEY"] || process.env["STRIPE_SECRET_KEY"] === "sk_test_placeholder") {
    return NextResponse.json({
      error: "Stripe non configure. Ajoutez STRIPE_SECRET_KEY dans .env",
    }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { orgId: true },
  })
  if (!userRow?.orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 })
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, userRow.orgId),
    columns: { stripeCustomerId: true },
  })

  const appUrl = getAppUrl()

  try {
    const stripe = getStripeClient()

    // Résolution du customerId — DB ou lookup email Stripe
    let stripeCustomerId = org?.stripeCustomerId ?? null
    if (!stripeCustomerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 })
      const found = customers.data[0]
      if (found) {
        stripeCustomerId = found.id
        await db.update(organizations).set({ stripeCustomerId: found.id }).where(eq(organizations.id, userRow.orgId))
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({
        error: "Aucun abonnement Stripe actif. Souscrivez d'abord un plan.",
      }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: appUrl + "/dashboard/billing",
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe portal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
