import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail } from "@/lib/emails/send"
import { teamRemovalEmail } from "@/lib/emails/templates"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCallerContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const caller = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, orgId: true, role: true },
  })
  return caller ?? null
}

// ─── GET — liste des membres ──────────────────────────────────────────────────

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Récupère l'orgId de l'utilisateur courant
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { orgId: true },
  })

  if (!currentUser?.orgId) {
    return NextResponse.json({ members: [] })
  }

  const rows = await db.query.users.findMany({
    where: eq(users.orgId, currentUser.orgId),
    columns: { id: true, email: true, fullName: true, role: true, createdAt: true },
  })

  return NextResponse.json({ members: rows })
}

// ─── PATCH — changer le rôle d'un membre ─────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const caller = await getCallerContext()
  if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (caller.role !== "owner" && caller.role !== "admin") {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const body = await request.json() as { userId?: string; role?: string }
  const { userId, role } = body

  if (!userId || !role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "userId et role requis" }, { status: 400 })
  }

  // Vérifier que la cible appartient à la même org
  const target = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.orgId, caller.orgId)),
    columns: { id: true, role: true },
  })
  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
  if (target.role === "owner") {
    return NextResponse.json({ error: "Impossible de modifier le rôle du propriétaire" }, { status: 403 })
  }

  await db
    .update(users)
    .set({ role: role as "admin" | "member" })
    .where(and(eq(users.id, userId), eq(users.orgId, caller.orgId)))

  return NextResponse.json({ success: true })
}

// ─── DELETE — retirer un membre ───────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const caller = await getCallerContext()
  if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (caller.role !== "owner" && caller.role !== "admin") {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const body = await request.json() as { userId?: string }
  const { userId } = body

  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })
  if (userId === caller.id) {
    return NextResponse.json({ error: "Impossible de se retirer soi-même" }, { status: 400 })
  }

  const target = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.orgId, caller.orgId)),
    columns: { id: true, role: true, email: true, fullName: true },
  })
  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
  if (target.role === "owner") {
    return NextResponse.json({ error: "Impossible de retirer le propriétaire" }, { status: 403 })
  }

  // Récupérer le nom de l'org et du caller pour l'email
  const [org, callerUser] = await Promise.all([
    db.query.organizations.findFirst({
      where: eq(organizations.id, caller.orgId),
      columns: { name: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, caller.id),
      columns: { fullName: true, email: true },
    }),
  ])

  // Envoyer l'email de notification AVANT la suppression
  void sendEmail({
    to: target.email,
    from: "Lynaris <support@lynarisai.com>",
    template: teamRemovalEmail({
      memberName: target.fullName ?? target.email.split("@")[0] ?? "Membre",
      orgName: org?.name ?? "votre espace Lynaris",
      removedByName: callerUser?.fullName ?? callerUser?.email ?? "L'administrateur",
    }),
    tags: ["team-removal"],
  })

  // Supprimer de la table users (retire de l'org)
  await db
    .delete(users)
    .where(and(eq(users.id, userId), eq(users.orgId, caller.orgId)))

  // Révoquer le compte auth Supabase
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    await supabaseAdmin.auth.admin.deleteUser(userId)
  } catch { /* non-bloquant */ }

  return NextResponse.json({ success: true })
}

