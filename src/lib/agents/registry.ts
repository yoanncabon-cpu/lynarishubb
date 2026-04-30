import type { Tool } from "@anthropic-ai/sdk/resources"

export interface AgentDefinition {
  slug: string
  name: string
  model: string
  description: string
  systemPromptFn: (config: AgentConfig) => string
  tools: Tool[]
  requiredIntegrations: string[]
  maxTokens: number
}

export interface AgentConfig {
  orgName?: string
  orgSlug?: string
  timezone?: string
  language?: string
  customInstructions?: string
  // Agent-specific config
  [key: string]: unknown
}

// Import all agents
import { marineDefinition } from "./prompts/marine"
import { charlesDefinition } from "./prompts/charles"
import { louDefinition } from "./prompts/lou"
import { elioDefinition } from "./prompts/elio"
import { maeDefinition } from "./prompts/mae"
import { maxDefinition } from "./prompts/max"
import { novaDefinition } from "./prompts/nova"
import { albaDefinition } from "./prompts/alba"
import { orionDefinition } from "./prompts/orion"
import { ariaDefinition } from "./prompts/aria"
import { CORE_TOOLS } from "./tools/core"

const rawRegistry: Record<string, AgentDefinition> = {
  marine: marineDefinition,
  charles: charlesDefinition,
  lou: louDefinition,
  elio: elioDefinition,
  mae: maeDefinition,
  max: maxDefinition,
  nova: novaDefinition,
  alba: albaDefinition,
  orion: orionDefinition,
  aria: ariaDefinition,
}

/**
 * Étend chaque agent avec les CORE_TOOLS partagés (tâches, contacts).
 * Garantit qu'aucun tool spécifique n'est shadowed : si un agent a déjà un tool
 * du même nom (ex: Charles avec son ancien `create_task`), le sien prime et le
 * core est ignoré pour ce slug — sécurité contre les doublons d'API.
 */
function withCoreTools(def: AgentDefinition): AgentDefinition {
  const existingNames = new Set(def.tools.map((t) => t.name))
  const addedFromCore = CORE_TOOLS.filter((t) => !existingNames.has(t.name))
  return { ...def, tools: [...def.tools, ...addedFromCore] }
}

export const agentRegistry: Record<string, AgentDefinition> = Object.fromEntries(
  Object.entries(rawRegistry).map(([slug, def]) => [slug, withCoreTools(def)])
)

export function getAgent(slug: string): AgentDefinition | undefined {
  return agentRegistry[slug]
}

export function getAllAgentSlugs(): string[] {
  return Object.keys(agentRegistry)
}
