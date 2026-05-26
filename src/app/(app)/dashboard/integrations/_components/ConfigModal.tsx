"use client"

import { useState, useEffect, useRef } from "react"

interface ConfigModalProps {
  provider: string
  name: string
  color: string
  domain?: string
  initial?: string
  isOpen: boolean
  isConnected?: boolean
  onClose: () => void
  onSaved: () => void
}

function ProviderLogo({ domain, name, color, initial, size = 40 }: {
  domain?: string
  name: string
  color: string
  initial?: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const letter = initial ?? name.charAt(0).toUpperCase()

  if (!domain || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.25,
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.38, color: "white",
        flexShrink: 0,
      }}>
        {letter}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: "rgba(255,255,255,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={name}
        width={size * 0.6}
        height={size * 0.6}
        style={{ objectFit: "contain", display: "block" }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  twilio: "Configurez vos identifiants Twilio pour les appels et SMS.",
  elevenlabs: "Connectez ElevenLabs pour la synthèse vocale IA.",
  stripe: "Ajoutez vos clés Stripe pour la gestion des paiements.",
  n8n: "Connectez votre instance n8n via un webhook pour déclencher vos workflows.",
  make: "Connectez Make (ex-Integromat) via un webhook pour déclencher vos scénarios.",
  whatsapp: "Connectez WhatsApp Business pour que vos agents communiquent via WhatsApp.",
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(245,245,247,0.7)",
  marginBottom: 6,
  display: "block",
}

const helperStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(245,245,247,0.35)",
  marginTop: 4,
}

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#F5F5F7",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  fontFamily: "var(--font-geist-sans)",
  boxSizing: "border-box",
}

const selectStyle: React.CSSProperties = {
  ...baseInputStyle,
  background: "rgba(255,255,255,0.05)",
  appearance: "none",
  cursor: "pointer",
}

interface FieldProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  helper?: string
  required?: boolean
  hasError?: boolean
  defaultValue?: string
}

function Field({ label, name, type = "text", placeholder, helper, required, hasError, defaultValue }: FieldProps) {
  const [focused, setFocused] = useState(false)

  const inputStyle: React.CSSProperties = {
    ...baseInputStyle,
    borderColor: hasError
      ? "rgba(239,68,68,0.5)"
      : focused
      ? "rgba(232,111,77,0.5)"
      : "rgba(255,255,255,0.1)",
    boxShadow: focused && !hasError ? "0 0 0 3px rgba(232,111,77,0.1)" : "none",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#E86F4D", marginLeft: 3 }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        style={inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        data-1p-ignore
      />
      {helper && <span style={helperStyle}>{helper}</span>}
    </div>
  )
}

function TwilioForm() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Account SID"
        name="account_sid"
        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        helper="Dashboard Twilio → Account Info"
        required
      />
      <Field
        label="Auth Token"
        name="auth_token"
        type="password"
        placeholder="••••••••••••••••••••••••••••••••"
        helper="Dashboard Twilio → Account Info (cliquez pour révéler)"
        required
      />
      <Field
        label="Numéro Twilio"
        name="phone_number"
        placeholder="+33612345678"
        helper="Format E.164 — Dashboard Twilio → Phone Numbers"
        required
      />
      <Field
        label="TwiML App SID"
        name="twiml_app_sid"
        placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        helper="Optionnel — pour le routage vocal avancé"
      />
    </div>
  )
}

function ElevenLabsForm() {
  const [focused, setFocused] = useState(false)

  const selectDynStyle: React.CSSProperties = {
    ...selectStyle,
    borderColor: focused ? "rgba(232,111,77,0.5)" : "rgba(255,255,255,0.1)",
    boxShadow: focused ? "0 0 0 3px rgba(232,111,77,0.1)" : "none",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Clé API ElevenLabs"
        name="api_key"
        type="password"
        placeholder="••••••••••••••••••••••••••••••••"
        helper="elevenlabs.io → Profile → API Keys"
        required
      />
      <Field
        label="Voice ID — Marine"
        name="voice_id_marine"
        placeholder="21m00Tcm4TlvDq8ikWAM"
        helper="Optionnel — ID de la voix utilisée par Marine. Laissez vide pour la voix par défaut."
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Modèle</label>
        <div style={{ position: "relative" }}>
          <select
            name="model_id"
            defaultValue="eleven_multilingual_v2"
            style={selectDynStyle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            <option value="eleven_multilingual_v2">Multilingual v2 (recommandé)</option>
            <option value="eleven_flash_v2_5">Flash v2.5 (ultra-rapide)</option>
            <option value="eleven_turbo_v2_5">Turbo v2.5</option>
          </select>
          <svg
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "rgba(245,245,247,0.4)",
            }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function StripeForm() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Secret Key"
        name="secret_key"
        type="password"
        placeholder="sk_live_... ou sk_test_..."
        helper="Dashboard Stripe → Développeurs → Clés API"
        required
      />
      <Field
        label="Publishable Key"
        name="publishable_key"
        placeholder="pk_live_... ou pk_test_..."
        helper="Dashboard Stripe → Développeurs → Clés API"
        required
      />
      <Field
        label="Webhook Secret"
        name="webhook_secret"
        type="password"
        placeholder="whsec_..."
        helper="Optionnel — Dashboard Stripe → Développeurs → Webhooks → Signing secret"
      />
    </div>
  )
}

function WebhookForm({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Webhook URL"
        name="webhook_url"
        placeholder="https://..."
        helper={`${label} → ton scénario/workflow → copie l'URL du webhook`}
        required
      />
      <Field
        label="Secret HMAC"
        name="secret"
        type="password"
        placeholder="Laisse vide pour en générer un automatiquement"
        helper="Optionnel — utilisé pour vérifier l'authenticité des requêtes entrantes"
      />
    </div>
  )
}

function WhatsAppMetaForm() {
  const [step, setStep] = useState<"form" | "webhook">("form")
  const [webhookInfo, setWebhookInfo] = useState<{
    verifyToken: string
    webhookUrl: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Inputs contrôlés — pas de <form> imbriqué
  const [phoneNumberId, setPhoneNumberId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [wabaId, setWabaId] = useState("")
  const [verifyTokenInput, setVerifyTokenInput] = useState("")

  async function handleConnectMeta() {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      setError("Phone Number ID et Access Token sont requis.")
      return
    }
    setSaving(true)
    setError(null)
    const body = {
      phone_number_id: phoneNumberId.trim(),
      access_token: accessToken.trim(),
      waba_id: wabaId.trim() || undefined,
      webhook_verify_token: verifyTokenInput.trim() || undefined,
    }
    try {
      const res = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as {
        success?: boolean
        error?: string | Record<string, unknown>
        webhook_verify_token?: string
        webhook_url?: string
      }
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Erreur de connexion."
        )
      } else {
        setWebhookInfo({
          verifyToken: data.webhook_verify_token ?? "",
          webhookUrl: data.webhook_url ?? "",
        })
        setStep("webhook")
      }
    } catch {
      setError("Erreur réseau.")
    } finally {
      setSaving(false)
    }
  }

  if (step === "webhook" && webhookInfo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 13, color: "#34D399", fontWeight: 600 }}
          >
            WhatsApp connecté !
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(245,245,247,0.6)" }}>
          Configure le webhook dans{" "}
          <strong>Meta for Developers</strong> → ton app → WhatsApp →
          Configuration :
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "rgba(245,245,247,0.4)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: 4,
              }}
            >
              URL de rappel (Callback URL)
            </label>
            <code
              style={{
                display: "block",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#F5F5F7",
                wordBreak: "break-all" as const,
              }}
            >
              {webhookInfo.webhookUrl}
            </code>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "rgba(245,245,247,0.4)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: 4,
              }}
            >
              Token de vérification
            </label>
            <code
              style={{
                display: "block",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#F5F5F7",
              }}
            >
              {webhookInfo.verifyToken}
            </code>
          </div>
        </div>
        <p
          style={{ margin: 0, fontSize: 11, color: "rgba(245,245,247,0.35)" }}
        >
          Dans le webhook, abonne-toi au champ <strong>messages</strong>.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Inputs contrôlés — pas de <form> imbriqué dans le form parent du modal */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Phone Number ID <span style={{ color: "#E86F4D" }}>*</span></label>
        <input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="123456789012345" style={baseInputStyle} autoComplete="off" />
        <span style={helperStyle}>Meta for Developers → ton app → WhatsApp → API Setup</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Access Token <span style={{ color: "#E86F4D" }}>*</span></label>
        <input value={accessToken} onChange={e => setAccessToken(e.target.value)} type="password" placeholder="EAAxxxxxxx..." style={baseInputStyle} autoComplete="off" />
        <span style={helperStyle}>Token temporaire (24h) ou permanent via token système Meta</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>WABA ID</label>
        <input value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="123456789012345" style={baseInputStyle} autoComplete="off" />
        <span style={helperStyle}>Optionnel — WhatsApp Business Account ID</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Webhook Verify Token</label>
        <input value={verifyTokenInput} onChange={e => setVerifyTokenInput(e.target.value)} placeholder="Laisse vide pour génération automatique" style={baseInputStyle} autoComplete="off" />
        <span style={helperStyle}>Tu le copieras dans Meta après la connexion</span>
      </div>
      {error && <p style={{ margin: 0, fontSize: 13, color: "#F87171" }}>{error}</p>}
      <button
        type="button"
        onClick={() => void handleConnectMeta()}
        disabled={saving}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          height: 44, borderRadius: 10, border: "none",
          background: saving ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #25D366, #128C7E)",
          color: "white", fontSize: 14, fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Connexion en cours…" : "Connecter WhatsApp Business"}
      </button>
    </div>
  )
}

function ProviderForm({ provider }: { provider: string }) {
  if (provider === "twilio") return <TwilioForm />
  if (provider === "elevenlabs") return <ElevenLabsForm />
  if (provider === "stripe") return <StripeForm />
  if (provider === "n8n") return <WebhookForm label="n8n" />
  if (provider === "make") return <WebhookForm label="Make" />
  if (provider === "whatsapp") return <WhatsAppMetaForm />
  return (
    <p style={{ fontSize: 13, color: "rgba(245,245,247,0.5)", textAlign: "center", padding: "16px 0" }}>
      Formulaire non disponible pour ce provider.
    </p>
  )
}

export function ConfigModal({ provider, name, color, domain, initial, isOpen, isConnected, onClose, onSaved }: ConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // WhatsApp gère sa propre connexion via WhatsAppMetaForm — pas de submit ici
    if (provider === "whatsapp") return
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const body = Object.fromEntries(formData.entries()) as Record<string, string>
    // Remove empty optional fields
    Object.keys(body).forEach((k) => { if (!body[k]) delete body[k] })

    try {
      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { success?: boolean; error?: unknown; message?: string }

      if (!res.ok || !data.success) {
        // Zod retourne { fieldErrors, formErrors } — on aplatit en message lisible
        if (data.error && typeof data.error === "object" && "fieldErrors" in data.error) {
          const fe = data.error.fieldErrors as Record<string, string[]>
          const msgs = Object.entries(fe)
            .map(([k, v]) => `${k} : ${(v as string[]).join(", ")}`)
            .join(" — ")
          setError(msgs || "Données invalides")
        } else {
          setError(typeof data.error === "string" ? data.error : "Erreur de connexion")
        }
        setLoading(false)
        return
      }

      setLoading(false)
      onSaved()
      onClose()
    } catch {
      setError("Erreur réseau — vérifiez votre connexion")
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    setError(null)
    try {
      await fetch(`/api/integrations/${provider}/disconnect`, { method: "DELETE" })
      onSaved()
      onClose()
    } catch {
      setError("Erreur lors de la déconnexion")
    } finally {
      setLoading(false)
    }
  }

  const description = PROVIDER_DESCRIPTIONS[provider] ?? `Configurez votre intégration ${name}.`

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 50,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          background: "#1C1C26",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          zIndex: 51,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <ProviderLogo domain={domain} name={name} color={color} initial={initial} size={40} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="config-modal-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F5F5F7", letterSpacing: "-0.02em" }}
            >
              Configurer {name}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(245,245,247,0.45)", lineHeight: 1.4 }}>
              {description}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(245,245,247,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget
              btn.style.background = "rgba(255,255,255,0.08)"
              btn.style.color = "#F5F5F7"
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget
              btn.style.background = "rgba(255,255,255,0.04)"
              btn.style.color = "rgba(245,245,247,0.5)"
            }}
            aria-label="Fermer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <ProviderForm provider={provider} />

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                fontSize: 12,
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              paddingTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Disconnect (left side) */}
            <div>
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    borderRadius: 9,
                    border: "1px solid rgba(239,68,68,0.25)",
                    background: "transparent",
                    color: "#EF4444",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                  }}
                >
                  Déconnecter
                </button>
              )}
            </div>

            {/* Annuler + Connecter (right side) — le bouton Connecter est masqué pour WhatsApp (géré par WhatsAppMetaForm) */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  height: 34,
                  padding: "0 16px",
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(245,245,247,0.7)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"
                }}
              >
                Annuler
              </button>

              {provider !== "whatsapp" && (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 34,
                    padding: "0 18px",
                    borderRadius: 9,
                    border: "none",
                    background: loading ? "rgba(232,111,77,0.6)" : "#E86F4D",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.15s, opacity 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 100,
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#D4613F"
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#E86F4D"
                  }}
                >
                  {loading && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    >
                      <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <path d="M6.5 1.5a5 5 0 0 1 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </svg>
                  )}
                  {loading ? "Connexion..." : isConnected ? "Reconfigurer" : "Connecter"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
