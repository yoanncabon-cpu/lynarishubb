"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ACCENT = "#E86F4D"
const JOURS  = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
const MOIS   = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function todayIso() { return isoDate(new Date()) }

function mondayOf(d: Date) {
  const day  = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const r    = new Date(d)
  r.setDate(d.getDate() + diff)
  return r
}

function buildDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last  = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = mondayOf(first)
  const end   = new Date(mondayOf(last))
  end.setDate(end.getDate() + 6)
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

function displayDate(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DatePickerPopoverProps {
  value: string          // "YYYY-MM-DD" ou ""
  onChange: (v: string) => void
  placeholder?: string
  clearable?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DatePickerPopover({ value, onChange, placeholder = "Choisir une date", clearable = false }: DatePickerPopoverProps) {
  const today = todayIso()
  const initMonth = value
    ? new Date(value + "T00:00:00")
    : new Date()
  const [month,   setMonth]   = useState(() => new Date(initMonth.getFullYear(), initMonth.getMonth(), 1))
  const [open,    setOpen]    = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  const days = buildDays(month)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const goMonth = useCallback((d: number) => {
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + d, 1))
  }, [])

  function select(day: Date) {
    onChange(isoDate(day))
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? `${ACCENT}50` : "rgba(255,255,255,0.09)"}`,
          borderRadius: 10,
          color: value ? "#FAFAFA" : "rgba(250,250,250,0.3)",
          fontSize: 13,
          fontWeight: value ? 500 : 400,
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 150ms",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      >
        <Calendar size={14} style={{ color: value ? ACCENT : "rgba(250,250,250,0.3)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value ? displayDate(value) : placeholder}</span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange("") }}
            onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onChange("") } }}
            style={{
              fontSize: 11, color: "rgba(250,250,250,0.35)", cursor: "pointer",
              padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)",
            }}
          >
            Effacer
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 9999,
          background: "rgba(14,14,22,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "12px 10px 10px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
          width: 230,
          animation: "dpFadeIn 130ms ease-out both",
        }}>
          <style>{`@keyframes dpFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:none } }`}</style>

          {/* Navigation mois */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
            <button type="button" onClick={() => goMonth(-1)} aria-label="Mois précédent" style={{
              width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", color: "rgba(250,250,250,0.55)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", letterSpacing: "-0.01em" }}>
              {MOIS[month.getMonth()]} {month.getFullYear()}
            </span>
            <button type="button" onClick={() => goMonth(1)} aria-label="Mois suivant" style={{
              width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", color: "rgba(250,250,250,0.55)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* En-têtes jours */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
            {JOURS.map(j => (
              <div key={j} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "rgba(250,250,250,0.3)", letterSpacing: "0.05em", padding: "0 0 5px" }}>
                {j}
              </div>
            ))}
          </div>

          {/* Grille jours */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {days.map(day => {
              const key    = isoDate(day)
              const inMon  = day.getMonth() === month.getMonth()
              const isTod  = key === today
              const isSel  = key === value
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(day)}
                  aria-label={day.toLocaleDateString("fr-FR")}
                  aria-pressed={isSel}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 6,
                    border: isTod && !isSel ? `1px solid ${ACCENT}50` : "1px solid transparent",
                    background: isSel
                      ? ACCENT
                      : isTod
                      ? `${ACCENT}15`
                      : "transparent",
                    color: isSel
                      ? "#fff"
                      : isTod
                      ? ACCENT
                      : inMon
                      ? "rgba(250,250,250,0.8)"
                      : "rgba(250,250,250,0.18)",
                    fontSize: 11,
                    fontWeight: isSel || isTod ? 700 : 400,
                    cursor: "pointer",
                    transition: "background 100ms",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer Aujourd'hui */}
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => select(new Date())}
              style={{
                fontSize: 11, fontWeight: 600, color: ACCENT,
                background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`,
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
              }}
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
