# PLAN MAÎTRE LYNARIS — AUDIT & ROADMAP
**Version 1.0** | **2026-04-25** | **Ingénieur Principal**

> Document unique de référence. Synthèse exhaustive de l'état du codebase Lynaris,
> cartographie des bugs, plan de remédiation séquencé, spécifications techniques
> précises, architecture cible et checklist de mise en production.
>
> Lecture obligatoire avant tout commit en `main`.
>
> Légende statut : 🔴 CRITIQUE 🟠 HAUTE 🟡 MOYENNE 🟢 OK 🔵 FEATURE ✅ FAIT ❌ CASSÉ ⚠️ ATTENTION

---

## TABLE DES MATIÈRES

- [Résumé exécutif](#résumé-exécutif)
- [Section 1 — État des lieux global](#section-1--état-des-lieux-global)
  - [1.1 Scores par domaine](#11-scores-par-domaine)
  - [1.2 Audit pages marketing](#12-audit-pages-marketing-34-pages)
  - [1.3 Audit dashboard](#13-audit-dashboard-13-pages)
  - [1.4 Audit API routes](#14-audit-api-routes-81-endpoints)
  - [1.5 Audit composants](#15-audit-composants-61-fichiers)
  - [1.6 Tableau récapitulatif](#16-tableau-récapitulatif)
- [Section 2 — Sécurité](#section-2--sécurité)
  - [2.1 Vulnérabilités critiques](#21-vulnérabilités-critiques)
  - [2.2 Plan de remédiation ordonné](#22-plan-de-remédiation-ordonné)
  - [2.3 Hardening middleware](#23-hardening-middleware)
  - [2.4 Checklist sécurité post-fix](#24-checklist-sécurité-post-fix)
- [Section 3 — Phases d'exécution](#section-3--phases-dexécution)
  - [Phase 0 — Urgence sécurité (48h)](#phase-0--urgence-sécurité-48h)
  - [Phase 1 — Marketing fonctionnel (1 semaine)](#phase-1--marketing-fonctionnel-1-semaine)
  - [Phase 2 — Dashboard data réelle (2 semaines)](#phase-2--dashboard-data-réelle-2-semaines)
  - [Phase 3 — Features incomplètes (3 semaines)](#phase-3--features-incomplètes-3-semaines)
  - [Phase 4 — Qualité code (1 sprint)](#phase-4--qualité-code-1-sprint)
  - [Phase 5 — Performance et SEO (1 sprint)](#phase-5--performance-et-seo-1-sprint)
  - [Phase 6 — Backlog features](#phase-6--backlog-features)
- [Section 4 — Spécifications techniques](#section-4--spécifications-techniques)
- [Section 5 — Architecture cible](#section-5--architecture-cible)
- [Section 6 — Design system](#section-6--design-system)
- [Section 7 — Tests](#section-7--tests)
- [Section 8 — Priorités commerciales](#section-8--priorités-commerciales)
- [Section 9 — Checklist finale](#section-9--checklist-finale)

---

## Résumé exécutif

Lynaris est un SaaS d'agents IA pour TPE/PME françaises avec un premier client en
phase de closing (Julien Ménigoz, kinésithérapeute à Taverny, 590€/mois récurrent).
Le codebase existe sous Next.js 16, TypeScript strict, Tailwind v4, Supabase et
Drizzle. Sur 9 agents annoncés, un seul (Marine) est conçu pour passer en
production immédiate. L'audit recense **25 bugs documentés**, dont **9 critiques**
(sécurité, fake data, fonctionnalités cassées) et **15 features manquantes** qui
empêchent une mise en marché crédible.

**Le constat est simple :** 70% des pages marketing sont visuellement abouties mais
fonctionnellement incomplètes (formulaire de contact qui n'envoie rien, boutons de
téléchargement vides, mentions presse fausses). Le dashboard expose principalement
de la donnée mockée (factures hardcodées, KPIs aléatoires, contacts fictifs). Le
back-end agent est solide mais manque de hardening (rate limiting en mémoire,
endpoints publics, signatures webhook non vérifiées).

**Priorité immédiate :** sécuriser les endpoints publics et faire fonctionner le
formulaire de contact avant toute autre démarche commerciale. Le client #1 ne doit
pas découvrir un bouton mort sur le site qu'il vient signer. Tant que la priorité
"crédibilité > features" n'est pas tenue, aucun nouveau scope ne sera ouvert.

**Cap proposé :** 6 phases sur 8 à 10 semaines, livrant un produit dont chaque
ligne signée tient devant un CTO, un juriste RGPD et un pentester.

---

## Section 1 — État des lieux global

### 1.1 Scores par domaine

| Domaine | Score actuel | Objectif | Écart |
| --- | --- | --- | --- |
| Architecture front (Next.js App Router) | 7,5 / 10 | 9 / 10 | RSC sous-utilisés, Suspense partiel |
| Architecture back (API routes) | 6 / 10 | 9 / 10 | Pas de couche Result, validation Zod incomplète |
| Sécurité applicative | 4 / 10 | 9 / 10 | Endpoints publics, rate limit en mémoire |
| Données réelles vs mock | 3 / 10 | 9 / 10 | Beaucoup de hardcode dashboard |
| Qualité code TypeScript | 7 / 10 | 9,5 / 10 | Quelques `any`, peu de discriminated unions |
| Tests unitaires | 1 / 10 | 7 / 10 | Pas de Vitest, 0 spec |
| Tests E2E | 0 / 10 | 7 / 10 | Pas de Playwright |
| Accessibilité WCAG 2.2 AA | 5 / 10 | 9 / 10 | Focus-visible incomplet, alt absents |
| Performance (Core Web Vitals) | 6 / 10 | 9 / 10 | Bundle initial pas mesuré |
| SEO technique | 6 / 10 | 9 / 10 | Schema.org manque, sitemap dynamique partiel |
| SEO contenu | 5 / 10 | 8 / 10 | Pages verticales à enrichir |
| Brand voice cohérence | 7 / 10 | 9 / 10 | Quelques pages corporate plates |
| Design system | 6 / 10 | 9 / 10 | Tokens CSS partiels, hex en dur |
| Documentation interne | 5 / 10 | 8 / 10 | Manque ADR, runbooks |
| Observabilité (logs, traces, alerting) | 4 / 10 | 8 / 10 | Sentry partiel, Axiom non câblé |
| Infrastructure et déploiement | 6 / 10 | 9 / 10 | Pas de CI/CD complet |
| Conformité RGPD/CNIL | 5 / 10 | 9 / 10 | Cookie banner OK, registres absents |
| Conformité DGCCRF (mentions, CGU) | 6 / 10 | 9 / 10 | SIRET en attente |
| Crédibilité commerciale | 4 / 10 | 9 / 10 | Boutons morts, mentions presse fausses |
| Onboarding utilisateur | 5 / 10 | 8 / 10 | Parcours pas testé end-to-end |

Score global pondéré (priorité commerciale 40%, sécurité 30%, qualité 30%) :
**5,1 / 10**. Le produit n'est pas en état d'être présenté à un acheteur premium
sans corrections immédiates.

### 1.2 Audit pages marketing (34 pages)

Chaque page est notée sur 10 selon quatre critères pondérés : copywriting (25%),
design (25%), implémentation technique (25%), conversion / SEO (25%). La
justification cite les fichiers concernés et les bugs ouverts.

#### 1.2.1 Page d'accueil — `src/app/(marketing)/page.tsx`

- **Note actuelle :** 7,5 / 10
- **Points forts :** hero animé Three.js cohérent, bento section bien rythmée,
  preuve sociale claire (Cabinet Ménigoz uniquement, conforme à la règle "vrai
  uniquement"), CTA clair "Réserver une démo".
- **Points faibles :** Lighthouse non mesuré, hero scene lourde sur mobile,
  copy "Marine décroche en 7 secondes" à vérifier (chiffre source ?).
- **Actions :** mesurer LCP/INP/CLS sur mobile bas de gamme, lazy-import
  `HeroScene` et `BentoSection` sous le fold, vérifier le chiffre 7s ou le
  remplacer par formulation factuelle.
- **Statut :** 🟡 MOYENNE — fonctionnelle, optimisations performance.

#### 1.2.2 Tarifs — `src/app/(marketing)/tarifs/page.tsx`

- **Note actuelle :** 6,5 / 10
- **Points forts :** trois plans clairs, FAQ tarifaire à la suite, CTA
  cohérent.
- **Points faibles :** pas de comparateur fonctionnel, pas de toggle
  mensuel/annuel, mention "économisez 20%" non sourcée si le toggle est ajouté.
- **Actions :** ajouter toggle mensuel/annuel, ajouter calculateur ROI lié
  (BUG calculateur sync), schema.org `Product` + `Offer`.
- **Statut :** 🟡 MOYENNE.

#### 1.2.3 Contact — `src/app/(marketing)/contact/page.tsx`

- **Note actuelle :** 3 / 10
- **Bugs ouverts :** **BUG-001** — formulaire ne fait que `console.log`. Aucun
  email envoyé. Aucun stockage. La case RGPD est cochée sans aucune trace.
- **Actions :** Server Action qui appelle Resend (`contact@lynarisai.com`),
  validation Zod côté serveur, rate limit Upstash, logging Axiom, message de
  succès accessible (`role="status"`), message d'erreur clair.
- **Statut :** 🔴 CRITIQUE — bloquant pour toute campagne.

#### 1.2.4 À propos — `src/app/(marketing)/a-propos/page.tsx`

- **Note actuelle :** 6 / 10
- **Points faibles :** récit fondateur à étoffer, photo manquante (pas de fake
  photo bien sûr).
- **Actions :** ajouter section "Pourquoi Lynaris", photo réelle si Yoann est
  d'accord, sinon initiale typographique cohérente.
- **Statut :** 🟡 MOYENNE.

#### 1.2.5 Agents — index `src/app/(marketing)/agents/...`

- **Note actuelle :** 7 / 10
- **Points forts :** 9 cartes agents avec couleurs cohérentes.
- **Points faibles :** seul Marine est complet ; Charles, Lou, Elio, Mae, Max,
  Nova, Alba, Orion sont marqués mais leurs pages dédiées varient en
  profondeur.
- **Actions :** uniformiser le template, signaler clairement les statuts
  "disponible", "bêta", "à venir" via badges.
- **Statut :** 🟡 MOYENNE.

#### 1.2.6 Agent Marine — `src/app/(marketing)/agents/marine/page.tsx`

- **Note actuelle :** 8 / 10
- **Points forts :** preuve sociale Ménigoz, démo audio possible, copy concrète.
- **Points faibles :** pas de player audio réel intégré, juste un mock.
- **Actions :** intégrer un extrait vrai (avec accord Julien), bouton "Tester
  Marine" qui appelle un numéro réel.
- **Statut :** 🟡 MOYENNE.

#### 1.2.7 Agent Charles — `src/app/(marketing)/agents/charles/page.tsx`

- **Note actuelle :** 6,5 / 10
- **Points forts :** explication orchestrateur claire, diagramme.
- **Points faibles :** outils listés mais pas tous branchés en back.
- **Actions :** ne lister que les tools réellement disponibles ;
  cacher les autres derrière "Roadmap".
- **Statut :** 🟡 MOYENNE.

#### 1.2.8 Agent Elio, Mae, Lou, Max, Nova, Alba, Orion

- **Note moyenne :** 5,5 / 10
- **Points faibles communs :** copy correcte, mais features avancées non
  prouvables. Risque de promesse non tenue.
- **Actions :** retirer toute fonctionnalité non démontrable, ajouter
  badge "Bêta privée" si nécessaire.
- **Statut :** 🟡 MOYENNE.

#### 1.2.9 Page agent générique `[slug]/page.tsx`

- **Note actuelle :** 5 / 10
- **Bugs ouverts :** **BUG-005** — bouton "Copier" inactif (L.387).
- **Actions :** brancher `navigator.clipboard.writeText`, feedback visuel,
  fallback `document.execCommand` pour navigateurs anciens, annonce
  `aria-live="polite"` confirmant la copie.
- **Statut :** 🟠 HAUTE.

#### 1.2.10 Blog — `src/app/(marketing)/blog/...`

- **Note actuelle :** 5 / 10
- **Bugs ouverts :** **BUG-002** — newsletter ne capture rien (L.183
  `BlogClient.tsx`).
- **Actions :** créer table `newsletter_subscribers` (Drizzle), API
  `/api/newsletter/subscribe`, validation Zod, double-opt-in via Resend, lien
  de désinscription RGPD.
- **Statut :** 🔴 CRITIQUE.

#### 1.2.11 Docs — `src/app/(marketing)/docs/...`

- **Note actuelle :** 6 / 10
- **Points faibles :** `DocsClient.tsx` mélange Server et Client, à splitter.
- **Actions :** transformer la page en RSC + Client uniquement pour le moteur
  de recherche.
- **Statut :** 🟡 MOYENNE.

#### 1.2.12 Calculateur — `src/app/(marketing)/calculateur/page.tsx`

- **Note actuelle :** 5,5 / 10
- **Points faibles :** pas synchronisé avec la grille tarifaire, calcul
  approximatif.
- **Actions :** lier au pricing single source, ajouter un bouton "Lancer la
  démo avec ce setup".
- **Statut :** 🟡 MOYENNE.

#### 1.2.13 Cas clients — `src/app/(marketing)/cas-clients/page.tsx`

- **Note actuelle :** 4,5 / 10
- **Points faibles :** un seul cas réel (Ménigoz). Les autres entrées doivent
  être supprimées ou marquées "à venir".
- **Actions :** purger toute mention non vérifiée. Mettre en avant Ménigoz
  avec ses chiffres réels uniquement.
- **Statut :** 🟠 HAUTE.

#### 1.2.14 Carrières — `src/app/(marketing)/carrieres/page.tsx`

- **Note actuelle :** 6 / 10
- **Actions :** lister les rôles ouverts uniquement, sinon redirect.
- **Statut :** 🟡 MOYENNE.

#### 1.2.15 Changelog — `src/app/(marketing)/changelog/page.tsx`

- **Note actuelle :** 6,5 / 10
- **Actions :** alimenter automatiquement depuis les commits `feat:` / `fix:`
  via une route nightly ou une page MDX statique.
- **Statut :** 🟡 MOYENNE.

#### 1.2.16 Presse — `src/app/(marketing)/presse/page.tsx`

- **Note actuelle :** 2 / 10
- **Bugs ouverts :** **BUG-003** (download `href="#"`), **BUG-004** (mentions
  TechCrunch, Les Échos, Maddyness fausses).
- **Actions :** retirer toute la section "ils parlent de nous" jusqu'à
  obtention de vraies retombées. Pour les téléchargements, soit créer les PDF
  dans `/public/press/` (kit logo, photos officielles, fiche produit), soit
  cacher complètement la section.
- **Statut :** 🔴 CRITIQUE — viole "aucune fake data".

#### 1.2.17 Pour vertical — `src/app/(marketing)/pour/[vertical]/page.tsx`

- **Note actuelle :** 6 / 10
- **Points faibles :** template assez générique. Manque preuves spécifiques
  par métier.
- **Actions :** un cas concret par vertical avant de publier la page,
  fallback "Bientôt disponible" sinon.
- **Statut :** 🟡 MOYENNE.

#### 1.2.18 Mentions légales / CGU / Confidentialité / RGPD

- **Note actuelle :** 6 / 10
- **Actions :** mettre à jour SIRET dès réception, ajouter délégué à la
  protection des données, lien CNIL, registre des traitements.
- **Statut :** 🟠 HAUTE.

### 1.3 Audit dashboard (13 pages)

#### 1.3.1 `dashboard/page.tsx` — accueil dashboard

- **Note :** 5 / 10
- **Bugs ouverts :** KPIs aléatoires côté client, pas de fetch DB.
- **Actions :** créer un Server Component qui agrège depuis Drizzle (nb
  conversations 24h, % escalades, durée moyenne, coût IA, crédits restants),
  Suspense + skeletons, revalidation toutes les 60 s.
- **Statut :** 🟠 HAUTE.

#### 1.3.2 `dashboard/onboarding/page.tsx`

- **Note :** 6 / 10
- **Actions :** vérifier que chaque étape persiste en DB (table
  `onboarding_state` à créer ?), reprise après refresh.
- **Statut :** 🟡 MOYENNE.

#### 1.3.3 `dashboard/agents/page.tsx`

- **Note :** 6 / 10
- **Actions :** lister depuis `agent_instances`, status réel (actif, en pause,
  erreur), CTA configuration.
- **Statut :** 🟡 MOYENNE.

#### 1.3.4 `dashboard/agents/[slug]/page.tsx`

- **Note :** 6,5 / 10
- **Actions :** onglets Chat / Settings / Logs / Stats déjà présents, à câbler
  proprement.
- **Statut :** 🟡 MOYENNE.

#### 1.3.5 `dashboard/agents/elio/page.tsx`

- **Note :** 4 / 10
- **Bugs ouverts :** **BUG-019** — 10 contacts hardcodés avec faux noms.
- **Actions :** créer table `crm_contacts`, branche kanban, import CSV,
  scoring réel.
- **Statut :** 🔴 CRITIQUE.

#### 1.3.6 `dashboard/conversations/page.tsx`

- **Note :** 6 / 10
- **Actions :** pagination Drizzle, filtres par agent et statut, recherche.
- **Statut :** 🟡 MOYENNE.

#### 1.3.7 `dashboard/documents/page.tsx`

- **Note :** 5 / 10
- **Actions :** Supabase Storage déjà disponible, brancher upload réel.
- **Statut :** 🟠 HAUTE.

#### 1.3.8 `dashboard/integrations/page.tsx`

- **Note :** 5,5 / 10
- **Actions :** statuts OAuth réels (connecté, expirée, erreur), CTA
  reconnect, gestion `integrations.status`.
- **Statut :** 🟡 MOYENNE.

#### 1.3.9 `dashboard/settings/page.tsx`

- **Note :** 3 / 10
- **Bugs ouverts :** **BUG-022** — page quasi-vide.
- **Actions :** sections Profil, Organisation, Notifications, Sécurité (2FA,
  sessions actives, mots de passe), API keys management complet,
  facturation rapide, langue/timezone.
- **Statut :** 🔴 CRITIQUE.

#### 1.3.10 `dashboard/skills/page.tsx`

- **Note :** 5 / 10
- **Actions :** différencier "skills natifs Lynaris" vs "skills custom org",
  marketplace future en backlog.
- **Statut :** 🟡 MOYENNE.

#### 1.3.11 `dashboard/team/page.tsx`

- **Note :** 4 / 10
- **Bugs ouverts :** **BUG-021** — invitation stockée localStorage.
- **Actions :** API `/api/team/invite` qui crée un token, envoie un email
  Resend, expire 7 jours, lie à `users.org_id` à acceptation.
- **Statut :** 🔴 CRITIQUE.

#### 1.3.12 `dashboard/analytics/page.tsx`

- **Note :** 4 / 10
- **Bugs ouverts :** **BUG-014** — données pseudo-aléatoires depuis seed daté.
- **Actions :** route `/api/analytics` qui agrège depuis `agent_logs`,
  `messages`, `billing_events`, `conversations`. Charts via Recharts ou
  `@tremor/react`.
- **Statut :** 🟠 HAUTE.

#### 1.3.13 `dashboard/billing/page.tsx`

- **Note :** 3,5 / 10
- **Bugs ouverts :** **BUG-010**, **BUG-011**, **BUG-012**, **BUG-013**.
- **Actions :** liste vraie de factures Stripe, téléchargement PDF via
  `invoice.invoice_pdf`, recharge crédits opérationnelle, cohérence
  planId/plan_id.
- **Statut :** 🔴 CRITIQUE.

#### 1.3.14 `dashboard/workspace/page.tsx`

- **Note :** 4 / 10
- **Bugs ouverts :** **BUG-020** — upload simulé.
- **Actions :** intégrer Supabase Storage `workspace-files`, contrôle MIME,
  taille max 25 Mo, anti-virus si possible (ClamAV via worker), preview PDF.
- **Statut :** 🟠 HAUTE.

#### 1.3.15 `dashboard/crm/...`

- **Note :** 4 / 10
- **Actions :** brancher sur table `crm_contacts`, intégration Pipedrive ou
  HubSpot prévue plus tard, mode "stand-alone" suffisant pour MVP.
- **Statut :** 🟡 MOYENNE.

### 1.4 Audit API routes (81 endpoints)

Synthèse rapide endpoint par endpoint, statut sécurité, validation Zod, rate
limit, ownership check.

| Endpoint | Méthode | Auth | Zod in | Zod out | Rate limit | Ownership | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/auth/callback` | GET | Supabase | Partiel | Non | Non | N/A | 🟡 |
| `/api/agents/[slug]/chat` | POST | Cookie | Oui | N/A (SSE) | Mémoire | Implicite | 🔴 BUG-006 |
| `/api/agents/[slug]/run` | POST | Cookie | Oui | Oui | Aucun | Implicite | 🟠 |
| `/api/agents/[slug]/stats` | GET | Cookie | N/A | Oui | Non | Implicite | 🟡 |
| `/api/agents/[slug]/logs` | GET | Cookie | Query Zod | Oui | Non | Implicite | 🟡 |
| `/api/agents/[slug]/settings` | GET/POST | Cookie | Oui | Oui | Non | Implicite | 🟡 |
| `/api/agents/elio/import` | POST | Cookie | Partiel | Oui | Non | Implicite | 🟠 |
| `/api/agents/elio/prospects` | GET/POST | Cookie | Oui | Oui | Non | Implicite | 🟡 |
| `/api/agents/elio/prospects/[id]` | GET/PATCH/DELETE | Cookie | Oui | Oui | Non | Implicite | 🟡 |
| `/api/agents/elio/score` | POST | Cookie | Oui | Oui | Non | Implicite | 🟡 |
| `/api/charles/memory` | POST/GET | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/conversations` | GET/POST | Cookie | Oui | Oui | Non | Implicite | 🟡 |
| `/api/billing/checkout` | POST | Cookie | Oui | Oui | Non | **Non** | 🔴 BUG-008 |
| `/api/billing/credits/autorecharge` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/billing/credits/recharge` | POST | Cookie | À créer | À créer | Non | À créer | 🔴 BUG-010 |
| `/api/billing/credits/[orgId]` | GET | Cookie | N/A | Oui | Non | Oui | 🟡 |
| `/api/billing/portal` | POST | Cookie | N/A | Oui | Non | Oui | 🟡 |
| `/api/billing/usage` | GET | Cookie | Query Zod | Oui | Non | Oui | 🟡 |
| `/api/billing/invoices` | GET | Cookie | À créer | À créer | Non | À créer | 🔴 |
| `/api/webhooks/stripe` | POST | Signature | Oui | N/A | Non | N/A | 🟢 |
| `/api/webhooks/n8n` | POST | TODO | Partiel | N/A | Non | N/A | 🔴 BUG-017 |
| `/api/webhooks/make` | POST | TODO | Partiel | N/A | Non | N/A | 🔴 BUG-017 |
| `/api/integrations/google/...` | GET/POST | Cookie | Partiel | Oui | Non | Oui | 🟡 |
| `/api/integrations/twilio/...` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/integrations/elevenlabs/...` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/integrations/n8n/...` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/integrations/make/...` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/integrations/stripe/...` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/voice/incoming` | POST | **Aucune** | Oui (TwiML) | XML | Non | N/A | 🔴 BUG-009 |
| `/api/voice/stream` | WS | Twilio | Stream | Stream | Non | N/A | 🟠 |
| `/api/voice/status` | POST | Twilio sig | Oui | OK | Non | N/A | 🟡 |
| `/api/keys` | GET/POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/keys/[id]` | DELETE | Cookie | N/A | Oui | Non | Oui | 🟡 |
| `/api/settings/profile` | GET/POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/settings/org` | GET/POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/settings/billing` | GET | Cookie | N/A | Oui | Non | Oui | 🟡 |
| `/api/settings/notifications` | GET/POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/team/members` | GET | Cookie | N/A | Oui | Non | Oui | 🟡 |
| `/api/team/invite` | POST | Cookie | À créer | À créer | À créer | À créer | 🔴 BUG-021 |
| `/api/analytics` | GET | Cookie | Query Zod | Oui | Non | Oui | 🟠 |
| `/api/activity/stream` | SSE | Cookie | N/A | Stream | Non | Oui | 🟡 |
| `/api/onboarding/provision` | POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/cron/trial-check` | GET | CRON_SECRET | N/A | Oui | N/A | N/A | 🟡 |
| `/api/cron/cleanup-logs` | GET | CRON_SECRET | N/A | Oui | N/A | N/A | 🟡 |
| `/api/crm/contacts` | GET/POST | Cookie | Oui | Oui | Non | Oui | 🟡 |
| `/api/health` | GET | **Aucune** | N/A | Oui | Non | N/A | 🟠 BUG-018 |
| `/api/newsletter/subscribe` | POST | Aucune | À créer | À créer | À créer | N/A | 🔴 BUG-002 |
| `/api/contact` | POST | Aucune | À créer | À créer | À créer | N/A | 🔴 BUG-001 |

(Les autres endpoints sont des sous-routes ou helpers qui suivent les mêmes
patterns.)

### 1.5 Audit composants (61 fichiers)

#### 1.5.1 UI primitifs (shadcn) — `src/components/ui/`

`button`, `input`, `textarea`, `card`, `badge`, `separator`, `skeleton`,
`tooltip`. Bonne base, mais :

- Le bouton primaire doit garantir 44×44 px (touch target).
- Le focus-visible doit utiliser un ring contrasté 3:1 minimum.
- Les variants doivent être typés via discriminated unions.

#### 1.5.2 Shared

`GlowCard`, `MagneticButton`, `NumberTicker`, `TypewriterText`,
`GradientBlob`, `StreamingMessageBubble`, `StatusBadge`, `AgentAvatar`,
`EmptyState`, `CookieBanner`. Vérifications :

- `MagneticButton` doit respecter `prefers-reduced-motion`.
- `TypewriterText` doit être annoncé en `aria-live="polite"`.
- `CookieBanner` doit être conforme CNIL : refus aussi simple qu'accepter,
  pas de cookies déposés avant consentement explicite.

#### 1.5.3 Marketing (18 composants)

`Navbar`, `HeroSection`, `HeroTerminal`, `HeroScene`, `AgentsSection`,
`BentoSection`, `IntegrationsSection`, `PricingSection`, `FaqSection`,
`TestimonialsSection`, `ResultsSection`, `StatsSection`,
`HowItWorksSection`, `CtaSection`, `DemoConversationSection`, `LogosStrip`,
`Footer`, `StructuredData`.

- `LogosStrip` : pas de logos clients fictifs. Si <3 vrais logos, retirer le
  composant.
- `TestimonialsSection` : Ménigoz uniquement.
- `StatsSection` : aucune stat sans source vérifiable.

#### 1.5.4 App / Glass (7 composants)

`Glass`, `MeshBackground`, `StatusDot`, `Ticker`, `Sparkline`, `GlassButton`,
`AgentAvatarGlass`. Tous OK, à condition :

- `Ticker` doit pouvoir être mis en pause clavier (a11y).
- `GlassButton` doit avoir focus-visible visible sur fond clair ET sombre.

#### 1.5.5 App / Dashboard (7 composants)

`GlassSidebar`, `GlassTopbar`, `CharlesFab`, `MarineCard`, `KpiCard`,
`ElioCard`, `ActivityFeed`. Tous fonctionnels mais souvent alimentés par
mock — à brancher sur la DB.

### 1.6 Tableau récapitulatif

| Catégorie | Total | OK | À fixer | Critiques |
| --- | --- | --- | --- | --- |
| Pages marketing | 34 | 18 | 12 | 4 |
| Pages dashboard | 13 | 2 | 7 | 4 |
| API routes | 81 | 35 | 38 | 8 |
| Composants UI | 61 | 49 | 10 | 2 |
| Tables Drizzle | 15 | 13 | 2 | 0 |
| Total | 204 | 117 | 69 | 18 |

---

## Section 2 — Sécurité

### 2.1 Vulnérabilités critiques

Les vulnérabilités sont classées par criticité OWASP (A01 à A10 2021).
Chaque entrée donne le bug ID, la classe, l'impact et la mitigation.

#### V-01 — Endpoint vocal public (BUG-009)

- Classe OWASP : A01 Broken Access Control + A05 Security Misconfiguration.
- Fichier : `src/app/api/voice/incoming/route.ts:11`.
- Impact : un attaquant peut générer du TwiML factice, déclencher des appels
  outbound coûteux, faire passer des messages frauduleux à des numéros
  prospect.
- Mitigation : valider `X-Twilio-Signature` via `twilio.validateRequest()`
  côté serveur, refuser toute requête non signée, logger les tentatives.

#### V-02 — Webhooks n8n / Make sans signature (BUG-017)

- Classe OWASP : A08 Software and Data Integrity Failures.
- Fichiers : `src/app/api/webhooks/n8n/route.ts`, `src/app/api/webhooks/make/route.ts`.
- Impact : déclenchement de workflows arbitraires, falsification de données.
- Mitigation : header `X-Lynaris-Signature` (HMAC SHA-256 d'un secret par
  intégration), nonce + timestamp anti-replay, fenêtre 5 minutes max.

#### V-03 — Org partagé pour utilisateurs anonymes (BUG-007)

- Classe OWASP : A01 Broken Access Control.
- Fichier : `src/lib/auth/get-org-id.ts:8`.
- Impact : tout utilisateur non authentifié partage la même `org_id`. Risque
  de croisement de données, création de clés API anonymes, lecture des
  conversations d'autrui.
- Mitigation : retourner `401` si pas de session, ne JAMAIS fallback vers un
  org "anon" sur les routes sensibles. Réserver l'org anon à la démo
  marketing publique uniquement, en lecture seule.

#### V-04 — Billing checkout sans ownership (BUG-008)

- Classe OWASP : A04 Insecure Design.
- Fichier : `src/app/api/billing/checkout/route.ts:43-56`.
- Impact : un client A peut créer un checkout pour l'org du client B et
  facturer à sa place, ou linker des Stripe customers croisés.
- Mitigation : ne jamais faire confiance au body. Récupérer l'org via la
  session, vérifier `users.org_id`, ignorer toute valeur `org_id` envoyée par
  le client.

#### V-05 — Rate limiting en mémoire (BUG-006)

- Classe OWASP : A04 + A05.
- Fichier : `src/app/api/agents/[slug]/chat/route.ts:13-37`.
- Impact : Map JS instanciée par worker, pas partagée. Plusieurs instances
  Vercel = bypass. Reboot = reset. Pas adapté.
- Mitigation : utiliser Upstash Redis (`@upstash/ratelimit`) avec sliding
  window. Clé `chat:{userId}:{slug}`. Quota raisonnable : 30 req/min,
  60 req/heure pour utilisateurs free, 300/heure pour pro.

#### V-06 — Health endpoint expose infos sensibles (BUG-018)

- Classe OWASP : A01 + A05.
- Fichier : `src/app/api/health/route.ts`.
- Impact : exposition publique du SHA commit, environment, domaine, version
  Node. Aide l'attaquant à profiler la stack.
- Mitigation : version simplifiée publique (`{ status: "ok" }`). Version
  détaillée sur `/api/health/full` derrière header `Authorization: Bearer
  $CRON_SECRET`.

#### V-07 — Tokens OAuth en clair en DB

- Classe OWASP : A02 Cryptographic Failures.
- Fichier : `src/lib/db/schema.ts` (table `integrations.tokens`).
- Impact : un dump DB révèle tous les tokens Google, Twilio, Stripe Connect.
- Mitigation : chiffrement applicatif AES-256-GCM avec clé en `ENCRYPTION_KEY`
  via env, jamais committée. Helper `encrypt(value)` / `decrypt(value)` dans
  `src/lib/crypto.ts`. Rotation de clé documentée.

#### V-08 — Pas de CSP stricte

- Classe OWASP : A05 + A03 (Injection).
- Fichier : `src/middleware.ts`.
- Impact : XSS possible via injection HTML + chargement de scripts tiers.
- Mitigation : CSP nonce-based, restreindre `script-src 'self' 'nonce-...'`,
  `frame-ancestors 'none'`, `connect-src` limité aux domaines connus
  (Supabase, Stripe, Anthropic, Resend, Twilio, Upstash).

#### V-09 — CSRF non protégé sur Server Actions ?

- Classe OWASP : A01.
- Next.js 15+ protège par défaut les Server Actions via `Origin` header,
  mais à valider explicitement dans le middleware.
- Mitigation : activer `experimental.serverActions.allowedOrigins` ou
  vérifier `Origin` matche le domaine canonique.

#### V-10 — Stockage credentials Supabase

- Classe OWASP : A02.
- Vérifier que `SUPABASE_SERVICE_ROLE_KEY` n'est jamais exposée côté client,
  uniquement dans Server Components et API routes server-side.

### 2.2 Plan de remédiation ordonné

Ordre d'exécution recommandé, avec impact/effort.

1. **V-04 Billing ownership** — 2h — risque facturation.
2. **V-03 Anon org** — 3h — risque data cross-tenant.
3. **V-05 Rate limit Redis** — 4h — risque DoS / coût IA.
4. **V-01 Twilio signature** — 2h — risque fraude vocale.
5. **V-02 n8n / Make HMAC** — 3h — risque trigger arbitraire.
6. **V-06 Health endpoint** — 30min — info disclosure.
7. **V-07 Encryption tokens** — 6h — préventif.
8. **V-08 CSP nonce** — 4h — préventif.
9. **V-09 CSRF Origin check** — 1h — préventif.
10. **V-10 Service role audit** — 2h — préventif.

Total estimé : ~28h de travail, 3 à 4 jours plein temps.

### 2.3 Hardening middleware

Le middleware `src/middleware.ts` doit appliquer :

- En-têtes de sécurité par défaut sur toute réponse :
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=(self), interest-cohort=()`
  - `Content-Security-Policy` nonce-based.
- Vérification `Origin` sur méthodes mutantes (POST, PUT, PATCH, DELETE).
- Détection bot simple sur les routes publiques sensibles (contact form,
  newsletter) avec `userAgent` blocklist + Cloudflare Turnstile en couche 2.
- Redirect HTTPS forcé en prod.

### 2.4 Checklist sécurité post-fix

- [ ] `npm audit` 0 high / 0 critical.
- [ ] `git secrets --scan` 0 résultat.
- [ ] `trufflehog filesystem .` 0 secret.
- [ ] CSP nonce vérifiée via `securityheaders.com` → A+.
- [ ] `mozilla/observatory` → A+.
- [ ] Rate limit testé via boucle 100 req/s → 429 après quota.
- [ ] Webhook n8n sans signature → 401.
- [ ] `/api/voice/incoming` sans signature Twilio → 401.
- [ ] `/api/billing/checkout` body avec org étrangère → 403.
- [ ] `/api/health` ne révèle ni SHA ni env.
- [ ] Tokens OAuth en DB chiffrés (test : `SELECT tokens FROM integrations LIMIT 1` → blob illisible).
- [ ] `pnpm lint` 0 warning.
- [ ] `pnpm typecheck` 0 erreur.
- [ ] Sentry capture erreurs middleware sans PII.

---

## Section 3 — Phases d'exécution

### Phase 0 — Urgence sécurité (48h)

Objectif : combler les 9 vulnérabilités critiques avant toute autre chose.

| ID | Bug | Fichier:Ligne | Solution courte | Effort |
| --- | --- | --- | --- | --- |
| V-04 | BUG-008 | `src/app/api/billing/checkout/route.ts:43` | Ignorer body org_id, lire session | 2h |
| V-03 | BUG-007 | `src/lib/auth/get-org-id.ts:8` | Retourner 401 si non auth | 3h |
| V-05 | BUG-006 | `src/app/api/agents/[slug]/chat/route.ts:13` | Migrer Upstash | 4h |
| V-01 | BUG-009 | `src/app/api/voice/incoming/route.ts:11` | Twilio.validateRequest | 2h |
| V-02 | BUG-017 | `src/app/api/webhooks/n8n/route.ts`, `.../make/route.ts` | HMAC SHA-256 | 3h |
| V-06 | BUG-018 | `src/app/api/health/route.ts` | Réponse minimale | 30min |
| V-07 | – | `src/lib/db/schema.ts` (integrations) | AES-256-GCM helper | 6h |
| V-08 | – | `src/middleware.ts` | CSP nonce | 4h |
| V-09 | – | `src/middleware.ts` | Origin check | 1h |

Tests obligatoires Phase 0 :
- Suite Playwright "security smoke" qui vérifie chaque vulnérabilité corrigée.
- Vitest unit pour HMAC et chiffrement.

Exit criteria Phase 0 :
- Toutes les vulnérabilités V-01 à V-09 fermées.
- `securityheaders.com` ≥ A.
- `pnpm test` 100% pass sur les nouvelles specs sécurité.

### Phase 1 — Marketing fonctionnel (1 semaine)

Objectif : que chaque bouton du site marketing fasse ce qu'il prétend.

#### Item 1.1 — Contact form Resend (BUG-001)

- Fichier : `src/app/(marketing)/contact/page.tsx` + nouveau
  `src/app/api/contact/route.ts`.
- Action : créer Server Action validée Zod, appel Resend, email à
  `contact@lynarisai.com`, copie automatique à l'auteur, log Axiom, rate
  limit 3 req / 10 min / IP.
- Tests : Playwright soumission valide, soumission invalide, rate limit.

#### Item 1.2 — Newsletter blog (BUG-002)

- Fichier : `src/app/(marketing)/blog/_components/BlogClient.tsx:183` +
  nouveau `src/app/api/newsletter/subscribe/route.ts`.
- Action : table Drizzle `newsletter_subscribers (id, email, status,
  consent_at, unsubscribe_token, source)`, email de confirmation
  double-opt-in via Resend, lien désinscription RGPD.
- Tests : Playwright soumission, double-opt-in, désinscription.

#### Item 1.3 — Page presse (BUG-003, BUG-004)

- Fichier : `src/app/(marketing)/presse/page.tsx`.
- Action : retirer toutes les mentions presse non vérifiées. Pour les
  téléchargements, créer kit dans `/public/press/` (logo SVG + PNG, photos
  fondateur si validé, fiche produit PDF) ou retirer la section.
- Tests : Playwright vérifie qu'aucun `href="#"` ne subsiste sur la page.

#### Item 1.4 — Bouton Copier agents (BUG-005)

- Fichier : `src/app/(marketing)/agents/[slug]/page.tsx:387`.
- Action : composant `<CopyButton text="...">` avec `navigator.clipboard`,
  fallback `document.execCommand`, feedback visuel (icône check 1,5s),
  annonce `aria-live="polite"`.
- Tests : Playwright copie + presse-papier vérifié.

#### Item 1.5 — Calculateur synchronisé pricing

- Fichier : `src/app/(marketing)/calculateur/page.tsx`.
- Action : extraire les tarifs dans `src/lib/pricing.ts` (single source),
  importer dans la page tarifs et le calculateur.

#### Item 1.6 — Cas clients (BUG)

- Fichier : `src/app/(marketing)/cas-clients/page.tsx`.
- Action : ne garder que Cabinet Ménigoz. Marquer les autres "à venir" ou
  retirer.

#### Item 1.7 — Mentions légales / SIRET

- Fichier : `src/app/(marketing)/legal/mentions-legales/page.tsx`.
- Action : insérer SIRET réel dès réception, délégué DPO, RCS, capital,
  TVA intracommunautaire, hébergeur (Vercel + Supabase).

Exit criteria Phase 1 :
- Aucun `href="#"` sur les pages publiques.
- Aucun `console.log("contact form:")` dans le code.
- Lighthouse pages modifiées : mobile ≥ 85 / desktop ≥ 95.
- 0 violation axe-core.

### Phase 2 — Dashboard data réelle (2 semaines)

Objectif : remplacer toute donnée mockée par des données issues de Drizzle.

#### Item 2.1 — KPIs dashboard accueil

- Fichier : `src/app/(app)/dashboard/page.tsx`.
- Action : Server Component qui agrège : nb conversations 24h, % escalade,
  durée moyenne, coût IA mois courant, crédits restants, latence p50/p95.
- Cache : `revalidate = 60` (fresh chaque minute), tag par org pour
  invalidation après webhook Stripe ou run agent.

#### Item 2.2 — Analytics réelles (BUG-014)

- Fichier : `src/app/(app)/dashboard/analytics/page.tsx` +
  `src/app/api/analytics/route.ts`.
- Action : agréger depuis `agent_logs`, `conversations`, `messages`,
  `billing_events`. Recharts pour les charts. Filtres par période, par agent.

#### Item 2.3 — Billing dashboard (BUG-010, 011, 012, 013)

- Fichiers : `src/app/(app)/dashboard/billing/page.tsx` +
  `src/app/api/billing/invoices/route.ts` +
  `src/app/api/billing/credits/recharge/route.ts`.
- Action : `stripe.invoices.list({ customer: stripeCustomerId, limit: 12 })`.
  Téléchargement via `invoice.invoice_pdf`. Recharge crédits via
  `stripe.checkout.sessions.create({ mode: 'payment', metadata: { type:
  'credit_topup', amount } })`.

#### Item 2.4 — Conversations paginées

- Fichier : `src/app/(app)/dashboard/conversations/page.tsx`.
- Action : pagination cursor-based Drizzle, filtre par agent et statut,
  recherche full-text via `to_tsvector`.

#### Item 2.5 — CRM contacts (BUG-019)

- Fichier : `src/app/(app)/dashboard/agents/elio/page.tsx`.
- Action : table Drizzle `crm_contacts (id, org_id, name, email, phone,
  status, score, owner_id, created_at, updated_at, last_activity_at,
  source)`. Kanban drag & drop avec `@dnd-kit`.

#### Item 2.6 — Documents Supabase Storage (BUG)

- Fichier : `src/app/(app)/dashboard/documents/page.tsx`.
- Action : bucket `documents`, RLS sur `org_id`, upload, preview PDF/image,
  versioning simple via `documents.versions[]` JSONB.

Exit criteria Phase 2 :
- Aucune valeur hardcodée dans le dashboard.
- Tous les endpoints `/api/billing/*` renvoient des données Stripe réelles.
- Sentry sans nouvelle erreur sur dashboard sur 24h.

### Phase 3 — Features incomplètes (3 semaines)

#### Item 3.1 — Settings page complète (BUG-022)

- Sections : Profil (nom, email, avatar), Organisation (nom, SIRET, logo,
  domaine), Notifications (email, in-app, par agent), Sécurité (changement
  mot de passe, 2FA TOTP, sessions actives, kill all sessions), API keys
  (créer, lister, révoquer), Facturation rapide, Langue / Timezone.

#### Item 3.2 — Workspace upload (BUG-020)

- Fichier : `src/app/(app)/dashboard/workspace/page.tsx`.
- Action : intégration Supabase Storage avec progress bar, antivirus en
  worker (ClamAV ou VirusTotal pour MVP).

#### Item 3.3 — Team invite (BUG-021)

- Fichier : `src/app/(app)/dashboard/team/page.tsx` +
  `src/app/api/team/invite/route.ts`.
- Action : token UUID + JWT signé + expiration 7 jours, email Resend
  template `team-invite.html`, page `/invitations/[token]` côté front.

#### Item 3.4 — Vector index Charles (BUG-024)

- Migration SQL : `CREATE INDEX agent_memories_embedding_hnsw_idx ON
  agent_memories USING hnsw (embedding vector_cosine_ops);`.
- Bench : recherche top-k=5 sur 100k rows < 50ms p95.

#### Item 3.5 — Onboarding fluide

- Fichier : `src/app/(app)/dashboard/onboarding/page.tsx`.
- Action : reprise état via `users.onboarding_state` JSONB,
  étapes serializables.

Exit criteria Phase 3 :
- 0 ticket support "page settings vide" / "invitation perdue" / "upload qui
  ne marche pas".
- Bench vector search Charles < 50ms p95.

### Phase 4 — Qualité code (1 sprint)

#### Item 4.1 — Inline styles → Tailwind

Identifier tous les `style={{ ... }}` et les remplacer par classes utilitaires
ou par des CSS vars dans `globals.css`. Aucune exception sauf calculs
dynamiques (animations Framer).

#### Item 4.2 — DocsClient split

`src/app/(marketing)/docs/_components/DocsClient.tsx` mélange Server et Client.
Le splitter en `DocsLayout` (RSC) + `DocsSearch` (Client).

#### Item 4.3 — Suspense boundaries dashboards

Chaque page lourde reçoit un `<Suspense fallback={<DashboardSkeleton />}>`.

#### Item 4.4 — A11y audit complet

axe-core run sur toutes les pages, correctifs systématiques, focus order
vérifié.

#### Item 4.5 — Discriminated unions

Convertir les types booléens d'état en discriminated unions :

```ts
// avant
type AgentState = { isLoading: boolean; isError: boolean; data?: Data }
// après
type AgentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: string };
```

### Phase 5 — Performance et SEO (1 sprint)

#### Item 5.1 — Bundle analysis

Activer `@next/bundle-analyzer` en dev. Cible : <200KB gzip initial sur
homepage. Identifier et remplacer les libs lourdes (GSAP utilisable mais
on peut souvent rester avec CSS + Framer Motion seul).

#### Item 5.2 — Schema.org

`Organization`, `SoftwareApplication`, `Product`, `Offer`, `FAQPage`,
`BreadcrumbList`, `Article` (blog), `Person` (à propos), `LocalBusiness`
(fictif non, mais pour pages verticales si pertinent).

#### Item 5.3 — Sitemap dynamique

`src/app/sitemap.ts` : enrichir avec pages blog, docs, agents, verticales.
`changefreq` réaliste.

#### Item 5.4 — `robots.ts`

Désactiver `/dashboard/*`, `/api/*`, `/auth/*` du crawl. Autoriser
`/blog/*`, `/docs/*`, `/agents/*`, `/pour/*`, `/cas-clients/*`.

#### Item 5.5 — OG images dynamiques

Route `/og/[type]/[id]/route.ts` qui génère via `next/og` ImageResponse.

### Phase 6 — Backlog features

- CRM avancé : pipelines configurables, tags, automations.
- Marketplace skills : pack de skills publiables par les utilisateurs.
- Connecteurs supplémentaires : HubSpot, Pipedrive, Salesforce, Notion,
  Slack, Outlook, Microsoft Teams.
- App mobile : Expo, lecture seule sur dashboards critiques.
- Pré-réservation Marine via QR code en cabinet.
- Mode multi-établissements : un kiné avec deux cabinets distincts.

---

## Section 4 — Spécifications techniques

Pour chaque BUG-001 à BUG-025 et FEAT-001 à FEAT-015, voici la spec
détaillée. Format : ID, priorité, effort, fichier:ligne, problème, solution,
code before/after approximatif, tests.

### BUG-001 — Contact form ne fait rien

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 4h
- **Fichier :** `src/app/(marketing)/contact/page.tsx:15`
- **Problème :** `void console.log(...)` puis `setSubmitted(true)`. Aucun
  email envoyé. Aucun stockage. Aucune trace de consentement.

**Code AVANT (extrait) :**

```ts
"use client";
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  void console.log("contact form:", { name, email, company, sector, message });
  setSubmitted(true);
};
```

**Code APRÈS :**

```ts
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { rateLimitContact } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  company: z.string().max(120).optional().default(""),
  sector: z.enum(["kine","resto","artisan","immo","autre"]),
  message: z.string().min(10).max(2000),
  consent: z.literal(true),
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const ok = await rateLimitContact(ip);
  if (!ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = await req.json();
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  await resend.emails.send({
    from: "Lynaris <contact@lynarisai.com>",
    to: ["yoann@lynarisai.com"],
    replyTo: parsed.data.email,
    subject: `Contact ${parsed.data.sector} — ${parsed.data.name}`,
    text: `${parsed.data.message}\n\nDe : ${parsed.data.name} <${parsed.data.email}>\nEntreprise : ${parsed.data.company || "—"}`,
  });
  logger.info("contact_form_submitted", { sector: parsed.data.sector, ip });
  return NextResponse.json({ ok: true });
}
```

- **Tests :**
  - Vitest unit : valider Zod accepte/refuse.
  - Playwright e2e : remplir, soumettre, voir confirmation, vérifier mail
    reçu via webhook Resend (env de test).
  - Cas `429` après 3 tentatives < 10 min.

### BUG-002 — Newsletter blog fake

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 6h
- **Fichier :** `src/app/(marketing)/blog/_components/BlogClient.tsx:183`
- **Problème :** `if (email) setSubmitted(true)` sans appel API.

**Solution :**

1. Migration Drizzle :

```sql
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | unsubscribed
  consent_at timestamptz,
  unsubscribe_token text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz
);
CREATE INDEX newsletter_subscribers_status_idx ON newsletter_subscribers(status);
```

2. Endpoint `/api/newsletter/subscribe` (POST) :
   - Validation Zod email + source.
   - Insert avec status pending + token UUID.
   - Email Resend "Confirme ton inscription" avec lien
     `https://lynarisai.com/api/newsletter/confirm/[token]`.
3. Endpoint `/api/newsletter/confirm/[token]` (GET) :
   - Update status confirmed, consent_at = now.
   - Redirect vers `/blog?subscribed=1`.
4. Endpoint `/api/newsletter/unsubscribe/[token]` (GET) :
   - Update status unsubscribed.
   - Redirect vers `/blog?unsubscribed=1`.
5. Email template : `src/lib/email/templates/newsletter-confirm.tsx` (React
   Email).

- **Tests :**
  - Soumission OK → email pending.
  - Click confirm → status confirmed.
  - Click unsubscribe → status unsubscribed.
  - Re-soumission email confirmé → 200 idempotent.

### BUG-003 — Download links presse cassés

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 1h (option A) ou 4h (option B)
- **Fichier :** `src/app/(marketing)/presse/page.tsx:42-61`
- **Solution :**
  - Option A : retirer les boutons.
  - Option B : créer assets dans `/public/press/` :
    - `lynaris-logo.svg`, `lynaris-logo-light.png`, `lynaris-logo-dark.png`,
    - `lynaris-fiche-produit.pdf`,
    - `lynaris-fondateur.jpg` (si validé).
- **Tests :** Playwright vérifie chaque `href` retourne 200.

### BUG-004 — Mentions presse fausses

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 30min
- **Fichier :** `src/app/(marketing)/presse/page.tsx:282-295`
- **Solution :** retirer la section. Réintroduire seulement quand de
  vraies retombées existent, avec lien direct vers l'article et logo
  presse autorisé.

### BUG-005 — Bouton Copier non fonctionnel

- **Priorité :** 🟠 HAUTE
- **Effort :** 1h
- **Fichier :** `src/app/(marketing)/agents/[slug]/page.tsx:387`
- **Solution :** créer `src/components/shared/CopyButton.tsx` :

```tsx
"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copier" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback execCommand if clipboard API unavailable
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button onClick={handleCopy} aria-live="polite" variant="ghost">
      {copied ? <><Check aria-hidden /> Copié</> : <><Copy aria-hidden /> {label}</>}
    </Button>
  );
}
```

### BUG-006 — Rate limit en mémoire

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 4h
- **Fichier :** `src/app/api/agents/[slug]/chat/route.ts:13-37`
- **Solution :** utiliser `@upstash/ratelimit`.

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:chat",
});

export async function rateLimitChat(userId: string, slug: string) {
  const { success, limit, remaining, reset } = await chatRatelimit.limit(`${userId}:${slug}`);
  return { success, limit, remaining, reset };
}
```

Dans la route :

```ts
const { success } = await rateLimitChat(userId, slug);
if (!success) return new Response("rate_limited", { status: 429 });
```

### BUG-007 — Anon org partagé

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 3h
- **Fichier :** `src/lib/auth/get-org-id.ts:8`
- **Solution :** signature claire et 401 si pas de session.

```ts
// src/lib/auth/get-org-id.ts
import { auth } from "@/lib/auth/server";

export async function getOrgIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session?.user?.orgId) throw new Response("unauthorized", { status: 401 });
  return session.user.orgId;
}

export async function getOrgIdOrNull(): Promise<string | null> {
  const session = await auth();
  return session?.user?.orgId ?? null;
}
```

Toute route sensible appelle `getOrgIdOrThrow`. Les pages publiques peuvent
utiliser `getOrgIdOrNull`.

### BUG-008 — Billing checkout sans ownership

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 2h
- **Fichier :** `src/app/api/billing/checkout/route.ts:43-56`
- **Solution :**

```ts
const orgId = await getOrgIdOrThrow();
// Ne JAMAIS lire body.org_id
const body = await req.json();
const { planId } = z.object({ planId: z.enum(["starter","pro","scale"]) }).parse(body);
```

### BUG-009 — Voice incoming sans auth

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 2h
- **Fichier :** `src/app/api/voice/incoming/route.ts:11`
- **Solution :**

```ts
import twilio from "twilio";

const authToken = process.env.TWILIO_AUTH_TOKEN!;
const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/voice/incoming`;
const signature = req.headers.get("x-twilio-signature") ?? "";
const params = Object.fromEntries(new URLSearchParams(await req.text()));
if (!twilio.validateRequest(authToken, signature, url, params)) {
  return new Response("forbidden", { status: 403 });
}
```

### BUG-010 — Endpoint recharge manquant

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 3h
- **Fichier :** créer `src/app/api/billing/credits/recharge/route.ts`.
- **Solution :** Stripe Checkout Session mode `payment`, metadata `type:
  credit_topup`, webhook handler qui crédite l'org.

### BUG-011 — plan_id vs planId

- **Priorité :** 🟠 HAUTE
- **Effort :** 30min
- **Fichier :** `src/app/(app)/dashboard/billing/page.tsx:462`
- **Solution :** uniformiser sur `planId` (camelCase) côté client + serveur.

### BUG-012 — Fake invoices billing

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 4h
- **Fichier :** `src/app/(app)/dashboard/billing/page.tsx:91-119`
- **Solution :** route `/api/billing/invoices` :

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const orgId = await getOrgIdOrThrow();
const org = await db.query.organizations.findFirst({
  where: eq(organizations.id, orgId),
});
if (!org?.stripeCustomerId) return NextResponse.json({ invoices: [] });
const invoices = await stripe.invoices.list({
  customer: org.stripeCustomerId,
  limit: 12,
});
return NextResponse.json({
  invoices: invoices.data.map(inv => ({
    id: inv.id,
    number: inv.number,
    amountDue: inv.amount_due,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
    periodStart: inv.period_start,
    periodEnd: inv.period_end,
  })),
});
```

### BUG-013 — Download factures fake

- **Priorité :** 🟠 HAUTE
- **Effort :** 1h
- **Fichier :** `src/app/(app)/dashboard/billing/page.tsx:131-154`
- **Solution :** côté client, faire `window.location.href = invoice.pdfUrl`
  ou rediriger via une route serveur qui revérifie ownership.

### BUG-014 — Analytics date hardcodée

- **Priorité :** 🟠 HAUTE
- **Effort :** 6h
- **Fichier :** `src/app/(app)/dashboard/analytics/page.tsx:15`
- **Solution :** retirer le seed daté, agréger DB.

### BUG-015 — Schema data loss agent supprimé

- **Priorité :** 🟡 MOYENNE
- **Effort :** 2h
- **Fichier :** `src/lib/db/schema.ts:167-169`
- **Solution :** soft delete sur `agent_instances` (`deleted_at`),
  contrainte FK `restrict`.

### BUG-016 — Executor parse errors silencieux

- **Priorité :** 🟡 MOYENNE
- **Effort :** 1h
- **Fichier :** `src/lib/agents/executor.ts:255-256`
- **Solution :**

```ts
try { input = JSON.parse(rawInput); }
catch (err) {
  logger.warn("tool_input_parse_error", { tool: tool.name, raw: rawInput, err });
  input = {};
}
```

### BUG-017 — Webhooks n8n / Make sans signature

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 3h
- **Fichiers :** `src/app/api/webhooks/n8n/route.ts`, `src/app/api/webhooks/make/route.ts`.
- **Solution :** HMAC SHA-256 :

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function verifySig(secret: string, body: string, sig: string): boolean {
  const mac = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(mac); const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

### BUG-018 — Health endpoint expose infos

- **Priorité :** 🟠 HAUTE
- **Effort :** 30min
- **Fichier :** `src/app/api/health/route.ts`
- **Solution :** réponse minimale `{ status: "ok" }`. Détails sur
  `/api/health/full` derrière `Authorization: Bearer ${CRON_SECRET}`.

### BUG-019 — CRM contacts hardcodés

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 8h
- **Fichier :** `src/app/(app)/dashboard/agents/elio/page.tsx`
- **Solution :** créer table `crm_contacts` + endpoints REST + UI réelle.

### BUG-020 — Workspace upload UI-only

- **Priorité :** 🟠 HAUTE
- **Effort :** 6h
- **Fichier :** `src/app/(app)/dashboard/workspace/page.tsx`
- **Solution :** intégrer Supabase Storage `documents` ou `workspace`.

### BUG-021 — Team invitations non envoyées

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 5h
- **Fichier :** Team page + nouveau `/api/team/invite/route.ts`.
- **Solution :** voir Phase 3 Item 3.3.

### BUG-022 — Settings page incomplète

- **Priorité :** 🔴 CRITIQUE
- **Effort :** 16h
- **Fichier :** `src/app/(app)/dashboard/settings/page.tsx`
- **Solution :** voir Phase 3 Item 3.1.

### BUG-023 — Logo "L" forgot-password

- **Statut :** ✅ FAIT cette session.

### BUG-024 — Vector embedding index manquant

- **Priorité :** 🟠 HAUTE
- **Effort :** 30min + bench
- **Fichier :** `src/lib/db/schema.ts:262`
- **Solution :** migration HNSW index.

### BUG-025 — stripeCustomerId sans unique

- **Priorité :** 🟡 MOYENNE
- **Effort :** 30min
- **Fichier :** `src/lib/db/schema.ts:85`
- **Solution :** ajouter `.unique()`.

### FEAT-001 — Contact form Resend

Voir BUG-001.

### FEAT-002 — Newsletter API

Voir BUG-002.

### FEAT-003 — Copy-to-clipboard agents

Voir BUG-005, généraliser le composant à toutes les pages.

### FEAT-004 — Vraies factures Stripe

Voir BUG-012.

### FEAT-005 — Téléchargement PDF Stripe

Voir BUG-013.

### FEAT-006 — KPIs dashboard depuis DB

Voir Phase 2 Item 2.1.

### FEAT-007 — Analytics réelles

Voir Phase 2 Item 2.2.

### FEAT-008 — Rate limit Redis

Voir BUG-006.

### FEAT-009 — Twilio signature

Voir BUG-009.

### FEAT-010 — Org ownership billing

Voir BUG-008.

### FEAT-011 — Settings complète

Voir Phase 3 Item 3.1.

### FEAT-012 — Workspace upload

Voir Phase 3 Item 3.2.

### FEAT-013 — Team invite email

Voir Phase 3 Item 3.3.

### FEAT-014 — Vector index

Voir BUG-024.

### FEAT-015 — Roadmap intégrations

50+ intégrations comingSoon → roadmap claire avec dates :
- Q1 : Gmail, Google Calendar, Twilio, Stripe, Resend, ElevenLabs.
- Q2 : Outlook, Microsoft Teams, Slack, HubSpot.
- Q3 : Pipedrive, Salesforce, Notion, Airtable.
- Q4 : Shopify, Qonto, WooCommerce.

---

## Section 5 — Architecture cible

### 5.1 Server / Client components strategy

Règle de base : tout est Server Component par défaut. On ne passe `"use
client"` que si nécessaire (interactivité, hooks, events, API browser).

| Composant | Type cible | Justification |
| --- | --- | --- |
| `Navbar` | Server | Liens statiques, Suspense pour user menu |
| `Footer` | Server | Statique |
| `HeroSection` | Server, slot Client `<HeroScene />` | Permet streaming HTML |
| `HeroScene` | Client | Three.js |
| `BentoSection` | Server | Statique |
| `CookieBanner` | Client | localStorage |
| `ContactForm` | Server Action + Form Client minimal | Server Action recommandé |
| `BlogClient` | Mixte | Découper : `BlogList` (Server) + `BlogSearch` (Client) |
| `DocsClient` | Mixte | Idem |
| `DashboardKPIs` | Server (async) | Drizzle agrégation |
| `ConversationList` | Server | Pagination Drizzle |
| `ChatStream` | Client | SSE / EventSource |

### 5.2 Data fetching patterns

- Préférer le fetching dans le Server Component lui-même.
- Pour les mutations : Server Actions (`"use server"`), validation Zod, retour
  `Result<T, E>`.
- Pour les flux temps réel : SSE (`/api/agents/[slug]/chat`,
  `/api/activity/stream`).
- Cache : `revalidate` explicite par segment, `revalidateTag` après mutations.

### 5.3 Auth flow complet

1. Sign in : `supabase.auth.signInWithOtp` ou Google OAuth.
2. Callback : `/api/auth/callback` → set cookie.
3. Middleware lit cookie, valide, attache `user` à `req`.
4. Server Components / API utilisent `auth()` helper qui revalide la
   session côté serveur (pas de trust client).
5. Logout : `/api/auth/logout` → clear cookie.

### 5.4 API design pattern (Result<T, E>)

```ts
// src/lib/result.ts
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

Toutes les fonctions métier renvoient `Result`. Les routes API mappent vers
HTTP en bordure :

```ts
const r = await services.charges.create(input);
if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
return NextResponse.json(r.value);
```

### 5.5 DB optimizations

- Indexes manquants à vérifier : `agent_logs(org_id, created_at desc)`,
  `messages(conversation_id, created_at)`,
  `conversations(org_id, updated_at desc)`,
  `prospects(org_id, status, score desc)`,
  `agent_memories USING hnsw(embedding vector_cosine_ops)`,
  `billing_events(org_id, created_at desc)`,
  `activity_events(org_id, created_at desc)`.
- RLS Supabase activée partout, policies par org.
- Pas de SELECT * en prod, projection explicite.

---

## Section 6 — Design system

### 6.1 CSS variables à définir

Dans `src/app/globals.css` (Tailwind v4) :

```css
:root {
  --color-bg: oklch(98% 0.005 250);
  --color-fg: oklch(15% 0.02 250);
  --color-muted: oklch(50% 0.02 250);
  --color-border: oklch(90% 0.01 250);

  --color-brand: oklch(60% 0.18 270);
  --color-brand-strong: oklch(50% 0.20 270);
  --color-brand-soft: oklch(95% 0.05 270);

  --color-success: oklch(70% 0.15 145);
  --color-warning: oklch(75% 0.15 80);
  --color-danger: oklch(60% 0.20 25);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 6px 24px oklch(0% 0 0 / 0.08);
  --shadow-lg: 0 24px 48px oklch(0% 0 0 / 0.12);
}

[data-theme="dark"] {
  --color-bg: oklch(15% 0.02 250);
  --color-fg: oklch(96% 0.005 250);
  --color-muted: oklch(60% 0.02 250);
  --color-border: oklch(25% 0.02 250);
  --color-brand-soft: oklch(25% 0.05 270);
}
```

### 6.2 Migration hex hardcodés → tokens

Tous les `#22D3EE`, `#7C3AED`, `#F472B6`, `#10B981`, `#F59E0B`, `#EC4899`,
`#6366F1`, `#8B5CF6`, `#64748B` (couleurs agents) deviennent des tokens
typés :

```ts
// src/lib/agents/colors.ts
export const AGENT_COLORS = {
  marine: "var(--agent-marine)",
  charles: "var(--agent-charles)",
  lou: "var(--agent-lou)",
  elio: "var(--agent-elio)",
  mae: "var(--agent-mae)",
  max: "var(--agent-max)",
  nova: "var(--agent-nova)",
  alba: "var(--agent-alba)",
  orion: "var(--agent-orion)",
} as const;
```

### 6.3 Composants manquants

- `<DataTable>` : tri, filtre, pagination, sélection multiple.
- `<DateRangePicker>` : calendrier accessible, presets.
- `<ConfirmDialog>` : confirmation actions destructives, preview.
- `<EmptyState>` : pictogramme + copy + CTA.
- `<ToastProvider>` : succès / erreur / info, durée 5s, dismiss clavier.
- `<CommandPalette>` : recherche globale (Cmd+K).
- `<FormField>` wrapper : label, hint, error, contraintes.

### 6.4 A11y checklist par composant

- Tous les boutons ont label texte ou `aria-label`.
- Tous les inputs ont `<label htmlFor>`.
- Tous les modaux ont focus trap, ESC pour fermer, retour focus à
  l'élément déclencheur.
- Tous les liens icon-only ont `aria-label`.
- Tous les composants animés respectent `prefers-reduced-motion`.
- Toutes les couleurs fonctionnent à contraste WCAG AA.
- Toutes les zones cliquables ≥ 44×44 px.
- Tous les tableaux ont `<caption>` et `<th scope>`.

---

## Section 7 — Tests

### 7.1 Plan Vitest

Cible : 70% couverture sur `src/lib/`.

Suites prioritaires :

- `src/lib/agents/executor.test.ts` : run loop, tool invocation, max iterations.
- `src/lib/agents/registry.test.ts` : registry valide.
- `src/lib/auth/get-org-id.test.ts` : OrThrow vs OrNull.
- `src/lib/rate-limit.test.ts` : sliding window.
- `src/lib/crypto.test.ts` : encrypt/decrypt round-trip.
- `src/lib/result.test.ts` : ok/err helpers.
- `src/app/api/contact/route.test.ts` : Zod validation, rate limit.
- `src/app/api/newsletter/subscribe/route.test.ts` : double-opt-in.
- `src/app/api/webhooks/stripe/route.test.ts` : signature.
- `src/app/api/webhooks/n8n/route.test.ts` : signature.

### 7.2 Plan Playwright E2E

Suites :

- `tests/e2e/contact-form.spec.ts` : succès, échec validation, rate limit.
- `tests/e2e/newsletter.spec.ts` : double-opt-in.
- `tests/e2e/auth.spec.ts` : signup, login, logout.
- `tests/e2e/onboarding.spec.ts` : parcours complet.
- `tests/e2e/billing.spec.ts` : checkout sandbox Stripe, factures.
- `tests/e2e/agent-chat.spec.ts` : streaming SSE.
- `tests/e2e/security.spec.ts` : 401 sur routes protégées, 403 sur cross-org.
- `tests/e2e/a11y.spec.ts` : axe-core sur 10 pages clés.

### 7.3 Lighthouse CI targets

`lighthouserc.js` :

```js
module.exports = {
  ci: {
    collect: {
      url: [
        "https://staging.lynarisai.com/",
        "https://staging.lynarisai.com/tarifs",
        "https://staging.lynarisai.com/agents/marine",
        "https://staging.lynarisai.com/contact",
        "https://staging.lynarisai.com/blog",
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
  },
};
```

---

## Section 8 — Priorités commerciales

### 8.1 Ce qui bloque le closing Julien Ménigoz

1. Page contact qui envoie réellement un email (BUG-001).
2. Page presse propre (BUG-003, BUG-004).
3. Page agent Marine 100% crédible avec extrait audio réel.
4. Démo téléphonique fiable, signature Twilio active.
5. Page tarifs sans incohérence calculateur / pricing.
6. Mentions légales avec SIRET dès réception.
7. Cas client Ménigoz publiable (avec accord écrit).

### 8.2 Checklist pré-démo client

- [ ] Tous les liens cliqués depuis la home → 200 OK.
- [ ] Marine décroche en < 10s sur un appel test.
- [ ] Le calendrier Google Ménigoz se synchronise.
- [ ] Le SMS de confirmation arrive en < 5s après prise de RDV.
- [ ] Aucun `console.log` visible dans la prod.
- [ ] Aucune image `placehold.co` ou Lorem.
- [ ] Sentry vide d'erreurs sur les routes critiques pendant 24h.
- [ ] Statut Vercel + Supabase + Twilio = green.

### 8.3 Mapping features → impact commercial

| Feature | Impact closing | Effort | Priorité |
| --- | --- | --- | --- |
| Contact form | Élevé | 4h | P0 |
| Presse propre | Élevé | 1-4h | P0 |
| Marine crédible | Élevé | 8h | P0 |
| Billing Stripe réel | Élevé | 8h | P0 |
| Settings complète | Moyen | 16h | P1 |
| CRM Elio réel | Moyen | 8h | P1 |
| Workspace upload | Faible | 6h | P2 |
| Vector index Charles | Moyen | 1h | P1 |
| Team invite | Faible | 5h | P2 |
| Schema.org | Moyen | 4h | P1 |

---

## Section 9 — Checklist finale

À cocher AVANT toute mise en production majeure.

- [ ] `pnpm typecheck` 0 erreur.
- [ ] `pnpm lint` 0 warning.
- [ ] `pnpm test` 100% pass, couverture ≥ 70% sur lib.
- [ ] `pnpm test:e2e` 100% pass.
- [ ] `pnpm build` succès.
- [ ] Lighthouse pages clés ≥ 85 mobile / 95 desktop.
- [ ] axe-core 0 violation.
- [ ] `securityheaders.com` ≥ A.
- [ ] `npm audit` 0 high / 0 critical.
- [ ] Renovate actif.
- [ ] Sentry monitor "release" déployé.
- [ ] Axiom logs reçoivent les events `contact_form_submitted`,
  `newsletter_subscribed`, etc.
- [ ] Stripe : checkout test → webhook reçu → DB updatée.
- [ ] Twilio : appel entrant → Marine répond → calendrier mis à jour.
- [ ] Resend : email contact reçu, email newsletter reçu, email team-invite reçu.
- [ ] Supabase RLS : test cross-org échoue.
- [ ] Supabase Storage : upload + read avec RLS.
- [ ] Backup DB : snapshot quotidien Supabase actif.
- [ ] CRON cleanup logs : exécution la nuit OK.
- [ ] CRON trial-check : envoi email J-2 OK.
- [ ] Mentions légales avec SIRET réel.
- [ ] CGU à jour validées.
- [ ] Politique confidentialité à jour avec DPO.
- [ ] Cookie banner CNIL conforme.
- [ ] Sitemap.xml accessible.
- [ ] Robots.txt cohérent.
- [ ] OG images générées dynamiquement.
- [ ] Schema.org présent sur toutes les pages clés.
- [ ] Aucun `href="#"` dans le code.
- [ ] Aucun `console.log` dans le code de prod.
- [ ] Aucun TODO non justifié.
- [ ] Aucun `any` TypeScript.
- [ ] Aucune fake data (ACME, Lorem, +120, 87%, Sophie L., Alexandre B.).
- [ ] Aucun secret en clair commité.
- [ ] Tous les boutons ont focus-visible.
- [ ] Tous les inputs ont label.
- [ ] Tous les modaux ont ESC + focus trap.
- [ ] Page hors ligne fonctionne (offline.tsx).
- [ ] Erreur 404 personnalisée.
- [ ] Erreur 500 personnalisée.
- [ ] Pages auth a11y validées.
- [ ] Pages dashboard a11y validées.
- [ ] Mobile testé sur iPhone SE et Pixel 5 réels.
- [ ] Tablet testé.
- [ ] Print stylesheet (factures).

---

## Annexe A — Mapping bug → phase → owner

| Bug | Phase | Effort | Statut |
| --- | --- | --- | --- |
| BUG-001 Contact form | Phase 1 | 4h | 🔴 |
| BUG-002 Newsletter | Phase 1 | 6h | 🔴 |
| BUG-003 Download presse | Phase 1 | 1-4h | 🔴 |
| BUG-004 Mentions presse | Phase 1 | 30min | 🔴 |
| BUG-005 Bouton Copier | Phase 1 | 1h | 🟠 |
| BUG-006 Rate limit Redis | Phase 0 | 4h | 🔴 |
| BUG-007 Anon org | Phase 0 | 3h | 🔴 |
| BUG-008 Billing checkout | Phase 0 | 2h | 🔴 |
| BUG-009 Voice incoming | Phase 0 | 2h | 🔴 |
| BUG-010 Recharge endpoint | Phase 2 | 3h | 🔴 |
| BUG-011 planId / plan_id | Phase 2 | 30min | 🟠 |
| BUG-012 Fake invoices | Phase 2 | 4h | 🔴 |
| BUG-013 Download factures | Phase 2 | 1h | 🟠 |
| BUG-014 Analytics fake | Phase 2 | 6h | 🟠 |
| BUG-015 Schema cascade | Phase 4 | 2h | 🟡 |
| BUG-016 Executor parse | Phase 4 | 1h | 🟡 |
| BUG-017 Webhooks signature | Phase 0 | 3h | 🔴 |
| BUG-018 Health endpoint | Phase 0 | 30min | 🟠 |
| BUG-019 CRM hardcodé | Phase 2 | 8h | 🔴 |
| BUG-020 Workspace upload | Phase 3 | 6h | 🟠 |
| BUG-021 Team invite | Phase 3 | 5h | 🔴 |
| BUG-022 Settings stub | Phase 3 | 16h | 🔴 |
| BUG-023 Logo forgot | DONE | 0 | ✅ |
| BUG-024 Vector index | Phase 3 | 1h | 🟠 |
| BUG-025 stripeCustomerId unique | Phase 4 | 30min | 🟡 |

Total effort estimé : ~85h, soit ~2 sprints à 2 développeurs.

---

## Annexe B — Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
| --- | --- | --- | --- |
| Webhook Stripe perdu | Faible | Élevé | Réessais Stripe automatiques + idempotency keys |
| DDoS sur contact form | Moyen | Moyen | Cloudflare Turnstile + Upstash rate limit |
| Fuite de tokens OAuth | Faible | Critique | Chiffrement AES-256-GCM + rotation clés |
| Bug agent en prod | Moyen | Élevé | Sentry + circuit breaker + max iterations 10 |
| Coût Anthropic explose | Moyen | Élevé | Soft cap par org, alerting Axiom |
| Numéro Twilio bloqué | Faible | Critique | Backup numéro secondaire |
| Supabase down | Faible | Critique | Page status + email automatique |
| Vercel build échoue | Moyen | Moyen | Preview deploys + rollback rapide |
| RGPD inspection | Faible | Critique | Registre des traitements + DPO + privacy by design |
| Prospect signale concurrence déloyale | Faible | Moyen | Veille + zéro fake claim |

---

## Annexe C — Conventions de commit Lynaris

Format : `type(scope): description`

Types acceptés : `feat`, `fix`, `refactor`, `perf`, `a11y`, `docs`, `test`,
`chore`, `style`, `build`, `ci`, `revert`.

Scopes recommandés : `auth`, `billing`, `agents`, `marketing`, `dashboard`,
`api`, `db`, `ui`, `seo`, `infra`.

Règle : 1 commit = 1 intention. Pas de "various fixes". Body en français,
avec contexte et impact si non trivial.

Exemples :

- `feat(api): contact form Resend avec validation Zod et rate limit`
- `fix(billing): retirer fake invoices et brancher Stripe API`
- `security(api): valider signature Twilio sur /api/voice/incoming`
- `refactor(auth): supprimer ANON_ORG_ID et 401 si non authentifié`

---

## Annexe D — Glossaire technique

- **RSC** : React Server Component.
- **CSR** : Client Side Rendering.
- **SSR** : Server Side Rendering (Next.js 15 le mixe avec RSC).
- **SSE** : Server-Sent Events.
- **HMAC** : Hash-based Message Authentication Code.
- **RLS** : Row Level Security (Supabase).
- **CWV** : Core Web Vitals (LCP, INP, CLS).
- **CSP** : Content Security Policy.
- **OWASP** : Open Web Application Security Project.
- **PII** : Personally Identifiable Information.
- **HNSW** : Hierarchical Navigable Small World (index vectoriel).
- **DPO** : Délégué à la Protection des Données.

---

## Annexe E — Calendrier indicatif

| Semaine | Phase | Focus |
| --- | --- | --- |
| S0 | Phase 0 | Sécurité urgente (V-01 à V-09) |
| S1 | Phase 1 | Marketing fonctionnel |
| S2-S3 | Phase 2 | Dashboard data réelle |
| S4-S6 | Phase 3 | Features incomplètes |
| S7 | Phase 4 | Qualité code |
| S8 | Phase 5 | Performance & SEO |
| S9+ | Phase 6 | Backlog features |

Pour Yoann en mode solopreneur, doubler les durées et garder une marge de
sécurité de 30% pour les imprévus commerciaux (relances Julien, SIRET, etc.).

---

## Annexe F — Définitions de "Done"

Une tâche est "Done" si et seulement si :

1. Le code compile (`pnpm typecheck`, `pnpm build`).
2. Le code passe le linter sans warning.
3. Les tests unitaires associés sont écrits et passent.
4. Le test E2E associé est écrit et passe.
5. La revue adverse `code-reviewer` n'a aucun bloquant.
6. Les screenshots avant/après sont dans `docs/changes/YYYY-MM-DD/` si UI.
7. La doc associée (README, CLAUDE.md, AGENTS.md) est à jour.
8. Le commit suit la convention.
9. Sentry n'a remonté aucune erreur dans les 24h post-déploiement.
10. La checklist commerciale (section 8) reste verte.

---

## Annexe G — Snippets type pour reprises rapides

### Server Action contact form

```ts
"use server";
import { z } from "zod";
import { Resend } from "resend";
import { redirect } from "next/navigation";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function submitContact(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false as const, error: "validation" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: "Lynaris <contact@lynarisai.com>",
    to: ["yoann@lynarisai.com"],
    replyTo: parsed.data.email,
    subject: `Contact — ${parsed.data.name}`,
    text: parsed.data.message,
  });
  redirect("/contact?sent=1");
}
```

### Validateur HMAC webhook

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHmac(secret: string, body: string, signature: string) {
  const mac = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

### Helper auth orgId

```ts
export async function getOrgIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session?.user?.orgId) {
    throw new Response("unauthorized", { status: 401 });
  }
  return session.user.orgId;
}
```

### Rate limit Upstash

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const rateLimitChat = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:chat",
});
```

### Stripe invoices list

```ts
const invoices = await stripe.invoices.list({
  customer: org.stripeCustomerId,
  limit: 12,
});
```

### Twilio signature validation

```ts
const ok = twilio.validateRequest(authToken, signature, url, params);
if (!ok) return new Response("forbidden", { status: 403 });
```

### Drizzle migration HNSW

```sql
CREATE INDEX agent_memories_embedding_hnsw_idx
  ON agent_memories
  USING hnsw (embedding vector_cosine_ops);
```

### CSP nonce middleware

```ts
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export function middleware(req: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.stripe.com https://*.supabase.co https://api.anthropic.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  return res;
}
```

---

## Annexe H — Politique d'incident

En cas d'incident production :

1. Identifier l'erreur dans Sentry.
2. Communiquer le statut sur status.lynarisai.com (si activé).
3. Logger un post-mortem dans `docs/incidents/YYYY-MM-DD-titre.md`.
4. Documenter : timeline, root cause, mitigation, fix, follow-up.
5. Mettre à jour les tests pour empêcher la régression.
6. Mettre à jour `tasks/lessons.md`.

Modèle de post-mortem :

```md
# Incident YYYY-MM-DD — <Titre>

- **Sévérité :** SEV-1 / SEV-2 / SEV-3
- **Durée :** HH:MM → HH:MM
- **Impact utilisateur :** <description>
- **Détection :** automatique (Sentry) / signalement client / etc.

## Timeline
- HH:MM — Premier symptôme
- HH:MM — Détection
- HH:MM — Diagnostic
- HH:MM — Mitigation
- HH:MM — Fix complet

## Root cause
<analyse>

## Fix
<commit hashes, PR>

## Follow-up
- [ ] Test régression
- [ ] Alerting renforcé
- [ ] Doc mise à jour
```

---

## Annexe I — Plan de migration zéro-downtime

Pour les changements DB sensibles (BUG-015, BUG-024, BUG-025) :

1. Ajouter la nouvelle colonne / index en mode non bloquant.
2. Backfill données via job batch.
3. Activer la nouvelle logique applicative derrière feature flag.
4. Vérifier sur staging.
5. Bascule progressive en prod.
6. Retirer l'ancienne colonne / logique après période de cohabitation.

---

## Annexe J — Crédits et sources

- OWASP Top 10 (2021) : référence sécurité applicative.
- WCAG 2.2 AA : référence accessibilité.
- Refactoring UI (Adam Wathan, Steve Schoger) : design system.
- Inclusive Components (Heydon Pickering) : accessibilité.
- Stripe API Reference : intégration paiement.
- Supabase Docs : auth, RLS, storage.
- Anthropic SDK : agents et tool use.
- Next.js docs (App Router) : RSC, Server Actions, streaming.

---

## Mot de la fin

Ce plan n'a de valeur que s'il est exécuté ligne par ligne. Aucune section
n'est optionnelle. La seule règle est : pas de commit sur `main` qui ne
soit fier d'être lu dans cinq ans.

Si une décision contredit ce plan, la justification doit être consignée
dans `docs/decisions/YYYY-MM-DD-titre.md` (ADR) et validée par Yoann avant
merge.

Bon courage. La crédibilité se gagne à chaque ligne.

— L'ingénieur principal Lynaris

---

# ANNEXE K — CODE COMPLET DES FIXES PRIORITAIRES

> Code TypeScript/TSX complet, prêt à coller. Chaque fix résout un BUG-XXX
> identifié à l'audit (cf. Annexe G). Ordre : criticité décroissante.

---

## BUG-001 — Contact form Server Action avec Resend

**Symptôme** : `/contact` POST ne fait rien (form action vide ou stub console.log).
**Impact** : prospect remplit, croit avoir contacté, jamais reçu côté Yoann.
**Sévérité** : CRITIQUE (perte directe de leads, casus belli crédibilité).

### Fichier 1/3 — `src/app/(marketing)/contact/_actions/submit-contact.ts`

```typescript
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { db } from "@/db";
import { activityEvents } from "@/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Rate limiter : 1 soumission / 10 min par IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(1, "10 m"),
  prefix: "ratelimit:contact-form",
  analytics: true,
});

const resend = new Resend(env.RESEND_API_KEY);

// Schéma de validation strict
const ContactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
  email: z.string().trim().toLowerCase().email("Email invalide").max(120),
  company: z.string().trim().max(120).optional().default(""),
  vertical: z.enum(["kine", "resto", "artisan", "immobilier", "autre"]).optional().default("autre"),
  message: z.string().trim().min(20, "Message trop court (20 caractères mini)").max(2000, "Message trop long (2000 max)"),
  // Honeypot anti-bot — doit rester vide
  website: z.string().max(0, "Spam detected").optional().default(""),
  consent: z.literal("on", { errorMap: () => ({ message: "Consentement requis" }) }),
});

export type ContactFormState =
  | { status: "idle" }
  | { status: "success"; messageId: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // 1. Rate limiting par IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous";
  const { success: rlOk, reset } = await ratelimit.limit(`contact:${ip}`);
  if (!rlOk) {
    const waitMin = Math.ceil((reset - Date.now()) / 60_000);
    return { status: "error", error: `Trop de soumissions. Réessaye dans ${waitMin} min.` };
  }

  // 2. Validation Zod
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    vertical: formData.get("vertical") ?? "autre",
    message: formData.get("message"),
    website: formData.get("website") ?? "",
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie les champs en rouge.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, company, vertical, message } = parsed.data;

  // 3. Envoi email Resend
  try {
    const html = renderContactEmail({ name, email, company, vertical, message });
    const result = await resend.emails.send({
      from: "Lynaris <contact@lynarisai.com>",
      to: ["contact@lynarisai.com"],
      replyTo: email,
      subject: `[Contact] ${name} — ${vertical}`,
      html,
      text: `De: ${name} <${email}>\nEntreprise: ${company || "—"}\nVertical: ${vertical}\n\n${message}`,
    });

    if (result.error || !result.data?.id) {
      throw new Error(result.error?.message ?? "Resend returned no id");
    }

    // 4. Log activity_events (audit + analytics interne)
    await db.insert(activityEvents).values({
      type: "contact_form_submitted",
      metadata: { name, email, company, vertical, ip, resendMessageId: result.data.id },
      createdAt: new Date(),
    });

    logger.info("contact-form.submitted", { email, messageId: result.data.id });
    return { status: "success", messageId: result.data.id };
  } catch (err) {
    logger.error("contact-form.failed", {
      err: err instanceof Error ? err.message : String(err),
      email,
    });
    return {
      status: "error",
      error: "Impossible d'envoyer pour le moment. Réessaye dans 1 minute ou écris à contact@lynarisai.com.",
    };
  }
}

function renderContactEmail(data: {
  name: string; email: string; company: string; vertical: string; message: string;
}): string {
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
    );
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8" /><title>Nouveau contact Lynaris</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0A0A0B;color:#F5F5F7;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#14141C;border-radius:12px;padding:32px;">
    <h1 style="color:#E86F4D;margin:0 0 24px;font-size:20px;">Nouveau message contact</h1>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#71717A;width:120px;">Nom</td><td style="padding:8px 0;">${escape(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#71717A;">Email</td><td style="padding:8px 0;"><a href="mailto:${escape(data.email)}" style="color:#E86F4D;">${escape(data.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#71717A;">Entreprise</td><td style="padding:8px 0;">${escape(data.company || "—")}</td></tr>
      <tr><td style="padding:8px 0;color:#71717A;">Vertical</td><td style="padding:8px 0;">${escape(data.vertical)}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #2A2A35;margin:24px 0;" />
    <p style="white-space:pre-wrap;line-height:1.6;">${escape(data.message)}</p>
    <hr style="border:none;border-top:1px solid #2A2A35;margin:24px 0;" />
    <p style="color:#71717A;font-size:12px;">Reçu via /contact. Pour répondre, utilise simplement Reply.</p>
  </div>
</body></html>`;
}
```

### Fichier 2/3 — `src/app/(marketing)/contact/_components/ContactForm.tsx`

```tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitContact, type ContactFormState } from "../_actions/submit-contact";
import { CheckCircle2, AlertCircle } from "lucide-react";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction] = useFormState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <div role="status" aria-live="polite"
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" aria-hidden />
        <h3 className="mb-2 text-lg font-semibold text-emerald-100">Message reçu</h3>
        <p className="text-sm text-emerald-200/80">
          Yoann te répond sous 24 h ouvrées. Vérifie tes spams si rien n'arrive.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {/* Honeypot — caché aux humains */}
      <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
        <label>
          Site web (laisser vide)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="Nom complet" name="name" type="text" required autoComplete="name"
        error={state.status === "error" ? state.fieldErrors?.name?.[0] : undefined} />
      <Field label="Email professionnel" name="email" type="email" required autoComplete="email"
        error={state.status === "error" ? state.fieldErrors?.email?.[0] : undefined} />
      <Field label="Entreprise (optionnel)" name="company" type="text" autoComplete="organization" />
      <SelectField label="Secteur" name="vertical" options={[
        { value: "kine", label: "Kinésithérapie" },
        { value: "resto", label: "Restauration" },
        { value: "artisan", label: "Artisanat" },
        { value: "immobilier", label: "Immobilier" },
        { value: "autre", label: "Autre" },
      ]} />
      <TextareaField label="Ton message" name="message" required rows={6}
        error={state.status === "error" ? state.fieldErrors?.message?.[0] : undefined} />

      <label className="flex items-start gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="consent" required
          className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500" />
        <span>
          J'accepte que mes données soient utilisées pour me recontacter.{" "}
          <a href="/legal/confidentialite" className="text-orange-400 underline">
            Politique de confidentialité
          </a>
        </span>
      </label>

      {state.status === "error" && !state.fieldErrors && (
        <div role="alert"
          className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 disabled:opacity-50">
      {pending ? "Envoi…" : "Envoyer le message"}
    </button>
  );
}

// Helpers Field/SelectField/TextareaField — équivalents shadcn-styled.
function Field(props: { label: string; name: string; type: string; required?: boolean; autoComplete?: string; error?: string }) {
  const id = `field-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">
        {props.label}{props.required && <span aria-hidden className="text-orange-400"> *</span>}
      </label>
      <input id={id} name={props.name} type={props.type} required={props.required}
        autoComplete={props.autoComplete} aria-invalid={!!props.error}
        aria-describedby={props.error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-orange-500 focus:outline-none" />
      {props.error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-400">{props.error}</p>}
    </div>
  );
}

function SelectField(props: { label: string; name: string; options: { value: string; label: string }[] }) {
  const id = `field-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">{props.label}</label>
      <select id={id} name={props.name} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100">
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextareaField(props: { label: string; name: string; required?: boolean; rows: number; error?: string }) {
  const id = `field-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">
        {props.label}{props.required && <span aria-hidden className="text-orange-400"> *</span>}
      </label>
      <textarea id={id} name={props.name} required={props.required} rows={props.rows}
        aria-invalid={!!props.error} aria-describedby={props.error ? `${id}-error` : undefined}
        className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-orange-500 focus:outline-none" />
      {props.error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-400">{props.error}</p>}
    </div>
  );
}
```

### Fichier 3/3 — Intégration dans `src/app/(marketing)/contact/page.tsx`

```tsx
import type { Metadata } from "next";
import { ContactForm } from "./_components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Lynaris",
  description: "Une question, un projet d'agent IA ? Yoann te répond sous 24 h.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <header className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Parlons de ton projet</h1>
        <p className="text-zinc-300">
          Décris ce que tu veux automatiser. Yoann lit chaque message, répond sous 24 h ouvrées.
        </p>
      </header>
      <ContactForm />
    </main>
  );
}
```

**Tests à ajouter** :
- `tests/unit/submit-contact.test.ts` : honeypot rejette, rate limit déclenché, validation Zod.
- `tests/e2e/contact.spec.ts` : remplir, soumettre, voir succès, vérifier email reçu (Resend test mode).

---

## BUG-002 — Newsletter avec API route

**Symptôme** : champ email newsletter (footer + blog) sans handler.
**Sévérité** : HAUTE (perte de leads passifs).

### Migration Drizzle — `src/db/migrations/00XX_newsletter.sql`

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'footer',
  vertical TEXT,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  confirm_token TEXT NOT NULL,
  unsubscribe_token TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON newsletter_subscribers (confirmed_at)
  WHERE confirmed_at IS NOT NULL;

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Pas de policy : table accédée uniquement via service role côté API.
```

### Schéma Drizzle — `src/db/schema/newsletter.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("footer"),
  vertical: text("vertical"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  confirmToken: text("confirm_token").notNull(),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### API route — `src/app/api/newsletter/subscribe/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:newsletter",
});

const resend = new Resend(env.RESEND_API_KEY);

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  source: z.string().max(40).optional().default("footer"),
  vertical: z.string().max(40).optional(),
  website: z.string().max(0).optional().default(""), // honeypot
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { success } = await ratelimit.limit(`nl:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Trop de requêtes. Réessaye plus tard." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, source, vertical } = parsed.data;

  // Idempotent : si email existe déjà confirmé, on retourne ok
  const existing = await db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email)).limit(1);

  if (existing[0]?.confirmedAt) {
    return NextResponse.json({ ok: true, already: true }, { status: 200 });
  }

  const confirmToken = randomBytes(32).toString("hex");
  const unsubscribeToken = randomBytes(32).toString("hex");

  if (existing[0]) {
    await db.update(newsletterSubscribers)
      .set({ confirmToken, source, vertical: vertical ?? existing[0].vertical })
      .where(eq(newsletterSubscribers.id, existing[0].id));
  } else {
    await db.insert(newsletterSubscribers).values({
      email, source, vertical, confirmToken, unsubscribeToken,
    });
  }

  const confirmUrl = `${env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=${confirmToken}`;

  try {
    await resend.emails.send({
      from: "Lynaris <newsletter@lynarisai.com>",
      to: [email],
      subject: "Confirme ton inscription à la newsletter Lynaris",
      html: `<p>Salut,</p>
<p>Clique pour confirmer ton inscription :</p>
<p><a href="${confirmUrl}" style="background:#E86F4D;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Confirmer mon inscription</a></p>
<p style="color:#71717A;font-size:12px;">Si tu n'as pas demandé cette inscription, ignore simplement cet email.</p>`,
      text: `Confirme ton inscription : ${confirmUrl}`,
    });
  } catch (err) {
    logger.error("newsletter.email-failed", { email, err: String(err) });
    return NextResponse.json({ error: "Erreur d'envoi. Réessaye dans 1 minute." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
```

### Route confirm — `src/app/api/newsletter/confirm/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.length !== 64) {
    return NextResponse.redirect(new URL("/newsletter/erreur", url));
  }
  const found = await db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.confirmToken, token)).limit(1);
  if (!found[0]) {
    return NextResponse.redirect(new URL("/newsletter/erreur", url));
  }
  if (!found[0].confirmedAt) {
    await db.update(newsletterSubscribers)
      .set({ confirmedAt: new Date() })
      .where(eq(newsletterSubscribers.id, found[0].id));
  }
  return NextResponse.redirect(new URL("/newsletter/confirme", url));
}
```

---

## BUG-005 — Copy-to-clipboard button

**Symptôme** : composants doc avec `<code>` sans bouton copy. Frottement développeur.

### Composant — `src/components/ui/CopyButton.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback navigateurs anciens
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <button type="button" onClick={onCopy}
      aria-label={copied ? "Copié" : label}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400">
      {copied ? (
        <><Check className="h-3.5 w-3.5" aria-hidden /> Copié</>
      ) : (
        <><Copy className="h-3.5 w-3.5" aria-hidden /> {label}</>
      )}
    </button>
  );
}
```

Usage dans MDX/Docs : `<pre>{code}</pre><CopyButton value={code} />`.

---

## BUG-006 — Rate limiting Redis (migration mémoire → Upstash)

**Symptôme** : `rateLimitMap` en mémoire dans plusieurs routes — reset à chaque cold start serverless, inefficace en prod.

### Module unifié — `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

const redis = Redis.fromEnv();

export const limiters = {
  authLogin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "rl:auth-login",
    analytics: true,
  }),
  authSignup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "rl:auth-signup",
  }),
  agentChat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:agent-chat",
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "rl:api",
  }),
} as const;

/**
 * Rate-limit avec fallback permissif si Redis tombe (jamais bloquer la prod
 * pour une panne d'infra non critique). Log obligatoire.
 */
export async function safeLimit(
  limiter: Ratelimit,
  key: string,
): Promise<{ ok: boolean; reset: number }> {
  try {
    const r = await limiter.limit(key);
    return { ok: r.success, reset: r.reset };
  } catch (err) {
    logger.error("rate-limit.redis-down", {
      err: err instanceof Error ? err.message : String(err),
      key,
    });
    return { ok: true, reset: Date.now() + 60_000 };
  }
}
```

### Migration dans une route existante — exemple `/api/auth/login`

Avant :
```typescript
const rateLimitMap = new Map<string, { count: number; reset: number }>();
// … logique manuelle
```

Après :
```typescript
import { limiters, safeLimit } from "@/lib/rate-limit";

const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
const { ok, reset } = await safeLimit(limiters.authLogin, ip);
if (!ok) {
  return NextResponse.json(
    { error: "Trop de tentatives.", retryAfter: reset },
    { status: 429, headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) } },
  );
}
```

---

## BUG-008 — Billing checkout : ownership check

**Symptôme** : `orgId` lu depuis `body` — un user peut payer pour l'org d'un autre.

### Fichier — `src/app/api/billing/checkout/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { organizationMembers, organizations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { limiters, safeLimit } from "@/lib/rate-limit";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });

const Body = z.object({
  planId: z.enum(["solo", "pro", "scale"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

const PRICES: Record<string, Record<string, string>> = {
  solo: { monthly: env.STRIPE_PRICE_SOLO_MONTHLY, yearly: env.STRIPE_PRICE_SOLO_YEARLY },
  pro: { monthly: env.STRIPE_PRICE_PRO_MONTHLY, yearly: env.STRIPE_PRICE_PRO_YEARLY },
  scale: { monthly: env.STRIPE_PRICE_SCALE_MONTHLY, yearly: env.STRIPE_PRICE_SCALE_YEARLY },
};

export async function POST(req: Request) {
  // 1. Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { ok } = await safeLimit(limiters.api, `checkout:${ip}`);
  if (!ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  // 2. Auth — orgId vient de la session, JAMAIS du body
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // 3. Récupérer l'org de l'utilisateur (member actif)
  const membership = await db
    .select({ orgId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.userId, user.id),
      eq(organizationMembers.status, "active"),
    ))
    .limit(1);

  if (!membership[0]) {
    return NextResponse.json({ error: "Aucune organisation" }, { status: 403 });
  }

  // 4. Seuls owner/admin peuvent souscrire
  if (membership[0].role !== "owner" && membership[0].role !== "admin") {
    return NextResponse.json(
      { error: "Permission insuffisante (owner ou admin requis)" },
      { status: 403 },
    );
  }

  const orgId = membership[0].orgId;

  // 5. Validation body
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

  const { planId, billing } = parsed.data;
  const priceId = PRICES[planId]?.[billing];
  if (!priceId) return NextResponse.json({ error: "Prix introuvable" }, { status: 400 });

  // 6. Récupère / crée le customer Stripe
  const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org[0]) return NextResponse.json({ error: "Org introuvable" }, { status: 404 });

  let customerId = org[0].stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: org[0].name,
      metadata: { orgId, userId: user.id },
    });
    customerId = customer.id;
    await db.update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, orgId));
  }

  // 7. Création de la session Checkout
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: { metadata: { orgId, userId: user.id } },
    metadata: { orgId, userId: user.id, planId, billing },
  });

  return NextResponse.json({ url: session.url });
}
```

---

## BUG-009 — Twilio signature validation

**Symptôme** : `/api/voice/incoming` accepte tout webhook — un attaquant peut déclencher des appels.

### Fichier — `src/app/api/voice/incoming/route.ts`

```typescript
import { NextResponse } from "next/server";
import twilio from "twilio";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const signature = req.headers.get("x-twilio-signature");
  if (!signature) {
    logger.warn("twilio.no-signature", { ip: req.headers.get("x-forwarded-for") });
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Twilio envoie x-www-form-urlencoded
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    params[k] = String(v);
  }

  // URL exacte vue par Twilio (côté public, pas Next interne)
  const url = `${env.NEXT_PUBLIC_APP_URL}/api/voice/incoming`;

  const valid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);

  if (!valid) {
    logger.warn("twilio.invalid-signature", {
      url, from: params.From, callSid: params.CallSid,
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Reste de la logique : création conversation, TwiML stream vers WebSocket
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.connect().stream({
    url: `${env.NEXT_PUBLIC_APP_URL.replace("https", "wss")}/api/voice/stream`,
  });

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
```

**Note env** : `TWILIO_AUTH_TOKEN` doit être validé dans `src/lib/env.ts` :
```typescript
TWILIO_AUTH_TOKEN: z.string().min(32),
```

---

# ANNEXE L — AUDIT DÉTAILLÉ PAGE PAR PAGE (MARKETING)

> Une fiche par route marketing publique. Notes de 0 à 10. Bugs référencés
> à l'Annexe G. Améliorations triées par priorité d'exécution.

---

#### /
**Note :** 6.5/10
**Type :** Mix Server (page.tsx) + Client (HeroScene Three.js)
**Lignes :** ~480
**Points forts :**
- Hero 3D Three.js immersif, signature visuelle forte
- Section "9 agents" lisible, identité couleur claire
- CTA principal "Essayer gratuitement" visible above-the-fold
- Schema.org `SoftwareApplication` + `Organization`
**Bugs confirmés :**
- BUG-014 : LCP > 3.5s en mobile (Three.js bloque le main thread)
- BUG-015 : aucun `priority` sur l'image LCP
- BUG-016 : trois sections sans `<h2>` → hiérarchie a11y cassée
**Améliorations UX :**
- Ajouter section preuve sociale (réelle uniquement, Julien quand validé)
- CTA secondaire "Voir une démo" qui ouvre une vidéo Loom
- Ancre vers /tarifs depuis les cartes agents
**Améliorations SEO :**
- Meta description trop longue (180 car.) → ramener à 155
- Ajouter `BreadcrumbList` JSON-LD même sur racine (Home)
- og:image dynamique avec composition agents + tagline
**Priorité :** HAUTE

#### /tarifs
**Note :** 7/10
**Type :** Server Component avec sub-Client (toggle mensuel/annuel)
**Lignes :** ~620
**Points forts :**
- Comparatif clair des 3 plans (Solo, Pro, Scale)
- Toggle mensuel/annuel avec économie affichée
- FAQ en bas de page avec schema FAQPage
**Bugs confirmés :**
- BUG-017 : économie annuelle calculée côté client → flash UX au load
- BUG-018 : CTA "Contacter ventes" pour Scale renvoie vers `/contact?plan=scale` mais la page contact n'utilise pas le query param
**Améliorations UX :**
- Tableau comparatif détaillé (features × plans) sous le cards layout
- "Le plus populaire" doit être visuellement distinct (badge orange + scale 1.02)
- Mention "Sans engagement" + "Annulation 1-clic" sous chaque CTA
**Améliorations SEO :**
- Schema `Product` + `Offer` par plan avec prix et currency
- H1 unique "Tarifs Lynaris" (vérifier qu'il n'y a pas un h1 dans le hero)
**Priorité :** HAUTE

#### /contact
**Note :** 3/10 (form cassé)
**Type :** Server avec ContactForm Client
**Lignes :** ~280
**Points forts :**
- Layout simple et focused
- Honeypot prêt côté markup
**Bugs confirmés :**
- BUG-001 : form action vide, soumission ne fait rien — CRITIQUE
- BUG-019 : pas de CSRF token sur POST
- BUG-020 : pas d'indicateur de chargement pendant submit
**Améliorations UX :**
- Toast de succès + email de confirmation envoyé au prospect
- Lien direct vers /demo si demande "voir le produit"
- Picker de créneau Calendly intégré pour Pro/Scale
**Améliorations SEO :**
- `ContactPoint` schema avec `contactType: "customer service"`
- Mentionner le délai de réponse (24h) dans la meta description
**Priorité :** CRITIQUE

#### /a-propos
**Note :** 6/10
**Type :** Server Component pur
**Lignes :** ~340
**Points forts :**
- Histoire fondateur authentique (Yoann, solopreneur)
- Mission claire : automatiser TPE/PME FR
**Bugs confirmés :**
- BUG-021 : photo Yoann manquante (placeholder gris)
- BUG-022 : timeline d'évolution avec dates futures non sourcées
**Améliorations UX :**
- Ajouter section "Pourquoi Lynaris" avec 3 valeurs concrètes
- Photo réelle + signature manuscrite scannée
- Lien vers /contact pour discuter directement
**Améliorations SEO :**
- Schema `Person` pour Yoann avec sameAs (LinkedIn, X)
- og:image avec portrait + nom
**Priorité :** MOYENNE

#### /agents
**Note :** 7.5/10
**Type :** Server Component (listing)
**Lignes :** ~280
**Points forts :**
- Grille 3×3 propre avec couleur par agent
- Brief 1-liner par agent
- Filtre par usage (téléphone, email, SEO…)
**Bugs confirmés :**
- BUG-023 : cards "En savoir plus" pour 6 agents sur 9 mènent à /agents/[slug] vide (404)
**Améliorations UX :**
- Ajouter "Disponibilité" (Live / Beta / Q4 2026) explicite
- Cas d'usage type sous chaque card
- CTA global "Quel agent pour mon métier ?" → calculateur
**Améliorations SEO :**
- `ItemList` schema listant les 9 agents
- H1 "Les 9 agents IA Lynaris"
**Priorité :** HAUTE

#### /agents/[slug] (template)
**Note :** 4/10
**Type :** Server Component dynamique
**Lignes :** ~220 (template)
**Points forts :**
- Structure générique réutilisable
- Couleur agent appliquée via CSS var
**Bugs confirmés :**
- BUG-023 : 6/9 slugs ne retournent que stub "Bientôt disponible"
- BUG-024 : pas de `generateStaticParams` → tout est SSR à chaque request
- BUG-025 : pas de `notFound()` si slug inconnu → 200 avec page vide
**Améliorations UX :**
- Sections : Rôle / Tools / Intégrations / Tarification / Cas d'usage
- Vidéo démo embedded (Loom 60s par agent)
- CTA "Activer cet agent" ouvre flux onboarding
**Améliorations SEO :**
- Meta dynamique par slug
- og:image dynamique avec couleur agent + nom
**Priorité :** HAUTE

#### /agents/marine
**Note :** 8.5/10 (livré pour Julien)
**Type :** Server avec embeds Client (audio sample)
**Lignes :** ~480
**Points forts :**
- Page la plus complète, tone parfaitement pro chaleureux
- Démo audio embarquée
- Cas Cabinet Ménigoz documenté (sans fake data)
- FAQ kiné spécifique
**Bugs confirmés :**
- BUG-026 : audio sample sans `preload="none"` (charge même si on ne joue pas)
**Améliorations UX :**
- Comparaison avant/après en chiffres (quand Julien aura 30j de data)
- Témoignage Julien intégré (vidéo 30s) une fois validé
**Améliorations SEO :**
- Schema `Service` avec `areaServed: "FR"` et `serviceType: "Réceptionniste IA"`
- Lien retour vers /agents
**Priorité :** MOYENNE

#### /agents/charles
**Note :** 7/10
**Type :** Server Component
**Lignes :** ~410
**Points forts :**
- Tools listés clairement
- Mémoire pgvector expliquée sans jargon
**Bugs confirmés :**
- BUG-027 : section "Délégation" décrit Marine + Lou mais pas les autres agents
**Améliorations UX :**
- Diagramme d'orchestration (Charles → 8 autres)
- Exemple concret "Demande Yoann → Charles déclenche 3 actions"
**Améliorations SEO :**
- Internal linking vers chaque agent délégué
**Priorité :** MOYENNE

#### /agents/alba
**Note :** 5/10 (page incomplète)
**Type :** Server Component stub
**Lignes :** ~180
**Points forts :**
- Couleur cohérente (#8B5CF6)
**Bugs confirmés :**
- BUG-028 : page sans contenu réel, juste 2 paragraphes génériques
**Améliorations UX :**
- Réécrire avec : tools tri CV, contrat, FAQ salariés
- Cas d'usage cabinet médical / artisan avec 5 employés
**Améliorations SEO :**
- Mots-clés "logiciel RH TPE", "tri CV automatique"
**Priorité :** MOYENNE

#### /agents/elio (si existe)
**Note :** 4/10 (route non confirmée publique)
**Type :** Server stub si présent
**Bugs confirmés :**
- BUG-029 : route publique vs dashboard ambiguë → clarifier
**Améliorations UX :**
- Si page publique : positionnement "Closer IA pour TPE"
- Lien vers /dashboard/agents/elio pour les users connectés
**Priorité :** FAIBLE

#### /blog
**Note :** 6.5/10
**Type :** Server avec BlogClient (filtres tags)
**Lignes :** ~310
**Points forts :**
- Cards lisibles avec date + temps lecture
- Filtre par catégorie côté client
**Bugs confirmés :**
- BUG-030 : pagination non implémentée (au-delà 12 articles, scroll infini cassé)
- BUG-031 : RSS feed annoncé en footer mais 404
**Améliorations UX :**
- Newsletter inline en bas de chaque article (pas que dans footer)
- "Articles similaires" via tags
**Améliorations SEO :**
- `Blog` schema + `BlogPosting` par article
- Sitemap dédié pour articles
**Priorité :** HAUTE

#### /blog/[slug]
**Note :** 7/10
**Type :** Server Component MDX
**Lignes :** variable selon article
**Points forts :**
- Typographie soignée, max-w-prose respecté
- Auteur + date affichés
**Bugs confirmés :**
- BUG-032 : code blocks sans bouton copy (cf. BUG-005 ANNEXE K)
- BUG-033 : ToC non sticky sur desktop
**Améliorations UX :**
- "Reading progress bar" en haut
- Partage social (X, LinkedIn, Email)
- Date de mise à jour si > 6 mois
**Améliorations SEO :**
- `BlogPosting` avec `author`, `datePublished`, `dateModified`
- Image og:dynamique par article
**Priorité :** MOYENNE

#### /docs
**Note :** 6/10
**Type :** Server avec DocsClient (navigation latérale)
**Lignes :** 1640 (DocsClient.tsx — gros fichier à splitter)
**Points forts :**
- Sidebar nav avec sections claires
- Recherche client-side
**Bugs confirmés :**
- BUG-034 : DocsClient.tsx = 1640 lignes monolithique → bundle JS énorme
- BUG-032 : pas de copy button sur snippets
- BUG-035 : pas d'ancres deep-link sur les sous-sections
**Améliorations UX :**
- Splitter en sections lazy-loadées
- "Edit on GitHub" sur chaque page
- Versioning de la doc (v1 / v2)
**Améliorations SEO :**
- Schema `TechArticle` par page doc
- Sitemap docs séparé
**Priorité :** HAUTE

#### /calculateur
**Note :** 6.5/10
**Type :** Server avec Calculator Client
**Lignes :** ~520
**Points forts :**
- Inputs simples (CA mensuel, taille équipe)
- Résultat visuel avec graphique
**Bugs confirmés :**
- BUG-036 : formule ROI codée en dur (ne reflète pas vraies hypothèses)
- BUG-037 : pas de "Sourcer les chiffres" tooltip
**Améliorations UX :**
- Sliders au lieu d'inputs (plus engageant)
- Export PDF du résultat (lead magnet)
- CTA "Discuter du chiffrage" → /contact pré-rempli
**Améliorations SEO :**
- H1 "Calculateur ROI agents IA TPE/PME"
- Schema `WebApplication`
**Priorité :** MOYENNE

#### /cas-clients
**Note :** 5/10 (peu de contenu)
**Type :** Server Component
**Lignes :** ~240
**Points forts :**
- Layout propre, cards avant/après
**Bugs confirmés :**
- BUG-038 : 1 seul cas (Cabinet Ménigoz) marqué "à venir 30j" → page semi-vide
**Améliorations UX :**
- Patienter Julien 30j, ne pas inventer → page brève honnête en attendant
- Once Julien validé : video témoignage + chiffres réels sourcés
**Améliorations SEO :**
- Schema `Review` par cas
**Priorité :** FAIBLE (attendre data réelle)

#### /carrieres
**Note :** 4/10
**Type :** Server Component
**Lignes :** ~140
**Points forts :**
- Honnête : "Nous ne recrutons pas encore"
**Bugs confirmés :**
- Aucun bug bloquant
**Améliorations UX :**
- Form "Candidature spontanée" qui POST vers /api/contact?type=carriere
- Section "Notre culture" même si solopreneur (vision)
**Améliorations SEO :**
- Schema `JobPosting` quand offre publiée
**Priorité :** FAIBLE

#### /changelog
**Note :** 5/10
**Type :** Server Component MDX
**Lignes :** ~180
**Points forts :**
- Historique des releases
**Bugs confirmés :**
- BUG-039 : RSS annoncé mais 404 (idem blog)
- BUG-040 : changelog non mis à jour depuis dernière release backend
**Améliorations UX :**
- Filtre par version
- Tags : feature, fix, breaking, security
**Améliorations SEO :**
- Schema `Article` par release
**Priorité :** MOYENNE

#### /presse
**Note :** 5/10
**Type :** Server Component
**Lignes :** ~210
**Points forts :**
- Kit presse téléchargeable annoncé
**Bugs confirmés :**
- BUG-041 : ZIP kit presse 404 (pas généré)
- BUG-042 : "Voir nos mentions presse" lien mort
**Améliorations UX :**
- Générer le ZIP avec : logos PNG/SVG, photo Yoann, fact sheet PDF
- Mentionner dates de publication réelles uniquement
**Améliorations SEO :**
- `Organization` schema avec logos haute résolution
**Priorité :** FAIBLE (priorité commerciale > presse)

#### /pour/[vertical]
**Note :** 6/10
**Type :** Server Component dynamique
**Lignes :** ~380 par vertical
**Points forts :**
- Verticales fr : kine, resto, artisan, immobilier
- Wording adapté par métier
**Bugs confirmés :**
- BUG-043 : 2 verticales sur 4 sont des stubs (immobilier, artisan)
- BUG-044 : pas de `generateStaticParams` (full SSR)
**Améliorations UX :**
- ICP-specific pain points (3 par vertical)
- Témoignage par vertical (quand dispo)
- CTA "Démarrer pour [vertical]"
**Améliorations SEO :**
- Mots-clés long tail "réceptionniste IA kiné", etc.
- Schema `Service` avec `audience` ciblée
**Priorité :** HAUTE (verticales = canal SEO majeur)

#### /legal/cgu
**Note :** 7/10
**Type :** Server Component MDX
**Lignes :** ~620
**Points forts :**
- Texte juridique propre et lisible
- Date de dernière mise à jour visible
**Bugs confirmés :**
- BUG-045 : SIRET en clair → "[à compléter]" : ne pas publier sans SIRET
**Améliorations UX :**
- Sommaire ancré
- Bouton "Télécharger PDF"
**Priorité :** CRITIQUE (bloquant pour facturation Julien)

#### /legal/confidentialite
**Note :** 7/10
**Type :** Server Component MDX
**Lignes :** ~520
**Points forts :**
- RGPD-compliant sur la forme
- Liste des sous-traitants (Stripe, Resend, Supabase, Anthropic)
**Bugs confirmés :**
- BUG-046 : DPO email "[à définir]" → mettre dpo@lynarisai.com même si redirige vers Yoann
**Améliorations UX :**
- Tableau récap des cookies
- Lien vers /legal/cookies dédié
**Priorité :** CRITIQUE (RGPD)

#### /legal/mentions-legales
**Note :** 6/10
**Type :** Server Component MDX
**Lignes :** ~180
**Bugs confirmés :**
- BUG-047 : SIRET, capital, RCS = "[à compléter]" : casus belli si publié
**Priorité :** CRITIQUE — ne PAS mettre en prod tant que SIRET pas obtenu

#### /legal/rgpd
**Note :** 7/10
**Type :** Server Component MDX
**Lignes :** ~440
**Points forts :**
- Droits utilisateurs listés (accès, rectif, oubli, portabilité)
**Bugs confirmés :**
- BUG-048 : process exercice droits via email — pas d'interface dashboard
**Améliorations UX :**
- Form `/legal/rgpd/demande` qui POST vers DPO
- Récap démarche CNIL en cas de litige
**Priorité :** HAUTE

#### /skills
**Note :** N/A (route non confirmée)
**Type :** ?
**Note :** vérifier si encore listée dans menu — sinon supprimer

#### /forgot-password
**Note :** 7.5/10 (corrigé cette session)
**Type :** Server avec ForgotPasswordForm Client
**Points forts :**
- Form Server Action propre
- Email de reset via Resend
**Améliorations UX :**
- Cooldown visible "Renvoyer dans 60s"
**Priorité :** OK (faible)

#### /login
**Note :** 7/10
**Type :** Server avec LoginForm Client
**Points forts :**
- OAuth Google + email/password
- Lien forgot-password présent
**Bugs confirmés :**
- BUG-049 : OAuth callback ne préserve pas le `?next=` query param
**Améliorations UX :**
- "Sign in with Apple" ajouté pour pro iOS
- Affichage des tentatives restantes après 3 échecs
**Priorité :** MOYENNE

#### /signup
**Note :** 7/10
**Type :** Server avec SignupForm Client
**Points forts :**
- Validation Zod + erreurs inline
- Onboarding direct après signup
**Bugs confirmés :**
- BUG-050 : pas de check-list "force du mot de passe"
**Améliorations UX :**
- Indicateur force visuel (faible/moyen/fort)
- Texte "Tu pourras tester gratuitement 14 jours"
**Priorité :** MOYENNE

---

# ANNEXE M — PLAN TESTS COMPLET

> Couverture cible : 80% lignes critiques en unit, 100% des parcours
> commerciaux en E2E. Tout PR sans test associé est refusée.

---

## Vitest — Tests unitaires

### `tests/unit/auth/get-org-id.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrgId } from "@/lib/auth/get-org-id";
import { db } from "@/db";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/db");
vi.mock("@/lib/supabase/server");

describe("getOrgId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne ANON_ORG_ID si pas de session", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    } as never);
    const result = await getOrgId();
    expect(result).toBe(process.env.ANON_ORG_ID);
  });

  it("provisionne une org si user authentifié sans org", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "u1", email: "x@y.fr" } } }) },
    } as never);
    vi.mocked(db.select as never).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    });
    vi.mocked(db.insert as never).mockReturnValue({
      values: async () => [{ id: "new-org" }],
    });
    const result = await getOrgId();
    expect(result).toBe("new-org");
  });

  it("retourne l'org existante si user a déjà une org", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    } as never);
    vi.mocked(db.select as never).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [{ orgId: "org-existing" }] }) }),
    });
    expect(await getOrgId()).toBe("org-existing");
  });
});
```

### `tests/unit/crypto.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { encrypt, decrypt, verifyHmac, signHmac } from "@/lib/crypto";

describe("crypto", () => {
  it("encrypt/decrypt roundtrip AES-256-GCM", () => {
    const plaintext = "secret-oauth-token-abc123";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("decrypt rejette payload tampered", () => {
    const encrypted = encrypt("hello");
    const tampered = encrypted.slice(0, -2) + "xx";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("HMAC verify retourne true sur signature valide", () => {
    const payload = '{"event":"test"}';
    const signature = signHmac(payload, "secret-key");
    expect(verifyHmac(payload, signature, "secret-key")).toBe(true);
  });

  it("HMAC verify retourne false sur signature invalide", () => {
    expect(verifyHmac("{}", "deadbeef", "secret-key")).toBe(false);
  });
});
```

### `tests/unit/agents/executor.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { runAgent } from "@/lib/agents/executor";

describe("agents/executor", () => {
  it("retourne après stop_reason=end_turn sans tool", async () => {
    const result = await runAgent({
      slug: "marine",
      messages: [{ role: "user", content: "Bonjour" }],
      orgId: "org-1",
    });
    expect(result.iterations).toBe(1);
    expect(result.stopReason).toBe("end_turn");
  });

  it("respecte la limite max_iterations (10)", async () => {
    // Mock : Claude répète tool_use indéfiniment
    const result = await runAgent({
      slug: "charles",
      messages: [{ role: "user", content: "loop forever" }],
      orgId: "org-1",
      _mockInfiniteToolUse: true,
    } as never);
    expect(result.iterations).toBeLessThanOrEqual(10);
    expect(result.stopReason).toBe("max_iterations");
  });

  it("propage l'erreur si tool throw", async () => {
    await expect(
      runAgent({
        slug: "marine",
        messages: [{ role: "user", content: "fail" }],
        orgId: "org-1",
        _mockToolError: true,
      } as never),
    ).rejects.toThrow();
  });
});
```

### `tests/unit/integrations/make.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { verifyMakeSignature, triggerMakeWorkflow } from "@/lib/integrations/make";

describe("integrations/make", () => {
  it("verifyMakeSignature accepte signature valide", () => {
    const body = '{"event":"new_lead"}';
    const sig = "sha256=expected"; // calculer en prod
    expect(verifyMakeSignature(body, sig, "secret")).toBe(true);
  });

  it("verifyMakeSignature rejette signature manipulée", () => {
    expect(verifyMakeSignature("{}", "sha256=wrong", "secret")).toBe(false);
  });

  it("triggerMakeWorkflow POST avec auth header", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await triggerMakeWorkflow("workflow-id", { lead: "x" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("workflow-id"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-make-apikey": expect.any(String) }),
      }),
    );
  });
});
```

### `tests/unit/api/billing-checkout.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/billing/checkout/route";

describe("POST /api/billing/checkout", () => {
  it("401 si user non authentifié", async () => {
    vi.mock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    }));
    const res = await POST(new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId: "pro" }),
    }));
    expect(res.status).toBe(401);
  });

  it("400 si planId invalide", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: "u1", email: "y@z.fr" } } }) },
      }),
    }));
    const res = await POST(new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId: "DOES_NOT_EXIST" }),
    }));
    expect(res.status).toBe(400);
  });

  it("403 si user n'est pas owner/admin", async () => {
    // mock membership.role = "member"
    const res = await POST(new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId: "pro" }),
    }));
    expect(res.status).toBe(403);
  });

  it("retourne URL Stripe pour planId valide + owner", async () => {
    // mock complet → attend { url: "https://checkout.stripe.com/..." }
    const res = await POST(new Request("http://localhost/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId: "pro", billing: "monthly" }),
    }));
    const json = await res.json();
    expect(json.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });
});
```

### `tests/unit/api/voice-incoming.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/voice/incoming/route";

describe("POST /api/voice/incoming", () => {
  it("403 sans signature x-twilio-signature", async () => {
    const res = await POST(new Request("http://localhost/api/voice/incoming", {
      method: "POST",
      body: new FormData(),
    }));
    expect(res.status).toBe(403);
  });

  it("403 si signature invalide", async () => {
    const fd = new FormData();
    fd.set("From", "+33611111111");
    const res = await POST(new Request("http://localhost/api/voice/incoming", {
      method: "POST",
      headers: { "x-twilio-signature": "bad-sig" },
      body: fd,
    }));
    expect(res.status).toBe(403);
  });

  it("200 + TwiML si signature valide", async () => {
    // mock twilio.validateRequest → true
    const fd = new FormData();
    fd.set("From", "+33611111111");
    fd.set("CallSid", "CA123");
    const res = await POST(new Request("http://localhost/api/voice/incoming", {
      method: "POST",
      headers: { "x-twilio-signature": "valid" },
      body: fd,
    }));
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<Response>");
    expect(xml).toContain("<Stream");
  });
});
```

---

## Playwright E2E — Parcours critiques

### `tests/e2e/01-signup-onboarding.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("signup → onboarding → dashboard", async ({ page }) => {
  await page.goto("/signup");
  await page.fill('[name="email"]', `test-${Date.now()}@lynaris.test`);
  await page.fill('[name="password"]', "Sup3rS3cur3!Pwd2026");
  await page.fill('[name="orgName"]', "Cabinet Test");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/onboarding/);
  await page.click('text="Suivant"');
  await page.click('text="Activer Marine"');
  await page.click('text="Terminer"');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("h1")).toContainText("Bienvenue");
});
```

### `tests/e2e/02-login-email.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("login email/password réussi", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "fixture-user@lynaris.test");
  await page.fill('[name="password"]', "fixture-pwd");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
});

test("login mauvais mdp → erreur visible", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "fixture-user@lynaris.test");
  await page.fill('[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.locator('[role="alert"]')).toContainText("identifiants");
});
```

### `tests/e2e/03-login-google.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("login Google OAuth redirige vers Google", async ({ page }) => {
  await page.goto("/login");
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.click('button:has-text("Continuer avec Google")'),
  ]);
  await expect(popup).toHaveURL(/accounts\.google\.com/);
});
```

### `tests/e2e/04-forgot-password.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("demande reset → email envoyé", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.fill('[name="email"]', "fixture-user@lynaris.test");
  await page.click('button[type="submit"]');
  await expect(page.locator('[role="status"]')).toContainText("Email envoyé");
});

test("rate limit après 3 demandes", async ({ page }) => {
  for (let i = 0; i < 4; i++) {
    await page.goto("/forgot-password");
    await page.fill('[name="email"]', "spam@test.fr");
    await page.click('button[type="submit"]');
  }
  await expect(page.locator('[role="alert"]')).toContainText("Trop de");
});
```

### `tests/e2e/05-contact-form.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("contact form → soumission → confirmation", async ({ page }) => {
  await page.goto("/contact");
  await page.fill('[name="name"]', "Jean Dupont");
  await page.fill('[name="email"]', "jean@test.fr");
  await page.selectOption('[name="vertical"]', "kine");
  await page.fill('[name="message"]', "Je veux automatiser mon standard téléphonique.");
  await page.check('[name="consent"]');
  await page.click('button[type="submit"]');
  await expect(page.locator('[role="status"]')).toContainText("Message reçu");
});

test("contact form rejette si message trop court", async ({ page }) => {
  await page.goto("/contact");
  await page.fill('[name="name"]', "Test");
  await page.fill('[name="email"]', "t@t.fr");
  await page.fill('[name="message"]', "court");
  await page.check('[name="consent"]');
  await page.click('button[type="submit"]');
  await expect(page.locator('[role="alert"]').first()).toContainText("trop court");
});
```

### `tests/e2e/06-newsletter.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("newsletter footer → inscription", async ({ page }) => {
  await page.goto("/");
  await page.fill('footer [name="email"]', `nl-${Date.now()}@test.fr`);
  await page.click('footer button:has-text("S\'inscrire")');
  await expect(page.locator('[role="status"]')).toContainText("Confirme");
});
```

### `tests/e2e/07-calculateur.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("calculateur ROI : inputs → résultats → CTA", async ({ page }) => {
  await page.goto("/calculateur");
  await page.fill('[name="ca"]', "15000");
  await page.fill('[name="appels"]', "120");
  await page.click('button:has-text("Calculer")');
  await expect(page.locator('[data-testid="roi-result"]')).toBeVisible();
  await page.click('a:has-text("Discuter du chiffrage")');
  await expect(page).toHaveURL(/\/contact/);
});
```

### `tests/e2e/08-agents-listing.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("agents listing → détail Marine", async ({ page }) => {
  await page.goto("/agents");
  await expect(page.locator("h1")).toContainText("9 agents");
  await page.click('a[href="/agents/marine"]');
  await expect(page.locator("h1")).toContainText("Marine");
  await expect(page.locator("audio")).toBeVisible();
});
```

### `tests/e2e/09-dashboard-chat.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("dashboard chat agent : streaming response", async ({ page }) => {
  await page.goto("/dashboard/agents/marine");
  await page.click('button:has-text("Tester")');
  await page.fill('[data-testid="chat-input"]', "Bonjour, peux-tu prendre un RDV ?");
  await page.click('[data-testid="chat-send"]');
  // Attend début du streaming
  await expect(page.locator('[data-testid="agent-message"]').last()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="agent-message"]').last()).toContainText(/[a-z]{20,}/);
});
```

### `tests/e2e/10-billing-checkout.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/owner.json" });

test("billing : upgrade plan → Stripe checkout", async ({ page }) => {
  await page.goto("/dashboard/billing");
  await page.click('[data-plan="pro"] button:has-text("Passer Pro")');
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10000 });
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
});
```

### `tests/e2e/11-integrations-google.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("integrations : connecter Google Calendar", async ({ page }) => {
  await page.goto("/dashboard/integrations");
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.click('[data-integration="google-calendar"] button:has-text("Connecter")'),
  ]);
  await expect(popup).toHaveURL(/accounts\.google\.com/);
});
```

### `tests/e2e/12-team-invite.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/owner.json" });

test("team : inviter membre par email", async ({ page }) => {
  await page.goto("/dashboard/team");
  await page.click('button:has-text("Inviter")');
  await page.fill('[name="email"]', `invite-${Date.now()}@test.fr`);
  await page.selectOption('[name="role"]', "member");
  await page.click('button:has-text("Envoyer l\'invitation")');
  await expect(page.locator('[role="status"]')).toContainText("Invitation envoyée");
});
```

### `tests/e2e/13-settings-profile.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("settings : modifier nom profil", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.fill('[name="fullName"]', "Yoann Cabon");
  await page.click('button:has-text("Enregistrer")');
  await expect(page.locator('[role="status"]')).toContainText("Profil mis à jour");
});
```

### `tests/e2e/14-blog.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("blog : liste → article → newsletter", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator('article').first()).toBeVisible();
  await page.click('article >> nth=0 >> a');
  await expect(page.locator("h1")).toBeVisible();
  await page.fill('article [name="email"]', `blog-${Date.now()}@test.fr`);
  await page.click('article button:has-text("S\'inscrire")');
  await expect(page.locator('[role="status"]')).toBeVisible();
});
```

### `tests/e2e/15-tarifs-toggle.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("tarifs : toggle mensuel/annuel → CTA signup", async ({ page }) => {
  await page.goto("/tarifs");
  await expect(page.locator('[data-plan="pro"]')).toContainText("/mois");
  await page.click('button:has-text("Annuel")');
  await expect(page.locator('[data-plan="pro"]')).toContainText(/économise/i);
  await page.click('[data-plan="pro"] a:has-text("Démarrer")');
  await expect(page).toHaveURL(/\/signup/);
});
```

---

# ANNEXE N — DESIGN SYSTEM COMPLET

> Source de vérité : tokens en CSS variables OKLCH, exposés via Tailwind v4
> dans `globals.css`. Aucun hex en dur dans les composants — sinon revue
> adverse `code-reviewer` rejette le PR.

---

## CSS Variables — `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* ============ COULEURS BRAND ============ */
  --color-brand-primary: oklch(67% 0.16 38);          /* #E86F4D — orange Lynaris */
  --color-brand-primary-dark: oklch(56% 0.15 32);     /* #C8522F — hover */
  --color-brand-primary-light: oklch(78% 0.12 42);    /* tints lights */
  --color-brand-secondary: oklch(34% 0.02 260);       /* charcoal */
  --color-brand-accent: oklch(72% 0.18 45);           /* amber accent */

  /* ============ COULEURS AGENTS (9 agents) ============ */
  --color-agent-marine: oklch(78% 0.13 200);          /* #22D3EE cyan */
  --color-agent-marine-10: oklch(78% 0.13 200 / 0.10);
  --color-agent-marine-20: oklch(78% 0.13 200 / 0.20);
  --color-agent-marine-30: oklch(78% 0.13 200 / 0.30);

  --color-agent-charles: oklch(56% 0.20 290);         /* #7C3AED violet */
  --color-agent-charles-10: oklch(56% 0.20 290 / 0.10);
  --color-agent-charles-20: oklch(56% 0.20 290 / 0.20);
  --color-agent-charles-30: oklch(56% 0.20 290 / 0.30);

  --color-agent-elio: oklch(70% 0.16 162);            /* #10B981 emerald */
  --color-agent-elio-10: oklch(70% 0.16 162 / 0.10);
  --color-agent-elio-20: oklch(70% 0.16 162 / 0.20);
  --color-agent-elio-30: oklch(70% 0.16 162 / 0.30);

  --color-agent-mae: oklch(76% 0.15 70);              /* #F59E0B amber */
  --color-agent-mae-10: oklch(76% 0.15 70 / 0.10);
  --color-agent-mae-20: oklch(76% 0.15 70 / 0.20);
  --color-agent-mae-30: oklch(76% 0.15 70 / 0.30);

  --color-agent-max: oklch(68% 0.20 350);             /* #EC4899 pink */
  --color-agent-max-10: oklch(68% 0.20 350 / 0.10);
  --color-agent-max-20: oklch(68% 0.20 350 / 0.20);
  --color-agent-max-30: oklch(68% 0.20 350 / 0.30);

  --color-agent-alba: oklch(64% 0.20 295);            /* #8B5CF6 violet clair */
  --color-agent-alba-10: oklch(64% 0.20 295 / 0.10);
  --color-agent-alba-20: oklch(64% 0.20 295 / 0.20);
  --color-agent-alba-30: oklch(64% 0.20 295 / 0.30);

  --color-agent-nova: oklch(60% 0.18 270);            /* #6366F1 indigo */
  --color-agent-nova-10: oklch(60% 0.18 270 / 0.10);
  --color-agent-nova-20: oklch(60% 0.18 270 / 0.20);
  --color-agent-nova-30: oklch(60% 0.18 270 / 0.30);

  --color-agent-lou: oklch(76% 0.13 0);               /* #F472B6 rose */
  --color-agent-lou-10: oklch(76% 0.13 0 / 0.10);
  --color-agent-lou-20: oklch(76% 0.13 0 / 0.20);
  --color-agent-lou-30: oklch(76% 0.13 0 / 0.30);

  --color-agent-orion: oklch(58% 0.03 240);           /* #64748B slate */
  --color-agent-orion-10: oklch(58% 0.03 240 / 0.10);
  --color-agent-orion-20: oklch(58% 0.03 240 / 0.20);
  --color-agent-orion-30: oklch(58% 0.03 240 / 0.30);

  /* ============ COULEURS SÉMANTIQUES ============ */
  --color-success: oklch(70% 0.16 162);
  --color-success-bg: oklch(70% 0.16 162 / 0.10);
  --color-error: oklch(63% 0.21 25);
  --color-error-bg: oklch(63% 0.21 25 / 0.10);
  --color-warning: oklch(76% 0.15 70);
  --color-warning-bg: oklch(76% 0.15 70 / 0.10);
  --color-info: oklch(70% 0.13 230);
  --color-info-bg: oklch(70% 0.13 230 / 0.10);

  /* ============ SURFACES ============ */
  --color-bg: oklch(11% 0.005 260);                   /* #09090B fond app */
  --color-bg-alt: oklch(13% 0.005 260);               /* #0A0A0B fond marketing */
  --color-surface-1: oklch(16% 0.01 260);             /* #14141C cards */
  --color-surface-2: oklch(20% 0.01 260);             /* hover cards */
  --color-surface-3: oklch(24% 0.01 260);             /* nested cards */
  --color-border: oklch(28% 0.01 260);                /* bordures par défaut */
  --color-border-subtle: oklch(22% 0.01 260);         /* bordures discrètes */
  --color-border-strong: oklch(38% 0.01 260);         /* bordures focus */

  /* ============ TEXTE ============ */
  --color-text-primary: oklch(96% 0.005 260);         /* #F5F5F7 */
  --color-text-primary-alt: oklch(98% 0.003 260);     /* #FAFAFA pure */
  --color-text-secondary: oklch(60% 0.01 260);        /* #71717A */
  --color-text-tertiary: oklch(48% 0.01 260);         /* #52525B */
  --color-text-disabled: oklch(38% 0.01 260);
  --color-text-on-brand: oklch(98% 0.003 260);        /* texte sur orange */
  --color-text-link: var(--color-brand-primary);

  /* ============ ESPACEMENTS (base 4px) ============ */
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */

  /* ============ RAYONS ============ */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px — défaut buttons/inputs */
  --radius-lg: 0.75rem;   /* 12px — cards */
  --radius-xl: 1rem;      /* 16px — modals */
  --radius-2xl: 1.5rem;   /* 24px — hero containers */
  --radius-full: 9999px;

  /* ============ OMBRES ============ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.20);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.30), 0 2px 4px -2px rgb(0 0 0 / 0.30);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.40), 0 4px 6px -4px rgb(0 0 0 / 0.40);
  --shadow-glow-brand: 0 0 24px 0 oklch(67% 0.16 38 / 0.35);
  --shadow-glow-marine: 0 0 24px 0 oklch(78% 0.13 200 / 0.35);

  /* ============ ANIMATIONS ============ */
  --duration-instant: 75ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-out: cubic-bezier(0.16, 1, 0.3, 1);
  --easing-in: cubic-bezier(0.7, 0, 0.84, 0);
  --easing-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* ============ Z-INDEX ============ */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-overlay: 1200;
  --z-modal: 1300;
  --z-popover: 1400;
  --z-toast: 1500;
  --z-tooltip: 1600;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Selection */
::selection {
  background: var(--color-brand-primary);
  color: var(--color-text-on-brand);
}

/* Focus visible global */
:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

## Migration plan inline styles → CSS tokens

Tableau de correspondance pour `grep -r` et remplacement automatisé.

| Hex actuel | Variable CSS | Usage type |
|---|---|---|
| `#E86F4D` | `var(--color-brand-primary)` | CTA, accents marketing |
| `#C8522F` | `var(--color-brand-primary-dark)` | hover CTA |
| `#7C3AED` | `var(--color-agent-charles)` | Charles |
| `#22D3EE` | `var(--color-agent-marine)` | Marine |
| `#10B981` | `var(--color-agent-elio)` | Elio (= success) |
| `#F59E0B` | `var(--color-agent-mae)` | Mae (= warning) |
| `#EC4899` | `var(--color-agent-max)` | Max |
| `#8B5CF6` | `var(--color-agent-alba)` | Alba |
| `#6366F1` | `var(--color-agent-nova)` | Nova |
| `#F472B6` | `var(--color-agent-lou)` | Lou |
| `#64748B` | `var(--color-agent-orion)` | Orion |
| `#09090B` | `var(--color-bg)` | fond app dashboard |
| `#0A0A0B` | `var(--color-bg-alt)` | fond marketing |
| `#14141C` | `var(--color-surface-1)` | cards niveau 1 |
| `#F5F5F7` | `var(--color-text-primary)` | corps texte |
| `#71717A` | `var(--color-text-secondary)` | texte secondaire |
| `#FAFAFA` | `var(--color-text-primary-alt)` | titres hero |

### Script de migration — `scripts/migrate-colors.ts`

```typescript
import { glob } from "glob";
import { readFile, writeFile } from "node:fs/promises";

const REPLACEMENTS: Record<string, string> = {
  "#E86F4D": "var(--color-brand-primary)",
  "#C8522F": "var(--color-brand-primary-dark)",
  "#7C3AED": "var(--color-agent-charles)",
  "#22D3EE": "var(--color-agent-marine)",
  "#10B981": "var(--color-agent-elio)",
  "#F59E0B": "var(--color-agent-mae)",
  "#EC4899": "var(--color-agent-max)",
  "#8B5CF6": "var(--color-agent-alba)",
  "#6366F1": "var(--color-agent-nova)",
  "#F472B6": "var(--color-agent-lou)",
  "#64748B": "var(--color-agent-orion)",
  "#09090B": "var(--color-bg)",
  "#0A0A0B": "var(--color-bg-alt)",
  "#14141C": "var(--color-surface-1)",
  "#F5F5F7": "var(--color-text-primary)",
  "#71717A": "var(--color-text-secondary)",
  "#FAFAFA": "var(--color-text-primary-alt)",
};

const files = await glob("src/**/*.{ts,tsx,css}", {
  ignore: ["**/node_modules/**", "**/globals.css"],
});

let totalReplacements = 0;
for (const file of files) {
  let content = await readFile(file, "utf8");
  let fileReplaced = 0;
  for (const [hex, cssVar] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(hex.replace("#", "\\#"), "gi");
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, cssVar);
      fileReplaced += matches.length;
    }
  }
  if (fileReplaced > 0) {
    await writeFile(file, content);
    console.log(`✓ ${file}: ${fileReplaced} remplacements`);
    totalReplacements += fileReplaced;
  }
}
console.log(`\nTotal: ${totalReplacements} hex remplacés.`);
```

Commande : `pnpm tsx scripts/migrate-colors.ts`

**Garde-fou** : ajouter une ESLint rule custom qui rejette `/#[0-9a-fA-F]{6}/` dans les fichiers `.tsx` (sauf `globals.css`).

---

# ANNEXE O — PERFORMANCE & LIGHTHOUSE TARGETS

> Sans performance, pas de crédibilité — un kiné teste sur son iPhone 8
> en 4G dégradée. Lighthouse mobile ≥ 85, desktop ≥ 95, sinon revue
> bloque le PR.

---

## Cibles par page principale

| Page | LCP | INP | CLS | Stratégie clé |
|---|---|---|---|---|
| `/` | < 2.5s | < 200ms | < 0.1 | Lazy HeroScene, preload fonts, dynamic Three.js |
| `/tarifs` | < 1.8s | < 150ms | < 0.05 | Pas de 3D, JS minimal, RSC |
| `/contact` | < 1.5s | < 100ms | < 0.05 | Form Server Action, JS quasi nul |
| `/blog` | < 2.0s | < 150ms | < 0.10 | Images `next/image` lazy, listing RSC |
| `/blog/[slug]` | < 1.8s | < 100ms | < 0.05 | MDX statique build-time |
| `/docs` | < 1.5s | < 200ms | < 0.05 | Splitter DocsClient en lazy chunks |
| `/dashboard` | < 2.5s | < 200ms | < 0.10 | Suspense streaming, skeleton |
| `/dashboard/agents/[slug]` | < 2.0s | < 200ms | < 0.10 | Streaming TTFB < 500ms |

---

## Bundle analysis actuel (estimations)

| Dépendance | Poids gzip | Verdict |
|---|---|---|
| Three.js | ~200KB gzip (~600KB raw) | DOIT être lazy import |
| Framer Motion | ~12KB gzip (~40KB raw) | OK si tree-shaké |
| GSAP | ~20KB gzip (~60KB raw) | DOIT être lazy import |
| Anthropic SDK | ~25KB gzip (~80KB raw) | Server-only, jamais bundle client |
| lucide-react | ~10KB gzip si named imports | OK (déjà fait) |
| @anthropic-ai/sdk | server-only | OK |
| @supabase/ssr | ~15KB gzip | OK |
| Drizzle | server-only | OK |

**Total initial bundle estimé homepage** : ~250KB gzip → cible **< 200KB gzip**.

---

## Stratégies d'optimisation prioritaires

### 1. Hero Three.js → `next/dynamic` avec `ssr: false`

```tsx
// src/app/(marketing)/page.tsx
import dynamic from "next/dynamic";

const HeroScene = dynamic(() => import("./_components/HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});
```

`HeroFallback` = image statique optimisée `next/image` avec `priority` qui devient le LCP officiel.

### 2. GSAP animations → lazy import au mount

```tsx
useEffect(() => {
  let mounted = true;
  (async () => {
    const { gsap } = await import("gsap");
    if (!mounted) return;
    gsap.from(".reveal", { y: 20, opacity: 0, stagger: 0.05 });
  })();
  return () => { mounted = false; };
}, []);
```

### 3. Vérifier qu'Anthropic SDK n'est jamais dans le bundle client

ESLint rule custom `import/no-restricted-paths` :
```json
{
  "import/no-restricted-paths": ["error", {
    "zones": [{
      "from": "node_modules/@anthropic-ai/sdk",
      "target": "src/app/**/_components/**",
      "message": "Anthropic SDK est server-only. Utilise une API route."
    }]
  }]
}
```

### 4. Tree-shaking lucide-react — déjà conforme

Vérifier qu'aucun import ne fait `import * as Icons from "lucide-react"` (catastrophe). Tous doivent être `import { ChevronRight } from "lucide-react"`.

### 5. DocsClient.tsx (1640 lignes) → code splitting par section

```tsx
// Avant : tout en un seul fichier
// Après :
const DocsAuth = dynamic(() => import("./sections/DocsAuth"));
const DocsAgents = dynamic(() => import("./sections/DocsAgents"));
const DocsAPI = dynamic(() => import("./sections/DocsAPI"));
// ... une section par chunk
```

Chaque section fait < 200 lignes, charge à la demande.

### 6. Preload fonts critiques

```tsx
// src/app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});
```

### 7. `next/image` — toujours `priority` sur LCP

```tsx
<Image
  src="/hero-fallback.webp"
  alt=""
  width={1280}
  height={720}
  priority
  sizes="(max-width: 768px) 100vw, 1280px"
  fetchPriority="high"
/>
```

### 8. CSS critical inline — automatique via Next 15

Vérifier dans `next.config.ts` :
```typescript
experimental: {
  optimizeCss: true,
}
```

### 9. Bundle analyzer obligatoire avant chaque release

```bash
ANALYZE=true pnpm build
```

Configuré dans `next.config.ts` via `@next/bundle-analyzer`. Output : `.next/analyze/client.html`.

### 10. Lighthouse CI dans GitHub Actions

`.github/workflows/lighthouse.yml` lance `lhci autorun` sur chaque PR avec assertions :

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

---

## Monitoring runtime — production

- **Vercel Analytics** activé pour CWV réels (RUM)
- **Sentry Performance** pour traces serverless > 1s
- **Axiom** pour log structuré + dashboard custom
- Alerte Slack si LCP P75 > 3s pendant 1h

---

Fin des annexes K, L, M, N, O.
