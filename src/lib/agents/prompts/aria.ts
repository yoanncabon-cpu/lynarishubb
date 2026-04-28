import type { AgentDefinition } from "../registry"
import type { Tool } from "@anthropic-ai/sdk/resources"

const tools: Tool[] = [
  // ── Direction ──────────────────────────────────────────────────────────────
  {
    name: "create_task",
    description: "Crée une tâche ou rappel dans le gestionnaire de tâches",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre de la tâche" },
        due_date: { type: "string", description: "Date d'échéance ISO" },
        priority: { type: "string", enum: ["faible", "normale", "haute", "urgente"] },
        notes: { type: "string", description: "Notes additionnelles" },
      },
      required: ["title"],
    },
  },
  {
    name: "draft_presentation",
    description: "Crée un plan de présentation structuré avec slides",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Sujet de la présentation" },
        audience: { type: "string", description: "Public cible" },
        slides_count: { type: "number", description: "Nombre de slides souhaité" },
        tone: { type: "string", enum: ["professionnel", "décontracté", "inspirant", "technique"] },
      },
      required: ["topic"],
    },
  },
  // ── Marketing / Réseaux sociaux ────────────────────────────────────────────
  {
    name: "create_social_campaign",
    description: "Crée une campagne réseaux sociaux complète avec posts pour plusieurs plateformes",
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_goal: { type: "string", description: "Objectif de la campagne" },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Plateformes cibles (LinkedIn, Instagram, Twitter, Facebook)",
        },
        duration_days: { type: "number", description: "Durée en jours" },
        brand_voice: { type: "string", description: "Ton de la marque" },
      },
      required: ["campaign_goal", "platforms"],
    },
  },
  // ── SEO / Contenu ──────────────────────────────────────────────────────────
  {
    name: "seo_audit",
    description: "Effectue un audit SEO basique d'une page ou site",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL à auditer" },
        target_keywords: { type: "string", description: "Mots-clés cibles séparés par des virgules" },
      },
      required: ["url"],
    },
  },
  {
    name: "write_blog_article",
    description: "Rédige un article de blog optimisé SEO",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre de l'article" },
        keywords: { type: "string", description: "Mots-clés principaux" },
        word_count: { type: "number", description: "Nombre de mots souhaité" },
        tone: { type: "string", description: "Ton de l'article" },
      },
      required: ["title"],
    },
  },
  // ── Commercial / CRM ───────────────────────────────────────────────────────
  {
    name: "generate_prospect_sequence",
    description: "Génère une séquence de prospection personnalisée multi-touch",
    input_schema: {
      type: "object" as const,
      properties: {
        prospect_name: { type: "string", description: "Nom du prospect" },
        company: { type: "string", description: "Entreprise du prospect" },
        pain_point: { type: "string", description: "Problème principal identifié" },
        sequence_length: { type: "number", description: "Nombre d'étapes (défaut : 5)" },
      },
      required: ["prospect_name", "company"],
    },
  },
  // ── Relation Client ─────────────────────────────────────────────────────────
  {
    name: "draft_customer_response",
    description: "Rédige une réponse professionnelle à une demande ou réclamation client",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_message: { type: "string", description: "Message du client" },
        context: { type: "string", description: "Contexte de la relation client" },
        tone: {
          type: "string",
          enum: ["empathique", "ferme", "commercial", "technique"],
        },
      },
      required: ["customer_message"],
    },
  },
  {
    name: "create_faq",
    description: "Génère une FAQ structurée pour un produit ou service",
    input_schema: {
      type: "object" as const,
      properties: {
        product_service: { type: "string", description: "Produit ou service concerné" },
        questions_count: { type: "number", description: "Nombre de Q&A à générer" },
        format: { type: "string", enum: ["markdown", "html", "texte"] },
      },
      required: ["product_service"],
    },
  },
  // ── Comptabilité / Facturation ─────────────────────────────────────────────
  {
    name: "generate_invoice",
    description: "Génère une facture détaillée prête à envoyer",
    input_schema: {
      type: "object" as const,
      properties: {
        client_name: { type: "string", description: "Nom du client" },
        client_email: { type: "string", description: "Email du client" },
        items: {
          type: "string",
          description: "Lignes de facturation (format : description,quantité,prix)",
        },
        invoice_number: { type: "string", description: "Numéro de facture" },
        due_date: { type: "string", description: "Date d'échéance" },
        notes: { type: "string", description: "Mentions légales ou notes" },
      },
      required: ["client_name", "items"],
    },
  },
  {
    name: "analyze_expenses",
    description: "Analyse les dépenses et génère un rapport de synthèse",
    input_schema: {
      type: "object" as const,
      properties: {
        expenses_data: { type: "string", description: "Données de dépenses (CSV ou description)" },
        period: { type: "string", description: "Période analysée" },
        categories: { type: "string", description: "Catégories à analyser" },
      },
      required: ["expenses_data"],
    },
  },
  // ── Juridique ─────────────────────────────────────────────────────────────
  {
    name: "draft_contract",
    description: "Rédige un contrat légal selon le droit français",
    input_schema: {
      type: "object" as const,
      properties: {
        contract_type: {
          type: "string",
          enum: ["CDI", "CDD", "Freelance", "Prestation de services", "NDA", "CGV", "Partenariat"],
        },
        party_a: { type: "string", description: "Première partie" },
        party_b: { type: "string", description: "Deuxième partie" },
        key_terms: { type: "string", description: "Termes clés et clauses spécifiques" },
      },
      required: ["contract_type", "party_a", "party_b"],
    },
  },
  {
    name: "gdpr_check",
    description: "Vérifie la conformité RGPD d'un processus ou document",
    input_schema: {
      type: "object" as const,
      properties: {
        document_or_process: { type: "string", description: "Document ou processus à vérifier" },
        data_types: { type: "string", description: "Types de données personnelles traitées" },
      },
      required: ["document_or_process"],
    },
  },
  // ── Recrutement ────────────────────────────────────────────────────────────
  {
    name: "draft_job_offer",
    description: "Rédige une offre d'emploi attractive et complète",
    input_schema: {
      type: "object" as const,
      properties: {
        position: { type: "string", description: "Intitulé du poste" },
        company_description: { type: "string", description: "Description de l'entreprise" },
        requirements: { type: "string", description: "Compétences et expérience requises" },
        salary_range: { type: "string", description: "Fourchette salariale" },
        benefits: { type: "string", description: "Avantages proposés" },
      },
      required: ["position"],
    },
  },
  {
    name: "score_candidate",
    description: "Évalue et score un candidat selon des critères définis",
    input_schema: {
      type: "object" as const,
      properties: {
        cv_content: { type: "string", description: "Contenu du CV du candidat" },
        job_criteria: { type: "string", description: "Critères du poste" },
        must_have: { type: "string", description: "Compétences indispensables" },
      },
      required: ["cv_content", "job_criteria"],
    },
  },
  // ── E-commerce ────────────────────────────────────────────────────────────
  {
    name: "manage_order",
    description: "Gère une commande e-commerce (statut, remboursement, suivi)",
    input_schema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "ID de la commande" },
        action: { type: "string", enum: ["status", "refund", "ship", "cancel"] },
        notes: { type: "string", description: "Notes sur l'action" },
      },
      required: ["order_id", "action"],
    },
  },
  // ── Analyse données ────────────────────────────────────────────────────────
  {
    name: "analyze_data",
    description: "Analyse un jeu de données et génère insights + recommandations",
    input_schema: {
      type: "object" as const,
      properties: {
        data: { type: "string", description: "Données à analyser (CSV, JSON ou description)" },
        analysis_goal: { type: "string", description: "Objectif de l'analyse" },
        output_format: {
          type: "string",
          enum: ["rapport", "bullet_points", "tableau", "graphique_description"],
        },
      },
      required: ["data", "analysis_goal"],
    },
  },
]

export const ariaDefinition: AgentDefinition = {
  slug: "aria",
  name: "Aria",
  description:
    "Assistante universelle qui combine 12 rôles professionnels : direction, marketing, SEO, commercial, relation client, comptabilité, juridique, recrutement, facturation, e-commerce, social et analyse de données.",
  model: "claude-opus-4-6",
  maxTokens: 3072,
  requiredIntegrations: ["google_calendar", "gmail", "stripe"],
  tools,
  systemPromptFn: (config) => {
    const orgName = (config.orgName as string | undefined) ?? "ton organisation"
    const customInstructions = (config.customInstructions as string | undefined) ?? ""

    return `Tu es Aria, l'assistante universelle d'entreprise de ${orgName}. Tu combines l'expertise de 12 rôles professionnels en une seule IA polyvalente.

## Tes domaines d'expertise

### Direction & Organisation
- Planification, gestion du temps, priorisation des tâches
- Création de présentations et supports de réunion
- Coordination des équipes et suivi des projets
- Synthèse de documents et rapports exécutifs

### Marketing & Communication
- Stratégie réseaux sociaux, création de contenu, calendrier éditorial
- Rédaction de posts LinkedIn, Instagram, Facebook, Twitter
- Conception de campagnes marketing multicanal
- Storytelling de marque et copywriting

### SEO & Contenu
- Audit SEO technique et stratégie de contenu
- Rédaction d'articles optimisés pour le référencement
- Recherche de mots-clés et analyse concurrentielle
- Optimisation des fiches produits et landing pages

### Commercial & Prospection
- Identification et qualification de prospects B2B
- Séquences de prospection personnalisées multi-touch
- Scripts d'appel et emails de suivi
- Analyse du pipeline et recommandations commerciales

### Relation Client
- Réponses aux demandes et réclamations clients
- Création de FAQ et bases de connaissances
- Gestion des tickets et escalade
- Fidélisation et suivi post-vente

### Comptabilité & Facturation
- Génération de factures professionnelles
- Suivi et analyse des dépenses
- Rapprochement comptable et exports
- Rappels de paiement et recouvrement amiable

### Juridique & Conformité
- Rédaction de contrats selon le droit français (CDI, CDD, freelance, NDA, CGV)
- Vérification de la conformité RGPD
- Mentions légales et politiques de confidentialité
- Conseil juridique de premier niveau (sans se substituer à un avocat)

### Recrutement & RH
- Rédaction d'offres d'emploi attractives
- Scoring et évaluation de candidats
- Questions d'entretien personnalisées par poste
- Onboarding et intégration des nouveaux collaborateurs

### E-commerce
- Gestion des commandes, retours et remboursements
- Optimisation des fiches produits
- Analyse des ventes et recommandations
- Gestion des avis clients

### Analyse de Données
- Analyse de fichiers CSV, Excel, rapports
- Identification d'insights business et tendances
- Visualisation de données (descriptions de graphiques)
- Recommandations basées sur les données

## Règles de fonctionnement
1. **Détection automatique du domaine** — tu identifies quel rôle est le plus adapté à chaque demande
2. **Pro chaleureux** — tutoiement B2B français, jamais corporate plat
3. **Livrables concrets** — tu produis des outputs directement utilisables, pas des conseils vagues
4. **Précision légale** — pour le juridique, tu précises toujours qu'il faut valider avec un avocat
5. **Confidentialité** — tu ne partages jamais d'informations entre différents clients
${customInstructions ? `\n## Instructions personnalisées\n${customInstructions}` : ""}

Organisation : ${orgName}`
  },
}
