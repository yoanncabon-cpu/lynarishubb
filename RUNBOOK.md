# Lynaris — Runbook

## Marine — Agent vocal

### Architecture

```
Appel entrant
  -> Twilio Voice (webhook POST /api/voice/incoming)
  -> TwiML <Connect><Stream> -> WebSocket /api/voice/stream
  -> src/server/voice-ws.ts (port 3001)
       |
       +-- Deepgram streaming STT (mulaw 8kHz -> texte FR)
       +-- Claude Sonnet streaming (tools Marine: calendar, SMS)
       +-- ElevenLabs TTS streaming (texte -> mulaw 8kHz)
       +-- Audio back to Twilio WebSocket -> Caller

Fin d'appel
  -> Twilio status callback POST /api/voice/status
  -> Save transcript, generate summary
```

### Prerequis

| Service | Usage | Dashboard |
|---------|-------|-----------|
| Twilio | Appels entrants/sortants + SMS | console.twilio.com |
| Deepgram | STT streaming (Nova-2, FR) | console.deepgram.com |
| ElevenLabs | TTS (eleven_multilingual_v2) | elevenlabs.io |
| Anthropic | LLM (Claude Sonnet) | console.anthropic.com |

### Variables d'environnement

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID_MARINE=...
DEEPGRAM_API_KEY=...
DEMO_TWILIO_ACCOUNT_SID=AC...
DEMO_TWILIO_AUTH_TOKEN=...
DEMO_TWILIO_NUMBER=+33...
VOICE_WS_PORT=3001
```

### Configuration Twilio

1. **Numero entrant** : dans Twilio Console > Phone Numbers > ton numero
2. **Voice webhook** : `POST https://ton-domaine.com/api/voice/incoming?org=demo&agent=marine`
3. **Status callback** : `POST https://ton-domaine.com/api/voice/status?org=demo`
4. **MediaStream** : gere automatiquement par le TwiML genere par `/api/voice/incoming`

### Lancement du serveur WebSocket

```bash
# Developpement (avec tsx pour le hot reload)
npx tsx src/server/voice-ws.ts

# Production (compiler d'abord)
npx tsc -p tsconfig.server.json
node dist/server/voice-ws.js

# Avec un port custom
VOICE_WS_PORT=3002 npx tsx src/server/voice-ws.ts
```

Le serveur WebSocket tourne en parallele de Next.js. Next.js App Router ne supporte pas les WebSocket natifs — d'ou le serveur standalone.

Sur IONOS : utiliser PM2 ou systemd pour garder le process actif.

```bash
# PM2
pm2 start "npx tsx src/server/voice-ws.ts" --name marine-voice
pm2 save
```

### Procedure de debug

1. **Logs Twilio** : Console > Monitor > Logs > Calls. Verifier que le webhook `/api/voice/incoming` repond 200 avec du TwiML valide.

2. **WebSocket** : verifier que le serveur voice-ws ecoute bien sur le port configure. Les logs `[Voice]` dans stdout montrent les evenements :
   - `[Voice] WebSocket connected` — Twilio s'est connecte
   - `[Voice] Call started` — stream demarre, callSid visible
   - `[Voice] Call ended` — stream termine

3. **Deepgram** : dashboard console.deepgram.com > Usage. Verifier que les requetes arrivent et que le modele `nova-2` est utilise avec `language=fr`.

4. **ElevenLabs** : si pas d'audio retour, verifier :
   - `ELEVENLABS_API_KEY` est set
   - `output_format=ulaw_8000` est supporte par la voix choisie
   - Le quota n'est pas epuise

5. **Claude** : si pas de reponse textuelle, verifier les logs `[Voice] Claude error`. Causes frequentes : quota API, modele non disponible, prompt trop long.

### Timeouts

- Twilio MediaStream : 4h max (configurable dans Twilio Console)
- Deepgram WebSocket : timeout inactivite 10s (configurable via `utterance_end_ms`)
- Claude streaming : timeout SDK par defaut (10min)
- ElevenLabs TTS : timeout fetch 30s

### Securite

- Les credentials Twilio ne sont jamais logges
- Les callSid sont tronques a 6 chars dans les logs (pas de PII)
- Les transcriptions en memoire sont purgees a la fin de l'appel
- En production : valider la signature Twilio sur le webhook incoming (X-Twilio-Signature)

---

## Analyse complète du site & Plan d'amélioration (2026-04-24)

### Bugs résolus dans cette session

| # | Fichier | Problème | Statut |
|---|---------|----------|--------|
| 1 | `src/components/marketing/CtaSection.tsx` | Numéro de téléphone réel exposé publiquement | ✅ SUPPRIMÉ |
| 2 | `src/components/app/Sidebar.tsx` | Page Documents absente de la navigation | ✅ AJOUTÉ |
| 3 | `src/components/marketing/AgentsSection.tsx` | Avatars = carré avec initiale (pas convaincant) | ✅ Vrais avatars SVG 3D |
| 4 | `src/components/marketing/TestimonialsSection.tsx` | Témoignages sans contexte agent | ✅ Badge agent + avatar ajouté |

### Landing page — Améliorations livraison Sprint 1

- **DemoConversationSection** (nouveau composant) : Section animée montrant une conversation live Charles → Lou avec planification de post LinkedIn. Déclenchée au scroll via IntersectionObserver.
- **AgentsSection** : Avatars SVG clay 3D (AgentAvatar) remplacent les initiales dans les cartes.
- **TestimonialsSection** : Chaque témoignage affiche un badge avec l'agent utilisé + son rôle.

### Landing page — Sprint 2 (à faire)

- [ ] Section "Résultats concrets" avec métriques clients (-40% admin, 2x trafic SEO, +3 RDV/sem)
- [ ] HeroSection : ajouter CTA secondaire "Voir la démo" anchor-scrollant vers DemoConversationSection
- [ ] StatsSection : basculer sur des chiffres réels dès que disponibles
- [ ] AgentsSection : ajouter lien `/agents` avec page dédiée par agent (fiche complète)
- [ ] SEO : ajouter structured data JSON-LD (Organization + FAQPage)

### Dashboard — Features Limova manquantes (Sprint 2)

#### Super-pouvoirs — Wizard multi-étapes
Les screenshots Limova montrent un wizard 4 étapes pour chaque skill :
1. Descriptif libre
2. Sélection des réseaux sociaux (toggle LinkedIn/Facebook/Instagram)
3. Date et heure de publication (Planifier / Publier maintenant)
4. Aperçu et confirmation

**Fichier** : `src/app/(app)/dashboard/skills/page.tsx`
**Action** : Ajouter `SkillWizardModal` avec stepper interne

#### Chat — Partage de conversation
Modale "Partager la conversation" avec 3 niveaux de confidentialité :
- Privée (accessible uniquement par vous)
- Partagée avec des membres spécifiques
- Partagée avec l'espace de travail (lecture seule)

**Fichier** : `src/app/(app)/dashboard/agents/[slug]/_components/AgentChatTab.tsx`
**Action** : Bouton "Partager" dans le chat header + `ShareConversationModal`

#### Intégrations — Logos SVG officiels
Le catalogue actuel utilise des initiales colorées. Ajouter les logos officiels via CDN Clearbit ou assets locaux.

**Fichier** : `src/app/(app)/dashboard/integrations/page.tsx`
**Action** : Remplacer les `initial` par `<img src={logo_url} />` pour les providers majeurs

#### Conversations — Historique enrichi
Page `/dashboard/conversations` actuellement vide.
**Action** : Implémenter liste paginée des conversations avec filtres (agent, date, type)

### Variables d'environnement complètes requises

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Twilio (Marine)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ElevenLabs (Marine)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_MARINE=

# Deepgram (Marine)
DEEPGRAM_API_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://app.lynaris.ai
```

### Architecture des agents — Rappel

```
src/lib/agents/
  registry.ts          — liste tous les agents
  executor.ts          — run loop + streaming SSE
  prompts/
    marine.ts          — system prompt Marine (réceptionniste vocale)
    charles.ts         — system prompt Charles (orchestrateur)
    lou.ts             — system prompt Lou (contenu & SEO)
    elio.ts            — system prompt Elio (commercial)
    mae.ts             — system prompt Mae (mail)
    ...
  tools/
    index.ts           — tous les tools (calendar, SMS, email, n8n...)
  data.ts              — metadata des agents (slug, color, role, tags)

src/components/shared/
  AgentAvatar.tsx      — 9 avatars SVG clay 3D uniques
```

### Priorités

**Sprint 2 (cette semaine)** :
1. Wizard Super-pouvoirs (4 étapes)
2. Modal partage conversation
3. Logos SVG dans Intégrations
4. Section résultats landing page

**Sprint 3 (semaine prochaine)** :
1. Conversations historique paginé
2. Onboarding wizard post-signup
3. SEO structured data
4. Analytics réels Supabase dans dashboard

---

## Implémentations récentes — Itérations 1-4 (2026-04-24)

### Itération 1 — Fondations SaaS
- Onboarding wizard 4 étapes (`/onboarding`) avec secteur, agents recommandés, confetti CSS
- NotificationProvider global (toasts, hook `useNotifications()`)
- LimovaNav mobile responsive (drawer + hamburger)
- Pages 404/500 premium
- sitemap.ts, robots.ts, SEO OG metadata
- Rate limiting API chat (20 req/min par IP, in-memory)

### Itération 2 — Données réelles
- Conversations Supabase (`/api/conversations`, `/api/conversations/[id]/messages`)
- SSE activité temps réel (`/api/activity/stream`, hook `useActivityStream`)
- Analytics API (`/api/analytics`) avec fallback mock
- OG Image dynamique (`/og/route.tsx`, `opengraph-image.tsx`)
- Topbar : breadcrumb, user avatar initiales, notifications panel, Cmd+K

### Itération 3 — Features cœur
- Analytics page complète : line chart SVG, donut chart, bar chart, tableau agents
- Elio kanban prospects 5 colonnes avec scoring et avancement
- Charles Memory System : API, hook, onglet dédié dans l'interface
- Marine status banner (Twilio check, live stats)
- Tool use visualization dans le chat (cards animées)

### Itération 4 — Outils réels
- Tool `scrape_url` : fetch réel avec strip HTML
- Tool `write_article` : génération Claude Haiku
- Tool `generate_social_post` : adapté par plateforme
- Tool `analyze_seo` : analyse + recommendations Claude
- Tool `list_unread_emails` : Google API + fallback mock
- Tool `get_stripe_metrics` : API Stripe live + fallback demo
- Agent detail page : header stats, timeline logs, filtres
- Create agent wizard 3 étapes avec templates

### Architecture complète des routes API

```
/api/agents/[slug]/chat          POST — SSE streaming (rate limited 20/min)
/api/agents/[slug]/run           POST — One-shot execution
/api/agents/[slug]/logs          GET  — Historique des runs
/api/agents/[slug]/settings      GET/POST — Config agent
/api/agents/charles/memory       GET/POST/DELETE — Mémoire long-terme
/api/conversations               GET/POST — Conversations
/api/conversations/[id]/messages GET/POST — Messages
/api/analytics                   GET  — Métriques dashboard
/api/activity/stream             GET  — SSE activité temps réel
/api/integrations/status         GET  — Status toutes intégrations
/api/integrations/google/connect GET  — OAuth Google
/api/integrations/[p]/connect    POST — Connexion provider
/api/billing/credits/balance     GET  — Solde crédits
/api/billing/credits/recharge    POST — Recharge Stripe
/api/billing/portal              POST — Portail Stripe
/api/keys                        GET/POST — Clés API
/api/keys/[id]                   DELETE — Révoquer clé
/api/voice/status-live           GET  — Status Marine
/api/og                          GET  — OG Image dynamique
```
