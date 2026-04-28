# TODO — Redesign dashboard Liquid Glass + Spotlight Nav

## Phase 1 — Tokens & primitives glass ✅
- `globals.css` — tokens `--glass-*`, `--aurora-*`, `--ease-apple`, classes utilitaires `.lg-surface-1/2/3`, `.lg-chip`, `.lg-card-hover`, `.lg-aurora`, `.lg-focus`, fallbacks reduced-motion/transparency
- `globals.css` — classes `.ly-card`, `.ly-surface`, `.ly-input`, `.ly-badge` modernisées en Liquid Glass
- `glass/AuroraBackground.tsx`, `GlassPanel.tsx`, `GlassCard.tsx`, `GlassChip.tsx`, `KpiTile.tsx`, `AgentTile.tsx`, `NavGroup.tsx`, `RightPanel.tsx`, `ActivityTimeline.tsx` + `index.ts`

## Phase 2 — Charpente Liquid Glass v1 (sidebar verticale) ✅
- `AppShell.tsx` v1 — sidebar latérale + topbar
- `Sidebar.tsx` v1 — groupes, collapse persistant
- `Topbar.tsx` v1 — search ⌘K, badge plan, notifications, avatar

## Phase 3 — Refactor 12 pages dashboard ✅
- `/dashboard` (home) — Bento Hub
- `/dashboard/agents/page.tsx` — cartes verre tintées par couleur agent + bord lumineux
- `/dashboard/contenus/page.tsx` — ContentCard en GlassCard, modale détail GlassPanel strong
- `/dashboard/integrations/page.tsx` — IntegCard tint couleur intégration, ConnectModal verre
- `/dashboard/conversations/page.tsx` — sidebar verre, lignes lg-surface-3 borderLeft agent
- `/dashboard/analytics/page.tsx` — KpiTile accents, charts en GlassCard radius 22
- `/dashboard/billing/page.tsx` — plan tinté `PLAN_COLORS`, KpiTile usage, CTA glow
- `/dashboard/settings/page.tsx` — cardStyle glass-2, inputStyle ly-input, focus accent ring 4px
- `/dashboard/documents/page.tsx` — drop zone tinté orange au survol, FolderCard ly-card-hover
- `/dashboard/skills/page.tsx` — SkillCard GlassCard radius 20
- `/dashboard/team/page.tsx` — `glassCard` + `ly-card` sur 4 surfaces
- `/dashboard/workspace/page.tsx` — WorkspaceCard GlassCard, inputs ly-input
- `/dashboard/automatisations/page.tsx` — JobCard GlassCard, status pills GlassChip

## Phase 4 — Nav Spotlight + Bento Hub ✅
- `SpotlightNavConfig.ts` — 6 hubs (Accueil/Travail/Croissance/Plateforme/Compte/Admin) + mapping pathname → hub
- `SpotlightTopBar.tsx` — top bar verre flottante avec hubs centraux, ⌘K, badge plan, notifs, avatar
- `SpotlightSubNav.tsx` — chips contextuelles auto-affichées sous topbar quand le hub a des sous-pages
- `SpotlightMobileDrawer.tsx` — drawer mobile plein écran avec NavGroup
- `AppShell.tsx` v2 — flex column (topbar + subnav + main plein écran), plus de sidebar latérale
- `dashboard/page.tsx` v2 — Bento Hub : mega-tuile Charles 2x2 + tuiles Travail/Croissance/Plateforme tintées + live stats + voice + activité

## Bug fixes
- Fix chip stats `4conv.` → `4 conv.` (gap inline forcé + marginRight backup)
- Fix `ssr: false` dans `(marketing)/calculateur/page.tsx` qui bloquait le build
- Fix 5 erreurs apostrophes ESLint préexistantes (admin/provision, documents)

## QA finale
- `npx tsc --noEmit` → **0 erreur**
- `npm run build` → **succès**
- 0 route renommée, 0 hook touché, 0 API modifiée

## Décisions ouvertes
- `Sidebar.tsx` v1 et `Topbar.tsx` v1 conservés (orphelins) pour A/B test ou rollback rapide
- Composants `GlassSidebar.tsx` / `GlassTopbar.tsx` / `LimovaNav.tsx` : non touchés (déjà orphelins avant)
- Screenshots aux 5 breakpoints : à générer en lançant `npm run dev`
- Mockup HTML des 4 directions nav : `docs/changes/2026-04-28/nav-mockups.html`
