<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Documentation des agents Lynaris

> Référence technique et fonctionnelle des 9 agents IA.
> Mise à jour au fur et à mesure des releases.

## Architecture commune

Chaque agent est défini dans `src/lib/agents/prompts/{slug}.ts` et enregistré dans `src/lib/agents/registry.ts`.

L'executor (`src/lib/agents/executor.ts`) gère :
- Le run loop avec tool use (jusqu'à 10 itérations)
- Le streaming SSE via `streamAgent()`
- La gestion des erreurs et timeouts

Les endpoints API :
- `POST /api/agents/{slug}/chat` — streaming SSE
- `POST /api/agents/{slug}/run` — one-shot
- `GET /api/agents/{slug}/logs` — historique

---

## Marine — Agent Téléphonique

**Slug** : `marine` | **Modèle** : `claude-sonnet-4-6` | **Couleur** : `#22D3EE`

**Rôle** : Réceptionniste IA 24/7 qui décroche, qualifie, prend RDV et gère les urgences.

**Intégrations requises** : Google Calendar, Twilio, ElevenLabs

**Stack technique** :
- Twilio Voice -> WebSocket `/api/voice/stream`
- Deepgram streaming STT (FR, Nova-2)
- Claude Sonnet 4.6 avec tools
- ElevenLabs TTS streaming

**Tools** :
- `check_calendar_availability` — vérifie les créneaux disponibles
- `create_calendar_event` — crée le RDV
- `send_sms` — SMS de confirmation
- `escalate_to_human` — urgences
- `lookup_patient` — recherche patient existant
- `add_to_callback_list` — liste de rappel

**Configuration par org** :
```json
{
  "orgName": "Cabinet Ménigoz",
  "practitionerName": "Dr. Ménigoz",
  "services": ["kinésithérapie", "thérapie manuelle"],
  "escalationPhone": "+336...",
  "appointmentDuration": 30,
  "openingHours": "Lundi-Vendredi 8h-19h, Samedi 9h-12h"
}
```

---

## Charles — Agent Personnel / Orchestrateur

**Slug** : `charles` | **Modèle** : `claude-opus-4-6` | **Couleur** : `#7C3AED`

**Rôle** : Chef d'orchestre qui comprend les instructions en langage naturel et délègue aux bons agents.

**Intégrations requises** : Gmail, Google Calendar, WhatsApp (Twilio)

**Tools** :
- `delegate_to_agent` — délègue une tâche à un agent spécialisé
- `query_agent_logs` — récupère l'activité d'un agent
- `read_calendar` / `create_event` — gestion agenda
- `send_email_draft` — prépare un email pour validation
- `search_memory` / `save_memory` — mémoire long-terme (pgvector)
- `generate_daily_brief` — brief matinal
- `trigger_n8n_workflow` — déclenche n'importe quel workflow

---

## Lou — Agent Contenu & SEO

**Slug** : `lou` | **Modèle** : `claude-opus-4-6` | **Couleur** : `#F472B6`

**Rôle** : Rédige, optimise et publie du contenu sur tous les canaux.

**Intégrations requises** : WordPress, n8n ou Make (LinkedIn, Instagram)

**Tools** : `scrape_url`, `generate_content_plan`, `write_article`, `generate_social_post`, `publish_wordpress`, `publish_via_n8n`, `generate_carousel_slides`, `analyze_seo`

---

## Elio — Agent Commercial

**Slug** : `elio` | **Modèle** : `claude-sonnet-4-6` | **Couleur** : `#10B981`

**Rôle** : Prospection, qualification, relances et scoring des réponses.

**Intégrations requises** : Gmail, Dropcontact/Hunter (optionnel)

**Interface** : Kanban `/dashboard/agents/elio` + Séquences `/dashboard/agents/elio/sequences`

---

## Mae — Agent Mail

**Slug** : `mae` | **Modèle** : `claude-sonnet-4-6` | **Couleur** : `#F59E0B`

**Rôle** : Trie la boîte, rédige des réponses, hiérarchise.

**Intégrations requises** : Gmail ou Outlook

---

## Max — Agent Photo & Vidéo

**Slug** : `max` | **Modèle** : `claude-sonnet-4-6` | **Couleur** : `#EC4899`

**Rôle** : Génération et édition visuelle via Replicate (Flux 1.1 Pro).

**Intégrations requises** : Replicate, Supabase Storage

---

## Nova — Agent Business

**Slug** : `nova` | **Modèle** : `claude-opus-4-6` | **Couleur** : `#6366F1`

**Rôle** : Assistant stratégique avec accès aux données financières.

**Intégrations requises** : Stripe, Shopify (optionnel), Qonto (optionnel)

---

## Alba — Agent RH

**Slug** : `alba` | **Modèle** : `claude-sonnet-4-6` | **Couleur** : `#8B5CF6`

**Rôle** : Tri CV, contrats, FAQ salariés.

**Intégrations requises** : Gmail, Google Calendar


