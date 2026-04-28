"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQ_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, tu peux passer d'un plan à un autre depuis ton dashboard. Le changement prend effet immédiatement avec proratisation Stripe automatique. En cas de downgrade, le nouveau tarif s'applique au prochain cycle de facturation.",
  },
  {
    q: "Que se passe-t-il si je dépasse mon quota d'actions ?",
    a: "Tu reçois une notification à 90% de ton quota. Au-delà, les actions non critiques sont mises en pause et nous te suggérons un upgrade. Marine reste disponible 24/7 sur tous les plans qui l'incluent (sa qualité voix n'est jamais dégradée).",
  },
  {
    q: "Mes données sont-elles hébergées en France ?",
    a: "Oui. Nos serveurs Supabase et Vercel sont configurés pour stocker tes données en région EU (Paris / Frankfurt). Aucune donnée personnelle ne quitte l'Union Européenne. Conformité RGPD complète, audit possible sur demande.",
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Tu accèdes à tous les agents pendant 14 jours, sans CB requise. Tu as 50 actions et 30 minutes de Marine pour tester en conditions réelles. À la fin de l'essai, tu choisis un plan ou ton compte passe en mode lecture seule.",
  },
  {
    q: "Quelle est la différence entre Pro et Business ?",
    a: "Pro est dimensionné pour un cabinet/PME jusqu'à 3 utilisateurs (400 min Marine, 4 000 actions, intégrations Google + Stripe). Business inclut un agent custom configuré pour ton secteur, 8 membres, un numéro Twilio dédié et un support Slack J+0.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, en 1 clic depuis ton dashboard (sauf Sur-mesure qui a un engagement de 12 mois). Aucun frais d'annulation. L'accès reste actif jusqu'à la fin de la période payée.",
  },
]

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: { q: string; a: string }
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="border border-white/[0.08] rounded-2xl overflow-hidden transition-colors hover:border-white/[0.15]"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
      >
        <span className="text-base font-medium text-[#F5F5F7]">{item.q}</span>
        <ChevronDown
          className={`size-5 text-[#71717A] shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-[#A1A1AA] leading-relaxed">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export function PricingFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="px-4 py-20" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-3">
            Questions fréquentes
          </p>
          <h2
            id="faq-title"
            className="text-3xl md:text-4xl font-bold text-[#F5F5F7] tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Tout ce que tu dois savoir
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
