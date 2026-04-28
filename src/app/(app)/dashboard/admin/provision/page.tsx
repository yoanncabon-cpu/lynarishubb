"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Plans DB conservés (enum planEnum) — labels mis à jour vers la nouvelle
// nomenclature 3 plans : starter (legacy) reste sélectionnable pour
// rétrocompat mais affiché comme Pro.
type Plan = "starter" | "pro" | "scale"

const PLAN_OPTIONS: { id: Plan; label: string; desc: string; color: string }[] = [
  { id: "pro",      label: "Pro",         desc: "149€/mois — Tous les agents, 1 500 actions", color: "#7C3AED" },
  { id: "scale",    label: "Sur-mesure",  desc: "Sur devis — Agent dédié, illimité",          color: "#F59E0B" },
  { id: "starter",  label: "Pro (legacy)", desc: "Ancien identifiant Essentiel — rétrocompat", color: "#52525B" },
]

interface Result {
  success: boolean
  action?: string
  error?: string
}

export default function AdminProvisionPage() {
  const [email, setEmail]     = useState("")
  const [fullName, setFullName] = useState("")
  const [orgName, setOrgName] = useState("")
  // Plan par défaut : Sur-mesure (scale en DB)
  const [plan, setPlan]       = useState<Plan>("scale")
  const [notes, setNotes]     = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<Result | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, orgName, plan, notes }),
      })
      const data = await res.json() as Result
      setResult(data)
      if (data.success) {
        setEmail("")
        setFullName("")
        setOrgName("")
        setNotes("")
      }
    } catch {
      setResult({ success: false, error: "Erreur réseau." })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#F5F5F7",
    fontSize: 14,
    padding: "0 12px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(245,245,247,0.55)",
    display: "block",
    marginBottom: 6,
    letterSpacing: "0.02em",
  }

  return (
    <div style={{ maxWidth: 600, padding: "32px 24px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/dashboard/admin/tickets"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(245,245,247,0.4)", textDecoration: "none", marginBottom: 20 }}
        >
          <ArrowLeft size={13} /> Admin
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserPlus size={18} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F5F5F7", margin: 0 }}>
              Créer un compte client
            </h1>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: "2px 0 0" }}>
              Scale · Sur-mesure · Offert
            </p>
          </div>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div style={{
          marginBottom: 24,
          padding: "14px 16px",
          borderRadius: 12,
          background: result.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${result.success ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          {result.success
            ? <CheckCircle2 size={16} style={{ color: "#10B981", marginTop: 1, flexShrink: 0 }} />
            : <span style={{ color: "#F87171", fontSize: 16, flexShrink: 0 }}>⚠</span>
          }
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: result.success ? "#10B981" : "#F87171" }}>
              {result.success
                ? result.action === "plan_updated"
                  ? "Plan mis à jour — le client peut se connecter."
                  : "Compte créé — invitation envoyée par email."
                : "Erreur"
              }
            </p>
            {result.error && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(248,113,113,0.8)" }}>{result.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => { void handleSubmit(e) }}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >

        {/* Email */}
        <div>
          <label style={labelStyle}>Email du client *</label>
          <input
            type="email"
            required
            placeholder="julien@cabinet-menigoz.fr"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Nom */}
        <div>
          <label style={labelStyle}>Nom complet *</label>
          <input
            type="text"
            required
            // Placeholder Julien Ménigoz retiré — pas d'accord de citation
            placeholder="Prénom Nom"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Org */}
        <div>
          <label style={labelStyle}>Nom de l&apos;organisation *</label>
          <input
            type="text"
            required
            // Placeholder Cabinet Ménigoz retiré — pas d'accord de citation
            placeholder="Nom de l'organisation"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Plan */}
        <div>
          <label style={labelStyle}>Plan attribué *</label>
          <div style={{ display: "flex", gap: 10 }}>
            {PLAN_OPTIONS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: plan === p.id ? `1.5px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
                  background: plan === p.id ? `${p.color}14` : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: plan === p.id ? p.color : "rgba(245,245,247,0.6)" }}>
                  {p.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(245,245,247,0.35)", lineHeight: 1.4 }}>
                  {p.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes internes */}
        <div>
          <label style={labelStyle}>Notes internes (optionnel)</label>
          <textarea
            placeholder="Ex : Deal conclu le 26/04, 590€/mois, 12 mois engagement…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              height: "auto",
              padding: "10px 12px",
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Info box */}
        <div style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
          fontSize: 12,
          color: "rgba(147,197,253,0.8)",
          lineHeight: 1.6,
        }}>
          <strong style={{ color: "#93C5FD" }}>Ce qui se passe :</strong> Supabase envoie un email d&apos;invitation au client avec un lien d&apos;activation. Il clique → définit son mot de passe → accède directement au dashboard avec le plan {PLAN_OPTIONS.find(p => p.id === plan)?.label}.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !fullName || !orgName}
          style={{
            height: 44,
            borderRadius: 12,
            border: "none",
            background: loading || !email || !fullName || !orgName
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(135deg, #F59E0B, #D97706)",
            color: loading || !email || !fullName || !orgName ? "#52525B" : "#0C0C0F",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading || !email || !fullName || !orgName ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.15s",
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Création en cours…</>
            : <><UserPlus size={16} /> Créer le compte et envoyer l&apos;invitation</>
          }
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
