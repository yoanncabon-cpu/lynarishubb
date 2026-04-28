# Plan d'optimisation Lynaris — Performance & Fluidité
> Créé le 2026-04-27 | Basé sur audit complet de la codebase

---

## Bilan audit

| Catégorie | Sévérité | Fichiers principaux |
|-----------|----------|---------------------|
| Data fetching N+1 (usePlan x47) | 🔴 Critique | `usePlan.ts`, `(app)/layout.tsx` |
| Style mutation onMouseEnter | 🔴 Critique | `dashboard/page.tsx`, `Sidebar.tsx` |
| Three.js O(n²) particles 180 | 🔴 Critique | `HeroScene.tsx` |
| GSAP enregistré 18x | 🟠 Haute | `marketing/*` |
| Pas de Suspense / streaming | 🟠 Haute | toutes pages |
| `"use client"` inutiles | 🟠 Haute | `tarifs/page.tsx`, etc. |
| Images non optimisées | 🟠 Haute | `dashboard/page.tsx`, marketing |
| Middleware auth bloquant | 🟠 Haute | `middleware.ts` |
| Fraunces 5 weights | 🟡 Moyenne | `layout.tsx` |
| Pas de code splitting routes | 🟡 Moyenne | routes globales |

---

## Phase 1 — Serveur & Data (P0) ~4h

- [x] **1.1 — `usePlan` → Server Layout**
  - `src/app/(app)/layout.tsx` : fetch plan une seule fois côté serveur (Supabase)
  - Exposer via `PlanProvider` React Context
  - Supprime 47 requêtes parallèles à `/api/settings/billing`

- [x] **1.2 — Middleware : skip `getUser()` sur routes publiques**
  - `src/middleware.ts` : ne pas appeler `supabase.auth.getUser()` si path public
    - Patterns : `/`, `/tarifs`, `/agents/*`, `/api/webhooks/*`
  - Économise ~200ms par requête publique

- [x] **1.3 — Cache Upstash sur plan & admin status**
  - Utiliser `@upstash/redis` (déjà en dépendance)
  - Cache plan par `user_id` (TTL 5min)
  - Cache check admin dans `Sidebar.tsx` (TTL 5min)

---

## Phase 2 — Animations & GPU (P0) ~3h

- [x] **2.1 — Style mutations → CSS Tailwind classes**
  - `src/app/(app)/dashboard/page.tsx` lignes 239-250 : remplacer `onMouseEnter` qui modifient `el.style.*` par classes Tailwind `hover:` + `transition-*`
  - `src/components/app/Sidebar.tsx` : idem, 10 handlers à nettoyer

- [x] **2.2 — Three.js particules : réduire + spatial grid**
  - `src/components/marketing/HeroScene.tsx`
  - `PARTICLE_COUNT` 180 → 80 mobile / 120 desktop (via `useMediaQuery`)
  - Spatial grid pour calculs de connexion : O(n) au lieu de O(n²)
  - Résultat : 16 200 → ~500 opérations/frame

- [x] **2.3 — GSAP centralisé**
  - Créer `src/lib/gsap.ts` : enregistre `ScrollTrigger` une seule fois
  - Remplacer les 18 imports directs dans `marketing/*`

---

## Phase 3 — Composants & Code Splitting (P1) ~3h

- [ ] **3.1 — Suspense boundaries** *(skippé : pages marketing SSR, dashboard déjà client)*
  - `src/app/(marketing)/page.tsx` : `<Suspense>` autour de RoiCalculator, PricingSection, TestimonialsSection
  - `src/app/(app)/dashboard/page.tsx` : `<Suspense>` sur activité + stats
  - Ajouter skeletons (`src/components/ui/skeleton.tsx` existant)

- [x] **3.2 — Dynamic imports manquants**
  - `ConfigModal` → `dynamic(() => import("./ConfigModal"))`
  - `CommandPalette` → `dynamic()`
  - `CalculatorClient` → `dynamic()`

- [x] **3.3 — Réduire `"use client"` inutiles**
  - `src/app/(marketing)/tarifs/page.tsx` : extraire `<BillingToggle />` client isolé, rendre le reste SSR
  - Audit des 47 fichiers marqués `"use client"`, supprimer où pas nécessaire

---

## Phase 4 — Images & Fonts (P1) ~2h

- [x] **4.1 — `next/image` partout**
  - `src/app/(app)/dashboard/page.tsx:138` : `<img src={avatarUrl}>` → `<Image>`
  - Pages marketing : toutes `<img>` → `<Image sizes="..." priority />`

- [x] **4.2 — Fonts allégés**
  - `src/app/layout.tsx` : Fraunces 5 weights (`400,500,600,700,900`) → 2 (`400,700`)
  - Ajouter `preload` sur la variante principale Geist

---

## Phase 5 — Config & Infrastructure (P2) ~1h

- [x] **5.1 — `next.config.ts` optimisations**
  - Ajouter `experimental.optimizePackageImports: ["lucide-react", "framer-motion", "gsap"]`
  - Vérifier `compress: true` actif en prod

- [x] **5.2 — Revalidate strategy**
  - Pages marketing statiques : `export const revalidate = 3600`
  - API analytics : header `Cache-Control: private, max-age=60`

---

## Gains estimés

| Métrique | Avant | Après |
|----------|-------|-------|
| LCP pages marketing | ~4s | < 2s |
| TTI dashboard | ~3.5s | < 1.5s |
| Requêtes /api/settings/billing | 47 | 1 |
| JS bundle initial | ~500KB | < 200KB |
| FPS animations | 35-45 | 60 stable |
| Lighthouse mobile (marketing) | ~62 | ≥ 85 |

---

## Ordre d'exécution recommandé

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

Phases 1 et 2 peuvent tourner en parallèle (sous-agents indépendants).

---

## Statut global

- [x] Phase 1 — Serveur & Data
- [x] Phase 2 — Animations & GPU
- [x] Phase 3 — Composants & Splitting
- [x] Phase 4 — Images & Fonts
- [x] Phase 5 — Config & Infrastructure
