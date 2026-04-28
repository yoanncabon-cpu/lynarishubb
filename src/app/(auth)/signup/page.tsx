"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser"
import { LynarisLogo } from "@/components/shared/LynarisLogo"

type State = "idle" | "loading" | "success" | "error"

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

const CheckCircleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="#52B788" strokeWidth="2" />
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#52B788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

// Labels affichés à partir du paramètre ?plan=… de l'URL.
// Anciens identifiants ('essentiel', 'cabinet', 'scale') conservés
// pour rétrocompat des liens externes / campagnes en cours.
const PLAN_LABELS: Record<string, string> = {
  decouverte: "Découverte",
  pro: "Pro",
  custom: "Sur-mesure",
  // Rétrocompat
  essentiel: "Pro",
  cabinet: "Sur-mesure",
  scale: "Sur-mesure",
}

// Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
const features = [
  { label: "Équipe IA Lynaris" },
  { label: "Opérationnel en 48h" },
  { label: "Sans engagement" },
]

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", cgu: false })
  const [showPwd, setShowPwd] = useState(false)
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const p = searchParams.get("plan")
    if (p) setPlan(p)
  }, [searchParams])

  function validate(): string | null {
    if (!form.name.trim()) return "Le prénom est requis."
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Email invalide."
    if (form.password.length < 8) return "Mot de passe trop court (8 caractères min)."
    if (!form.cgu) return "Merci d'accepter les conditions d'utilisation."
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validate()
    if (err) { setErrorMsg(err); setState("error"); return }
    setState("loading")
    setErrorMsg("")
    const supabase = getSupabaseBrowserClient()
    const redirectTo = plan
      ? `${window.location.origin}/api/auth/callback?plan=${encodeURIComponent(plan)}`
      : `${window.location.origin}/api/auth/callback`
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name }, emailRedirectTo: redirectTo },
    })
    if (error) {
      const msg =
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cet email. Connecte-toi."
          : error.message
      setErrorMsg(msg)
      setState("error")
    } else if (data.session) {
      // Email confirmation disabled — connexion directe
      const dest = plan ? `/onboarding?plan=${plan}` : "/onboarding"
      router.push(dest)
    } else {
      // Confirmation email envoyée
      setState("success")
    }
  }

  async function handleGoogle() {
    if (plan) {
      document.cookie = `lynaris_pending_plan=${encodeURIComponent(plan)}; max-age=900; path=/; SameSite=Lax`
    }
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  /* Styles partagés inputs */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 42,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 9,
    padding: "0 12px",
    color: "#FAFAFA",
    fontSize: 14,
    boxSizing: "border-box",
    transition: "border-color 150ms, box-shadow 150ms",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(250,250,250,0.6)",
    letterSpacing: "0.01em",
    marginBottom: 6,
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input::placeholder { color: rgba(250,250,250,0.3); }
        .auth-input:focus {
          outline: none;
          border-color: rgba(232,111,77,0.6) !important;
          box-shadow: 0 0 0 3px rgba(232,111,77,0.12);
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #F47856 0%, #E06444 100%) !important;
        }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-btn-google:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.18) !important;
        }
        .cgu-link { color: #E86F4D; text-decoration: none; }
        .cgu-link:hover { text-decoration: underline; }
        .pwd-toggle:hover { color: rgba(250,250,250,0.7) !important; }
        .auth-footer-link:hover { color: #F4956E !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#111114",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,111,77,0.07) 0%, transparent 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
            <LynarisLogo size={36} />
          </div>

          {/* Card */}
          <div style={{
            background: "#141416",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.4)",
          }}>

            {state === "success" ? (
              /* ── Success ── */
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <CheckCircleIcon />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#FAFAFA", margin: "0 0 8px" }}>
                  Vérifie ta boîte mail
                </h2>
                <p style={{ fontSize: 14, color: "rgba(250,250,250,0.5)", lineHeight: 1.6, margin: 0 }}>
                  Un lien de confirmation a été envoyé à{" "}
                  <strong style={{ color: "#FAFAFA" }}>{form.email}</strong>.
                  <br />Clique dessus pour activer ton compte.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                    <h1 style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#FAFAFA",
                      margin: 0,
                      letterSpacing: "-0.03em",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}>
                      Créer un compte
                    </h1>
                    <span style={{
                      background: "rgba(232,111,77,0.15)",
                      border: "1px solid rgba(232,111,77,0.3)",
                      borderRadius: 20,
                      padding: "2px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#E86F4D",
                      whiteSpace: "nowrap",
                    }}>
                      14 jours gratuits
                    </span>
                  </div>

                  {plan && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(124,58,237,0.12)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: 20,
                      padding: "4px 12px",
                      marginBottom: 10,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M9 12l2 2 4-4" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="10" stroke="#A78BFA" strokeWidth="2" />
                      </svg>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA" }}>
                        Plan {PLAN_LABELS[plan.toLowerCase()] ?? plan} sélectionné
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                    {features.map(f => (
                      <span key={f.label} style={{ fontSize: 12, color: "rgba(250,250,250,0.35)" }}>
                        · {f.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Form — en premier pour forcer email+mdp */}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Nom */}
                  <div>
                    <label htmlFor="name" style={labelStyle}>
                      Prénom et nom
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Yoann Martin"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="auth-input"
                      style={inputStyle}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" style={labelStyle}>
                      Email professionnel
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="toi@entreprise.fr"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="auth-input"
                      style={inputStyle}
                    />
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label htmlFor="password" style={labelStyle}>
                      Mot de passe
                      <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(250,250,250,0.3)", fontWeight: 400 }}>
                        8 caractères min.
                      </span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="password"
                        type={showPwd ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="auth-input"
                        style={{ ...inputStyle, padding: "0 40px 0 12px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="pwd-toggle"
                        aria-label={showPwd ? "Masquer" : "Afficher"}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(250,250,250,0.35)",
                          display: "flex",
                          alignItems: "center",
                          transition: "color 150ms",
                          padding: 0,
                        }}
                      >
                        <EyeIcon open={showPwd} />
                      </button>
                    </div>
                  </div>

                  {/* CGU */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.cgu}
                      onChange={(e) => setForm({ ...form, cgu: e.target.checked })}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: "#E86F4D", flexShrink: 0, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 12, color: "rgba(250,250,250,0.45)", lineHeight: 1.5 }}>
                      J&apos;accepte les{" "}
                      <Link href="/legal/cgu" className="cgu-link" target="_blank" rel="noopener noreferrer">
                        conditions d&apos;utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href="/legal/confidentialite" className="cgu-link" target="_blank" rel="noopener noreferrer">
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>

                  {/* Error */}
                  {state === "error" && (
                    <div style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      color: "#FCA5A5",
                      fontSize: 13,
                    }}>
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="auth-btn-primary"
                    style={{
                      width: "100%",
                      height: 42,
                      background: "linear-gradient(135deg, #E86F4D 0%, #D05A38 100%)",
                      border: "none",
                      borderRadius: 9,
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "background 150ms",
                      marginTop: 4,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(232,111,77,0.3) inset",
                    }}
                  >
                    {state === "loading" ? <Spinner /> : "Créer mon compte"}
                  </button>
                </form>

                {/* Google OAuth — option secondaire */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <span style={{ fontSize: 12, color: "rgba(250,250,250,0.35)" }}>ou continuer avec</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="auth-btn-google"
                  style={{
                    width: "100%",
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 9,
                    color: "rgba(250,250,250,0.6)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 150ms, border-color 150ms",
                  }}
                >
                  <GoogleLogo />
                  Google
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(250,250,250,0.45)", marginTop: 20 }}>
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="auth-footer-link"
              style={{ color: "#E86F4D", fontWeight: 500, textDecoration: "none", transition: "color 150ms" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
