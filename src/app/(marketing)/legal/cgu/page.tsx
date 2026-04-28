import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions Générales d\u2019Utilisation",
  description:
    "CGU de la plateforme Lynaris — conditions d'accès, utilisation des agents IA, responsabilités.",
}

export default function CguPage() {
  return (
    <article className="space-y-8">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--ly-text] tracking-tight mb-4">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-sm text-[--ly-text-dim]">Dernière mise à jour&nbsp;: avril 2026</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 1 — Objet</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les présentes Conditions Générales d&apos;Utilisation (ci-après &laquo;&nbsp;CGU&nbsp;&raquo;) ont pour
          objet de définir les conditions d&apos;accès et d&apos;utilisation de la plateforme Lynaris
          (ci-après &laquo;&nbsp;la Plateforme&nbsp;&raquo;), accessible à l&apos;adresse lynarisai.com, éditée par
          Lynaris, dont le siège social est situé à Taverny (95), France.
        </p>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          La Plateforme permet à ses utilisateurs (ci-après &laquo;&nbsp;l&apos;Utilisateur&nbsp;&raquo;) de
          déployer et superviser des agents d&apos;intelligence artificielle autonomes pour exécuter
          des tâches professionnelles&nbsp;: gestion d&apos;appels, création de contenu, prospection
          commerciale, gestion des emails, analytics, recrutement et automatisation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 2 — Acceptation des CGU</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          L&apos;utilisation de la Plateforme implique l&apos;acceptation pleine et entière des
          présentes CGU. Si l&apos;Utilisateur n&apos;accepte pas ces conditions, il doit renoncer
          à utiliser la Plateforme. Lynaris se réserve le droit de modifier les CGU à tout moment.
          Les modifications prennent effet dès leur publication sur le site. L&apos;Utilisateur
          sera informé par email 30 jours avant l&apos;entrée en vigueur de toute modification
          substantielle.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 3 — Accès et compte utilisateur</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          L&apos;accès à la Plateforme nécessite la création d&apos;un compte. L&apos;Utilisateur
          s&apos;engage à fournir des informations exactes et à jour lors de l&apos;inscription.
          Il est responsable de la confidentialité de ses identifiants de connexion et de toute
          activité réalisée depuis son compte.
        </p>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          L&apos;essai gratuit de 14 jours ne nécessite pas de carte bancaire. À l&apos;issue de
          l&apos;essai, le compte passe en lecture seule si aucun plan n&apos;est souscrit. Les
          données sont conservées 30 jours après la fin de l&apos;essai.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 4 — Agents IA et autonomie</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les agents IA Lynaris sont des programmes informatiques conçus pour exécuter des tâches
          spécifiques de manière autonome. L&apos;Utilisateur reconnaît que&nbsp;:
        </p>
        <ul className="list-disc pl-6 text-sm text-[--ly-text-muted] leading-relaxed space-y-2">
          <li>Les agents agissent selon les instructions et la configuration définies par l&apos;Utilisateur.</li>
          <li>Les actions exécutées par les agents (appels, emails, publications, messages) engagent la responsabilité de l&apos;Utilisateur vis-à-vis de ses propres clients et contacts.</li>
          <li>L&apos;Utilisateur peut à tout moment désactiver un agent ou révoquer son autonomie depuis le dashboard.</li>
          <li>Lynaris ne peut être tenue responsable des conséquences d&apos;une configuration inappropriée par l&apos;Utilisateur.</li>
          <li>Les agents IA peuvent produire des résultats imparfaits. L&apos;Utilisateur est encouragé à superviser les actions critiques.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 5 — Obligations de l&apos;Utilisateur</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          L&apos;Utilisateur s&apos;engage à&nbsp;:
        </p>
        <ul className="list-disc pl-6 text-sm text-[--ly-text-muted] leading-relaxed space-y-2">
          <li>Utiliser la Plateforme conformément à la législation en vigueur et aux présentes CGU.</li>
          <li>Ne pas utiliser les agents IA à des fins illicites, frauduleuses, ou portant atteinte aux droits de tiers.</li>
          <li>Ne pas tenter de contourner les limitations techniques ou les mesures de sécurité de la Plateforme.</li>
          <li>Respecter les limites de son plan (nombre d&apos;actions, minutes voix, agents actifs).</li>
          <li>Informer ses contacts et clients que certaines interactions peuvent être gérées par une intelligence artificielle, conformément à la réglementation applicable.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 6 — Responsabilité de Lynaris</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Lynaris s&apos;engage à fournir un service de qualité avec une disponibilité cible de
          99,5&nbsp;% (hors maintenance programmée). Lynaris ne saurait être tenue responsable&nbsp;:
        </p>
        <ul className="list-disc pl-6 text-sm text-[--ly-text-muted] leading-relaxed space-y-2">
          <li>Des interruptions liées à des services tiers (Twilio, Google, ElevenLabs, etc.).</li>
          <li>De l&apos;utilisation qui est faite par l&apos;Utilisateur des résultats produits par les agents IA.</li>
          <li>Des dommages indirects résultant de l&apos;utilisation de la Plateforme.</li>
          <li>Des pertes de données dues à une configuration inadéquate des intégrations par l&apos;Utilisateur.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 7 — Propriété intellectuelle</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          La Plateforme, son code source, son design, ses agents et leurs algorithmes sont la
          propriété exclusive de Lynaris. L&apos;Utilisateur conserve la propriété intégrale des
          données qu&apos;il fournit et des contenus générés par les agents à partir de ses
          instructions. Les contenus générés par les agents IA sont libres de droits pour
          l&apos;Utilisateur dans le cadre de son activité professionnelle.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 8 — Suspension et résiliation</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Lynaris se réserve le droit de suspendre ou de résilier l&apos;accès d&apos;un Utilisateur
          en cas de violation des présentes CGU, d&apos;utilisation abusive du service, ou de non-paiement.
          L&apos;Utilisateur sera informé par email au moins 15 jours avant la résiliation, sauf en cas
          d&apos;urgence (fraude, atteinte à la sécurité). En cas de résiliation, l&apos;Utilisateur
          pourra exporter ses données pendant 30 jours.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 9 — Droit applicable et litiges</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les présentes CGU sont régies par le droit français. En cas de litige, les parties
          s&apos;engagent à rechercher une solution amiable avant toute action judiciaire. À défaut
          d&apos;accord amiable dans un délai de 30 jours, le litige sera soumis aux tribunaux
          compétents du ressort du siège social de Lynaris.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Article 10 — Contact</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l&apos;adresse{" "}
          <a href="mailto:contact@lynarisai.com" className="text-[--ly-primary-soft] hover:underline">
            contact@lynarisai.com
          </a>.
        </p>
      </section>
    </article>
  )
}
