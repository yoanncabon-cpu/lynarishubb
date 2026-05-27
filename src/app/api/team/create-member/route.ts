import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // ── Auth caller ──────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const caller = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true, role: true },
    })
    if (!caller) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    if (caller.role !== "owner" && caller.role !== "admin") {
      return NextResponse.json({ error: "Permissions insuffisantes — rôle owner ou admin requis" }, { status: 403 })
    }

    // ── Parse + validate body ────────────────────────────────────────────────
    const body = await request.json() as {
      email?: string
      fullName?: string
      role?: string
      jobTitle?: string
    }

    const email = (body.email ?? "").trim().toLowerCase()
    const fullName = (body.fullName ?? "").trim() || null
    const role = body.role ?? "member"

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 })
    }
    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    // ── Vérifier que l'email n'existe pas déjà dans cette org ───────────────
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, orgId: true },
    })
    if (existing) {
      if (existing.orgId === caller.orgId) {
        return NextResponse.json({ error: "Ce membre fait déjà partie de l'équipe" }, { status: 409 })
      }
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    // ── Supabase admin invite ────────────────────────────────────────────────
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://app.lynaris.ai"
    const supabaseAdmin = createSupabaseAdminClient()

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/api/auth/callback`,
      data: {
        full_name: fullName ?? "",
        org_id: caller.orgId,
        role,
      },
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    const authUserId = inviteData?.user?.id
    if (!authUserId) {
      return NextResponse.json({ error: "Impossible de créer le profil — réessaie" }, { status: 500 })
    }

    // ── Insérer dans la table users (profil réel immédiat) ───────────────────
    const [newUser] = await db
      .insert(users)
      .values({
        id: authUserId,
        orgId: caller.orgId,
        email,
        fullName,
        role: role as "admin" | "member",
        onboardingCompleted: false,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          orgId: caller.orgId,
          fullName,
          role: role as "admin" | "member",
        },
      })
      .returning()

    return NextResponse.json({
      success: true,
      member: {
        id: newUser?.id ?? authUserId,
        email,
        fullName,
        role,
        status: "invited",
        createdAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
