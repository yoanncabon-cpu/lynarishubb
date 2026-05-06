import type { Metadata } from "next"
import { TarifsPricing } from "./_components/TarifsPricing"
import { ReassuranceStrip } from "./_components/ReassuranceStrip"
import { PricingFAQ } from "./_components/PricingFAQ"
import { FinalCTA } from "./_components/FinalCTA"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Tarifs — Lynaris",
  description:
    "5 plans Lynaris : Découverte (essai 14j), Starter 149€, Pro 449€, Business 1190€, Sur-mesure. Tous les agents IA inclus, sans engagement.",
  openGraph: {
    title: "Tarifs — Lynaris",
    description:
      "5 plans qui s'adaptent à ton entreprise. Tous les agents IA inclus, essai gratuit 14 jours sans CB.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

// ── Hero (Server Component) ──────────────────────────────────────────────────

function PricingHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-12 md:pt-40 md:pb-16">
      {/* Background décoratif : conic gradient flouté */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 1000px 500px at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Grid pattern subtil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#7C3AED", boxShadow: "0 0 8px #7C3AED" }}
            aria-hidden
          />
          <span className="text-xs uppercase tracking-widest font-semibold text-violet-300">
            Des tarifs qui s&apos;adaptent
          </span>
        </div>

        {/* Titre H1 avec gradient */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          style={{
            letterSpacing: "-0.04em",
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 50%, #67E8F9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
          }}
        >
          Choisis le plan qui transforme ton entreprise.
        </h1>

        {/* Sous-titre */}
        <p
          className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
        >
          Tous tes agents IA inclus. Essai gratuit de 14 jours, sans carte
          bancaire, sans engagement.
        </p>
      </div>
    </section>
  )
}

// ── Page assemblage ──────────────────────────────────────────────────────────

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <PricingHero />
      <TarifsPricing />
      <ReassuranceStrip />
      <PricingFAQ />
      <FinalCTA />
    </main>
  )
}
