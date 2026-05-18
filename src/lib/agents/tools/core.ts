/**
 * CORE_TOOLS — outils partagés entre TOUS les agents.
 *
 * Mergés automatiquement dans le tools[] de chaque AgentDefinition par registry.ts.
 * Permet à n'importe quel agent (Charles, Marine, Mae...) de manipuler la todo list
 * et le carnet d'adresses utilisateur, sans dupliquer les définitions.
 *
 * Pages admin (/dashboard/admin/*) NON exposées — ces tools agissent uniquement
 * sur les données utilisateur (tasks, contacts).
 */

import type { Tool } from "@anthropic-ai/sdk/resources"

export const CORE_TOOLS: Tool[] = [
  // ─── Tâches (todo list) ────────────────────────────────────────────────────
  {
    name: "list_tasks",
    description:
      "Liste les tâches de l'utilisateur. Permet de filtrer par statut ou priorité. À utiliser quand l'utilisateur demande « qu'est-ce que j'ai à faire ? », « mes tâches en cours », « urgences du jour ».",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["todo", "in_progress", "done", "all"],
          description: "Filtre par statut (default: all)",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "all"],
          description: "Filtre par priorité (default: all)",
        },
        limit: {
          type: "number",
          description: "Nombre max de tâches à retourner (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_task",
    description:
      "Crée une tâche dans la todo list de l'utilisateur. À utiliser quand l'utilisateur dit « ajoute à ma todo », « rappelle-moi de... », « note que je dois... ». La tâche apparaît dans /dashboard/taches.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre court et actionnable" },
        description: { type: "string", description: "Détails optionnels" },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Priorité (default: medium)",
        },
        due_date: {
          type: "string",
          description: "Date limite ISO 8601 (ex: 2026-05-10) — optionnel",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Met à jour une tâche existante. À utiliser pour cocher (« marque [tâche] comme terminée »), changer la priorité, repousser l'échéance, ou modifier le titre.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "ID de la tâche à modifier" },
        status: {
          type: "string",
          enum: ["todo", "in_progress", "done"],
          description: "Nouveau statut",
        },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        title: { type: "string" },
        description: { type: "string" },
        due_date: { type: "string", description: "ISO 8601 ou null pour retirer" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description:
      "Supprime définitivement une tâche. À utiliser uniquement si l'utilisateur le demande explicitement (« supprime la tâche X »). Sinon préférer update_task avec status='done'.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "ID de la tâche à supprimer" },
      },
      required: ["task_id"],
    },
  },

  // ─── Contacts (carnet d'adresses utilisateur) ──────────────────────────────
  {
    name: "list_contacts",
    description:
      "Liste les contacts du carnet d'adresses utilisateur. À utiliser quand l'utilisateur demande « mes contacts », « qui je connais chez X ».",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Filtre par catégorie (optionnel : famille, client, fournisseur, etc.)",
        },
        limit: { type: "number", description: "Nombre max (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "search_contact",
    description:
      "Recherche un contact par nom, email, téléphone ou société. À utiliser dès qu'un nom de personne est mentionné pour récupérer ses coordonnées avant un envoi.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Nom, email, téléphone ou société à rechercher" },
      },
      required: ["query"],
    },
  },
  {
    name: "add_contact",
    description:
      "Ajoute un nouveau contact au carnet d'adresses. À utiliser quand l'utilisateur dit « ajoute [nom] à mes contacts », « note ce numéro ».",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nom complet (requis)" },
        email: { type: "string", description: "Email" },
        phone: { type: "string", description: "Téléphone (E.164 ou format FR)" },
        company: { type: "string", description: "Société / cabinet" },
        role: { type: "string", description: "Poste / fonction" },
        category: { type: "string", description: "Catégorie (client, fournisseur, famille...)" },
        notes: { type: "string", description: "Notes libres" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_contact",
    description:
      "Met à jour les infos d'un contact existant. Identifie le contact par contact_id (récupéré via list_contacts ou search_contact).",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "ID du contact à modifier" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        role: { type: "string" },
        category: { type: "string" },
        notes: { type: "string" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "delete_contact",
    description:
      "Supprime un contact du carnet d'adresses. Ne supprime PAS les conversations ni les messages liés à cette personne.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "ID du contact à supprimer" },
      },
      required: ["contact_id"],
    },
  },

  // ─── CRM (pipeline deals) — table prospects partagée ────────────────────
  // Stages anglais standard : new → contacted → qualified → proposition → won/lost.
  // Labels FR utilisés dans /dashboard/crm sont mappés automatiquement par le handler.
  {
    name: "list_deals",
    description:
      "Liste les deals/opportunités du pipeline CRM. À utiliser pour répondre « pipeline en cours », « combien j'ai d'affaires en proposition », « deals qualifiés cette semaine ».",
    input_schema: {
      type: "object" as const,
      properties: {
        stage: {
          type: "string",
          enum: ["new", "contacted", "qualified", "proposition", "won", "lost", "all"],
          description: "Filtre par stage du pipeline (default: all)",
        },
        limit: { type: "number", description: "Nombre max (default: 30)" },
      },
      required: [],
    },
  },
  {
    name: "create_deal",
    description:
      "Crée un nouveau deal dans le pipeline CRM. À utiliser quand l'utilisateur dit « ajoute [Société] au CRM », « nouvelle opportunité avec [Personne] ». Apparaît dans /dashboard/crm.",
    input_schema: {
      type: "object" as const,
      properties: {
        full_name: { type: "string", description: "Nom complet du contact (requis)" },
        company: { type: "string", description: "Société" },
        email: { type: "string", description: "Email professionnel" },
        phone: { type: "string", description: "Téléphone" },
        stage: {
          type: "string",
          enum: ["new", "contacted", "qualified", "proposition", "won", "lost"],
          description: "Stage initial (default: new)",
        },
        deal_value: { type: "number", description: "Valeur du deal en € (optionnel)" },
        notes: { type: "string", description: "Contexte / notes" },
        agent_slug: { type: "string", description: "Agent assigné (default: elio)" },
      },
      required: ["full_name"],
    },
  },
  {
    name: "update_deal_stage",
    description:
      "Déplace un deal dans le pipeline (ex: passer de qualified à proposition, ou marquer won/lost). Action la plus fréquente du CRM.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: { type: "string", description: "ID du deal à déplacer" },
        stage: {
          type: "string",
          enum: ["new", "contacted", "qualified", "proposition", "won", "lost"],
          description: "Nouveau stage",
        },
      },
      required: ["deal_id", "stage"],
    },
  },
  {
    name: "update_deal",
    description:
      "Met à jour les champs autres que le stage d'un deal (notes, dealValue, agent assigné, coordonnées).",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: { type: "string", description: "ID du deal à modifier" },
        full_name: { type: "string" },
        company: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        deal_value: { type: "number", description: "Valeur du deal en €" },
        notes: { type: "string" },
        agent_slug: { type: "string" },
      },
      required: ["deal_id"],
    },
  },
  {
    name: "delete_deal",
    description:
      "Supprime définitivement un deal du CRM. À utiliser uniquement si demandé explicitement. Pour un perdu, préférer update_deal_stage(stage='lost').",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: { type: "string", description: "ID du deal à supprimer" },
      },
      required: ["deal_id"],
    },
  },

  // ─── Création de fichiers & médias — partagés entre TOUS les agents ──────────
  // create_document : la plupart des agents ont leur propre version plus riche ;
  // celle-ci est le fallback (ex. aria) via la déduplication de withCoreTools.
  {
    name: "create_document",
    description:
      "Crée un document structuré (rapport, guide, synthèse, brief) en format HTML téléchargeable en PDF. Utilise cet outil pour tout document demandé — rapport, guide, contrat, synthèse.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titre du document" },
        content: { type: "string", description: "Contenu en Markdown. LIMITE : 1500 mots max. Concis et structuré avec ## sections." },
        type: {
          type: "string",
          enum: ["document", "guide", "report"],
          description: "Type de document (défaut: document)",
        },
      },
      required: ["title", "content"],
    },
  },
  // generate_image : Max et Charles ont leur propre version plus riche ;
  // les autres agents (marine, lou, elio, mae, nova, alba, aria) reçoivent celle-ci.
  // NOTE : generate_video est intentionnellement absent des CORE_TOOLS (polling 90s → timeout Vercel).
  // Les agents qui ont besoin de vidéo doivent déléguer à Max.
  {
    name: "generate_image",
    description:
      "Génère une image IA. Supporte plusieurs providers : Replicate (Flux 1.1 Pro), DALL-E 3 (OpenAI), Gemini Imagen (Google). Par défaut essaie dans l'ordre Replicate → DALL-E → Gemini. Utilise cet outil dès que l'utilisateur demande une image, une photo IA, une illustration ou un visuel.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "Description détaillée de l'image à générer (en anglais de préférence)",
        },
        style: {
          type: "string",
          enum: ["photorealistic", "illustration", "3d_render", "flat_design", "watercolor", "minimalist", "corporate"],
          description: "Style visuel (défaut: photorealistic)",
        },
        aspect_ratio: {
          type: "string",
          enum: ["1:1", "16:9", "9:16", "4:3"],
          description: "Format de l'image — 1:1 réseaux, 16:9 blog/hero, 9:16 story (défaut: 1:1)",
        },
        provider: {
          type: "string",
          enum: ["auto", "replicate", "dall-e", "gemini"],
          description: "Provider IA à utiliser — auto essaie dans l'ordre disponible (défaut: auto)",
        },
      },
      required: ["prompt"],
    },
  },
  // generate_video absent des CORE_TOOLS — polling 90s dépasse le timeout Vercel (60s).
  // Seul Max (prompts/max.ts) a generate_video. Les autres agents délèguent à Max.
]
