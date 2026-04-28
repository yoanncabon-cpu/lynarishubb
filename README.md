![Build](https://img.shields.io/badge/build-passing-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![License](https://img.shields.io/badge/license-Private-red)

# Lynaris

Plateforme SaaS d'agents IA autonomes pour TPE/PME. 9 agents specialises (telephonie, contenu, prospection, mail, visuels, analytics, RH, automatisation) pilotables depuis un dashboard ou WhatsApp.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Styling | Tailwind CSS v4, Framer Motion |
| Langage | TypeScript (strict mode) |
| Auth & DB | Supabase (Auth, Postgres, RLS) |
| Paiements | Stripe (Checkout, Billing Portal, Webhooks) |
| Voix IA | ElevenLabs (TTS), Deepgram (STT), Twilio (telephonie) |
| LLM | Anthropic Claude (agents, orchestration) |
| Emails | Resend (transactionnel) |
| Jobs | Inngest (taches longues, crons) |
| Rate limiting | Upstash Redis |
| Monitoring | Sentry (erreurs), Axiom (logs) |
| Images | Replicate / Flux |

## Setup rapide

### Prerequis

- Node.js >= 20
- npm >= 10
- Un compte Supabase (projet + cles API)
- Un compte Stripe (mode test)

### Installation

```bash
git clone <repo-url> lynaris
cd lynaris
cp .env.example .env.local
# Remplir les variables dans .env.local (voir section ci-dessous)
npm install
npm run dev
```

L'app tourne sur `http://localhost:3000`.

### Variables d'environnement

Toutes les variables requises sont documentees dans `.env.example`. Les essentielles pour le dev local :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cle publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service Supabase (backend only) |
| `ANTHROPIC_API_KEY` | Cle API Anthropic (Claude) |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Cle publique Stripe |
| `RESEND_API_KEY` | Cle API Resend |
| `INTEGRATIONS_ENCRYPTION_KEY` | Cle AES-256 pour chiffrer les tokens d'integration |

Voir `.env.example` pour la liste complete avec commentaires.

## Commandes

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # ESLint (zero warnings)
npm run lint:fix     # ESLint avec auto-fix
npm run typecheck    # Verification TypeScript
npm run format       # Prettier (ecriture)
npm run format:check # Prettier (verification)
```

## Architecture

```
src/
  app/
    (marketing)/     # Site public (home, agents, tarifs, contact, legal)
    (auth)/          # Connexion, inscription, magic-link
    (app)/           # Dashboard (agents, integrations, billing, settings, team)
  components/
    marketing/       # Composants du site marketing
    shared/          # Composants reutilisables (GlowCard, NumberTicker, etc.)
    ui/              # Primitives UI (Button, Badge, Card, Input)
  lib/
    agents/          # Logique metier des agents IA
    auth/            # Helpers d'authentification
    billing/         # Logique Stripe
    db/              # Queries et types Supabase
    email/           # Client Resend (welcome, notifications)
    emails/          # Templates + sendEmail helper
    integrations/    # Connexions services tiers
    utils.ts         # Utilitaires (cn, formatPrice, slugify)
  styles/
  content/
```

### Schema simplifie

```
Browser / WhatsApp
       |
  Next.js 16 App Router  (Vercel Edge)
       |
  +-----------+-----------+-----------+
  |           |           |           |
Supabase   Stripe    Anthropic    Resend
(Auth/DB)  (billing) (LLM/agents) (email)
       |
  Agent executor  ─────────────────────────
  (streaming SSE)       |         |        |
       |            Twilio   ElevenLabs  Replicate
  9 Agents slugs    (voice)    (TTS)      (images)
```

### Phases du projet

1. **Phase 1 (actuelle)** — Site marketing complet, pages agents, tarifs, legal
2. **Phase 2** — Authentification Supabase, onboarding, dashboard de base
3. **Phase 3** — Integration Stripe, gestion des abonnements
4. **Phase 4** — Agents IA operationnels (Marine en premier)
5. **Phase 5** — Multi-tenancy, equipes, API publique

## Agents disponibles

| Agent | Slug | Modele | Role | Integrations cles |
|-------|------|--------|------|-------------------|
| Marine | `marine` | Sonnet 4.6 | Receptionniste telephonique 24/7 | Google Calendar, Twilio, ElevenLabs |
| Charles | `charles` | Opus 4.6 | Orchestrateur / assistant personnel | Gmail, Google Calendar, WhatsApp |
| Lou | `lou` | Opus 4.6 | Contenu & SEO | WordPress, LinkedIn, Instagram |
| Elio | `elio` | Sonnet 4.6 | Commercial — prospection & relances | Gmail, Dropcontact |
| Mae | `mae` | Sonnet 4.6 | Tri et reponse mail | Gmail, Outlook |
| Max | `max` | Sonnet 4.6 | Generation photo & video | Replicate (Flux 1.1 Pro) |
| Nova | `nova` | Opus 4.6 | Assistant business & finances | Stripe, Shopify, Qonto |
| Alba | `alba` | Sonnet 4.6 | Ressources humaines | Gmail, Google Calendar |
| Orion | `orion` | Opus 4.6 | Automatisation de workflows | n8n |

Chaque agent est defini dans `src/lib/agents/prompts/{slug}.ts` et enregistre dans `src/lib/agents/registry.ts`.

Les endpoints :
- `POST /api/agents/{slug}/chat` — streaming SSE
- `POST /api/agents/{slug}/run` — one-shot
- `GET  /api/agents/{slug}/logs` — historique

## Deploiement

### Vercel (recommande)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/votre-org/lynaris)

1. Connecter le repo GitHub a Vercel
2. Ajouter les variables d'environnement (voir tableau ci-dessous)
3. Deployer — build automatique a chaque push sur `main`

### Variables requises en production

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Cle publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Cle service Supabase (backend) |
| `ANTHROPIC_API_KEY` | oui | Cle Claude (agents) |
| `STRIPE_SECRET_KEY` | oui | Cle secrete Stripe |
| `STRIPE_WEBHOOK_SECRET` | oui | Secret webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | oui | Cle publique Stripe |
| `RESEND_API_KEY` | oui | Emails transactionnels |
| `INTEGRATIONS_ENCRYPTION_KEY` | oui | AES-256 pour tokens tiers |
| `UPSTASH_REDIS_REST_URL` | oui | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | oui | Rate limiting |
| `TWILIO_ACCOUNT_SID` | Marine | Telephonie |
| `TWILIO_AUTH_TOKEN` | Marine | Telephonie |
| `ELEVENLABS_API_KEY` | Marine | TTS voix |
| `REPLICATE_API_TOKEN` | Max | Generation images |

### Webhooks a configurer

- Stripe : `https://votre-domaine.com/api/webhooks/stripe`
- Twilio Voice : `https://votre-domaine.com/api/voice/stream`

## Contribuer

### Conventions git

Ce projet suit [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajout de l'agent Nova
fix: correction du streaming SSE pour Marine
chore: mise a jour des dependances
docs: mise a jour AGENTS.md
refactor: simplification executor.ts
```

### Avant de pusher

```bash
npm run typecheck   # zero erreurs TypeScript
npm run lint        # zero warnings ESLint
npm run format:check # formatting Prettier OK
```

### Ajouter un agent

1. Creer `src/lib/agents/prompts/{slug}.ts` (exporter `AgentPrompt`)
2. Enregistrer dans `src/lib/agents/registry.ts`
3. Ajouter la page `src/app/(app)/dashboard/agents/{slug}/page.tsx`
4. Documenter dans `AGENTS.md`

## Choix techniques

Les decisions d'architecture sont documentees dans [DECISIONS.md](./DECISIONS.md).
