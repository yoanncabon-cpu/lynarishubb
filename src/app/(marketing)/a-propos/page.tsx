import Link from "next/link"
import { ArrowRight, Target, Zap, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Lynaris est née d'un constat simple : les TPE/PME ont les mêmes besoins qu'un grand groupe mais pas les mêmes moyens. Nos agents IA changent ça.",
  openGraph: {
    title: "À propos — Lynaris",
    description:
      "Lynaris est née d'un constat simple : les TPE/PME ont les mêmes besoins qu'un grand groupe mais pas les mêmes moyens. Nos agents IA changent ça.",
    type: "website",
    locale: "fr_FR",
    siteName: "Lynaris",
  },
}

const values = [
  {
    icon: Zap,
    title: "Exécution > Promesses",
    description:
      "Nos agents ne génèrent pas des rapports sur ce qu\u2019il faudrait faire. Ils font. Ton agent vocal décroche vraiment tes appels. Lou publie vraiment sur ton WordPress. Elio envoie vraiment des emails à tes prospects.",
  },
  {
    icon: Target,
    title: "Simplicité > Complexité",
    description:
      "Pas de formation de 3 semaines. Pas de documentation de 200 pages. Tu connectes tes outils, tu actives tes agents, tu supervises depuis le dashboard ou WhatsApp. C\u2019est tout.",
  },
  {
    icon: BarChart3,
    title: "Résultats > Features",
    description:
      "On ne mesure pas notre valeur au nombre de fonctionnalités. On la mesure au temps que tu récupères, aux rendez-vous que tu ne rates plus, au chiffre d\u2019affaires que tu gagnes grâce à l\u2019automatisation.",
  },
]

export default function AProposPage() {
  return (
    <article className="py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-[--ly-primary-soft]">
            À propos
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[--ly-text] tracking-tight">
            L&apos;IA qui travaille pour toi
          </h1>
        </div>

        {/* Story */}
        <section className="mb-20 space-y-6 text-[--ly-text-muted] leading-relaxed">
          <p>
            Lynaris est née d&apos;un constat simple&nbsp;: les TPE et PME françaises ont
            exactement les mêmes besoins qu&apos;un grand groupe — répondre au téléphone,
            prospecter, publier du contenu, gérer les mails, suivre les chiffres — mais elles
            n&apos;ont pas les moyens d&apos;embaucher une équipe de 10 personnes pour le faire.
          </p>
          <p>
            Yoann, fondateur de Lynaris, a commencé par résoudre un problème concret&nbsp;: le
            cabinet de kinésithérapie en Île-de-France ratait des dizaines d&apos;appels chaque
            semaine pendant les séances. Pas de secrétaire, pas de budget pour en recruter une.
            La solution&nbsp;? Un agent vocal IA qui décroche, qualifie l&apos;appel,
            vérifie les disponibilités et prend rendez-vous. Automatiquement. 24&nbsp;h/24.
          </p>
          <p>
            Le résultat a été immédiat&nbsp;: zéro appel manqué, des patients satisfaits, et un
            praticien qui peut se concentrer sur son métier. Ce qui a commencé comme un projet
            pilote est devenu une conviction&nbsp;: chaque entreprise mérite une équipe IA
            opérationnelle.
          </p>
          {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
          <p>
            Aujourd&apos;hui, Lynaris propose une équipe d&apos;agents IA spécialisés qui couvre les
            fonctions essentielles d&apos;une entreprise&nbsp;: téléphonie, contenu, prospection,
            mails, visuels, analytics, RH et automatisation. Chaque agent est autonome, connecté à
            tes outils, et supervisable depuis un dashboard ou via WhatsApp grâce à Charles, ton
            chef d&apos;orchestre IA.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-20 text-center">
          <div className="rounded-xl border border-[--ly-border] bg-[--ly-surface] p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[--ly-text] mb-4">
              Notre mission
            </h2>
            <p className="text-lg text-[--ly-text-muted] leading-relaxed max-w-2xl mx-auto">
              Donner à chaque entrepreneur les moyens d&apos;une équipe complète grâce à des agents
              IA qui exécutent vraiment — pas des dashboards à remplir, pas des prompts à écrire,
              pas des automations à maintenir. Des agents qui travaillent pendant que tu te
              concentres sur ce qui compte.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-20" aria-labelledby="values-heading">
          <h2
            id="values-heading"
            className="text-2xl sm:text-3xl font-bold text-[--ly-text] text-center mb-12"
          >
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  className="rounded-xl border border-[--ly-border] bg-[--ly-surface] p-6 space-y-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-[--ly-primary]/10 border border-[--ly-primary]/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[--ly-primary-soft]" aria-hidden />
                  </div>
                  <h3 className="text-base font-bold text-[--ly-text]">{value.title}</h3>
                  <p className="text-sm text-[--ly-text-muted] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[--ly-text] mb-3">
            Prêt à construire ton équipe IA&nbsp;?
          </h2>
          <p className="text-[--ly-text-muted] mb-6">
            Essai gratuit de 7&nbsp;jours. Sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" variant="primary" className="group">
              <Link href="/signup">
                Démarrer gratuitement
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
