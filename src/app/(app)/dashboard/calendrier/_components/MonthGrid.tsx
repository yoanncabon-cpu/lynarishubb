"use client"

import React, { useState } from "react"
import type { CalendarEvent } from "@/app/api/calendar/events/route"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C_TODAY = "#E86F4D"
const JOURS   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthGridProps {
  days: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  currentMonth: Date
  today: string
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onCreateOnDate: (date: Date) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface CellProps {
  date: Date
  events: CalendarEvent[]
  inMonth: boolean
  isToday: boolean
  selected: boolean
  onSelect: () => void
  onEventClick: (ev: CalendarEvent) => void
  onDoubleClick: () => void
}

function DayCell({ date, events, inMonth, isToday, selected, onSelect, onEventClick, onDoubleClick }: CellProps) {
  const [hov, setHov] = useState(false)
  const MAX = 3

  return (
    <div
      role="gridcell"
      aria-label={`${date.toLocaleDateString("fr-FR")}${events.length ? `, ${events.length} événement${events.length > 1 ? "s" : ""}` : ""}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "8px 9px 6px",
        borderRadius: 12,
        border: `1px solid ${
          isToday    ? `${C_TODAY}60`
          : selected ? "rgba(255,255,255,0.18)"
          : hov      ? `${C_TODAY}30`
          : "rgba(255,255,255,0.055)"
        }`,
        background: isToday
          ? "rgba(232,111,77,0.07)"
          : selected
          ? "rgba(255,255,255,0.05)"
          : hov
          ? "rgba(255,255,255,0.03)"
          : inMonth
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        cursor: "pointer",
        transition: "background 120ms, border-color 120ms",
        overflow: "hidden",
        minHeight: 0,
        boxShadow: hov && inMonth ? `0 0 0 1px ${C_TODAY}20` : "none",
      }}
    >
      {/* Numéro */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24, height: 24,
        borderRadius: "50%",
        fontSize: 12,
        fontWeight: isToday ? 700 : inMonth ? 500 : 400,
        color: isToday ? "#fff"
             : inMonth ? "rgba(250,250,250,0.82)"
             : "rgba(250,250,250,0.22)",
        background: isToday ? C_TODAY : "transparent",
        flexShrink: 0,
        letterSpacing: "-0.01em",
        marginBottom: 4,
      }}>
        {date.getDate()}
      </span>

      {/* Événements */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, overflow: "hidden" }}>
        {events.slice(0, MAX).map(ev => (
          <span
            key={ev.id}
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onEventClick(ev) }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onEventClick(ev) } }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(250,250,250,0.82)",
              lineHeight: 1.3,
              overflow: "hidden",
              flexShrink: 0,
              borderRadius: 4,
              padding: "1px 3px",
              background: "rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
          >
            <span style={{
              width: 5, height: 5,
              borderRadius: "50%",
              background: ev.color,
              flexShrink: 0,
              boxShadow: `0 0 5px ${ev.color}80`,
            }} />
            <span style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}>
              {ev.time && (
                <span style={{ color: ev.color, marginRight: 2, fontVariantNumeric: "tabular-nums" }}>
                  {ev.time}
                </span>
              )}
              {ev.title}
            </span>
          </span>
        ))}
        {events.length > MAX && (
          <span style={{
            fontSize: 10,
            color: "rgba(250,250,250,0.35)",
            paddingLeft: 9,
            lineHeight: 1.3,
          }}>
            +{events.length - MAX} autre{events.length - MAX > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MonthSkeleton({ rows }: { rows: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, flex: 1 }}>
      {Array.from({ length: rows * 7 }).map((_, i) => (
        <div key={i} style={{
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          animation: "cal-pulse 1.6s ease-in-out infinite",
          animationDelay: `${(i % 7) * 60}ms`,
        }} />
      ))}
    </div>
  )
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

export function MonthGrid({
  days,
  eventsByDate,
  currentMonth,
  today,
  selectedDate,
  onSelectDate,
  onEventClick,
  onCreateOnDate,
}: MonthGridProps) {
  if (days.length === 0) return <MonthSkeleton rows={5} />

  const rows = days.length / 7

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* En-têtes jours */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2,
        marginBottom: 4, flexShrink: 0,
      }}>
        {JOURS.map(j => (
          <div key={j} style={{
            textAlign: "center", fontSize: 11, fontWeight: 700,
            color: "rgba(250,250,250,0.35)", letterSpacing: "0.06em",
            padding: "0 0 8px", textTransform: "uppercase",
          }}>
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div role="grid" aria-label="Calendrier mensuel" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7,1fr)",
        gridTemplateRows: `repeat(${rows},1fr)`,
        gap: 2,
        flex: 1,
        minHeight: 0,
      }}>
        {days.map(day => {
          const key   = isoDate(day)
          const evs   = eventsByDate.get(key) ?? []
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
              onSelect={() => onSelectDate(day)}
              onEventClick={onEventClick}
              onDoubleClick={() => onCreateOnDate(day)}
            />
          )
        })}
      </div>
    </div>
  )
}
