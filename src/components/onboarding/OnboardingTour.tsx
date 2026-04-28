"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface OnboardingStatus {
  completed: boolean
  currentStep: number
  skipped: boolean
}

const STEPS: { element?: string; title: string; description: string; onNav?: string }[] = [
  {
    title: "👋 Bienvenue sur Lynaris !",
    description:
      "Lynaris est votre équipe d'agents IA pour automatiser votre business. En 2 minutes, on vous montre l'essentiel.",
  },
  {
    element: "[data-tour='sidebar-home']",
    title: "Votre tableau de bord",
    description:
      "Retrouvez ici un résumé de l'activité de vos agents, vos statistiques clés et les actions en cours.",
  },
  {
    element: "[data-tour='sidebar-assistants']",
    title: "🤖 Vos 9 assistants IA",
    description:
      "Marine pour les appels, Lou pour le contenu, Mae pour les emails… Chaque agent est spécialisé dans un domaine précis.",
    onNav: "/dashboard/agents",
  },
  {
    element: "[data-tour='sidebar-superpowers']",
    title: "⚡ Compétences",
    description:
      "Activez des capacités avancées pour vos agents : SMS, WhatsApp, intégrations CRM, et bien plus.",
  },
  {
    element: "[data-tour='sidebar-integrations']",
    title: "🔌 Intégrations",
    description:
      "Connectez vos outils : Gmail, Google Calendar, Notion, Stripe… Vos agents y accèdent automatiquement.",
  },
  {
    element: "[data-tour='sidebar-contents']",
    title: "📝 Espace Contenus",
    description:
      "Tout ce que vos agents produisent (posts, emails, articles, visuels) est centralisé ici. Votre mémoire d'équipe.",
    onNav: "/dashboard/contenus",
  },
  {
    element: "[data-tour='contents-filters']",
    title: "Filtrez vos contenus",
    description:
      "Triez par type (posts, articles, emails) ou par agent pour retrouver rapidement ce que vous cherchez.",
  },
  {
    element: "[data-tour='sidebar-documents']",
    title: "📁 Vos documents",
    description:
      "Importez vos PDFs, fiches produits, FAQ… Vos agents puisent dans ces documents pour répondre à vos clients.",
    onNav: "/dashboard",
  },
  {
    element: "[data-tour='help-menu']",
    title: "💬 Besoin d'aide ?",
    description:
      "Accédez au support ou refaites ce tour à tout moment depuis ce menu.",
  },
  {
    title: "🎉 C'est parti !",
    description:
      // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
      "Pour bien démarrer :\n\n1️⃣ Discutez avec Marine pour configurer votre premier appel\n2️⃣ Connectez votre Gmail dans Intégrations\n3️⃣ Explorez l'équipe IA dans la section Agents IA\n\nBon usage de Lynaris !",
  },
]

export function OnboardingTour({ status }: { status: OnboardingStatus }) {
  const router = useRouter()
  const driverRef = useRef<import("driver.js").Driver | null>(null)
  const stepRef = useRef(status.currentStep)

  useEffect(() => {
    if (status.completed || status.skipped) return

    let mounted = true

    async function init() {
      const { driver } = await import("driver.js")
      await import("driver.js/dist/driver.css")

      if (!mounted) return

      const drv = driver({
        showProgress: true,
        progressText: "Étape {{current}} sur {{total}}",
        nextBtnText: "Suivant →",
        prevBtnText: "← Précédent",
        doneBtnText: "Terminer",
        showButtons: ["next", "previous", "close"],
        allowClose: true,
        smoothScroll: true,
        onHighlightStarted: (_el, _step, opts) => {
          const idx = (opts as { state?: { activeIndex?: number } }).state?.activeIndex ?? 0
          stepRef.current = idx
          void fetch("/api/onboarding/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: idx }),
          })
          const step = STEPS[idx]
          if (step?.onNav) {
            void new Promise<void>((r) => setTimeout(r, 80)).then(() => router.push(step.onNav!))
          }
        },
        onCloseClick: () => {
          void fetch("/api/onboarding/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skipped: true }),
          })
          drv.destroy()
        },
        onDestroyStarted: () => {
          if (drv.isLastStep()) {
            void fetch("/api/onboarding/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skipped: false }),
            })
          }
          drv.destroy()
        },
        steps: STEPS.map((s) => ({
          element: s.element,
          popover: {
            title: s.title,
            description: s.description.replace(/\n/g, "<br/>"),
            side: s.element ? "right" : "over",
          },
        })),
      })

      driverRef.current = drv
      drv.drive(Math.max(0, status.currentStep))
    }

    void init()

    return () => {
      mounted = false
      driverRef.current?.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
