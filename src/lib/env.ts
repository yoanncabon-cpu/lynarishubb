import { z } from "zod"
import { logger } from "@/lib/logger"

const envSchema = z.object({
  // ── App ──────────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // ── Supabase ─────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  DATABASE_URL: z.string().url(),

  // ── IA ───────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),

  // ── Chiffrement ──────────────────────────────────────────────────
  INTEGRATIONS_ENCRYPTION_KEY: z.string().min(32),

  // ── Stripe ───────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_PRICE_VOICE_PACK: z.string().optional(),

  // ── Email ────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_FROM_NAME: z.string().optional(),
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  EMAIL_LOGO_URL: z.string().url().optional(),

  // ── Twilio ───────────────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WEBHOOK_BASE_URL: z.string().url().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_FR_BUNDLE_SID: z.string().optional(),
  TWILIO_FR_ADDRESS_SID: z.string().optional(),
  TWILIO_SENDER_ID: z.string().optional(),

  // ── Upstash Redis ────────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Notifications push ───────────────────────────────────────────
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // ── Google OAuth ─────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── Pipedream ────────────────────────────────────────────────────
  PIPEDREAM_CLIENT_ID: z.string().optional(),
  PIPEDREAM_CLIENT_SECRET: z.string().optional(),
  PIPEDREAM_PROJECT_ID: z.string().optional(),

  // ── n8n / Make ───────────────────────────────────────────────────
  N8N_WEBHOOK_SECRET: z.string().optional(),
  N8N_API_KEY: z.string().optional(),
  N8N_BASE_URL: z.string().url().optional(),
  MAKE_WEBHOOK_SECRET: z.string().optional(),

  // ── WhatsApp ─────────────────────────────────────────────────────
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // ── Admin ────────────────────────────────────────────────────────
  ADMIN_EMAILS: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  COST_PROTECTION_MODE: z.enum(["soft", "hard"]).optional(),
  COST_PROTECTION_ADMIN_EMAIL: z.string().email().optional(),

  // ── Mentions legales ─────────────────────────────────────────────
  COMPANY_SIRET: z.string().optional(),
  COMPANY_LEGAL_FORM: z.string().optional(),
  COMPANY_REPRESENTATIVE: z.string().optional(),
  COMPANY_ADDRESS: z.string().optional(),
  COMPANY_PHONE: z.string().optional(),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    logger.error("[env] Variables d'environnement invalides", { issues })
    // En prod, throw pour bloquer le demarrage. En dev, on continue.
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("[env] Configuration invalide — demarrage bloque.")
    }
    return result.data ?? ({} as z.infer<typeof envSchema>)
  }
  return result.data
}

export const env = parseEnv()
