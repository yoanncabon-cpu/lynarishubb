import type { Metadata } from "next"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Lynaris — traitement des données, droits RGPD, cookies.",
}

export default function ConfidentialitePage() {
  return (
    <article className="space-y-8">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[--ly-text] tracking-tight mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-[--ly-text-dim]">Dernière mise à jour&nbsp;: avril 2026</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">1. Responsable de traitement</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Le responsable du traitement des données personnelles collectées sur le site lynarisai.com
          est {COMPANY.name}, représentée par {COMPANY.representative}, dont le siège social est situé à {COMPANY.address}. Contact&nbsp;:{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-[--ly-primary-soft] hover:underline">
            {COMPANY.email}
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">2. Données collectées</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Nous collectons les catégories de données suivantes&nbsp;:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border border-[--ly-border] bg-[--ly-surface] p-4">
            <h3 className="text-sm font-semibold text-[--ly-text] mb-2">Données de compte</h3>
            <p className="text-sm text-[--ly-text-muted]">
              Nom, prénom, adresse email, nom d&apos;entreprise, mot de passe (hashé). Collectées
              lors de l&apos;inscription. Base légale&nbsp;: exécution du contrat.
            </p>
          </div>
          <div className="rounded-lg border border-[--ly-border] bg-[--ly-surface] p-4">
            <h3 className="text-sm font-semibold text-[--ly-text] mb-2">Données d&apos;usage</h3>
            <p className="text-sm text-[--ly-text-muted]">
              Actions effectuées par les agents, logs de connexion, pages visitées, temps de session.
              Collectées automatiquement. Base légale&nbsp;: intérêt légitime (amélioration du service).
            </p>
          </div>
          <div className="rounded-lg border border-[--ly-border] bg-[--ly-surface] p-4">
            <h3 className="text-sm font-semibold text-[--ly-text] mb-2">Données d&apos;intégration</h3>
            <p className="text-sm text-[--ly-text-muted]">
              Tokens OAuth, clés API, identifiants de connexion aux services tiers (Gmail, Google Calendar,
              Twilio, etc.). Stockés chiffrés en AES-256. Base légale&nbsp;: exécution du contrat.
            </p>
          </div>
          <div className="rounded-lg border border-[--ly-border] bg-[--ly-surface] p-4">
            <h3 className="text-sm font-semibold text-[--ly-text] mb-2">Données de contact</h3>
            <p className="text-sm text-[--ly-text-muted]">
              Nom, email, message soumis via le formulaire de contact. Base légale&nbsp;: consentement.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">3. Finalités du traitement</h2>
        <ul className="list-disc pl-6 text-sm text-[--ly-text-muted] leading-relaxed space-y-2">
          <li>Fourniture et gestion du service Lynaris (création de compte, agents IA, intégrations).</li>
          <li>Communication avec l&apos;Utilisateur (support, notifications, rappels).</li>
          <li>Amélioration continue du service (analyse d&apos;usage anonymisée).</li>
          <li>Facturation et gestion des abonnements.</li>
          <li>Respect des obligations légales et réglementaires.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">4. Durées de rétention</h2>
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
        <h2 className="text-xl font-bold text-[--ly-text]">5. Hébergement et sécurité</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Les données sont hébergées sur {COMPANY.dataHostingProvider}.
          Les identifiants d&apos;intégration sont chiffrés en AES-256.
          Les communications sont sécurisées par TLS 1.3. Les mots de passe sont hashés avec
          bcrypt. Des sauvegardes automatiques sont réalisées quotidiennement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">6. Sous-traitants</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Lynaris fait appel aux sous-traitants suivants pour le fonctionnement du service. Un accord de traitement des données (DPA) est signé avec chacun d&apos;eux.
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
        <h2 className="text-xl font-bold text-[--ly-text]">7. Vos droits (RGPD)</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Conformément au Règlement Général sur la Protection des Données (UE 2016/679) et à la
          loi Informatique et Libertés, vous disposez des droits suivants&nbsp;:
        </p>
        <ul className="list-disc pl-6 text-sm text-[--ly-text-muted] leading-relaxed space-y-2">
          <li><strong className="text-[--ly-text]">Droit d&apos;accès&nbsp;:</strong> obtenir la confirmation du traitement de vos données et en recevoir une copie.</li>
          <li><strong className="text-[--ly-text]">Droit de rectification&nbsp;:</strong> corriger vos données inexactes ou incomplètes.</li>
          <li><strong className="text-[--ly-text]">Droit à l&apos;effacement&nbsp;:</strong> demander la suppression de vos données dans les conditions prévues par le RGPD.</li>
          <li><strong className="text-[--ly-text]">Droit à la portabilité&nbsp;:</strong> recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.</li>
          <li><strong className="text-[--ly-text]">Droit d&apos;opposition&nbsp;:</strong> vous opposer au traitement de vos données pour des motifs légitimes.</li>
          <li><strong className="text-[--ly-text]">Droit à la limitation&nbsp;:</strong> demander la limitation du traitement de vos données.</li>
        </ul>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour exercer ces droits, envoyez un email à{" "}
          <a href={`mailto:${COMPANY.dpo}`} className="text-[--ly-primary-soft] hover:underline">
            {COMPANY.dpo}
          </a>{" "}
          avec l&apos;objet &laquo;&nbsp;Exercice de droits RGPD&nbsp;&raquo;. Nous répondons sous 30 jours
          maximum. Vous disposez également du droit d&apos;introduire une réclamation auprès de la
          CNIL (Commission Nationale de l&apos;Informatique et des Libertés) —{" "}
          <a href="https://www.cnil.fr" className="text-[--ly-primary-soft] hover:underline" rel="noopener noreferrer" target="_blank">cnil.fr</a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">8. Contact DPO</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Pour toute question relative à la protection de vos données personnelles, contactez notre
          Délégué à la Protection des Données&nbsp;:{" "}
          <a href={`mailto:${COMPANY.dpo}`} className="text-[--ly-primary-soft] hover:underline">
            {COMPANY.dpo}
          </a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">9. Cookies</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Le site lynarisai.com n&apos;utilise aucun cookie de tracking, de remarketing ou
          publicitaire. Seuls des cookies strictement nécessaires au fonctionnement technique
          de la Plateforme (session, authentification, préférences d&apos;affichage) peuvent être
          déposés. Ces cookies ne nécessitent pas votre consentement préalable au sens de la
          directive ePrivacy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[--ly-text]">10. Modifications</h2>
        <p className="text-sm text-[--ly-text-muted] leading-relaxed">
          Lynaris se réserve le droit de modifier la présente politique de confidentialité.
          En cas de modification substantielle, les utilisateurs seront informés par email
          au moins 30 jours avant l&apos;entrée en vigueur des nouvelles dispositions.
        </p>
      </section>
    </article>
  )
}
