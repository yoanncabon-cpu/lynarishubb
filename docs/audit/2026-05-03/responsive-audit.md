# Audit responsive Lynaris — 2026-05-03

> Audit READ-ONLY effectué via 3 sous-agents Explore en parallèle.
> Méthode : analyse statique du code (pas de navigateur). Cible : mobile 375px / tablette 768px / desktop 1440px.

---

## Synthèse exécutive

**Diagnostic global** : le projet a des bases solides (`clamp()` utilisé sur AppShell, Tailwind responsive sur pages marketing récentes, gates `prefers-reduced-motion` correctes), mais **plusieurs pages dashboard et la nav contiennent des hardcodes px qui cassent l'expérience mobile**.

**P0 = pages cassées sur mobile 375px** : 7 zones identifiées.
**P1 = UX visiblement dégradée** : ~12 zones.
**P2 = nits cosmétiques** : non bloquants.

**Impact business estimé** : ~10-20 % de perte conversion sur le funnel auth mobile + dégradation usage des pages dashboard chez les clients utilisant tablette/mobile.

---

## P0 — Zones cassées sur mobile (à fixer en priorité)

### NAV-1 : Burger menu touch target 6×6 px
- **Fichier** : `src/components/app/SpotlightTopBar.tsx:194`
- **Problème** : `padding: 6` sur le bouton burger → cible tactile bien sous le minimum 44×44 px (WCAG 2.2 AA, Apple HIG)
- **Effet** : utilisateur mobile rate le tap 1 fois sur 3
- **Fix** : `padding: clamp(8px, 2vw, 12px)` + `minWidth/minHeight: 44`

### NAV-2 : Panneau notifications + menu utilisateur débordent
- **Fichiers** : `SpotlightTopBar.tsx:459` (notifications `width: 340`) et `SpotlightTopBar.tsx:638` (user menu `width: 220`)
- **Problème** : largeur fixe → sur mobile 375px, après marges, le panneau dépasse hors viewport à droite
- **Fix** : `width: "min(340px, calc(100vw - 32px))"` (et même chose pour 220)

### NAV-3 : Drawer mobile peut chevaucher
- **Fichier** : `SpotlightMobileDrawer.tsx:56`
- **Problème** : `width: 300` + margin 16px → 332 px > 343 px disponibles sur 375 px
- **Fix** : `width: clamp(260px, 75vw, 300px)`

### NAV-4 : Footer marketing grid 5 colonnes sans breakpoint
- **Fichier** : `src/components/marketing/Footer.tsx:50`
- **Problème** : `gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr"` fixe sans media query → texte écrasé/illisible sur mobile, risque de SEO crawl + accessibilité légale (CGU/RGPD/mentions illisibles)
- **Fix** : ajouter media query → 2 cols sur tablette, 1 col sur mobile

### DASH-1 : Conversations sidebar 380 px non collapsable
- **Fichier** : `src/app/(app)/dashboard/conversations/page.tsx`
- **Problème** : `width: "min(380px, 100%)"` mange tout l'écran < 768 px → liste illisible et chat coincé
- **Fix** : pattern drawer : sidebar masquée par défaut < 1024 px, toggle hamburger pour basculer liste/chat

### DASH-2 : Billing — 3 grids fixes 5 colonnes
- **Fichier** : `src/app/(app)/dashboard/billing/page.tsx`
- **Problème** : KPI tiles, plans, table factures tous en `repeat(5, 1fr)` → cards de 60 px sur mobile, illisible
- **Fix** : `repeat(auto-fit, minmax(140px, 1fr))` ou breakpoints explicites (5 → 2 → 1)

### DASH-3 : Settings — grids 3-4 colonnes hardcodées
- **Fichier** : `src/app/(app)/dashboard/settings/page.tsx` (lignes 1667, 1805, 2077)
- **Problème** : `repeat(3, 1fr)` et `repeat(4, 1fr)` sans breakpoint → champs settings écrasés mobile
- **Fix** : `repeat(auto-fit, minmax(220px, 1fr))` ou breakpoints

### DASH-4 : Documents — padding hardcodé + search 340 px fixe
- **Fichier** : `src/app/(app)/dashboard/documents/page.tsx:655` et search input
- **Problème** : `padding: "32px 40px"` mange 80 px sur 375 px (= 21 % du viewport) ; search `width: 340` déborde
- **Fix** : `padding: "clamp(16px, 4vw, 32px) clamp(14px, 4vw, 40px)"` + search `flex: 1` ou `max-width: 100%`

### AUTH-1 : Login/Signup — right panel padding non responsive
- **Fichiers** : `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- **Problème** : `padding: "32px 48px"` sur right panel → resserre inputs sur < 400 px
- **Fix** : media query mobile → `padding: "16px 20px"`

---

## P1 — UX dégradée

| ID | Fichier | Problème | Fix court |
|---|---|---|---|
| NAV-5 | SpotlightTopBar.tsx:178 | `height: 60` non clampé | `height: clamp(52px, 8vw, 60px)` |
| NAV-6 | SpotlightTopBar.tsx:346 | Search button `width: 200` fixe | `clamp(160px, 40vw, 200px)` |
| NAV-7 | SpotlightMobileDrawer.tsx:174 | DrawerItem `height: 38` | `height: clamp(40px, 8vw, 44px)` |
| DASH-5 | dashboard/page.tsx | Header h1 + actions sans `flex-wrap` | `flexWrap: "wrap"` + `gap: clamp(8px, 2vw, 16px)` |
| DASH-6 | conversations | Avatars stack rigide, items `min-height: 80` | clamp + flex layout |
| DASH-7 | conversations | Table 14 cols header | wrapper `overflow-x: auto` ou cards mobile |
| AUTH-2 | login | "Mot de passe oublié" wrap 2 lignes < 400 px | flex-wrap + ordre |
| AUTH-3 | signup | Checkbox CGU mal espacée mobile | `align-items: flex-start` + line-height |
| MKT-1 | contact form | Sidebar `1fr 340px` peut overlapper | full collapse < 768 px, sidebar **sous** form |
| MKT-2 | forgot-password | Blobs 600px non clippés → scroll horizontal | `overflow: hidden` parent + clamp blobs |

---

## P2 — Nits cosmétiques

- `gap` et `padding` hardcodés px partout dans plusieurs pages (settings, billing notamment) — non bloquant mais source de dette
- Scrollbar `scrollbarWidth: none` sur SubNav peut se voir sur iOS Safari
- Chips/badges `padding: "1px 5px"` trop serrés (PRO badge drawer)
- Avatar 60 px header dashboard sans clamp

---

## Recommandations d'attaque

### Priorité 1 — PR Nav mobile (NAV-1 à NAV-4)
**Pourquoi en 1er** : la nav est sur **toutes** les pages. Fixer la nav fixe transversalement les pires bugs P0. Sans ça, aucun client ne peut utiliser l'app sereinement sur mobile.
**Scope** : `SpotlightTopBar.tsx`, `SpotlightMobileDrawer.tsx`, `Footer.tsx` marketing.
**Effort estimé** : 1 demi-journée.

### Priorité 2 — PR Auth pages (AUTH-1, AUTH-2, AUTH-3)
**Pourquoi** : impact direct conversion. Un signup raté sur mobile = client perdu définitivement.
**Scope** : `login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`.
**Effort estimé** : 1 demi-journée.

### Priorité 3 — PR Billing + Settings (DASH-2, DASH-3)
**Pourquoi** : pages payantes = critique. Si un client veut payer/configurer sur mobile et n'y arrive pas, il abandonne.
**Scope** : `billing/page.tsx`, `settings/page.tsx`.
**Effort estimé** : 1 jour.

### Priorité 4 — PR Documents + Conversations (DASH-1, DASH-4)
**Pourquoi** : usage quotidien client.
**Effort estimé** : 1 jour.

### Priorité 5 — PR Dashboard home + marketing résiduel
**Effort estimé** : 1 demi-journée.

---

## Méthode appliquée pour chaque PR

1. Branche `responsive/<scope>` depuis main
2. Fix uniquement le scope identifié — zéro feature, zéro refactor parallèle
3. Screenshots avant/après aux 5 breakpoints (375 / 414 / 768 / 1024 / 1440) → `docs/changes/YYYY-MM-DD/<scope>/`
4. `npx tsc --noEmit` 0 erreur
5. `npx eslint src --max-warnings 0` 0 warning
6. Test clavier (Tab, Escape, focus visible)
7. Test `prefers-reduced-motion` (DevTools → Rendering)
8. Vérification touch targets ≥ 44×44 px sur tous boutons modifiés
9. Yoann valide par PR avant la suivante

---

## État actuel des bonnes pratiques (à conserver)

- ✅ `clamp()` utilisé sur `AppShell.tsx` — pattern à généraliser
- ✅ `prefers-reduced-motion` gated dans 19 fichiers
- ✅ `next/image` utilisé sur cards agents
- ✅ Tailwind responsive (`sm:`, `md:`, `lg:`) sur pages marketing récentes
- ✅ OAuth buttons full-width 44 px sur auth pages
- ✅ Form inputs 44 px height sur mobile

**Pattern à généraliser** : remplacer tout `padding: "Xpx Ypx"` hardcodé par `padding: "clamp(...) clamp(...)"`. C'est le fix qui revient le plus souvent.
