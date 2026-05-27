import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/emails/send"
import { teamInviteEmail } from "@/lib/emails/templates"
import { getAppUrl } from "@/lib/app-url"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // ── Auth caller ──────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const caller = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
      columns: { orgId: true, role: true, fullName: true, email: true },
    })
    if (!caller?.orgId) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
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

    // ── Vérifier doublon ─────────────────────────────────────────────────────
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, orgId: true },
    })
    if (existing) {
      if (existing.orgId === caller.orgId) {
        return NextResponse.json({ error: "Ce membre fait déjà partie de l'équipe" }, { status: 409 })
      }
      return NextResponse.json({ error: "Cet email est déjà utilisé sur Lynaris" }, { status: 409 })
    }

    // ── Org name pour l'email ────────────────────────────────────────────────
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, caller.orgId),
      columns: { name: true },
    })

    // ── generateLink — crée l'auth user SANS envoyer d'email Supabase ────────
    // inviteUserByEmail délègue l'envoi à Supabase SMTP (souvent non configuré).
    // generateLink retourne l'action_link qu'on envoie nous-mêmes via Resend/Gmail.
    const appUrl = getAppUrl()
    const supabaseAdmin = createSupabaseAdminClient()

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${appUrl}/api/auth/callback`,
        data: {
          full_name: fullName ?? "",
          org_id: caller.orgId,
          role,
        },
      },
    })

    if (linkError || !linkData?.user?.id) {
      return NextResponse.json(
        { error: linkError?.message ?? "Impossible de générer le lien d'activation" },
        { status: 400 }
      )
    }

    const authUserId = linkData.user.id
    // hashed_token → verifyOtp côté client, pas besoin de PKCE
    // action_link utilise le flow Supabase natif qui redirige avec hash fragment
    // (non lisible côté serveur). On construit notre propre URL cliente à la place.
    const hashed_token = linkData.properties.hashed_token
    const activationLink = `${appUrl}/accept-invite?token_hash=${encodeURIComponent(hashed_token)}&type=invite`

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

    // ── Envoyer l'email via notre propre provider (Resend / Gmail SMTP) ──────
    const inviterName = caller.fullName ?? caller.email
    const emailResult = await sendEmail({
      to: email,
      from: "Lynaris <support@lynarisai.com>",
      template: teamInviteEmail({
        orgName: org?.name ?? "votre espace Lynaris",
        inviterName,
        role: role as "admin" | "member",
        signupUrl: activationLink,
      }),
      tags: ["team-invite"],
    })

    if (!emailResult.success) {
      // L'utilisateur est créé en DB mais l'email n'est pas parti — on renvoie
      // quand même succès car le profil existe. On log l'erreur email.
      console.error("[create-member] Email non envoyé:", emailResult.error)
    }

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
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
