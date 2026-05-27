"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"
import { LynarisLogo } from "@/components/shared/LynarisLogo"

type State = "verifying" | "set-password" | "success" | "error"

const Spinner = () => (
  <svg style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [state, setState] = useState<State>("verifying")
  const [errorMsg, setErrorMsg] = useState("")
  const [password, setPassword]     = useState("")
  const [confirm, setConfirm]       = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError]     = useState("")

  useEffect(() => {
    const token_hash = params.get("token_hash")
    const type       = params.get("type") ?? "invite"

    if (!token_hash) {
      setState("error")
      setErrorMsg("Lien d'invitation invalide ou expiré.")
      return
    }

    const supabase = getSupabaseBrowserClient()

    supabase.auth
      .verifyOtp({ token_hash, type: type as "invite" })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) {
          setState("error")
          setErrorMsg(
            error.message.includes("expired")
              ? "Ce lien d'invitation a expiré. Demande à l'administrateur d'en créer un nouveau."
              : `Erreur d'activation : ${error.message}`
          )
        } else {
          // Token vérifié — demander de définir un mot de passe
          setState("set-password")
        }
      })
      .catch(() => {
        setState("error")
        setErrorMsg("Erreur réseau — réessaie.")
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setPwdError("Minimum 8 caractères"); return }
    if (password !== confirm)  { setPwdError("Les mots de passe ne correspondent pas"); return }

    setPwdLoading(true)
    setPwdError("")

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setPwdError(error.message)
      setPwdLoading(false)
    } else {
      setState("success")
      setTimeout(() => router.push("/dashboard"), 1400)
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0C0C0F",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <LynarisLogo size={28} />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20, padding: 32,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        }}>

          {/* ── Verifying ── */}
          {state === "verifying" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "#E86F4D" }}>
                <Spinner />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 6px" }}>
                Activation en cours…
              </p>
              <p style={{ fontSize: 13, color: "#52525B", margin: 0 }}>
                Vérification de ton invitation
              </p>
            </div>
          )}

          {/* ── Set password ── */}
          {state === "set-password" && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                  Bienvenue sur Lynaris
                </h1>
                <p style={{ fontSize: 13, color: "#71717A", margin: 0, lineHeight: 1.5 }}>
                  Définis ton mot de passe pour accéder à ton espace.
                </p>
              </div>

              <form onSubmit={handleSetPassword}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#A1A1AA", marginBottom: 7, letterSpacing: "0.02em" }}>
                    Mot de passe <span style={{ color: "#E86F4D" }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="ly-input"
                    style={{ width: "100%", height: 42, padding: "0 12px", fontSize: 13, boxSizing: "border-box", borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#A1A1AA", marginBottom: 7, letterSpacing: "0.02em" }}>
                    Confirmer le mot de passe <span style={{ color: "#E86F4D" }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répète le mot de passe"
                    className="ly-input"
                    style={{ width: "100%", height: 42, padding: "0 12px", fontSize: 13, boxSizing: "border-box", borderRadius: 8 }}
                  />
                </div>

                {pwdError && (
                  <p style={{ fontSize: 12, color: "#F87171", margin: "-8px 0 14px", lineHeight: 1.5 }}>
                    {pwdError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwdLoading}
                  style={{
                    width: "100%", height: 42, borderRadius: 10, border: "none",
                    background: pwdLoading ? "rgba(232,111,77,0.5)" : "#E86F4D",
                    color: "white", fontSize: 13, fontWeight: 600,
                    cursor: pwdLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 150ms",
                    boxShadow: pwdLoading ? "none" : "0 2px 12px rgba(232,111,77,0.3)",
                  }}
                >
                  {pwdLoading ? <><Spinner /> Enregistrement…</> : "Accéder à mon espace"}
                </button>
              </form>
            </>
          )}

          {/* ── Success ── */}
          {state === "success" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px" }}>
                Compte activé
              </p>
              <p style={{ fontSize: 13, color: "#52525B", margin: 0 }}>
                Redirection vers ton tableau de bord…
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", margin: "0 0 8px" }}>
                Invitation invalide
              </p>
              <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 20px", lineHeight: 1.6 }}>
                {errorMsg}
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  height: 38, padding: "0 20px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#A1A1AA", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", transition: "all 150ms",
                }}
              >
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#3F3F46", marginTop: 20 }}>
          Un problème ?{" "}
          <a href="mailto:support@lynarisai.com" style={{ color: "#52525B", textDecoration: "underline" }}>
            Contacte le support
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
