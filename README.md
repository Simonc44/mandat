# 🏛️ Mandat — Transparence citoyenne

> **Qui a voté quoi, et pourquoi.** Le moteur de recherche citoyen des votes de l'Assemblée nationale — 17e législature.

🔗 **Production** : https://mandat-fr.vercel.app

---

## ✅ Ce qui a été fait (session 28 juin 2026)

### 🔌 Sources de données
- **API CLAIR** (`clair-production.up.railway.app`) — source principale avec pagination automatique
- **API CIVIX** (`civix.fr`) — fallback secondaire
- **nosdeputes.fr** — fallback ultime (16e législature)
- Normalisation unifiée de toutes les réponses dans `src/lib/api.ts`
- Recalcul automatique des pour/contre/abstentions depuis les votes nominatifs si les totaux sont à zéro

### 🎨 Design Liquid Glass Apple-style
- Composant `.glass` et `.glass-strong` avec `backdrop-filter: blur()` partout
- Orbes de fond animés flottants (hero)
- Texte gradient animé (`gradient-shift`)
- Cartes avec hover 3D (`translateY + scale + box-shadow`)
- Barres de résultats avec animation `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Skeletons shimmer élégants
- Navigation progress bar en gradient
- Cascade d'animation (`animate-stagger`) sur toutes les grilles

### 🐛 Bugs corrigés
- **"Scrutin introuvable"** → `scrutinDetailQuery` retourne maintenant `{ meta, votes }` correctement séparé
- **Barres vides** → recalcul depuis votes nominatifs si totaux à 0
- **Photos absentes** → cascade 17e → 16e → initiales colorées avec `onError`
- **Bouton Stripe** → `<a href>` vers lien Stripe (remplacer `VOTRE_LIEN_STRIPE`)
- **Scrutin adopt/rejeté** → badge `✓ Adopté` / `✗ Rejeté` visible avant ouverture
- **SEO dynamique** → `head()` sur chaque route, JSON-LD `Person`, `Event`, `BreadcrumbList`
- **Sanitize XSS** → `sanitizeText()` sur tous les textes externes

### 🍪 Cookie Banner RGPD
- Composant `<CookieBanner>` avec `localStorage("mandat_cookie_consent")`
- Boutons "Accepter l'essentiel" / "Refuser tout"
- Liquid Glass, animation slide-up

### 📱 PWA
- `/public/manifest.json` — installable sur iOS/Android
- `/public/sw.js` — Service Worker cache-first / network-first hybride
- Enregistrement dans `__root.tsx`

### 🗺️ SEO & Sitemap
- `public/sitemap.xml` — statique avec pages principales
- `scripts/generate-sitemap.mjs` — génère le sitemap complet après fetch des données
- `public/robots.txt` — configuré

### 💶 Monétisation éthique
- Bouton "Soutenir le projet" → redirection Stripe (lien à configurer)
- Affiliation RecycLivre → livre réel : "L'Assemblée nationale" (Documentation française)
- Compteur de visites privacy-friendly (s'affiche après 5 000 visites via `/api/visits`)

---

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
bun install

# (Optionnel) Télécharger les données officielles de la 17e législature
bun run fetch-data        # → public/deputes-17.json + public/scrutins-17.json
bun run sitemap           # → public/sitemap.xml complet

# Démarrer en dev
bun dev

# Build production
bun build
```

---

## ⚙️ Configuration requise

### Stripe — Bouton de don
Dans `src/components/Header.tsx`, remplacez :
```ts
const STRIPE_LINK = "https://buy.stripe.com/VOTRE_LIEN_STRIPE";
```
Par votre vrai [Stripe Payment Link](https://dashboard.stripe.com/payment-links).

### Vercel Analytics (optionnel)
Ajoutez dans `.env.local` :
```
VITE_VERCEL_ANALYTICS=true
```

---

## 📁 Structure

```
src/
├── lib/
│   └── api.ts              # Client API (CLAIR + CIVIX + nosdeputes fallback)
├── routes/
│   ├── __root.tsx          # Layout global, SEO, cookie banner
│   ├── index.tsx           # Accueil hero + search + scrutins
│   ├── deputes.tsx         # Liste avec filtres
│   ├── depute.$slug.tsx    # Profil député
│   ├── scrutins.tsx        # Liste des scrutins
│   ├── scrutin.$numero.tsx # Détail scrutin + votes nominatifs
│   └── recherche.tsx       # Recherche globale
├── components/
│   ├── Header.tsx          # Header + Footer + Cookie Banner + Stripe
│   ├── DeputeCard.tsx      # Carte député + skeleton
│   └── GroupBadge.tsx      # Badge groupe coloré
└── styles.css              # Liquid Glass + animations Apple
scripts/
├── fetch-data-17.mjs       # Pipeline données AN 17e
└── generate-sitemap.mjs    # Générateur sitemap
public/
├── manifest.json           # PWA
├── sw.js                   # Service Worker
├── robots.txt
└── sitemap.xml
```

---

## 🔒 Sécurité
- `sanitizeText()` sur tous les textes issus d'API externe → protection XSS
- `sanitizeSearchInput()` → validation et troncature des inputs utilisateur
- Aucune balise `dangerouslySetInnerHTML` sur du contenu externe non sanitizé
- CSP recommandée côté Vercel (ajouter dans `vercel.json`)

---

## 📡 APIs utilisées

| Source | Usage | Fallback |
|--------|-------|---------|
| [CLAIR](https://clair-production.up.railway.app) | Source principale — député·es + scrutins + votes | → CIVIX |
| [CIVIX](https://www.civix.fr) | Fallback secondaire | → nosdeputes.fr |
| [nosdeputes.fr](https://www.nosdeputes.fr) | Fallback ultime (16e) | — |
| [AN Open Data](https://data.assemblee-nationale.fr) | Photos officielles | → initiales |

---

*Projet citoyen indépendant — Aucune affiliation politique — Licence MIT*
