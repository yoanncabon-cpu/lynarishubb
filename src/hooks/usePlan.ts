"use client"
import { useContext, useEffect, useState } from "react"
import { getLimits, type PlanId, type PlanLimits } from "@/lib/plans"
import { PlanContext } from "@/providers/PlanProvider"

interface PlanState {
  plan: PlanId
  limits: PlanLimits
  loading: boolean
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext)
  const [plan, setPlan] = useState<PlanId>("trial")
  const [loading, setLoading] = useState<boolean>(ctx === null)

  useEffect(() => {
    // Context fourni par PlanProvider — pas de fetch
    if (ctx !== null) return
    fetch("/api/settings/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => {
        if (d?.plan) {
          // Migration douce : mapping DB → UI 3 plans
          // - "starter" (ancien Essentiel) → mappé "pro"
          // - "scale" (ancien Scale) → mappé "custom" (Sur-mesure)
          // - "trial" → reste "trial" (équivalent technique de "decouverte")
          const normalized =
            d.plan === "starter" ? "pro" :
            d.plan === "scale" ? "custom" :
            d.plan
          setPlan(normalized as PlanId)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ctx])

  if (ctx !== null) return ctx
  return { plan, limits: getLimits(plan), loading }
}
