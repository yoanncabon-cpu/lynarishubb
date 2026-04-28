"use client"
import { useEffect, useState, useCallback } from "react"

export interface ActivityEvent {
  type: "activity" | "ping"
  agent?: string
  action?: string
  time?: string
  ts?: number
  payload?: Record<string, unknown> | null
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
        if (data.type === "activity") {
          setActivities((prev) => [data, ...prev].slice(0, 20))
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
