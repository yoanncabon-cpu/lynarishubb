import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/emails/send"
import {
  welcomeEmail,
} from "@/lib/emails/templates"
import {
  paymentSuccess,
  paymentFailed,
  subscriptionRenewed,
  subscriptionCancelled,
  planChanged,
} from "@/lib/emails/stripe-templates"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature") ?? ""
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"] ?? ""

  // Dynamically import stripe to avoid edge runtime issues
  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
    apiVersion: "2026-03-25.dahlia",
  })

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error"
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"

  // Résout un price ID vers le nom de plan lisible et l'identifiant DB.
  // Nouvelle nomenclature 3 plans :
  //   - PRO_MONTHLY/YEARLY → dbPlan="pro", displayName="Pro"
  //   - Sur-mesure géré hors Stripe (devis manuel) → dbPlan="scale" via /api/billing/activate
  // Anciens price IDs (STARTER, ESSENTIEL, CABINET) conservés pour rétrocompat
  // des subscriptions existantes — mappés vers la nouvelle nomenclature.
  function resolvePlan(priceId: string | undefined): {
    dbPlan: "starter" | "pro" | "scale" | undefined
    displayName: string
  } {
    const map: Record<string, { dbPlan: "starter" | "pro" | "scale"; displayName: string }> = {
      // Anciens IDs Essentiel (rétrocompat) → affichés comme Pro
      [process.env["STRIPE_PRICE_STARTER_MONTHLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      [process.env["STRIPE_PRICE_STARTER_YEARLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      [process.env["STRIPE_PRICE_ESSENTIEL_MONTHLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      [process.env["STRIPE_PRICE_ESSENTIEL_YEARLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      // Pro (nouveau pricing 149€/127€)
      [process.env["STRIPE_PRICE_PRO_MONTHLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      [process.env["STRIPE_PRICE_PRO_YEARLY"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      [process.env["STRIPE_PRICE_PRO"] ?? "_"]: { dbPlan: "pro", displayName: "Pro" },
      // Sur-mesure (anciens cabinet/scale)
      [process.env["STRIPE_PRICE_CABINET_MONTHLY"] ?? "_"]: { dbPlan: "scale", displayName: "Sur-mesure" },
      [process.env["STRIPE_PRICE_SCALE"] ?? "_"]: { dbPlan: "scale", displayName: "Sur-mesure" },
    }
    if (!priceId) return { dbPlan: undefined, displayName: "Pro" }
    return map[priceId] ?? { dbPlan: undefined, displayName: "Pro" }
  }

  function fmtDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const orgId = session.metadata?.["org_id"]
      const action = session.metadata?.["action"]
      const customerEmail = session.customer_email ?? session.customer_details?.email

      console.info("[Stripe] Checkout completed", { orgId, sessionId: session.id, action })

      // ── Credit recharge (phone or API) ──────────────────────────────
      if (action === "credit_recharge" && orgId) {
        const creditType = session.metadata?.["credit_type"] as "phone" | "api" | undefined
        const amountEur = parseFloat(session.metadata?.["amount_eur"] ?? "0")

        if (creditType && amountEur > 0) {
          try {
            const { db } = await import("@/lib/db")
            const { organizations } = await import("@/lib/db/schema")
            const { eq } = await import("drizzle-orm")

            const org = await db.query.organizations.findFirst({
              where: eq(organizations.id, orgId),
              columns: { settings: true },
            })
            const settings = ((org?.settings ?? {}) as Record<string, number>)
            const key = creditType === "phone" ? "phone_credits" : "api_credits"
            const current = (settings[key] ?? 0) as number
            const updated = { ...settings, [key]: Math.round((current + amountEur) * 100) / 100 }

            await db.update(organizations)
              .set({ settings: updated })
              .where(eq(organizations.id, orgId))

            console.info("[Stripe] Credits added", { orgId, creditType, amountEur, newBalance: updated[key] })
          } catch (err) {
            console.error("[Stripe] Failed to update credits", err)
          }
        }
        break
      }

      // ── New subscription — activate plan in DB ───────────────────────
      let activatedPlanName = "Pro"
      if (orgId && action !== "credit_recharge") {
        try {
          const { db } = await import("@/lib/db")
          const { organizations } = await import("@/lib/db/schema")
          const { eq } = await import("drizzle-orm")

          const priceId = session.metadata?.["price_id"]
          const { dbPlan, displayName } = resolvePlan(priceId)
          activatedPlanName = displayName

          if (dbPlan) {
            const customerId = typeof session.customer === "string" ? session.customer : undefined
            await db
              .update(organizations)
              .set({
                plan: dbPlan,
                ...(customerId ? { stripeCustomerId: customerId } : {}),
              })
              .where(eq(organizations.id, orgId))
            console.info("[Stripe] Org plan activated", { orgId, plan: dbPlan })
          }
        } catch (err) {
          console.error("[Stripe] Failed to activate org plan", err)
        }
      }

      if (!customerEmail) break

      // ── Welcome email ────────────────────────────────────────────────
      try {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 7)
        const trialEndsAt = trialEnd.toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        })
        await sendEmail({
          to: customerEmail,
          template: welcomeEmail({ name: customerEmail.split("@")[0] ?? "Client", trialEndsAt }),
          tags: ["welcome"],
        })
      } catch (err) {
        console.error("[Stripe] Failed to send welcome email", err)
      }

      // ── Confirmation de paiement (si invoice présente) ───────────────
      if (session.invoice && session.amount_total !== null && (session.amount_total ?? 0) > 0) {
        try {
          const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice.id
          const invoice = await stripe.invoices.retrieve(invoiceId)
          const periodStart = invoice.period_start ? fmtDate(invoice.period_start) : ""
          const periodEnd = invoice.period_end ? fmtDate(invoice.period_end) : ""
          const amount = (session.amount_total ?? 0) / 100

          await sendEmail({
            to: customerEmail,
            template: paymentSuccess({
              customerEmail,
              amount,
              currency: session.currency ?? "eur",
              planName: activatedPlanName,
              invoiceId: invoice.id ?? invoiceId,
              invoiceUrl: invoice.hosted_invoice_url ?? undefined,
              periodStart,
              periodEnd,
            }),
            tags: ["payment-success"],
          })
        } catch (err) {
          console.error("[Stripe] Failed to send payment confirmation email", err)
        }
      }
      break
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id
      const status = subscription.status
      const priceId = subscription.items?.data?.[0]?.price?.id
      const prevPriceId = (
        event.data.previous_attributes as
          | { items?: { data?: Array<{ price?: { id?: string } }> } }
          | undefined
      )?.items?.data?.[0]?.price?.id

      console.info("[Stripe] Subscription updated", {
        subscriptionId: subscription.id,
        customerId,
        status,
        priceId,
      })

      const { dbPlan: newDbPlan, displayName: newDisplayName } = resolvePlan(priceId)
      const { displayName: oldDisplayName } = resolvePlan(prevPriceId)

      try {
        const { db } = await import("@/lib/db")
        const { organizations } = await import("@/lib/db/schema")
        const { eq } = await import("drizzle-orm")

        if (customerId && newDbPlan) {
          await db
            .update(organizations)
            .set({ plan: newDbPlan })
            .where(eq(organizations.stripeCustomerId, customerId))
          console.info("[Stripe] Org plan updated", { customerId, plan: newDbPlan, status })
        }
      } catch (err) {
        console.error("[Stripe] Failed to update org on subscription update", err)
      }

      // Email changement de plan — seulement si le price a changé
      if (prevPriceId && prevPriceId !== priceId && customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId)
          const customerEmail =
            !customer.deleted && "email" in customer ? (customer.email ?? undefined) : undefined

          if (customerEmail) {
            const newAmount = (subscription.items?.data?.[0]?.price?.unit_amount ?? 0) / 100
            const effectiveDate = new Date().toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })
            await sendEmail({
              to: customerEmail,
              template: planChanged({
                customerEmail,
                oldPlan: oldDisplayName,
                newPlan: newDisplayName,
                newAmount,
                effectiveDate,
              }),
              tags: ["plan-changed"],
            })
          }
        } catch (err) {
          console.error("[Stripe] Failed to send plan changed email", err)
        }
      }
      break
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id
      const priceId = subscription.items?.data?.[0]?.price?.id
      const { displayName: planName } = resolvePlan(priceId)

      console.info("[Stripe] Subscription deleted", {
        subscriptionId: subscription.id,
        customerId,
      })

      try {
        const { db } = await import("@/lib/db")
        const { organizations } = await import("@/lib/db/schema")
        const { eq } = await import("drizzle-orm")

        if (customerId) {
          await db
            .update(organizations)
            .set({ plan: "trial" })
            .where(eq(organizations.stripeCustomerId, customerId))
          console.info("[Stripe] Org downgraded to trial", { customerId })
        }
      } catch (err) {
        console.error("[Stripe] Failed to downgrade org on subscription deleted", err)
      }

      // Email annulation avec date d'accès restant
      if (customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId)
          const customerEmail =
            !customer.deleted && "email" in customer ? (customer.email ?? undefined) : undefined

          if (customerEmail) {
            // cancel_at = fin de période payée, sinon current_period_end de l'item
            const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end
            const accessTs = subscription.cancel_at ?? itemPeriodEnd ?? null
            const accessUntil = accessTs
              ? fmtDate(accessTs)
              : new Date().toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })

            await sendEmail({
              to: customerEmail,
              template: subscriptionCancelled({
                customerEmail,
                planName,
                accessUntil,
                reactivateUrl: `${appUrl}/dashboard/billing`,
              }),
              tags: ["subscription-cancelled"],
            })
          }
        } catch (err) {
          console.error("[Stripe] Failed to send cancellation email", err)
        }
      }
      break
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object
      const customerEmail =
        typeof invoice.customer_email === "string"
          ? invoice.customer_email
          : null
      console.info("[Stripe] Payment succeeded", { invoiceId: invoice.id })

      if (!customerEmail) break

      // Premier paiement = déjà traité par checkout.session.completed
      // On envoie ici uniquement pour les renouvellements (subscription_cycle)
      if (invoice.billing_reason === "subscription_cycle") {
        try {
          const lineItem = invoice.lines?.data?.[0]
          const priceRef = lineItem?.pricing?.price_details?.price
          const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id
          const { displayName: planName } = resolvePlan(priceId)
          const amountCents = invoice.amount_paid ?? 0
          const amount = amountCents / 100
          const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : new Date()
          // Prochaine échéance estimée à +1 mois
          const nextRenewalDate = new Date(periodEnd)
          nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1)
          const nextRenewal = nextRenewalDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })

          await sendEmail({
            to: customerEmail,
            template: subscriptionRenewed({
              customerEmail,
              amount,
              planName,
              nextRenewal,
              invoiceUrl: invoice.hosted_invoice_url ?? undefined,
            }),
            tags: ["subscription-renewed"],
          })
        } catch (err) {
          console.error("[Stripe] Failed to send renewal email", err)
        }
      }
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object
      const customerEmail =
        typeof invoice.customer_email === "string"
          ? invoice.customer_email
          : null
      console.info("[Stripe] Payment failed", { invoiceId: invoice.id })

      if (!customerEmail) break

      try {
        const failedLineItem = invoice.lines?.data?.[0]
        const failedPriceRef = failedLineItem?.pricing?.price_details?.price
        const priceId = typeof failedPriceRef === "string" ? failedPriceRef : failedPriceRef?.id
        const { displayName: planName } = resolvePlan(priceId)

        // Génère un lien portail Stripe si possible
        let updatePaymentUrl = `${appUrl}/dashboard/billing`
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : undefined
        if (customerId) {
          try {
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: `${appUrl}/dashboard/billing`,
            })
            updatePaymentUrl = portalSession.url
          } catch {
            // Portail non configuré — URL dashboard en fallback
          }
        }

        const amountCents = invoice.amount_due ?? 0
        const amount = amountCents / 100

        // Prochaine tentative Stripe (généralement +3 jours)
        const nextAttempt = invoice.next_payment_attempt
        const retryDate = nextAttempt ? `le ${fmtDate(nextAttempt)}` : undefined

        await sendEmail({
          to: customerEmail,
          template: paymentFailed({
            customerEmail,
            amount,
            planName,
            retryDate,
            updatePaymentUrl,
          }),
          tags: ["payment-failed"],
        })
      } catch (err) {
        console.error("[Stripe] Failed to send payment failed email", err)
      }
      break
    }
    default:
      console.info("[Stripe] Unhandled event", { type: event.type })
  }

  return NextResponse.json({ received: true })
}
