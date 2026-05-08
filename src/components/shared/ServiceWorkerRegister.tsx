"use client"

import { useEffect } from "react"
import { logger } from "@/lib/logger"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(err => {
      logger.warn("[SW] Enregistrement échoué", { err: String(err) })
    })
  }, [])
  return null
}
