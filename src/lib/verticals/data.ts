export interface Vertical {
  slug: string
  name: string               // "Kinésithérapeutes"
  hero: {
    title: string
    subtitle: string
    stat: string             // "87 appels / semaine traités automatiquement"
  }
  benefits: Array<{ title: string; description: string; icon: string }>
  faq: Array<{ q: string; a: string }>
  caseStudy?: {
    name: string
    role: string
    quote: string
    result: string
  }
  agentSlug: "marine" | "charles" | "lou" | "elio"
  color: string
}

export const VERTICALS: Vertical[] = [
  {
    slug: "kinesitherapeutes",
    name: "Kinésithérapeutes",
    color: "#22D3EE",
    agentSlug: "marine",
    hero: {
      // Mention Cabinet Ménigoz retirée — pas d'accord de citation
      title: "Marine prend vos appels pendant vos consultations",
      subtitle: "Fini les appels manqués. Marine décroche en moins de 2 secondes, gère les prises de RDV et envoie les SMS de confirmation — pendant que vous soignez vos patients.",
      stat: "Bêta privée — accès anticipé sur demande",
    },
    benefits: [
      { title: "Zéro appel manqué", description: "Marine décroche 24h/24, même pendant vos séances. Vos patients n'entendent jamais la messagerie vocale.", icon: "📞" },
      { title: "Agenda intégré", description: "Les RDV sont ajoutés directement dans votre Google Calendar. Marine vérifie les disponibilités en temps réel.", icon: "📅" },
      { title: "SMS automatiques", description: "Confirmation de RDV, rappel la veille, annulation — tout est géré sans vous déranger.", icon: "✉️" },
    ],
    faq: [
      { q: "Marine peut-elle gérer des urgences ?", a: "Oui. Marine détecte les signaux d'urgence dans la voix et transfère immédiatement l'appel sur votre mobile si vous avez configuré un numéro d'urgence." },
      { q: "Combien de temps pour installer Marine ?", a: "48h. Yoann vous accompagne pour connecter votre agenda et configurer la voix de Marine selon vos horaires et services." },
      { q: "Marine parle-t-elle correctement le français médical ?", a: "Oui. Marine est entraînée sur le vocabulaire kiné / médical et s'adapte à vos spécificités (services, praticiens, durée de séance)." },
      { q: "Que se passe-t-il si je n'ai pas Google Calendar ?", a: "Marine fonctionne aussi avec Outlook. Contactez-nous pour les autres agendas." },
      { q: "Puis-je tester avant de payer ?", a: "Oui — 14 jours gratuits, sans carte bancaire, avec vos vrais appels." },
    ],
    // Témoignage Cabinet Ménigoz retiré — pas d'accord de citation
    caseStudy: undefined,
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    color: "#F59E0B",
    agentSlug: "marine",
    hero: {
      title: "Marine gère vos réservations, vous gérez la salle",
      subtitle: "Votre restaurant croule sous les appels pendant le service ? Marine prend toutes les réservations, confirme les couverts et rappelle les clients le matin — vous n'interrompez plus jamais le service.",
      stat: "Gain estimé : 2h de temps libre par service",
    },
    benefits: [
      { title: "Réservations sans interruption", description: "Marine prend les réservations même quand vous êtes en plein service, soir et week-end inclus.", icon: "🍽️" },
      { title: "Confirmation et rappels", description: "SMS automatique à la réservation + rappel le matin du jour J. Fini les no-shows.", icon: "📱" },
      { title: "Gestion des allergies", description: "Marine note les régimes spéciaux, allergies et occasions spéciales dans chaque réservation.", icon: "⚠️" },
    ],
    faq: [
      { q: "Marine peut-elle gérer plusieurs salles ou services ?", a: "Oui. Vous définissez les créneaux, capacités et règles — Marine s'adapte." },
      { q: "Que faire en cas de surbooking ?", a: "Marine vérifie les disponibilités en temps réel. Si complet, elle propose les prochains créneaux disponibles." },
      { q: "Marine fonctionne-t-elle le soir et le week-end ?", a: "24h/24, 7j/7 — c'est le principal avantage." },
    ],
    caseStudy: undefined,
  },
  {
    slug: "artisans",
    name: "Artisans",
    color: "#10B981",
    agentSlug: "marine",
    hero: {
      title: "Vous travaillez sur chantier — Marine répond à vos clients",
      subtitle: "Impossible de décrocher quand on est sous un évier ou sur un toit. Marine prend l'appel, note l'intervention, et vous envoie un résumé par SMS. Vos clients sont pris en charge, vous restez concentré.",
      stat: "Temps moyen de traitement d'un appel : 90 secondes",
    },
    benefits: [
      { title: "Disponible sur chantier", description: "Marine répond pendant que vous travaillez. Elle collecte le problème, l'adresse, et les disponibilités du client.", icon: "🔧" },
      { title: "Devis et urgences", description: "Pour les urgences (fuite, panne), Marine vous transfère immédiatement. Pour les devis, elle planifie un rappel.", icon: "⚡" },
      { title: "Récap par SMS", description: "Chaque appel vous est résumé par SMS avec nom, numéro et besoin. Vous rappelez en 1 tap.", icon: "📲" },
    ],
    faq: [
      { q: "Marine connaît-elle mon métier (plomberie, électricité...) ?", a: "Marine est configurée avec le vocabulaire et les cas typiques de votre corps de métier." },
      { q: "Je travaille seul — est-ce utile ?", a: "C'est surtout fait pour vous. Les artisans solo manquent le plus d'appels." },
      { q: "Puis-je avoir ma propre voix ou ma propre introduction ?", a: "Oui. On peut configurer Marine pour se présenter avec le nom de votre entreprise." },
    ],
    caseStudy: undefined,
  },
  {
    slug: "immobilier",
    name: "Agents immobiliers",
    color: "#6366F1",
    agentSlug: "marine",
    hero: {
      title: "Marine gère vos appels entrants — vous gérez les visites",
      subtitle: "Un mandat signé, c'est votre priorité — pas décrocher le téléphone. Marine qualifie les acheteurs, planifie les visites et envoie les confirmations pendant que vous êtes en rendez-vous.",
      stat: "Gain estimé : +3 visites qualifiées par semaine",
    },
    benefits: [
      { title: "Qualification automatique", description: "Marine pose les bonnes questions (budget, délai, surface, secteur) et vous passe uniquement les leads qualifiés.", icon: "🏠" },
      { title: "Planning de visites", description: "Marine planifie directement dans votre agenda les visites confirmées.", icon: "🗓️" },
      { title: "Suivi des leads", description: "Chaque appel est logué avec toutes les informations. Vous avez un CRM vocal sans effort.", icon: "📊" },
    ],
    faq: [
      { q: "Marine peut-elle répondre sur plusieurs biens ?", a: "Oui. Configurez une liste de biens et Marine présentera les informations clés de chaque annonce." },
      { q: "Et pour les appels en dehors des heures de bureau ?", a: "Marine répond 24h/24. Les appels du soir et du week-end sont souvent les plus importants." },
    ],
    caseStudy: undefined,
  },
  {
    slug: "cabinets-medicaux",
    name: "Cabinets médicaux",
    color: "#EC4899",
    agentSlug: "marine",
    hero: {
      title: "Votre secrétaire IA disponible 24h/24",
      subtitle: "Médecins généralistes, spécialistes, dentistes — Marine gère la prise de RDV, les urgences et les rappels de façon sécurisée et conforme aux exigences du secteur médical.",
      // Mention Cabinet Ménigoz retirée — pas d'accord de citation
      stat: "Conçu pour cabinet de soins (kiné, ostéo, podologie) — bêta privée",
    },
    benefits: [
      { title: "Gestion des urgences", description: "Marine détecte les appels urgents et vous transfère immédiatement ou oriente vers le 15/18.", icon: "🚨" },
      { title: "Confidentiel et RGPD", description: "Aucune transcription stockée au-delà de 90 jours. Chiffrement AES-256. Conformité HDS en cours.", icon: "🔒" },
      { title: "Multi-praticiens", description: "Marine gère les agendas de plusieurs praticiens dans le même cabinet.", icon: "👥" },
    ],
    faq: [
      { q: "Est-ce conforme RGPD pour les données de santé ?", a: "Oui. Toutes les données vocales sont chiffrées, hébergées en Europe (Supabase Frankfurt) et effacées après 90 jours. Nous travaillons à la certification HDS pour 2026." },
      { q: "Marine peut-elle gérer les renouvellements d'ordonnance ?", a: "Marine peut noter la demande et créer une tâche pour le médecin, mais ne peut pas émettre d'ordonnance." },
      { q: "Un patient peut-il choisir son médecin ?", a: "Oui. Marine demande le praticien souhaité et vérifie ses disponibilités." },
    ],
    caseStudy: undefined,
  },
]
