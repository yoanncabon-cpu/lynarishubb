import { HeroSection } from "@/components/marketing/HeroSection"
import { LogosStrip } from "@/components/marketing/LogosStrip"
import { StatsSection } from "@/components/marketing/StatsSection"
import { ResultsSection } from "@/components/marketing/ResultsSection"
import { AgentsSection } from "@/components/marketing/AgentsSection"
import { TeamSection } from "@/components/marketing/TeamSection"
import { DemoConversationSection } from "@/components/marketing/DemoConversationSection"
import { BentoSection } from "@/components/marketing/BentoSection"
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection"
import { IntegrationsSection } from "@/components/marketing/IntegrationsSection"
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { FaqSection } from "@/components/marketing/FaqSection"
import { CtaSection } from "@/components/marketing/CtaSection"
import type { Metadata } from "next"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Lynaris — Ton équipe IA, opérationnelle en 48h",
  description: "Tes agents IA décrochent tes appels, publient ton contenu, prospectent pour toi. 14 jours gratuits, sans carte bancaire.",
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogosStrip />
      <StatsSection />
      <ResultsSection />
      <AgentsSection />
      <TeamSection />
      <div id="demo">
        <DemoConversationSection />
      </div>
      <BentoSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
