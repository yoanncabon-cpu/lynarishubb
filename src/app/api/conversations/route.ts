export const dynamic = "force-dynamic"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, agentInstances, conversations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ conversations: [] })

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })
    if (!userRow?.orgId) return Response.json({ conversations: [] })

    const url = new URL(req.url)
    const agentSlug = url.searchParams.get("agent_slug")

    // Fetch conversations with agent_instance join
    let query = supabase
      .from("conversations")
      .select(`
        id,
        channel,
        started_at,
        ended_at,
        summary,
        metadata,
        agent_instance_id,
        agent_instances!inner(agent_slug, org_id)
      `)
      .eq("agent_instances.org_id", userRow.orgId)
      .order("started_at", { ascending: false })
      .limit(50)

    if (agentSlug) {
      query = query.eq("agent_instances.agent_slug", agentSlug)
    }

    const { data: convs, error } = await query
    if (error || !convs) return Response.json({ conversations: [] })

    // Fetch last message for each conversation
    const convIds = convs.map((c) => c.id)
    const { data: lastMsgs } = convIds.length > 0
      ? await supabase
          .from("messages")
          .select("conversation_id, content, role, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
      : { data: [] }

    // Build last message map
    const lastMsgMap: Record<string, { content: string; role: string; time: string }> = {}
    for (const msg of (lastMsgs ?? [])) {
      if (!lastMsgMap[msg.conversation_id]) {
        const content = typeof msg.content === "string"
          ? msg.content
          : (msg.content as { text?: string })?.text ?? ""
        lastMsgMap[msg.conversation_id] = {
          content: content.slice(0, 120),
          role: msg.role,
          time: msg.created_at,
        }
      }
    }

    const AGENT_COLORS: Record<string, string> = {
      marine: "#22D3EE", charles: "#A78BFA", lou: "#F472B6",
      elio: "#34D399", mae: "#FBBF24", max: "#FB923C",
      nova: "#818CF8", alba: "#C084FC",
    }

    const CHANNEL_LABEL: Record<string, string> = {
      voice: "Voix", chat: "Chat", email: "Email",
      whatsapp: "WhatsApp", internal: "Interne",
    }

    const result = convs.map((c) => {
      const instance = c.agent_instances as { agent_slug: string } | { agent_slug: string }[] | null
      const resolvedInstance = Array.isArray(instance) ? (instance[0] ?? null) : instance
      const slug = resolvedInstance?.agent_slug ?? "charles"
      const color = AGENT_COLORS[slug] ?? "#A78BFA"
      const lastMsg = lastMsgMap[c.id]
      const meta = (c.metadata ?? {}) as Record<string, string>

      return {
        id: c.id,
        title: c.summary ?? meta.title ?? ("Conversation " + CHANNEL_LABEL[c.channel ?? "chat"]),
        agent: slug.charAt(0).toUpperCase() + slug.slice(1),
        agentSlug: slug,
        agentColor: color,
        agents: [{ slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), color }],
        contact: meta.contact_name ?? "Contact",
        channel: c.channel ?? "chat",
        summary: c.summary ?? "",
        lastMessage: lastMsg?.content ?? "Pas encore de message",
        duration: "",
        time: c.started_at
          ? new Date(c.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          : "",
        status: c.ended_at ? "terminée" : "en cours",
        privacy: "private",
        messages: [],
      }
    })

    return Response.json(
      { conversations: result },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    )
  } catch {
    return Response.json({ conversations: [] })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Non autorise" }, { status: 401 })

    const { agent_slug } = await req.json() as { agent_slug: string }

    const userRow = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { orgId: true } })
    const orgId = userRow?.orgId
    if (!orgId) return Response.json({ error: "Organisation introuvable" }, { status: 404 })

    // Upsert agent_instance via Drizzle (bypasses RLS, garantit org_id)
    const [instance] = await db
      .insert(agentInstances)
      .values({ orgId, agentSlug: agent_slug, isActive: true })
      .onConflictDoUpdate({
        target: [agentInstances.orgId, agentInstances.agentSlug],
        set: { isActive: true },
      })
      .returning({ id: agentInstances.id })

    if (!instance) return Response.json({ error: "Agent introuvable" }, { status: 404 })

    const [conv] = await db
      .insert(conversations)
      .values({
        orgId,
        agentInstanceId: instance.id,
        channel: "chat",
        metadata: { agent_slug },
      })
      .returning()

    if (!conv) return Response.json({ error: "Création impossible" }, { status: 500 })
    return Response.json({ conversation: conv })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return Response.json({ error: msg }, { status: 500 })
  }
}
