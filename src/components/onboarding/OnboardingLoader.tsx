"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

interface OnboardingStatus {
  completed: boolean
  currentStep: number
  skipped: boolean
}

// Lazy-load le tour — driver.js n'est chargé que pour les users qui en ont besoin
const OnboardingTour = dynamic(
  () => import("./OnboardingTour").then((m) => ({ default: m.OnboardingTour })),
  { ssr: false }
)

export function OnboardingLoader() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)

  useEffect(() => {
    fetch("/api/onboarding/status")
      .then((r) => r.json())
      .then((d: OnboardingStatus) => setStatus(d))
      .catch(() => {})
  }, [])

  // Pas encore chargé, ou déjà terminé/sauté → rien à afficher
  if (!status || status.completed || status.skipped) return null

  return <OnboardingTour status={status} />
}
