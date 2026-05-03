# TODO — Plan refactor adaptatif Lynaris (mai 2026)

> Source de vérité courante. Toutes les phases ci-dessous sont SCOPÉES — aucun big bang.
> 1 PR = 1 scope. Jamais de mass-rewrite sans audit préalable.

---

## ✅ Phase 0 — Fix immédiat (terminé 2026-05-03)

**Bug** : `/dashboard/documents` affichait un bloc "Outputs agents" qui pollue la page de dépôt fichiers/dossiers du client.

**Fix appliqué** :
- Suppression du bloc JSX "Outputs agents" (h2 + tabs + liste)
- Suppression imports inutiles (Mail, MessageSquare, FileText, Image, BarChart2, Share2)
- Suppression types AgentContent / ContentTab / CONTENT_TABS
- Suppression fonctions contentIcon / statusBadge
- Suppression state agentContents / activeTab / contentsLoading + useEffect fetch /api/contents
- Suppression dérivée filteredContents

**Fichier** : `src/app/(app)/dashboard/documents/page.tsx` — 1 fichier, ~150 lignes retirées
**Vérif** : `npx tsc --noEmit` 0 erreur, `npx eslint` 0 warning
**État** : page = 100 % dépôt fichiers/dossiers client. Plus aucun output agent visible.

---

## ✅ Phase 1 — Audit responsive (terminé 2026-05-03)

**Méthode** : 3 sous-agents Explore en parallèle (nav, dashboard, marketing+auth).
**Rapport complet** : `docs/audit/2026-05-03/responsive-audit.md`

**Verdict** :
- 7 zones P0 (cassent l'usage mobile)
- ~12 zones P1 (UX dégradée)
- Pattern dominant : `padding: "32px 40px"` hardcodé partout dans le dashboard

**Ordre d'attaque décidé** :
1. PR Nav mobile (transversal, fixe burger 6×6px, panneaux qui débordent, footer 5 cols)
2. PR Auth pages (impact conversion direct)
3. PR Billing + Settings (pages payantes / configuration)
4. PR Documents + Conversations (usage quotidien)
5. PR Dashboard home + résiduel

---

## 🔍 Phase 1 — Audit responsive (méthode pour ré-audit futur)

**Pourquoi avant** : on ne refactor pas en aveugle. On identifie les vrais cassures mobile/tablette avec preuves.

**Méthode** :
1. Lancer `pnpm dev` (ou `npm run dev`)
2. Tester chaque breakpoint via DevTools : 375px (iPhone SE), 414px (iPhone 14 Pro Max), 768px (iPad), 1024px (iPad Pro), 1440px (desktop)
3. Pour chaque page critique, screenshot + note des bugs visuels
4. Output : `docs/audit/2026-05-XX/responsive-audit.md` avec tableau page × breakpoint × sévérité

**Pages à auditer en priorité (ordre = impact business)** :
1. `/` (landing marketing) — premier contact prospect
2. `/login` + `/signup` — conversion
3. `/dashboard` (Bento Hub) — première impression post-login
4. `/dashboard/agents` — cœur produit
5. `/dashboard/agents/[slug]` — chat/config agent
6. `/dashboard/conversations` — usage quotidien
7. `/dashboard/documents` — usage client
8. `/dashboard/billing` — paiement
9. `/dashboard/settings` — configuration
10. `/dashboard/integrations` — connexions tierces

**Composants navigation à tester** :
- `SpotlightTopBar.tsx`
- `SpotlightSubNav.tsx`
- `SpotlightMobileDrawer.tsx`
- `AppShell.tsx`

**Sortie attendue** : liste hiérarchisée des bugs avec numéro, sévérité (P0/P1/P2), screenshot avant.

---

## 🛠️ Phase 2 — Fixes responsive par scope (1 PR par scope)

> Chaque PR = 1 scope, screenshots avant/après dans `docs/changes/YYYY-MM-DD/`, Lighthouse mobile ≥ 85, axe-core 0 violation.

### PR-A : Navigation mobile (Topbar + Drawer + SubNav)
- Audit du `SpotlightMobileDrawer` actuel
- Hamburger → drawer plein écran fluide
- Touch targets 44×44 minimum partout
- Liens actifs visibles (état `aria-current`)
- Fermeture drawer après clic sur lien
- Test clavier (Escape ferme, focus trap correct)

### PR-B : Auth pages (login + signup + reset)
- Layout single column < 768px
- Inputs full-width, padding 14px, font 16px (anti-zoom iOS)
- CTA primaire pleine largeur mobile
- Messages d'erreur sous chaque champ, pas en toast
- Liens secondaires (mot de passe oublié, "pas de compte ?") groupés en bas
- Logo Lynaris taille adaptive
- Background aurora désactivé si `prefers-reduced-motion`

### PR-C : Landing marketing `/`
- Hero responsive : pile vertical < 768px, illustration sous CTA
- Sections en single column < 1024px
- Tableau pricing → cards empilées < 768px
- Footer 4 colonnes → 2 colonnes < 768px → 1 colonne < 480px
- Images `next/image` avec sizes responsive
- Vidéos hero : poster mobile + lazy load

### PR-D : Dashboard home (Bento Hub)
- Mega-tuile Charles plein largeur < 1024px (au lieu de 2x2)
- Grid 4 col → 2 col tablette → 1 col mobile
- KPIs scrollable horizontal sur mobile (overflow-x snap)
- Activity timeline collapse par défaut < 768px

### PR-E : Pages chat agents (conversations + agents/[slug])
- Sidebar conversations → drawer < 1024px
- Bottom-bar fixe pour input message sur mobile
- Messages bulles max 85% viewport
- Header agent collapse au scroll

### PR-F : Tableaux & listes (billing, settings, integrations)
- Tables responsive : transformation en cards < 768px
- Filtres → bottom-sheet sur mobile
- Pagination simplifiée mobile

### PR-G : Forms & modales globales
- Tous modales : full-screen < 768px
- Boutons d'action : sticky bottom mobile
- Datepickers natifs sur mobile

---

## 📐 Phase 3 — Standards responsive durables

> Empêcher la régression future.

- [ ] Définir tokens breakpoints dans `globals.css` (déjà partiellement fait — vérifier cohérence)
- [ ] Créer `src/components/ui/Container.tsx` standardisé (max-w + padding responsive)
- [ ] Créer hook `useBreakpoint()` typé
- [ ] Documenter dans `CLAUDE_STANDARDS.md` : "tout nouveau composant doit être testé aux 5 breakpoints avant merge"
- [ ] Ajouter step Lighthouse mobile en CI sur PRs touchant `/app/**`

---

## 🚫 Hors scope (refusé pour cette session)

- ❌ "Refactor complet du site" sans audit préalable
- ❌ Méga-prompt 1000-5000 lignes (anti-pattern qualité)
- ❌ Tout changement sur l'auth backend (Supabase) — hors scope responsive
- ❌ Migration framework / dépendance majeure

---

## 📋 Process de validation par PR

Avant tout merge :
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] `npx eslint src --max-warnings 0` → 0 warning
- [ ] `npm run build` → succès local
- [ ] Screenshots avant/après aux 5 breakpoints (375 / 414 / 768 / 1024 / 1440) → `docs/changes/YYYY-MM-DD/`
- [ ] Lighthouse mobile pages modifiées ≥ 85 / desktop ≥ 95
- [ ] axe-core → 0 violation
- [ ] Test clavier complet (Tab, Shift+Tab, Enter, Escape)
- [ ] Test `prefers-reduced-motion` (DevTools → Rendering)
- [ ] Test `prefers-color-scheme` si applicable
- [ ] Touch targets ≥ 44×44px sur tous éléments interactifs
- [ ] Contraste WCAG AA (4.5:1 body, 3:1 large)

---

## Décisions

- **Pas de prompt monolithique** — la qualité vient de scopes courts et testés
- **Audit avant action** — Phase 1 obligatoire avant toute Phase 2.x
- **Yoann valide chaque PR** avant la suivante — pas d'enchaînement automatique
- **Si une action commerciale est en attente** → on stoppe le refactor (rule CLAUDE_STANDARDS)

---

## Historique antérieur

Voir `tasks/lessons.md` pour les leçons accumulées.
Voir `tasks/PLAN_MAITRE.md` pour le plan stratégique global.
Voir Phase 1-4 du redesign Liquid Glass : précédemment dans ce fichier (terminé avril 2026).
