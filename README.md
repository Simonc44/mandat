<h1>
  <img src="https://mandat-fr.vercel.app/favicon.ico" alt="logo" width="30" />
  Mandat — Transparence citoyenne
</h1>

> **Qui a voté quoi, et pourquoi.** Le moteur de recherche citoyen des votes de l'Assemblée nationale — 17e législature.

**Production** : https://mandat-fr.vercel.app

---

## Installation & Développement

Le projet utilise **TanStack Start** (React + Vite + TanStack Router) et **pnpm**.

```bash
# 1. Cloner le projet
git clone https://github.com/Simonc44/mandat.git
cd mandat

# 2. Installer les dépendances
pnpm install

# 3. Lancer le serveur de développement
pnpm dev
```

### Commandes utiles

- `pnpm dev` : Lance le serveur de développement sur http://localhost:3000.
- `pnpm build` : Prépare l'application pour la production.
- `pnpm start` : Lance l'application buildée localement.
- `pnpm lint` : Vérifie la qualité du code (ESLint).
- `pnpm run fetch-data` : Télécharge les dernières données officielles de la 17e législature.

---

## Stack Technique

- **Framework** : [TanStack Start](https://tanstack.com/start) (React 18)
- **Routage & State** : [TanStack Router](https://tanstack.com/router)
- **Data Fetching** : [TanStack Query](https://tanstack.com/query)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com) (Thème Liquid Glass)
- **Base de données** : [LibSQL / Turso](https://turso.tech)
- **Utilitaires** : `html-to-image` (export de cartes), `lucide-react` (icones), `zod` (validation).

---

## Logique interne

### Système de Fallback des Photos
Pour garantir qu'aucun député ne se retrouve sans visage, Mandat utilise une cascade de 4 niveaux :
1. **Source 17e** : Photos officielles de la législature actuelle.
2. **Source 16e** : Fallback vers l'archive de la législature précédente (via nosdeputes.fr).
3. **Placeholder SVG** : Silhouette élégante si aucune photo n'est trouvée.
4. **Initiales** : Affichage des initiales du député sur un fond coloré en dernier recours.

### Carte Interactive (Hexagon Cartogram)
La visualisation par département utilise un cartogramme hexagonal compact. Chaque hexagone représente une circonscription et est coloré selon le groupe politique du député élu. Cette carte est générée dynamiquement et peut être exportée en PNG grâce à la bibliothèque `html-to-image`.

---

## Fonctionnalités clés

- **Recherche Instantanée** : Filtres croisés par groupe, département et nom.
- **Transparence des Votes** : Détail nominatif de chaque scrutin avec recalcul automatique des totaux.
- **PWA (Progressive Web App)** : Installable sur mobile pour un accès rapide.
- **Archive 16e** : Accès complet aux votes de la précédente législature (2022-2024).
- **SEO & Performance** : Meta-tags dynamiques et JSON-LD pour une visibilité maximale.

---

*Projet citoyen indépendant — Aucune affiliation politique — Licence MIT*
