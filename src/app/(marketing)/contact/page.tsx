import type { Metadata } from "next"
import ContactForm from "./_components/ContactForm"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe Lynaris. Nous répondons sous 24h. Basés à Taverny, Val-d'Oise.",
}

// Next.js 15 : searchParams est une Promise — on l'awaite côté server avant de passer au client
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; plan?: string; source?: string }>
}) {
  const params = await searchParams
  return (
    <ContactForm
      initialAgent={params.agent ?? ""}
      initialPlan={params.plan ?? ""}
      initialSource={params.source ?? ""}
    />
  )
}
