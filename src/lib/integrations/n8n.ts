import { signHmac } from "@/lib/crypto"

export interface N8nCredentials {
  webhook_url: string
  secret: string
}

export interface N8nTriggerOptions {
  credentials: N8nCredentials
  workflowSlug: string
  payload: Record<string, unknown>
  orgId: string
  agentSlug?: string
  runId?: string
}

export interface N8nTriggerResult {
  success: boolean
  n8nExecutionId?: string
  error?: string
  statusCode?: number
}

/**
 * Trigger an n8n workflow via webhook.
 * Payload is signed with HMAC-SHA256.
 */
export async function triggerN8nWorkflow(options: N8nTriggerOptions): Promise<N8nTriggerResult> {
  const { credentials, workflowSlug, payload, orgId, agentSlug, runId } = options

  const body = JSON.stringify({
    workflow: workflowSlug,
    org_id: orgId,
    agent_slug: agentSlug,
    run_id: runId ?? `run_${Date.now()}`,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  const signature = await signHmac(body, credentials.secret)

  let response: Response
  try {
    response = await fetch(credentials.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lynaris-Signature": signature,
        "X-Lynaris-Org": orgId,
        "X-Lynaris-Workflow": workflowSlug,
      },
      body,
      signal: AbortSignal.timeout(30_000), // 30s timeout
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: `n8n request failed: ${message}` }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return {
      success: false,
      statusCode: response.status,
      error: `n8n returned ${response.status}: ${text.slice(0, 200)}`,
    }
  }

  let responseData: Record<string, unknown> = {}
  try {
    responseData = await response.json() as Record<string, unknown>
  } catch {
    // n8n sometimes returns empty body — that's OK
  }

  return {
    success: true,
    n8nExecutionId: responseData["executionId"] as string | undefined,
    statusCode: response.status,
  }
}

/**
 * Verify an incoming webhook from n8n (callback after workflow completion).
 */
export async function verifyN8nWebhook(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const { verifyHmac } = await import("@/lib/crypto")
  return verifyHmac(body, secret, signature)
}
