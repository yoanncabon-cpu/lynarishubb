export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { sendEmail } from "@/lib/emails/send"
import { paymentSuccess } from "@/lib/emails/stripe-templates"
import { getPlanFromStripePriceId } from "@/lib/pricing/stripe-resolver"
import { planSchema, type PlanId } from "@/lib/pricing/plans"

const schema = z.object({ sessionId: z.string().min(1) })

type DbPlan = "trial" | "starter" | "pro" | "scale"

// Mapping plan_id metadata (nouveau enum UI) ⇄ enum legacy DB `plan`.
// L'écriture moderne se fait sur `planId` (text). L'enum `plan` est conservé
// pour rétrocompat tant que l'ancien code n'est pas migré.
const LEGACY_PLAN_MAP: Record<PlanId, DbPlan> = {
  discovery: "trial",
  starter:   "starter",
  pro:       "pro",
  business:  "pro",   // legacy enum n'a pas "business" — fallback
  custom:    "scale",
}

const PLAN_LABELS: Record<PlanId, string> = {
  discovery: "Découverte",
  starter:   "Starter",
  pro:       "Pro",
  business:  "Business",
  custom:    "Sur-mesure",
}

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "sessionId requis" }, { status: 422 })
  }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
    apiVersion: "2026-03-25.dahlia",
  })

  try {
    const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId, {
      expand: ["subscription", "subscription.items.data.price", "invoice", "line_items"],
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 })
    }

    // Résolution du PlanId : 3 sources, ordre de fiabilité
    //   1. metadata.plan_id (envoyé par /api/billing/checkout)
    //   2. line_items.price → mapping env STRIPE_PRICE_*
    //   3. subscription.items[0].price → mapping env STRIPE_PRICE_*
    let resolvedPlanId: PlanId | null = null

    const metaPlan = session.metadata?.["plan_id"] ?? session.metadata?.["planId"]
    if (metaPlan) {
      const parsed = planSchema.safeParse(metaPlan)
      if (parsed.success) resolvedPlanId = parsed.data
    }

    if (!resolvedPlanId) {
      const lineItem = session.line_items?.data?.[0]
      const lineItemPriceId = typeof lineItem?.price === "string"
        ? lineItem.price
        : lineItem?.price?.id
      if (lineItemPriceId) {
        resolvedPlanId = getPlanFromStripePriceId(lineItemPriceId)
      }
    }

    if (!resolvedPlanId && session.subscription && typeof session.subscription === "object") {
      const subPriceId = (session.subscription as { items?: { data?: Array<{ price?: { id?: string } }> } })
        .items?.data?.[0]?.price?.id
      if (subPriceId) {
        resolvedPlanId = getPlanFromStripePriceId(subPriceId)
      }
    }

    if (!resolvedPlanId) {
      return NextResponse.json({ error: "Plan introuvable dans la session" }, { status: 400 })
    }

    const dbPlan = LEGACY_PLAN_MAP[resolvedPlanId]
    const billingMode = session.metadata?.["billing"] === "annual" ? "annual" : "monthly"

    const customerId = typeof session.customer === "string" ? session.customer : undefined
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as { id?: string } | null)?.id

    // 1. Mise à jour planId (nouveau, lu par /api/billing/plan) + plan legacy
    await db.update(organizations)
      .set({
        planId: resolvedPlanId,
        plan: dbPlan,
        planBillingCycle: billingMode,
        planActivatedAt: new Date(),
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      })
      .where(eq(organizations.id, orgId))

    // 2. Envoi de l'email de confirmation
    const customerEmail = session.customer_details?.email ?? session.customer_email
    if (customerEmail) {
      const planName = PLAN_LABELS[resolvedPlanId]
      const amount = (session.amount_total ?? 0) / 100
      const currency = session.currency ?? "eur"

      // Récupérer les dates de période depuis la facture
      let periodStart = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      let periodEnd = ""
      let invoiceId = ""
      let invoiceUrl: string | undefined

      const inv = session.invoice
      if (inv && typeof inv === "object" && "id" in inv) {
        const invoice = inv as { id: string; hosted_invoice_url?: string | null; period_start?: number; period_end?: number; lines?: { data?: Array<{ period?: { start?: number; end?: number } }> } }
        invoiceId = invoice.id
        invoiceUrl = invoice.hosted_invoice_url ?? undefined
        const lineStart = invoice.lines?.data?.[0]?.period?.start
        const lineEnd = invoice.lines?.data?.[0]?.period?.end
        if (lineStart) periodStart = new Date(lineStart * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        if (lineEnd) periodEnd = new Date(lineEnd * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      }

      try {
        await sendEmail({
          to: customerEmail,
          template: paymentSuccess({
            customerEmail,
            customerName: session.customer_details?.name ?? undefined,
            amount,
            currency,
            planName,
            invoiceId: invoiceId || parsed.data.sessionId,
            invoiceUrl,
            periodStart,
            periodEnd,
          }),
          tags: ["payment-success", "plan-activation"],
        })
      } catch (emailErr) {
        console.error("[billing/activate] Email send failed:", emailErr)
        // Non-bloquant — le plan est activé même si l'email échoue
      }
    }

    return NextResponse.json({ success: true, plan: resolvedPlanId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
