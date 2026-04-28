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

export const agentRegistry: Record<string, AgentDefinition> = {
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

export function getAgent(slug: string): AgentDefinition | undefined {
  return agentRegistry[slug]
}

export function getAllAgentSlugs(): string[] {
  return Object.keys(agentRegistry)
}
