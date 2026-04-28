import type { Metadata } from "next"
import Link from "next/link"
import { Check, Minus, ArrowRight, Shield } from "lucide-react"
import { TarifsPricing } from "./_components/TarifsPricing"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Tarifs — Lynaris",
  description: "Plans Lynaris : Découverte, Pro, Sur-mesure. Sans engagement, annulation en 1 clic.",
  openGraph: {
    title: "Tarifs — Lynaris",
    description: "Plans Lynaris : Découverte, Pro, Sur-mesure. Sans engagement, annulation en 1 clic.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

// ── Types ──────────────────────────────────────────────────────────────────

interface FeatureRow {
  feature: string
  decouverte: string | boolean
  pro: string | boolean
  custom: string | boolean
}

// ── Static data ────────────────────────────────────────────────────────────
// 3 plans : Découverte (essai 14j) / Pro / Sur-mesure (custom)

const comparisonTable: FeatureRow[] = [
  { feature: "Agents actifs",               decouverte: "Tous",         pro: "Tous",        custom: "Agent dédié" },
  { feature: "Actions / mois",              decouverte: "50 / 14 j",     pro: "1 500",       custom: "Illimité" },
  { feature: "Minutes voix / mois",         decouverte: false,           pro: "300 min",     custom: "Illimité" },
  { feature: "Numéro Twilio dédié",         decouverte: false,           pro: false,         custom: true },
  { feature: "Voix ElevenLabs sur-mesure",  decouverte: false,           pro: false,         custom: true },
  { feature: "Onboarding personnalisé",     decouverte: false,           pro: false,         custom: true },
  { feature: "Intégrations",                decouverte: "Basique",       pro: "Google + Stripe", custom: "Sur-mesure" },
  { feature: "Support email",               decouverte: true,            pro: "J+1",         custom: "Dédié 7j/7" },
  { feature: "Sans CB requise",             decouverte: true,            pro: false,         custom: false },
  { feature: "Sans engagement",             decouverte: true,            pro: true,          custom: true },
]

const faqs = [
  {
    question: "Comment fonctionne la facturation ?",
    answer:
      "La facturation est mensuelle ou annuelle (économisez jusqu'à 15 %). Vous pouvez annuler à tout moment depuis votre espace client. Aucun engagement minimum.",
  },
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui, à tout moment et sans frais. Un passage à un plan supérieur est immédiat. Un downgrade prend effet à la fin de la période en cours. Le prorata est calculé automatiquement via Stripe.",
  },
  {
    question: "La facturation annuelle, comment ça marche ?",
    answer:
      "En choisissant l'annuel, vous économisez ~15 % par rapport au mensuel. La somme est prélevée en une fois pour 12 mois. Vos factures sont disponibles directement depuis le dashboard.",
  },
  {
    question: "Les agents en bêta sont-ils inclus dans mon plan ?",
    answer:
      "Oui. Les agents en bêta (Charles, Lou, Elio, Mae) sont accessibles gratuitement pendant leur phase de développement pour tous les plans Pro et supérieurs.",
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-[#10B981] mx-auto" aria-label="Inclus" />
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-[#52525B] mx-auto" aria-label="Non inclus" />
  }
  return <span className="text-sm text-[#A1A1AA]">{value}</span>
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TarifsPage() {
  return (
    <div className="bg-[var(--ly-bg)]">
      {/* ── Hero ── */}
      <section className="pt-32 pb-4 text-center px-4">
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            top: 80,
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-widest text-[#71717A] mb-4">
          Tarifs
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F5F7] mb-4">
          Un plan pour chaque étape
        </h1>
        <p className="text-lg text-[#A1A1AA] max-w-xl mx-auto mb-4">
          Sans engagement. Annulation en 1 clic. Résultats dès la première semaine.
        </p>
        <p className="text-sm text-[#71717A] max-w-xl mx-auto mb-8">
          Les agents en bêta et roadmap sont accessibles gratuitement pendant leur phase de développement.
        </p>

        {/* Guarantee badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/8 px-4 py-1.5 text-sm text-[#10B981] mb-10">
          <Shield className="h-4 w-4" aria-hidden />
          30 jours satisfait ou remboursé
        </div>
      </section>

      {/* ── Toggle + ROI + Plan cards (client, état annual) ── */}
      <TarifsPricing />

      {/* ── Comparison table ── */}
      <section className="py-20 bg-[rgba(20,20,28,0.5)]" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h2
              id="comparison-heading"
              className="text-3xl sm:text-4xl font-bold text-[#F5F5F7] tracking-tight"
            >
              Comparaison détaillée
            </h2>
            <p className="text-[#A1A1AA]">Toutes les fonctionnalités par plan, en un coup d&apos;œil.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#14141C]">
                  <th className="py-4 px-5 text-sm font-semibold text-[#F5F5F7]">Fonctionnalité</th>
                  <th className="py-4 px-4 text-sm font-semibold text-[#22D3EE] text-center">Découverte</th>
                  <th className="py-4 px-4 text-sm font-semibold text-center" style={{ color: "#A78BFA" }}>Pro</th>
                  <th className="py-4 px-4 text-sm font-semibold text-center" style={{ color: "#F59E0B" }}>Sur-mesure</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr
                    key={row.feature}
                    className="border-b border-[rgba(255,255,255,0.05)]"
                    style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}
                  >
                    <td className="py-3 px-5 text-sm text-[#F5F5F7]">{row.feature}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.decouverte} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.custom} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl font-bold text-[#F5F5F7] tracking-tight text-center mb-10"
          >
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#14141C] p-6"
              >
                <h3 className="text-base font-semibold text-[#F5F5F7] mb-2">{faq.question}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.06)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#F5F5F7] mb-3">
            Questions&nbsp;? On t&apos;appelle.
          </h2>
          <p className="text-[#A1A1AA] mb-6">
            Explique-nous ton besoin, on te rappelle sous 24&nbsp;h pour trouver le plan adapté.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#F5F5F7", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Nous contacter
            <ArrowRight className="h-4 w-4 transition-transform" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
