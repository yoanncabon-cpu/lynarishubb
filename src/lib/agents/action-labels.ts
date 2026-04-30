/**
 * Mapping centralisé des actions agents → libellés français parlants.
 * Utilisé par :
 *  - /api/notifications/route.ts (génération notifs DB)
 *  - dashboard/page.tsx (timeline activité SSE)
 *  - composants ActivityTimeline
 *
 * Chaque libellé peut s'enrichir depuis le `payload` de l'actionLog si présent.
 */

export type ActionPayload = Record<string, unknown> | null

export type LabelFn = (agentName: string, payload: ActionPayload) => string

function safeStr(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim()
  if (typeof v === "number") return String(v)
  return undefined
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Libellé long pour une notification (1 ligne descriptive complète).
 */
export const NOTIFICATION_LABELS: Record<string, LabelFn> = {
  // Voice (Marine)
  call_handled:        (a, p) => {
    const from = p && safeStr(p.callerName ?? p.from ?? p.phone)
    return from ? `${a} a géré un appel de ${from}` : `${a} a géré un appel`
  },
  call_missed:         (a) => `${a} — Appel manqué noté`,
  appointment_created: (a, p) => {
    const when = p && safeStr(p.date ?? p.when ?? p.slot)
    return when ? `${a} a planifié un RDV ${when}` : `${a} a créé un nouveau RDV`
  },
  sms_sent:            (a, p) => {
    const to = p && safeStr(p.to ?? p.recipient)
    return to ? `${a} a envoyé un SMS à ${to}` : `${a} a envoyé un SMS`
  },
  // Mail (Mae)
  email_sent:          (a, p) => {
    const to = p && safeStr(p.to ?? p.recipient)
    return to ? `${a} a envoyé un email à ${to}` : `${a} a envoyé un email`
  },
  inbox_processed:     (a, p) => {
    const count = p && safeStr(p.count)
    return count ? `${a} a traité ${count} emails` : `${a} a trié ta boîte mail`
  },
  draft_created:       (a) => `${a} a rédigé un brouillon`,
  // Sales (Elio)
  prospect_contacted:  (a, p) => {
    const name = p && safeStr(p.prospectName ?? p.name)
    return name ? `${a} a contacté ${name}` : `${a} a contacté un prospect`
  },
  prospect_scored:     (a) => `${a} a scoré un prospect`,
  // Content (Lou, Max)
  post_published:      (a, p) => {
    const platform = p && safeStr(p.platform)
    return platform ? `${a} a publié sur ${cap(platform)}` : `${a} a publié un post`
  },
  article_written:     (a, p) => {
    const title = p && safeStr(p.title)
    return title ? `${a} a rédigé « ${truncate(title, 50)} »` : `${a} a rédigé un article`
  },
  image_generated:     (a) => `${a} a généré une image`,
  // Charles / orchestration
  conversation:        (a, p) => {
    const subject = p && safeStr(p.subject ?? p.summary ?? p.lastMessage)
    return subject ? `${a} a échangé : « ${truncate(subject, 50)} »` : `${a} a échangé avec toi`
  },
  delegation:          (a, p) => {
    const target = p && safeStr(p.targetAgent ?? p.agent)
    return target ? `${a} a délégué à ${cap(target)}` : `${a} a délégué une tâche`
  },
  brief_generated:     (a) => `${a} a généré ton brief du jour`,
  scheduled_job:       (a, p) => {
    const name = p && safeStr(p.jobName ?? p.name ?? p.title)
    return name ? `${a} a exécuté la tâche « ${truncate(name, 40)} »` : `${a} a exécuté une tâche planifiée`
  },
  workflow_triggered:  (a, p) => {
    const name = p && safeStr(p.workflowName ?? p.name)
    return name ? `${a} a déclenché « ${truncate(name, 40)} »` : `${a} a déclenché un workflow`
  },
  workflow_created:    (a) => `${a} a créé un nouveau workflow`,
  memory_saved:        (a) => `${a} a mis à jour sa mémoire`,
  // HR (Alba) / Business (Nova)
  cv_analyzed:         (a) => `${a} a analysé un CV`,
  report_generated:    (a, p) => {
    const period = p && safeStr(p.period)
    return period ? `${a} a généré le rapport ${period}` : `${a} a généré un rapport`
  },
}

/**
 * Libellé court pour la timeline d'activité (label de l'action seule, sans le nom de l'agent).
 */
export const ACTIVITY_LABELS: Record<string, LabelFn> = {
  call_handled:        (_a, p) => {
    const from = p && safeStr(p.callerName ?? p.from ?? p.phone)
    return from ? `Appel reçu — ${from}` : "Appel géré"
  },
  call_missed:         () => "Appel manqué",
  appointment_created: (_a, p) => {
    const when = p && safeStr(p.date ?? p.when ?? p.slot)
    return when ? `RDV planifié ${when}` : "RDV créé"
  },
  sms_sent:            (_a, p) => {
    const to = p && safeStr(p.to ?? p.recipient)
    return to ? `SMS envoyé à ${to}` : "SMS envoyé"
  },
  email_sent:          (_a, p) => {
    const to = p && safeStr(p.to ?? p.recipient)
    return to ? `Email envoyé à ${to}` : "Email envoyé"
  },
  inbox_processed:     (_a, p) => {
    const count = p && safeStr(p.count)
    return count ? `${count} emails traités` : "Boîte mail triée"
  },
  draft_created:       () => "Brouillon rédigé",
  prospect_contacted:  (_a, p) => {
    const name = p && safeStr(p.prospectName ?? p.name)
    return name ? `Prospect contacté — ${name}` : "Prospect contacté"
  },
  prospect_scored:     () => "Prospect scoré",
  post_published:      (_a, p) => {
    const platform = p && safeStr(p.platform)
    return platform ? `Post publié sur ${cap(platform)}` : "Post publié"
  },
  article_written:     (_a, p) => {
    const title = p && safeStr(p.title)
    return title ? `Article — « ${truncate(title, 40)} »` : "Article rédigé"
  },
  image_generated:     () => "Image générée",
  conversation:        (_a, p) => {
    const subject = p && safeStr(p.subject ?? p.summary ?? p.lastMessage)
    return subject ? `Échange — « ${truncate(subject, 40)} »` : "Échange traité"
  },
  delegation:          (_a, p) => {
    const target = p && safeStr(p.targetAgent ?? p.agent)
    return target ? `Délégué à ${cap(target)}` : "Tâche déléguée"
  },
  brief_generated:     () => "Brief du jour généré",
  scheduled_job:       (_a, p) => {
    const name = p && safeStr(p.jobName ?? p.name ?? p.title)
    return name ? `Tâche planifiée — « ${truncate(name, 35)} »` : "Tâche planifiée exécutée"
  },
  workflow_triggered:  (_a, p) => {
    const name = p && safeStr(p.workflowName ?? p.name)
    return name ? `Workflow déclenché — « ${truncate(name, 35)} »` : "Workflow déclenché"
  },
  workflow_created:    () => "Workflow créé",
  memory_saved:        () => "Mémoire mise à jour",
  cv_analyzed:         () => "CV analysé",
  report_generated:    (_a, p) => {
    const period = p && safeStr(p.period)
    return period ? `Rapport ${period}` : "Rapport généré"
  },
}

/**
 * Construit le libellé d'une notification depuis le type + payload.
 */
export function buildNotificationLabel(
  type: string,
  agentName: string,
  payload: ActionPayload
): string {
  const fn = NOTIFICATION_LABELS[type]
  if (fn) return fn(agentName, payload)
  // Fallback : type reformaté lisible
  const pretty = type.replace(/_/g, " ").trim()
  return `${agentName} — ${cap(pretty)}`
}

/**
 * Libellés courts pluriels pour les charts/agrégats (ex: "Top actions par type").
 * On veut une formulation au pluriel (« 10 SMS envoyés ») et pas un verbe à l'infinitif.
 */
const ACTION_TYPE_SHORT: Record<string, string> = {
  call_handled:        "Appels traités",
  call_missed:         "Appels manqués",
  appointment_created: "RDV créés",
  sms_sent:            "SMS envoyés",
  email_sent:          "Emails envoyés",
  inbox_processed:     "Tris d'inbox",
  draft_created:       "Brouillons rédigés",
  prospect_contacted:  "Prospects contactés",
  prospect_scored:     "Prospects scorés",
  post_published:      "Posts publiés",
  article_written:     "Articles rédigés",
  image_generated:     "Images générées",
  conversation:        "Échanges",
  delegation:          "Délégations",
  brief_generated:     "Briefs générés",
  scheduled_job:       "Tâches planifiées",
  workflow_triggered:  "Workflows déclenchés",
  workflow_created:    "Workflows créés",
  memory_saved:        "Mémoires mises à jour",
  cv_analyzed:         "CV analysés",
  report_generated:    "Rapports générés",
}

/**
 * Convertit un type d'action brut (ex: "scheduled_job") en libellé français court
 * adapté à un chart ou une légende (ex: "Tâches planifiées").
 * Fallback : reformate snake_case → "Title Case".
 */
export function actionTypeShortLabel(type: string): string {
  const known = ACTION_TYPE_SHORT[type]
  if (known) return known
  return type
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * Construit le libellé d'une activité (timeline) depuis le type + payload.
 */
export function buildActivityLabel(
  type: string,
  agentName: string,
  payload: ActionPayload
): string {
  const fn = ACTIVITY_LABELS[type]
  if (fn) return fn(agentName, payload)
  // Fallback : type reformaté lisible
  const pretty = type.replace(/_/g, " ").trim()
  return cap(pretty)
}
