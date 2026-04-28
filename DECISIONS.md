# DECISIONS.md — Lynaris Platform
> Décisions techniques, justifications, questions ouvertes.
> Mis à jour à chaque ajout de dépendance ou changement d'architecture.

---

## STACK FINALE RETENUE

### Framework Web
**Next.js 15 (App Router)** — RSC natifs, API routes edge/node, Turbopack dev, middleware edge, OG images. Standard du marché, déploiement Vercel natif, écosystème le plus riche. Pas de justification à écrire pour une alternative : c'est le choix évident pour cette architecture.

### Langage
**TypeScript 5.x strict** — `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. Zéro `any` sans commentaire.

### Base de données
**Supabase EU (Postgres)** — Hosting Frankfurt, RLS natif, Realtime, Storage, Auth, pgvector extension. ORM : **Drizzle ORM** (type-safe, migrations SQL lisibles, perf supérieure à Prisma, zero-runtime overhead).

### Auth
**Supabase Auth** — magic link + OAuth Google natif, JWT avec claims custom (`org_id`, `role`), session côté serveur via `@supabase/ssr`. Multi-tenant via `organizations.id` dans les JWT claims. Simple, intégré, pas de vendor supplémentaire.

### Styling
**Tailwind CSS v4** + **shadcn/ui** (base de composants, override complet pour matcher charte Lynaris). Variables CSS custom `--ly-*` définies dans `globals.css`.

### Fonts
**Geist** (display + body, `next/font`) + **Geist Mono** (code). Auto-optimisé par Next.js.

### Animations
**Framer Motion 11** — scroll reveal, magnétisme, transitions page. **Three.js** via `@react-three/fiber` + `@react-three/drei` pour le hero. CSS transitions pour micro-interactions simples.

### IA
**`@anthropic-ai/sdk`** officiel — streaming avec `stream()`, tool use, models par agent documentés dans registry.

### Vocal (Marine)
- STT : **Deepgram** (streaming, FR, <300ms latence)
- TTS : **ElevenLabs** (streaming, voix FR feminine)
- Téléphonie : **Twilio** (Voice SDK + WebSockets)

### Email transactionnel
**Resend** + **React Email** pour les templates.

### Paiement
**Stripe** — Checkout, Portal, webhooks, usage records.

### Queue / Jobs longs
**Inngest** — serverless, retry, cron, fan-out, intégration Next.js native. Choisi vs Trigger.dev car DX supérieure et pricing plus prévisible.

### Automatisation
**n8n** self-hosted (IONOS Yoann) — bus universel. Communication via REST API n8n + webhooks signés HMAC SHA256.

### Rate Limiting
**Upstash Redis** (via `@upstash/ratelimit`) — serverless, edge-compatible, pricing à l'usage.

### Monitoring
- Erreurs : **Sentry** (Next.js SDK)
- Logs : **Axiom** (structured logging, query rapide)
- Analytics web : **Vercel Analytics** + **Plausible**

### Stockage fichiers
**Supabase Storage** (EU, S3-compatible).

### Recherche / RAG
**pgvector** sur Supabase + **`ai` SDK Vercel** pour les embeddings (via API Anthropic ou OpenAI text-embedding-3-small selon coût).

### Tests
**Vitest** (unit + integration) + **Playwright** (E2E). Coverage : c8.

### Linting / Formatting
**ESLint** (config Next.js + plugin typescript) + **Prettier** (single quote, semi: false, 100 chars).

### CI/CD
**GitHub Actions** — lint + typecheck + build + vitest à chaque push. Deploy preview Vercel sur PR.

---

## DÉPENDANCES CLÉS (justification obligatoire)

| Package | Raison |
|---|---|
| `@anthropic-ai/sdk` | SDK officiel Anthropic, streaming natif |
| `drizzle-orm` + `drizzle-kit` | ORM type-safe, migrations SQL lisibles |
| `@supabase/supabase-js` + `@supabase/ssr` | Client DB + Auth SSR-compatible |
| `framer-motion` | Animations déclaratives React |
| `@react-three/fiber` + `@react-three/drei` + `three` | Hero 3D WebGL |
| `@upstash/ratelimit` + `@upstash/redis` | Rate limiting edge serverless |
| `inngest` | Queue + cron sans infra |
| `resend` + `@react-email/components` | Emails transactionnels typés |
| `stripe` | Paiement checkout + portail |
| `twilio` | Voice + SMS + WhatsApp |
| `@deepgram/sdk` | STT streaming FR |
| `elevenlabs` | TTS streaming |
| `sentry` | Error tracking |
| `cmdk` | Palette commandes `cmd+K` |
| `recharts` | Charts dashboard Nova |
| `@dnd-kit/core` | Drag & drop Kanban Elio |
| `react-pdf` | Génération PDF rapports Nova |
| `zod` | Validation schemas partout |
| `jose` | JWT signing pour HMAC webhooks |
| `lucide-react` | Icônes SVG (Heroicons fallback) |

---

## CLARIFICATIONS YOANN (2026-04-23)

### Numéro Twilio → BYOT (Bring Your Own Twilio)
Chaque client configure son propre numéro Twilio dans ses paramètres d'intégration.
Lynaris fournit le TwiML endpoint, le client pointe son numéro dessus.
Pas de numéro Lynaris central. La page démo `/agents/marine` utilisera un numéro Twilio propre à Lynaris (env var `DEMO_TWILIO_NUMBER`).

### Make / n8n → BYON (Bring Your Own Automation)
Chaque client saisit son propre webhook URL Make ou n8n dans ses intégrations.
Lynaris envoie les payloads vers cette URL (signés HMAC).
Pas d'instance n8n partagée côté Lynaris. Variables env IONOS supprimées.
L'intégration stocke : `{ provider: 'n8n' | 'make', webhook_url: string, secret: string }`.

### Unipile → SUPPRIMÉ
Pas de compte Unipile. Agent Elio recentré sur :
- Import manuel CSV de prospects
- Enrichissement email (Dropcontact/Hunter API key client)
- Rédaction de messages LinkedIn (Claude génère, client envoie manuellement ou via son propre Make)
- Séquences de relance par email (via Gmail/Outlook connecté)
- Kanban + scoring = valeur sans dépendance LinkedIn API tierce

---

## PLAN D'ATTAQUE PHASE 1

Dès ton GO :

1. `npx create-next-app@latest lynaris --typescript --tailwind --app --src-dir --import-alias "@/*"` dans le dossier courant
2. Config Tailwind v4 + variables CSS `--ly-*` + reset
3. Install Geist via `next/font`
4. shadcn/ui init + override thème
5. ESLint strict + Prettier + `tsconfig.json` strict
6. `.env.example` complet (toutes les vars documentées)
7. Structure dossiers `src/` complète (vides mais présents)
8. GitHub Action CI (lint + typecheck + build)
9. `README.md` — setup en <10 min
10. Commit `chore: initial project scaffold`

Durée estimée : 90-120 min.

---

## DÉCISIONS SESSION 2026-04-24

### Navigation : LimovaNav (5 items) remplace Sidebar complexe
Sidebar avec 20+ items remplacée par nav simplifiée inspirée de Limova (concurrent) : Accueil, Assistants, Conversations, Super-pouvoirs, Intégrations, Documents. Mobile drawer ajouté.

### Avatars agents : SVG clay 3D inline
9 avatars SVG uniques dans `AgentAvatar.tsx` — zéro dépendance CDN, rendu instantané, glow dynamique.

### Logos intégrations : Clearbit CDN + fallback initiale
`https://logo.clearbit.com/{domain}` pour 150+ apps. Fallback coloré si Clearbit indisponible.

### Rate limiting : in-memory Map (→ Upstash Redis en prod)
20 req/min par IP pour `/api/agents/[slug]/chat`. Remplaçable par 1 ligne avec Upstash.

### Onboarding : localStorage (pas Supabase synchrone)
Sauvegarde locale immédiate, Supabase alimenté en background. Évite une écriture DB dans le flux critique post-signup.

### Tool execution : in-process Next.js
Tous les tools dans `src/lib/agents/tools/index.ts`. Extractable vers Inngest si timeout 60s atteint.

### Numéro Twilio : BYOT (décision 2026-04-23 confirmée)
Le numéro `+33 9 72 55 18 42` retiré de toute la codebase (était hardcodé dans CtaSection). Chaque client configure son propre numéro Twilio.

## QUESTIONS POUR YOANN

1. **Domaine prod** : `lynaris.ai` confirmé ? Impacte les redirections OAuth et callbacks Stripe.
2. **Plan Gratuit** : Tous nouveaux users en "trial 7j" ou plan gratuit illimité avec limitations ?
3. **Resend** : Clé API Resend disponible ? Les emails transactionnels (confirmation signup, rapport Nova) ne sont pas encore envoyés.
4. **Inngest** : Quand en a-t-on besoin ? Les tool calls actuels (Replicate image gen ~30s) approchent le timeout Next.js.
5. **Pipedream** : Intégrer le vrai SDK Pipedream Connect pour 3000+ apps OAuth, ou le catalogue 150 apps actuel est suffisant ?
6. **LinkedIn/Instagram OAuth** : Les Client IDs/Secrets sont disponibles ? Les routes OAuth sont créées mais les env vars manquent.

## CHANGELOG

| Date | Décision | Raison |
|---|---|---|
| 2026-04-23 | Stack initiale définie | Prompt v2.0 Lynaris |
| 2026-04-24 | LimovaNav remplace Sidebar | UX simplifiée, inspirée Limova |
| 2026-04-24 | Numéro Twilio retiré de landing | Sécurité + BYOT strategy |
| 2026-04-24 | Clearbit pour logos intégrations | 150+ apps impossible à inline |
| 2026-04-24 | Tool execution in-process | Simplicité v1, extractable si besoin |
