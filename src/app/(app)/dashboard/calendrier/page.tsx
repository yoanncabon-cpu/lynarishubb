"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, X, Plus, RefreshCw } from "lucide-react"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import type { CalendarEvent } from "@/app/api/calendar/events/route"
import { EventModal, type EventFormData } from "./_components/EventModal"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C_TODAY   = "#E86F4D"

const TYPE_LABELS: Partial<Record<CalendarEvent["type"], string>> = {
  rdv:            "Rendez-vous",
  contenu:        "Contenus",
  automatisation: "Automatisations",
  tache:          "Tâches",
  autre:          "Autres",
  action:         "Actions agents",
}
const TYPE_COLORS: Partial<Record<CalendarEvent["type"], string>> = {
  rdv:            "#22D3EE",
  contenu:        "#F472B6",
  automatisation: "#7C3AED",
  tache:          "#FBBF24",
  autre:          "#94A3B8",
  action:         "#34D399",
}

const ALL_FILTER_TYPES: CalendarEvent["type"][] = ["rdv", "tache", "automatisation"]

const JOURS  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MOIS   = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

// ─── Helpers date ─────────────────────────────────────────────────────────────

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function todayIso() { return isoDate(new Date()) }
function mondayOf(d: Date) {
  const day  = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const r    = new Date(d)
  r.setDate(d.getDate() + diff)
  return r
}
function buildCalendarDays(month: Date): Date[] {
  const first = startOfMonth(month)
  const last  = endOfMonth(month)
  const start = mondayOf(first)
  const end   = new Date(mondayOf(last))
  end.setDate(end.getDate() + 6)
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

function eventToFormData(ev: CalendarEvent): Partial<EventFormData> {
  const start = new Date(ev.startAt)
  const end   = new Date(ev.endAt)
  const pad2  = (n: number) => String(n).padStart(2, "0")
  return {
    title:     ev.title,
    type:      ev.type === "action" ? "autre" : ev.type,
    startDate: isoDate(start),
    startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    endDate:   isoDate(end),
    endTime:   `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    allDay:    ev.allDay,
    location:  ev.location ?? "",
    notes:     ev.description ?? "",
    color:     ev.color,
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, flex:1 }}>
      {Array.from({length:35}).map((_,i) => (
        <div key={i} style={{
          borderRadius:10,
          background:"rgba(255,255,255,0.03)",
          animation:"cal-pulse 1.6s ease-in-out infinite",
          animationDelay:`${(i%7)*60}ms`,
        }} />
      ))}
    </div>
  )
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

interface CellProps {
  date: Date
  events: CalendarEvent[]
  inMonth: boolean
  isToday: boolean
  selected: boolean
  onSelect: () => void
  onAdd: () => void
}

function DayCell({ date, events, inMonth, isToday, selected, onSelect, onAdd }: CellProps) {
  const [hov, setHov] = useState(false)
  const MAX = 3

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect() } }}
      aria-label={`${date.toLocaleDateString("fr-FR")}${events.length ? `, ${events.length} événement${events.length>1?"s":""}` : ""}`}
      aria-pressed={selected}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"relative",
        display:"flex",
        flexDirection:"column",
        padding:"8px 9px 6px",
        borderRadius:12,
        border:`1px solid ${
          isToday   ? `${C_TODAY}60`
          : selected ? "rgba(255,255,255,0.18)"
          : hov      ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.055)"
        }`,
        background: isToday
          ? `rgba(232,111,77,0.07)`
          : selected
          ? "rgba(255,255,255,0.05)"
          : hov
          ? "rgba(255,255,255,0.035)"
          : inMonth
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        cursor:"pointer",
        textAlign:"left",
        transition:"background 120ms, border-color 120ms",
        outline:"none",
        overflow:"hidden",
        minHeight:0,
      }}
    >
      {/* Numéro */}
      <span style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:24, height:24, borderRadius:"50%",
        fontSize:12,
        fontWeight: isToday ? 700 : inMonth ? 500 : 400,
        color: isToday ? "#fff" : inMonth ? "rgba(250,250,250,0.82)" : "rgba(250,250,250,0.22)",
        background: isToday ? C_TODAY : "transparent",
        flexShrink:0, letterSpacing:"-0.01em", marginBottom:4,
      }}>
        {date.getDate()}
      </span>

      {/* Bouton + sur hover */}
      {hov && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onAdd() }}
          aria-label="Ajouter un événement"
          style={{
            position:"absolute", top:6, right:6,
            width:20, height:20, borderRadius:5,
            background:"rgba(232,111,77,0.18)", border:"1px solid rgba(232,111,77,0.35)",
            color:C_TODAY, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          <Plus size={11} />
        </button>
      )}

      {/* Événements */}
      <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1, minHeight:0, overflow:"hidden" }}>
        {events.slice(0, MAX).map(ev => (
          <span key={ev.id} style={{
            display:"flex", alignItems:"center", gap:4,
            fontSize:10, fontWeight:500, color:"rgba(250,250,250,0.82)",
            lineHeight:1.3, overflow:"hidden", flexShrink:0,
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%", background:ev.color, flexShrink:0,
              boxShadow:`0 0 5px ${ev.color}80`,
            }} />
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
              {ev.time && <span style={{color:ev.color, marginRight:2, fontVariantNumeric:"tabular-nums"}}>{ev.time}</span>}
              {ev.title}
            </span>
          </span>
        ))}
        {events.length > MAX && (
          <span style={{ fontSize:10, color:"rgba(250,250,250,0.35)", paddingLeft:9, lineHeight:1.3 }}>
            +{events.length - MAX} autre{events.length-MAX>1?"s":""}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Side panel ───────────────────────────────────────────────────────────────

function SidePanel({
  date, events, onClose, onEventClick, onAdd,
}: {
  date: Date|null
  events: CalendarEvent[]
  onClose: () => void
  onEventClick: (ev: CalendarEvent) => void
  onAdd: () => void
}) {
  if (!date) return null
  const label = date.toLocaleDateString("fr-FR",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })

  return (
    <div
      role="dialog"
      aria-label={`Événements du ${label}`}
      style={{
        width:"clamp(280px,28vw,340px)", flexShrink:0,
        background:"rgba(14,14,20,0.94)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        borderLeft:"1px solid rgba(255,255,255,0.08)",
        display:"flex", flexDirection:"column",
        animation:"slideInRight 200ms cubic-bezier(0.32,0.72,0,1) both",
      }}
    >
      {/* En-tête panel */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"18px 18px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        flexShrink:0,
      }}>
        <div>
          <p style={{ fontSize:11, color:"rgba(250,250,250,0.4)", margin:"0 0 2px", textTransform:"capitalize", letterSpacing:"0.01em" }}>
            {label}
          </p>
          <p style={{ fontSize:15, fontWeight:700, color:"#FAFAFA", margin:0, letterSpacing:"-0.01em" }}>
            {events.length===0 ? "Aucun événement" : `${events.length} événement${events.length>1?"s":""}`}
          </p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button type="button" onClick={onAdd} aria-label="Ajouter un événement" style={{
            background:"rgba(232,111,77,0.12)", border:"1px solid rgba(232,111,77,0.28)",
            borderRadius:8, padding:7, cursor:"pointer", color:C_TODAY,
            display:"flex", alignItems:"center", transition:"background 120ms",
          }}>
            <Plus size={14} />
          </button>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:8, padding:7, cursor:"pointer", color:"rgba(250,250,250,0.55)",
            display:"flex", alignItems:"center", transition:"background 120ms",
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Liste événements */}
      <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:8 }}>
        {events.length===0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 16px", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:20 }}>📅</span>
            </div>
            <p style={{ fontSize:13, color:"rgba(250,250,250,0.3)", margin:0, textAlign:"center" }}>
              Rien de planifié ce jour
            </p>
            <button type="button" onClick={onAdd} style={{
              padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600,
              background:"rgba(232,111,77,0.12)", border:"1px solid rgba(232,111,77,0.28)",
              color:C_TODAY, cursor:"pointer",
            }}>
              + Ajouter
            </button>
          </div>
        ) : (
          [...events].sort((a,b)=>(a.time??"00:00")>(b.time??"00:00")?1:-1).map(ev => {
            const editable = ev.source === "calendar_events"
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => editable ? onEventClick(ev) : undefined}
                disabled={!editable}
                style={{
                  background:`${ev.color}0d`,
                  border:`1px solid ${ev.color}28`,
                  borderLeft:`3px solid ${ev.color}`,
                  borderRadius:10, padding:"10px 12px",
                  display:"flex", gap:10, alignItems:"flex-start",
                  textAlign:"left", cursor:editable?"pointer":"default",
                  transition:"background 120ms", width:"100%",
                }}
              >
                {ev.agentSlug && (
                  <div style={{ flexShrink:0, marginTop:1 }}>
                    <AgentAvatar slug={ev.agentSlug} size={26} />
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{
                      fontSize:9, fontWeight:700, letterSpacing:"0.07em",
                      color:ev.color, background:`${ev.color}20`,
                      borderRadius:4, padding:"2px 6px", textTransform:"uppercase",
                    }}>
                      {TYPE_LABELS[ev.type] ?? ev.type}
                    </span>
                    {ev.time && (
                      <span style={{ fontSize:11, color:"rgba(250,250,250,0.4)", fontVariantNumeric:"tabular-nums" }}>
                        {ev.time}
                      </span>
                    )}
                    {editable && (
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginLeft:"auto" }}>modifier →</span>
                    )}
                  </div>
                  <p style={{
                    fontSize:13, fontWeight:600, color:"#FAFAFA",
                    margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>
                    {ev.title}
                  </p>
                  {ev.location && (
                    <p style={{ fontSize:11, color:"rgba(250,250,250,0.38)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      📍 {ev.location}
                    </p>
                  )}
                  {ev.description && !ev.location && (
                    <p style={{ fontSize:11, color:"rgba(250,250,250,0.35)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {ev.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Types modal ──────────────────────────────────────────────────────────────

interface ModalState {
  mode: "create" | "edit"
  date?: Date
  event?: CalendarEvent
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendrierPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [events,       setEvents]       = useState<CalendarEvent[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string|null>(null)
  const [activeTypes,  setActiveTypes]  = useState<Set<CalendarEvent["type"]>>(
    new Set<CalendarEvent["type"]>(["rdv","tache","automatisation"])
  )
  const [selectedDate, setSelectedDate] = useState<Date|null>(null)
  const [modal,        setModal]        = useState<ModalState|null>(null)
  const [syncing,      setSyncing]      = useState(false)
  const [syncMsg,      setSyncMsg]      = useState<string|null>(null)

  const fetchEvents = useCallback((month: Date) => {
    setLoading(true); setError(null)
    const from = isoDate(startOfMonth(month))
    const to   = isoDate(endOfMonth(month))
    fetch(`/api/calendar/events?from=${from}&to=${to}`)
      .then(r => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json() as Promise<{events:CalendarEvent[]}> })
      .then(d  => setEvents(d.events ?? []))
      .catch(e  => { setError(e instanceof Error ? e.message : "Erreur"); setEvents([]) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEvents(currentMonth) }, [currentMonth, fetchEvents])

  const calDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth])

  const byDate = useMemo(() => {
    const map = new Map<string,CalendarEvent[]>()
    for (const ev of events) {
      if (!activeTypes.has(ev.type)) continue
      const arr = map.get(ev.date) ?? []; arr.push(ev); map.set(ev.date, arr)
    }
    return map
  }, [events, activeTypes])

  const selectedEvents = useMemo(() =>
    selectedDate ? (byDate.get(isoDate(selectedDate)) ?? []) : []
  , [selectedDate, byDate])

  const today = todayIso()
  const monthLabel = `${MOIS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  function goMonth(d: number) { setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+d, 1)); setSelectedDate(null) }

  function toggleType(t: CalendarEvent["type"]) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) { if (next.size===1) return prev; next.delete(t) } else next.add(t)
      return next
    })
  }

  function openCreate(date?: Date) {
    setModal({ mode: "create", date: date ?? selectedDate ?? new Date() })
  }
  function openEdit(ev: CalendarEvent) {
    setModal({ mode: "edit", event: ev })
  }

  async function handleSave(form: EventFormData) {
    const startAt = new Date(`${form.startDate}T${form.allDay ? "00:00" : form.startTime}:00`).toISOString()
    const endAt   = new Date(`${form.endDate}T${form.allDay ? "23:59" : form.endTime}:59`).toISOString()

    const payload = {
      title:       form.title,
      description: form.notes  || null,
      startAt, endAt,
      allDay:      form.allDay,
      type:        form.type,
      color:       form.color,
      location:    form.location || null,
    }

    if (modal?.mode === "edit" && modal.event) {
      const id = modal.event.recordId ?? modal.event.id
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Erreur lors de la modification")
    } else {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Erreur lors de la création")
    }

    setModal(null)
    fetchEvents(currentMonth)
  }

  async function handleDelete() {
    if (!modal?.event) return
    const id  = modal.event.recordId ?? modal.event.id
    const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Erreur lors de la suppression")
    setModal(null)
    fetchEvents(currentMonth)
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    try {
      const res  = await fetch("/api/calendar/sync", { method: "POST" })
      const data = await res.json() as { imported?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Erreur sync")
      const n = data.imported ?? 0
      setSyncMsg(`${n} événement${n>1?"s":""} importé${n>1?"s":""}`)
      fetchEvents(currentMonth)
    } catch(e) {
      setSyncMsg(e instanceof Error ? e.message : "Erreur sync")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100%", minHeight:0, overflow:"hidden",
    }}>
      <style>{`
        @keyframes cal-pulse  { 0%,100%{opacity:.4} 50%{opacity:.15} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"18px 24px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        flexShrink:0, gap:12, flexWrap:"wrap",
      }}>

        {/* Navigation mois */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <button type="button" onClick={()=>goMonth(-1)} aria-label="Mois précédent" style={{
            width:34, height:34, borderRadius:9,
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
            color:"rgba(250,250,250,0.65)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background 120ms",
          }}>
            <ChevronLeft size={15} />
          </button>

          <span aria-live="polite" style={{
            fontSize:16, fontWeight:700, color:"#FAFAFA",
            letterSpacing:"-0.02em", minWidth:168, textAlign:"center", padding:"0 8px",
          }}>
            {monthLabel}
          </span>

          <button type="button" onClick={()=>goMonth(1)} aria-label="Mois suivant" style={{
            width:34, height:34, borderRadius:9,
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
            color:"rgba(250,250,250,0.65)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background 120ms",
          }}>
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            onClick={()=>{ setCurrentMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1)); setSelectedDate(null) }}
            style={{
              marginLeft:6, height:34, padding:"0 12px", borderRadius:9,
              background:"rgba(232,111,77,0.12)", border:"1px solid rgba(232,111,77,0.28)",
              color:C_TODAY, fontSize:12, fontWeight:600, cursor:"pointer", letterSpacing:"0.01em",
              transition:"background 120ms",
            }}>
            Aujourd&apos;hui
          </button>
        </div>

        {/* Filtres + actions */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          {ALL_FILTER_TYPES.map(t => {
            const on  = activeTypes.has(t)
            const col = TYPE_COLORS[t] ?? "#94A3B8"
            return (
              <button key={t} type="button" onClick={()=>toggleType(t)} aria-pressed={on} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 13px", borderRadius:999, height:34,
                fontSize:12, fontWeight:600,
                color: on ? col : "rgba(250,250,250,0.4)",
                background: on ? `${col}15` : "rgba(255,255,255,0.04)",
                border:`1px solid ${on ? `${col}50` : "rgba(255,255,255,0.07)"}`,
                cursor:"pointer", transition:"all 150ms",
              }}>
                <span style={{
                  width:7, height:7, borderRadius:"50%", background:col,
                  opacity:on?1:0.3, flexShrink:0,
                  boxShadow:on?`0 0 6px ${col}80`:"none",
                }} />
                {TYPE_LABELS[t]}
              </button>
            )
          })}

          <div style={{ width:1, height:20, background:"rgba(255,255,255,0.08)", margin:"0 4px" }} />

          {/* Bouton sync Google Calendar */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            title="Synchroniser Google Calendar"
            style={{
              height:34, padding:"0 12px", borderRadius:9,
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
              color: syncMsg ? "#34D399" : syncing ? "rgba(250,250,250,0.3)" : "rgba(250,250,250,0.65)",
              fontSize:12, fontWeight:600, cursor:syncing?"not-allowed":"pointer",
              display:"flex", alignItems:"center", gap:6, transition:"color 200ms",
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: syncing ? "spin 1s linear infinite" : "none" } as React.CSSProperties}
            />
            {syncMsg ?? "Sync Google"}
          </button>

          {/* Bouton nouveau */}
          <button
            type="button"
            onClick={() => openCreate()}
            style={{
              height:34, padding:"0 14px", borderRadius:9,
              background:"rgba(232,111,77,0.15)", border:"1px solid rgba(232,111,77,0.4)",
              color:C_TODAY, fontSize:12, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6, transition:"all 150ms",
            }}
          >
            <Plus size={14} />
            Nouveau
          </button>
        </div>
      </div>

      {/* ── Corps — grille + panel latéral ─────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, minHeight:0, overflow:"hidden" }}>

        {/* Grille calendrier */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          padding:"14px 16px 16px", minHeight:0, overflow:"hidden",
        }}>

          {/* En-têtes jours */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2,
            marginBottom:4, flexShrink:0,
          }}>
            {JOURS.map(j => (
              <div key={j} style={{
                textAlign:"center", fontSize:11, fontWeight:700,
                color:"rgba(250,250,250,0.35)", letterSpacing:"0.06em",
                padding:"0 0 8px", textTransform:"uppercase",
              }}>
                {j}
              </div>
            ))}
          </div>

          {/* Grille jours */}
          {loading ? <Skeleton /> : error ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
              <p style={{ color:"rgba(250,250,250,0.4)", fontSize:14 }}>{error}</p>
              <button type="button" onClick={()=>fetchEvents(currentMonth)} style={{
                padding:"8px 16px", borderRadius:8,
                background:"rgba(232,111,77,0.12)", border:"1px solid rgba(232,111,77,0.28)",
                color:C_TODAY, fontSize:13, cursor:"pointer",
              }}>Réessayer</button>
            </div>
          ) : (
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(7,1fr)",
              gridTemplateRows:`repeat(${calDays.length/7},1fr)`,
              gap:2, flex:1, minHeight:0,
            }}>
              {calDays.map(day => {
                const key   = isoDate(day)
                const evs   = byDate.get(key) ?? []
                const inMon = day.getMonth() === currentMonth.getMonth()
                const isTod = key === today
                const isSel = selectedDate ? isoDate(selectedDate) === key : false
                return (
                  <DayCell
                    key={key}
                    date={day}
                    events={evs}
                    inMonth={inMon}
                    isToday={isTod}
                    selected={isSel}
                    onSelect={() => setSelectedDate(isSel ? null : day)}
                    onAdd={() => { setSelectedDate(day); openCreate(day) }}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        {selectedDate && (
          <SidePanel
            date={selectedDate}
            events={selectedEvents}
            onClose={() => setSelectedDate(null)}
            onEventClick={openEdit}
            onAdd={() => openCreate(selectedDate)}
          />
        )}
      </div>

      {/* ── Modal création / édition ────────────────────────────────────────── */}
      {modal && (
        <EventModal
          mode={modal.mode}
          initialDate={modal.date}
          initialData={modal.event ? eventToFormData(modal.event) : undefined}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
