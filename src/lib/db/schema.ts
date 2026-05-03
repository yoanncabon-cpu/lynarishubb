import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
  date,
  inet,
  pgEnum,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"
import type { EmailStyleConfig } from "@/lib/emails/types"

// ─── Custom pgvector type ────────────────────────────────────────────────────
const vector = (name: string, config: { dimensions: number }) =>
  customType<{ data: number[] }>({
    dataType() {
      return `vector(${config.dimensions})`
    },
  })(name)

// ─── Enums ───────────────────────────────────────────────────────────────────
// Note : `plan` legacy préservé pour rétrocompat des anciennes orgs.
// Le nouveau pricing 5 paliers utilise `planId` (text + contrainte TS via PLAN_IDS).
// Voir src/lib/pricing/plans.ts pour la source de vérité UI.
export const planEnum = pgEnum("plan", [
  "trial",
  "starter",
  "pro",
  "scale",
])
export const planBillingCycleEnum = pgEnum("plan_billing_cycle", [
  "monthly",
  "annual",
])
export const roleEnum = pgEnum("role", ["owner", "admin", "member"])
export const integrationStatusEnum = pgEnum("integration_status", [
  "connected",
  "expired",
  "error",
])
export const channelEnum = pgEnum("channel", [
  "voice",
  "chat",
  "whatsapp",
  "email",
  "internal",
])
export const actionStatusEnum = pgEnum("action_status", [
  "success",
  "error",
  "pending",
])
export const prospectStatusEnum = pgEnum("prospect_status", [
  "new",
  "contacted",
  "replied",
  "qualified",
  "lost",
  "won",
])
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "tool",
  "system",
])
export const n8nRunStatusEnum = pgEnum("n8n_run_status", [
  "pending",
  "running",
  "success",
  "error",
])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    // ── Plan legacy (rétrocompat — sera retiré après migration code) ──
    plan: planEnum("plan").notNull().default("trial"),
    // ── Nouveau pricing 5 paliers (source de vérité courante) ──────────
    // Type: discovery | starter | pro | business | custom (cf. PLAN_IDS)
    planId: text("plan_id").notNull().default("discovery"),
    planBillingCycle: planBillingCycleEnum("plan_billing_cycle")
      .notNull()
      .default("monthly"),
    planActivatedAt: timestamp("plan_activated_at", { withTimezone: true }),
    // ── Essai / Stripe ─────────────────────────────────────────────────
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    settings: jsonb("settings").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("organizations_slug_idx").on(t.slug)]
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // synced with auth.users
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    fullName: text("full_name"),
    role: roleEnum("role").notNull().default("member"),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingCurrentStep: integer("onboarding_current_step").default(0),
    onboardingSkipped: boolean("onboarding_skipped").default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_org_id_idx").on(t.orgId),
  ]
)

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    status: integrationStatusEnum("status").notNull().default("connected"),
    credentials: jsonb("credentials")
      .notNull()
      .default(sql`'{}'::jsonb`),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  },
  (t) => [
    index("integrations_org_id_idx").on(t.orgId),
    uniqueIndex("integrations_org_provider_idx").on(t.orgId, t.provider),
  ]
)

export const agentInstances = pgTable(
  "agent_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentSlug: text("agent_slug").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    config: jsonb("config").default(sql`'{}'::jsonb`),
    systemPromptOverride: text("system_prompt_override"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("agent_instances_org_id_idx").on(t.orgId),
    uniqueIndex("agent_instances_org_slug_idx").on(t.orgId, t.agentSlug),
  ]
)

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentInstanceId: uuid("agent_instance_id").references(
      () => agentInstances.id,
      { onDelete: "restrict" }
    ),
    channel: channelEnum("channel").notNull(),
    externalId: text("external_id"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    summary: text("summary"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  },
  (t) => [
    index("conversations_org_id_idx").on(t.orgId),
    // Composite : analytics WHERE org_id = ? AND started_at >= ?
    index("conversations_org_started_idx").on(t.orgId, t.startedAt.desc()),
  ]
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: jsonb("content").notNull(),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_conversation_id_idx").on(t.conversationId)]
)

export const actionLogs = pgTable(
  "action_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentInstanceId: uuid("agent_instance_id").references(
      () => agentInstances.id,
      { onDelete: "set null" }
    ),
    conversationId: uuid("conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" }
    ),
    type: text("type").notNull(),
    status: actionStatusEnum("status").notNull().default("pending"),
    payload: jsonb("payload").default(sql`'{}'::jsonb`),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Notifications : timestamp d'effacement utilisateur. Quand l'user clique sur le X
    // ou "Effacer" dans le panneau notifications, on set cette colonne à NOW().
    // Le GET /api/notifications filtre WHERE dismissed_at IS NULL.
    // L'audit complet reste consultable via /dashboard/analytics qui ignore ce flag.
    notificationDismissedAt: timestamp("notification_dismissed_at", { withTimezone: true }),
  },
  (t) => [
    index("action_logs_org_id_idx").on(t.orgId),
    index("action_logs_created_at_idx").on(t.createdAt),
    index("action_logs_notif_dismissed_idx").on(t.notificationDismissedAt),
    // Composite : analytics WHERE org_id = ? AND created_at >= ?
    index("action_logs_org_created_idx").on(t.orgId, t.createdAt.desc()),
    // Composite : analytics GROUP BY type WHERE org_id = ?
    index("action_logs_org_type_idx").on(t.orgId, t.type),
    // Partial : notifications actives uniquement (dismissed_at IS NULL).
    // Index minuscule même si action_logs grossit, lookup quasi-instant.
    index("action_logs_notif_active_idx")
      .on(t.orgId, t.createdAt.desc())
      .where(sql`${t.notificationDismissedAt} IS NULL`),
  ]
)

export const n8nRuns = pgTable(
  "n8n_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    workflowSlug: text("workflow_slug").notNull(),
    triggerSource: text("trigger_source"),
    input: jsonb("input").default(sql`'{}'::jsonb`),
    output: jsonb("output"),
    status: n8nRunStatusEnum("status").notNull().default("pending"),
    n8nExecutionId: text("n8n_execution_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("n8n_runs_org_id_idx").on(t.orgId)]
)

export const agentMemories = pgTable(
  "agent_memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentSlug: text("agent_slug").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    source: text("source").notNull().default("conversation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("agent_memories_org_id_idx").on(t.orgId)]
)

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fullName: text("full_name"),
    headline: text("headline"),
    linkedinUrl: text("linkedin_url"),
    email: text("email"),
    company: text("company"),
    status: prospectStatusEnum("status").notNull().default("new"),
    score: integer("score").default(0),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prospects_org_id_idx").on(t.orgId),
    index("prospects_status_idx").on(t.status),
  ]
)

export const prospectingSequences = pgTable(
  "prospecting_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    steps: jsonb("steps").notNull().default(sql`'[]'::jsonb`),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("prospecting_sequences_org_id_idx").on(t.orgId)]
)

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("usage_events_org_id_idx").on(t.orgId),
    index("usage_events_created_at_idx").on(t.createdAt),
  ]
)

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("eur"),
    status: text("status").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("invoices_org_id_idx").on(t.orgId)]
)

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_org_id_idx").on(t.orgId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
)

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id"),
    name: text("name").notNull(),
    type: text("type").notNull().default("file"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    storagePath: text("storage_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("documents_org_id_idx").on(t.orgId),
    index("documents_folder_id_idx").on(t.folderId),
  ]
)

// ─── Support tickets ─────────────────────────────────────────────────────────
export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
])

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull().unique("support_tickets_ticket_id_key"), // nom DB existant — FK ticket_messages dépend de cet index
    subject: text("subject").notNull(),
    category: text("category").notNull(),
    priority: text("priority").notNull().default("Normale"),
    description: text("description").notNull(),
    pageUrl: text("page_url"),
    userEmail: text("user_email"),
    status: supportTicketStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("support_tickets_org_id_idx").on(t.orgId),
    index("support_tickets_created_at_idx").on(t.createdAt),
  ]
)

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: text("ticket_id").notNull(), // référence support_tickets.ticket_id
    senderType: text("sender_type").notNull(), // 'client' | 'admin'
    senderEmail: text("sender_email"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ticket_messages_ticket_id_idx").on(t.ticketId),
    index("ticket_messages_created_at_idx").on(t.createdAt),
  ]
)

// ─── Contents unified space ──────────────────────────────────────────────────

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentSlug: text("agent_slug").notNull(),
    contentType: text("content_type").notNull(),
    platform: text("platform"),
    title: text("title").notNull(),
    description: text("description"),
    body: text("body"),
    status: text("status").notNull().default("published"),
    externalUrl: text("external_url"),
    externalId: text("external_id"),
    viewsCount: integer("views_count").default(0),
    likesCount: integer("likes_count").default(0),
    commentsCount: integer("comments_count").default(0),
    sharesCount: integer("shares_count").default(0),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("contents_org_created_idx").on(t.orgId, t.createdAt),
    index("contents_org_agent_idx").on(t.orgId, t.agentSlug),
    index("contents_org_type_idx").on(t.orgId, t.contentType),
  ]
)

export const contentAttachments = pgTable(
  "content_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    attachmentType: text("attachment_type").notNull(),
    storageUrl: text("storage_url").notNull(),
    storageKey: text("storage_key").default(""),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    position: integer("position").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("content_attachments_content_idx").on(t.contentId, t.position),
  ]
)

// ─── Scheduled jobs ──────────────────────────────────────────────────────────

export const scheduledJobs = pgTable(
  "scheduled_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    agentSlug: text("agent_slug").notNull(),
    name: text("name").notNull(),
    instruction: text("instruction").notNull(),
    frequency: text("frequency").notNull().default("daily"),
    hour: integer("hour").notNull().default(9),
    minute: integer("minute").notNull().default(0),
    dayOfWeek: integer("day_of_week"),
    dayOfMonth: integer("day_of_month"),
    timezone: text("timezone").notNull().default("Europe/Paris"),
    isActive: boolean("is_active").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastResult: text("last_result"),
    runCount: integer("run_count").notNull().default(0),
    // Catégorie d'affichage dans le dashboard (communication, reporting, productivity, growth, ...)
    category: text("category"),
    // Style visuel des emails envoyés par ce job : { preset: 'lynaris'|'minimal'|'corporate', accentColor?: '#hex' }
    emailStyle: jsonb("email_style").$type<EmailStyleConfig | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("scheduled_jobs_org_idx").on(t.orgId),
    index("scheduled_jobs_next_run_idx").on(t.nextRunAt),
    index("scheduled_jobs_category_idx").on(t.category),
  ]
)

// Re-export des types email depuis leur source neutre (évite de pull Drizzle côté client)
export type { EmailStylePreset, EmailStyleConfig } from "@/lib/emails/types"

// ─── Tasks (todo list utilisateur, accessible aux agents) ────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("todo"),       // 'todo' | 'in_progress' | 'done'
    priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high'
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdBy: text("created_by").notNull().default("user"), // 'user' | 'agent:<slug>'
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_org_idx").on(t.orgId),
    index("tasks_org_status_idx").on(t.orgId, t.status),
    index("tasks_due_date_idx").on(t.dueDate),
  ]
)

// ─── Phone numbers ───────────────────────────────────────────────────────────

export const phoneNumbers = pgTable(
  "phone_numbers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    agentId: uuid("agent_id"),
    twilioSid: text("twilio_sid").unique().notNull(),
    phoneNumber: text("phone_number").notNull(),
    displayName: text("display_name"),
    countryCode: text("country_code").notNull().default("FR"),
    numberType: text("number_type").notNull().default("national"),
    direction: text("direction").notNull().default("inbound"),
    isExistingNumber: boolean("is_existing_number").default(false),
    forwardingTarget: text("forwarding_target"),
    voiceRegion: text("voice_region").notNull().default("ie1"),
    monthlyCostCents: integer("monthly_cost_cents").notNull().default(500),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    releasedAt: timestamp("released_at"),
  },
  (t) => [
    index("idx_phone_numbers_org_active").on(t.orgId),
    index("idx_phone_numbers_agent").on(t.agentId),
  ]
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const organizationsRelations = relations(
  organizations,
  ({ many }) => ({
    users: many(users),
    integrations: many(integrations),
    agentInstances: many(agentInstances),
    conversations: many(conversations),
    actionLogs: many(actionLogs),
    n8nRuns: many(n8nRuns),
    agentMemories: many(agentMemories),
    prospects: many(prospects),
    usageEvents: many(usageEvents),
    invoices: many(invoices),
    auditLogs: many(auditLogs),
    documents: many(documents),
    supportTickets: many(supportTickets),
    contents: many(contents),
  })
)

export const contentsRelations = relations(contents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contents.orgId],
    references: [organizations.id],
  }),
  attachments: many(contentAttachments),
}))

export const contentAttachmentsRelations = relations(contentAttachments, ({ one }) => ({
  content: one(contents, {
    fields: [contentAttachments.contentId],
    references: [contents.id],
  }),
}))

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
}))

export const agentInstancesRelations = relations(
  agentInstances,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [agentInstances.orgId],
      references: [organizations.id],
    }),
    conversations: many(conversations),
    actionLogs: many(actionLogs),
  })
)

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [conversations.orgId],
      references: [organizations.id],
    }),
    agentInstance: one(agentInstances, {
      fields: [conversations.agentInstanceId],
      references: [agentInstances.id],
    }),
    messages: many(messages),
  })
)

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.orgId],
    references: [organizations.id],
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Usage tracking (côté client : compteurs visibles dashboard /billing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compteurs courants par org (1 ligne par org).
 * Reset chaque mois par le cron `monthly-reset` (étape 10).
 *
 * RLS : user "own org" — l'utilisateur peut lire uniquement les compteurs
 * de son organisation.
 */
export const orgUsageCounters = pgTable("org_usage_counters", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),

  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  actionsUsed: integer("actions_used").notNull().default(0),
  voiceMinutesUsed: integer("voice_minutes_used").notNull().default(0),
  ragDocsCount: integer("rag_docs_count").notNull().default(0),
  teamMembersCount: integer("team_members_count").notNull().default(1),

  // Solde Marine option (Starter) — minutes restantes des packs achetés
  voicePackMinutesRemaining: integer("voice_pack_minutes_remaining")
    .notNull()
    .default(0),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Ledger immuable : 1 ligne par action consommée par un agent.
 * Sert pour les stats client + audit interne.
 *
 * RLS : user "own org" (lecture seule, écriture API serveur uniquement).
 */
export const usageLedger = pgTable(
  "usage_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentSlug: text("agent_slug"),
    actionType: text("action_type").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("usage_ledger_org_id_idx").on(t.orgId),
    index("usage_ledger_org_created_idx").on(t.orgId, t.createdAt),
  ]
)

// ─────────────────────────────────────────────────────────────────────────────
// Cost protection (interne — RLS admin only, jamais exposé client)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ledger immuable du coût RÉEL pour Lynaris (Anthropic, Replicate, Twilio…).
 *
 * ⚠️ INTERNE — RLS `is_lynaris_admin()` only. JAMAIS exposé via API publique.
 * Sert au dashboard admin /protection (étape 13).
 */
export const usageCosts = pgTable(
  "usage_costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    agentSlug: text("agent_slug"),
    actionType: text("action_type").notNull(),
    /** Coût réel en euros HT, précision 4 décimales pour micro-coûts API. */
    costEuros: numeric("cost_euros", { precision: 10, scale: 4 }).notNull(),
    provider: text("provider").notNull(), // "anthropic" | "replicate" | "twilio" | "elevenlabs" | "deepgram"

    providerRef: text("provider_ref"), // request_id / call_sid / etc.
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    durationSeconds: integer("duration_seconds"),
    modelUsed: text("model_used"),
    economyMode: boolean("economy_mode").notNull().default(false),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("usage_costs_org_id_idx").on(t.orgId),
    index("usage_costs_org_created_idx").on(t.orgId, t.createdAt),
    index("usage_costs_agent_idx").on(t.orgId, t.agentSlug),
    index("usage_costs_provider_idx").on(t.provider, t.createdAt),
  ]
)

/**
 * État courant de protection de marge (1 ligne par org).
 * Lock atomique `SELECT FOR UPDATE` pour éviter les races sur les flags.
 *
 * ⚠️ INTERNE — RLS admin only.
 * Utilisé par le service `cost-protection/service.ts` (étape 5).
 */
export const orgProtectionState = pgTable("org_protection_state", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),

  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  /** Cumul du coût réel sur la période courante. */
  currentCostEuros: numeric("current_cost_euros", { precision: 10, scale: 4 })
    .notNull()
    .default("0"),
  /** Budget max pour la période (calculé selon plan via PLAN_COST_BUDGET_EUROS). */
  budgetEuros: numeric("budget_euros", { precision: 10, scale: 2 }).notNull(),

  // Flags d'idempotence des notifications
  notifiedAdmin70: boolean("notified_admin_70").notNull().default(false),
  notifiedClient90: boolean("notified_client_90").notNull().default(false),
  alertedAdmin100: boolean("alerted_admin_100").notNull().default(false),
  alertedAdmin130: boolean("alerted_admin_130").notNull().default(false),

  // Bascules automatiques (utilisées en mode ACTIF — désactivées en ALERTE)
  economyModeActive: boolean("economy_mode_active").notNull().default(false),
  hardCapActive: boolean("hard_cap_active").notNull().default(false),
  economyModeActivatedAt: timestamp("economy_mode_activated_at", {
    withTimezone: true,
  }),
  hardCapActivatedAt: timestamp("hard_cap_activated_at", {
    withTimezone: true,
  }),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ─── Relations usage / cost-protection ───────────────────────────────────────

export const orgUsageCountersRelations = relations(
  orgUsageCounters,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [orgUsageCounters.orgId],
      references: [organizations.id],
    }),
  })
)

export const usageLedgerRelations = relations(usageLedger, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageLedger.orgId],
    references: [organizations.id],
  }),
}))

export const usageCostsRelations = relations(usageCosts, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageCosts.orgId],
    references: [organizations.id],
  }),
}))

export const orgProtectionStateRelations = relations(
  orgProtectionState,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [orgProtectionState.orgId],
      references: [organizations.id],
    }),
  })
)
