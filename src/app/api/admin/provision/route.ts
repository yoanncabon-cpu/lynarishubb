import { NextResponse } from "next/server"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/db"
import { organizations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { sendGmail } from "@/lib/emails/gmail"
import { emailLayout, emailButton } from "@/lib/emails/base-layout"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  orgName: z.string().min(1),
  plan: z.enum(["starter", "pro", "scale"]),
  notes: z.string().optional(),
})

// Labels affichés dans l'email de provisionnement.
// Migration douce : ancien 'starter' → affiché "Pro" ; 'scale' → "Sur-mesure".
const PLAN_LABELS: Record<string, string> = {
  starter: "Pro",
  pro: "Pro",
  scale: "Sur-mesure",
}

export async function POST(req: Request) {
  const admin = await isLynarisAdmin()
  if (!admin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 422 })
  }

  const { email, fullName, orgName, plan } = parsed.data
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"
  const firstName = fullName.split(" ")[0] ?? fullName

  const supabaseAdmin = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // 1. Vérifier si l'user existe déjà
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuth = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingAuth) {
      userId = existingAuth.id
    } else {
      // Créer l'user SANS envoyer d'email Supabase (email_confirm: false)
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { full_name: fullName },
      })
      if (createError || !created.user) {
        return NextResponse.json({ error: createError?.message ?? "Erreur création user" }, { status: 400 })
      }
      userId = created.user.id
    }

    // 2. Générer un lien de définition de mot de passe (recovery = set password)
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${appUrl}/dashboard` },
    })
    const activationUrl = linkData?.properties?.action_link ?? `${appUrl}/login`

    // 3. DB — org + user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { orgId: true },
    })

    let orgId: string

    if (existingUser?.orgId) {
      await db.update(organizations)
        .set({ plan: plan as "starter" | "pro" | "scale", name: orgName })
        .where(eq(organizations.id, existingUser.orgId))
      orgId = existingUser.orgId
    } else {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) + "-" + Math.random().toString(36).slice(2, 6)

      const [org] = await db.insert(organizations).values({
        name: orgName,
        slug,
        plan: plan as "starter" | "pro" | "scale",
      }).returning({ id: organizations.id })

      if (!org) return NextResponse.json({ error: "Erreur création organisation." }, { status: 500 })
      orgId = org.id

      await db.insert(users).values({
        id: userId,
        orgId,
        email: email.toLowerCase(),
        fullName,
        role: "owner",
        onboardingCompleted: false,
      }).onConflictDoUpdate({
        target: users.id,
        set: { orgId, fullName, role: "owner" },
      })
    }

    // 4. Envoyer notre email Lynaris brandé via Resend
    const planLabel = PLAN_LABELS[plan] ?? plan
    const html = emailLayout(`
      <h2 style="font-size:22px;font-weight:700;color:#FAFAFA;margin:0 0 8px;letter-spacing:-0.02em">
        Bienvenue sur Lynaris, ${firstName}&nbsp;!
      </h2>
      <p style="font-size:14px;color:rgba(250,250,250,0.6);margin:0 0 24px;line-height:1.7">
        Ton compte <strong style="color:#FAFAFA">${orgName}</strong> a été créé avec le plan
        <strong style="color:#F59E0B">${planLabel}</strong>.<br>
        Clique ci-dessous pour définir ton mot de passe et accéder à ton dashboard.
      </p>

      ${emailButton("Activer mon compte →", activationUrl)}

      <div style="margin-top:28px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px">
        <p style="font-size:11px;color:rgba(250,250,250,0.35);margin:0 0 8px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Tes informations de connexion</p>
        <p style="font-size:14px;color:#FAFAFA;margin:0"><strong style="color:rgba(250,250,250,0.55)">Email :</strong> ${email}</p>
        <p style="font-size:14px;color:#FAFAFA;margin:6px 0 0"><strong style="color:rgba(250,250,250,0.55)">Organisation :</strong> ${orgName}</p>
        <p style="font-size:14px;color:#F59E0B;margin:6px 0 0;font-weight:700"><strong style="color:rgba(250,250,250,0.55);font-weight:400">Plan :</strong> ${planLabel}</p>
      </div>

      <p style="font-size:12px;color:rgba(250,250,250,0.3);margin:20px 0 0;line-height:1.6">
        Ce lien est valable 24h. Si tu as des questions, réponds directement à cet email.
      </p>
    `)

    const emailResult = await sendGmail({
      to: email,
      subject: `Bienvenue sur Lynaris — Active ton compte ${planLabel}`,
      html,
      text: `Bonjour ${firstName}, ton compte Lynaris (${planLabel}) est prêt. Active-le ici : ${activationUrl}`,
      replyTo: "support@lynarisai.com",
    })

    console.info("[provision] email result:", emailResult)

    return NextResponse.json({
      success: true,
      action: existingUser?.orgId ? "plan_updated" : "account_created",
      emailSent: emailResult.success,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    console.error("[admin/provision]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
