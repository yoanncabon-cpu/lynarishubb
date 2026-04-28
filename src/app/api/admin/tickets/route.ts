import { NextResponse } from "next/server"
import { desc, eq, ilike, and, type SQL } from "drizzle-orm"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db"
import { supportTickets, organizations } from "@/lib/db/schema"

// ─── GET — tous les tickets de toutes les orgs (admin only) ──────────────────
export async function GET(req: Request): Promise<NextResponse> {
  const admin = await isLynarisAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500)

  // Construire les conditions WHERE
  const conditions: SQL[] = []

  if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
    conditions.push(
      eq(
        supportTickets.status,
        status as "open" | "in_progress" | "resolved" | "closed"
      )
    )
  }

  if (priority && ["Faible", "Normale", "Haute", "Urgente"].includes(priority)) {
    conditions.push(eq(supportTickets.priority, priority))
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`
    conditions.push(
      ilike(supportTickets.subject, term)
    )
  }

  try {
    const rows = await db
      .select({
        id: supportTickets.id,
        ticketId: supportTickets.ticketId,
        subject: supportTickets.subject,
        category: supportTickets.category,
        priority: supportTickets.priority,
        description: supportTickets.description,
        pageUrl: supportTickets.pageUrl,
        userEmail: supportTickets.userEmail,
        status: supportTickets.status,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        orgId: supportTickets.orgId,
        orgName: organizations.name,
      })
      .from(supportTickets)
      .leftJoin(organizations, eq(supportTickets.orgId, organizations.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)

    // Filtrer sur userEmail côté JS si recherche présente (ilike ne couvre que subject)
    const filtered =
      search && search.trim().length > 0
        ? rows.filter(
            (r) =>
              r.subject.toLowerCase().includes(search.toLowerCase()) ||
              (r.userEmail?.toLowerCase().includes(search.toLowerCase()) ?? false)
          )
        : rows

    return NextResponse.json({ tickets: filtered })
  } catch (err) {
    console.error("[admin/tickets] DB error:", err)
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
