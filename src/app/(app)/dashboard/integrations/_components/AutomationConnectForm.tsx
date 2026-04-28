"use client"

import { useState } from "react"

interface AutomationConnectFormProps {
  provider: "n8n" | "make"
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function AutomationConnectForm({ provider, isConnected, onConnect, onDisconnect }: AutomationConnectFormProps) {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGeneratedSecret(null)

    try {
      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          ...(secret.length >= 16 ? { secret } : {}),
        }),
      })

      const data = await res.json() as { success?: boolean; secret?: string; error?: unknown }

      if (!res.ok || !data.success) {
        setError(typeof data.error === "string" ? data.error : "Connexion failed")
        return
      }

      setGeneratedSecret(data.secret ?? null)
      setWebhookUrl("")
      setSecret("")
      onConnect()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    setError(null)
    setGeneratedSecret(null)

    try {
      await fetch(`/api/integrations/${provider}/disconnect`, { method: "DELETE" })
      onDisconnect()
    } catch {
      setError("Disconnect failed")
    } finally {
      setLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-[--ly-success]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Connected</span>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={loading}
          className="h-8 px-3 rounded-lg border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Disconnect"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3">
      <div>
        <label className="text-xs text-[--ly-text-muted] mb-1 block">Webhook URL</label>
        <input
          type="url"
          required
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder={provider === "n8n" ? "https://n8n.example.com/webhook/..." : "https://hook.eu2.make.com/..."}
          className="w-full h-9 px-3 rounded-lg bg-[--ly-bg] border border-[--ly-border] text-sm text-[--ly-text] placeholder:text-[--ly-text-muted]/50 focus:outline-none focus:border-[--ly-primary] transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-[--ly-text-muted] mb-1 block">Secret HMAC <span className="opacity-60">(optional, auto-generated if empty)</span></label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="min 16 characters, or leave empty"
          className="w-full h-9 px-3 rounded-lg bg-[--ly-bg] border border-[--ly-border] text-sm text-[--ly-text] placeholder:text-[--ly-text-muted]/50 focus:outline-none focus:border-[--ly-primary] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !webhookUrl}
        className="h-8 px-4 rounded-lg bg-[--ly-primary] text-xs font-medium text-white hover:bg-[--ly-primary-soft] transition-colors disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {generatedSecret && (
        <div className="p-3 rounded-lg bg-[--ly-primary]/10 border border-[--ly-primary]/20">
          <p className="text-xs text-[--ly-text] mb-1 font-medium">Secret generated -- save it now, it will not be shown again:</p>
          <code className="text-xs text-[--ly-primary] break-all select-all">{generatedSecret}</code>
        </div>
      )}
    </form>
  )
}
