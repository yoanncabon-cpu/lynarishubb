"use client"
import React, { createContext } from "react"
import { getLimits, type PlanId, type PlanLimits } from "@/lib/plans"

interface PlanContextValue {
  plan: PlanId
  limits: PlanLimits
  loading: boolean
}

export const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({
  plan,
  children,
}: {
  plan: PlanId
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ plan, limits: getLimits(plan), loading: false }),
    [plan]
  )
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
