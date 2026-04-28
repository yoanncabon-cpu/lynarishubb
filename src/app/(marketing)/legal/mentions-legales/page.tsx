import type { Metadata } from "next"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Lynaris — lynarisai.com.",
}

export default function MentionsLegalesPage() {
  const siretEnCours = COMPANY.siret === "En cours d'immatriculation"

  return (
    <article className="prose-legal space-y-8">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--ly-text] tracking-tight mb-4">
          Mentions légales
        </h1>
        <p className="text-sm text-[--ly-text-dim]">Dernière mise à jour&nbsp;: avril 2026</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Éditeur du site</h2>
        <div className="text-sm text-[--ly-text-muted] leading-relaxed space-y-1">
          <p><strong className="text-[--ly-text]">Raison sociale&nbsp;:</strong> {COMPANY.name}</p>
          <p><strong className="text-[--ly-text]">Représentant légal&nbsp;:</strong> {COMPANY.representative}</p>
          <p><strong className="text-[--ly-text]">Forme juridique&nbsp;:</strong> {COMPANY.legalForm}</p>
          <p>
            <strong className="text-[--ly-text]">SIRET&nbsp;:</strong>{" "}
            {siretEnCours ? (
              <span>
                {COMPANY.siret}{" "}
                <em className="text-[--ly-text-dim] not-italic">(SIRET en cours d&apos;immatriculation — les mentions légales seront mises à jour dès l&apos;immatriculation)</em>
              </span>
            ) : (
              COMPANY.siret
            )}
          </p>
          <p><strong className="text-[--ly-text]">Siège social&nbsp;:</strong> {COMPANY.address}</p>
          <p>
            <strong className="text-[--ly-text]">Email&nbsp;:</strong>{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[--ly-primary-soft] hover:underline">{COMPANY.email}</a>
          </p>
          {COMPANY.phone && (
            <p><strong className="text-[--ly-text]">Téléphone&nbsp;:</strong> {COMPANY.phone}</p>
          )}
          <p>
            <strong className="text-[--ly-text]">Site web&nbsp;:</strong>{" "}
            <a href="https://lynarisai.com" className="text-[--ly-primary-soft] hover:underline">lynarisai.com</a>
          </p>
          <p><strong className="text-[--ly-text]">Numéro de TVA intracommunautaire&nbsp;:</strong> Non applicable (micro-entreprise sous le seuil)</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Hébergeur</h2>
        <div className="text-sm text-[--ly-text-muted] leading-relaxed space-y-1">
          <p><strong className="text-[--ly-text]">Raison sociale&nbsp;:</strong> Vercel Inc.</p>
          <p><strong className="text-[--ly-text]">Adresse&nbsp;:</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
          <p>
            <strong className="text-[--ly-text]">Site web&nbsp;:</strong>{" "}
            <a href="https://vercel.com" className="text-[--ly-primary-soft] hover:underline" rel="noopener noreferrer" target="_blank">vercel.com</a>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Hébergement des données</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          {COMPANY.dataHostingProvider}.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Propriété intellectuelle</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          L&apos;ensemble du contenu du site lynarisai.com (textes, images, graphismes, logo, icônes,
          structure) est la propriété exclusive de {COMPANY.name}, sauf mention contraire. Toute reproduction,
          représentation, modification, publication ou adaptation de tout ou partie des éléments du site
          est interdite sans autorisation écrite préalable de {COMPANY.name}.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Protection des données personnelles</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification,
          de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous
          à l&apos;adresse{" "}
          <a href={`mailto:${COMPANY.dpo}`} className="text-[--ly-primary-soft] hover:underline">
            {COMPANY.dpo}
          </a>.
        </p>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour plus de détails, consultez notre{" "}
          <a href="/legal/confidentialite" className="text-[--ly-primary-soft] hover:underline">
            politique de confidentialité
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Cookies</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Le site lynarisai.com n&apos;utilise aucun cookie de tracking ou publicitaire. Seuls des
          cookies strictement nécessaires au fonctionnement du service (session, préférences) peuvent
          être déposés. Ces cookies ne nécessitent pas de consentement au sens de la directive ePrivacy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">Droit applicable</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les
          tribunaux compétents seront ceux du ressort du siège social de {COMPANY.name}, sauf disposition
          légale contraire.
        </p>
      </section>
    </article>
  )
}
