import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { organizations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// UUID de fallback quand l'user n'est pas authentifié (lecture seule — pas d'INSERT)
export const ANON_ORG_ID = "00000000-0000-0000-0000-000000000001"

/**
 * Retourne l'org_id de l'utilisateur authentifié.
 * Si l'org n'existe pas encore en DB (premier appel), elle est créée automatiquement.
 * Retourne ANON_ORG_ID si non authentifié (opérations en lecture seule uniquement).
 */
export async function getOrProvisionOrgId(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* route handlers — cookies déjà envoyés */ },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return ANON_ORG_ID

    // Cherche l'org existante
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })
    if (userRow?.orgId) return userRow.orgId

    // ── Auto-provisionnement au premier appel API ─────────────────────────────
    const orgId = crypto.randomUUID()
    const emailDomain = user.email?.split("@")[1]?.split(".")[0] ?? "org"
    const orgName = user.user_metadata?.company_name
      ?? user.user_metadata?.full_name?.split(" ")[0]
      ?? emailDomain
    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${orgId.slice(0, 8)}`

    await db.insert(organizations).values({
      id: orgId,
      name: String(orgName),
      slug,
      plan: "trial",
    }).onConflictDoNothing()

    await db.insert(users).values({
      id: user.id,
      orgId,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: "owner",
    }).onConflictDoNothing()

    return orgId
  } catch {
    return ANON_ORG_ID
  }
}
