import type { Metadata } from "next"
import dynamic from "next/dynamic"

export const revalidate = 3600

const CalculatorClient = dynamic(
  () => import("./_components/CalculatorClient").then(m => ({ default: m.CalculatorClient }))
)

export const metadata: Metadata = {
  title: "Calculateur ROI agent vocal — Lynaris",
  description: "Estimez en quelques secondes combien un agent vocal IA vous ferait économiser chaque mois par rapport à un secrétaire.",
  openGraph: {
    title: "Calculateur ROI agent vocal — Lynaris",
    description: "Estimez en quelques secondes combien un agent vocal IA vous ferait économiser chaque mois par rapport à un secrétaire.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

export default function CalculateurPage() {
  return <CalculatorClient />
}
