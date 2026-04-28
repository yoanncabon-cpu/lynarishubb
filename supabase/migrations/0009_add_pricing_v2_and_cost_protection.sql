CREATE TYPE "public"."plan_billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TABLE "org_protection_state" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"current_cost_euros" numeric(10, 4) DEFAULT '0' NOT NULL,
	"budget_euros" numeric(10, 2) NOT NULL,
	"notified_admin_70" boolean DEFAULT false NOT NULL,
	"notified_client_90" boolean DEFAULT false NOT NULL,
	"alerted_admin_100" boolean DEFAULT false NOT NULL,
	"alerted_admin_130" boolean DEFAULT false NOT NULL,
	"economy_mode_active" boolean DEFAULT false NOT NULL,
	"hard_cap_active" boolean DEFAULT false NOT NULL,
	"economy_mode_activated_at" timestamp with time zone,
	"hard_cap_activated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_usage_counters" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"actions_used" integer DEFAULT 0 NOT NULL,
	"voice_minutes_used" integer DEFAULT 0 NOT NULL,
	"rag_docs_count" integer DEFAULT 0 NOT NULL,
	"team_members_count" integer DEFAULT 1 NOT NULL,
	"voice_pack_minutes_remaining" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"agent_slug" text,
	"action_type" text NOT NULL,
	"cost_euros" numeric(10, 4) NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"duration_seconds" integer,
	"model_used" text,
	"economy_mode" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"agent_slug" text,
	"action_type" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_ticket_id_unique";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_id" text DEFAULT 'discovery' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_billing_cycle" "plan_billing_cycle" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "org_protection_state" ADD CONSTRAINT "org_protection_state_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_usage_counters" ADD CONSTRAINT "org_usage_counters_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_costs" ADD CONSTRAINT "usage_costs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_costs_org_id_idx" ON "usage_costs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "usage_costs_org_created_idx" ON "usage_costs" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_costs_agent_idx" ON "usage_costs" USING btree ("org_id","agent_slug");--> statement-breakpoint
CREATE INDEX "usage_costs_provider_idx" ON "usage_costs" USING btree ("provider","created_at");--> statement-breakpoint
CREATE INDEX "usage_ledger_org_id_idx" ON "usage_ledger" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "usage_ledger_org_created_idx" ON "usage_ledger" USING btree ("org_id","created_at");--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_ticket_id_key" UNIQUE("ticket_id");