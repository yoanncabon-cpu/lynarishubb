import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { getStripeClient } from "@/lib/integrations/stripe"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { orgId: true },
  })
  if (!userRow?.orgId) return NextResponse.json({ invoices: [] })

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, userRow.orgId),
    columns: { stripeCustomerId: true },
  })
  try {
    const stripe = getStripeClient()

    // Résolution du customerId — depuis la DB ou par lookup email Stripe
    let stripeCustomerId = org?.stripeCustomerId ?? null
    if (!stripeCustomerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 })
      const found = customers.data[0]
      if (found) {
        stripeCustomerId = found.id
        // Sauvegarder en DB pour les prochaines requêtes
        if (userRow?.orgId) {
          await db.update(organizations).set({ stripeCustomerId: found.id }).where(eq(organizations.id, userRow.orgId))
        }
      }
    }

    if (!stripeCustomerId) return NextResponse.json({ invoices: [], currentPeriodEnd: null })
    const [list, subscriptions] = await Promise.all([
      stripe.invoices.list({ customer: stripeCustomerId, limit: 24 }),
      stripe.subscriptions.list({ customer: stripeCustomerId, status: "active", limit: 1 }),
    ])

    const activeSub = subscriptions.data[0]
    const periodEndTimestamp = activeSub?.items?.data[0]?.current_period_end
    const currentPeriodEnd = periodEndTimestamp
      ? new Date(periodEndTimestamp * 1000).toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        })
      : null

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: (inv.amount_paid / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 }),
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      date: new Date(inv.created * 1000).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      }),
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      description: inv.description ?? inv.lines.data[0]?.description ?? "Abonnement Lynaris",
    }))

    return NextResponse.json({ invoices, currentPeriodEnd })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error"
    return NextResponse.json({ error: msg, invoices: [] }, { status: 500 })
  }
}
