"use client"

import { useState } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"
import { LynarisLogo } from "@/components/shared/LynarisLogo"

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const Spinner = () => (
  <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

// Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
const FEATURES = [
  "Une équipe IA spécialisée",
  "Opérationnel en 48h",
  "Appels, emails et contenu automatisés",
  "RGPD compliant, hébergé en Europe",
]

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState("loading")
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/settings`,
      })
      if (sbError) throw sbError
      setState("sent")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setState("error")
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blob-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes blob-2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,40px) scale(1.05)} 66%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        .auth-input { width:100%;height:44px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:0 12px;color:#FAFAFA;font-size:14px;box-sizing:border-box;outline:none;transition:border-color 150ms,box-shadow 150ms;font-family:inherit; }
        .auth-input::placeholder { color:rgba(250,250,250,0.3); }
        .auth-input:focus { border-color:rgba(232,111,77,0.65);box-shadow:0 0 0 3px rgba(232,111,77,0.12); }
        .auth-btn-primary { width:100%;height:44px;background:linear-gradient(135deg,#E86F4D 0%,#C8522F 100%);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 150ms,transform 150ms;box-shadow:0 4px 20px rgba(232,111,77,0.3),0 1px 0 rgba(255,255,255,0.1) inset; }
        .auth-btn-primary:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);}
        .auth-btn-primary:active:not(:disabled){transform:translateY(0);}
        .auth-btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .auth-footer-link:hover{color:#F4956E!important;}
        @media(max-width:768px){.login-left{display:none!important;}.login-right{max-width:440px!important;margin:0 auto;}}
      `}</style>

      <div style={{
        minHeight: "100dvh",
        display: "flex",
        background: "#111114",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Blobs animés */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", top: "-10%", left: "5%",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,111,77,0.12) 0%, transparent 70%)",
            animation: "blob-1 12s ease-in-out infinite",
            filter: "blur(40px)",
          }} />
          <div style={{
            position: "absolute", bottom: "-15%", right: "10%",
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
            animation: "blob-2 16s ease-in-out infinite",
            filter: "blur(40px)",
          }} />
        </div>

        {/* ── PANNEAU GAUCHE — Branding ── */}
        <div className="login-left" style={{
          flex: "0 0 48%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
          animation: "fade-up 0.6s ease-out",
        }}>
          {/* Logo */}
          <LynarisLogo size={36} />

          {/* Texte principal */}
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#E86F4D", marginBottom: 20,
            }}>
              Plateforme agents IA
            </p>
            <h1 style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800, lineHeight: 1.1,
              letterSpacing: "-0.04em", color: "#FAFAFA",
              margin: "0 0 24px",
            }}>
              Ton équipe IA.<br />
              <span style={{
                background: "linear-gradient(135deg, #E86F4D, #F4956E)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Qui exécute.
              </span>
            </h1>
            <p style={{
              fontSize: 16, color: "rgba(250,250,250,0.5)",
              lineHeight: 1.65, margin: "0 0 40px", maxWidth: 380,
            }}>
              {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
              Une équipe IA spécialisée qui décroche tes appels, publie ton contenu et prospecte pour toi — 24h/24.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: "rgba(52,211,153,0.12)",
                    border: "1px solid rgba(52,211,153,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CheckIcon />
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(250,250,250,0.7)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Témoignage retiré — pas d'accord de citation client */}
        </div>

        {/* ── PANNEAU DROIT — Formulaire ── */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          animation: "fade-up 0.6s ease-out 0.1s both",
        }}>
          <div style={{ width: "100%", maxWidth: 400 }}>

            {state !== "sent" ? (
              <>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{
                    fontSize: 26, fontWeight: 700, color: "#FAFAFA",
                    letterSpacing: "-0.03em", margin: "0 0 6px",
                  }}>
                    Mot de passe oublié
                  </h2>
                  <p style={{ fontSize: 14, color: "rgba(250,250,250,0.45)", margin: 0 }}>
                    Entre ton email pour recevoir un lien de réinitialisation.
                  </p>
                </div>

                {/* Formulaire */}
                <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label htmlFor="email" style={{
                      display: "block", fontSize: 12, fontWeight: 600,
                      color: "rgba(250,250,250,0.55)", letterSpacing: "0.01em", marginBottom: 7,
                    }}>
                      Adresse email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="toi@entreprise.fr"
                      required
                      autoComplete="email"
                      className="auth-input"
                    />
                  </div>

                  {state === "error" && error && (
                    <div style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: 8, padding: "10px 14px",
                      color: "#FCA5A5", fontSize: 13,
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="auth-btn-primary"
                  >
                    {state === "loading" ? <Spinner /> : "Envoyer le lien"}
                  </button>
                </form>

                <p style={{
                  textAlign: "center", fontSize: 13,
                  color: "rgba(250,250,250,0.4)", marginTop: 28,
                }}>
                  <Link
                    href="/login"
                    className="auth-footer-link"
                    style={{ color: "#E86F4D", fontWeight: 500, textDecoration: "none", transition: "color 150ms" }}
                  >
                    ← Retour à la connexion
                  </Link>
                </p>
              </>
            ) : (
              /* État succès */
              <div style={{ textAlign: "center", animation: "scale-in 0.4s ease-out" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="#34D399" strokeWidth="1.5" />
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{
                  fontSize: 24, fontWeight: 700, color: "#FAFAFA",
                  letterSpacing: "-0.03em", margin: "0 0 10px",
                }}>
                  Email envoyé !
                </h2>
                <p style={{
                  fontSize: 14, color: "rgba(250,250,250,0.5)",
                  lineHeight: 1.6, margin: "0 0 32px", maxWidth: 300, marginLeft: "auto", marginRight: "auto",
                }}>
                  Vérifie ta boîte mail. Le lien de réinitialisation est valable 1 heure.
                </p>
                <div style={{
                  padding: "14px 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, marginBottom: 28,
                  fontSize: 13, color: "rgba(250,250,250,0.5)",
                }}>
                  Lien envoyé à <span style={{ color: "#FAFAFA", fontWeight: 500 }}>{email}</span>
                </div>
                <Link
                  href="/login"
                  className="auth-footer-link"
                  style={{
                    display: "inline-block",
                    fontSize: 13, color: "#E86F4D",
                    fontWeight: 500, textDecoration: "none",
                    transition: "color 150ms",
                  }}
                >
                  ← Retour à la connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
