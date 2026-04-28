/**
 * Seed de contenus de test pour /dashboard/contenus
 * Usage : npx tsx scripts/seed-contents.ts
 */

import { readFileSync } from "fs"
import path from "path"

// Charge .env manuellement sans dotenv
const envPath = path.resolve(process.cwd(), ".env")
try {
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* ignore */ }

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { contents, contentAttachments, organizations } from "../src/lib/db/schema"

const client = postgres(process.env["DATABASE_URL"]!, { prepare: false })
const db = drizzle(client)

const SEED_ITEMS = [
  // Lou — Post LinkedIn
  {
    agentSlug: "lou",
    contentType: "social_post",
    platform: "linkedin",
    title: "Comment l'IA change la gestion des PME en 2025",
    description: "3 changements concrets que nos clients ont observés en 90 jours.",
    body: `🚀 L'IA ne remplace pas vos équipes — elle leur donne des super-pouvoirs.\n\nDepuis 6 mois, on accompagne des PME françaises qui ont intégré des agents IA dans leur quotidien. Voici ce qu'on observe vraiment :\n\n1️⃣ Les appels entrants traités en < 2 secondes\nMarine, notre agent vocal, décroche 24h/24. Zéro appel manqué.\n\n2️⃣ Les emails triés avant même d'ouvrir sa boîte\nMae analyse, priorise et rédige les réponses. Le dirigeant valide en 1 clic.\n\n3️⃣ Le contenu publié sans y penser\nLou génère les posts LinkedIn, les newsletters, les articles de blog. Tout ça pendant que vous travaillez.\n\nLe résultat ? Nos clients gagnent en moyenne 12h/semaine.\n\nVous voulez voir concrètement ? Répondez "DEMO" en commentaire.\n\n#IA #PME #Automatisation #Productivité #Lynaris`,
    externalUrl: "https://www.linkedin.com/posts/lynaris-demo",
    metadata: { hashtags: ["IA", "PME", "Automatisation", "Productivité", "Lynaris"], wordCount: 145 },
    attachments: [
      {
        attachmentType: "image",
        storageUrl: "https://picsum.photos/seed/linkedin-post/1200/628",
        mimeType: "image/jpeg",
        width: 1200,
        height: 628,
        position: 0,
      },
    ],
  },

  // Mae — Email traité
  {
    agentSlug: "mae",
    contentType: "email",
    platform: "gmail",
    title: "Réponse : Demande de devis — Cabinet Ménigoz",
    description: "Réponse automatique envoyée à Julien Ménigoz suite à sa demande de tarification.",
    body: `Bonjour Julien,\n\nMerci pour votre demande de renseignements concernant Lynaris.\n\nSuite à notre échange, je vous transmets notre grille tarifaire :\n\n• Plan Starter : 290€/mois — 1 agent + 500 actions/mois\n• Plan Pro : 590€/mois — 3 agents + 2000 actions/mois ✓ Recommandé pour votre profil\n• Plan Scale : 990€/mois — 9 agents + illimité\n\nPour votre cabinet de kinésithérapie, je vous conseille le plan Pro avec Marine (agent vocal) et Mae (gestion emails).\n\nJe reste disponible pour un appel de démonstration cette semaine.\n\nCordialement,\nMae — Assistante Lynaris`,
    metadata: { recipient: "julien.menigoz@cabinet-menigoz.fr", subject: "RE: Demande de devis Lynaris", threadId: "msg_demo_123" },
  },

  // Marine — Résumé appel
  {
    agentSlug: "marine",
    contentType: "call_summary",
    title: "Appel entrant — Patient non identifié — Prise de RDV",
    description: "RDV pris le mardi 29 avril à 14h30 pour une première consultation.",
    body: `**Résumé de l'appel — 24 avril 2026 à 09h14**\n\nDurée : 3min 42sec\n\n**Motif :** Prise de rendez-vous première consultation kinésithérapie\n\n**Patient :** Thomas Renault, 34 ans, douleurs lombaires chroniques\n\n**Actions effectuées :**\n- ✅ Créneau vérifié dans Google Calendar\n- ✅ RDV créé : Mardi 29 avril à 14h30\n- ✅ SMS de confirmation envoyé au +33 6 12 34 56 78\n- ✅ Fiche patient créée dans le CRM\n\n**Transcription clé :**\nPatient : "J'ai des douleurs dans le bas du dos depuis 3 semaines"\nMarine : "Je comprends. Est-ce que vous avez une ordonnance médicale ?"\nPatient : "Oui, j'ai une ordonnance de mon généraliste"\n\n**Statut :** RDV confirmé`,
    metadata: { callDuration: 222, patientName: "Thomas Renault", appointmentDate: "2026-04-29T14:30:00", smsConfirmationSent: true },
  },

  // Elio — Prospect contacté
  {
    agentSlug: "elio",
    contentType: "email",
    platform: "gmail",
    title: "Prospection LinkedIn → Email — Sophie Martin, DG Boulangerie Artisanale",
    description: "Premier contact envoyé à Sophie Martin suite à son engagement sur un post IA.",
    body: `Bonjour Sophie,\n\nJ'ai vu votre commentaire sur le post de Jean Dupont concernant l'automatisation en boulangerie — très pertinent !\n\nJe me permets de vous contacter car Lynaris aide les artisans comme vous à automatiser les tâches chronophages :\n\n→ Vos appels gérés 24h/24 (même le dimanche matin à 7h)\n→ Vos commandes fournisseurs traitées automatiquement\n→ Votre communication sur les réseaux sans effort\n\nEn pratique, nos clients artisans gagnent 8-10h/semaine.\n\nSeriez-vous disponible 15 minutes cette semaine pour un échange ?\n\nBien à vous,\nÉlio — Agent Commercial Lynaris\n\nP.S. : Si ce n'est pas le bon moment, pas de souci — je ne relancerai qu'une seule fois.`,
    metadata: { prospectLinkedin: "https://linkedin.com/in/sophie-martin-boulangerie", score: 78, sequenceStep: 1 },
  },

  // Max — Visuel généré
  {
    agentSlug: "max",
    contentType: "image",
    title: "Visuel Instagram — Campagne Printemps Lynaris",
    description: "Visuel carré 1:1 pour la campagne de lancement printemps 2025.",
    metadata: { model: "flux-1.1-pro", prompt: "Modern AI dashboard interface, dark theme, orange accents, professional SaaS design", seed: 42, aspectRatio: "1:1" },
    attachments: [
      {
        attachmentType: "image",
        storageUrl: "https://picsum.photos/seed/max-visual/1080/1080",
        mimeType: "image/jpeg",
        width: 1080,
        height: 1080,
        position: 0,
      },
    ],
  },

  // Nova — Rapport
  {
    agentSlug: "nova",
    contentType: "report",
    title: "Rapport hebdomadaire — Semaine du 21 au 27 avril 2026",
    description: "Analyse des performances : CA, appels, prospects, contenu publié.",
    body: `# Rapport Lynaris — Semaine 17\n\n## Résumé exécutif\n\nSemaine solide : +12% de conversations agents vs semaine précédente, 3 nouveaux prospects qualifiés par Elio.\n\n## KPIs clés\n\n| Métrique | Cette semaine | vs S-1 |\n|----------|--------------|--------|\n| Appels traités (Marine) | 47 | +8% |\n| Emails traités (Mae) | 134 | +15% |\n| Prospects contactés (Elio) | 23 | +4% |\n| Posts publiés (Lou) | 5 | = |\n| Visuels générés (Max) | 12 | +20% |\n\n## Points d'attention\n\n⚠️ Taux de réponse email en baisse (34% vs 41% S-1) — recommandation : revoir l'objet des emails Elio\n\n✅ Marine a géré 2 urgences hors horaires — aucun appel manqué\n\n## Recommandations\n\n1. Tester 3 nouveaux objets d'email pour la séquence Elio\n2. Programmer 2 posts LinkedIn supplémentaires avec Lou\n3. Activer Max pour les visuels stories Instagram`,
    metadata: { weekNumber: 17, year: 2026, generatedBy: "nova" },
  },

  // Lou — Article blog
  {
    agentSlug: "lou",
    contentType: "article",
    platform: "wordpress",
    title: "5 tâches que votre agent IA peut faire pendant que vous dormez",
    description: "Découvrez comment les dirigeants de PME récupèrent 10h par semaine grâce aux agents Lynaris.",
    body: `Les nuits sont courtes pour un entrepreneur. Et si vos agents travaillaient pendant que vous récupérez ?\n\n## 1. Répondre aux appels entrants\n\nMarine, notre agent vocal, décroche en moins de 2 secondes. Elle qualifie, prend des rendez-vous, gère les urgences — sans jamais se tromper de numéro.\n\n## 2. Trier et répondre aux emails\n\nMae analyse votre boîte de réception toutes les heures. Les emails urgents sont traités immédiatement, les newsletters archivées, les prospects transmis à Elio.\n\n## 3. Prospecter sur LinkedIn\n\nElio identifie vos prospects idéaux, rédige des messages personnalisés et suit les relances. Tout ça de manière non-intrusive.\n\n## 4. Publier du contenu\n\nLou rédige vos posts LinkedIn, articles de blog, newsletters. Elle connaît votre ton, votre secteur, vos valeurs.\n\n## 5. Générer vos visuels\n\nMax crée les images pour vos réseaux sociaux en quelques secondes. Qualité professionnelle, identité visuelle respectée.`,
    externalUrl: "https://lynaris.ai/blog/5-taches-agent-ia-pendant-sommeil",
    metadata: { wordCount: 280, readingTime: 2, seoScore: 87, keywords: ["agent IA", "PME", "automatisation"] },
    attachments: [
      {
        attachmentType: "image",
        storageUrl: "https://picsum.photos/seed/article-blog/1200/630",
        mimeType: "image/jpeg",
        width: 1200,
        height: 630,
        position: 0,
      },
    ],
  },

  // Orion — Workflow
  {
    agentSlug: "orion",
    contentType: "workflow",
    title: "Workflow : Qualification automatique des leads entrants",
    description: "Workflow n8n déployé — scoring lead → enrichissement → notification Slack.",
    body: `**Workflow déployé le 24 avril 2026**\n\nTrigger : Nouveau formulaire soumis sur lynaris.ai/demo\n\nÉtapes :\n1. Webhook n8n reçoit les données\n2. Enrichissement via Dropcontact (email + LinkedIn)\n3. Scoring automatique (0-100) basé sur secteur + taille d'entreprise\n4. Si score > 60 → notification Slack #leads-chauds\n5. Si score > 80 → tâche créée dans Notion + email Elio\n6. Tous les leads → ajout CRM avec tags\n\n**Résultat après 24h :** 3 leads traités, 1 lead chaud identifié (score 87)`,
    metadata: { n8nWorkflowId: "wf_demo_qualification", executionsToday: 3, avgDurationMs: 1240 },
  },
]

async function seed() {
  console.log("🌱 Démarrage du seed contenus...")

  // Récupère la première org disponible
  const [org] = await db.select({ id: organizations.id, name: organizations.name }).from(organizations).limit(1)

  if (!org) {
    console.error("❌ Aucune organisation trouvée en base. Connecte-toi d'abord au dashboard.")
    process.exit(1)
  }

  console.log(`📦 Org cible : ${org.name} (${org.id})`)

  let created = 0
  let attachmentsCreated = 0

  for (const item of SEED_ITEMS) {
    const { attachments, ...contentData } = item

    const [inserted] = await db
      .insert(contents)
      .values({
        orgId: org.id,
        agentSlug: contentData.agentSlug,
        contentType: contentData.contentType,
        platform: contentData.platform ?? null,
        title: contentData.title,
        description: contentData.description ?? null,
        body: contentData.body ?? null,
        status: "published",
        externalUrl: contentData.externalUrl ?? null,
        metadata: contentData.metadata ?? {},
      })
      .returning()

    if (!inserted) continue
    created++
    console.log(`  ✅ [${contentData.agentSlug}] ${contentData.contentType} — "${contentData.title.slice(0, 50)}..."`)

    if (attachments?.length) {
      await db.insert(contentAttachments).values(
        attachments.map((att) => ({
          contentId: inserted.id,
          attachmentType: att.attachmentType,
          storageUrl: att.storageUrl,
          storageKey: "",
          mimeType: att.mimeType,
          width: att.width ?? null,
          height: att.height ?? null,
          position: att.position ?? 0,
        }))
      )
      attachmentsCreated += attachments.length
      console.log(`     📎 ${attachments.length} pièce(s) jointe(s)`)
    }
  }

  console.log(`\n🎉 Seed terminé : ${created} contenus + ${attachmentsCreated} attachments créés`)
  await client.end()
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err)
  process.exit(1)
})
