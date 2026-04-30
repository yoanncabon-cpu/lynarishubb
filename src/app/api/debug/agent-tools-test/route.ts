export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { executeTool } from "@/lib/agents/tools/index"

/**
 * Test end-to-end des CORE_TOOLS (tasks, contacts, deals).
 *
 * Hit cette URL en étant connecté → le endpoint exécute :
 *   1. create_task → list_tasks → update_task → delete_task
 *   2. add_contact → search_contact → update_contact → delete_contact
 *   3. create_deal → list_deals → update_deal_stage → delete_deal
 *
 * Retourne un JSON détaillé avec ✓/✗ par étape pour debug rapide.
 *
 * SUPPRIME LES DONNÉES CRÉÉES À LA FIN — n'altère pas l'état utilisateur.
 *
 * Sécurité : auth user requise. orgId multi-tenant filtré par les handlers.
 */
export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Connecte-toi d'abord puis recharge cette URL" }, { status: 401 })
  }

  type StepResult = { step: string; ok: boolean; data?: unknown; error?: string }
  const results: StepResult[] = []

  function record(step: string, result: { error?: string; result?: unknown }): { ok: boolean; data: unknown } {
    if (result.error) {
      results.push({ step, ok: false, error: result.error })
      return { ok: false, data: null }
    }
    results.push({ step, ok: true, data: result.result })
    return { ok: true, data: result.result }
  }

  const ctx = (toolName: string, input: Record<string, unknown>) =>
    ({ toolName, input, orgId, agentSlug: "charles" }) as const

  const ts = Date.now()

  // ─── 1. TÂCHES ─────────────────────────────────────────────────────────
  const t1 = await executeTool(ctx("create_task", {
    title: `[TEST] Tâche auto ${ts}`,
    description: "Créée par /api/debug/agent-tools-test — sera supprimée",
    priority: "high",
  }))
  const t1r = record("tasks.create_task", t1)
  const taskId = (t1r.data as { task_id?: string } | null)?.task_id

  if (taskId) {
    record("tasks.list_tasks (filter high)", await executeTool(ctx("list_tasks", { priority: "high", limit: 5 })))
    record("tasks.update_task (→ done)",     await executeTool(ctx("update_task", { task_id: taskId, status: "done" })))
    record("tasks.delete_task (cleanup)",    await executeTool(ctx("delete_task", { task_id: taskId })))
  } else {
    results.push({ step: "tasks.* skipped (create failed)", ok: false })
  }

  // ─── 2. CONTACTS ──────────────────────────────────────────────────────
  const c1 = await executeTool(ctx("add_contact", {
    name: `[TEST] Contact auto ${ts}`,
    email: `test-${ts}@example.com`,
    phone: "+33600000000",
    category: "test",
  }))
  const c1r = record("contacts.add_contact", c1)
  const contactId = (c1r.data as { contact_id?: string } | null)?.contact_id

  if (contactId) {
    record("contacts.search_contact (query=auto)",   await executeTool(ctx("search_contact", { query: "auto" })))
    record("contacts.update_contact (notes test)",   await executeTool(ctx("update_contact", { contact_id: contactId, notes: "Updated by test" })))
    record("contacts.delete_contact (cleanup)",      await executeTool(ctx("delete_contact", { contact_id: contactId })))
  } else {
    results.push({ step: "contacts.* skipped (create failed)", ok: false })
  }

  // ─── 3. CRM DEALS ─────────────────────────────────────────────────────
  const d1 = await executeTool(ctx("create_deal", {
    full_name: `[TEST] Deal auto ${ts}`,
    company: "TestCo",
    stage: "new",
    deal_value: 1234,
    notes: "Créé par /api/debug/agent-tools-test",
  }))
  const d1r = record("crm.create_deal", d1)
  const dealId = (d1r.data as { deal_id?: string } | null)?.deal_id

  if (dealId) {
    record("crm.list_deals (stage=new)",          await executeTool(ctx("list_deals", { stage: "new", limit: 5 })))
    record("crm.update_deal_stage (→ qualified)", await executeTool(ctx("update_deal_stage", { deal_id: dealId, stage: "qualified" })))
    record("crm.update_deal (notes update)",      await executeTool(ctx("update_deal", { deal_id: dealId, notes: "Stage moved" })))
    record("crm.delete_deal (cleanup)",           await executeTool(ctx("delete_deal", { deal_id: dealId })))
  } else {
    results.push({ step: "crm.* skipped (create failed)", ok: false })
  }

  const total = results.length
  const ok = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok)

  return NextResponse.json({
    summary: `${ok}/${total} tests passés`,
    allOk: failed.length === 0,
    failed,
    results,
  }, { headers: { "Cache-Control": "no-store" } })
}
