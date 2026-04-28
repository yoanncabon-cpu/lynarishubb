import { db } from "@/lib/db"
import { integrations } from "@/lib/db/schema"
import { encryptCredentials, decryptCredentials } from "@/lib/crypto"
import { eq, and } from "drizzle-orm"

// Providers avec flows spéciaux (OAuth ou config avancée)
export type KnownIntegrationProvider = "n8n" | "make" | "google" | "twilio" | "elevenlabs" | "stripe" | "wordpress" | "slack" | "notion" | "hubspot" | "whatsapp"

// Accepte n'importe quel provider pour le catalogue générique
export type IntegrationProvider = KnownIntegrationProvider | string

export interface IntegrationData {
  id: string
  orgId: string
  provider: IntegrationProvider
  status: "connected" | "expired" | "error"
  credentials: Record<string, unknown>
  metadata: Record<string, unknown>
  connectedAt: Date
  lastRefreshedAt: Date | null
}

export async function getIntegration(orgId: string, provider: IntegrationProvider): Promise<IntegrationData | null> {
  const row = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.orgId, orgId),
      eq(integrations.provider, provider)
    ),
  })

  if (!row) return null

  const credentials = await decryptCredentials(row.credentials as unknown as string)

  return {
    id: row.id,
    orgId: row.orgId,
    provider: row.provider as IntegrationProvider,
    status: row.status as "connected" | "expired" | "error",
    credentials,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    connectedAt: row.connectedAt,
    lastRefreshedAt: row.lastRefreshedAt,
  }
}

export async function upsertIntegration(
  orgId: string,
  provider: IntegrationProvider,
  credentials: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  const encryptedCredentials = await encryptCredentials(credentials)

  await db
    .insert(integrations)
    .values({
      orgId,
      provider,
      status: "connected",
      credentials: encryptedCredentials as unknown as Record<string, unknown>,
      metadata: metadata ?? {},
      connectedAt: new Date(),
      lastRefreshedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [integrations.orgId, integrations.provider],
      set: {
        status: "connected",
        credentials: encryptedCredentials as unknown as Record<string, unknown>,
        metadata: metadata ?? {},
        lastRefreshedAt: new Date(),
      },
    })
}

export async function disconnectIntegration(orgId: string, provider: IntegrationProvider): Promise<void> {
  await db
    .delete(integrations)
    .where(
      and(
        eq(integrations.orgId, orgId),
        eq(integrations.provider, provider)
      )
    )
}

export async function markIntegrationError(orgId: string, provider: IntegrationProvider, error: string): Promise<void> {
  await db
    .update(integrations)
    .set({ status: "error", metadata: { error, updated_at: new Date().toISOString() } })
    .where(
      and(
        eq(integrations.orgId, orgId),
        eq(integrations.provider, provider)
      )
    )
}

export async function listIntegrations(orgId: string): Promise<Array<{ provider: string; status: string; connectedAt: Date }>> {
  const rows = await db.query.integrations.findMany({
    where: eq(integrations.orgId, orgId),
    columns: { provider: true, status: true, connectedAt: true },
  })
  return rows
}
