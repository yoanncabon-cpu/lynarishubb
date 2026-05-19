# 🚀 Prompt Maître — Améliorations Lynaris Hub

> Référence complète pour implémenter les améliorations identifiées sur le projet.
> À utiliser session par session en précisant la section à traiter.

---

## Contexte projet

Tu travailles sur **Lynaris Hub**, un SaaS Next.js 14 (App Router) en dark theme qui présente et orchestre une équipe d'agents IA spécialisés.

**Stack :** Next.js 14 App Router, TypeScript, Tailwind CSS, GSAP, Framer Motion, Three.js, Supabase, Stripe.

**Structure :**
- `src/app/(marketing)/` → landing page publique + pages agents, blog, tarifs, etc.
- `src/app/(app)/dashboard/` → dashboard SaaS connecté
- `src/components/marketing/` → sections de la landing
- `src/components/app/` → composants de l'app
- `src/components/shared/` → composants réutilisables

**Palette :** Fond `#0A0A0F`, Violet `#7C3AED`, Cyan `#22D3EE`, Orange CTA `#E86F4D`, Texte `#F5F5F7`, Dim `#A1A1AA`, Muted `#71717A`.

**Agents :** marine, charles, lou, elio, mae, max, nova, alba (+ aria interne).

---

## PRIORITÉ 1 — Corrections critiques

### 1.1 Menu mobile manquant

**Problème :** La navbar mobile affiche seulement 2 boutons CTA. Les liens Agents, Tarifs, Blog, Docs sont invisibles sur smartphone.

**À faire dans `src/components/marketing/Navbar.tsx` :**
- Ajouter un bouton hamburger (icône `Menu` de lucide-react) qui ouvre un drawer/sheet latéral ou un menu plein écran
- Le drawer doit lister tous les `navLinks` + le dropdown Agents (grille 2×4 des avatars)
- Fermer le drawer au clic sur un lien (navigation)
- Animation : slide depuis la droite ou fade+scale depuis le haut
- Respecter `prefers-reduced-motion`
- Le drawer doit avoir le même fond glassmorphism que la navbar scrollée : `rgba(10,10,15,0.95)` + `backdrop-filter: blur(48px)`

```
État : useState pour isMenuOpen
Trigger : bouton hamburger visible uniquement en md:hidden
Overlay : fond semi-transparent qui ferme le menu au clic
```

---

### 1.2 OG Image manquante

**Problème :** Aucune image de partage définie → aperçus vides sur WhatsApp, LinkedIn, Twitter.

**À faire :**
- Créer `src/app/opengraph-image.tsx` (Next.js ImageResponse)
- Dimensions : 1200×630px
- Design : fond `#0A0A0F`, logo Lynaris centré, tagline "Ton équipe IA. Qui exécute." en grand, gradient violet→cyan en arrière-plan, avatars des 8 agents en rangée en bas
- Ajouter des OG images spécifiques pour chaque page agent : `src/app/(marketing)/agents/[slug]/opengraph-image.tsx` avec l'avatar de l'agent en grand et son nom/rôle

---

### 1.3 Remplacer la section Testimonials vide

**Problème :** Afficher 3 slots "Place pilote disponible" sans aucun témoignage réel nuit à la crédibilité.

**Option A — Remplacer par une section "Programme Bêta" :**
Transformer `TestimonialsSection` en section dédiée au programme early adopter avec :
- Titre : "Sois parmi les premiers"
- 3 cartes : avantages concrets du programme bêta (tarif early adopter, accompagnement direct, influence sur la roadmap)
- 1 CTA central : "Rejoindre le programme bêta →" vers `/contact`

**Option B — Remplacer par des logos d'intégrations :**
Convertir la section en une galerie de logos des outils connectés (Google, Stripe, Twilio, ElevenLabs, WordPress...) avec le titre "Compatible avec vos outils" — emprunter le pattern marquee de `IntegrationsSection`.

**Recommandation : Option A** (plus de valeur marketing).

---

## PRIORITÉ 2 — Design & UX

### 2.1 NumberTicker sur StatsSection

**Problème :** Les chiffres ("9", "48h", "24/7", "< 2s") sont statiques alors que le composant `NumberTicker` existe déjà dans `src/components/shared/NumberTicker.tsx`.

**À faire dans `src/components/marketing/StatsSection.tsx` :**
- Importer `NumberTicker`
- Au scroll trigger (IntersectionObserver ou GSAP ScrollTrigger), lancer le comptage de 0 jusqu'à la valeur finale
- Pour "< 2s" et "24/7" : afficher directement sans ticker (non numériques) mais avec une animation de fade+scale
- Délai staggeré entre chaque chiffre : 150ms

---

### 2.2 LogosStrip — Marquee d'intégrations

**Problème :** `LogosStrip` affiche juste une ligne de texte.

**À faire dans `src/components/marketing/LogosStrip.tsx` :**
- Remplacer par une marquee horizontale infinie (pattern déjà utilisé dans `IntegrationsSection`)
- Afficher les logos des principales intégrations : Google Calendar, Gmail, WordPress, Stripe, Twilio, ElevenLabs, LinkedIn, Instagram, Notion, HubSpot, Shopify, n8n, Make
- Titre au-dessus : "S'intègre à vos outils existants"
- Vitesse lente (~40s pour un tour complet), pause au hover
- Dupliquer la liste pour le loop infini

---

### 2.3 Footer — Réseaux sociaux & Newsletter

**À ajouter dans `src/components/marketing/Footer.tsx` :**

**Réseaux sociaux** (dans la colonne Brand) :
```tsx
const socials = [
  { href: "https://linkedin.com/company/lynaris", label: "LinkedIn", icon: Linkedin },
  { href: "https://twitter.com/lynaris_ai", label: "Twitter / X", icon: Twitter },
  // Ajouter YouTube quand la chaîne existe
]
```
Icônes de taille 18px, couleur `#52525B` → `#F5F5F7` au hover.

**Mini CTA newsletter** (au-dessus du bottom bar) :
```
"Reçois les updates Lynaris"
[email input] [S'abonner →]
```
Fond `rgba(255,255,255,0.03)`, border `rgba(255,255,255,0.08)`.

---

### 2.4 Screenshots du dashboard sur la landing

**À faire :**
- Créer ou capturer une image `public/dashboard-preview.png` (screenshot ou mockup du dashboard glass)
- L'intégrer dans la `BentoSection` pour la carte "md:col-span-2 md:row-span-2" (grande carte "Décroche en 2 secondes") en remplacement ou complément de l'icône
- Ou créer une section dédiée "Voir l'interface" avec un mockup dans un frame browser (style Vercel/Linear)

---

### 2.5 Shimmer sur le CTA Navbar

**Problème :** Le shimmer hover existe sur le CTA hero mais pas sur le bouton "Essai gratuit" de la navbar.

**À faire dans `src/components/marketing/Navbar.tsx`** :
Ajouter le même effet shimmer que dans HeroSection :
```tsx
<span
  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)" }}
  aria-hidden
/>
```
sur le bouton `Essai gratuit` (desktop + mobile).

---

## PRIORITÉ 3 — Animations

### 3.1 Transition de page

**À faire dans `src/app/(marketing)/layout.tsx` :**
- Wrapper les enfants dans un composant `<PageTransition>` utilisant Framer Motion
- Animation : `opacity: 0 → 1` + `y: 8 → 0` sur 300ms avec `ease: [0.22, 1, 0.36, 1]`
- Utiliser `usePathname()` comme `key` pour que la transition se déclenche à chaque changement de route

```tsx
// src/components/shared/PageTransition.tsx
"use client"
import { motion, AnimatePresence } from "framer-motion"
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

---

### 3.2 Micro-animations sur HowItWorksSection

**À faire dans `src/components/marketing/HowItWorksSection.tsx` :**
- Ajouter une animation `scale: 0.8 → 1` + `rotate: -10° → 0°` sur les icônes des étapes au ScrollTrigger
- Ajouter un effet de pulse sur le numéro "01", "02", "03" (glow de la couleur de l'étape qui pulse 1 fois à l'entrée)

---

### 3.3 HeroVideoLoop — Activer dans le hero

**`src/components/marketing/HeroVideoLoop.tsx` existe mais n'est pas utilisé.**

**À faire dans `src/components/marketing/HeroVisualShowcase.tsx` :**
- En complément ou remplacement de la photo de fond, intégrer un loop vidéo court (15-30s) du dashboard en action
- `autoPlay muted loop playsInline`
- Gradient overlay par-dessus pour lisibilité
- Charger en `preload="none"` + lazy load après interaction (IntersectionObserver)

---

## PRIORITÉ 4 — Texte / Copywriting

### 4.1 Hero — Reformulations suggérées

**Badge (actuel) :**
> "Bêta privée — accès anticipé sur demande. Rejoindre la bêta."

**Badge (proposition) :**
> "Accès anticipé — 3 places pilote ouvertes. Postuler →"

---

**Subtitle (actuel) :**
> "Tes agents décrochent tes appels. Lou publie ton contenu. Elio prospecte pour toi. Une équipe IA spécialisée, active 24h/24."

**Subtitle (proposition) :**
> "Pendant que tu travailles, Marine répond au téléphone. Lou publie. Elio prospecte. Charles coordonne tout. Ton business avance, 24h/24."

---

**Social proof (actuel) :**
> "Lancement officiel — T3 2026"

**Social proof (proposition) :**
> "Accès bêta limité · Lancement T3 2026" avec un badge pulsant orange

---

### 4.2 HowItWorks — Étape 2 reformulation

**Actuel :** "Tu choisis les agents qui correspondent à ton activité."
**Proposition :** "En 5 minutes, tu configures les agents selon ton secteur. Un agent vocal pour les appels, Lou pour le contenu, Elio pour la prospection — chacun prêt à l'emploi."

---

### 4.3 LogosStrip — Texte

**Actuel :** "Rejoins nos premiers clients."
**Proposition :** "Déjà utilisé par des professionnels de santé, cabinets, et e-commerçants"

---

### 4.4 FAQ — Questions à couvrir absolument

Si `FaqSection` ne les couvre pas déjà, ajouter :
1. "Faut-il des compétences techniques pour utiliser Lynaris ?" → Non, configuration guidée en 48h
2. "Mes données sont-elles sécurisées ?" → RGPD, hébergement EU, chiffrement
3. "Puis-je annuler à tout moment ?" → Oui, sans engagement, 1 clic
4. "Que se passe-t-il à la fin de la période d'essai ?" → Choix du plan, pas de débit automatique
5. "Puis-je tester avant de payer ?" → 14 jours gratuits, sans carte bancaire

---

### 4.5 Footer — Tagline

**Actuel :** "Fait en France avec ♥ et Claude"
**Proposition :** "Fait en France avec ♥" (retirer la mention "et Claude" pour ne pas créer de confusion sur le positionnement Lynaris vs Anthropic)

---

## PRIORITÉ 5 — Fonctionnalités

### 5.1 Calculateur ROI — Mise en avant

**`/calculateur` existe mais n'est pas dans la navigation.**

**À faire :**
- Ajouter "Calculateur ROI" dans le footer, colonne "Ressources"
- Ou ajouter un lien dans `PricingSection` sous les plans : "Pas sûr du ROI ? → Calcule ton retour sur investissement"
- Ou ajouter le lien dans le dropdown Agents de la navbar (section séparée en bas)

---

### 5.2 Widget support / chat live

**À implémenter :**
- Intégrer Crisp (gratuit jusqu'à 2 agents) ou Intercom sur la landing et le dashboard
- Script à injecter dans `src/app/layout.tsx` via `next/script` avec `strategy="lazyOnload"`
- Sur la landing : visible uniquement sur les pages `/tarifs` et `/contact`
- Sur le dashboard : toujours visible (support in-app)

---

### 5.3 Analytics

**Vérifier si absent, ajouter :**
- Posthog (open-source, self-hostable) ou Plausible pour les events clés :
  - `hero_cta_click` (Commencer gratuitement)
  - `demo_cta_click` (Voir la démo)
  - `pricing_plan_click`
  - `agent_card_hover` + `agent_card_click`
  - `contact_form_submit`
- Ajouter dans `src/app/(marketing)/layout.tsx`

---

### 5.4 Page `/status`

**À créer : `src/app/(marketing)/status/page.tsx`**
- Statut de chaque composant : API, Webhooks, Agents, Voix, Dashboard
- Design minimaliste : pastille verte "Opérationnel" ou rouge "Dégradé"
- Lien dans le footer, colonne "Ressources"

---

## PRIORITÉ 6 — SEO & Performance

### 6.1 Metadata par page agent

**À vérifier/ajouter dans chaque `src/app/(marketing)/agents/[slug]/page.tsx` :**
```tsx
export const metadata: Metadata = {
  title: `${agent.name} — Agent IA ${agent.role} | Lynaris`,
  description: agent.tagline + " — Découvrez comment " + agent.name + " automatise votre " + agent.domain,
  openGraph: {
    title: ...,
    description: ...,
    images: [{ url: `/og/agents/${slug}.png`, width: 1200, height: 630 }],
  },
}
```

---

### 6.2 Vérifications Core Web Vitals

**Points à auditer (via Lighthouse ou PageSpeed Insights) :**
- **LCP** : l'image hero (photo de bureau) doit avoir `priority` sur le `<Image />` → vérifier dans `HeroVisualShowcase`
- **CLS** : s'assurer que les composants GSAP ne causent pas de layout shift au chargement (les éléments en `opacity: 0` doivent avoir leurs dimensions fixées)
- **INP** : les event listeners GSAP doivent être `passive: true`
- **FCP** : GSAP + Three.js sont déjà en async import, vérifier que Framer Motion n'est pas dans le bundle initial

---

## Usage de ce prompt

**Pour implémenter une section :**
```
En te basant sur le fichier PROMPT_AMELIORATIONS.md section [X.Y],
implémente [la fonctionnalité] dans [le fichier].
Respecte la palette de couleurs et le style du projet existant.
```

**Pour une session complète :**
```
Traite la PRIORITÉ 1 du PROMPT_AMELIORATIONS.md en entier.
Commence par 1.1, montre le code, attends ma validation avant de passer à 1.2.
```

**Pour le copywriting :**
```
En te basant sur la section 4 du PROMPT_AMELIORATIONS.md,
génère le texte définitif pour [la section] en respectant le ton
direct, moderne et en français de la marque Lynaris.
```
