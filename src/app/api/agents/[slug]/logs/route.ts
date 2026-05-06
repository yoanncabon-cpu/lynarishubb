import { type NextRequest, NextResponse } from "next/server"
import { getAgent } from "@/lib/agents/registry"

export const dynamic = "force-dynamic"

interface ActionLog {
  id: string
  type: string
  status: "success" | "error" | "pending"
  detail: string
  duration_ms?: number
  cost_usd?: number
  created_at: string
}

// Logs réalistes par agent slug
const MOCK_LOGS: Record<string, ActionLog[]> = {
  marine: [
    { id: "log_001", type: "call_handled", status: "success", detail: "Appel entrant — Mme Rousseau, RDV créé jeudi 9h30", duration_ms: 134000, cost_usd: 0.012, created_at: new Date(Date.now() - 12*60*1000).toISOString() },
    { id: "log_002", type: "sms_sent", status: "success", detail: "SMS confirmation envoyé au +33 6 12 34 56 78", duration_ms: 800, cost_usd: 0.001, created_at: new Date(Date.now() - 12*60*1000 + 2000).toISOString() },
    { id: "log_003", type: "calendar_event", status: "success", detail: "Événement créé: Kinésithérapie Mme Rousseau 24/04 9h30", duration_ms: 450, cost_usd: 0.000, created_at: new Date(Date.now() - 12*60*1000 + 5000).toISOString() },
    { id: "log_004", type: "call_handled", status: "success", detail: "Appel entrant — M. Lefebvre, info tarifs + SMS récap", duration_ms: 102000, cost_usd: 0.009, created_at: new Date(Date.now() - 4*3600*1000).toISOString() },
    // Mention "Dr. Ménigoz" retirée — pas d'accord de citation
    { id: "log_005", type: "escalation", status: "success", detail: "Urgence détectée — Mme Duval, praticien notifié", duration_ms: 5000, cost_usd: 0.001, created_at: new Date(Date.now() - 6*3600*1000).toISOString() },
    { id: "log_006", type: "call_handled", status: "error", detail: "Appel interrompu — ligne coupée après 18s", duration_ms: 18000, cost_usd: 0.002, created_at: new Date(Date.now() - 8*3600*1000).toISOString() },
  ],
  charles: [
    { id: "log_010", type: "delegation", status: "success", detail: "Tâche déléguée à Nova — rapport hebdomadaire demandé", duration_ms: 1200, cost_usd: 0.005, created_at: new Date(Date.now() - 3*3600*1000).toISOString() },
    { id: "log_011", type: "brief_generated", status: "success", detail: "Brief matinal généré — 3 priorités du jour", duration_ms: 8000, cost_usd: 0.015, created_at: new Date(Date.now() - 8*3600*1000).toISOString() },
    { id: "log_012", type: "memory_saved", status: "success", detail: "Mémorisé: préférence réunions avant 11h", duration_ms: 200, cost_usd: 0.000, created_at: new Date(Date.now() - 24*3600*1000).toISOString() },
    { id: "log_013", type: "workflow_triggered", status: "success", detail: "n8n workflow déclenché: weekly-report", duration_ms: 2300, cost_usd: 0.000, created_at: new Date(Date.now() - 24*3600*1000 + 3600*1000).toISOString() },
  ],
  elio: [
    { id: "log_020", type: "prospect_scored", status: "success", detail: "Thomas Perrin scoré 82/100 — réponse positive qualifiée", duration_ms: 3200, cost_usd: 0.008, created_at: new Date(Date.now() - 2*3600*1000).toISOString() },
    { id: "log_021", type: "email_sent", status: "success", detail: "Message personnalisé envoyé à Sophie Laurent (PME Solutions)", duration_ms: 5400, cost_usd: 0.012, created_at: new Date(Date.now() - 4*3600*1000).toISOString() },
    { id: "log_022", type: "sequence_enrolled", status: "success", detail: "Pierre Moreau ajouté à la séquence Kinés Paris", duration_ms: 400, cost_usd: 0.000, created_at: new Date(Date.now() - 4*3600*1000 + 5000).toISOString() },
    { id: "log_023", type: "email_sent", status: "error", detail: "Échec envoi — adresse invalide: jean@.example.com", duration_ms: 1200, cost_usd: 0.000, created_at: new Date(Date.now() - 6*3600*1000).toISOString() },
  ],
  lou: [
    { id: "log_030", type: "article_written", status: "success", detail: "Article rédigé: L'IA en cabinet médical (1847 mots)", duration_ms: 32000, cost_usd: 0.045, created_at: new Date(Date.now() - 5*3600*1000).toISOString() },
    { id: "log_031", type: "post_published", status: "success", detail: "Post LinkedIn publié via n8n — 847 impressions", duration_ms: 2100, cost_usd: 0.000, created_at: new Date(Date.now() - 5*3600*1000 + 3000).toISOString() },
    { id: "log_032", type: "seo_analyzed", status: "success", detail: "Analyse SEO: score 74/100, 3 recommandations", duration_ms: 4800, cost_usd: 0.008, created_at: new Date(Date.now() - 24*3600*1000).toISOString() },
  ],
  mae: [
    { id: "log_040", type: "inbox_processed", status: "success", detail: "12 emails triés — 3 urgents, 2 brouillons préparés", duration_ms: 18000, cost_usd: 0.022, created_at: new Date(Date.now() - 1*3600*1000).toISOString() },
    { id: "log_041", type: "draft_created", status: "success", detail: "Brouillon: Relance facture Dubois & Associés", duration_ms: 6200, cost_usd: 0.011, created_at: new Date(Date.now() - 2*3600*1000).toISOString() },
    { id: "log_042", type: "brief_sent", status: "success", detail: "Brief 8h envoyé — 3 points urgents du jour", duration_ms: 3400, cost_usd: 0.005, created_at: new Date(Date.now() - 8*3600*1000 + 8*60*60*1000).toISOString() },
  ],
  nova: [
    { id: "log_050", type: "report_generated", status: "success", detail: "Rapport hebdomadaire — MRR 4 820€ (+12%), 3 alertes", duration_ms: 45000, cost_usd: 0.062, created_at: new Date(Date.now() - 24*3600*1000).toISOString() },
    { id: "log_051", type: "anomaly_detected", status: "success", detail: "Anomalie MRR détectée: -8% vs semaine précédente", duration_ms: 12000, cost_usd: 0.018, created_at: new Date(Date.now() - 48*3600*1000).toISOString() },
  ],
  max: [
    { id: "log_060", type: "images_generated", status: "success", detail: "8 variations logo Lynaris générées (Flux 1.1 Pro)", duration_ms: 28000, cost_usd: 0.024, created_at: new Date(Date.now() - 5*3600*1000).toISOString() },
    { id: "log_061", type: "background_removed", status: "success", detail: "Fond supprimé sur 3 photos produit", duration_ms: 4200, cost_usd: 0.003, created_at: new Date(Date.now() - 24*3600*1000).toISOString() },
  ],
  alba: [
    { id: "log_070", type: "cv_analyzed", status: "success", detail: "4 CVs analysés pour poste Dev Full-Stack — meilleur: 87/100", duration_ms: 22000, cost_usd: 0.031, created_at: new Date(Date.now() - 24*3600*1000).toISOString() },
    { id: "log_071", type: "message_sent", status: "success", detail: "Message candidature envoyé à Lucas Bernard", duration_ms: 3800, cost_usd: 0.007, created_at: new Date(Date.now() - 26*3600*1000).toISOString() },
  ],
}

const DEFAULT_LOGS: ActionLog[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) {
    return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })
  }
  const logs = MOCK_LOGS[slug] ?? DEFAULT_LOGS
  const totalCost = logs.reduce((s, l) => s + (l.cost_usd ?? 0), 0)
  return NextResponse.json({
    agent: slug,
    logs,
    total: logs.length,
    total_cost_usd: Math.round(totalCost * 1000) / 1000,
  })
}
