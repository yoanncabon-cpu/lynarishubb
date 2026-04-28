"use client"

import { useState, useEffect, useCallback } from "react"

export interface Memory {
  id: string
  content: string
  tags: string[]
  importance: 1 | 2 | 3
  created_at: string
}

const LS_KEY = "charles_memories_backup"

function loadLocalMemories(): Memory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Memory[]
  } catch {
    return []
  }
}

function saveLocalMemories(memories: Memory[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memories))
  } catch {
    // storage quota exceeded — ignore
  }
}

export function useCharlesMemory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch memories from API on mount
  useEffect(() => {
    async function fetchMemories() {
      try {
        const res = await fetch("/api/agents/charles/memory")
        if (res.ok) {
          const json = (await res.json()) as { memories: Memory[] }
          if (json.memories.length > 0) {
            setMemories(json.memories)
            saveLocalMemories(json.memories)
            return
          }
        }
      } catch {
        // API unavailable
      }
      // Fallback to localStorage
      setMemories(loadLocalMemories())
    }

    void fetchMemories().finally(() => setLoading(false))
  }, [])

  const addMemory = useCallback(
    async (content: string, tags: string[] = [], importance: 1 | 2 | 3 = 2) => {
      // Optimistic local add
      const optimistic: Memory = {
        id: crypto.randomUUID(),
        content,
        tags,
        importance,
        created_at: new Date().toISOString(),
      }
      const updated = [optimistic, ...memories]
        .sort((a, b) => b.importance - a.importance)
      setMemories(updated)
      saveLocalMemories(updated)

      try {
        const res = await fetch("/api/agents/charles/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, tags, importance }),
        })
        if (res.ok) {
          const json = (await res.json()) as { memory: Memory }
          // Replace optimistic entry with server-assigned record
          setMemories((prev) => {
            const replaced = prev.map((m) =>
              m.id === optimistic.id ? json.memory : m
            )
            saveLocalMemories(replaced)
            return replaced
          })
          return json.memory
        }
      } catch {
        // API unavailable — local copy is enough
      }

      return optimistic
    },
    [memories]
  )

  const deleteMemory = useCallback(async (id: string) => {
    setMemories((prev) => {
      const updated = prev.filter((m) => m.id !== id)
      saveLocalMemories(updated)
      return updated
    })
    try {
      await fetch(`/api/agents/charles/memory?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    } catch {
      // ignore
    }
  }, [])

  const getRelevantMemories = useCallback(
    (query: string): Memory[] => {
      if (!query.trim()) return memories.slice(0, 5)
      const words = query.toLowerCase().split(/\s+/).filter(Boolean)
      return memories
        .filter((m) =>
          words.some(
            (word) =>
              m.content.toLowerCase().includes(word) ||
              m.tags.some((t) => t.toLowerCase().includes(word))
          )
        )
        .slice(0, 5)
    },
    [memories]
  )

  return { memories, loading, addMemory, deleteMemory, getRelevantMemories }
}
