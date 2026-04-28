# PROMPT — REDESIGN DU DASHBOARD LYNARIS (Liquid Glass / Apple style)

> À coller tel quel dans Claude Code à la racine du projet `lynaris`.
> Objectif : **redesigner uniquement la disposition et l'esthétique du dashboard** dans une direction **"Liquid Glass" Apple** (visionOS, iOS 26, macOS Sequoia, Home Assistant moderne). On garde **toutes les pages, toutes les routes, toutes les fonctionnalités**.

---

## 1. CONTEXTE

- Stack : **Next.js 15 App Router**, **React 19**, **TypeScript**, **Tailwind v4**, **Framer Motion**, **Lucide**.
- Charpente actuelle : `src/app/(app)/layout.tsx` → `src/components/app/AppShell.tsx` → `Sidebar.tsx` + `Topbar.tsx` + `<main>`.
- Pages dashboard à **conserver à 100 %** (routes, slugs, contenu fonctionnel) :
  `/dashboard`, `/dashboard/agents`, `/dashboard/agents/create`, `/dashboard/agents/[slug]`, `/dashboard/agents/elio`, `/dashboard/agents/elio/sequences`, `/dashboard/skills`, `/dashboard/team`, `/dashboard/analytics`, `/dashboard/crm`, `/dashboard/contacts`, `/dashboard/contenus`, `/dashboard/conversations`, `/dashboard/documents`, `/dashboard/integrations`, `/dashboard/automatisations`, `/dashboard/workspace`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/support`, `/dashboard/admin/tickets`, `/dashboard/admin/provision`.
- Brand Lynaris : noir profond, accent orange chaud `#E86F4D`, typo Plus Jakarta Sans, esthétique premium éditoriale "studio d'agents IA".

---

## 2. DIRECTION DESIGN — LIQUID GLASS

Référence visuelle : visionOS / iOS 26 / macOS Sequoia / dashboards Home Assistant modernes (cartes translucides flottant sur un fond sombre profond, halos colorés diffus en arrière-plan, blur fort, bord lumineux fin).

### Principes
- **Surfaces en verre** : chaque carte, panneau et barre est un panneau de verre — fond translucide, blur Gaussien fort, bord lumineux 1 px en dégradé, ombre douce portée.
- **Fond vivant** : la fenêtre du dashboard repose sur un fond noir `#07070A` avec **3 à 5 halos radiaux flous** (orange, violet, bleu nuit, vert très désaturé) qui bougent très lentement (parallaxe 60 s+, `prefers-reduced-motion` désactive). Ce sont les halos qui transparaissent à travers le verre et donnent vie à l'interface.
- **Hiérarchie par profondeur** : trois niveaux de verre — `glass-1` (sidebar / topbar, 12 % d'opacité), `glass-2` (cartes principales, 8 %), `glass-3` (cartes imbriquées / chips, 5 %). Plus c'est haut, plus c'est translucide.
- **Tints contextuels** : les cartes acceptent un *tint* de couleur très subtil (orange agent IA, vert succès, ambre warning, bleu info), comme dans Home Assistant — pas un aplat, juste une teinte légère intégrée au verre.
- **Bord lumineux** : `border: 1px solid rgba(255,255,255,0.08)` + `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)` pour le reflet du dessus.
- **Ombres** : `box-shadow: 0 20px 60px -20px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset`. Pas d'ombre dure.
- **Coins** : rayons généreux (16 / 22 / 28 px). Les cartes principales sont en 22, les chips en 999.
- **Typo** : Plus Jakarta Sans, hiérarchie 12 / 13 / 14 / 17 / 22 / 32 / 44, letter-spacing négatif sur les gros titres (`-0.02em`).
- **Couleur accent** : orange Lynaris `#E86F4D` réservé aux CTA, états actifs, glow d'agent. Jamais en aplat large.
- **Animations** : Framer Motion, courbes Apple (`cubic-bezier(0.32, 0.72, 0, 1)`), 220–320 ms. Hover de carte = légère élévation + bord plus lumineux + tint qui s'intensifie. Pas d'effet gratuit.
- **Accessibilité** : contraste AA minimum sur tout texte malgré le verre (toujours superposer un voile sombre derrière le texte si besoin), focus ring lumineux orange, navigation clavier complète, `prefers-reduced-motion` et `prefers-reduced-transparency` respectés (fallback en surfaces opaques).

### Tokens à créer
```css
--bg-canvas: #07070A;
--glass-1-bg: rgba(22, 22, 28, 0.55);
--glass-2-bg: rgba(28, 28, 36, 0.42);
--glass-3-bg: rgba(36, 36, 46, 0.32);
--glass-blur: 28px;
--glass-blur-strong: 40px;
--glass-border: rgba(255, 255, 255, 0.08);
--glass-highlight: rgba(255, 255, 255, 0.06);
--glass-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.6);
--accent: #E86F4D;
--accent-glow: rgba(232, 111, 77, 0.35);
--radius-card: 22px;
--radius-tile: 16px;
--radius-pill: 999px;
--ease-apple: cubic-bezier(0.32, 0.72, 0, 1);
```

---

## 3. NOUVELLE DISPOSITION

### Charpente globale
- Fond canvas plein écran avec **calque "aurora"** : 4 halos radiaux animés (orange en haut-droite, violet en bas-gauche, bleu nuit centre-bas, vert désaturé bord supérieur), saturation faible, opacité 25 %, animation 90 s en boucle.
- **Sidebar gauche flottante** : panneau de verre `glass-1`, marges de 16 px par rapport aux bords, hauteur = `calc(100vh - 32px)`, largeur 264 px en expanded, 76 px en collapsed (icônes + tooltip glass). Persistance `localStorage`.
- **Topbar flottante** : panneau de verre `glass-1`, marges 16 px, hauteur 60 px, sticky. Contient breadcrumb, search ⌘K (champ verre `glass-3`), badge plan, voice, notifications, avatar.
- **Main scrollable** : padding 24 px, contenu sur grille 12 colonnes, gap 20 px.
- **Right panel contextuel** (optionnel par page) : panneau de verre `glass-1`, largeur 340 px, flottant avec marges. Affiché sur `/dashboard` (activité + agents), masqué par défaut ailleurs.
- Tout ce qui n'est pas un panneau de verre est invisible (le canvas est le fond).

### Sidebar — regroupement des routes existantes
- Logo Lynaris en haut (carte verre carrée 56×56).
- **Pinned** : Accueil, Conversations, Mes agents
- **Travail** : Contenus, Documents, Espace de travail, Automatisations
- **Croissance** : CRM, Contacts, Statistiques
- **Plateforme** : Skills, Intégrations, Team
- **Compte** : Facturation, Paramètres, Support
- **Administration** (si admin) : Tickets, Provision
- En bas : carte verre "plan" (badge + bouton upgrade glow orange), avatar utilisateur.

### Home `/dashboard` — composition
1. **Hero greeting** (full width) — pas de carte, juste typo : "Bon après-midi, Yoann" en 44 px + sous-titre date + 2 chips verre (conv. + actions).
2. **Carte agent rapide** (glass-2 large, tint orange très léger) — input "Demande à Charles…" avec 4 suggestions chips verre.
3. **Grille 4 tuiles** (glass-2, hauteur égale, hover = élévation + glow accent) — Automatisation, Intégration, Contenus, Conversations.
4. **Section "Vos agents"** — carrousel horizontal de cartes verre (220×140), chacune avec un tint coloré propre à l'agent, avatar à gauche, nom + rôle + statut "Actif/Bêta", bord supérieur en dégradé subtil de la couleur de l'agent.
5. **Section "Activité"** — grand panneau verre `glass-2` avec timeline interne en cartes `glass-3` empilées (avatar agent, action, timestamp). Filtres en chips verre en haut.
6. **Right panel** — récap KPIs du jour (3 mini cartes verre empilées) + raccourci voice Lynaris.
7. Conserver `VacationModeBanner`, `useActivityStream`, `usePlan` et toute la logique métier de la page actuelle.

### Responsive
- ≥ 1280 px : sidebar + main + right panel (3 colonnes flottantes).
- 1024–1279 px : right panel devient un toggle (icône dans la topbar qui le fait apparaître en overlay verre).
- < 1024 px : sidebar en drawer plein écran verre (avec backdrop), topbar simplifiée.
- < 640 px : home en une colonne, tuiles en grille 2×2, agents en swipe horizontal.

---

## 4. PÉRIMÈTRE — STRICTEMENT VISUEL

### Fichiers à modifier
- `src/components/app/AppShell.tsx` (charpente verre + aurora background)
- `src/components/app/Sidebar.tsx` (sidebar verre groupée)
- `src/components/app/Topbar.tsx` (topbar verre flottante)
- `src/app/(app)/dashboard/page.tsx` (composition home, on garde tous les hooks et data sources)
- `src/styles/*.css` (tokens, classes utilitaires `glass-1/2/3`, aurora, focus ring)
- Création de composants partagés : `GlassCard`, `GlassPanel`, `GlassChip`, `AuroraBackground`, `RightPanel`, `NavGroup`, `KpiTile`, `AgentTile`, `ActivityTimeline`.

### Strictement interdit
- Renommer ou supprimer une route, une page, un slug.
- Modifier la logique métier, les hooks (`useActivityStream`, `usePlan`, `useVacationMode`…), les providers, les API routes, les data sources (`@/lib/agents/data`).
- Toucher au site marketing `(marketing)`, à `(auth)`, à l'onboarding.
- Copier un dashboard existant pixel par pixel (Limova, Linear, Vercel, Notion). On s'en inspire pour l'atmosphère, on ne décalque pas.
- Ajouter une grosse dépendance (la stack actuelle suffit).

---

## 5. CONTRAINTES TECHNIQUES

- TypeScript strict, zéro `any` ajouté.
- `npm run lint` vert, `npx tsc --noEmit` vert, `npm run build` vert.
- Performance : LCP `/dashboard` ≤ 2.5 s en local, regression bundle ≤ 10 %.
- Backdrop-filter : fournir un fallback `@supports not (backdrop-filter: blur(1px))` qui retombe sur des surfaces opaques `#16161C`.
- `prefers-reduced-motion` → désactive aurora et hover lift.
- `prefers-reduced-transparency` → surfaces opaques.
- Respect de `CLAUDE.md`, `CLAUDE_STANDARDS.md`, `AGENTS.md`.

---

## 6. INSTRUCTIONS POUR CLAUDE CODE

**Active et utilise tout ce qui est disponible :**
- Tous les **outils** (Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch).
- Tous les **MCP** connectés pertinents.
- Toutes les **skills** utiles :
  - `design:design-system`, `design:design-handoff`, `design:design-critique`, `design:accessibility-review`, `design:ux-copy`
  - `engineering:architecture`, `engineering:code-review`, `engineering:debug`, `engineering:testing-strategy`, `engineering:documentation`
  - `product-management:write-spec`
  - `brand-voice:enforce-voice` pour toute copie FR
- Tous les **sous-agents** via le tool `Agent`, lancés **en parallèle** quand ils sont indépendants :
  - `Plan` → ordre d'implémentation, fichiers critiques, risques.
  - `Explore` (very thorough) → cartographier `src/components/app/**`, `src/components/shared/**`, `src/styles/**`, `src/hooks/**`.
  - `general-purpose` → un sous-agent par bloc (AppShell+Aurora, Sidebar, Topbar, Home, RightPanel, GlassPrimitives, Tokens).
- **TodoList** active dès le départ avec une étape **vérification finale obligatoire**.

### Workflow attendu
1. **Explore** very thorough du dashboard actuel.
2. **Plan** d'implémentation validé par `engineering:architecture`.
3. **Tokens & primitives verre** d'abord (`AuroraBackground`, `GlassCard`, `GlassPanel`, `GlassChip`, classes utilitaires).
4. **AppShell** + **Sidebar** + **Topbar** en parallèle, sous-agents séparés.
5. **Home `/dashboard`** recomposée en réutilisant tous les hooks existants.
6. **RightPanel** branché sur les pages où il fait sens.
7. **Copie FR** passée dans `brand-voice:enforce-voice`.
8. **QA finale** :
   - `design:accessibility-review` (WCAG 2.1 AA, focus, contraste sur verre).
   - `engineering:code-review` du diff complet.
   - `npm run lint` / `npx tsc --noEmit` / `npm run build`.
   - Screenshots aux breakpoints 1440 / 1280 / 1024 / 768 / 390 via `mcp__computer-use__screenshot` après lancement local.
   - Test rapide `prefers-reduced-motion` et `prefers-reduced-transparency`.

### Garde-fous
- Aucune route renommée, aucune page supprimée.
- Pas de copie d'un dashboard existant : si une proposition ressemble trop à du déjà-vu, la réécrire.
- Garder `VoiceLynaris`, `CommandPalette` (⌘K), `NotificationProvider`, `OnboardingLoader` câblés exactement où ils sont.
- Commits atomiques par bloc.

---

## 7. LIVRABLE FINAL

1. Diff propre, build / lint / types verts.
2. Récap markdown : changements, choix design, décisions ouvertes.
3. Screenshots avant / après aux 5 breakpoints.
4. Liste des nouveaux composants verre + leur API.
5. Guide d'1 page : "comment ajouter une nouvelle page dashboard dans la nouvelle grille verre".

---

**Démarre par `Plan` + `Explore`, puis lance les sous-agents d'implémentation en parallèle. Aucune ligne de code avant validation du plan par `engineering:architecture`.**
