# AUDIT COMPLET LYNARIS — 2026-04-25

> Synthèse de 4 rapports d'analyse couvrant marketing/SEO, dashboard/features, API/sécurité et design system. Chaque problème inclut sa localisation exacte et sa priorité.

---

## RÉSUMÉ EXÉCUTIF

**Score global : 7.7/10**

| Domaine | Note | Statut |
|---|---|---|
| Sécurité | 6.5/10 | 🔴 CRITIQUE |
| Marketing & SEO | 7.8/10 | 🟡 MOYENNE |
| Dashboard & Features | 7.4/10 | 🟠 HAUTE |
| API & Backend | 7.4/10 | 🟠 HAUTE |
| Design System | 9.0/10 | 🟢 OK |
| Accessibilité | 7.0/10 | 🟡 MOYENNE |
| Performance | 8.0/10 | 🟢 OK |
| Responsive | 9.0/10 | 🟢 OK |

### Top 10 priorités absolues

1. 🔴 `/api/admin/test-emails` non protégé → envoi d'emails à n'importe qui
2. 🔴 `.env.example` contient un vrai secret visible (`GMAIL_APP_PASSWORD`)
3. 🔴 Contradiction "120+ clients" vs 1 seul cas client réel → atteinte à la crédibilité
4. 🔴 `AggregateRating` schema.org avec "4.9/5 de 47 reviews" → fake non sourcé
5. 🔴 `ANON_ORG_ID` UUID fixe en fallback dans 32 routes → risque cross-session
6. 🟠 Analytics entièrement generée par `seededRandom()` → aucune vraie donnée
7. 🟠 Dashboard KPIs via `seededRandom` + localStorage → fake data visible en prod
8. 🟠 n8n webhook : validation TODO non implémentée, `n8n_runs` non peuplée
9. 🟠 `dangerouslySetInnerHTML` dans articles blog → XSS potentiel
10. 🟡 OG/OpenGraph absent sur ~40% des pages marketing → partage social cassé

---

## SECTION 1 — SÉCURITÉ 🔴

> Note : **6.5/10** — Domaine le plus critique. Plusieurs vecteurs d'attaque ouverts en prod.

### 1.1 Endpoint admin non protégé 🔴 CRITIQUE

**Fichier :** `src/app/api/admin/test-emails/route.ts`

N'importe quel utilisateur non authentifié peut appeler cet endpoint et déclencher un envoi d'email vers n'importe quelle adresse. Vecteur de spam, phishing, et abus de quota Resend.

**Fix :** Ajouter vérification `session.user.role === 'admin'` + rate limit Upstash.

---

### 1.2 Secret réel dans .env.example 🔴 CRITIQUE

**Fichier :** `.env.example`, ligne variable `GMAIL_APP_PASSWORD`

Valeur du Gmail App Password autrefois citée en clair dans ce document — désormais retirée. Le mot de passe a été révoqué et régénéré (rotation forcée).

**Fix :** Remplacer par `GMAIL_APP_PASSWORD=your_gmail_app_password_here`. Révoquer l'app password actuel immédiatement.

---

### 1.3 ANON_ORG_ID UUID fixe en fallback 🔴 CRITIQUE

**Fichier :** 32 routes API (pattern `const orgId = session?.orgId ?? ANON_ORG_ID`)

Un UUID fixe utilisé comme fallback d'organisation dans 32 routes. Si une session expire ou est mal propagée, des requêtes de différents utilisateurs peuvent lire/écrire dans le même contexte organisationnel.

**Fix :** Retourner `401 Unauthorized` si `orgId` absent. Supprimer le fallback.

---

### 1.4 CSP unsafe-inline + unsafe-eval 🟠 HAUTE

**Fichier :** `src/middleware.ts` ou `next.config.ts` (headers CSP)

`unsafe-inline` autorise l'injection de scripts inline. `unsafe-eval` autorise `eval()`. Combinés, ils annulent la majorité des protections XSS apportées par la CSP.

**Fix :** Migrer vers CSP avec nonces (Next.js 15 support natif). Remplacer `eval` usages (généralement dans les animations ou librairies tierces).

---

### 1.5 n8n webhook validation non implémentée 🟠 HAUTE

**Fichier :** `src/app/api/webhooks/n8n/route.ts`, ligne 26 et 42

- Ligne 26 : `// TODO: fetch org secret` — HMAC non vérifié
- Ligne 42 : `// db.update(n8nRuns)...` — commenté, exécutions non tracées

N'importe qui connaissant l'URL webhook peut déclencher des actions n8n au nom d'une org.

**Fix :** Implémenter HMAC-SHA256 avec le secret stocké en DB par org. Décommenter la mise à jour `n8n_runs`.

---

### 1.6 dangerouslySetInnerHTML dans blog 🟠 HAUTE

**Fichier :** `src/app/(marketing)/blog/_components/BlogClient.tsx` (ou composant article)

Si le CMS (ou données statiques) est compromis, un contenu malveillant peut exécuter du JS arbitraire côté client.

**Fix :** Utiliser `DOMPurify` avant rendu, ou migrer vers MDX compilé server-side (pas de `dangerouslySetInnerHTML`).

---

### 1.7 Contact form sans protection anti-bots 🟡 MOYENNE

**Fichier :** `src/app/(marketing)/contact/page.tsx`

Aucun CAPTCHA ni honeypot. Le formulaire peut être abusé pour spam ou flood de la boîte mail.

**Fix :** Ajouter Cloudflare Turnstile (gratuit, léger, RGPD-friendly) ou honeypot field.

---

### 1.8 Emails contact hardcodés (pas env vars) 🟡 MOYENNE

**Fichier :** Plusieurs pages marketing (contact, presse, etc.)

Emails en dur dans le JSX. Toute modification nécessite un redéploiement. Exposition dans le bundle client.

**Fix :** Déplacer dans `src/lib/env.ts` avec validation Zod, ou `NEXT_PUBLIC_CONTACT_EMAIL`.

---

## SECTION 2 — MARKETING & SEO 🟡

> Note : **7.8/10** — Bonne structure, mais contradictions de contenu graves et lacunes techniques.

### 2.1 Contradiction "120+ clients" vs 1 cas client 🔴 CRITIQUE

**Fichier :** `src/app/(marketing)/presse/page.tsx` vs `src/app/(marketing)/cas-clients/page.tsx`

La page presse affiche "120+ clients" mais la page cas clients ne présente qu'un seul cas (Cabinet Ménigoz). Contradiction immédiatement visible par tout journaliste ou prospect qui clique.

**Fix :** Soit supprimer le chiffre "120+" (non sourcé → règle absolue Lynaris), soit ajouter des cas clients réels. Ne pas inventer.

---

### 2.2 AggregateRating schema.org fake 🔴 CRITIQUE

**Fichier :** `src/app/(marketing)/page.tsx` ou composant hero (schema.org JSON-LD)

`"ratingValue": "4.9", "reviewCount": "47"` — données non sourcées. Google peut détecter la fraude de données structurées et pénaliser le référencement. Risque DGCCRF (faux avis).

**Fix :** Supprimer le `AggregateRating` jusqu'à avoir de vraies reviews. Remplacer par `Organization` simple.

---

### 2.3 OpenGraph absent sur ~40% des pages 🟠 HAUTE

**Pages concernées :** Blog articles, carrières, changelog, certaines pages légales

Sans OG tags, les partages sur LinkedIn/Twitter/Slack affichent un aperçu vide ou générique. Perte de clics significative.

**Fix :** Ajouter `generateMetadata()` avec `openGraph` dans chaque `page.tsx` manquant. Template OG image dynamique via `src/app/opengraph-image.tsx`.

---

### 2.4 URL `/confidentialite` cassée ❌

**Fichier :** Liens internes (footer, CGU, mentions légales)

Le lien pointe vers `/confidentialite` mais la route réelle est `/legal/confidentialite` (ou inverse). 404 en prod.

**Fix :** Auditer tous les liens footer et corriger. Ajouter redirect `301` dans `next.config.ts` pour l'ancienne URL.

---

### 2.5 URL `/cas-clients/cabinet-menigoz` inexistante ❌

**Fichier :** `src/app/(marketing)/agents/marine/page.tsx` ou page tarifs (lien CTA)

Le lien vers le cas client détaillé génère un 404. Cassé pour Julien Ménigoz si partagé.

**Fix :** Créer la page ou supprimer le lien jusqu'à création.

---

### 2.6 Press kit URLs non vérifiées ⚠️

**Fichier :** `src/app/(marketing)/presse/page.tsx`

Les liens `/press/*.zip` pointent vers des fichiers dont l'existence n'est pas confirmée. 404 potentiel devant des journalistes.

**Fix :** Vérifier que les fichiers existent dans `public/press/`. Si non, désactiver les boutons de téléchargement avec `disabled` et texte "Bientôt disponible".

---

### 2.7 Newsletter signup absent du footer 🟡 MOYENNE

**Fichier :** `src/app/(app)/layout.tsx` ou composant footer marketing

Aucun champ d'inscription newsletter. Opportunité de capture de leads manquée sur toutes les pages.

**Fix :** Ajouter formulaire email simple avec intégration Resend audience. 1 champ, 1 bouton.

---

### 2.8 Scores pages marketing

| Page | Score | Problèmes principaux |
|---|---|---|
| Homepage | 8/10 | AggregateRating fake, OG ok |
| Tarifs | 8/10 | — |
| Contact | 7.5/10 | Pas de CAPTCHA |
| A-propos | 7/10 | OG manquant |
| Agents list | 8/10 | — |
| Agent detail | 8.5/10 | — |
| Blog list | 6.5/10 | OG absent, articles non vérifiables |
| Blog article | 7.5/10 | `dangerouslySetInnerHTML` |
| Cas clients | 5/10 🔴 | 1 cas vs "120+ clients" |
| Carrières | 6/10 | Contenu sparse |
| Changelog | 8/10 | — |
| Presse | 7/10 | Press kit URLs non vérifiées |
| Verticals | 7/10 | Seul kiné complet |
| Calculateur | 7.5/10 | — |
| CGU | 7/10 | Lien `/confidentialite` cassé |
| Confidentialité | 7.5/10 | URL ambiguë |
| Mentions légales | 6.5/10 | SIRET ? |

---

## SECTION 3 — DASHBOARD & FEATURES 🟠

> Note : **7.4/10** — Architecture solide mais omniprésence de fake data problématique en démo client.

### 3.1 Analytics : 100% fake data 🔴 CRITIQUE

**Fichier :** `src/app/(app)/dashboard/analytics/page.tsx`

Toutes les métriques sont générées par `seededRandom()`. Aucune donnée réelle. Si Julien Ménigoz ouvre l'analytics, il voit des chiffres inventés présentés comme réels.

**Fix :** Soit connecter les vraies données Supabase (appels Twilio, messages Anthropic), soit afficher explicitement "Données de démonstration" avec un badge visible et désactiver les graphiques pour les orgs sans données.

---

### 3.2 Dashboard KPIs : seededRandom + localStorage 🟠 HAUTE

**Fichier :** `src/app/(app)/dashboard/page.tsx`

KPIs (appels traités, RDV pris, taux satisfaction) générés aléatoirement. `localStorage` comme fallback. Valeurs changent selon le seed, pas selon l'activité réelle.

**Fix :** Requêtes Supabase réelles ou état "empty" avec CTA pour activer l'agent.

---

### 3.3 CRM : 10 contacts mock avec vrais noms français 🟠 HAUTE

**Fichier :** `src/app/(app)/dashboard/conversations/page.tsx` ou CRM component

Noms de personnes réels utilisés comme données de test (ex. Sophie L., Alexandre B. — patterns interdits par règles absolues).

**Fix :** Supprimer les mock contacts. Afficher empty state "Aucun prospect pour l'instant" avec guide d'import.

---

### 3.4 Billing : renewal date hardcodée 🟠 HAUTE

**Fichier :** `src/app/(app)/dashboard/billing/page.tsx`

`"1er mai 2026"` hardcodé. Date Stripe non utilisée. Après le 1er mai, la date sera fausse pour tous les utilisateurs.

**Fix :** Récupérer `current_period_end` depuis l'API Stripe ou la table `subscriptions` en DB.

---

### 3.5 Team : invites en localStorage 🟠 HAUTE

**Fichier :** `src/app/(app)/dashboard/team/page.tsx`

Les invitations membres sont stockées en `localStorage`. Aucun email réel envoyé. Réinitialisées si l'utilisateur vide son cache.

**Fix :** Table `invites` en DB + envoi email via Resend au moment de l'invitation.

---

### 3.6 Conversations : erreurs API masquées 🟠 HAUTE

**Fichier :** `src/app/(app)/dashboard/conversations/page.tsx`

Quand l'API échoue, les données mock sont affichées silencieusement. L'utilisateur ne sait pas que les vraies données sont indisponibles.

**Fix :** Afficher une bannière d'erreur avec retry. Ne jamais substituer silencieusement des données mock en cas d'erreur prod.

---

### 3.7 CRM : delete permanent sans undo 🟡 MOYENNE

**Fichier :** `src/app/(app)/dashboard/conversations/page.tsx` (CRM section)

Suppression irréversible sans confirmation ni période d'annulation. Risque de perte de données.

**Fix :** Modale de confirmation + soft delete (colonne `deleted_at`) + undo 5s via toast.

---

### 3.8 Analytics chart non responsive 🟡 MOYENNE

**Fichier :** `src/app/(app)/dashboard/analytics/page.tsx` (composant LineChart)

`width: 900` fixe en pixels sur le LineChart. Déborde sur mobile, inutilisable < 900px.

**Fix :** `width="100%"` + `ResponsiveContainer` (Recharts) ou `useResizeObserver`.

---

### 3.9 Onboarding : confetti sans prefers-reduced-motion 🟡 MOYENNE

**Fichier :** `src/app/(app)/onboarding/page.tsx`

L'animation confetti au succès onboarding ne vérifie pas `prefers-reduced-motion`. Violation WCAG 2.3.3.

**Fix :** `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { launchConfetti() }`

---

### 3.10 Intégrations : 50+ marquées "comingSoon", modals non fonctionnelles 🔵 FEATURE

**Fichier :** `src/app/(app)/dashboard/integrations/page.tsx`

50+ intégrations en `comingSoon`. Les modals de connexion s'ouvrent mais ne font rien. Frustrant pour l'utilisateur.

**Fix :** Masquer les intégrations non prêtes ou les grouper en section "Bientôt disponible" non cliquable.

---

### 3.11 Scores pages dashboard

| Page | Score | Problèmes principaux |
|---|---|---|
| Layout | 8.5/10 | — |
| Dashboard home | 6.8/10 | KPIs fake, seededRandom |
| Agents/Skills | 7.5/10 | 14 skills hardcodées |
| Analytics | 6.5/10 | 100% fake, chart non responsive |
| CRM | 7.2/10 | Mock contacts, delete sans undo |
| Conversations | 6.3/10 | Mock data silencieux sur erreur |
| Billing | 7/10 | Date renewal hardcodée |
| Documents | 7.8/10 | File upload = simulation |
| Integrations | 7.5/10 | 50+ comingSoon |
| Support | 7.8/10 | — |
| Team | 7.5/10 | Invites localStorage |
| Workspace | 7.3/10 | Données initiales localStorage |
| Admin Tickets | 7.6/10 | — |
| Onboarding | 8.2/10 | Confetti sans prefers-reduced-motion |

---

## SECTION 4 — API & BACKEND 🟠

> Note : **7.4/10** — Architecture globalement bonne. TODOs critiques non implémentés.

### 4.1 TODOs critiques en prod

| Fichier | Ligne | TODO | Impact |
|---|---|---|---|
| `src/app/api/webhooks/n8n/route.ts` | 26 | `fetch org secret` non implémenté | 🔴 Sécurité webhook |
| `src/app/api/webhooks/n8n/route.ts` | 42 | `db.update(n8nRuns)` commenté | 🟠 Traçabilité absente |
| `src/app/api/voice/status/route.ts` | 20 | Phase 9 : persist call records | 🟠 Historique appels perdu |
| `src/app/api/integrations/n8n/connect/route.ts` | 14 | Real auth session | 🟠 Auth simulée |

### 4.2 Points positifs confirmés

- Streaming SSE correctement implémenté sur routes `/chat`
- Indexing DB correct : `slug`, `email`, `org_id`, `created_at`
- Lazy DB initialization via Proxy pattern — bonne pratique
- Asset caching 1 an sur SVG/PNG/WOFF
- `maxDuration = 60s` configuré sur routes chat longues
- 5 migrations jouées (0001→0005), schema cohérent
- Zod validation présente sur la majorité des endpoints

### 4.3 Scores API

| Domaine | Score |
|---|---|
| Sécurité | 6.5/10 |
| Performance | 8/10 |
| Qualité API | 8.5/10 |
| Base de données | 8/10 |
| Dépendances | 9/10 |
| Intégrations | 7/10 |

---

## SECTION 5 — DESIGN SYSTEM & ACCESSIBILITÉ 🟡

> Note : **8.1/10** — Base solide. Anomalies d'inline styles et WCAG incomplets.

### 5.1 Inline styles dans composants app 🟠 HAUTE

**Fichier :** `src/app/(app)/layout.tsx` (Sidebar + Topbar)

- Sidebar : ~60% inline styles, `onMouseEnter` injecte `style.background` directement
- Topbar : ~50% inline styles

Conséquences : impossible d'overrider via Tailwind, impossible de thémiser, difficile à maintenir.

**Fix :** Migrer vers Tailwind classes + CSS variables. Remplacer `onMouseEnter` par `group-hover:` ou `data-[state=active]:`.

---

### 5.2 prefers-reduced-motion incomplet 🟡 MOYENNE

**Composants concernés :**
- `src/components/ui/TypewriterText.tsx`
- `src/components/ui/NumberTicker.tsx`
- `src/components/ui/MagneticButton.tsx`

Le CSS global couvre `prefers-reduced-motion` mais ces 3 composants JS n'écoutent pas la media query. Les animations continuent même si l'utilisateur les a désactivées.

**Fix :** `const reducedMotion = useReducedMotion()` (Framer Motion) ou `window.matchMedia('(prefers-reduced-motion: reduce)')` dans chaque composant.

---

### 5.3 Charles color mismatch 🟡 MOYENNE

**Fichiers :**
- `src/lib/data.ts` : Charles color = `#7C3AED`
- `src/app/globals.css` : `--agent-charles: #A78BFA`

Deux valeurs différentes pour la même couleur agent. L'avatar et les badges peuvent s'afficher dans des teintes différentes selon le composant.

**Fix :** Unifier sur une seule valeur dans `src/lib/data.ts` et référencer via CSS variable.

---

### 5.4 Navigation clavier limitée 🟡 MOYENNE

**Fichiers :** Composants dropdown, menu navigation

Dropdowns et menus utilisent `onMouseEnter`/`onMouseLeave` sans équivalent `onFocus`/`onKeyDown`. Navigation clavier partielle, violation WCAG 2.1 (SC 2.1.1).

**Fix :** Remplacer par composants `DropdownMenu` Radix/shadcn qui gèrent le clavier nativement.

---

### 5.5 Points positifs design system

- CSS variables bien définies : `#09090B`, `#E86F4D`, 9 couleurs agents
- Tailwind v4 + `@theme inline` correctement configuré
- shadcn/ui : button (5 variants, 4 sizes), card, input, badge — cohérents, zéro duplication
- `AgentAvatar` : 9 SVG uniques avec gradients — excellent travail
- 5 verticals définis, kiné complet avec `caseStudy`
- 4 plans Stripe (89€/199€/890€/custom) bien structurés
- 6 articles blog 2026, contenu de qualité

### 5.6 Scores design

| Domaine | Score |
|---|---|
| Design System | 9/10 |
| UI Primitifs | 9/10 |
| Composants marketing | 8/10 |
| Composants app | 7/10 |
| Accessibilité | 7/10 |
| Responsive | 9/10 |
| Animations | 8/10 |
| Données statiques | 9/10 |

---

## SECTION 6 — PERFORMANCE 🟢

> Note : **8/10** — Globalement bon. Point de vigilance mobile sur le dashboard.

### 6.1 Points confirmés OK

- Streaming SSE sur `/api/agents/{slug}/chat` — latence perçue faible
- DB indexing sur `slug`, `email`, `org_id`, `created_at` — requêtes optimisées
- Lazy DB initialization via Proxy — pas de connexion au boot si inutilisée
- `maxDuration = 60s` sur routes longues — pas de timeout prématuré
- Asset caching 1 an (SVG/PNG/WOFF) en headers HTTP
- `next/font` configuré avec `display: swap`

### 6.2 Points à surveiller

- Analytics LineChart `width: 900px` fixe → bundle rendu inutile sur mobile (repaints)
- Pas de `React.memo` ou `useMemo` visible sur les composants dashboard à lourds re-renders
- Bundle analyzer non documenté comme étape de merge — à intégrer en CI

### 6.3 Cibles Lighthouse à atteindre

| Contexte | Cible | Statut |
|---|---|---|
| Marketing mobile | ≥ 85 | ⚠️ Non mesuré |
| Marketing desktop | ≥ 95 | ⚠️ Non mesuré |
| LCP | < 2.5s | ⚠️ Non mesuré |
| INP | < 200ms | ⚠️ Non mesuré |
| CLS | < 0.1 | ⚠️ Non mesuré |
| JS initial bundle home | < 200KB gzip | ⚠️ Non mesuré |

---

## SECTION 7 — PLAN D'ACTION PRIORISÉ

### P0 — Immédiat (avant toute démo ou partage de lien)

| # | Action | Fichier | Effort |
|---|---|---|---|
| P0-1 | Protéger `/api/admin/test-emails` avec auth admin | `src/app/api/admin/test-emails/route.ts` | 30 min |
| P0-2 | Nettoyer `.env.example`, révoquer `GMAIL_APP_PASSWORD` | `.env.example` | 15 min |
| P0-3 | Supprimer `AggregateRating` fake du schema.org | `src/app/(marketing)/page.tsx` | 15 min |
| P0-4 | Corriger contradiction "120+ clients" sur presse | `src/app/(marketing)/presse/page.tsx` | 15 min |
| P0-5 | Supprimer fallback `ANON_ORG_ID` dans routes API | 32 fichiers routes | 2h |

### P1 — Cette semaine

| # | Action | Fichier | Effort |
|---|---|---|---|
| P1-1 | Implémenter HMAC validation n8n webhook | `src/app/api/webhooks/n8n/route.ts:26` | 1h |
| P1-2 | Décommenter et implémenter `n8n_runs` update | `src/app/api/webhooks/n8n/route.ts:42` | 30 min |
| P1-3 | Remplacer fake data analytics par empty states | `src/app/(app)/dashboard/analytics/page.tsx` | 3h |
| P1-4 | Remplacer KPIs `seededRandom` par vraies requêtes | `src/app/(app)/dashboard/page.tsx` | 2h |
| P1-5 | Corriger URL `/confidentialite` cassée | Footer + `next.config.ts` (redirect) | 30 min |
| P1-6 | Corriger ou supprimer lien `/cas-clients/cabinet-menigoz` | `src/app/(marketing)/agents/marine/page.tsx` | 15 min |
| P1-7 | Supprimer mock contacts CRM (noms réels) | `src/app/(app)/dashboard/conversations/page.tsx` | 30 min |
| P1-8 | Correction billing renewal date → Stripe API | `src/app/(app)/dashboard/billing/page.tsx` | 1h |

### P2 — Ce sprint (1-2 semaines)

| # | Action | Fichier | Effort |
|---|---|---|---|
| P2-1 | Ajouter CAPTCHA/honeypot form contact | `src/app/(marketing)/contact/page.tsx` | 2h |
| P2-2 | Ajouter OG tags sur ~40% des pages manquantes | Toutes `page.tsx` sans `generateMetadata` | 3h |
| P2-3 | Migrer emails hardcodés vers env vars | Plusieurs pages marketing | 1h |
| P2-4 | Sécuriser `dangerouslySetInnerHTML` blog avec DOMPurify | `src/app/(marketing)/blog/_components/BlogClient.tsx` | 1h |
| P2-5 | Migrer inline styles sidebar/topbar vers Tailwind | `src/app/(app)/layout.tsx` | 4h |
| P2-6 | Corriger `prefers-reduced-motion` sur TypewriterText/NumberTicker/MagneticButton | `src/components/ui/*.tsx` | 2h |
| P2-7 | Unifier couleur Charles (#7C3AED vs #A78BFA) | `src/lib/data.ts` + `src/app/globals.css` | 15 min |
| P2-8 | Analytics chart responsive (ResponsiveContainer) | `src/app/(app)/dashboard/analytics/page.tsx` | 30 min |
| P2-9 | Confetti onboarding → respect prefers-reduced-motion | `src/app/(app)/onboarding/page.tsx` | 15 min |
| P2-10 | Vérifier press kit URLs + désactiver si absent | `src/app/(marketing)/presse/page.tsx` | 30 min |

### P3 — Backlog (quand priorité commerciale le permet)

| # | Action | Fichier | Effort |
|---|---|---|---|
| P3-1 | Migrer CSP vers nonces (supprimer unsafe-inline/eval) | `src/middleware.ts` | 4h |
| P3-2 | Team invites → DB réelle + envoi email Resend | `src/app/(app)/dashboard/team/page.tsx` | 3h |
| P3-3 | Conversations : erreurs API affichées, pas masquées | `src/app/(app)/dashboard/conversations/page.tsx` | 1h |
| P3-4 | CRM : soft delete + undo toast 5s | CRM components | 2h |
| P3-5 | Integrations : masquer/grouper 50+ comingSoon | `src/app/(app)/dashboard/integrations/page.tsx` | 2h |
| P3-6 | Navigation clavier dropdowns → Radix/shadcn | Composants navigation | 3h |
| P3-7 | Persist call records Voice (Phase 9) | `src/app/api/voice/status/route.ts:20` | 2h |
| P3-8 | Newsletter signup footer marketing | Composant footer | 2h |
| P3-9 | Ajouter cas clients réels (au moins 2-3 anonymisés) | `src/app/(marketing)/cas-clients/` | Contenu |
| P3-10 | Lighthouse CI intégré en pre-merge | `.github/workflows/` | 2h |

---

## SECTION 8 — SCORES DÉTAILLÉS

### Marketing (rapport 1)

| Page | Score |
|---|---|
| Homepage | 8/10 |
| Tarifs | 8/10 |
| Contact | 7.5/10 |
| A-propos | 7/10 |
| Agents list | 8/10 |
| Agent detail | 8.5/10 |
| Blog list | 6.5/10 |
| Blog article | 7.5/10 |
| **Cas clients** | **5/10** 🔴 |
| Carrières | 6/10 |
| Changelog | 8/10 |
| Presse | 7/10 |
| Verticals | 7/10 |
| Calculateur | 7.5/10 |
| CGU | 7/10 |
| Confidentialité | 7.5/10 |
| Mentions légales | 6.5/10 |

### Dashboard (rapport 2)

| Page | Score |
|---|---|
| Layout app | 8.5/10 |
| Dashboard home | 6.8/10 |
| Agents / Skills | 7.5/10 |
| **Analytics** | **6.5/10** 🔴 |
| CRM | 7.2/10 |
| **Conversations** | **6.3/10** 🟠 |
| Billing | 7/10 |
| Documents | 7.8/10 |
| Integrations | 7.5/10 |
| Support | 7.8/10 |
| Team | 7.5/10 |
| Workspace | 7.3/10 |
| Admin Tickets | 7.6/10 |
| Onboarding | 8.2/10 |

### API & Sécurité (rapport 3)

| Domaine | Score |
|---|---|
| **Sécurité** | **6.5/10** 🔴 |
| Performance | 8/10 |
| Qualité API | 8.5/10 |
| Base de données | 8/10 |
| Dépendances | 9/10 |
| Intégrations | 7/10 |

### Design System (rapport 4)

| Domaine | Score |
|---|---|
| Design System | 9/10 |
| UI Primitifs | 9/10 |
| Composants marketing | 8/10 |
| Composants app | 7/10 |
| Accessibilité | 7/10 |
| Responsive | 9/10 |
| Animations | 8/10 |
| Données statiques | 9/10 |

---

*Audit généré le 2026-04-25. Prochaine révision recommandée après résolution des items P0 et P1.*
