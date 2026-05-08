"use client"

import * as THREE from "three"

// THREE.Clock deprecated r183+. R3F v9 still uses it internally.
// Supprime le warning via l'API officielle setConsoleFunction (Three.js r183+).
// À importer en tête de chaque fichier qui monte un <Canvas>.
if (typeof window !== "undefined") {
  const threeAny = THREE as unknown as {
    setConsoleFunction?: (fn: (type: string, message: string, ...rest: unknown[]) => void) => void
  }

  threeAny.setConsoleFunction?.((type, message, ...rest) => {
    if (
      type === "warn" &&
      typeof message === "string" &&
      (message.includes("Clock: This module has been deprecated") ||
        message.includes("toNonIndexed(): BufferGeometry is already non-indexed"))
    ) {
      return
    }
    ;(console as unknown as Record<string, (...a: unknown[]) => void>)[type]?.(message, ...rest)
  })
}
