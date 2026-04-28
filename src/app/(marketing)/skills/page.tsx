import type { Metadata } from "next"
import { SkillsClient } from "./_components/SkillsClient"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Compétences & Outils — Lynaris",
  description:
    "Outils natifs, intégrations et modèles IA : découvrez les capacités détaillées de chaque agent Lynaris.",
}

export default function SkillsPage() {
  return <SkillsClient />
}
