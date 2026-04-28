import { signHmac } from "@/lib/crypto"

export interface MakeCredentials {
  webhook_url: string
  secret: string
}

export interface MakeTriggerOptions {
  credentials: MakeCredentials
  workflowSlug: string
  payload: Record<string, unknown>
  orgId: string
  agentSlug?: string
  runId?: string
}

export interface MakeTriggerResult {
  success: boolean
  makeRequestId?: string
  error?: string
  statusCode?: number
}

/**
 * Trigger a Make (Integromat) scenario via instant webhook.
 * Payload signed with HMAC-SHA256 in X-Lynaris-Signature header.
 */
export async function triggerMakeScenario(options: MakeTriggerOptions): Promise<MakeTriggerResult> {
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
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: `Make request failed: ${message}` }
  }

  // Make returns 200 with "Accepted" on success
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return {
      success: false,
      statusCode: response.status,
      error: `Make returned ${response.status}: ${text.slice(0, 200)}`,
    }
  }

  const requestId = response.headers.get("x-request-id") ?? undefined

  return {
    success: true,
    makeRequestId: requestId,
    statusCode: response.status,
  }
}

/**
 * Verify an incoming webhook from Make.
 */
export async function verifyMakeWebhook(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const { verifyHmac } = await import("@/lib/crypto")
  return verifyHmac(body, secret, signature)
}
