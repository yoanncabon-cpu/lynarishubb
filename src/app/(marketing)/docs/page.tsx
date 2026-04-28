import type { Metadata } from "next"
import { DocsClient } from "./_components/DocsClient"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Documentation — Lynaris",
  description: "Guide complet pour démarrer avec Lynaris — agents, intégrations, API et webhooks.",
}

export default function DocsPage() {
  return <DocsClient />
}
