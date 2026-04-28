"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "Les agents fonctionnent-ils vraiment de façon autonome ?",
    answer:
      "Oui. Contrairement à d’autres outils IA qui nécessitent une supervision constante, les agents Lynaris s’exécutent de manière autonome. Ton agent vocal décroche vraiment tes appels, Lou publie vraiment sur ton WordPress. Tu peux activer ou désactiver l’autonomie complète depuis le dashboard.",
  },
  {
    question: "Est-ce que mes données sont sécurisées ?",
    answer:
      "Oui. Toutes tes données sont hébergées sur des serveurs européens (Frankfurt). Tes identifiants d’intégration sont chiffrés en AES-256. Nous sommes conformes au RGPD et pouvons signer un DPA sur demande.",
  },
  {
    question: "Puis-je connecter mes outils existants ?",
    answer:
      "Lynaris s’intègre avec plus de 20 services : Gmail, Google Calendar, WordPress, LinkedIn, Stripe, Slack, Notion, HubSpot et bien d’autres. La connexion se fait en 2 clics via OAuth ou clé API.",
  },
  {
    question: "Que se passe-t-il à la fin de l’essai gratuit ?",
    answer:
      "Tu reçois un email de rappel 48 h avant la fin. Sans action de ta part, ton compte passe en lecture seule (tes données sont conservées 30 jours). Pas de prélèvement automatique sans ton accord.",
  },
  {
    question: "Puis-je personnaliser les agents ?",
    answer:
      "Oui. Chaque agent est configurable : ton de voix, horaires d’intervention, escalade vers un humain, intégrations actives. L’agent vocal peut par exemple être configuré avec le nom de ton cabinet et tes créneaux disponibles.",
  },
  {
    question: "Y a-t-il un engagement de durée ?",
    answer:
      "Non. Les plans mensuels sont sans engagement. Les plans annuels sont prépayés à l’année avec une réduction de 15 %.",
  },
]

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[--ly-border]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-[--ly-text] group-hover:text-[--ly-primary-soft] transition-colors">
          {item.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[--ly-text-dim] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? "500px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <p className="pb-5 text-sm text-[--ly-text-muted] leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  )
}

export function FaqSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section
      ref={ref}
      className="py-20 lg:py-28 bg-[--ly-surface]/30"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[--ly-primary-soft]">
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[--ly-text] tracking-tight"
          >
            Questions fréquentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {faqs.map((faq, i) => (
            <AccordionItem key={i} item={faq} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
