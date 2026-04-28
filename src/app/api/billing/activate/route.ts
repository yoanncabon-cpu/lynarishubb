export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { sendEmail } from "@/lib/emails/send"
import { paymentSuccess } from "@/lib/emails/stripe-templates"

const schema = z.object({ sessionId: z.string().min(1) })

type DbPlan = "trial" | "starter" | "pro" | "scale"

// Mapping plan_id (metadata Stripe checkout) → planEnum DB.
// Nouvelle nomenclature (3 plans) :
//   pro    → pro
//   custom → scale (Sur-mesure)
// Anciennes valeurs conservées pour rétrocompat checkout existants.
const PLAN_MAP: Record<string, DbPlan> = {
  // Nouvelle nomenclature
  decouverte: "trial",
  pro:        "pro",
  custom:     "scale",
  // Anciennes valeurs (rétrocompat sessions Stripe historiques)
  essentiel:  "pro",   // Migration douce : Essentiel → Pro
  starter:    "pro",
  cabinet:    "scale",
  scale:      "scale",
}

const PLAN_LABELS: Record<DbPlan, string> = {
  trial:   "Découverte",
  starter: "Pro",   // Migration douce : ancien starter affiché comme Pro
  pro:     "Pro",
  scale:   "Sur-mesure",
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
      expand: ["subscription", "invoice"],
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 })
    }

    const planId = session.metadata?.["plan_id"] ?? session.metadata?.["planId"]
    const dbPlan: DbPlan | undefined = planId ? PLAN_MAP[planId] : undefined

    if (!dbPlan) {
      return NextResponse.json({ error: "Plan introuvable dans la session" }, { status: 400 })
    }

    const customerId = typeof session.customer === "string" ? session.customer : undefined
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as { id?: string } | null)?.id

    // 1. Mise à jour du plan en DB
    await db.update(organizations)
      .set({
        plan: dbPlan,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      })
      .where(eq(organizations.id, orgId))

    // 2. Envoi de l'email de confirmation
    const customerEmail = session.customer_details?.email ?? session.customer_email
    if (customerEmail) {
      const planName = PLAN_LABELS[dbPlan]
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

    return NextResponse.json({ success: true, plan: dbPlan })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
