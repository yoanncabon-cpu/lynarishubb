"use client"

import React, { useEffect, useMemo, useState, type CSSProperties } from "react"
import {
  Users, Plus, Search, X, Phone, Mail, Trash2,
  Briefcase, Heart, UserCheck, ShoppingBag, Filter, Bot,
  type LucideIcon,
} from "lucide-react"
import { agents } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactCategory = "employee" | "client" | "prospect" | "supplier"

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  category: ContactCategory
  // Agent par défaut qui gère les interactions avec ce contact (Marine pour les appels, Mae pour les mails, etc.)
  primaryAgent: string | null
  notes: string
  createdAt: string
  color: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = "lynaris_contacts_v1"

const CATEGORY_META: Record<ContactCategory, { label: string; icon: LucideIcon; color: string }> = {
  employee: { label: "Employé",   icon: UserCheck,   color: "#10B981" },
  client:   { label: "Client",    icon: Heart,       color: "#E86F4D" },
  prospect: { label: "Prospect",  icon: Briefcase,   color: "#7C3AED" },
  supplier: { label: "Fournisseur", icon: ShoppingBag, color: "#F59E0B" },
}

const AVATAR_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#22D3EE", "#EC4899", "#6366F1", "#8B5CF6", "#64748B", "#E86F4D"]

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c-1", name: "Camille Roux", email: "camille@lynaris.dev", phone: "+33 6 12 34 56 78",
    company: "Lynaris", role: "Lead designer",
    category: "employee", primaryAgent: "mae",
    notes: "Disponible du lundi au jeudi", createdAt: "2026-04-15", color: "#7C3AED",
  },
  {
    id: "c-2", name: "Sophie Marchand", email: "sophie@cabinet-marchand.fr", phone: "+33 1 42 88 12 30",
    company: "Cabinet Marchand", role: "Gérante",
    category: "client", primaryAgent: "marine",
    notes: "Cliente régulière — RDV chaque trimestre", createdAt: "2026-03-22", color: "#E86F4D",
  },
  {
    id: "c-3", name: "Pierre Lambert", email: "p.lambert@studio-form.fr", phone: "+33 6 78 90 12 34",
    company: "Studio Form", role: "Directeur",
    category: "prospect", primaryAgent: "elio",
    notes: "À relancer avant fin du mois", createdAt: "2026-04-10", color: "#10B981",
  },
  {
    id: "c-4", name: "Hassan Bouvier", email: "contact@bouvier-print.com", phone: "+33 1 39 12 45 67",
    company: "Bouvier Print", role: "Commercial",
    category: "supplier", primaryAgent: null,
    notes: "Imprimeur partenaire — devis sous 48h", createdAt: "2026-02-05", color: "#F59E0B",
  },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  bg: "#111114",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.07)",
  cardBorderHover: "rgba(255,255,255,0.14)",
  accent: "#E86F4D",
  textPrimary: "#F5F5F7",
  textMuted: "rgba(245,245,247,0.45)",
  textSecondary: "rgba(245,245,247,0.65)",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.1)",
}

const inputStyle: CSSProperties = {
  width: "100%", height: 40, padding: "0 12px",
  background: S.inputBg, border: `1px solid ${S.inputBorder}`,
  borderRadius: 8, color: S.textPrimary, fontSize: 13,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
}

const sectionLabel: CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "rgba(232,111,77,0.5)", margin: 0,
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadContacts(): Contact[] {
  if (typeof window === "undefined") return INITIAL_CONTACTS
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Contact[]) : INITIAL_CONTACTS
  } catch { return INITIAL_CONTACTS }
}

function saveContacts(list: Contact[]) {
  // 1) localStorage : accès instantané dans le browser (chat agent côté client)
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
  // 2) Sync DB : rend les contacts accessibles aux jobs cron / runs agent côté serveur
  // Fire-and-forget — pas bloquant, l'UI reste réactive même si la sync échoue
  void fetch("/api/contacts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contacts: list }),
  }).catch(() => { /* sync best-effort, le LS reste source de vérité côté UI */ })
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── ContactCard ──────────────────────────────────────────────────────────────

function ContactCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const cat = CATEGORY_META[contact.category]
  const CatIcon = cat.icon
  const agent = contact.primaryAgent ? agents.find(a => a.slug === contact.primaryAgent) : null

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 14, padding: 18,
        borderRadius: 14, textAlign: "left", width: "100%", cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.06)" : S.cardBg,
        border: `1px solid ${hovered ? S.cardBorderHover : S.cardBorder}`,
        transition: "background 150ms, border-color 150ms, box-shadow 150ms",
        boxShadow: hovered ? "0 4px 24px rgba(0,0,0,0.25)" : "none",
      }}
    >
      {/* Header : avatar + nom + catégorie */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: `${contact.color}22`, border: `1.5px solid ${contact.color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: contact.color,
        }}>
          {getInitials(contact.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contact.name}
          </h3>
          <p style={{ fontSize: 12, color: S.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contact.role}{contact.company && ` · ${contact.company}`}
          </p>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 999,
          background: `${cat.color}18`, border: `1px solid ${cat.color}35`,
          fontSize: 10.5, fontWeight: 600, color: cat.color, flexShrink: 0,
        }}>
          <CatIcon size={10} aria-hidden /> {cat.label}
        </span>
      </div>

      {/* Coordonnées */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 56, marginTop: -8 }}>
        {contact.email && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: S.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <Mail size={11} color={S.textMuted} aria-hidden style={{ flexShrink: 0 }} /> {contact.email}
          </div>
        )}
        {contact.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: S.textSecondary }}>
            <Phone size={11} color={S.textMuted} aria-hidden style={{ flexShrink: 0 }} /> {contact.phone}
          </div>
        )}
      </div>

      {/* Footer : agent assigné */}
      {agent && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          borderRadius: 8, background: `${agent.color}10`, border: `1px solid ${agent.color}25`,
        }}>
          <AgentAvatar slug={agent.slug} size={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: S.textMuted, margin: 0, fontWeight: 500 }}>Agent assigné</p>
            <p style={{ fontSize: 12, color: agent.color, margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {agent.name} — {agent.role}
            </p>
          </div>
        </div>
      )}
    </button>
  )
}

// ─── ContactModal (création / édition) ────────────────────────────────────────

function ContactModal({
  contact,
  onClose,
  onSave,
  onDelete,
}: {
  contact: Contact | null
  onClose: () => void
  onSave: (c: Contact) => void
  onDelete?: (id: string) => void
}) {
  const isNew = contact === null
  const [name,         setName]         = useState(contact?.name ?? "")
  const [email,        setEmail]        = useState(contact?.email ?? "")
  const [phone,        setPhone]        = useState(contact?.phone ?? "")
  const [company,      setCompany]      = useState(contact?.company ?? "")
  const [role,         setRole]         = useState(contact?.role ?? "")
  const [category,     setCategory]     = useState<ContactCategory>(contact?.category ?? "client")
  const [primaryAgent, setPrimaryAgent] = useState<string | null>(contact?.primaryAgent ?? null)
  const [notes,        setNotes]        = useState(contact?.notes ?? "")

  function handleSave() {
    if (!name.trim()) return
    const newContact: Contact = {
      id: contact?.id ?? `c-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      role: role.trim(),
      category,
      primaryAgent,
      notes: notes.trim(),
      createdAt: contact?.createdAt ?? new Date().toISOString().slice(0, 10),
      color: contact?.color ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? "#7C3AED",
    }
    onSave(newContact)
    onClose()
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(520px, calc(100vw - 32px))", maxHeight: "90vh", overflowY: "auto",
        background: "#161618", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        zIndex: 101, padding: 24, display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, margin: 0 }}>
            {isNew ? "Nouveau contact" : "Modifier le contact"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, padding: 4, display: "flex", borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Catégorie — choix visuel */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Catégorie</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {(Object.keys(CATEGORY_META) as ContactCategory[]).map(key => {
              const meta = CATEGORY_META[key]
              const Icon = meta.icon
              const active = category === key
              return (
                <button key={key} type="button" onClick={() => setCategory(key)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px",
                  borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: active ? `${meta.color}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? `${meta.color}55` : "rgba(255,255,255,0.08)"}`,
                  color: active ? meta.color : S.textMuted,
                  transition: "background 120ms, border-color 120ms, color 120ms",
                }}>
                  <Icon size={16} aria-hidden />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Nom + Rôle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Nom complet *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Rôle</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Directeur, Gérant…" style={inputStyle} />
          </div>
        </div>

        {/* Entreprise */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Entreprise</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Cabinet Dupont" style={inputStyle} />
        </div>

        {/* Email + Téléphone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.fr" style={inputStyle} />
          </div>
          <div>
            <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" style={inputStyle} />
          </div>
        </div>

        {/* Agent assigné — raccord direct avec l'équipe IA */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>
            Agent assigné <span style={{ color: S.textMuted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— qui prend en charge ce contact ?</span>
          </label>
          <select
            value={primaryAgent ?? ""}
            onChange={e => setPrimaryAgent(e.target.value || null)}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
          >
            <option value="">Aucun agent assigné</option>
            {agents.map(a => (
              <option key={a.slug} value={a.slug}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Préférences, historique, points d'attention…"
            rows={3}
            style={{ ...inputStyle, height: "auto", padding: "8px 12px", resize: "none", lineHeight: 1.5 }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 4 }}>
          {!isNew && onDelete && contact && (
            <button type="button" onClick={() => { onDelete(contact.id); onClose() }} style={{
              height: 38, padding: "0 14px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)",
              background: "rgba(248,113,113,0.08)", color: "#F87171", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Trash2 size={13} /> Supprimer
            </button>
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button type="button" onClick={onClose} style={{
              height: 38, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: S.textMuted, fontSize: 13, cursor: "pointer",
            }}>
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={!name.trim()} style={{
              height: 38, padding: "0 20px", borderRadius: 8, border: "none",
              background: name.trim() ? S.accent : "rgba(255,255,255,0.1)",
              color: name.trim() ? "#fff" : S.textMuted,
              fontSize: 13, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed",
              transition: "background 150ms",
            }}>
              {isNew ? "Créer le contact" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts]   = useState<Contact[]>(INITIAL_CONTACTS)
  const [search, setSearch]       = useState("")
  const [filter, setFilter]       = useState<ContactCategory | "all">("all")
  const [editing, setEditing]     = useState<Contact | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Hydrate : LS d'abord (instantané), puis remplace par la version DB si plus récente
  // (cas où l'user a modifié depuis un autre browser ou un autre device)
  useEffect(() => {
    setContacts(loadContacts())
    void fetch("/api/contacts")
      .then(r => r.ok ? r.json() : null)
      .then((data: { contacts?: Contact[] } | null) => {
        if (data?.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
          setContacts(data.contacts)
          try { localStorage.setItem(LS_KEY, JSON.stringify(data.contacts)) } catch { /* ignore */ }
        }
      })
      .catch(() => { /* DB indisponible — on garde le LS */ })
  }, [])

  function handleSave(c: Contact) {
    setContacts(prev => {
      const exists = prev.some(p => p.id === c.id)
      const next = exists ? prev.map(p => p.id === c.id ? c : p) : [c, ...prev]
      saveContacts(next)
      return next
    })
  }

  function handleDelete(id: string) {
    setContacts(prev => {
      const next = prev.filter(p => p.id !== id)
      saveContacts(next)
      return next
    })
  }

  function openNew() { setEditing(null); setShowModal(true) }
  function openEdit(c: Contact) { setEditing(c); setShowModal(true) }

  // Filtrage
  const filtered = useMemo(() => {
    const lo = search.toLowerCase().trim()
    return contacts.filter(c => {
      if (filter !== "all" && c.category !== filter) return false
      if (!lo) return true
      return (
        c.name.toLowerCase().includes(lo) ||
        c.email.toLowerCase().includes(lo) ||
        c.company.toLowerCase().includes(lo) ||
        c.role.toLowerCase().includes(lo)
      )
    })
  }, [contacts, search, filter])

  // Comptes par catégorie pour les badges de filtre
  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: contacts.length }
    for (const c of contacts) acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  }, [contacts])

  return (
    <div style={{ minHeight: "100%", background: S.bg, padding: "32px 32px 64px", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Users size={20} color={S.accent} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: S.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Contacts</h1>
            <p style={{ fontSize: 13, color: S.textMuted, margin: "3px 0 0" }}>
              Tes employés, clients, prospects et fournisseurs — chacun raccordé à un agent
            </p>
          </div>
        </div>
        <button type="button" onClick={openNew} style={{
          height: 38, padding: "0 16px", borderRadius: 10, border: "none",
          background: S.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 150ms",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}>
          <Plus size={15} /> Nouveau contact
        </button>
      </div>

      {/* ── Recherche + filtres ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div style={{ position: "relative", maxWidth: 440 }}>
          <Search size={14} color={S.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, entreprise…"
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={13} color={S.textMuted} aria-hidden />
          <FilterChip label={`Tous (${counts["all"] ?? 0})`} active={filter === "all"} onClick={() => setFilter("all")} color={S.accent} />
          {(Object.keys(CATEGORY_META) as ContactCategory[]).map(key => {
            const meta = CATEGORY_META[key]
            const count = counts[key] ?? 0
            return (
              <FilterChip
                key={key}
                label={`${meta.label} (${count})`}
                active={filter === key}
                onClick={() => setFilter(key)}
                color={meta.color}
              />
            )
          })}
        </div>
      </div>

      {/* ── Grille de contacts ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "64px 24px", textAlign: "center", borderRadius: 16,
          background: S.cardBg, border: `1px dashed ${S.cardBorder}`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(232,111,77,0.08)", border: "1px solid rgba(232,111,77,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={22} color={S.accent} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, margin: "0 0 4px" }}>
              {search || filter !== "all" ? "Aucun contact ne correspond" : "Aucun contact pour l'instant"}
            </p>
            <p style={{ fontSize: 12.5, color: S.textMuted, margin: 0 }}>
              {search || filter !== "all"
                ? "Essaie une autre recherche ou un autre filtre."
                : "Ajoute tes employés, clients et prospects pour les raccorder à tes agents."}
            </p>
          </div>
          {!search && filter === "all" && (
            <button type="button" onClick={openNew} style={{
              marginTop: 6, height: 36, padding: "0 18px", borderRadius: 8, border: "none",
              background: S.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Plus size={14} /> Ajouter mon premier contact
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map(c => (
            <ContactCard key={c.id} contact={c} onClick={() => openEdit(c)} />
          ))}
        </div>
      )}

      {/* ── Footer info — raccordement aux agents ── */}
      <div style={{
        marginTop: 36, padding: "14px 18px", borderRadius: 12,
        background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot size={16} color="#A78BFA" aria-hidden />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: S.textPrimary, margin: "0 0 2px" }}>
            Tes agents reconnaissent automatiquement tes contacts
          </p>
          <p style={{ fontSize: 11.5, color: S.textMuted, margin: 0, lineHeight: 1.5 }}>
            Quand Marine décroche un appel d&apos;un contact connu, elle adapte son ton et son script.
            Quand Mae trie tes mails, elle priorise selon la catégorie.
          </p>
        </div>
      </div>

      {/* ── Modal création / édition ── */}
      {showModal && (
        <ContactModal
          contact={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
        />
      )}
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button type="button" onClick={onClick} style={{
      height: 28, padding: "0 12px", borderRadius: 999, cursor: "pointer",
      fontSize: 12, fontWeight: 600,
      background: active ? `${color}18` : "rgba(255,255,255,0.04)",
      border: `1px solid ${active ? `${color}55` : "rgba(255,255,255,0.08)"}`,
      color: active ? color : S.textSecondary,
      transition: "background 120ms, border-color 120ms, color 120ms",
    }}>
      {label}
    </button>
  )
}
