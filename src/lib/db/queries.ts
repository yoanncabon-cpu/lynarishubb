import { db } from "./index"
import { organizations, users, agentInstances, integrations } from "./schema"
import { eq, and } from "drizzle-orm"

export async function getOrgBySlug(slug: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  })
}

export async function getUserWithOrg(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { organization: true },
  })
}

export async function getActiveAgents(orgId: string) {
  return db.query.agentInstances.findMany({
    where: and(
      eq(agentInstances.orgId, orgId),
      eq(agentInstances.isActive, true)
    ),
  })
}

export async function getIntegrations(orgId: string) {
  return db.query.integrations.findMany({
    where: eq(integrations.orgId, orgId),
  })
}
