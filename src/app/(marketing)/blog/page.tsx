import type { Metadata } from "next"
import { BlogClient } from "./_components/BlogClient"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog — Lynaris",
  description: "Insights IA, automatisation, agents",
  openGraph: {
    title: "Blog — Lynaris",
    description: "Insights IA, automatisation, agents",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

export default function BlogPage() {
  return <BlogClient />
}
