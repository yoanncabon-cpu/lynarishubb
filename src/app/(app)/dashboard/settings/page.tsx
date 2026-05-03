"use client"

import React, { useState, useEffect, useRef, useCallback, CSSProperties } from "react"
import { useRouter } from "next/navigation"
import {
  Save, Check, Plus, Trash2, ExternalLink,
  Copy, Key, RefreshCw, Download,
  Phone, Building, X, User, Shield, Bell, AlertTriangle,
  Loader2, MoreHorizontal, AlertCircle, CheckCircle2, Camera
} from "lucide-react"

// ─── Toast system ─────────────────────────────────────────────────────────────

interface ToastItem { id: string; message: string; type: "success" | "error" | "info" }

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])
  return { toasts, toast, setToasts }
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
          borderRadius: 12, backdropFilter: "blur(32px)",
          background: t.type === "error" ? "rgba(248,113,113,0.12)" : t.type === "success" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${t.type === "error" ? "rgba(248,113,113,0.3)" : t.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.15)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideIn 0.2s ease-out",
        }}>
          {t.type === "error"
            ? <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            : t.type === "success"
            ? <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: 1 }} />
            : <CheckCircle2 size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          }
          <span style={{ fontSize: 13, color: "#F5F5F7", flex: 1, lineHeight: 1.5 }}>{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex", padding: 2, flexShrink: 0 }}>
            <X size={13} />
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────
// Liquid Glass — surfaces verre niveau 2, cohérent avec la home dashboard

const cardStyle: CSSProperties = {
  background: "rgba(28,28,36,0.55)",
  border: "1px solid var(--glass-border)",
  borderRadius: 20,
  padding: "24px",
  backdropFilter: "blur(28px) saturate(1.6)",
  WebkitBackdropFilter: "blur(28px) saturate(1.6)",
  boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
  marginBottom: 16,
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--glass-border)",
  borderRadius: 11,
  color: "#FAFAFA",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "var(--font-geist-sans, sans-serif)",
  transition: "border-color 220ms var(--ease-apple), background 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
}

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(245,245,247,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 36,
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "rgba(245,245,247,0.45)",
  marginBottom: 6,
  display: "block",
}

const btnPrimary: CSSProperties = {
  height: 38, padding: "0 18px", borderRadius: 11, border: "none",
  background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
  color: "#FFFFFF", fontSize: 13, fontWeight: 600,
  cursor: "pointer",
  transition: "transform 220ms var(--ease-apple), box-shadow 220ms var(--ease-apple), opacity 220ms var(--ease-apple)",
  whiteSpace: "nowrap" as const,
  display: "inline-flex", alignItems: "center", gap: 7,
  boxShadow: "0 8px 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
}

const btnSecondary: CSSProperties = {
  height: 38, padding: "0 14px", borderRadius: 11,
  border: "1px solid var(--glass-border)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(250,250,250,0.78)",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  transition: "all 220ms var(--ease-apple)",
  whiteSpace: "nowrap" as const,
  display: "inline-flex", alignItems: "center", gap: 6,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
}

const btnDark: CSSProperties = {
  height: 34, padding: "0 14px", borderRadius: 9, border: "none",
  background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)",
  color: "#FFFFFF", fontSize: 12, fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 6px 18px -6px var(--accent-glow)",
}

// ─── FocusInput ───────────────────────────────────────────────────────────────
interface FocusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: string
}
function FocusInput({ accentColor = "var(--accent)", ...props }: FocusInputProps) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accentColor
        e.currentTarget.style.boxShadow = `0 0 0 4px var(--accent-glow)`
        e.currentTarget.style.background = "rgba(255,255,255,0.10)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--glass-border)"
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.background = "rgba(255,255,255,0.06)"
      }}
    />
  )
}

function FocusSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={selectStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-glow)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--glass-border)"
        e.currentTarget.style.boxShadow = "none"
      }}
    />
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 999, border: "none", flexShrink: 0,
        background: checked ? "var(--accent)" : "rgba(255,255,255,0.12)",
        cursor: "pointer", position: "relative", transition: "background 220ms var(--ease-apple)",
        boxShadow: checked ? "0 0 0 4px var(--accent-glow)" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? "calc(100% - 22px)" : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "white", transition: "left 0.2s",
      }} />
    </button>
  )
}

// ─── ModalOverlay ─────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: "min(440px, 100%)", background: "rgba(28,28,36,0.9)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid var(--glass-border-strong)", borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 30px 80px -25px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── AvatarUpload ─────────────────────────────────────────────────────────────
function AvatarUpload({
  size = 72,
  value,
  onChange,
  placeholder,
}: {
  size?: number
  value: string | null
  onChange: (b64: string | null) => void
  placeholder?: React.ReactNode
}) {
  const ref = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(ev.target?.result as string ?? null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        onClick={() => ref.current?.click()}
        style={{
          width: size, height: size, borderRadius: "50%",
          background: value ? "transparent" : "rgba(255,255,255,0.06)",
          border: value ? "none" : "2px dashed rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", overflow: "hidden", flexShrink: 0, position: "relative",
        }}
      >
        {value
          ? <img src={value} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (placeholder ?? <Camera size={size * 0.3} color="rgba(245,245,247,0.3)" />)
        }
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0" }}
        >
          <Camera size={18} color="#fff" />
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button type="button" style={btnSecondary} onClick={() => ref.current?.click()}>
          Changer l&apos;image
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} style={{ ...btnSecondary, color: "#F87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Password strength ────────────────────────────────────────────────────────
function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "transparent" }
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const map: { label: string; color: string }[] = [
    { label: "Trop court", color: "#F87171" },
    { label: "Faible", color: "#F87171" },
    { label: "Moyen", color: "#FBBF24" },
    { label: "Fort", color: "#34D399" },
    { label: "Très fort", color: "#6EE7B7" },
  ]
  const s = score as 0 | 1 | 2 | 3 | 4
  const entry = map[s] ?? { label: "Faible", color: "#F87171" }
  return { score: s, label: entry.label, color: entry.color }
}

// ─── ORG SETTINGS TYPES ───────────────────────────────────────────────────────
interface OrgSettings {
  name: string
  website: string
  sector: string
  size: string
  phone: string
  vat: string
  street: string
  zip: string
  city: string
  country: string
  logoUrl: string | null
}

interface Profile {
  firstName: string
  lastName: string
  email: string
  phone: string
  timezone: string
  language: "fr" | "en"
  avatarUrl: string | null
  notifyAgentDone: boolean
  notifyCharlesBrief: boolean
  notifyBilling: boolean
}

interface NotifPrefs {
  emailWeeklySummary: boolean
  emailAgentError: boolean
  emailNewFeatures: boolean
  emailTips: boolean
  agentMarine: boolean
  agentLou: boolean
  agentElio: boolean
  agentMae: boolean
}

const DEFAULT_ORG: OrgSettings = {
  name: "", website: "", sector: "", size: "",
  phone: "", vat: "", street: "", zip: "", city: "", country: "France",
  logoUrl: null,
}

const DEFAULT_PROFILE: Profile = {
  firstName: "", lastName: "", email: "yoanncabon@gmail.com",
  phone: "", timezone: "Europe/Paris", language: "fr",
  avatarUrl: null,
  notifyAgentDone: true, notifyCharlesBrief: true, notifyBilling: true,
}

const DEFAULT_NOTIFS: NotifPrefs = {
  emailWeeklySummary: true,
  emailAgentError: true,
  emailNewFeatures: false,
  emailTips: false,
  agentMarine: true,
  agentLou: true,
  agentElio: true,
  agentMae: false,
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

// ─── ENTREPRISE TAB ───────────────────────────────────────────────────────────
function EntrepriseTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [org, setOrg] = useState<OrgSettings>(DEFAULT_ORG)
  useEffect(() => {
    fetch("/api/settings/org")
      .then(r => r.json())
      .then((d: { org: { name: string; settings: Record<string, string> } }) => {
        const s = d.org?.settings ?? {}
        setOrg({
          name: d.org?.name ?? "",
          website: s["website"] ?? "",
          sector: s["sector"] ?? "",
          size: s["size"] ?? "",
          phone: s["phone"] ?? "",
          vat: s["vat"] ?? "",
          street: s["street"] ?? "",
          zip: s["zip"] ?? "",
          city: s["city"] ?? "",
          country: s["country"] ?? "France",
          logoUrl: s["logoUrl"] ?? null,
        })
      })
      .catch(() => setOrg(loadLS("lynaris_org_settings", DEFAULT_ORG)))
  }, [])
  const [saving, setSaving] = useState(false)
  const [savedBadge, setSavedBadge] = useState(false)

  function set(patch: Partial<OrgSettings>) {
    setOrg(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    if (!org.name.trim()) return
    setSaving(true)
    localStorage.setItem("lynaris_org_settings", JSON.stringify(org))
    // fire-and-forget
    fetch("/api/settings/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(org),
    }).catch(() => {})
    await new Promise(r => setTimeout(r, 300))
    setSaving(false)
    setSavedBadge(true)
    toast("Paramètres organisation sauvegardés", "success")
    setTimeout(() => setSavedBadge(false), 2000)
  }

  const canSave = org.name.trim().length > 0

  return (
    <div>
      {/* Infos générales */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 20px" }}>Informations générales</h3>

        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Logo</label>
          <AvatarUpload
            size={72}
            value={org.logoUrl}
            onChange={(v) => set({ logoUrl: v })}
            placeholder={<Building size={28} color="rgba(245,245,247,0.3)" />}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nom de l&apos;organisation <span style={{ color: "#F87171" }}>*</span></label>
            <FocusInput type="text" placeholder="Lynaris" value={org.name} onChange={e => set({ name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Site web</label>
            <FocusInput type="text" placeholder="https://lynaris.ai" value={org.website} onChange={e => set({ website: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Secteur</label>
            <FocusSelect value={org.sector} onChange={e => set({ sector: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="tech">Tech</option>
              <option value="conseil">Conseil</option>
              <option value="sante">Santé</option>
              <option value="commerce">Commerce</option>
              <option value="finance">Finance</option>
              <option value="education">Éducation</option>
              <option value="marketing">Marketing</option>
              <option value="autre">Autre</option>
            </FocusSelect>
          </div>
          <div>
            <label style={labelStyle}>Taille</label>
            <FocusSelect value={org.size} onChange={e => set({ size: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="1-9">1–9</option>
              <option value="10-49">10–49</option>
              <option value="50-249">50–249</option>
              <option value="250+">250+</option>
            </FocusSelect>
          </div>
          <div>
            <label style={labelStyle}>Téléphone <span style={{ opacity: 0.5 }}>(optionnel)</span></label>
            <FocusInput type="tel" placeholder="+33 6 12 34 56 78" value={org.phone} onChange={e => set({ phone: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Numéro de TVA</label>
            <FocusInput type="text" placeholder="FR73 410 769 462" value={org.vat} onChange={e => set({ vat: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 20px" }}>Adresse</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Rue</label>
            <FocusInput type="text" placeholder="126 rue du Faubourg Saint-Denis" value={org.street} onChange={e => set({ street: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Code postal</label>
            <FocusInput type="text" placeholder="75010" value={org.zip} onChange={e => set({ zip: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Ville</label>
            <FocusInput type="text" placeholder="Paris" value={org.city} onChange={e => set({ city: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Pays</label>
            <FocusInput type="text" value={org.country} onChange={e => set({ country: e.target.value })} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!canSave || saving}
        style={{
          ...btnPrimary,
          opacity: canSave ? 1 : 0.4,
          cursor: canSave ? "pointer" : "not-allowed",
          background: savedBadge ? "#34D399" : "#F5F5F7",
          color: "#0A0A0B",
        }}
      >
        {saving
          ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sauvegarde...</>
          : savedBadge
          ? <><Check size={14} /> Sauvegardé</>
          : <><Save size={14} /> Sauvegarder</>
        }
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── PROFIL TAB ───────────────────────────────────────────────────────────────
function ProfilTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/settings/profile")
      .then(r => r.json())
      .then((d: { profile: Partial<Profile> }) => {
        if (d.profile) {
          setProfile(prev => ({ ...prev, ...d.profile }))
        }
      })
      .catch(() => setProfile(loadLS("lynaris_profile", DEFAULT_PROFILE)))
  }, [])

  // Récupère l'avatar Google depuis Supabase (fallback si pas d'avatar custom)
  useEffect(() => {
    void (async () => {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()
        const meta = data.user?.user_metadata as Record<string, string> | undefined
        const url = meta?.avatar_url ?? meta?.picture ?? null
        if (url) setGoogleAvatarUrl(url)
      } catch { /* silencieux */ }
    })()
  }, [])
  const [saving, setSaving] = useState(false)
  const [savedBadge, setSavedBadge] = useState(false)

  function set(patch: Partial<Profile>) {
    setProfile(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          timezone: profile.timezone,
          language: profile.language,
          avatarUrl: profile.avatarUrl,
        }),
      })
      if (!res.ok) {
        toast("Erreur lors de la sauvegarde", "error")
        return
      }
    } catch {
      toast("Erreur réseau", "error")
      return
    } finally {
      setSaving(false)
    }
    setSavedBadge(true)
    toast("Profil sauvegardé", "success")
    setTimeout(() => setSavedBadge(false), 2000)
  }

  return (
    <div>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 20px" }}>Informations personnelles</h3>

        {/* Avatar */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Avatar</label>
          <AvatarUpload
            size={80}
            value={profile.avatarUrl ?? googleAvatarUrl}
            onChange={async (v) => {
              set({ avatarUrl: v })
              // Auto-save quand suppression
              if (v === null) {
                await fetch("/api/settings/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ avatarUrl: null }),
                }).catch(() => {})
              }
            }}
            placeholder={<User size={28} color="rgba(245,245,247,0.3)" />}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Prénom</label>
            <FocusInput type="text" placeholder="Yoann" value={profile.firstName} onChange={e => set({ firstName: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Nom</label>
            <FocusInput type="text" placeholder="Cabon" value={profile.lastName} onChange={e => set({ lastName: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Email</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={profile.email}
                readOnly
                style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
              />
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", margin: "5px 0 0" }}>
              Modifiable via votre fournisseur d&apos;identité
            </p>
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <FocusInput type="tel" placeholder="+33 6 12 34 56 78" value={profile.phone} onChange={e => set({ phone: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Fuseau horaire</label>
            <FocusSelect value={profile.timezone} onChange={e => set({ timezone: e.target.value })}>
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="UTC">UTC</option>
            </FocusSelect>
          </div>
          <div>
            <label style={labelStyle}>Langue</label>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", opacity: 0.6, cursor: "not-allowed" }}>
              <span style={{ fontSize: 14, color: "#F5F5F7" }}>Français</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications préférences */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 16px" }}>Préférences de notification</h3>
        {[
          { key: "notifyAgentDone" as const, label: "Notification quand un agent termine une action" },
          { key: "notifyCharlesBrief" as const, label: "Brief quotidien de Charles (8h)" },
          { key: "notifyBilling" as const, label: "Alertes de facturation" },
        ].map(item => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 14, color: "rgba(245,245,247,0.8)" }}>{item.label}</span>
            <Toggle checked={profile[item.key]} onChange={(v) => set({ [item.key]: v })} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        style={{
          ...btnPrimary,
          background: savedBadge ? "#34D399" : "#F5F5F7",
          color: "#0A0A0B",
        }}
      >
        {saving
          ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sauvegarde...</>
          : savedBadge
          ? <><Check size={14} /> Sauvegardé</>
          : <><Save size={14} /> Sauvegarder</>
        }
      </button>
    </div>
  )
}

// ─── SÉCURITÉ TAB ─────────────────────────────────────────────────────────────

interface SessionItem {
  id: string
  device: string
  ip: string
  date: string
  current: boolean
}

function SecurityTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("2fa_enabled") === "true"
  })
  const [twoFaModal, setTwoFaModal] = useState(false)
  const [twoFaCode, setTwoFaCode] = useState("")
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null)
  const [twoFaFactorId, setTwoFaFactorId] = useState<string | null>(null)
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/sessions")
        if (res.ok) {
          const data = await res.json() as { sessions: SessionItem[] }
          setSessions(data.sessions)
        }
      } catch { /* silencieux */ } finally {
        setSessionsLoading(false)
      }
    })()
  }, [])

  const strength = passwordStrength(newPwd)
  const pwdMatch = confirmPwd.length > 0 && newPwd !== confirmPwd

  async function handleChangePwd() {
    if (!currentPwd || !newPwd || newPwd !== confirmPwd || newPwd.length < 8) return
    setPwdLoading(true)
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
      const supabase = getSupabaseBrowserClient()

      // Vérifier l'ancien mot de passe via re-auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { toast("Session expirée — reconnecte-toi", "error"); return }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      })
      if (signInErr) { toast("Mot de passe actuel incorrect", "error"); return }

      // Mettre à jour avec le nouveau
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd })
      if (updateErr) { toast(updateErr.message, "error"); return }

      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
      toast("Mot de passe mis à jour", "success")
    } catch {
      toast("Erreur — réessaie", "error")
    } finally {
      setPwdLoading(false)
    }
  }

  async function openTwoFaModal() {
    setTwoFaModal(true)
    setTwoFaQr(null)
    setTwoFaCode("")
    setTwoFaLoading(true)
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "Lynaris", friendlyName: "Lynaris 2FA" })
      if (error || !data) { toast("Erreur lors de la génération du QR code", "error"); return }
      setTwoFaQr(data.totp.qr_code)
      setTwoFaFactorId(data.id)
    } catch {
      toast("Erreur — réessaie", "error")
    } finally {
      setTwoFaLoading(false)
    }
  }

  async function handleActivate2FA() {
    if (twoFaCode.length !== 6 || !twoFaFactorId) return
    setTwoFaLoading(true)
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/auth/supabase-browser")
      const supabase = getSupabaseBrowserClient()
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: twoFaFactorId })
      if (challengeErr || !challengeData) { toast("Erreur de vérification", "error"); return }
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: twoFaFactorId, challengeId: challengeData.id, code: twoFaCode })
      if (verifyErr) { toast("Code incorrect — réessaie", "error"); return }
      localStorage.setItem("2fa_enabled", "true")
      setTwoFaEnabled(true)
      setTwoFaModal(false)
      setTwoFaCode("")
      setTwoFaQr(null)
      toast("Authentification à deux facteurs activée", "success")
    } catch {
      toast("Erreur — réessaie", "error")
    } finally {
      setTwoFaLoading(false)
    }
  }

  function handleRevoke(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
    toast("Session révoquée", "info")
  }

  const canChangePwd = currentPwd.length > 0 && newPwd.length >= 8 && newPwd === confirmPwd

  return (
    <div>
      {/* Mot de passe */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 20px" }}>Mot de passe</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Mot de passe actuel</label>
            <FocusInput type="password" placeholder="••••••••" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <FocusInput type="password" placeholder="Min. 8 caractères" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            {newPwd.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 5 }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: `${(strength.score / 4) * 100}%`,
                    background: strength.color,
                    transition: "width 0.3s, background 0.3s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <FocusInput
              type="password" placeholder="••••••••"
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              accentColor={pwdMatch ? "#F87171" : "var(--accent)"}
            />
            {pwdMatch && <p style={{ fontSize: 11, color: "#F87171", margin: "5px 0 0" }}>Les mots de passe ne correspondent pas</p>}
          </div>
        </div>
        <button
          type="button"
          style={{ ...btnPrimary, marginTop: 18, opacity: canChangePwd ? 1 : 0.4, cursor: canChangePwd ? "pointer" : "not-allowed" }}
          disabled={!canChangePwd || pwdLoading}
          onClick={() => void handleChangePwd()}
        >
          {pwdLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Changement...</> : "Changer le mot de passe"}
        </button>
      </div>

      {/* 2FA */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 4px" }}>Authentification à deux facteurs</h3>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: 0 }}>Sécurisez votre compte avec une application d&apos;authentification</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
            background: twoFaEnabled ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
            border: `1px solid ${twoFaEnabled ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
            color: twoFaEnabled ? "#34D399" : "#F87171",
          }}>
            {twoFaEnabled ? "Activé" : "Non activé"}
          </span>
        </div>
        {!twoFaEnabled && (
          <button type="button" style={{ ...btnPrimary, marginTop: 16 }} onClick={() => void openTwoFaModal()}>
            <Shield size={14} />
            Activer l&apos;authentification à deux facteurs
          </button>
        )}
      </div>

      {/* Sessions */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 16px" }}>Sessions actives</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessionsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px" }}>
              <Loader2 size={14} color="rgba(245,245,247,0.4)" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "rgba(245,245,247,0.4)" }}>Chargement des sessions…</span>
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.4)", margin: 0, padding: "12px 14px" }}>Aucune session active trouvée.</p>
          ) : (
            sessions.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: 12,
                background: s.current ? "rgba(232,111,77,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${s.current ? "rgba(232,111,77,0.25)" : "var(--glass-border)"}`,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA", margin: "0 0 2px" }}>
                    {s.device}
                    {s.current && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(232,111,77,0.14)", padding: "2px 7px", borderRadius: 5 }}>Session actuelle</span>}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>{s.ip} · {s.date}</p>
                </div>
                {!s.current && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(s.id)}
                    style={{ ...btnSecondary, fontSize: 12, color: "#F87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}
                  >
                    Révoquer
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal 2FA */}
      {twoFaModal && (
        <ModalOverlay onClose={() => setTwoFaModal(false)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Activer la 2FA</h3>
            <button type="button" onClick={() => setTwoFaModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.55)", margin: "0 0 16px" }}>
              Scannez ce QR code avec votre application (Google Authenticator, Authy…)
            </p>
            {/* QR code Supabase TOTP */}
            {twoFaLoading ? (
              <div style={{ width: 148, height: 148, margin: "0 auto 20px", background: "rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={24} color="rgba(245,245,247,0.4)" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : twoFaQr ? (
              <img src={twoFaQr} alt="QR Code 2FA" style={{ width: 148, height: 148, margin: "0 auto 20px", display: "block", borderRadius: 12, background: "white", padding: 8 }} />
            ) : (
              <div style={{ width: 148, height: 148, margin: "0 auto 20px", background: "rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={24} color="rgba(245,245,247,0.4)" />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Code à 6 chiffres</label>
              <FocusInput
                type="text" maxLength={6} placeholder="000000"
                value={twoFaCode} onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setTwoFaModal(false)}>Annuler</button>
              <button
                type="button" style={{ ...btnPrimary, opacity: twoFaCode.length === 6 ? 1 : 0.4 }}
                disabled={twoFaCode.length !== 6}
                onClick={handleActivate2FA}
              >
                Activer
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────
const VACATION_LS_KEY = "lynaris_vacation_mode"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 14px" }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", opacity: disabled ? 0.4 : 1 }}>
      <span style={{ fontSize: 14, color: "rgba(245,245,247,0.8)" }}>{label}</span>
      {disabled ? (
        <span style={{ fontSize: 11, color: "rgba(245,245,247,0.3)", fontStyle: "italic" }}>Bientôt</span>
      ) : (
        <Toggle checked={checked} onChange={onChange} />
      )}
    </div>
  )
}

function NotificationsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIFS)
  useEffect(() => { setPrefs(loadLS("lynaris_notifications", DEFAULT_NOTIFS)) }, [])
  const [savedBadge, setSavedBadge] = useState(false)
  const [saving, setSaving] = useState(false)

  // Push notifications
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default")
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPushPermission(Notification.permission)
    }
  }, [])

  async function requestPushPermission() {
    if (typeof Notification === "undefined") return
    const result = await Notification.requestPermission()
    setPushPermission(result)
    if (result === "granted") {
      toast("Notifications push activées", "success")
      new Notification("Lynaris", { body: "Notifications activées !", icon: "/favicon.ico" })
    }
  }

  // Mode vacances — état persisté en localStorage
  const [vacationActive, setVacationActive] = useState(false)
  useEffect(() => {
    try { setVacationActive(localStorage.getItem(VACATION_LS_KEY) === "true") } catch { /* */ }
  }, [])

  function toggleVacation(v: boolean) {
    try {
      if (v) localStorage.setItem(VACATION_LS_KEY, "true")
      else localStorage.removeItem(VACATION_LS_KEY)
    } catch { /* */ }
    setVacationActive(v)
    toast(v ? "Mode vacances activé — agents en mode réduit" : "Mode vacances désactivé", "info")
  }

  // Test email notification
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent] = useState(false)

  async function handleTestEmail() {
    setTestSending(true)
    try {
      const res = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly_summary" }),
      })
      if (res.ok) {
        setTestSent(true)
        toast("Email de test envoyé !", "success")
        setTimeout(() => setTestSent(false), 2000)
      } else {
        const data = await res.json().catch(() => ({}))
        toast((data as { error?: string }).error ?? "Erreur lors de l'envoi", "error")
      }
    } catch {
      toast("Erreur réseau — réessaie", "error")
    } finally {
      setTestSending(false)
    }
  }

  // Rapport hebdo
  const [reportSending, setReportSending] = useState(false)

  async function handleSendReport() {
    setReportSending(true)
    try {
      const res = await fetch("/api/reports/weekly", { method: "POST" })
      if (res.ok) {
        toast("Rapport envoyé à ton adresse email", "success")
      } else {
        const data = await res.json().catch(() => ({}))
        toast((data as { error?: string }).error ?? "Erreur lors de l'envoi", "error")
      }
    } catch {
      toast("Erreur réseau — réessaie", "error")
    } finally {
      setReportSending(false)
    }
  }

  // Charge depuis Supabase au mount
  useEffect(() => {
    fetch("/api/settings/notifications")
      .then(r => r.ok ? r.json() as Promise<Partial<NotifPrefs>> : null)
      .then(remote => {
        if (remote && Object.keys(remote).length > 0) {
          setPrefs(prev => ({ ...prev, ...remote }))
        }
      })
      .catch(() => {})
  }, [])

  function set(patch: Partial<NotifPrefs>) {
    setPrefs(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (res.ok) {
        localStorage.setItem("lynaris_notifications", JSON.stringify(prefs))
        setSavedBadge(true)
        toast("Préférences sauvegardées", "success")
        setTimeout(() => setSavedBadge(false), 2000)
      } else {
        toast("Erreur lors de la sauvegarde", "error")
      }
    } catch {
      toast("Erreur réseau", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Section title="Email">
        {/* Ligne résumé hebdo avec bouton Tester */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 14, color: "rgba(245,245,247,0.8)" }}>Résumé d&apos;activité hebdomadaire</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => void handleTestEmail()}
              disabled={testSending || testSent}
              style={{
                background: testSent ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${testSent ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: testSent ? "#34D399" : "rgba(245,245,247,0.6)",
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: testSending || testSent ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
                opacity: testSending ? 0.6 : 1,
              }}
            >
              {testSent ? <>✓ Envoyé</> : testSending ? <>...</> : <>Tester →</>}
            </button>
            <Toggle checked={prefs.emailWeeklySummary} onChange={v => set({ emailWeeklySummary: v })} />
          </div>
        </div>
        <Row label="Alerte si agent en erreur" checked={prefs.emailAgentError} onChange={v => set({ emailAgentError: v })} />
        <Row label="Nouvelles fonctionnalités Lynaris" checked={prefs.emailNewFeatures} onChange={v => set({ emailNewFeatures: v })} />
        <Row label="Conseils d'utilisation" checked={prefs.emailTips} onChange={v => set({ emailTips: v })} />
      </Section>

      <Section title="Push">
        <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, color: "rgba(245,245,247,0.85)", margin: "0 0 3px" }}>
              Notifications push navigateur
            </p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>
              Reçois des alertes même quand Lynaris est en arrière-plan
            </p>
          </div>
          {typeof Notification === "undefined" ? (
            <span style={{ fontSize: 12, color: "rgba(245,245,247,0.3)", fontStyle: "italic" }}>Non supporté</span>
          ) : pushPermission === "granted" ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#34D399", display: "flex", alignItems: "center", gap: 5 }}>
              <Check size={13} /> Activé
            </span>
          ) : pushPermission === "denied" ? (
            <span style={{ fontSize: 12, color: "#F87171" }}>Bloqué par le navigateur</span>
          ) : (
            <button
              type="button"
              onClick={() => void requestPushPermission()}
              style={{
                background: "rgba(232,111,77,0.14)",
                border: "1px solid rgba(232,111,77,0.35)",
                color: "var(--accent)",
                borderRadius: 11,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                transition: "all 220ms var(--ease-apple)",
              }}
            >
              Activer les notifications
            </button>
          )}
        </div>
      </Section>

      <Section title="Agents">
        <Row label="Marine — notification quand un RDV est pris" checked={prefs.agentMarine} onChange={v => set({ agentMarine: v })} />
        <Row label="Lou — notification quand un article est publié" checked={prefs.agentLou} onChange={v => set({ agentLou: v })} />
        <Row label="Elio — nouvelles réponses prospects" checked={prefs.agentElio} onChange={v => set({ agentElio: v })} />
        <Row label="Mae — brief email quotidien 8h" checked={prefs.agentMae} onChange={v => set({ agentMae: v })} />
      </Section>

      {/* ── Mode vacances ── */}
      <Section title="Mode vacances">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <p style={{ fontSize: 14, color: "rgba(245,245,247,0.85)", margin: "0 0 3px" }}>
              Activer le mode vacances
            </p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>
              Les agents passent en mode réduit — réponses limitées aux urgences
            </p>
          </div>
          <Toggle checked={vacationActive} onChange={toggleVacation} />
        </div>
      </Section>

      {/* ── Rapport hebdo ── */}
      <Section title="Rapport d'activité">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <p style={{ fontSize: 14, color: "rgba(245,245,247,0.85)", margin: "0 0 3px" }}>
              Envoyer le rapport maintenant
            </p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>
              Reçois un récap des 7 derniers jours par email
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSendReport()}
            disabled={reportSending}
            style={{
              ...btnSecondary,
              opacity: reportSending ? 0.6 : 1,
              cursor: reportSending ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {reportSending
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Envoi...</>
              : <><Bell size={13} /> Envoyer le rapport</>
            }
          </button>
        </div>
      </Section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          ...btnPrimary,
          background: savedBadge ? "#34D399" : "#F5F5F7",
          color: "#0A0A0B",
          opacity: saving ? 0.7 : 1,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Sauvegarde…" : savedBadge ? <><Check size={14} /> Sauvegardé</> : <><Save size={14} /> Sauvegarder les préférences</>}
      </button>
    </div>
  )
}

// ─── DANGER ZONE TAB ─────────────────────────────────────────────────────────
const LYNARIS_LS_KEYS = [
  "lynaris_org_settings",
  "lynaris_profile",
  "lynaris_notifications",
  "lynaris_api_keys",
  "2fa_enabled",
]

function DangerZoneTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const router = useRouter()
  const [resetModal, setResetModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  function handleExport() {
    const data: Record<string, unknown> = {}
    LYNARIS_LS_KEYS.forEach(k => {
      try {
        const raw = localStorage.getItem(k)
        data[k] = raw ? JSON.parse(raw) : null
      } catch { data[k] = null }
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lynaris-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast("Export téléchargé", "success")
  }

  function handleReset() {
    LYNARIS_LS_KEYS.forEach(k => localStorage.removeItem(k))
    setResetModal(false)
    toast("Paramètres réinitialisés", "info")
  }

  async function handleDelete() {
    if (deleteInput !== "SUPPRIMER") return
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast((data as { error?: string }).error ?? "Erreur lors de la suppression", "error")
        setDeleteLoading(false)
        return
      }
      setDeleteModal(false)
      router.push("/login")
    } catch {
      toast("Erreur réseau — réessaie", "error")
      setDeleteLoading(false)
    }
  }

  const dangerCard: CSSProperties = {
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 14,
  }

  const dangerRow: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 0", borderBottom: "1px solid rgba(239,68,68,0.1)",
  }

  return (
    <div>
      <div style={dangerCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={18} color="#F87171" />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F87171", margin: 0 }}>Zone dangereuse</h3>
        </div>

        {/* Exporter */}
        <div style={dangerRow}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#F5F5F7", margin: "0 0 2px" }}>Exporter mes données</p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>Télécharge un JSON avec toutes vos données locales</p>
          </div>
          <button type="button" style={{ ...btnSecondary, borderColor: "rgba(239,68,68,0.3)", color: "#F5F5F7" }} onClick={handleExport}>
            <Download size={14} />
            Exporter en JSON
          </button>
        </div>

        {/* Réinitialiser */}
        <div style={dangerRow}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#F5F5F7", margin: "0 0 2px" }}>Réinitialiser les paramètres</p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>Efface toutes les données de configuration locales</p>
          </div>
          <button
            type="button"
            style={{ ...btnSecondary, borderColor: "rgba(239,68,68,0.3)", color: "#FBBF24", background: "rgba(251,191,36,0.06)" }}
            onClick={() => setResetModal(true)}
          >
            Réinitialiser
          </button>
        </div>

        {/* Supprimer compte */}
        <div style={{ ...dangerRow, borderBottom: "none" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#F5F5F7", margin: "0 0 2px" }}>Supprimer mon compte</p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0 }}>Action irréversible — toutes vos données seront supprimées</p>
          </div>
          <button
            type="button"
            style={{ ...btnSecondary, borderColor: "rgba(239,68,68,0.5)", color: "#F87171", background: "rgba(239,68,68,0.1)" }}
            onClick={() => setDeleteModal(true)}
          >
            <Trash2 size={14} />
            Supprimer le compte
          </button>
        </div>
      </div>

      {/* Modal: Réinitialiser */}
      {resetModal && (
        <ModalOverlay onClose={() => setResetModal(false)}>
          <div style={{ padding: "24px 22px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={20} color="#FBBF24" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#F5F5F7", margin: "0 0 8px" }}>Réinitialiser les paramètres ?</h3>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.55)", margin: "0 0 20px" }}>
              Toutes vos préférences locales (organisation, profil, notifications, clés API) seront effacées. Cette action ne supprime pas votre compte.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setResetModal(false)}>Annuler</button>
              <button type="button" style={{ ...btnPrimary, background: "#FBBF24", color: "#0A0A0B" }} onClick={handleReset}>
                Réinitialiser
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Supprimer compte */}
      {deleteModal && (
        <ModalOverlay onClose={() => setDeleteModal(false)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F87171", margin: 0 }}>Supprimer le compte</h3>
            <button type="button" onClick={() => setDeleteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.6)", margin: "0 0 16px" }}>
              Cette action est <strong style={{ color: "#F87171" }}>irréversible</strong>. Toutes vos données, agents et configurations seront définitivement supprimés.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Tapez <span style={{ color: "#F87171" }}>SUPPRIMER</span> pour confirmer</label>
              <FocusInput
                type="text" placeholder="SUPPRIMER"
                value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                accentColor="#F87171"
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setDeleteModal(false)}>Annuler</button>
              <button
                type="button"
                style={{
                  ...btnPrimary,
                  background: "#F87171", color: "#fff",
                  opacity: deleteInput === "SUPPRIMER" ? 1 : 0.4,
                  cursor: deleteInput === "SUPPRIMER" ? "pointer" : "not-allowed",
                }}
                disabled={deleteInput !== "SUPPRIMER" || deleteLoading}
                onClick={() => void handleDelete()}
              >
                {deleteLoading
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Suppression...</>
                  : <><Trash2 size={14} /> Supprimer définitivement</>
                }
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── FACTURATION TAB (preserved) ─────────────────────────────────────────────

interface Credits {
  phone_credits: number
  api_credits: number
  phone_pending: number
  api_pending: number
  auto_recharge_phone: boolean
  auto_recharge_api: boolean
  auto_recharge_phone_amount: number
  auto_recharge_api_amount: number
  auto_recharge_threshold: number
}

type RechargeModal = { type: "phone" | "api"; open: boolean }
type AutoRechargeModal = { type: "phone" | "api"; open: boolean }

const RECHARGE_AMOUNTS = [5, 10, 25, 50, 100, 200]

interface OrgBilling {
  plan: string | null
  planLabel: string
  planPrice: string
  orgName: string
  trialEndsAt: string | null
  hasStripeCustomer: boolean
  stripeCustomerId: string | null
}

const billingCardStyle: CSSProperties = {
  ...cardStyle,
  borderRadius: 14,
  padding: "20px 22px",
}

interface StripeInvoice {
  id: string
  number: string | null
  amount: string
  currency: string
  status: string | null
  date: string
  pdfUrl: string | null
  hostedUrl: string | null
  description: string
}

function BillingTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [orgBilling, setOrgBilling] = useState<OrgBilling | null>(null)
  const [invoices, setInvoices] = useState<StripeInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [credits, setCredits] = useState<Credits>({
    phone_credits: 0, api_credits: 0, phone_pending: 0, api_pending: 0,
    auto_recharge_phone: false, auto_recharge_api: false,
    auto_recharge_phone_amount: 25, auto_recharge_api_amount: 25,
    auto_recharge_threshold: 5,
  })
  const [rechargeModal, setRechargeModal] = useState<RechargeModal>({ type: "phone", open: false })
  const [autoModal, setAutoModal] = useState<AutoRechargeModal>({ type: "phone", open: false })
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState("")
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoAmount, setAutoAmount] = useState(25)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    fetch("/api/settings/billing")
      .then(r => r.ok ? r.json() as Promise<OrgBilling> : null)
      .then(d => { if (d) setOrgBilling(d) })
      .catch(() => {})

    setInvoicesLoading(true)
    fetch("/api/billing/invoices")
      .then(r => r.json() as Promise<{ invoices: StripeInvoice[] }>)
      .then(d => setInvoices(d.invoices ?? []))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false))

    fetch("/api/billing/credits/balance")
      .then(r => r.json() as Promise<Credits>)
      .then(d => setCredits(d))
      .catch(() => {})

    const params = new URLSearchParams(window.location.search)
    if (params.get("recharge") === "success") {
      const amount = params.get("amount")
      const type = params.get("type")
      setSuccessMsg(`Rechargement réussi — ${amount} € ajoutés à vos crédits ${type === "phone" ? "téléphoniques" : "API"}`)
      setTimeout(() => setSuccessMsg(""), 5000)
      window.history.replaceState({}, "", "/dashboard/settings?tab=billing")
    }
  }, [])

  function openRecharge(type: "phone" | "api") {
    setSelectedAmount(25); setCustomAmount(""); setRechargeModal({ type, open: true })
  }

  function openAutoModal(type: "phone" | "api") {
    setAutoEnabled(type === "phone" ? credits.auto_recharge_phone : credits.auto_recharge_api)
    setAutoAmount(type === "phone" ? credits.auto_recharge_phone_amount : credits.auto_recharge_api_amount)
    setAutoModal({ type, open: true })
  }

  async function handleRecharge() {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount
    if (!amount || amount < 5) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/billing/credits/recharge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type: rechargeModal.type }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.assign(data.url)
      else toast(data.error ?? "Erreur Stripe. Vérifiez votre clé STRIPE_SECRET_KEY.", "error")
    } catch { toast("Erreur réseau. Vérifiez votre connexion.", "error") }
    finally { setCheckoutLoading(false) }
  }

  async function handleSaveAutoRecharge() {
    setAutoLoading(true)
    try {
      await fetch("/api/billing/credits/autorecharge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: autoModal.type, enabled: autoEnabled, amount: autoAmount }),
      })
      setCredits(prev => ({
        ...prev,
        ...(autoModal.type === "phone"
          ? { auto_recharge_phone: autoEnabled, auto_recharge_phone_amount: autoAmount }
          : { auto_recharge_api: autoEnabled, auto_recharge_api_amount: autoAmount }),
      }))
      setAutoModal(m => ({ ...m, open: false }))
    } catch { setAutoModal(m => ({ ...m, open: false })) }
    finally { setAutoLoading(false) }
  }

  const amtBtnStyle = (active: boolean): CSSProperties => ({
    height: 38, borderRadius: 11,
    border: `1px solid ${active ? "rgba(232,111,77,0.5)" : "var(--glass-border)"}`,
    background: active ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.04)",
    color: active ? "var(--accent)" : "rgba(250,250,250,0.7)",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "all 220ms var(--ease-apple)",
  })

  return (
    <div>
      {successMsg && (
        <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 14, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34D399", fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      <div style={billingCardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 16px" }}>Mon abonnement</h3>
        {orgBilling ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 18 }}>
            {[
              { label: "Plan", value: orgBilling.planLabel },
              { label: "Tarif HT", value: orgBilling.planPrice },
              { label: "Renouvellement", value: orgBilling.trialEndsAt ? new Date(orgBilling.trialEndsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", margin: "0 0 4px" }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 40, flex: 1, borderRadius: 8, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, justifyContent: "flex-end" }}>
          {["Gérer ma méthode de paiement", "Gérer mon abonnement"].map(label => (
            <button key={label} type="button"
              style={{ ...btnSecondary, borderColor: "rgba(232,111,77,0.4)", color: "var(--accent)", background: "rgba(232,111,77,0.08)" }}
              onClick={async () => {
                if (!orgBilling?.hasStripeCustomer) {
                  toast("Aucun client Stripe associé. Souscris d'abord un abonnement depuis /tarifs.", "error")
                  return
                }
                const res = await fetch("/api/billing/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: orgBilling.stripeCustomerId }) })
                const d = await res.json() as { url?: string; error?: string }
                if (d.url) window.open(d.url, "_blank"); else toast(d.error ?? "Impossible d'ouvrir le portail Stripe.", "error")
              }}
            >
              {label} <ExternalLink size={12} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div style={billingCardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 16px" }}>Crédits téléphoniques</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", margin: "0 0 5px" }}>Solde</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F7", margin: 0, fontVariantNumeric: "tabular-nums" }}>{credits.phone_credits.toFixed(2)} €</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", margin: "0 0 5px" }}>Dépôts en suspension</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F7", margin: 0, fontVariantNumeric: "tabular-nums" }}>{credits.phone_pending.toFixed(2)} €</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <RefreshCw size={13} color="rgba(245,245,247,0.35)" aria-hidden />
            <span style={{ fontSize: 13, color: "rgba(245,245,247,0.55)" }}>
              {credits.auto_recharge_phone ? `Recharge auto activée — ${credits.auto_recharge_phone_amount} €` : "Recharge automatique désactivée"}
            </span>
          </div>
          <button type="button" style={btnDark} onClick={() => openAutoModal("phone")}>Modifier</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
          <button type="button" style={{ ...btnSecondary }} onClick={() => window.open("/tarifs", "_blank")}>
            <Download size={13} aria-hidden /> Grille tarifaire
          </button>
          <button type="button" style={btnPrimary} onClick={() => openRecharge("phone")}>
            Recharger mes crédits téléphoniques
          </button>
        </div>
      </div>

      <div style={billingCardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 14px" }}>Historique</h3>
        {orgBilling?.hasStripeCustomer ? (
          <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: 0 }}>
            Retrouve tes factures directement dans le{" "}
            <button type="button" style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}
              onClick={async () => {
                const res = await fetch("/api/billing/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: orgBilling.stripeCustomerId }) })
                const d = await res.json() as { url?: string }
                if (d.url) window.open(d.url, "_blank")
              }}
            >portail Stripe</button>.
          </p>
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", margin: 0 }}>Aucune facture pour l&apos;instant — souscris un abonnement depuis la page <a href="/tarifs" style={{ color: "var(--accent)" }}>tarifs</a>.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {rechargeModal.open && (
        <ModalOverlay onClose={() => setRechargeModal(m => ({ ...m, open: false }))}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Recharger crédits {rechargeModal.type === "phone" ? "téléphoniques" : "API"}</h3>
            <button type="button" onClick={() => setRechargeModal(m => ({ ...m, open: false }))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <label style={labelStyle}>Montant</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 14 }}>
              {RECHARGE_AMOUNTS.map(amt => (
                <button key={amt} type="button" onClick={() => { setSelectedAmount(amt); setCustomAmount("") }} style={amtBtnStyle(selectedAmount === amt && !customAmount)}>{amt} €</button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Montant personnalisé</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FocusInput type="number" min="5" max="500" placeholder="Ex: 75" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
                <span style={{ color: "rgba(245,245,247,0.4)", fontSize: 13, whiteSpace: "nowrap" }}>€ (min. 5 €)</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setRechargeModal(m => ({ ...m, open: false }))}>Annuler</button>
              <button type="button" style={btnPrimary} onClick={() => void handleRecharge()} disabled={checkoutLoading}>
                {checkoutLoading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Redirection...</> : <>Payer par carte &rarr;</>}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {autoModal.open && (
        <ModalOverlay onClose={() => setAutoModal(m => ({ ...m, open: false }))}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Recharge automatique</h3>
            <button type="button" onClick={() => setAutoModal(m => ({ ...m, open: false }))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#F5F5F7", margin: 0 }}>Activer la recharge automatique</p>
                <p style={{ fontSize: 12, color: "rgba(245,245,247,0.45)", margin: "3px 0 0" }}>Recharge quand le solde est bas</p>
              </div>
              <Toggle checked={autoEnabled} onChange={setAutoEnabled} />
            </div>
            {autoEnabled && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Montant de recharge</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {[10, 25, 50, 100].map(amt => (
                    <button key={amt} type="button" onClick={() => setAutoAmount(amt)} style={amtBtnStyle(autoAmount === amt)}>{amt} €</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setAutoModal(m => ({ ...m, open: false }))}>Annuler</button>
              <button type="button" style={btnPrimary} onClick={() => void handleSaveAutoRecharge()} disabled={autoLoading}>
                {autoLoading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── API TAB (preserved) ──────────────────────────────────────────────────────

interface ApiKey {
  id: string
  name: string
  key_preview: string
  webhook_url: string | null
  created_by: string
  created_at: Date | string
}

function ApiTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [apiCredits, setApiCredits] = useState(0)
  const [autoRechargeApi, setAutoRechargeApi] = useState(false)
  const LS_KEY = "lynaris_api_keys"
  const [keys, setKeys] = useState<ApiKey[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? (JSON.parse(raw) as ApiKey[]) : []
    } catch { return [] }
  })
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyModal, setNewKeyModal] = useState(false)
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [autoApiModal, setAutoApiModal] = useState(false)
  const [autoApiEnabled, setAutoApiEnabled] = useState(false)
  const [autoApiAmount, setAutoApiAmount] = useState(25)
  const [rechargeLoading, setRechargeLoading] = useState(false)
  const [customApiAmount, setCustomApiAmount] = useState("")
  const [selectedApiAmount, setSelectedApiAmount] = useState(25)
  const [apiRechargeModal, setApiRechargeModal] = useState(false)

  const apiAmtBtn = (active: boolean): CSSProperties => ({
    height: 38, borderRadius: 11,
    border: `1px solid ${active ? "rgba(232,111,77,0.5)" : "var(--glass-border)"}`,
    background: active ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.04)",
    color: active ? "var(--accent)" : "rgba(250,250,250,0.7)",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "all 220ms var(--ease-apple)",
  })

  useEffect(() => {
    fetch("/api/billing/credits/balance")
      .then(r => r.json() as Promise<{ api_credits: number; auto_recharge_api: boolean }>)
      .then(d => { setApiCredits(d.api_credits); setAutoRechargeApi(d.auto_recharge_api) })
      .catch(() => {})
    fetch("/api/keys")
      .then(r => r.json() as Promise<{ keys: ApiKey[] }>)
      .then(d => {
        if (d.keys && d.keys.length > 0) {
          setKeys(d.keys); localStorage.setItem("lynaris_api_keys", JSON.stringify(d.keys))
        }
      })
      .catch(() => {})
  }, [])

  async function handleCreateKey() {
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newKeyName.trim() }) })
      const data = await res.json() as { key?: string; key_preview?: string; name?: string; id?: string }
      if (data.key) {
        setCreatedKey({ key: data.key, name: data.name ?? newKeyName })
        setNewKeyModal(false); setNewKeyName("")
        const newEntry: ApiKey = {
          id: data.id ?? `local_${Date.now()}`, name: data.name ?? newKeyName,
          key_preview: data.key_preview ?? (data.key.substring(0, 7) + "..." + data.key.slice(-4)),
          webhook_url: null, created_by: "Yoann Cabon", created_at: new Date().toISOString(),
        }
        setKeys(prev => { const updated = [...prev, newEntry]; localStorage.setItem("lynaris_api_keys", JSON.stringify(updated)); return updated })
      }
    } catch { toast("Erreur lors de la création de la clé API.", "error") }
    finally { setCreatingKey(false) }
  }

  async function handleDeleteKey(id: string) {
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" })
      setKeys(prev => { const updated = prev.filter(k => k.id !== id); localStorage.setItem("lynaris_api_keys", JSON.stringify(updated)); return updated })
      setDeleteConfirm(null); setMenuOpen(null)
    } catch { /* ignore */ }
  }

  async function handleApiRecharge() {
    const amount = customApiAmount ? parseFloat(customApiAmount) : selectedApiAmount
    if (!amount || amount < 5) return
    setRechargeLoading(true)
    try {
      const res = await fetch("/api/billing/credits/recharge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, type: "api" }) })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.assign(data.url); else toast(data.error ?? "Erreur lors du paiement. Réessayez.", "error")
    } catch { toast("Erreur réseau. Vérifiez votre connexion.", "error") }
    finally { setRechargeLoading(false) }
  }

  const apiCardStyle: CSSProperties = { ...cardStyle, borderRadius: 14, padding: "20px 22px" }

  return (
    <div>
      <div style={apiCardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Crédits API</h3>
          <button type="button" style={{ ...btnSecondary, fontSize: 12 }} onClick={() => window.open("https://docs.lynaris.ai", "_blank")}>
            <ExternalLink size={12} aria-hidden /> Documentation
          </button>
        </div>
        <p style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", margin: "0 0 5px" }}>Solde de crédits API</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#F5F5F7", margin: "0 0 14px", fontVariantNumeric: "tabular-nums" }}>{apiCredits} €</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <RefreshCw size={13} color="rgba(245,245,247,0.35)" aria-hidden />
            <span style={{ fontSize: 13, color: "rgba(245,245,247,0.55)" }}>{autoRechargeApi ? "Recharge auto activée." : "Recharge auto désactivée."}</span>
          </div>
          <button type="button" style={btnSecondary} onClick={() => { setAutoApiEnabled(autoRechargeApi); setAutoApiModal(true) }}>Modifier</button>
        </div>
        <button type="button" style={btnSecondary} onClick={() => setApiRechargeModal(true)}>Recharger mes crédits API</button>
      </div>

      <div style={apiCardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Clés API</h3>
          <button type="button" style={btnPrimary} onClick={() => setNewKeyModal(true)}>Créer une nouvelle clé API</button>
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 100px 40px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["Nom", "Date", "Créée par", "Webhook", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(245,245,247,0.35)" }}>{h}</span>
            ))}
          </div>
          {keys.length === 0 ? (
            <div style={{ padding: "32px 14px", textAlign: "center", color: "rgba(245,245,247,0.35)", fontSize: 13 }}>
              Aucune clé API — créez-en une pour accéder à l&apos;API Lynaris.
            </div>
          ) : keys.map(k => (
            <div key={k.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 100px 40px", padding: "12px 14px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Key size={13} color="#34D399" aria-hidden />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>{k.name}</p>
                  <p style={{ fontSize: 11, color: "rgba(245,245,247,0.35)", margin: 0, fontFamily: "var(--font-geist-mono, monospace)" }}>{k.key_preview}</p>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "rgba(245,245,247,0.5)" }}>
                {new Date(k.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>YC</div>
                <span style={{ fontSize: 12, color: "rgba(245,245,247,0.6)" }}>{k.created_by}</span>
              </div>
              <span style={{ fontSize: 12, color: "rgba(245,245,247,0.35)" }}>{k.webhook_url ?? "—"}</span>
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setMenuOpen(menuOpen === k.id ? null : k.id)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: "pointer", color: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", padding: 5 }}>
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen === k.id && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 160, background: "rgba(18,18,22,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "4px", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                    <button type="button" onClick={() => { setDeleteConfirm(k.id); setMenuOpen(null) }} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 10px", borderRadius: 7, background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: 13 }}>
                      <Trash2 size={13} /> Révoquer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {newKeyModal && (
        <ModalOverlay onClose={() => setNewKeyModal(false)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Créer une clé API</h3>
            <button type="button" onClick={() => setNewKeyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <label style={labelStyle} htmlFor="key-name">Nom de la clé</label>
            <FocusInput id="key-name" type="text" placeholder="Ex: Production, Staging..." value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleCreateKey() }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={btnSecondary} onClick={() => setNewKeyModal(false)}>Annuler</button>
              <button type="button" style={btnPrimary} onClick={() => void handleCreateKey()} disabled={creatingKey || !newKeyName.trim()}>
                {creatingKey ? "Création..." : "Créer la clé"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {createdKey && (
        <ModalOverlay onClose={() => setCreatedKey(null)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Clé API créée</h3>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "#34D399", margin: "0 0 8px" }}>Copiez cette clé maintenant — elle ne sera plus affichée.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: 12, color: "#F5F5F7", fontFamily: "var(--font-geist-mono, monospace)", wordBreak: "break-all" }}>{createdKey.key}</code>
                <button type="button" onClick={() => { void navigator.clipboard.writeText(createdKey.key); setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000) }} style={{ ...btnSecondary, height: 30, padding: "0 10px", fontSize: 11 }}>
                  {keyCopied ? <><Check size={12} color="#34D399" /> Copié</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>
            </div>
            <button type="button" style={{ ...btnPrimary, width: "100%" }} onClick={() => setCreatedKey(null)}>Fermer</button>
          </div>
        </ModalOverlay>
      )}

      {deleteConfirm && (
        <ModalOverlay onClose={() => setDeleteConfirm(null)}>
          <div style={{ padding: "24px 22px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Trash2 size={18} color="#F87171" aria-hidden />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 8px" }}>Révoquer cette clé ?</h3>
            <p style={{ fontSize: 13, color: "rgba(245,245,247,0.55)", margin: "0 0 20px" }}>Cette action est irréversible. Les applications utilisant cette clé perdront l&apos;accès.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button type="button" style={{ ...btnPrimary, background: "#F87171", color: "#fff" }} onClick={() => void handleDeleteKey(deleteConfirm)}>Révoquer</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {autoApiModal && (
        <ModalOverlay onClose={() => setAutoApiModal(false)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Recharge automatique API</h3>
            <button type="button" onClick={() => setAutoApiModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#F5F5F7", margin: 0 }}>Activer</p>
                <p style={{ fontSize: 12, color: "rgba(245,245,247,0.45)", margin: "3px 0 0" }}>Recharge automatique des crédits API</p>
              </div>
              <Toggle checked={autoApiEnabled} onChange={setAutoApiEnabled} />
            </div>
            {autoApiEnabled && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Montant</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {[10, 25, 50, 100].map(a => (
                    <button key={a} type="button" onClick={() => setAutoApiAmount(a)} style={apiAmtBtn(autoApiAmount === a)}>{a} €</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setAutoApiModal(false)}>Annuler</button>
              <button type="button" style={btnPrimary} onClick={() => { setAutoRechargeApi(autoApiEnabled); setAutoApiModal(false) }}>Sauvegarder</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {apiRechargeModal && (
        <ModalOverlay onClose={() => setApiRechargeModal(false)}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: 0 }}>Recharger mes crédits API</h3>
            <button type="button" onClick={() => setApiRechargeModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <label style={labelStyle}>Montant</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 14 }}>
              {RECHARGE_AMOUNTS.map(amt => (
                <button key={amt} type="button" onClick={() => { setSelectedApiAmount(amt); setCustomApiAmount("") }} style={apiAmtBtn(selectedApiAmount === amt && !customApiAmount)}>{amt} €</button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Montant personnalisé</label>
              <FocusInput type="number" min="5" max="500" placeholder="Ex: 75" value={customApiAmount} onChange={(e) => setCustomApiAmount(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => setApiRechargeModal(false)}>Annuler</button>
              <button type="button" style={btnPrimary} onClick={() => void handleApiRecharge()} disabled={rechargeLoading}>
                {rechargeLoading ? "Redirection..." : "Payer par carte →"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── TÉLÉPHONIE TAB ──────────────────────────────────────────────────────────

interface PhoneNumber {
  id: string
  phoneNumber: string
  displayName: string | null
  direction: "inbound" | "outbound" | "both"
  status: "active" | "suspended" | "released"
  agentId: string | null
  monthlyCostCents: number
  createdAt: string
}

interface AddPhoneStep { step: 1 | 2 | 3 }

function TelephoniTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Modal state
  const [modalStep, setModalStep] = useState<AddPhoneStep["step"]>(1)
  const [direction, setDirection] = useState<"inbound" | "outbound" | "both">("inbound")
  const [source, setSource] = useState<"new" | "existing">("new")
  const [displayName, setDisplayName] = useState("")
  const [existingNumber, setExistingNumber] = useState("")
  const [available, setAvailable] = useState<{ phoneNumber: string; locality: string }[]>([])
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [provisionedNumber, setProvisionedNumber] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/phone-numbers")
      .then(r => r.ok ? r.json() as Promise<{ numbers: PhoneNumber[] }> : null)
      .then(data => { if (data) setNumbers(data.numbers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openModal() {
    setModalStep(1); setDirection("inbound"); setSource("new")
    setDisplayName(""); setExistingNumber(""); setAvailable([])
    setSelectedNumber(null); setProvisionedNumber(null)
    setShowModal(true)
  }

  async function searchNumbers() {
    setSearching(true)
    try {
      const res = await fetch("/api/phone-numbers/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country: "FR" }) })
      const data = await res.json() as { numbers?: { phoneNumber: string; locality: string }[]; error?: string }
      if (data.numbers) setAvailable(data.numbers)
      else toast(data.error ?? "Erreur lors de la recherche", "error")
    } catch { toast("Erreur réseau", "error") }
    finally { setSearching(false) }
  }

  async function handlePurchase() {
    if (!selectedNumber && source === "new") { toast("Sélectionne un numéro", "error"); return }
    if (!displayName.trim()) { toast("Donne un nom à ce numéro", "error"); return }
    setPurchasing(true)
    try {
      const endpoint = source === "existing" ? "/api/phone-numbers/link-existing" : "/api/phone-numbers/purchase"
      const body = source === "existing"
        ? { existing_number: existingNumber, display_name: displayName, direction }
        : { phone_number: selectedNumber, display_name: displayName, direction }
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json() as { phoneNumber?: string; forwarding_target?: string; error?: string }
      if (!res.ok) { toast(data.error ?? "Erreur lors de l'achat", "error"); return }
      setProvisionedNumber(data.phoneNumber ?? data.forwarding_target ?? "")
      setModalStep(3)
      const refreshRes = await fetch("/api/phone-numbers")
      const refreshData = await refreshRes.json() as { numbers: PhoneNumber[] }
      if (refreshData.numbers) setNumbers(refreshData.numbers)
    } catch { toast("Erreur réseau", "error") }
    finally { setPurchasing(false) }
  }

  async function handleDelete(num: PhoneNumber) {
    if (!confirm(`Supprimer le numéro ${num.phoneNumber} ? Cette action est irréversible.`)) return
    setDeleting(num.id)
    try {
      const res = await fetch(`/api/phone-numbers/${num.id}`, { method: "DELETE" })
      if (res.ok) { setNumbers(prev => prev.filter(n => n.id !== num.id)); toast("Numéro supprimé", "success") }
      else { const d = await res.json() as { error?: string }; toast(d.error ?? "Erreur lors de la suppression", "error") }
    } catch { toast("Erreur réseau", "error") }
    finally { setDeleting(null) }
  }

  function formatPhone(e164: string) {
    return e164.replace(/^(\+33)(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5 $6")
  }

  const s = cardStyle

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F7", margin: "0 0 3px" }}>Numéros de téléphone</p>
          <p style={{ fontSize: 13, color: "rgba(245,245,247,0.4)", margin: 0 }}>Attribue des numéros à tes agents vocaux (Marine, etc.)</p>
        </div>
        <button type="button" onClick={openModal} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 11, background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 24px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
          <Plus size={14} /> Ajouter un numéro
        </button>
      </div>

      {/* Liste */}
      <div style={s}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "rgba(245,245,247,0.3)" }} />
          </div>
        ) : numbers.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <Phone size={28} style={{ color: "rgba(245,245,247,0.15)", marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: "rgba(245,245,247,0.4)", margin: "0 0 6px" }}>Aucun numéro configuré</p>
            <p style={{ fontSize: 12, color: "rgba(245,245,247,0.25)", margin: 0 }}>Ajoute un numéro pour que tes agents vocaux puissent décrocher</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Numéro", "Nom", "Direction", "Statut", "Coût/mois", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numbers.map(num => (
                <tr key={num.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#F5F5F7", fontWeight: 500, fontFamily: "monospace" }}>{formatPhone(num.phoneNumber)}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "rgba(245,245,247,0.7)" }}>{num.displayName ?? "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(232,111,77,0.14)", color: "var(--accent)", border: "1px solid rgba(232,111,77,0.25)" }}>
                      {num.direction === "inbound" ? "Entrant" : num.direction === "outbound" ? "Sortant" : "Les deux"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: num.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: num.status === "active" ? "#10B981" : "#EF4444", border: `1px solid ${num.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                      {num.status === "active" ? "Actif" : num.status === "suspended" ? "Suspendu" : "Libéré"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "rgba(245,245,247,0.5)" }}>{(num.monthlyCostCents / 100).toFixed(2)}€</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button type="button" onClick={() => void handleDelete(num)} disabled={deleting === num.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(248,113,113,0.7)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
                      {deleting === num.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />} Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info tarif */}
      <div style={{ ...s, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertCircle size={14} style={{ color: "rgba(245,245,247,0.3)", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "rgba(245,245,247,0.4)", margin: 0, lineHeight: 1.6 }}>
          Numéros nationaux FR (+33 9) · 5€/mois par numéro · Routage Europe (IE1) · Voice + SMS inclus
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "rgba(28,28,36,0.9)", backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)", border: "1px solid var(--glass-border-strong)", borderRadius: 22, width: "100%", maxWidth: 480, padding: 28, position: "relative", boxShadow: "0 30px 80px -25px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.4)", display: "flex" }}>
              <X size={18} />
            </button>

            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= modalStep ? "linear-gradient(90deg, var(--accent), #C2552A)" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
              ))}
            </div>

            {/* Step 1 — Type + Source */}
            {modalStep === 1 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px" }}>Ajouter un numéro</h3>
                <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: "0 0 20px" }}>Choisis le type de numéro à configurer</p>

                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Direction</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {[["inbound", "Entrant", "📥"], ["outbound", "Sortant", "📤"], ["both", "Les deux", "↔️"]].map(([val, label, emoji]) => (
                    <button key={val} type="button" onClick={() => setDirection(val as typeof direction)} style={{ padding: "12px 8px", borderRadius: 10, border: `1px solid ${direction === val ? "rgba(232,111,77,0.5)" : "rgba(255,255,255,0.08)"}`, background: direction === val ? "rgba(232,111,77,0.14)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: direction === val ? "var(--accent)" : "rgba(245,245,247,0.5)" }}>{label}</div>
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Source</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                  {[["new", "Nouveau numéro", "Lynaris t'attribue un +33 9"], ["existing", "Numéro existant", "Redirige ton numéro actuel"]].map(([val, label, desc]) => (
                    <button key={val} type="button" onClick={() => setSource(val as typeof source)} style={{ padding: "14px", borderRadius: 10, border: `1px solid ${source === val ? "rgba(232,111,77,0.5)" : "rgba(255,255,255,0.08)"}`, background: source === val ? "rgba(232,111,77,0.14)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: source === val ? "var(--accent)" : "#F5F5F7", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "rgba(245,245,247,0.4)" }}>{desc}</div>
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => { setModalStep(2); if (source === "new") void searchNumbers() }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Continuer →
                </button>
              </div>
            )}

            {/* Step 2 — Sélection + Nom */}
            {modalStep === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", margin: "0 0 6px" }}>{source === "new" ? "Choisir un numéro" : "Ton numéro existant"}</h3>
                <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: "0 0 20px" }}>{source === "new" ? "Numéros nationaux disponibles en France" : "Saisis ton numéro pour configurer la redirection"}</p>

                {source === "new" && (
                  <div style={{ marginBottom: 16 }}>
                    {searching ? (
                      <div style={{ textAlign: "center", padding: 20 }}>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "rgba(245,245,247,0.3)" }} />
                        <p style={{ fontSize: 12, color: "rgba(245,245,247,0.3)", marginTop: 8 }}>Recherche des numéros disponibles...</p>
                      </div>
                    ) : available.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 20 }}>
                        <p style={{ fontSize: 13, color: "rgba(245,245,247,0.4)", margin: "0 0 12px" }}>Aucun numéro trouvé</p>
                        <button type="button" onClick={() => void searchNumbers()} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "1px solid rgba(232,111,77,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                          <RefreshCw size={11} style={{ marginRight: 4, display: "inline" }} /> Réessayer
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                        {available.map(n => (
                          <button key={n.phoneNumber} type="button" onClick={() => setSelectedNumber(n.phoneNumber)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: `1px solid ${selectedNumber === n.phoneNumber ? "rgba(232,111,77,0.5)" : "rgba(255,255,255,0.08)"}`, background: selectedNumber === n.phoneNumber ? "rgba(232,111,77,0.12)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                            <span style={{ fontSize: 13, fontFamily: "monospace", color: "#F5F5F7" }}>{n.phoneNumber}</span>
                            <span style={{ fontSize: 11, color: "rgba(245,245,247,0.4)" }}>{n.locality ?? "France"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {source === "existing" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.5)", display: "block", marginBottom: 6 }}>Ton numéro actuel (format international)</label>
                    <input value={existingNumber} onChange={e => setExistingNumber(e.target.value)} placeholder="+33 6 12 34 56 78" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#F5F5F7", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.5)", display: "block", marginBottom: 6 }}>Nom du numéro</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ex: Ligne principale Marine" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#F5F5F7", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setModalStep(1)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "rgba(245,245,247,0.7)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Retour</button>
                  <button type="button" onClick={() => void handlePurchase()} disabled={purchasing} style={{ flex: 2, padding: "11px", borderRadius: 10, background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: purchasing ? "not-allowed" : "pointer", opacity: purchasing ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {purchasing ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Provisionnement...</> : "Confirmer l'achat →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Confirmation */}
            {modalStep === 3 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F7", margin: "0 0 8px" }}>Numéro attribué !</h3>
                <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: "0 0 16px" }}>Un nouveau numéro vient de t&apos;être attribué.</p>
                {provisionedNumber && (
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px", marginBottom: 20 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#10B981", margin: 0 }}>{provisionedNumber}</p>
                    {source === "existing" && <p style={{ fontSize: 11, color: "rgba(245,245,247,0.4)", margin: "6px 0 0" }}>Configure la redirection de ton numéro vers ce numéro Twilio</p>}
                  </div>
                )}
                <button type="button" onClick={() => setShowModal(false)} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, var(--accent) 0%, #C2552A 100%)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Terminer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

type Tab = "entreprise" | "profil" | "securite" | "notifications" | "danger" | "api" | "telephonie"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "entreprise", label: "Entreprise", icon: <Building size={14} /> },
  { id: "profil", label: "Profil", icon: <User size={14} /> },
  { id: "securite", label: "Sécurité", icon: <Shield size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={14} /> },
  { id: "api", label: "API", icon: null },
  { id: "telephonie", label: "Téléphonie", icon: <Phone size={14} /> },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab")
      return (p as Tab) ?? "entreprise"
    }
    return "entreprise"
  })
  const { toasts, toast, setToasts } = useToast()

  return (
    <div style={{ padding: "clamp(20px, 4vw, 32px) clamp(16px, 4vw, 40px)", maxWidth: 960 }}>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "#FAFAFA", margin: "0 0 28px", lineHeight: 1.1 }}>
        Paramètres
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)", marginBottom: 28, gap: 0, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
        {TABS.map(tab => {
          const active = activeTab === tab.id
          const isDanger = tab.id === "danger"
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 0", marginRight: 24, fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active
                  ? isDanger ? "#F87171" : "#FAFAFA"
                  : isDanger ? "rgba(248,113,113,0.6)" : "rgba(250,250,250,0.5)",
                background: "none", border: "none",
                borderBottom: active
                  ? `2px solid ${isDanger ? "#F87171" : "var(--accent)"}`
                  : "2px solid transparent",
                marginBottom: -1, cursor: "pointer",
                transition: "color 220ms var(--ease-apple), border-color 220ms var(--ease-apple)",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "entreprise" && <EntrepriseTab toast={toast} />}
      {activeTab === "profil" && <ProfilTab toast={toast} />}
      {activeTab === "securite" && <SecurityTab toast={toast} />}
      {activeTab === "notifications" && <NotificationsTab toast={toast} />}
      {activeTab === "danger" && <DangerZoneTab toast={toast} />}
      {activeTab === ("billing" as string) && null}
      {activeTab === "api" && <ApiTab toast={toast} />}
      {activeTab === "telephonie" && <TelephoniTab toast={toast} />}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
