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
import {
  getPlanFromStripePriceId,
  isVoicePackPriceId,
} from "@/lib/pricing/stripe-resolver"
import { PLANS, type PlanId } from "@/lib/pricing/plans"
import { addVoicePackMinutes } from "@/lib/usage/service"

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

  // Résout un Stripe price_id vers PlanId + displayName.
  // Source de vérité : src/lib/pricing/stripe-resolver.ts
  function resolvePlan(priceId: string | undefined): {
    planId: PlanId | null
    displayName: string
  } {
    if (!priceId) return { planId: null, displayName: "Pro" }
    const planId = getPlanFromStripePriceId(priceId)
    if (planId === null) return { planId: null, displayName: "Pro" }
    return { planId, displayName: PLANS[planId].name }
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

      // ── Voice pack Marine purchase (option Starter) ──────────────────
      if (action === "voice_pack_purchase" && orgId) {
        const minutes = parseInt(session.metadata?.["minutes"] ?? "0", 10)
        if (minutes > 0) {
          try {
            const { db } = await import("@/lib/db")
            const { organizations } = await import("@/lib/db/schema")
            const { eq } = await import("drizzle-orm")

            const org = await db.query.organizations.findFirst({
              where: eq(organizations.id, orgId),
              columns: { settings: true },
            })
            const settings = (org?.settings ?? {}) as Record<string, unknown>
            const processed = Array.isArray(settings["processed_voice_packs"])
              ? (settings["processed_voice_packs"] as string[])
              : []

            if (processed.includes(session.id)) {
              console.info("[Stripe] Voice pack déjà traité — skip", { orgId, sessionId: session.id })
              break
            }

            const result = await addVoicePackMinutes(orgId, minutes)

            await db.update(organizations)
              .set({
                settings: {
                  ...settings,
                  processed_voice_packs: [...processed, session.id],
                },
              })
              .where(eq(organizations.id, orgId))

            console.info("[Stripe] Voice pack credited", {
              orgId,
              minutes,
              newBalance: result.newBalance,
            })
          } catch (err) {
            console.error("[Stripe] Failed to credit voice pack", err)
          }
        }
        break
      }

      // ── Credit recharge (phone or API) ──────────────────────────────
      // Filet de sécurité : si l'utilisateur ferme l'onglet avant le retour
      // sur /dashboard/billing, le flow primaire (`/api/billing/credits/confirm`)
      // n'est pas appelé. Le webhook prend alors le relais.
      // Idempotence : `settings.processed_recharges` stocke les session.id
      // déjà traités, pour éviter le double-crédit + double-email si les deux
      // flows s'exécutent.
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
            const settings = (org?.settings ?? {}) as Record<string, unknown>
            const processed = Array.isArray(settings["processed_recharges"])
              ? (settings["processed_recharges"] as string[])
              : []

            if (processed.includes(session.id)) {
              console.info("[Stripe] Recharge déjà traitée — skip", { orgId, sessionId: session.id })
              break
            }

            const key = creditType === "phone" ? "phone_credits" : "api_credits"
            const current = (typeof settings[key] === "number" ? settings[key] : 0) as number
            const newBalance = Math.round((current + amountEur) * 100) / 100
            const updated = {
              ...settings,
              [key]: newBalance,
              processed_recharges: [...processed, session.id],
            }

            await db.update(organizations)
              .set({ settings: updated })
              .where(eq(organizations.id, orgId))

            console.info("[Stripe] Credits added (webhook)", { orgId, creditType, amountEur, newBalance })

            // Email de confirmation — même template que le flow client
            if (customerEmail) {
              try {
                const { emailLayout, emailButton } = await import("@/lib/emails/base-layout")
                const label = creditType === "phone" ? "Crédits Téléphoniques" : "Crédits API"
                const name = customerEmail.split("@")[0] ?? "Client"
                const dateStr = new Date().toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })
                const html = emailLayout(`
                  <h2 style="font-size:20px;font-weight:700;color:#FAFAFA;margin:0 0 8px">
                    Recharge confirmée ✓
                  </h2>
                  <p style="font-size:14px;color:rgba(250,250,250,0.6);margin:0 0 24px;line-height:1.6">
                    Bonjour ${name},<br>
                    Ta recharge de <strong style="color:#FAFAFA">${label}</strong> a bien été effectuée.
                  </p>

                  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="font-size:13px;color:rgba(250,250,250,0.5);padding:6px 0">Type</td>
                        <td style="font-size:13px;color:#FAFAFA;text-align:right;padding:6px 0;font-weight:600">${label}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(250,250,250,0.5);padding:6px 0">Montant rechargé</td>
                        <td style="font-size:13px;color:#34D399;text-align:right;padding:6px 0;font-weight:700">+${amountEur.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(250,250,250,0.5);padding:6px 0">Nouveau solde</td>
                        <td style="font-size:13px;color:#FAFAFA;text-align:right;padding:6px 0;font-weight:700">${newBalance.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(250,250,250,0.5);padding:6px 0">Date</td>
                        <td style="font-size:13px;color:rgba(250,250,250,0.6);text-align:right;padding:6px 0">${dateStr}</td>
                      </tr>
                    </table>
                  </div>

                  ${emailButton("Voir mon solde", `${appUrl}/dashboard/billing`)}
                `)

                await sendEmail({
                  to: customerEmail,
                  template: {
                    subject: `✓ Recharge ${label} — ${amountEur.toFixed(2)} €`,
                    html,
                    text: `Recharge ${label} de ${amountEur}€ confirmée. Nouveau solde : ${newBalance.toFixed(2)}€.`,
                  },
                  tags: ["credit-recharge"],
                })
              } catch (err) {
                console.error("[Stripe] Failed to send recharge email", err)
              }
            }
          } catch (err) {
            console.error("[Stripe] Failed to process recharge", err)
          }
        }
        break
      }

      // ── New subscription — activate plan in DB ───────────────────────
      let activatedPlanName = "Pro"
      if (orgId && action !== "credit_recharge" && action !== "voice_pack_purchase") {
        try {
          const { db } = await import("@/lib/db")
          const { organizations } = await import("@/lib/db/schema")
          const { eq } = await import("drizzle-orm")
          const { planSchema } = await import("@/lib/pricing/plans")

          // Résolution du plan : 3 sources possibles, ordre de fiabilité
          //   1. metadata.plan_id (envoyé par /api/billing/checkout — slug UI)
          //   2. metadata.price_id (legacy — non envoyé par notre code actuel)
          //   3. subscription.items[0].price.id (retrieve subscription si besoin)
          let resolvedPlanId: PlanId | null = null
          let displayName = "Pro"

          const metaPlanRaw = session.metadata?.["plan_id"] ?? session.metadata?.["planId"]
          if (metaPlanRaw) {
            const parsed = planSchema.safeParse(metaPlanRaw)
            if (parsed.success) {
              resolvedPlanId = parsed.data
              displayName = PLANS[resolvedPlanId].name
            }
          }

          if (!resolvedPlanId) {
            const metaPriceId = session.metadata?.["price_id"]
            const r = resolvePlan(metaPriceId)
            if (r.planId !== null) {
              resolvedPlanId = r.planId
              displayName = r.displayName
            }
          }

          if (!resolvedPlanId && session.subscription) {
            const subId = typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
            if (subId) {
              try {
                const sub = await stripe.subscriptions.retrieve(subId)
                const subPriceId = sub.items?.data?.[0]?.price?.id
                const r = resolvePlan(subPriceId)
                if (r.planId !== null) {
                  resolvedPlanId = r.planId
                  displayName = r.displayName
                }
              } catch (e) {
                console.warn("[Stripe] subscription retrieve failed", e)
              }
            }
          }

          activatedPlanName = displayName

          if (resolvedPlanId !== null) {
            const customerId = typeof session.customer === "string" ? session.customer : undefined
            const billingMode = session.metadata?.["billing"] === "annual" ? "annual" : "monthly"
            await db
              .update(organizations)
              .set({
                planId: resolvedPlanId,
                planBillingCycle: billingMode,
                planActivatedAt: new Date(),
                ...(customerId ? { stripeCustomerId: customerId } : {}),
              })
              .where(eq(organizations.id, orgId))
            console.info("[Stripe] Org plan activated", { orgId, planId: resolvedPlanId, billingMode })
          } else {
            console.warn("[Stripe] Plan non résolu — checkout.session", { orgId, sessionId: session.id })
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

      const { planId: newPlanId, displayName: newDisplayName } = resolvePlan(priceId)
      const { displayName: oldDisplayName } = resolvePlan(prevPriceId)

      try {
        const { db } = await import("@/lib/db")
        const { organizations } = await import("@/lib/db/schema")
        const { eq } = await import("drizzle-orm")

        if (customerId && newPlanId !== null) {
          await db
            .update(organizations)
            .set({ planId: newPlanId, planActivatedAt: new Date() })
            .where(eq(organizations.stripeCustomerId, customerId))
          console.info("[Stripe] Org plan updated", { customerId, planId: newPlanId, status })
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
            .set({ planId: "discovery", planActivatedAt: new Date() })
            .where(eq(organizations.stripeCustomerId, customerId))
          console.info("[Stripe] Org downgraded to discovery", { customerId })
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
