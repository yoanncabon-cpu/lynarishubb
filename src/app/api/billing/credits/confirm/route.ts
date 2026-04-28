export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { sendEmail } from "@/lib/emails/send"
import { z } from "zod"

const schema = z.object({
  sessionId: z.string().min(1),
  amount: z.number().min(1),
  type: z.enum(["phone", "api"]),
})

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 422 })
  }

  const { sessionId, amount, type } = parsed.data
  const label = type === "phone" ? "Crédits Téléphoniques" : "Crédits API"

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
    apiVersion: "2026-03-25.dahlia",
  })

  try {
    // Vérifier le paiement auprès de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Paiement non confirmé" }, { status: 400 })
    }

    // Mettre à jour les crédits en DB — idempotent via processed_recharges
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { settings: true },
    })
    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const processed = Array.isArray(settings["processed_recharges"])
      ? (settings["processed_recharges"] as string[])
      : []

    const key = type === "phone" ? "phone_credits" : "api_credits"
    const current = (typeof settings[key] === "number" ? settings[key] : 0) as number

    // Si déjà traité (webhook arrivé avant), on retourne le solde sans re-créditer
    if (processed.includes(sessionId)) {
      return NextResponse.json({ success: true, newBalance: current, alreadyProcessed: true })
    }

    const newBalance = Math.round((current + amount) * 100) / 100
    const updated = {
      ...settings,
      [key]: newBalance,
      processed_recharges: [...processed, sessionId],
    }

    await db.update(organizations).set({ settings: updated }).where(eq(organizations.id, orgId))

    // Envoyer l'email de confirmation
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const customerEmail = user?.email ?? session.customer_details?.email

    if (customerEmail) {
      const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? customerEmail.split("@")[0]
      const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

      // Import dynamique du layout email
      const { emailLayout, emailButton } = await import("@/lib/emails/base-layout")

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
              <td style="font-size:13px;color:#34D399;text-align:right;padding:6px 0;font-weight:700">+${amount.toFixed(2)} €</td>
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

        ${emailButton("Voir mon solde", `${process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"}/dashboard/billing`)}
      `)

      await sendEmail({
        to: customerEmail,
        template: { subject: `✓ Recharge ${label} — ${amount.toFixed(2)} €`, html, text: `Recharge ${label} de ${amount}€ confirmée. Nouveau solde : ${newBalance.toFixed(2)}€.` },
        tags: ["credit-recharge"],
      }).catch(e => console.error("[credits/confirm] email failed:", e))
    }

    return NextResponse.json({ success: true, newBalance })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
