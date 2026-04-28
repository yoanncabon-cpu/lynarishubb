import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Labels et prix affichés depuis la valeur DB.
// Migration douce : ancien 'starter' → "Pro" ; 'scale' → "Sur-mesure".
const PLAN_LABELS: Record<string, string> = {
  trial: "Découverte",
  starter: "Pro",
  pro: "Pro",
  scale: "Sur-mesure",
}

const PLAN_PRICES: Record<string, string> = {
  trial: "Gratuit (essai 14 j)",
  starter: "149,00 € HT / mois",
  pro: "149,00 € HT / mois",
  scale: "Sur devis",
}

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError ?? !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })

    if (!dbUser?.orgId) {
      return NextResponse.json({ plan: null, message: "Aucune organisation trouvée" })
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, dbUser.orgId),
      columns: {
        plan: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        name: true,
        createdAt: true,
      },
    })

    if (!org) {
      return NextResponse.json({ plan: null })
    }

    return NextResponse.json({
      plan: org.plan,
      planLabel: PLAN_LABELS[org.plan] ?? org.plan,
      planPrice: PLAN_PRICES[org.plan] ?? "—",
      orgName: org.name,
      trialEndsAt: org.trialEndsAt,
      hasStripeCustomer: !!org.stripeCustomerId,
      stripeCustomerId: org.stripeCustomerId,
      stripeSubscriptionId: org.stripeSubscriptionId,
      createdAt: org.createdAt,
    })
  } catch (err) {
    console.error("[settings/billing] DB error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ plan: null, error: "DB unavailable" }, { status: 500 })
  }
}
