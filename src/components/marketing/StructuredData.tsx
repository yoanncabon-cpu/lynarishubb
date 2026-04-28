export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Lynaris",
    "url": "https://lynaris.ai",
    "logo": "https://lynaris.ai/logo.svg",
    "description": "Lynaris fournit des agents IA autonomes pour automatiser les tâches répétitives des PME.",
    "foundingDate": "2025",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "hello@lynaris.ai",
      "availableLanguage": "French",
    },
    "sameAs": [
      "https://linkedin.com/company/lynaris",
      "https://twitter.com/lynaris_ai",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema() {
  const faqs = [
    {
      q: "Comment fonctionne Lynaris ?",
      a: "Lynaris est une plateforme SaaS qui met à disposition des agents IA spécialisés. Chaque agent est connecté à vos outils (Google Calendar, Gmail, Twilio, etc.) et exécute des tâches automatiquement.",
    },
    {
      q: "Combien de temps pour déployer un agent ?",
      a: "En moyenne 48h pour un déploiement complet. La prise en main est guidée et ne nécessite pas de compétences techniques.",
    },
    {
      q: "Mes données sont-elles sécurisées ?",
      a: "Oui. Toutes les données sont hébergées en Europe (Supabase EU) et nous sommes conformes RGPD. Aucune donnée sensible n'est stockée sans chiffrement.",
    },
    {
      q: "Puis-je tester gratuitement ?",
      a: "Oui, 14 jours d'essai gratuit sans carte bancaire. Tous les agents sont accessibles pendant la période d'essai.",
    },
    {
      q: "Quels agents sont disponibles ?",
      // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
      // Liste nominative conservée pour le SEO (entités nommées indexables)
      a: "L'équipe IA Lynaris : un agent vocal (téléphonique), Charles (orchestrateur), Lou (contenu & SEO), Elio (commercial), Mae (email), Max (photo & vidéo), Nova (business), Alba (RH), Orion (automatisation).",
    },
  ]

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareAppSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Lynaris",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "69.90",
      "priceCurrency": "EUR",
      "priceValidUntil": "2027-01-01",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
