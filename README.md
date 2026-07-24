# <img src="https://mandat-fr.vercel.app/favicon.ico" alt="logo" width="28" align="center" /> Mandat — Transparence Citoyenne

> **Qui a voté quoi.** Le moteur de recherche citoyen, neutre et open-data des votes de l'Assemblée nationale (17e législature).

[![Production](https://img.shields.io/badge/Production-Live-success?style=flat-square)](https://mandat-fr.vercel.app)
[![License: MIT](https://img.shields.io/badge/Licence-Mandat-blue?style=flat-square)](LICENCE)
[![Built with TanStack](https://img.shields.io/badge/Built%20with-TanStack-ff4154?style=flat-square)](https://tanstack.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square)](https://www.typescriptlang.org)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

**Site en production :** [mandat-fr.vercel.app](https://mandat-fr.vercel.app)

---

![Mandat — aperçu de l'interface](https://mandat-fr.vercel.app/og-image.png)

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
|  **Recherche instantanée** | Filtres croisés par groupe politique, département, circonscription et nom |
|  **Détail des scrutins** | Résultat nominatif complet de chaque vote, recalculé en temps réel |
|  **Zéro biais** | Aucun score idéologique ni classement — uniquement les faits officiels |
|  **RGPD** | Aucun cookie publicitaire, aucun tracker intrusif |
|  **PWA** | Installable sur mobile/tablette comme une app native |
|  **Archive 16e législature** | Accès historique aux votes 2022–2024 |
|  **Cartogramme hexagonal** | Visualisation géographique interactive par département |

---

##  Installation & développement local

### Prérequis

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 9 (`npm install -g pnpm`)
- Un compte [Turso](https://turso.tech) (base de données SQLite edge)

### 1 — Cloner le repo

```bash
git clone https://github.com/Simonc44/mandat.git
cd mandat
```

### 2 — Installer les dépendances

```bash
pnpm install
```

### 3 — Configurer les variables d'environnement

Copier le fichier d'exemple et renseigner vos clés :

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | URL de votre base Turso (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Token d'authentification Turso |
| `CIVIX_API_KEY` | Clé API CIVIX (optionnel en dev) |

### 4 — Lancer en développement

```bash
pnpm dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### 5 — Build de production

```bash
pnpm build
pnpm start
```

---

##  Tests & qualité

```bash
# Linter ESLint
pnpm lint

# Vérification TypeScript
pnpm typecheck

# Formatage Prettier
pnpm format
```

---

##  Structure du projet

```
mandat/
├── src/
│   ├── routes/          # Pages (TanStack Router — file-based routing)
│   │   ├── index.tsx    # Page d'accueil
│   │   ├── deputes/     # Liste & fiches des député·es
│   │   ├── scrutins/    # Liste & détail des scrutins
│   │   └── groupes/     # Groupes politiques
│   ├── components/      # Composants UI réutilisables
│   ├── lib/             # Fonctions utilitaires & API
│   └── styles/          # CSS global (Tailwind v4)
├── scripts/
│   ├── update-database-17.mjs   # Synchronisation données AN → Turso
│   └── generate-sitemap.mjs     # Génération du sitemap
├── public/              # Assets statiques
└── .github/
    └── workflows/
        └── daily-update.yml     # Cron job nightly (3h UTC)
```

---

##  Architecture & logique interne

### Synchronisation automatique (Cron Job)

Chaque nuit à **3h00 UTC**, une GitHub Action :
1. Déclenche un Deploy Hook Vercel
2. Lance `scripts/update-database-17.mjs` pendant le build
3. Extrait les données des API officielles (**AN Open Data, CLAIR, CIVIX**)
4. Met à jour la base Turso
5. Reconstruit le sitemap avec `scripts/generate-sitemap.mjs`

### Système de fallback photos (4 niveaux)

```
1. Photo officielle 17e législature
   ↓ (si absente)
2. Archive 16e législature (nosdeputes.fr)
   ↓ (si absente)
3. Silhouette SVG neutre
   ↓ (dernier recours)
4. Initiales sur fond coloré dynamique
```

### Cartogramme hexagonal

Chaque hexagone = une circonscription réelle, colorée selon le groupe politique. Exportable en PNG via `html-to-image`.

---

##  Stack technique

| Couche | Technologie |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 |
| Routing | [TanStack Router](https://tanstack.com/router) (100 % typé) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Base de données | [Turso / LibSQL](https://turso.tech) (SQLite edge) |
| Déploiement | [Vercel](https://vercel.com) |
| Paiement | [Stripe](https://stripe.com) |
| CI/CD | GitHub Actions |

---

##  Contribuer

Les contributions sont les bienvenues ! Consultez le guide [CONTRIBUTING.md](CONTRIBUTING.md) pour démarrer.

---

##  Sécurité

Pour signaler une vulnérabilité, consultez [SECURITY.md](SECURITY.md). Ne créez pas d'issue publique pour les failles de sécurité.

---

##  Licence

Distribué sous la licence **Mandat** — voir [LICENCE](LICENCE).

> Mandat est une initiative citoyenne, bénévole et indépendante. Le projet n'est affilié à aucun parti politique, aucun député, ni à l'administration officielle de l'Assemblée nationale.
