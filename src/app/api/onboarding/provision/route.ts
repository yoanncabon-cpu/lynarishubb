import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { organizations, users, agentInstances } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// ─── Schéma de validation ─────────────────────────────────────────────────────

const bodySchema = z.object({
  orgName: z.string().min(1, "Le nom de l'organisation est requis").max(120),
  firstName: z.string().max(80).optional(),
  sector: z.string().min(1),
  plan: z.string().min(1),
  enabledAgents: z.array(z.string()).min(1, "Au moins un agent requis"),
})

// ─── Map plan UI → planEnum DB ────────────────────────────────────────────────
// Le schéma DB conserve l'enum ["trial", "starter", "pro", "scale"] pour
// la rétrocompatibilité. Le mapping UI → DB est :
//   - decouverte → trial   (essai gratuit 14j)
//   - pro        → pro
//   - custom     → scale   (ancien Scale, sert maintenant pour Sur-mesure)
// Les anciens identifiants 'essentiel'/'cabinet' restent acceptés pour
// la rétrocompat des liens externes ou anciens onboardings.

const PLAN_MAP: Record<string, "trial" | "starter" | "pro" | "scale"> = {
  // Nouvelle nomenclature (3 plans)
  decouverte: "trial",
  pro:        "pro",
  custom:     "scale",
  // Anciennes valeurs UI (rétrocompat)
  essentiel:  "pro",   // Migration douce : Essentiel devient Pro
  cabinet:    "scale",
  // Valeurs DB raw (passthrough)
  trial:      "trial",
  starter:    "pro",   // Migration douce : starter (ancien Essentiel) → pro
  scale:      "scale",
}

function mapPlan(rawPlan: string): "trial" | "starter" | "pro" | "scale" {
  return PLAN_MAP[rawPlan.toLowerCase()] ?? "trial"
}

// ─── Route POST /api/onboarding/provision ────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authentification
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError ?? !user?.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    )
  }

  // 2. Validation du body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { orgName, firstName, sector, plan, enabledAgents } = parsed.data

  // 3. Idempotence — si l'user a déjà une org, on retourne sans créer
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { orgId: true },
  })

  if (existingUser?.orgId) {
    return NextResponse.json(
      { success: true, orgId: existingUser.orgId, orgEmail: user.email, alreadyExists: true },
      { status: 200 }
    )
  }

  // 4. Création de l'org
  const orgId = crypto.randomUUID()
  const dbPlan = mapPlan(plan)
  const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)}-${orgId.slice(0, 8)}`
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  await db.insert(organizations).values({
    id: orgId,
    name: orgName,
    slug,
    plan: dbPlan,
    trialEndsAt,
    settings: { sector },
  }).onConflictDoNothing()

  // 5. Création du user
  const fullName =
    firstName ??
    (user.user_metadata?.full_name as string | undefined) ??
    null

  await db.insert(users).values({
    id: user.id,
    orgId,
    email: user.email ?? "",
    fullName,
    role: "owner",
  }).onConflictDoNothing()

  // 6. Activation des agents sélectionnés
  if (enabledAgents.length > 0) {
    await db
      .insert(agentInstances)
      .values(
        enabledAgents.map((slug) => ({
          orgId,
          agentSlug: slug,
          isActive: true,
        }))
      )
      .onConflictDoNothing()
  }

  return NextResponse.json({ success: true, orgId, orgEmail: user.email }, { status: 201 })
}
