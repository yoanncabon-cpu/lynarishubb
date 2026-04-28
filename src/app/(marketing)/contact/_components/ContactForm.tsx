"use client"

import { Mail, MapPin, ArrowRight, Clock, MessageSquare, Zap } from "lucide-react"
import { useActionState } from "react"
import { submitContact, type ContactState } from "../actions"
import { agents } from "@/lib/agents/data"

interface ContactFormProps {
  initialAgent?: string
  initialPlan?: string
  initialSource?: string
}

export default function ContactForm({
  initialAgent = "",
  initialPlan = "",
  initialSource = "",
}: ContactFormProps) {
  const [state, action, isPending] = useActionState<ContactState, FormData>(
    submitContact,
    { status: "idle" }
  )

  // Préselection : si l'utilisateur arrive via un CTA "Être notifié" sur la page d'un agent,
  // le slug est passé en query param pour pré-remplir le select et router le lead vers le bon agent
  const preselectedAgent = agents.find(a => a.slug === initialAgent)

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", position: "relative", overflow: "hidden" }}>

      {/* Ambient glows */}
      <div aria-hidden style={{
        position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(232,111,77,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: 0, right: -100,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", marginBottom: 16,
              padding: "4px 14px", borderRadius: 999,
              background: "rgba(232,111,77,0.1)", border: "1px solid rgba(232,111,77,0.2)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#E86F4D",
            }}>
              Contact
            </span>
            <h1 style={{
              margin: "0 0 16px",
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
              color: "#F5F5F7",
            }}>
              Parlons de ton projet
            </h1>
            <p style={{
              margin: 0, fontSize: 17, lineHeight: 1.65,
              color: "rgba(245,245,247,0.55)", maxWidth: 520, marginLeft: "auto", marginRight: "auto",
            }}>
              Explique-nous ton besoin. On te répond sous&nbsp;
              <span style={{ color: "#E86F4D", fontWeight: 600 }}>24&nbsp;h</span>
              {" "}avec une proposition adaptée.
            </p>
          </div>

          {/* ── Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

            {/* ── Formulaire ── */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 20,
              padding: "36px 36px 32px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.3)",
            }}>

              {/* ── État succès ── */}
              {state.status === "success" ? (
                <div style={{
                  textAlign: "center", padding: "48px 24px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#F5F5F7" }}>
                    Message envoyé !
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(245,245,247,0.55)", lineHeight: 1.6, maxWidth: 340 }}>
                    Merci ! Nous te répondrons sous 48&nbsp;h à l&apos;adresse indiquée.
                  </p>
                </div>
              ) : (
                <form action={action}>
                  {/* Nom + Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <FormField label="Nom complet" required>
                      <input type="text" name="name" required autoComplete="name"
                        placeholder="Jean Dupont"
                        style={inputStyle} />
                    </FormField>
                    <FormField label="Email professionnel" required>
                      <input type="email" name="email" required autoComplete="email"
                        placeholder="jean@entreprise.fr"
                        style={inputStyle} />
                    </FormField>
                  </div>

                  {/* Entreprise + Secteur */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <FormField label="Entreprise">
                      <input type="text" name="company" autoComplete="organization"
                        placeholder="Nom de ton entreprise"
                        style={inputStyle} />
                    </FormField>
                    <FormField label="Secteur d'activité" required>
                      <select name="sector" required style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                        <option value="">Sélectionne ton secteur</option>
                        <option>Santé / Médical</option>
                        <option>Immobilier</option>
                        <option>Commerce / Retail</option>
                        <option>Tech / SaaS</option>
                        <option>Marketing / Agence</option>
                        <option>Juridique / Conseil</option>
                        <option>Formation</option>
                        <option>Autre</option>
                      </select>
                    </FormField>
                  </div>

                  {/* Agent intéressé — raccord direct avec l'équipe IA */}
                  <FormField label="Quel agent t'intéresse ?" style={{ marginBottom: 16 }}>
                    <select
                      name="interestedAgent"
                      defaultValue={initialAgent}
                      style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    >
                      <option value="">Pas encore sûr — décris-nous ton besoin</option>
                      {agents.map(a => (
                        <option key={a.slug} value={a.slug}>
                          {a.name} — {a.role}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Champs cachés pour tracer le contexte d'arrivée */}
                  {initialPlan && <input type="hidden" name="contextPlan" value={initialPlan} />}
                  {initialSource && <input type="hidden" name="contextSource" value={initialSource} />}

                  {/* Message — pré-rempli si un agent est passé en query param */}
                  <FormField label="Ton besoin" required style={{ marginBottom: 20 }}>
                    <textarea name="message" required rows={5}
                      defaultValue={preselectedAgent
                        ? `Bonjour, je suis intéressé(e) par ${preselectedAgent.name} (${preselectedAgent.role}). Voici mon contexte :\n\n`
                        : ""}
                      placeholder="Décris ton secteur, ce que tu veux automatiser, et les outils que tu utilises déjà..."
                      style={{ ...inputStyle, height: "auto", resize: "none", paddingTop: 12, paddingBottom: 12, lineHeight: 1.6 }} />
                  </FormField>

                  {/* RGPD */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                    <input type="checkbox" name="gdpr" required style={{
                      marginTop: 2, width: 16, height: 16, flexShrink: 0,
                      accentColor: "#E86F4D", cursor: "pointer",
                    }} />
                    <span style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", lineHeight: 1.6 }}>
                      J&apos;accepte que mes données soient traitées par Lynaris conformément à la{" "}
                      <a href="/confidentialite" style={{ color: "rgba(245,245,247,0.6)", textDecoration: "underline" }}>
                        politique de confidentialité
                      </a>
                      . Aucune donnée n&apos;est revendue à des tiers.
                    </span>
                  </label>

                  {/* Message d'erreur */}
                  {(state.status === "error" || state.status === "rate_limited") && (
                    <div role="alert" style={{
                      marginBottom: 16, padding: "10px 14px",
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10, fontSize: 13, color: "#FCA5A5", lineHeight: 1.5,
                    }}>
                      {state.status === "rate_limited"
                        ? "Tu as déjà soumis ce formulaire récemment. Merci de patienter 10 minutes avant de réessayer."
                        : state.message}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={isPending}
                    aria-busy={isPending}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      height: 48, padding: "0 28px", borderRadius: 12,
                      border: "none", cursor: isPending ? "not-allowed" : "pointer",
                      background: isPending
                        ? "rgba(232,111,77,0.5)"
                        : "linear-gradient(135deg, #E86F4D, #F4956E)",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      boxShadow: isPending ? "none" : "0 4px 20px rgba(232,111,77,0.35)",
                      transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
                      letterSpacing: "-0.01em",
                      opacity: isPending ? 0.75 : 1,
                    }}
                  >
                    {isPending ? "Envoi en cours…" : "Envoyer le message"}
                    {!isPending && <ArrowRight size={16} aria-hidden />}
                  </button>
                </form>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Temps de réponse */}
              <div style={sideCardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={iconBoxStyle("#E86F4D")}>
                    <Clock size={16} color="#E86F4D" />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>Temps de réponse</p>
                </div>
                <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: "#F5F5F7", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  &lt; 24 h
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(245,245,247,0.35)" }}>
                  Du lundi au vendredi, hors jours fériés
                </p>
              </div>

              {/* Contact direct */}
              <div style={sideCardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={iconBoxStyle("#7C3AED")}>
                    <MessageSquare size={16} color="#A78BFA" />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>Contact direct</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={14} color="rgba(245,245,247,0.35)" />
                    <a href="mailto:support@lynarisai.com" style={{
                      fontSize: 13, color: "rgba(245,245,247,0.6)",
                      textDecoration: "none", transition: "color 0.15s",
                    }}>
                      support@lynarisai.com
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={14} color="rgba(245,245,247,0.35)" />
                    <span style={{ fontSize: 13, color: "rgba(245,245,247,0.6)" }}>
                      Taverny, Val-d&apos;Oise (95)
                    </span>
                  </div>
                </div>
              </div>

              {/* Ce qu'on peut faire */}
              <div style={{ ...sideCardStyle, background: "rgba(232,111,77,0.05)", borderColor: "rgba(232,111,77,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={iconBoxStyle("#E86F4D")}>
                    <Zap size={16} color="#E86F4D" />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F5F5F7" }}>On peut t&apos;aider sur</p>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    "Automatiser tes appels entrants",
                    "Générer du contenu en masse",
                    "Prospecter automatiquement",
                    "Intégrer tes outils métier",
                    "Déployer ta propre équipe IA",
                  ].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(245,245,247,0.55)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E86F4D", flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FormField({ label, required, children, style }: {
  label: string
  required?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label style={{
        display: "block", marginBottom: 7,
        fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.55)",
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        {label}{required && <span style={{ color: "#E86F4D", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#F5F5F7", fontSize: 14,
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
  fontFamily: "inherit",
}

const sideCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: 20,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
}

function iconBoxStyle(color: string): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: `${color}18`,
    border: `1px solid ${color}30`,
    display: "flex", alignItems: "center", justifyContent: "center",
  }
}
