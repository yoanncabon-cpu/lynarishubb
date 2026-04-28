import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { streamAgent, runAgent } from "./executor"
import type { AgentConfig } from "./registry"

export interface OrchestratorOptions {
  userMessage: string
  history?: MessageParam[]
  orgId: string
  orgConfig?: AgentConfig
}

/**
 * Stream Charles's response to a user message.
 * Charles handles orchestration internally via tool calls.
 */
export async function* streamCharles(
  options: OrchestratorOptions
): AsyncGenerator<string> {
  const { userMessage, history = [], orgId, orgConfig = {} } = options

  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ]

  yield* streamAgent({
    agentSlug: "charles",
    messages,
    config: orgConfig,
    orgId,
    maxIterations: 8,
  })
}

/**
 * Run Charles non-streaming (for cron jobs, webhooks, etc.)
 */
export async function runCharles(options: OrchestratorOptions) {
  const { userMessage, history = [], orgId, orgConfig = {} } = options

  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ]

  return runAgent({
    agentSlug: "charles",
    messages,
    config: orgConfig,
    orgId,
    maxIterations: 8,
  })
}
