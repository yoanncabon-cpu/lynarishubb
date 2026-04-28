import type { Metadata } from "next"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Politique RGPD — Lynaris",
  description: "Politique de protection des données personnelles de Lynaris conformément au RGPD.",
}

export default function RgpdPage() {
  return (
    <article className="prose-legal space-y-8">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--ly-text] tracking-tight mb-4">
          Politique de protection des données personnelles (RGPD)
        </h1>
        <p className="text-sm text-[--ly-text-dim]">Dernière mise à jour&nbsp;: 1er avril 2026</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">1. Responsable du traitement</h2>
        <div className="text-sm text-[--ly-text-muted] leading-relaxed space-y-1">
          <p><strong className="text-[--ly-text]">Raison sociale&nbsp;:</strong> {COMPANY.name}</p>
          <p><strong className="text-[--ly-text]">Forme juridique&nbsp;:</strong> {COMPANY.legalForm}</p>
          <p><strong className="text-[--ly-text]">Représentant légal&nbsp;:</strong> {COMPANY.representative}</p>
          <p><strong className="text-[--ly-text]">Adresse&nbsp;:</strong> {COMPANY.address}</p>
          <p>
            <strong className="text-[--ly-text]">Email&nbsp;:</strong>{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[--ly-primary-soft] hover:underline">{COMPANY.email}</a>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">2. Données collectées</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Dans le cadre de l&apos;utilisation de la plateforme Lynaris, nous collectons les catégories de données suivantes&nbsp;:
        </p>
        <ul className="text-sm text-[--ly-text-muted] leading-relaxed space-y-2 list-none pl-0">
          <li><strong className="text-[--ly-text]">Données d&apos;identification&nbsp;:</strong> nom, prénom, adresse email, nom d&apos;entreprise.</li>
          <li><strong className="text-[--ly-text]">Données d&apos;utilisation&nbsp;:</strong> interactions avec les agents IA, logs de conversations, préférences de configuration.</li>
          <li><strong className="text-[--ly-text]">Données de paiement&nbsp;:</strong> informations de facturation traitées via notre prestataire Stripe (nous ne stockons pas les numéros de carte bancaire).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">3. Finalités du traitement</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Vos données sont traitées pour les finalités suivantes&nbsp;: fourniture du service Lynaris, gestion de votre compte, facturation et paiement, amélioration continue de la plateforme, communication relative au service, et conformité légale.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">4. Base légale</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les traitements reposent sur les bases légales suivantes&nbsp;: exécution du contrat (art. 6.1.b RGPD) pour la fourniture du service, obligation légale (art. 6.1.c) pour la facturation et la comptabilité, intérêt légitime (art. 6.1.f) pour l&apos;amélioration du service et la sécurité.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">5. Durées de rétention</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[--ly-border]">
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">Catégorie</th>
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">Durée de conservation</th>
              </tr>
            </thead>
            <tbody className="text-[--ly-text-muted]">
              <tr className="border-b border-[--ly-border] bg-[--ly-surface]">
                <td className="py-3 px-4 font-medium text-[--ly-text]">Logs système</td>
                <td className="py-3 px-4">{COMPANY.retentionPolicies.logs}</td>
              </tr>
              <tr className="border-b border-[--ly-border]">
                <td className="py-3 px-4 font-medium text-[--ly-text]">Données clients</td>
                <td className="py-3 px-4">{COMPANY.retentionPolicies.clientData}</td>
              </tr>
              <tr className="border-b border-[--ly-border] bg-[--ly-surface]">
                <td className="py-3 px-4 font-medium text-[--ly-text]">Données de facturation</td>
                <td className="py-3 px-4">{COMPANY.retentionPolicies.billing}</td>
              </tr>
              <tr className="border-b border-[--ly-border]">
                <td className="py-3 px-4 font-medium text-[--ly-text]">Transcriptions vocales</td>
                <td className="py-3 px-4">{COMPANY.retentionPolicies.voiceTranscripts}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">6. Droits des personnes</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Conformément au RGPD, vous disposez des droits suivants&nbsp;:
        </p>
        <ul className="text-sm text-[--ly-text-muted] leading-relaxed space-y-2 list-none pl-0">
          <li><strong className="text-[--ly-text]">Droit d&apos;accès (art. 15)&nbsp;:</strong> obtenir une copie de vos données.</li>
          <li><strong className="text-[--ly-text]">Droit de rectification (art. 16)&nbsp;:</strong> corriger des données inexactes.</li>
          <li><strong className="text-[--ly-text]">Droit à l&apos;effacement (art. 17)&nbsp;:</strong> demander la suppression de vos données.</li>
          <li><strong className="text-[--ly-text]">Droit à la portabilité (art. 20)&nbsp;:</strong> recevoir vos données dans un format structuré.</li>
          <li><strong className="text-[--ly-text]">Droit d&apos;opposition (art. 21)&nbsp;:</strong> vous opposer à certains traitements.</li>
        </ul>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour exercer ces droits, contactez-nous à&nbsp;:{" "}
          <a href={`mailto:${COMPANY.dpo}`} className="text-[--ly-primary-soft] hover:underline">{COMPANY.dpo}</a>.
          En cas de litige, vous pouvez saisir la CNIL&nbsp;:{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[--ly-primary-soft] hover:underline">cnil.fr</a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">7. Sous-traitants</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Certains de nos sous-traitants sont établis hors de l&apos;Union Européenne. Ces transferts sont encadrés par des clauses contractuelles types (CCT) adoptées par la Commission européenne, garantissant un niveau de protection adéquat de vos données.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[--ly-border]">
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">Sous-traitant</th>
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">Finalité</th>
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">Zone de traitement</th>
                <th className="text-left py-3 px-4 text-[--ly-text] font-semibold">DPA</th>
              </tr>
            </thead>
            <tbody className="text-[--ly-text-muted]">
              {COMPANY.subprocessors.map((sp, i) => (
                <tr key={sp.name} className={`border-b border-[--ly-border]${i % 2 === 0 ? " bg-[--ly-surface]" : ""}`}>
                  <td className="py-3 px-4 font-medium text-[--ly-text]">{sp.name}</td>
                  <td className="py-3 px-4">{sp.purpose}</td>
                  <td className="py-3 px-4">{sp.region}</td>
                  <td className="py-3 px-4">{sp.dpa ? "Signé" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">8. Cookies</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Le site lynarisai.com n&apos;utilise aucun cookie de tracking ou publicitaire. Seuls des cookies strictement nécessaires au fonctionnement du service (session, préférences d&apos;interface) sont déposés. Ces cookies ne nécessitent pas de consentement préalable au sens de la directive ePrivacy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">9. Contact DPO</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits, vous pouvez contacter notre Délégué à la Protection des Données&nbsp;:{" "}
          <a href={`mailto:${COMPANY.dpo}`} className="text-[--ly-primary-soft] hover:underline">{COMPANY.dpo}</a>.
        </p>
      </section>
    </article>
  )
}
