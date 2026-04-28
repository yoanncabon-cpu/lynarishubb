"use client"
import { useEffect, useState, useCallback } from "react"

export interface ActivityEvent {
  type: "activity" | "ping" | "snapshot"
  /** ID unique (depuis actionLogs.id côté DB) — sert à dédupliquer */
  id?: string
  agent?: string
  action?: string
  time?: string
  ts?: number
  payload?: Record<string, unknown> | null
  /** Présent uniquement sur les events de type "snapshot" — liste complète des derniers logs */
  events?: ActivityEvent[]
}

export function useActivityStream() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource("/api/activity/stream")

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as ActivityEvent

        if (data.type === "snapshot" && Array.isArray(data.events)) {
          // Snapshot complet → remplace la liste (élimine les doublons à chaque reconnexion SSE)
          const events = data.events.filter((ev): ev is ActivityEvent => ev.type === "activity")
          setActivities(events.slice(0, 20))
          return
        }

        if (data.type === "activity") {
          setActivities((prev) => {
            // Déduplication par id si dispo, sinon par fingerprint (agent + action + time)
            const key = data.id ?? `${data.agent}:${data.action}:${data.time}`
            const exists = prev.some(
              (p) => (p.id ?? `${p.agent}:${p.action}:${p.time}`) === key
            )
            if (exists) return prev
            return [data, ...prev].slice(0, 20)
          })
        }
      } catch {
        // ignore malformed events
      }
    }

    return () => es.close()
  }, [])

  const clearActivities = useCallback(() => setActivities([]), [])

  return { activities, connected, clearActivities }
}
