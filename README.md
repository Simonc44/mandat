# <img src="https://mandat-fr.vercel.app/favicon.ico" alt="logo" width="30" align="center" /> Mandat — Transparence Citoyenne

> **Qui a voté quoi, et pourquoi.** Le moteur de recherche citoyen, neutre et open-data des votes de l'Assemblée nationale (17e législature).

[![Production](https://img.shields.io/badge/Production-Live-success?style=flat-square)](https://mandat-fr.is-a.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Built with TanStack](https://img.shields.io/badge/Built%20with-TanStack-ff4154?style=flat-square)](https://tanstack.com)

**Site en production :** [mandat-fr.is-a.dev](https://mandat-fr.is-a.dev) *(ou alternativement [mandat-fr.vercel.app](https://mandat-fr.vercel.app))*

---

![Mandat Preview](https://mandat-fr.vercel.app/og-image.png)

## Fonctionnalités clés

* **Recherche Instantanée** : Filtres croisés ultra-rapides par groupe politique, département, circonscription et nom de député·e.
* **Transparence des Votes** : Détail nominatif complet de chaque scrutin de l'hémicycle avec recalcul automatisé des totaux en temps réel.
* **Zéro Biais Politique** : Pas de score idéologique, pas de classement, pas d'interprétation. Uniquement les faits bruts et officiels.
* **Respect absolu de la vie privée** : Aucun cookie publicitaire, aucun tracker analytics intrusif, conformité totale RGPD.
* **Compatible PWA (Progressive Web App)** : Installable en un clic sur mobile et tablette pour un accès natif fluide.
* **Archive de la 16e législature** : Accès historique complet aux votes de la précédente mandature (2022-2024).

---

## Stack Technique

Mandat est propulsé par une stack moderne axée sur la performance, le typage strict et la rapidité d'exécution :

* **Framework & SSR** : [TanStack Start](https://tanstack.com/start) & React 18 (Full-stack framework avec rendu ultra-rapide)
* **Routing & State** : [TanStack Router](https://tanstack.com/router) (Routage typé à 100 % de bout en bout)
* **Data Fetching** : [TanStack Query](https://tanstack.com/query) (Gestion du cache et requêtes asynchrones)
* **Styling** : [Tailwind CSS v4](https://tailwindcss.com) (Design épuré sous le thème *Liquid Glass*)
* **Base de données** : [LibSQL / Turso](https://turso.tech) (Base SQLite distribuée en périphérie/edge pour une latence minimale)
* **Utilitaires** : `html-to-image` (exportation de infographies), `lucide-react` (iconographie), `zod` (validation stricte des schémas de données).

---

## Logique Interne & Architecture

### Synchronisation Automatique des Données (Cron Job)
Afin de coller au rythme des séances de l'Assemblée nationale, le projet intègre une architecture de mise à jour automatisée :
* **Déclencheur nocturne** : Une **GitHub Action** s'exécute chaque nuit à 3h00 UTC via un tâche planifiée (`cron`).
* **Pipeline Vercel** : L'action interroge un *Deploy Hook* Vercel sécurisé qui lance une nouvelle compilation en production.
* **Extraction Open-Data** : Pendant la phase de build, le script `/scripts/update-database-17.mjs` extrait les flux des API officielles (**Assemblée Nationale, CLAIR, CIVIX**), traite la donnée brute et met à jour la base Turso.
* **SEO Dynamique** : Le script `/scripts/generate-sitemap.mjs` reconstruit immédiatement le sitemap pour soumettre les milliers de nouvelles pages découvertes à Google Search Console.

### Système de Fallback Résilient des Photos
Pour éviter l'affichage de liens brisés sur les fiches des députés, Mandat utilise une cascade intelligente de secours en 4 niveaux :
1. **Source Officielle 17e** : Extraction directe de l'image liée à la législature actuelle.
2. **Fallback 16e** : En cas d'absence, récupération de l'archive de la législature précédente (via nosdeputes.fr).
3. **Silhouette SVG** : Si aucune photo historique n'est disponible, affichage d'un vecteur neutre élégant.
4. **Générateur d'Initiales** : Rendu des initiales du député sur un fond coloré dynamique unique en dernier recours.

### Cartogramme Hexagonal Interactif
La visualisation géographique par département utilise un modèle de grille hexagonale compacte. Chaque hexagone correspond à une circonscription réelle et adopte dynamiquement la couleur du groupe politique associé. L'utilisateur peut interagir avec la grille et exporter son rendu personnalisé au format PNG via l'API Canvas de `html-to-image`.

---

## Licence & Engagement

Ce projet est distribué sous la licence **MIT**.

* **Note importante :** Mandat est une initiative citoyenne, bénévole et indépendante. Le projet n'est affilié à aucun parti politique, aucun député, ni à l'administration officielle de l'Assemblée nationale française.*
