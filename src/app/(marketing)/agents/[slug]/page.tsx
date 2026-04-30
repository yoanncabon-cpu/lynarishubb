import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { agents } from "@/lib/agents/data"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { CopyButton } from "./_components/CopyButton"

interface AgentDetail {
  capabilities: string[]
  integrations: string[]
  longDescription: string
  commands: string[]
}

const agentDetails: Record<string, AgentDetail> = {
  marine: {
    capabilities: [
      "Répond en moins de 2 secondes",
      "Détecte les urgences et escalade vers toi",
      "Propose 2 créneaux disponibles maximum",
      "Envoie un SMS de confirmation automatique",
      "Génère un résumé de chaque appel",
    ],
    integrations: ["Google Calendar", "Twilio", "ElevenLabs", "Gmail"],
    commands: [
      "$ marine réponds aux appels du cabinet",
      "$ marine envoie un SMS de rappel à 14h",
      "$ marine bloque le créneau de 9h à 10h",
    ],
    longDescription:
      "Marine est ton agent téléphonique IA. Elle décroche chaque appel entrant en moins de 2 secondes, identifie le motif de l’appel, et gère les prises de rendez-vous en temps réel en vérifiant tes disponibilités dans Google Calendar. En cas d’urgence, elle t’envoie une notification immédiate. Après chaque appel, tu reçois un résumé structuré par email. Tes patients ou clients ne tombent plus jamais sur une boîte vocale.",
  },
  charles: {
    capabilities: [
      "Comprend les instructions en langage naturel",
      "Délègue aux bons agents",
      "Mémorise tes préférences long terme",
      "Accessible sur WhatsApp 24 h/24",
      "Génère ton brief quotidien à 8 h",
    ],
    integrations: ["WhatsApp (Twilio)", "Gmail", "Google Calendar", "Slack", "Notion"],
    commands: [
      "$ charles annule mon rdv de 14h",
      "$ charles dis à Lou de publier l’article SEO",
      "$ charles brief du jour",
    ],
    longDescription:
      "Charles est ton chef d’orchestre personnel. Envoie-lui un message sur WhatsApp en langage naturel — « Annule mon rendez-vous de 14 h et dis à Lou de publier l’article sur le SEO » — et il coordonne les bons agents pour toi. Il mémorise tes préférences, tes habitudes, et t’envoie un brief chaque matin avec tes priorités du jour.",
  },
  lou: {
    capabilities: [
      "Rédige des articles SEO de 1 500+ mots",
      "Publie directement sur WordPress",
      "Crée des posts LinkedIn et Instagram",
      "Génère des carrousels visuels",
      "Planifie un calendrier éditorial complet",
    ],
    integrations: ["WordPress", "LinkedIn", "Instagram", "Notion", "Resend"],
    commands: [
      "$ lou rédige un article sur le SEO local",
      "$ lou publie un post LinkedIn maintenant",
      "$ lou crée un carrousel Instagram",
    ],
    longDescription:
      "Lou est ton agent contenu et SEO. Elle rédige des articles optimisés pour le référencement, crée des posts LinkedIn engageants, produit des carrousels Instagram et publie tout directement sur tes plateformes. Tu valides en un clic, elle fait le reste. Fini la page blanche et les heures perdues à rédiger.",
  },
  elio: {
    capabilities: [
      "Importe et enrichit tes listes de prospects",
      "Rédige des messages personnalisés à chaque profil",
      "Score les réponses (chaud/tiède/froid)",
      "Gère les séquences de relance automatisées",
      "Synchronise avec ton CRM",
    ],
    integrations: ["Gmail", "HubSpot", "Pipedrive", "Dropcontact"],
    commands: [
      "$ elio importe la liste prospects.csv",
      "$ elio lance la séquence de relance",
      "$ elio score les réponses de la semaine",
    ],
    longDescription:
      "Elio est ton agent commercial. Il importe tes listes de prospects, les enrichit avec des données vérifiées, et rédige des messages personnalisés adaptés à chaque profil. Il gère les séquences de relance, score les réponses par température (chaud, tiède, froid), et synchronise tout avec ton CRM. Tu te concentres sur les rendez-vous, il gère le pipeline.",
  },
  mae: {
    capabilities: [
      "Trie ta boîte par priorité chaque matin",
      "Rédige des réponses à valider en 1 clic",
      "Te désabonne des newsletters indésirables",
      "Envoie un brief quotidien à 8 h",
      "Archive automatiquement les emails traités",
    ],
    integrations: ["Gmail", "Outlook"],
    commands: [
      "$ mae trie ma boîte de ce matin",
      "$ mae réponds à l’email de Pierre",
      "$ mae désabonne-moi des newsletters",
    ],
    longDescription:
      "Mae est ton agent mail. Chaque matin à 8 h, elle trie ta boîte de réception par priorité et t’envoie un brief avec les 3 points urgents. Elle rédige des réponses que tu valides en un clic, te désabonne des newsletters parasites, et archive les emails traités. Ta boîte mail redevient un outil productif.",
  },
  max: {
    capabilities: [
      "Génère des visuels pro en quelques secondes",
      "Supprime les fonds automatiquement",
      "Crée des variations produit en masse",
      "Produit des templates Reels",
      "Upscale les images en haute résolution",
    ],
    integrations: ["Supabase Storage", "Replicate (Flux)"],
    commands: [
      "$ max génère un visuel produit fond blanc",
      "$ max supprime le fond de photo.jpg",
      "$ max crée 5 variations pour Instagram",
    ],
    longDescription:
      "Max est ton agent photo et vidéo. Il génère des visuels professionnels à partir d’un simple brief, supprime les fonds, crée des variations produit en masse et produit des templates de Reels Instagram. Pas besoin de Photoshop ni de graphiste freelance — Max te livre des visuels prêts à publier en quelques secondes.",
  },
  nova: {
    capabilities: [
      "Agrège tes métriques Stripe et Shopify",
      "Détecte les anomalies de revenus",
      "Simule des scénarios de croissance",
      "Produit un rapport PDF hebdomadaire",
      "Priorise tes 3 actions du jour",
    ],
    integrations: ["Stripe", "Shopify", "Qonto", "Google Calendar"],
    commands: [
      "$ nova brief financier du mois",
      "$ nova simule +20% de MRR",
      "$ nova détecte les anomalies Stripe",
    ],
    longDescription:
      "Nova est ton agent business. Elle agrège tes données financières depuis Stripe, Shopify et ta banque pro, détecte les anomalies de revenus, et te produit un rapport hebdomadaire avec 3 priorités actionnables. Elle simule des scénarios de croissance pour t’aider à prendre des décisions éclairées sans passer par un analyste.",
  },
  alba: {
    capabilities: [
      "Analyse et score les CVs reçus",
      "Rédige les messages aux candidats",
      "Planifie les entretiens dans ton agenda",
      "Génère les contrats depuis tes templates",
      "Répond aux questions RH de tes équipes",
    ],
    integrations: ["Gmail", "Google Calendar", "Notion"],
    commands: [
      "$ alba analyse les 10 derniers CVs",
      "$ alba planifie un entretien avec Sarah",
      "$ alba génère un contrat CDI",
    ],
    longDescription:
      "Alba est ton agent RH. Elle analyse les candidatures reçues, les score selon tes critères, rédige les messages aux candidats (acceptation, refus, relance), planifie les entretiens dans ton agenda et génère les contrats depuis tes templates. Elle répond aussi aux questions RH courantes de tes équipes pour te libérer du temps administratif.",
  },
  orion: {
    capabilities: [
      "Crée des workflows n8n en langage naturel",
      "Les déploie directement sur ton instance",
      "Teste les workflows avec des données réelles",
      "Gère tes automatisations existantes",
      "Génère la documentation automatiquement",
    ],
    integrations: ["n8n", "Make", "Slack", "Notion", "Airtable"],
    commands: [
      "$ orion crée un workflow formulaire → HubSpot",
      "$ orion teste le workflow avec des données réelles",
      "$ orion documente mes automatisations",
    ],
    longDescription:
      "Orion est ton agent automatisation. Décris ton process en français — « Quand un formulaire est soumis, crée un contact dans HubSpot et envoie un email de bienvenue » — et Orion crée le workflow, le teste avec des données réelles, et le déploie sur ton instance n8n ou Make. Il gère aussi tes automatisations existantes et génère la documentation technique.",
  },
}

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const agent = agents.find((a) => a.slug === slug)
  if (!agent) return { title: "Agent introuvable" }
  return {
    title: `${agent.name} — ${agent.role}`,
    description: agent.description,
  }
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = agents.find((a) => a.slug === slug)
  if (!agent) notFound()

  const details = agentDetails[agent.slug]
  if (!details) notFound()

  return (
    <article className="relative">
      {/* Hero mini */}
      <div
        className="relative pt-32 pb-20"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${agent.color}33, transparent 60%)`,
        }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 text-sm hover:text-[#F5F5F7] transition-colors mb-12"
            style={{ color: "#A1A1AA" }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Tous les agents
          </Link>

          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div
              className="flex items-center justify-center mb-8 overflow-hidden"
              style={{
                width: 140,
                height: 140,
                borderRadius: 32,
                background: `${agent.color}1F`,
                border: `1px solid ${agent.color}4D`,
                color: agent.color,
                fontWeight: 800,
                fontSize: 64,
                boxShadow: `0 0 60px ${agent.color}40`,
              }}
            >
              {agent.avatar ? (
                <Image
                  src={agent.avatar}
                  alt={`Avatar 3D de ${agent.name}`}
                  width={140}
                  height={140}
                  priority
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden>{agent.name[0]}</span>
              )}
            </div>

            {/* Overline role */}
            <p
              className="uppercase"
              style={{
                color: agent.color,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              {agent.role}
            </p>

            {/* H1 */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#F5F5F7",
                marginBottom: 16,
                lineHeight: 1,
              }}
            >
              {agent.name}
            </h1>

            {/* Tagline */}
            <p
              style={{
                fontSize: 24,
                color: "#A1A1AA",
                fontWeight: 500,
                maxWidth: 500,
              }}
            >
              {agent.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
        {/* Description */}
        <p
          className="leading-relaxed mb-16"
          style={{ fontSize: 16, color: "#A1A1AA", maxWidth: 640 }}
        >
          {details.longDescription}
        </p>

        {/* Capabilities grid */}
        <section className="mb-16" aria-labelledby={`${agent.slug}-capabilities`}>
          <h2
            id={`${agent.slug}-capabilities`}
            className="text-2xl font-bold mb-6"
            style={{ color: "#F5F5F7" }}
          >
            Ce que fait {agent.name}
          </h2>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {details.capabilities.map((cap, i) => (
              <div
                key={cap}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: "#14141C",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Number */}
                <div
                  className="flex items-center justify-center font-mono mb-3"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${agent.color}1F`,
                    border: `1px solid ${agent.color}4D`,
                    color: agent.color,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "#F5F5F7",
                  }}
                >
                  {cap}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Commands block */}
        <section className="mb-16" aria-labelledby={`${agent.slug}-commands`}>
          <h2
            id={`${agent.slug}-commands`}
            className="text-2xl font-bold mb-6"
            style={{ color: "#F5F5F7" }}
          >
            Exemples de commandes
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "#0D0D14",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="p-5 space-y-2 font-mono" style={{ fontSize: 13, color: "#A1A1AA" }}>
              {details.commands.map((cmd) => {
                const dollarIndex = cmd.indexOf("$")
                const rest = dollarIndex >= 0 ? cmd.slice(dollarIndex + 1) : cmd
                return (
                  <div key={cmd} className="flex items-start gap-0">
                    <span style={{ color: agent.color }}>$</span>
                    <span>{rest}</span>
                  </div>
                )
              })}
            </div>
            <div
              className="flex items-center justify-end px-5 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <CopyButton text={details.commands.join("\n")} />
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="mb-16" aria-labelledby={`${agent.slug}-integrations`}>
          <h2
            id={`${agent.slug}-integrations`}
            className="text-2xl font-bold mb-6"
            style={{ color: "#F5F5F7" }}
          >
            Intégrations requises
          </h2>
          <div className="flex flex-wrap gap-3">
            {details.integrations.map((integ) => (
              <span
                key={integ}
                className="inline-flex items-center gap-2 rounded-full text-sm"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#14141C",
                  padding: "8px 16px",
                  color: "#A1A1AA",
                }}
              >
                {integ}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div
          className="rounded-xl text-center"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#14141C",
            padding: 32,
          }}
        >
          <h3 className="text-xl font-bold mb-3" style={{ color: "#F5F5F7" }}>
            Prêt à activer {agent.name} ?
          </h3>
          <p className="text-sm mb-6" style={{ color: "#A1A1AA" }}>
            Essai gratuit de 7 jours. Sans carte bancaire.
          </p>
          <Button asChild size="lg" variant="primary" className="group">
            <Link href="/signup">
              Activer {agent.name}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
