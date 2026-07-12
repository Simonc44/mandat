---
version: alpha
name: Mandat
description: >-
  Design system de Mandat — plateforme civique de transparence des votes
  de l'Assemblée nationale française. Ambiance premium et sobre, combinant
  glassmorphisme violet-indigo avec une typographie display forte.
colors:
  primary: "oklch(0.50 0.20 285)"
  primary-light: "oklch(0.72 0.16 285)"
  primary-dark: "oklch(0.36 0.20 285)"
  secondary: "oklch(0.42 0.22 260)"
  surface: "oklch(0.12 0.03 285)"
  surface-glass: "oklch(0.18 0.04 285 / 60%)"
  border: "oklch(0.28 0.06 285 / 40%)"
  foreground: "oklch(0.94 0.01 285)"
  muted: "oklch(0.55 0.06 285)"
  pour: "oklch(0.65 0.20 145)"
  contre: "oklch(0.60 0.22 25)"
  abstention: "oklch(0.70 0.12 60)"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.18em"
    textTransform: "uppercase"
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "2.5rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  section: "96px"
components:
  card:
    background: "oklch(0.16 0.04 285 / 55%)"
    border: "oklch(0.30 0.08 285 / 35%)"
    borderRadius: "2rem"
    backdropFilter: "blur(20px) saturate(180%)"
    padding: "28px"
  button-primary:
    background: "linear-gradient(135deg, oklch(0.50 0.20 285), oklch(0.42 0.22 260))"
    color: "white"
    borderRadius: "9999px"
    padding: "12px 28px"
    fontWeight: 600
    fontSize: "0.875rem"
  badge:
    background: "oklch(0.50 0.20 285 / 12%)"
    color: "oklch(0.72 0.16 285)"
    borderRadius: "9999px"
    padding: "6px 14px"
    fontSize: "0.75rem"
    fontWeight: 500
  search-input:
    background: "oklch(0.16 0.04 285 / 70%)"
    border: "oklch(0.30 0.08 285 / 40%)"
    borderRadius: "9999px"
    backdropFilter: "blur(12px)"
---

## Overview

**Civic Premium** — transparence démocratique avec une finition design soignée.

Mandat combine la rigueur d'un outil de données publiques avec l'esthétique d'un produit tech premium. L'interface évoque un tableau de bord data haut-de-gamme : sombre, précis, et visuellement impactant. Le violet-indigo (oklch 285) est la couleur signature, ancrant chaque page dans une identité reconnaissable sans être agressive.

## Colors

La palette est construite dans l'espace colorimétrique OKLCH pour une cohérence perceptuelle parfaite.

- **Primary (oklch 0.50 0.20 285):** Violet-indigo profond. Utilisé pour les CTA, les accents interactifs, les icônes et les gradients. C'est la couleur d'identité de Mandat.
- **Surface/Glass:** Fond sombre translucide avec backdrop-filter blur. Donne l'effet « verre dépoli » caractéristique du glassmorphisme Mandat.
- **Pour (vert oklch 145):** Vote pour — vert émeraude clair, toujours utilisé avec transparence pour les backgrounds.
- **Contre (rouge oklch 25):** Vote contre — rouge corail, même règle de transparence.
- **Abstention (ambre oklch 60):** Toujours présenté comme couleur tertiaire discrète.

## Typography

Deux familles en dialogue : **Instrument Serif** pour les titres (display) — apporte chaleur et autorité éditoriale — et **Inter** pour le corps et les labels — lisibilité maximale à toutes les tailles.

Les titres hero atteignent `5.5rem` avec `letter-spacing: -0.02em` et `line-height: 1.02`. Les labels métadonnées utilisent systématiquement `uppercase + letter-spacing: 0.18em` pour créer de la hiérarchie sans gras.

Le mot-clé `.text-gradient` applique un dégradé oklch du primary vers le secondary en `italic`, utilisé sur les spans d'accroche dans les titres h1/h2.

## Layout

Grille fluide avec `container-app` = `max-width: 1280px, padding: 0 24px`. Breakpoints : `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`.

Le rythme vertical est basé sur des sections de `py-20` à `py-24` (80–96px). Les cartes utilisent `rounded-[2rem]` à `rounded-[2.5rem]` pour des coins très arrondis — signature visuelle forte.

## Glassmorphism

L'effet verre est le langage visuel central :

```css
.card-glass {
  background: oklch(0.16 0.04 285 / 55%);
  border: 1px solid oklch(0.30 0.08 285 / 35%);
  border-radius: 2rem;
  backdrop-filter: blur(20px) saturate(180%);
}

.glass {
  background: oklch(0.20 0.04 285 / 40%);
  border: 1px solid oklch(0.35 0.06 285 / 30%);
  backdrop-filter: blur(12px);
}
```

Toujours associé à un fond foncé ou au gradient hero pour que le flou soit visible.

## Hero Section

La hero est la section d'impact maximale. Elle occupe 80–100vh sur desktop.

**Arrière-plan :** ShaderGradient (`@shadergradient/react`) — gradient animé WebGL générant des formes fluides violet-indigo. Configuration recommandée :
- Type: `plane`
- Colors: `#3730a3` → `#7c3aed` → `#0f0e1a` (indigo–violet–deep-navy)
- Animation: `on`, speed `0.3`, orbit lent
- Grain: activé pour la texture
- Opacité du canvas : 70–80% sur fond noir pour préserver la lisibilité du texte

**Contenu :** Badge pill animé → H1 avec mot-clé `.text-gradient italic` → Sous-titre muted → SearchBar arrondie → Trust logos.

Le contenu texte est placé en `relative z-10` par-dessus le canvas shader.

## Components

### Cards

Toutes les cartes utilisent `.card-glass`. Les `border-radius` varient de `2rem` (cartes normales) à `2.5rem` (stat boxes). Jamais de shadow box visible — l'effet de profondeur vient du blur et de la translucidité.

### Buttons

- `.btn-primary` : gradient oklch, `border-radius: 9999px`, `font-weight: 600`. Hover : `scale(1.05)` + légère augmentation de luminosité.
- `.glass` : fond translucide, bordure fine, pas de gradient. Pour les actions secondaires.

### Badges / Pills

Toujours `border-radius: 9999px`. Fond : `oklch(primary / 12%)`. Texte : `oklch(primary-light)`. Format label : `uppercase + tracking-[0.18em] + text-xs`.

### Scrutin Result Bar

Barre horizontale `h-1.5` avec animation `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) au scroll. Trois segments colorés : pour (vert), contre (rouge), abstention (ambre).

## Motion

- **Entrée de page :** `.page-enter` — `opacity 0→1 + translateY(8px)→0`, durée `500ms ease-out`.
- **Fade up séquentiel :** `.animate-fade-up` avec `animationDelay` incrémental (80ms, 160ms, 240ms…) pour cascader les éléments hero.
- **Scroll reveal :** `ScrollScene` (GSAP ScrollTrigger) — rise (translateY) ou tilt (rotation légère 3D).
- **Countup :** GSAP tween sur les stats (durée 2s, `power2.out`).
- **Ne pas animer :** bordures, couleurs de texte statiques — garder la sobriété.

## Voice & Tone

Les micro-copies suivent le registre : **précis, direct, citoyen**. Pas de jargon technique visible côté UI. Les labels de section (`uppercase tracking`) servent de repères discrets. Les titres principaux sont assertifs et courts (max 6 mots en français).

## Accessibility

- Contraste minimum 4.5:1 pour le texte sur fond glassmorphique (vérifier avec fond le plus clair possible).
- `aria-hidden` sur tous les éléments décoratifs (orbs, vagues, icônes SVG inline).
- Focus visible sur les inputs avec `ring-2 ring-primary/40`.
- `prefers-reduced-motion` : désactiver les animations GSAP et le shader gradient (remplacer par un fond statique `oklch(0.12 0.03 285)`).
