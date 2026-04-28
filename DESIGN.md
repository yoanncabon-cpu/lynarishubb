# DESIGN.md — Lynaris Design System

> Reference unique pour la charte visuelle, les composants, et les regles de design.
> Maintenir a jour a chaque ajout ou modification.

## Principe directeur

Lynaris vise l'esthetique des meilleurs outils dark-mode : Linear, Vercel, Raycast.
- Dark mode par defaut (light en v2)
- Glassmorphism subtil, pas excessif
- Animations fonctionnelles, pas decoratives
- Performance > effet visuel

## Palette de couleurs

| Token CSS | Hex | Usage |
|---|---|---|
| `--ly-primary` | `#7C3AED` | CTA, accents, liens actifs |
| `--ly-primary-soft` | `#A78BFA` | Hovers, gradients, textes accent |
| `--ly-accent` | `#22D3EE` | Highlights rares (agent Marine), sparkles |
| `--ly-bg` | `#0A0A0F` | Fond principal de toutes les pages |
| `--ly-surface` | `#14141C` | Cards, panels, containers |
| `--ly-elevated` | `#1E1E2A` | Modales, dropdowns, tooltips |
| `--ly-text` | `#F5F5F7` | Texte principal — JAMAIS `#FFF` pur |
| `--ly-text-muted` | `#A1A1AA` | Labels, descriptions, secondaire |
| `--ly-text-dim` | `#71717A` | Timestamps, captions, desactive |
| `--ly-border` | `rgba(255,255,255,0.08)` | Bordures par defaut |
| `--ly-border-hover` | `rgba(124,58,237,0.3)` | Bordures au survol |
| `--ly-success` | `#10B981` | Etats OK, confirmations |
| `--ly-warning` | `#F59E0B` | Alertes, expirations |
| `--ly-danger` | `#EF4444` | Erreurs, destructions |

### Couleurs agents

| Agent | Hex |
|---|---|
| Marine | `#22D3EE` |
| Charles | `#7C3AED` |
| Lou | `#F472B6` |
| Elio | `#10B981` |
| Mae | `#F59E0B` |
| Max | `#EC4899` |
| Nova | `#6366F1` |
| Alba | `#8B5CF6` |
| Orion | `#64748B` |

## Typographie

- **Display / Headings** : Geist (variable `--font-geist-sans`)
- **Body** : Geist (meme famille, poids 400)
- **Mono** : Geist Mono (variable `--font-geist-mono`)

### Tailles et poids

| Element | Tailwind | Tracking |
|---|---|---|
| H1 display | `text-6xl font-bold` | `-0.03em` |
| H2 section | `text-4xl font-bold` | `-0.02em` |
| H3 card | `text-2xl font-bold` | `-0.02em` |
| Body | `text-base` | normal |
| Small | `text-sm` | normal |
| XSmall | `text-xs` | normal |
| Mono | `font-mono text-sm` | normal |

## Espacements et layout

- Max-width contenu : `max-w-7xl` (1280px)
- Padding horizontal : `px-4 sm:px-6 lg:px-8`
- Section padding vertical : `py-20 lg:py-28`
- Border radius : `--ly-radius: 0.75rem` (12px)
- Gap cards grid : `gap-4`

## Animations

### Scroll reveal (standard)
```tsx
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
```

### Stagger children
```tsx
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
```

### Hover card
```css
transition: transform 0.3s ease, border-color 0.2s ease;
hover: translate-y-[-4px]
```

### Durees
- Micro-interactions : 150ms
- Transitions : 200-300ms
- Reveal scroll : 500-600ms
- Animations loop (blob, grain) : 20s+

## Composants

### GlowCard
Card avec glow violet qui suit la souris.
```tsx
<GlowCard glowColor="rgba(124,58,237,0.15)" className="p-6">
  Contenu
</GlowCard>
```

### MagneticButton
Bouton avec effet magnetique souris (+/-8px max).
```tsx
<MagneticButton>
  <Button variant="primary">CTA</Button>
</MagneticButton>
```

### AgentAvatar
Avatar isometrique SVG par agent slug.
```tsx
<AgentAvatar slug="marine" name="Marine" color="#22D3EE" size={48} />
```

### StatusBadge
Badge semantique avec variantes couleur.
```tsx
<StatusBadge variant="success" dot>Actif</StatusBadge>
```

### StreamingMessageBubble
Bulle de chat avec curseur clignotant pendant le streaming.
```tsx
<StreamingMessageBubble role="assistant" agentName="Lou" agentColor="#F472B6" content="..." isStreaming />
```

### NumberTicker
Count-up anime au viewport enter.
```tsx
<NumberTicker value={1234} suffix="EUR" />
```

### TypewriterText
Texte qui s'ecrit/efface en boucle.
```tsx
<TypewriterText texts={["Phrase 1.", "Phrase 2."]} typingSpeed={60} />
```

## Accessibilite

- Contrast ratio minimum : 4.5:1 (WCAG AA)
- Touch targets minimum : 44x44px
- `aria-label` sur tous les boutons icone
- `alt` descriptif sur toutes les images
- Focus visible : `outline: 2px solid var(--ly-primary)` (global dans globals.css)
- Semantic HTML : `<section>`, `<article>`, `<nav>`, `<aside>`, `<header>`, `<footer>`

## Anti-patterns INTERDITS

- `#FFFFFF` ou `#000000` en raw (toujours les tokens)
- Emojis dans les titres marketing
- `style={{...}}` inline sauf valeurs dynamiques
- Shadow Tailwind par defaut (utiliser box-shadow custom)
- Gradients arc-en-ciel
- Stock photos d'equipe souriante
- Lorem ipsum dans AUCUN fichier
- Composant > 50kb sans justification

## Regles typographiques francaises

- Apostrophes : `'` (typographique)
- Espaces insecables : `&nbsp;` avant `:`, `?`, `!`, `;`, `%`, `EUR`
- Nombres : `1 500 EUR` (espace insecable) pas `1500EUR`
- Format : `48 h` pas `48h`
