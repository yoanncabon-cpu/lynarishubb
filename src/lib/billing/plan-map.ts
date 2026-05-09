import type { PlanId } from "@/lib/pricing/plans"

export type DbPlan = "trial" | "starter" | "pro" | "scale"

// Mapping plan_id UI → enum legacy DB `plan`.
// L'enum `plan` en DB est conservé pour rétrocompat.
// Source de vérité unique — importer ici, ne pas dupliquer.
export const LEGACY_PLAN_MAP: Record<PlanId, DbPlan> = {
  discovery: "trial",
  starter:   "starter",
  pro:       "pro",
  business:  "pro",   // legacy enum n'a pas "business" — fallback
  custom:    "scale",
}
