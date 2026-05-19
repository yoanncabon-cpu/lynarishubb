# AUDIT DESIGN — Lynaris Hub

**Date** : 19 mai 2026
**Auditeur** : Claude (Sonnet 4.6) — designer produit senior + brand voice + perf
**Périmètre** : design, fonctionnalité, copy, images, vidéos, animations
**Hors périmètre** : sécurité, code, archi DB (voir `AUDIT_REPORT.md` du 24 avril 2026)

---

## 0. Synthèse exécutive

Le projet est **bien plus avancé que la moyenne des MVP** : design system documenté (`DESIGN.md`), tokens CSS, palette par agent, page d'auth pro, RGPD compliance. Le hero, la section agents et le bento sont vraiment léchés. **Mais** la stack visuelle est devenue trop chargée : **4 librairies d'animation** cohabitent (GSAP + Framer Motion + Lenis + Three.js + animations CSS), **2 systèmes de navigation morts** traînent dans le repo (`Glass*` + `Limova*` à côté du système actif `Spotlight*`), **5 versions de la même image how-it-works** sont versionnées, et plusieurs anti-patterns explicitement interdits par `CLAUDE_STANDARDS.md` sont en place (`CustomCursor`, parallax full-bleed, scroll-hijack via Lenis, émojis dans les titres). La promesse marketing "9 agents" a été retirée du hero mais reste affichée dans 5 autres endroits — **cohérence narrative cassée**.

**Priorités du mois** :

1. **Cohérence narrative "9 agents"** — soit on l'assume partout, soit on le retire partout (1 h)
2. **Nettoyer les composants morts** : Glass\*/Limova\*/SmoothScroll/CustomCursor (3 h, -30 KB JS)
3. **Trancher : Marine en bêta = produit livré OU pas** — supprimer les promesses "0 appel manqué" / "87 min récupérées" tant qu'il n'y a pas de client SaaS payant (1 h)
4. **Purger `/public`** : 5 versions de how-it-works, 5 SVG starter Next.js, 2 versions de dashboard mockup, `aria.*` fantôme (30 min)
5. **Décider du sort d'Orion** : agent documenté mais sans avatar/vidéo/page, et absent du nav (2 h pour décider + créer ou retirer)

---

## 1. Cohérences globales à corriger en premier

Ces incohérences traversent plusieurs pages : il faut **trancher une bonne fois**.

### 1.1 — La "guerre des chiffres d'agents"

| Endroit | Affiche | Fichier |
|---|---|---|
| Hero `subtitle` | « Une équipe IA spécialisée » (chiffre retiré) | `HeroSection.tsx:194-197` |
| `StatsSection` carte 3 | **« 9 agents spécialisés »** | `StatsSection.tsx:20-24` |
| `TeamSection` CTA | **« Découvrir les 9 agents »** | `TeamSection.tsx:130` |
| `AgentsSection` mobile carousel mentionne | « 8 agents » dans navbar dropdown | `Navbar.tsx:12-21` |
| `OnboardingTour` step 3 | **« 🤖 Vos 9 assistants IA »** | `OnboardingTour.tsx:26` |
| `README.md` | « 9 agents specialises » | `README.md:5` |
| `AGENTS.md` | 9 agents listés (incluant Orion) | — |
| Navbar dropdown | **8 agents** (Orion absent) | `Navbar.tsx:12-21` |
| Footer "Agents" | 5 agents listés | `Footer.tsx:7-13` |

**Décision à prendre** (Yoann, c'est toi qui choisis) :

- **Option A — radicale honnête** : on ne parle **plus jamais** d'un chiffre. Partout « ton équipe IA spécialisée ». Tant que Marine est seule en prod, c'est la seule honnête.
- **Option B — pragmatique** : on assume « 8 agents » (vire Orion qui n'a pas d'avatar ni de page) et on harmonise partout.

→ **Quick win** : un seul `grep -r "9 agents\|9 assistants"` + remplace partout selon ta décision.

### 1.2 — Marine : promesses fake-data

`marine/page.tsx:30-32` affiche :

- **« 87 min récupérées / semaine »** : sourcée d'où ?
- **« 0 appels manqués »** : promesse impossible à tenir (panne réseau, plantage Twilio…)
- **« < 3s »** alors que `BentoSection.tsx:19` dit **« Décroche en 2 secondes »** et `StatsSection.tsx:9-13` dit **« < 2s »**.

→ Violation directe de `CLAUDE_STANDARDS.md` : *« Aucune fake data (témoignage, logo, chiffre, cas client) jamais »* + *« Aucune promesse dans la copy que le produit ne tient pas »*.

→ **Action** : retire ces 3 stats tant que pas de client SaaS payant Lynaris. Remplace par des descripteurs qualitatifs (« Décroche dès la 1ʳᵉ sonnerie », « Disponible 24/7 », « SMS de confirmation automatique »).

### 1.3 — Émojis dans les titres / pages produits

`DESIGN.md:159` dit explicitement : **« Emojis dans les titres marketing → INTERDIT »**. Or :

- `TestimonialsSection.tsx:148, 186, 224` : 🚀, ✨, 💬 dans les 3 slots pilotes
- `OnboardingTour.tsx:15, 27, 33, 39, 45, 57, 65, 70` : 👋, 🤖, ⚡, 🔌, 📝, 📁, 💬, 🎉
- `BentoSection` carte « Programme bêta ouvert » → pas d'émoji, OK

→ **Action** : remplace par lucide-react icons partout (déjà dans la stack). 1 h.

### 1.4 — Le footer trahit son outil de build

`Footer.tsx:113` : **« Fait en France avec ♥ et Claude »**. Sympa pour un dev Twitter, mais ta cible (kiné, resto, artisan) va se demander qui est Claude et si l'IA a écrit son code (anxiogène). Reformule en :

> « Fait en France avec ♥ — propulsé par Claude AI » (assume mais cadre)

ou supprime juste « et Claude ».

### 1.5 — Trois systèmes de navigation cohabitent dans le code

| Système | Statut | Fichiers |
|---|---|---|
| **Spotlight*** | ✅ actif (`AppShell.tsx` l'utilise) | `SpotlightTopBar/SubNav/MobileDrawer` |
| **Glass*** | ❌ mort | `GlassTopbar.tsx`, `GlassSidebar.tsx`, `glass/Glass.tsx`, `glass/NavGroup.tsx`, `glass/RightPanel.tsx` |
| **Topbar/Sidebar/LimovaNav** | ❌ morts | `app/Topbar.tsx`, `app/Sidebar.tsx`, `LimovaNav.tsx` |

…**mais** `dashboard/agents/page.tsx:10` importe encore `GlassCard, GlassChip` depuis `glass/index`. Donc Glass n'est pas mort partout, juste sa nav.

→ **Action** :

1. Décide si tu gardes le **vocabulaire visuel « Glass »** (cards, chips) → renomme les composants en `Surface*`, `Chip*` pour découpler du nom historique
2. Supprime `GlassTopbar`, `GlassSidebar`, `Topbar`, `Sidebar`, `LimovaNav` (dead code)
3. Supprime les composants `glass/Glass.tsx`, `NavGroup.tsx`, `RightPanel.tsx` si non importés (`grep` pour vérifier)

Estimation : **3 h, -30 à -50 KB de bundle déboutées** (les composants morts restent dans le tree-shake mais polluent l'analyse).

---

## 2. Landing — page par page

### 2.1 — `src/app/(marketing)/page.tsx` (Homepage)

Ordre des sections actuel :

```
Hero → LogosStrip → Stats → Results → Agents → Team → DemoConversation → Bento → HowItWorks → Integrations → Testimonials → Pricing → FAQ → CTA
```

#### ❌ À supprimer
- **`LogosStrip`** si tu n'as pas de **vrais logos clients** (anti-pattern CLAUDE_STANDARDS « Aucune fake data »). Tu peux la garder uniquement si elle affiche des **outils intégrés** (Stripe, Google Calendar, WordPress…) et pas des « clients ».

#### ⚠️ À modifier
- **L'ordre est trop long (14 sections)**. Une homepage TPE/PME doit convaincre en 30 s, là on a 6-7 minutes de scroll. Propose :

  ```
  Hero → Stats → Agents → Bento → HowItWorks → Pricing → FAQ → CTA  (8 sections)
  ```

  Reverse : `Results`, `Team`, `DemoConversation`, `Integrations`, `Testimonials` deviennent des **pages dédiées** ou des sections **plus bas dans Bento**.

- **Conflit visuel `Team` + `Bento`** : `TeamSection` est full-bleed photo + parallax (très immersif), puis `Bento` est très typo. Coupure brutale. Si tu gardes les deux : intercale un `IntegrationsSection` neutre entre eux.

#### ✨ À ajouter
- **Sticky CTA mobile** (« Commencer gratuit ») qui apparaît au scroll après le hero — TPE/PME mobile ne va pas remonter en haut.
- **JSON-LD `WebPage` + `ItemList` Agents** dans le `<head>` (le composant `StructuredData` existe, vérifier qu'il est appelé sur la home).

---

### 2.2 — `HeroSection.tsx`

#### Points forts
- Animation GSAP timeline propre, `prefers-reduced-motion` respecté
- Mobile detection (Three.js désactivé sur coarse pointer) ✅
- H1 sémantique + `id="hero-heading"` lié à `aria-labelledby` ✅
- CTA shimmer subtile, badge bêta clair

#### ❌ À supprimer
- **Le grid pattern à `opacity:0.025`** (l.103-113) est invisible. Soit tu montes à 0.06, soit tu vires.
- **`HeroScene` (Three.js particles) + `HeroLogo3D` (wireframe) simultanés** = double charge GPU desktop. Choisis-en un — je recommande de **garder `HeroLogo3D`** (lié au branding) et virer `HeroScene` (déco générique).

#### ⚠️ À modifier
- **`HeroScene` + `HeroLogo3D` chargent Three.js (~150 KB gz)** uniquement pour la déco du hero. Sur un device milieu de gamme TPE/PME (PC portable Asus 2019), ça vire le LCP au-dessus de 2,5 s. Mesure avec Lighthouse mobile slow 4G avant de le garder.
- **Badge « Bêta privée — Rejoindre la bêta »** envoie sur `/contact` qui est une page lourde. Crée plutôt une popover/modale « rejoindre la liste d'attente » avec juste email.
- **Subtitle** (l.194-197) : « Tes agents décrochent tes appels. Lou publie ton contenu. Elio prospecte pour toi. » — bien, mais **« décrochent » au pluriel** alors qu'**un seul** agent décroche (Marine). Reformule : « Marine décroche tes appels. Lou publie ton contenu. Elio prospecte pour toi. »
- **Stats pills** (l.241-260) : « Activation en 48 h », « Sans carte bancaire », « RGPD compliant ». Les émojis ⚡ ✓ 🔒 violent ton design system. Remplace par les icônes lucide `Zap`, `Check`, `Lock`.
- **CTA mobile** : le bouton « Voir la démo → » scroll vers `#demo`. Mais sur mobile, le hero fait 100 dvh et la démo est 4 sections plus bas (~3000 px). Le smooth scroll peut perdre l'utilisateur. Préfère un lien `Link` direct + scroll natif.

#### ✨ À ajouter
- **Vidéo `hero-lynaris.mp4` ou `hero-loop.mp4`** présente dans `/public/marketing/videos/` mais non utilisée dans `HeroSection`. Tu as **2 vidéos hero non utilisées**. Décide : soit tu l'intègres en background (avec poster jpg, muted, loop, playsinline), soit tu les supprimes (~5-15 Mo).
- **`<link rel="preload" as="image" href="/marketing/scenes/hero-universal.webp">`** dans le `head` pour le LCP.

---

### 2.3 — `HeroVisualShowcase.tsx`

#### Points forts
- Composition immersive très réussie (photo + avatar + bulles + glow)
- `prefers-reduced-motion` respecté pour chaque animation indépendamment ✅
- Avatar Marine en PNG (transparence préservée) ✅

#### ⚠️ À modifier
- **5 animations infinies simultanées** : Ken Burns photo (22 s loop) + 18 particules dorées (8 s loop) + avatar float (5 s loop) + ticker secteurs (18 s loop) + dot status pulse (1,6 s loop). C'est beaucoup. Sur mobile bas de gamme = batterie. Limite à **2 animations infinies max** quand le tab est visible. Utilise `IntersectionObserver` pour `play/pause` quand hors viewport.
- **Ken Burns scale 1.05→1.12** : ça grossit la photo dans un cadre fixe = pixels visibles si la source est trop petite. Vérifie résolution source.
- **Bulles de chat** affichent **3 messages exemples** comme s'ils défilaient (`delay 0.5 / 1.4 / 2.4`) mais une fois affichés, ils ne disparaissent jamais. C'est une animation **one-shot** déguisée en démo. Soit tu boucles l'animation toutes les 8 s (vraie démo qui respire), soit tu enlèves le délai (apparition simultanée).
- **« MARINE EN LIGNE »** uppercase l.236-238 — bien, mais peut être interprété comme « Marine est connectée maintenant ». Préfère « Agente Marine — démo ».
- **Sector ticker en boucle infinie** (l.255-266) — anti-pattern accessibilité (mouvement constant = problème vestibulaire). Ajoute un bouton pause OU stop sur hover.

#### ✨ À ajouter
- **Alt text de la photo bureau** trop long (l.71) : « Bureau de dirigeant de petite entreprise française, lumière dorée » — un lecteur d'écran lira tout. Raccourcis : « Bureau d'une PME française. ».

---

### 2.4 — `StatsSection.tsx`

#### ⚠️ À modifier (voir aussi §1.1)
- **« 9 agents spécialisés » + « 1 en production, 8 en développement actif »** : honnête, mais ça affiche que **8 agents sur 9 ne marchent pas**. Mauvais signal en homepage. Préfère :
  - Stat 1 : « < 2s » Décroche (ou retire si non garanti)
  - Stat 2 : « 48 h » Activation
  - Stat 3 : « 100 % » RGPD européen (chiffre vrai, valeur de vente)
  - Stat 4 : « 24/7 » Disponibilité

  Tu remplaces la stat agents qui te plombe par un proof de souveraineté FR.

- **Stat « 24/7 — vos agents travaillent sans pause ni congé »** : encore le pluriel implicite. Reformule pour ne parler que de ce qui existe.

---

### 2.5 — `AgentsSection.tsx`

#### Points forts
- Mouse-follow glow propre, mobile carousel scroll-snap ✅
- Lazy video loading au hover (`preload="none"`) ✅
- Stagger reveal soigné

#### ❌ À supprimer
- **`agent.avatar.replace(".webp", ".png")`** (l.197) : tu fetch du PNG alors que tu as déjà du `.webp`. Pourquoi ? Si c'est pour la transparence, garde **PNG** (le `.webp` peut aussi être transparent). **Choisis un format unique** et supprime l'autre série de fichiers.

#### ⚠️ À modifier
- **CTA bas « Voir tous les agents en détail »** texte verbeux. Préfère « Tous les agents → ».
- **`<StatusBadge variant="warning">⊕ Bêta</StatusBadge>`** utilise un caractère unicode `⊕` au lieu d'un cercle lucide. Cohérence visuelle cassée.

#### ✨ À ajouter
- **Compteur d'agents prod/bêta/roadmap** en haut de section : « 1 en production · 6 en bêta · 1 en roadmap ». Transparence = confiance pour TPE/PME méfiantes.

---

### 2.6 — `TeamSection.tsx`

#### ⚠️ À modifier
- **Parallax `useScroll` sur full-bleed** : `CLAUDE_STANDARDS.md` dit **« Pas de scroll-hijack, parallax lourd »**. Le tien est léger (translateY ±15 %, scale 1.08→1.15), donc OK *limite*. Mais combiné à Lenis (smooth scroll), ça devient un parallax lourd ressenti. **Désactive l'effet si Lenis est actif** (ou désactive Lenis, voir §5.2).
- **Image `team-hero.webp`** : alt « L'équipe Lynaris au travail dans un workspace moderne parisien » — c'est faux si c'est une image générée par Higgsfield (commentaire l.10). C'est une **photo générée par IA**, pas l'équipe Lynaris. Reformule : « Composition illustrative — workspace moderne ». Sinon tu trompes l'utilisateur (et un journaliste qui scrape pour la presse).
- **`textOpacity` 0 → 1 sur [0.05, 0.28]** : sur mobile, la section fait 820 px de haut, donc le texte apparaît après ~40 px de scroll. OK, mais teste sur petits écrans (le titre 88 px peut ne pas tenir).

---

### 2.7 — `DemoConversationSection.tsx`

Lu uniquement via la home — à vérifier mais probablement une démo statique. **Action** : assure-toi que la démo n'invente pas de noms/numéros (RGPD + crédibilité).

---

### 2.8 — `BentoSection.tsx`

#### Points forts
- Belle composition asymétrique, image dashboard intégrée avec gradient overlay ✅
- Couleur par agent respectée

#### ⚠️ À modifier
- Carte 1 : « **Décroche en 2 secondes** » → contredit `< 2s` (Stats) et `< 3s` (Marine page). Aligne.
- Carte 4 : « Programme bêta ouvert — 1 client pilote actif » : honnête et bien. Garde tel quel.
- **`Brain`, `PenTool`, `TrendingUp`, `BarChart3`** importés mais l'icône `Brain` est étrange pour Charles (orchestrateur). Préfère `Sparkles` ou `Network`.

#### ✨ À ajouter
- **Lien « Voir Marine en détail »** sur la grande carte → `/agents/marine`. Sinon c'est un cul-de-sac.

---

### 2.9 — `HowItWorksSection.tsx`

#### ❌ À supprimer
- **`<img>` natif** (l.143-150, eslint-disabled explicite) au lieu de `<Image>` next/image. Tu perds : lazy automatique, AVIF/WebP négocié, sizing responsive, **+~150 ms de LCP**.
- **`dashboard-mockup-photo.png`** dans `/public/marketing/` : ~800 KB+ PNG. Convertir en webp + ajouter avif fallback : **gain estimé 60-70 %**.

#### ⚠️ À modifier
- 3 étapes décrites au passé/présent mélangé : « Tu relies… (présent) Tu choisis… (présent) Ils travaillent (présent), tu pilotes (présent) ». OK c'est cohérent. Mais step 2 « **Tu choisis les agents qui correspondent à ton activité** » alors qu'en bêta, **Marine seule est dispo**. Reformule : « Tu actives les agents pertinents. Marine pour les appels, Lou pour le contenu (bêta), Elio pour la prospection (bêta)… ».

---

### 2.10 — `TestimonialsSection.tsx`

#### Points forts
- **Honnêteté assumée** : tableau `testimonials` vide → 3 slots « Place pilote disponible ». Bravo, c'est le bon réflexe.

#### ⚠️ À modifier
- **Émojis 🚀 ✨ 💬** (l.148, 186, 224) → utilise `Rocket`, `Sparkles`, `MessageCircle` de lucide.
- **Titre H2 « Ils utilisent Lynaris »** alors que **personne ne l'utilise** encore (`testimonials: []`). Honnêteté cassée. Préfère : « Programme pilote — devenir nos premiers clients ».
- **Sous-titre « 1 client en production. 3 places pilote ouvertes »** → cohérent avec ta promesse. Bon.

#### ✨ À ajouter
- Une **case study story format** sur Cabinet Ménigoz **dès qu'ils signent une autorisation de citation** (voir CLAUDE_STANDARDS « Aucune fake data jamais »).

---

### 2.11 — `PricingSection.tsx`

#### Points forts
- Toggle mensuel/annuel propre + badge -15 % ✅
- Conic gradient animé sur plan featured ✅
- Données externalisées (`PLAN_LIST` from `lib/pricing/plans`) ✅

#### ⚠️ À modifier
- **`Sur devis`** sans CTA différencié — c'est juste un `Button` avec `plan.cta.href`. Vérifier que ça envoie vers `/contact?plan=custom` et que le formulaire pré-remplit.
- **« Les agents en bêta et roadmap sont accessibles gratuitement pendant leur phase de développement. »** (l.110-111) — phrase clé importante mais en gris faible. Mets-la en `text-[--ly-text-muted]` au lieu de `#71717A` pour augmenter le contraste.
- **`@keyframes spin-gradient`** référencé dans le style inline mais l'animation n'est pas définie ici (probablement dans `globals.css`). Vérifier qu'elle existe sinon le bord conic n'animera pas.

#### ✨ À ajouter
- **Économie annuelle en € sous le prix** : « 588 €/an au lieu de 690 € » — plus parlant que « -15 % ».
- **Comparateur fonctionnalité ligne par ligne** sous les 3 cartes (à l'image de Linear ou Vercel). Aide les TPE à choisir.

---

### 2.12 — `FaqSection.tsx`

#### Points forts
- 6 questions ciblées objections réelles ✅
- Accordion accessible (`aria-expanded`) ✅

#### ⚠️ À modifier
- **« Lynaris s'intègre avec plus de 20 services »** (l.27) — chiffre flou. Soit tu donnes le chiffre exact (« 23 services »), soit tu retires (« Lynaris s'intègre avec Gmail, Google Calendar, WordPress… »).
- **Section padding** (`py-20 lg:py-28`) trop large pour une FAQ. Réduis à `py-16 lg:py-20`.

#### ✨ À ajouter
- **Schema.org `FAQPage`** dans le composant `StructuredData` (gain SEO Google rich snippets). Plug rapide.
- **CTA « Une autre question ? Contacte-nous »** en bas de la FAQ → `/contact`.

---

### 2.13 — Page agent : `marine/page.tsx` (et 7 autres)

#### ⚠️ À modifier (voir §1.2)
- Stats faux/promesses non tenables : « 87 min récupérées », « 0 appels manqués ». **À retirer ou sourcer.**
- Section `capabilities` : 6 cartes très complètes. Garde.
- Manque : **un cas concret narratif** (« Mardi 14 h 32 : appel d'urgence reçu par Marine, escaladé en 12 secondes ») > liste abstraite.

---

### 2.14 — Pages diverses

| Page | État | Recommandation |
|---|---|---|
| `/blog` + `[slug]` | OK structure, vérifier qu'il y a vraiment des articles | Si vide : noindex |
| `/a-propos` | À auditer, je n'ai pas lu | Vérifier zéro buzzword |
| `/cas-clients` | Retiré du footer car « pas prêt » | OK |
| `/calculateur` | ROI calculator — utile | Vérifier que les formules sont sourcées |
| `/contact` | OK, contient form | Vérifier honeypot anti-spam |
| `/presse`, `/carrieres`, `/changelog` | Retirés footer | Ajoute `noindex` métadata |
| `/legal/*` | 4 pages OK | Vérifier qu'elles sont vraiment à jour (RGPD, CGU rédigées avec un juriste, pas un LLM seul) |
| `/skills` | Liste les compétences agents | Vérifier qu'on n'annonce pas des skills inexistantes |
| `/docs` | Documentation publique | Vérifier qu'elle n'est pas vide |
| `/pour/[vertical]` | Landings par ICP | Excellente idée — décrire chacune avec un cas réel quand possible |

---

## 3. Auth & onboarding

### 3.1 — `login/page.tsx` / `signup/page.tsx` / `forgot-password/page.tsx`

#### Points forts (rares à atteindre)
- Split layout pro avec branding gauche + form droite ✅
- `autoComplete` correct (`email`, `current-password`, `new-password`) ✅
- Toggle show password avec `aria-label` ✅
- Google OAuth + email/mot de passe ✅
- État success séparé sur forgot-password ✅
- `useSearchParams` pour pré-sélectionner le plan depuis l'URL ✅
- CGU coché obligatoire ✅
- Validation regex email + length password ✅

#### ❌ À supprimer
- **`<style>{`...`}</style>`** inline dans React (l.85-110 login, l.162-182 signup) : très long, anti-pattern. **Migrer vers Tailwind + globals.css** pour cohérence design system. Sinon tu casses la promesse de DESIGN.md (« style={{...}} inline interdit sauf valeurs dynamiques »).

#### ⚠️ À modifier
- **Forgot-password : pas d'obfuscation timing-attack**. Actuellement si l'email n'existe pas, Supabase peut renvoyer une erreur lisible → fuite info. Affiche **toujours** l'état "envoyé", même si email inconnu. (Voir doc Supabase `resetPasswordForEmail` — comportement par défaut anti-énumération, mais vérifie tes logs).
- **Bouton « Continuer avec Google »** : c'est l'option **secondaire** sur login mais **primaire visuellement** sur signup (équivalent au CTA orange). Préfère l'inverse : signup primaire = email (parcours plus engagé), Google = bouton blanc petit.
- **Password requirements** affichés en placeholder discret (`8 caractères min.`) — bien, mais ajoute un **indicateur de force visuel** (barre dégradée vert/jaune/rouge) pendant la frappe. Aide les utilisateurs faibles.
- **Pas de captcha invisible** (hCaptcha ou Turnstile) sur signup — risque bots quand tu seras visible.

#### ✨ À ajouter
- **Magic link** comme alternative à mot de passe (Supabase le fait nativement). Réduit la friction de 30 %.
- **2FA TOTP** pour la phase 2 (compte critique = données business).
- **« Connecté en tant que… »** si déjà loggé, propose « Se déconnecter » au lieu d'afficher le form.
- **Lien retour à `/`** dans le panel gauche (le logo `LynarisLogo` n'est pas cliquable).
- **Cookie de souvenir** : `Set-Cookie: remember=true; HttpOnly; Secure; SameSite=Lax`.

### 3.2 — `OnboardingTour.tsx`

#### ❌ À supprimer
- **Tous les émojis** dans les titres des steps (👋, 🤖, ⚡, 🔌, 📝, 📁, 💬, 🎉) — anti-pattern DESIGN.md.

#### ⚠️ À modifier
- **driver.js** : librairie ajoutée pour le tour — vérifie que c'est documenté dans DECISIONS.md. Le poids ajouté (~30 KB) et la dépendance externe doivent être justifiés.
- **Step 3 « Vos 9 assistants IA »** : cohérence avec §1.1.
- **Tour démarré au montage** sans question. Préfère un **prompt « Veux-tu un tour de 2 min ? »** avec choix de skip.
- **`onCloseClick` envoie `skipped: true`** mais l'utilisateur peut vouloir le reprendre plus tard. Ajoute un bouton « Refaire le tour » dans le profil.

#### ✨ À ajouter
- **Checklist d'activation visible en sidebar dashboard** :
  - [ ] Connecter Gmail
  - [ ] Configurer Marine
  - [ ] Importer ses contacts
  - [ ] Premier appel test

  Persistante, ferme une étape à la fois. C'est ce qui fait passer du « j'ai un compte » au « je l'utilise ».

### 3.3 — `onboarding/layout.tsx`

#### ⚠️ À modifier
- **Minimaliste à l'extrême** : juste un background `#0A0A0B` et un `flex center`. Aucun branding, aucun progrès, rien. **Ajoute** : logo Lynaris, indicateur d'étape (1/4, 2/4…), bouton « Skip pour l'instant ».

---

## 4. Dashboard / app connectée

### 4.1 — `AppShell.tsx`

#### Points forts
- Prefetch des routes fréquentes via `requestIdleCallback` ✅
- `Cmd+K` / `Ctrl+K` global pour CommandPalette ✅
- Cache sessionStorage 5 min pour `isAdmin` ✅
- Dynamic imports pour CommandPalette + VoiceLynaris (gros bundles) ✅

#### ⚠️ À modifier
- **`AuroraBackground` toujours monté** : même différé en idle, c'est une animation lourde. Désactive-la sur `prefers-reduced-motion` (à vérifier dans `AuroraBackground.tsx`).
- **`VoiceLynaris`** : composant audio (Lynaris parle ?). Vérifie le consentement explicite avant audio (RGPD + bonne pratique UX).
- **Pas de skip-link** « Aller au contenu principal » → accessibilité clavier WCAG.

### 4.2 — `dashboard/agents/page.tsx`

#### Points forts
- Filtre `limits.agents` selon le plan ✅
- Quick-input direct sur la carte (UX très Linear) ✅
- `localStorage` pour pre-fill + autosubmit ✅
- Loading state propre (filter inactif tant que `loading`) ✅

#### ⚠️ À modifier
- **Tabs « Mes assistants / Historique des conversations »** : l'historique fait une page séparée `/dashboard/conversations`. **Soit** l'historique se charge dans la tab, **soit** tu retires la tab (lien direct). Demi-mesure actuelle = mauvaise.
- **`Demande à ${agent.name}…`** placeholder : pour un agent locké (plan inférieur), l'input est désactivé mais on n'explique pas pourquoi. Ajoute un tooltip « Passer en plan Pro pour activer ».
- **Empty state pour le tab « Historique »** : actuellement, juste un texte + bouton. Ajoute une icône lucide (`MessageSquare` outline) et explique : « Tes conversations s'afficheront ici après ta première interaction ».

### 4.3 — Navigation Spotlight

À auditer plus en profondeur. Ce que j'ai vu :
- 3 composants (`SpotlightTopBar`, `SpotlightSubNav`, `SpotlightMobileDrawer`) — bonne séparation
- `data-tour="…"` attributs pour OnboardingTour — bonne intégration

**Action** : vérifie que les **44×44 px minimum** sont respectés sur mobile pour chaque touche cible (standard `CLAUDE_STANDARDS.md`).

### 4.4 — Pages dashboard à vérifier
| Page | Pour vérifier |
|---|---|
| `/dashboard/crm` | Empty state propre quand pas de contacts |
| `/dashboard/contacts` | Idem + import CSV |
| `/dashboard/analytics` | Pas de fake graphs si pas de data |
| `/dashboard/calendrier` | Sync Google Calendar visible |
| `/dashboard/automatisations` | Liste vraie des workflows n8n disponibles |
| `/dashboard/integrations` | OAuth flows fonctionnels (pas d'icônes inactives) |
| `/dashboard/billing` | Plan actuel + bouton upgrade clair |
| `/dashboard/team` | Invite + roles |
| `/dashboard/documents` | Upload + KB associée aux agents |
| `/dashboard/prompts` | Si on expose le prompt aux users : vérifier la doc |
| `/dashboard/skills` | Liste des skills activables par agent |
| `/dashboard/workspace` | Setup org-level |
| `/dashboard/support` | Chat ticket fonctionnel |
| `/dashboard/admin/*` | RBAC vérifié (voir AUDIT_REPORT C5) |

→ **Action** : passe chaque page une fois en compte vide (« first time user ») et une fois en compte rempli. Note tous les empty states cassés.

---

## 5. Animations, motion, scroll

### 5.1 — Trop de librairies

| Lib | Utilisée pour | Poids gz | Justifiée ? |
|---|---|---|---|
| **Framer Motion** | `motion.div`, `useInView`, `useScroll`, `useReducedMotion` | ~45 KB | ✅ oui, partout |
| **GSAP + ScrollTrigger** | Hero timeline, scroll-reveal sections | ~70 KB | ⚠️ chargée en `dynamic import`, mais réutilise ce que Framer Motion peut faire |
| **Lenis** (smooth scroll) | `SmoothScrollProvider` | ~10 KB | ❌ anti-pattern CLAUDE_STANDARDS |
| **Three.js** | `HeroScene`, `HeroLogo3D` | ~150 KB | ❌ déco uniquement, pas justifié |
| **driver.js** | OnboardingTour | ~30 KB | ⚠️ chargé dynamiquement, OK |

**Total bundle motion sur la home : ~300 KB gz uniquement pour animer.**

#### ❌ À supprimer
- **Lenis** : « scroll-hijack » explicitement interdit par standards. Le scroll natif moderne est déjà smooth. Supprime `SmoothScrollProvider`.
- **`CustomCursor`** : interdit par `CLAUDE_STANDARDS.md` ligne 90 (« Pas de scroll-hijack, parallax lourd, custom cursor »). Et fait `document.documentElement.style.cursor = "none"` ce qui casse l'accessibilité (utilisateurs avec curseur agrandi pour vision).
- **Three.js** sur le hero — choisis-en un seul effet (`HeroLogo3D` à mon sens). Vire `HeroScene` (particules génériques).

#### ⚠️ À modifier
- **GSAP** : tu peux migrer 80 % des scroll-reveal sections vers Framer Motion `useInView` (déjà utilisé dans `TestimonialsSection`, `FaqSection`). Ça unifie + retire GSAP du bundle. Garde GSAP uniquement pour la timeline hero qui est complexe.

### 5.2 — Animations infinies

Audit rapide des `repeat: Infinity` ou `animation: loop`:

| Composant | Animations infinies |
|---|---|
| `HeroVisualShowcase` | 5 (Ken Burns, particules, avatar float, ticker, pulse dot) |
| `AgentsSection` (chaque carte) | 1 float (×9 agents = 9 animations parallèles) |
| `Navbar` | 1 scroll-progress bar (réagit, pas vraiment infinie) |
| `pricing-card` featured | 1 conic-gradient spin |
| `auth/forgot-password` | 2 blobs `blob-1`/`blob-2` |
| `auth/login` | 2 blobs |

→ **Total** : ~20 animations infinies sur la home. Sur batterie mobile = drain. **Pause** quand `document.visibilityState !== "visible"`.

### 5.3 — Respect `prefers-reduced-motion`

**Audit** : la grande majorité des composants respecte `useReducedMotion()` ou `window.matchMedia("(prefers-reduced-motion: reduce)")`. ✅ Très bien.

**Mais** :
- Les **blobs CSS** dans `login/signup/forgot` ne respectent PAS `prefers-reduced-motion` (animation CSS pure, pas hookée). Ajoute :
  ```css
  @media (prefers-reduced-motion: reduce) {
    .auth-blob-1, .auth-blob-2 { animation: none; }
  }
  ```
- **`Navbar` scroll-progress bar** : pas désactivable. OK car indicateur fonctionnel.
- **`PricingSection` conic-gradient `spin-gradient`** : à vérifier dans globals.css.

---

## 6. Assets — `/public/`

### 6.1 — À supprimer immédiatement

| Fichier | Raison |
|---|---|
| `public/file.svg` | Reste du starter Next.js |
| `public/globe.svg` | Idem |
| `public/next.svg` | Idem |
| `public/vercel.svg` | Idem |
| `public/window.svg` | Idem |
| `public/marketing/how-it-works-new.png` | Version obsolète |
| `public/marketing/how-it-works-v2.png` | Version obsolète |
| `public/marketing/how-it-works-v3.png` | Version obsolète |
| `public/marketing/how-it-works-v4.png` | Version obsolète |
| `public/marketing/how-it-works.png` | Doublon du `.webp` si pas de fallback |
| `public/marketing/dashboard-screenshot.png` | Si `dashboard-mockup-photo.png` est utilisé (à vérifier) |
| `public/agents/avatars/aria.png` + `aria.webp` | Aria n'existe pas dans la liste des agents |
| `public/agents/scenes/aria.webp` | Idem |
| `public/agents/avatars/*.png` | Si les `.webp` sont utilisés partout (voir `AgentsSection.tsx:197` qui fait `.replace(".webp", ".png")` — choisis !) |

→ **Gain estimé** : entre 5 et 20 Mo de repo + clarté +++.

### 6.2 — À ajouter

| Asset | Pourquoi |
|---|---|
| `public/agents/avatars/orion.webp/.png` | Orion documenté dans AGENTS.md mais sans avatar |
| `public/agents/scenes/orion.webp` | Idem (ou supprimer Orion partout — voir §1.1) |
| `public/agents/videos/orion.mp4` | Idem |
| Versions **AVIF** des assets statiques | Gain ~30 % vs WebP, supporté par 95 %+ des navigateurs |
| `public/marketing/videos/*.jpg` (poster) | Pour `<video poster="...">` — affichage avant lecture |
| `public/marketing/videos/*.vtt` | Sous-titres (accessibilité vidéo, RGPD pour démos vocales) |
| `public/og/*.png` (1200×630) | Open Graph par page agent (actuellement seul `opengraph-image.tsx` dynamique) |
| `public/apple-touch-icon.png` (180×180) | iOS bookmark |
| `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | PWA manifest |
| `public/manifest.json` | PWA installable |

### 6.3 — À modifier

- **`team-hero.webp`** : c'est une image **générée par IA** (Higgsfield) selon le commentaire `TeamSection.tsx:10`. Reformule l'`alt` pour ne pas tromper.
- **Service Worker `public/sw.js`** : si tu veux PWA, ajoute le manifest. Si tu veux pas, **vire le SW** (il peut cacher des bugs de cache).

---

## 7. Design system — `/src/components/`

### 7.1 — Doublons à supprimer

| Composant | Statut |
|---|---|
| `components/ui/skeleton.tsx` | ✅ shadcn primitif |
| `components/shared/Skeleton.tsx` | ❌ doublon — supprime ou rename |
| `app/Topbar.tsx`, `app/Sidebar.tsx` | ❌ remplacés par Spotlight* (voir §1.5) |
| `app/LimovaNav.tsx` | ❌ système mort |
| `app/CharlesWidget.tsx` vs `app/dashboard/CharlesFab.tsx` | À vérifier — possibles doublons |
| `app/glass/Glass.tsx` | À vérifier — utile uniquement si « namespace » |

### 7.2 — Primitives à ajouter (shadcn)

Si tu veux compléter ton design system :

- **`Dialog`** (modal) — actuellement custom à plusieurs endroits
- **`Toast`** (notification) — `NotificationProvider` existe, vérifier que c'est shadcn-style
- **`Sheet`** (panneau latéral mobile) — `SpotlightMobileDrawer` peut être ça
- **`Tabs`** primitives — `dashboard/agents/page.tsx` utilise des `GlassChip` au lieu de Tabs accessibles
- **`Select`**, **`Command`** (palette), **`Popover`**, **`HoverCard`**

→ **Action** : exécute `npx shadcn add dialog toast sheet tabs select` et migre.

### 7.3 — Tokens CSS

`DESIGN.md` documente bien la palette. Mais `HeroSection.tsx` et beaucoup d'autres utilisent **toujours du hex en dur** (`"#F5F5F7"`, `"#A1A1AA"`, `"#7C3AED"`…). Anti-pattern : si tu décides un jour de passer en light mode, tu vas faire un find-replace géant.

→ **Action** : utilise toujours `var(--ly-text)`, `var(--ly-primary)` etc. dans les styles. C'est de la dette qui s'accumule à chaque section ajoutée.

---

## 8. SEO / accessibilité — points critiques

### 8.1 — SEO
- ✅ `sitemap.ts`, `robots.ts`, JSON-LD via `StructuredData` (à vérifier)
- ✅ OG image dynamique (`opengraph-image.tsx`)
- ⚠️ Title homepage : « Lynaris — Ton équipe IA, opérationnelle en 48h » → 47 caractères, OK
- ⚠️ Meta description : 145 caractères, dans la cible (120-160)
- ❌ Pas vu `canonical` URL pour `/pour/[vertical]` — risque duplicate content
- ❌ Pas de `Breadcrumb` schema.org

### 8.2 — Accessibilité (WCAG 2.2 AA)
- ✅ `aria-labelledby` sur sections, `aria-label` sur boutons icon-only
- ⚠️ **Contraste à vérifier** : `#71717A` sur `#0A0A0F` = ratio ~4.0:1 → **sous le 4.5:1** WCAG AA pour body text. Augmente à `#A1A1AA` quand c'est du texte non-décoratif.
- ⚠️ **Focus visible** : à vérifier sur tous les éléments interactifs (`focus-visible:ring`).
- ⚠️ **Skip-link** « Aller au contenu » manquant.
- ❌ **CustomCursor cache le curseur natif** — casse l'accessibilité (utilisateurs avec curseur agrandi).
- ❌ Vidéos sans `<track kind="captions">`.

---

## 9. Plan d'action prioritaire (semaine 1)

### Jour 1 — Nettoyage (3 h, gain massif)
1. **Supprime les 5 SVG starter Next.js** (`file/globe/next/vercel/window.svg`) (5 min)
2. **Supprime les 4 versions obsolètes** de `how-it-works-vX.png` (5 min)
3. **Supprime `aria.*` agents fantômes** (5 min)
4. **Supprime `Topbar.tsx`, `Sidebar.tsx`, `LimovaNav.tsx`, `GlassTopbar.tsx`, `GlassSidebar.tsx`** après vérif `grep -r` (1 h)
5. **Supprime `SmoothScrollProvider`, `CustomCursor`** + import depuis layout (30 min)
6. **Supprime `HeroScene` Three.js** (garde uniquement `HeroLogo3D`) (30 min)

→ **Résultat estimé** : bundle initial -100 à -200 KB, repo -10 Mo, dette -5 composants.

### Jour 2 — Cohérence "9 agents" (1 h)
1. **Décide** Option A (jamais de chiffre) ou B (8 agents) (5 min — sois honnête)
2. `grep -rn "9 agents\|9 assistants"` + remplace (30 min)
3. Mets à jour `Navbar.tsx` AGENTS_DROPDOWN si Orion intégré ou retiré (15 min)
4. Mets à jour `README.md`, `AGENTS.md`, `OnboardingTour.tsx`, `StatsSection.tsx`, `TeamSection.tsx`, `marine/page.tsx` (10 min)

### Jour 3 — Honnêteté des promesses (2 h)
1. **Supprime/sourçe** « 87 min récupérées », « 0 appels manqués », « < 2s/3s » incohérentes (30 min)
2. **Aligne** `< 2s`/`< 3s` partout sur une seule valeur (5 min)
3. **Reformule** ce qui présuppose plusieurs agents en prod (subtitle, FAQ, etc.) (1 h)
4. **Footer** « avec ♥ et Claude » → décide (5 min)

### Jour 4 — Anti-patterns design system (3 h)
1. **Supprime tous les émojis** des `TestimonialsSection`, `OnboardingTour`, hero stats pills (1 h)
2. **Migre les hex en dur** vers `var(--ly-*)` dans les composants les plus visibles (Hero, Bento, Pricing) (2 h)

### Jour 5 — Quick wins SEO / perf (2 h)
1. Convertis `dashboard-mockup-photo.png` en webp + ajoute `<Image>` next/image dans `HowItWorksSection` (15 min)
2. Ajoute AVIF aux 5 images les plus lourdes (1 h)
3. Ajoute `<link rel="preload">` sur l'image LCP du hero (5 min)
4. Ajoute Schema.org `FAQPage` dans `StructuredData` (30 min)

---

## 10. Plan à 1 mois — stratégique

| Semaine | Focus |
|---|---|
| **S1** | Nettoyage + cohérence (cf. §9) |
| **S2** | Auth → magic link, indicateur force mot de passe, captcha, 2FA roadmap |
| **S3** | Dashboard → empty states soignés sur les 14 pages, skip-link, checklist activation |
| **S4** | Marketing → 1-2 vrais cas clients en cas-clients/page.tsx, vidéo hero intégrée, comparateur fonctionnalités tarifs |

---

## 11. Choses que tu as bien faites (à conserver)

Pour pas être que critique :

- ✅ **Documentation** : DESIGN.md, AGENTS.md, CLAUDE_STANDARDS.md, README.md — état rare dans un projet solo
- ✅ **Honnêteté** : `testimonials: []` + slots pilotes plutôt que faux clients
- ✅ **Hero showcase** : composition Marine + bulles + ticker secteurs = vraiment pro
- ✅ **TypeScript strict** + 0 `any` + audit sécu déjà fait
- ✅ **`prefers-reduced-motion`** respecté à 90 % du code
- ✅ **Async imports GSAP / Three.js** = bundle initial protégé
- ✅ **Auth flows** : login/signup/forgot-password sont meilleurs que 80 % des SaaS français
- ✅ **OnboardingLoader + Tour** structuré
- ✅ **`PlanProvider`** centralise les limites — bon pour l'évolution multi-tenant
- ✅ **Footer légal complet** (CGU, RGPD, mentions, confidentialité)
- ✅ **Mobile-first responsive** sur la majorité des composants
- ✅ **`StatusBadge` agent** (live / beta / roadmap) transparent et honnête
- ✅ **Palette agents** par couleur cohérente, design tokens documentés
- ✅ **Page `tarifs` séparée** avec ReassuranceStrip + PricingFAQ + FinalCTA → bonne décomposition
- ✅ **Préfetch routes dashboard** au idle = perceived perf++

---

## 12. Questions ouvertes pour toi, Yoann

1. **Lancement officiel T3 2026** (cf. badge hero) — date confirmée ?
2. **Orion** : on garde ou on vire ? Décision urgente (impact §1.1 + assets §6.2)
3. **Aria** dans `/public/agents/*` : agent abandonné ou prévu ?
4. **Vidéos `hero-loop.mp4` + `hero-lynaris.mp4`** : laquelle est la bonne ?
5. **`dashboard-screenshot.png` vs `dashboard-mockup-photo.png`** : laquelle est officielle ?
6. **Marine en bêta privée** : combien de clients réels actuellement ? (pour calibrer la copy)
7. **PWA installable** souhaitée ou pas ? (impact §6.2 manifest)
8. **Light mode** prévu en v2 (DESIGN.md le dit) : commence à migrer les hex en dur dès maintenant pour éviter la dette
9. **driver.js** justifié dans DECISIONS.md ?
10. **Lenis smooth scroll** : tu y tiens ou je peux le virer ?

---

*Audit rédigé en lecture directe du codebase au 19 mai 2026. Recommandations alignées sur `DESIGN.md`, `CLAUDE_STANDARDS.md` et `AGENTS.md`. Pour les sujets sécu/code/DB, voir `AUDIT_REPORT.md` du 24 avril 2026 (complémentaire).*
