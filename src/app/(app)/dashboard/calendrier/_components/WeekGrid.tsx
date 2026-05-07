"use client"

import React, { useRef, useEffect, useState } from "react"
import type { CalendarEvent } from "@/app/api/calendar/events/route"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C_TODAY = "#E86F4D"
const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

// ─── Constantes grille ────────────────────────────────────────────────────────

const HOUR_START  = 7   // 07:00
const HOUR_END    = 23  // 23:00 (exclu)
const TOTAL_HOURS = HOUR_END - HOUR_START // 16
const HOUR_HEIGHT = 64  // px par heure

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekGridProps {
  weekDays: Date[]            // 7 jours lun → dim
  eventsByDate: Map<string, CalendarEvent[]>
  today: string
  onEventClick: (event: CalendarEvent) => void
  onCreateAtSlot: (date: Date, hour: number, minute: number) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function pad2(n: number) { return String(n).padStart(2, "0") }

// Positionne un événement dans la grille (retourne top % et height en px)
function getEventPos(ev: CalendarEvent): { top: number; height: number } | null {
  if (!ev.time) {
    return { top: 0, height: HOUR_HEIGHT * 0.5 }
  }
  const [hStr, mStr] = ev.time.split(":")
  const h = parseInt(hStr ?? "0", 10)
  const m = parseInt(mStr ?? "0", 10)
  if (h < HOUR_START || h >= HOUR_END) return null
  const top    = (h - HOUR_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
  const height = HOUR_HEIGHT * 0.75 // durée par défaut 45min
  return { top, height }
}

// ─── Composant heure colonne ──────────────────────────────────────────────────

function HourSlot({ hour }: { hour: number }) {
  return (
    <div style={{
      height: HOUR_HEIGHT,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-end",
      paddingRight: 10,
      paddingTop: 6,
      flexShrink: 0,
      position: "relative",
    }}>
      <span style={{ fontSize: 10, color: "rgba(250,250,250,0.3)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
        {pad2(hour)}:00
      </span>
    </div>
  )
}

// ─── Composant event pill ─────────────────────────────────────────────────────

interface EventPillProps {
  event: CalendarEvent
  top: number
  height: number
  onClick: () => void
}

function EventPill({ event, top, height, onClick }: EventPillProps) {
  const [hov, setHov] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onClick() }}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onClick() } }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={event.title}
      style={{
        position: "absolute",
        top, left: 4, right: 4,
        height: Math.max(height, 22),
        background: `${event.color}22`,
        border: `1px solid ${event.color}55`,
        borderLeft: `3px solid ${event.color}`,
        borderRadius: 7,
        padding: "3px 7px",
        cursor: "pointer",
        overflow: "hidden",
        zIndex: 1,
        transition: "background 120ms, transform 120ms",
        transform: hov ? "scaleX(1.01)" : "scaleX(1)",
        boxShadow: hov ? `0 2px 12px ${event.color}30` : "none",
      }}
    >
      <div style={{
        fontSize: 10, fontWeight: 700, color: event.color,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        lineHeight: 1.3,
      }}>
        {event.time && <span style={{ marginRight: 4, fontVariantNumeric: "tabular-nums" }}>{event.time}</span>}
        {event.title}
      </div>
    </div>
  )
}

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

export function WeekGrid({ weekDays, eventsByDate, today, onEventClick, onCreateAtSlot }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isCurrentWeek = weekDays.some(d => isoDate(d) === today)

  // Scroll vers l'heure actuelle au mount
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const h   = now.getHours()
    const m   = now.getMinutes()
    if (h >= HOUR_START && h < HOUR_END) {
      const scrollTo = (h - HOUR_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT - 120
      scrollRef.current.scrollTop = Math.max(0, scrollTo)
    }
  }, [])

  // Ligne "maintenant"
  const nowPos = (() => {
    if (!isCurrentWeek) return null
    const now = new Date()
    const h = now.getHours(), m = now.getMinutes()
    if (h < HOUR_START || h >= HOUR_END) return null
    return (h - HOUR_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
  })()

  // Colonne du jour courant
  const todayColIndex = weekDays.findIndex(d => isoDate(d) === today)

  function handleSlotClick(day: Date, hour: number, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relY = e.clientY - rect.top
    const minute = Math.floor((relY / HOUR_HEIGHT) * 60)
    onCreateAtSlot(day, hour, Math.min(minute, 59))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

      {/* Header jours */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `52px repeat(${weekDays.length}, 1fr)`,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
        background: "rgba(14,14,22,0.8)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ padding: "10px 0", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(250,250,250,0.2)", letterSpacing: "0.04em" }}>UTC</span>
        </div>
        {weekDays.map((day, i) => {
          const key     = isoDate(day)
          const isTod   = key === today
          const dayName = JOURS_COURT[day.getDay()] ?? ""
          const evCount = (eventsByDate.get(key) ?? []).length
          return (
            <div key={key} style={{
              padding: "8px 4px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: isTod ? C_TODAY : "rgba(250,250,250,0.35)",
                letterSpacing: "0.07em", textTransform: "uppercase",
              }}>
                {dayName}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: isTod ? C_TODAY : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isTod ? `0 0 14px ${C_TODAY}50` : "none",
              }}>
                <span style={{
                  fontSize: 15, fontWeight: isTod ? 800 : 500,
                  color: isTod ? "#fff" : "rgba(250,250,250,0.75)",
                  letterSpacing: "-0.02em",
                }}>
                  {day.getDate()}
                </span>
              </div>
              {evCount > 0 && (
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isTod ? C_TODAY : "rgba(250,250,250,0.3)",
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Grille scroll */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `52px repeat(${weekDays.length}, 1fr)`,
          position: "relative",
        }}>

          {/* Colonne heures */}
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <HourSlot key={i} hour={HOUR_START + i} />
            ))}
          </div>

          {/* Colonnes jours */}
          {weekDays.map((day, colIdx) => {
            const key    = isoDate(day)
            const events = eventsByDate.get(key) ?? []
            const isTodCol = colIdx === todayColIndex

            return (
              <div
                key={key}
                style={{
                  position: "relative",
                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                  background: isTodCol ? "rgba(232,111,77,0.02)" : "transparent",
                }}
              >
                {/* Lignes horizontales heures */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    onClick={e => handleSlotClick(day, HOUR_START + i, e)}
                    style={{
                      height: HOUR_HEIGHT,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
                  />
                ))}

                {/* Events */}
                {events.map(ev => {
                  const pos = getEventPos(ev)
                  if (!pos) return null
                  return (
                    <EventPill
                      key={ev.id}
                      event={ev}
                      top={pos.top}
                      height={pos.height}
                      onClick={() => onEventClick(ev)}
                    />
                  )
                })}

                {/* Ligne maintenant */}
                {nowPos !== null && isTodCol && (
                  <div style={{
                    position: "absolute",
                    top: nowPos,
                    left: 0, right: 0,
                    height: 2,
                    background: C_TODAY,
                    zIndex: 5,
                    pointerEvents: "none",
                  }}>
                    <div style={{
                      position: "absolute",
                      left: -4, top: -4,
                      width: 10, height: 10,
                      borderRadius: "50%",
                      background: C_TODAY,
                      boxShadow: `0 0 8px ${C_TODAY}80`,
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
