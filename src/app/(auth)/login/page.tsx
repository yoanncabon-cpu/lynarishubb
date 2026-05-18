"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"
import { LynarisLogo } from "@/components/shared/LynarisLogo"

type State = "idle" | "loading" | "error"

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const Spinner = () => (
  <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
    )}
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
const FEATURES = [
  "Une équipe IA spécialisée",
  "Opérationnel en 48h",
  "Appels, emails et contenu automatisés",
  "RGPD compliant, hébergé en Europe",
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState("loading")
    setErrorMsg("")
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : error.message)
      setState("error")
    } else {
      router.push("/dashboard")
    }
  }

  async function handleGoogle() {
    const supabase = getSupabaseBrowserClient()
    // Toujours rediriger vers l'URL canonique du dashboard (pas window.location.origin
    // qui pointe vers lynaris.pro quand on est sur la vitrine).
    // NEXT_PUBLIC_APP_URL doit être défini dans Vercel : https://lynarishubb.vercel.app
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/api/auth/callback` },
    })
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blob-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes blob-2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,40px) scale(1.05)} 66%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .auth-input { width:100%;height:44px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:0 12px;color:#FAFAFA;font-size:14px;box-sizing:border-box;outline:none;transition:border-color 150ms,box-shadow 150ms;font-family:inherit; }
        .auth-input::placeholder { color:rgba(250,250,250,0.3); }
        .auth-input:focus { border-color:rgba(232,111,77,0.65);box-shadow:0 0 0 3px rgba(232,111,77,0.12); }
        .auth-btn-primary { width:100%;height:44px;background:linear-gradient(135deg,#E86F4D 0%,#C8522F 100%);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 150ms,transform 150ms;box-shadow:0 4px 20px rgba(232,111,77,0.3),0 1px 0 rgba(255,255,255,0.1) inset; }
        .auth-btn-primary:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);}
        .auth-btn-primary:active:not(:disabled){transform:translateY(0);}
        .auth-btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .auth-btn-google { width:100%;height:44px;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(250,250,250,0.7);font-size:13px;font-weight:500;cursor:pointer;transition:background 150ms,border-color 150ms;font-family:inherit; }
        .auth-btn-google:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);}
        .auth-footer-link:hover{color:#F4956E!important;}
        .pwd-toggle:hover{color:rgba(250,250,250,0.7)!important;}
        .auth-mobile-logo{display:none;}
        @media(max-width:768px){
          .auth-left-panel{display:none!important;}
          .auth-right-panel{padding:24px 20px!important;flex:1 1 100%!important;}
          .auth-mobile-logo{display:flex!important;}
        }
        @media(max-width:480px){
          .auth-right-panel{padding:20px 16px!important;}
        }
      `}</style>

      <div style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        background: "#0C0C0F",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}>

        {/* ── Ambient blobs ── */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        }}>
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

        {/* ── LEFT PANEL — Branding ── */}
        <div className="auth-left-panel" style={{
          flex: "0 0 50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(32px, 5vw, 52px) clamp(32px, 5vw, 64px)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(160deg, rgba(232,111,77,0.06) 0%, transparent 50%, rgba(124,58,237,0.04) 100%)",
          position: "relative",
          zIndex: 1,
          animation: "fade-up 0.5s ease-out",
          boxSizing: "border-box",
        }}>
          {/* Logo */}
          <LynarisLogo size={36} />

          {/* Main copy */}
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#E86F4D",
              marginBottom: 20,
            }}>
              Plateforme agents IA
            </p>
            <h1 style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              color: "#FAFAFA",
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
              lineHeight: 1.65, margin: "0 0 40px",
              maxWidth: 380,
            }}>
              {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
              Une équipe IA spécialisée qui décroche tes appels, publie ton contenu et prospecte pour toi — 24h/24.
            </p>

            {/* Feature list */}
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

        {/* ── RIGHT PANEL — Form ── */}
        <div className="auth-right-panel" style={{
          flex: "0 0 50%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(28px, 4vw, 32px) clamp(28px, 4vw, 48px)",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
          boxSizing: "border-box",
          animation: "fade-up 0.5s ease-out 0.1s both",
        }}>
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Mobile logo */}
            <div className="auth-mobile-logo" style={{
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 32,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #E86F4D, #C8522F)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>Lynaris</span>
            </div>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 26, fontWeight: 700, color: "#FAFAFA",
                letterSpacing: "-0.03em", margin: "0 0 6px",
              }}>
                Connexion
              </h2>
              <p style={{ fontSize: 14, color: "rgba(250,250,250,0.45)", margin: 0 }}>
                Accède à ton équipe IA
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "rgba(250,250,250,0.55)", letterSpacing: "0.01em", marginBottom: 7,
                }}>
                  Adresse email
                </label>
                <input
                  id="email" type="email" required autoComplete="email"
                  placeholder="toi@entreprise.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, flexWrap: "wrap", gap: 6 }}>
                  <label htmlFor="password" style={{
                    fontSize: 12, fontWeight: 600,
                    color: "rgba(250,250,250,0.55)", letterSpacing: "0.01em",
                  }}>
                    Mot de passe
                  </label>
                  <Link href="/forgot-password" style={{
                    fontSize: 12, color: "#E86F4D", textDecoration: "none",
                    transition: "color 150ms",
                  }}>
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="pwd-toggle"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                    style={{
                      position: "absolute", right: 4, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(250,250,250,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: 8,
                      transition: "color 150ms",
                    }}
                  >
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {state === "error" && (
                <div style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 8, padding: "10px 14px",
                  color: "#FCA5A5", fontSize: 13,
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="auth-btn-primary"
              >
                {state === "loading" ? <Spinner /> : "Se connecter"}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 12, color: "rgba(250,250,250,0.3)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogle} className="auth-btn-google">
              <GoogleLogo />
              Continuer avec Google
            </button>

            {/* Footer */}
            <p style={{
              textAlign: "center", fontSize: 13,
              color: "rgba(250,250,250,0.4)", marginTop: 28,
            }}>
              Pas encore de compte ?{" "}
              <Link
                href="/signup"
                className="auth-footer-link"
                style={{ color: "#E86F4D", fontWeight: 500, textDecoration: "none", transition: "color 150ms" }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
