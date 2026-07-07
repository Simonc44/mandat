# Guide de contribution — Mandat

Merci de l'intérêt que vous portez à Mandat ! Ce guide explique comment contribuer efficacement au projet.

---

## 📋 Avant de commencer

1. **Lisez le [README](README.md)** pour comprendre l'architecture du projet.
2. **Vérifiez les [issues ouvertes](https://github.com/Simonc44/mandat/issues)** — votre idée est peut-être déjà en cours de traitement.
3. **Ouvrez une issue** avant de commencer un travail conséquent, pour valider l'approche avec le mainteneur.

---

## 🚀 Setup local

```bash
# 1. Forker le repo puis cloner votre fork
git clone https://github.com/VOTRE_USERNAME/mandat.git
cd mandat

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# → Renseigner TURSO_DATABASE_URL et TURSO_AUTH_TOKEN

# 4. Lancer en développement
pnpm dev
```

---

## 🌿 Workflow Git

### Créer une branche

Toujours travailler sur une branche dédiée, jamais directement sur `main` :

```bash
git checkout -b feat/nom-de-la-feature
# ou
git checkout -b fix/description-du-bug
```

### Convention de nommage des commits

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/fr) :

```
feat: ajout de la page /groupes
fix: correction du calcul des abstentions
docs: mise à jour du README
chore: upgrade Tailwind v4.1
refactor: extraction du composant SearchBar
style: formatage Prettier
test: ajout tests unitaires normalize()
```

### Ouvrir une Pull Request

1. Poussez votre branche : `git push origin feat/nom-de-la-feature`
2. Ouvrez une PR sur GitHub vers `main`
3. Remplissez le template de PR
4. Attendez la revue — les PRs sont traitées sous **48h**

---

## ✅ Checklist avant de soumettre

- [ ] Le code passe le linter : `pnpm lint`
- [ ] Le typage TypeScript est correct : `pnpm typecheck`
- [ ] Le code est formaté : `pnpm format`
- [ ] Les fonctionnalités ajoutées sont documentées
- [ ] Les données affichées restent **neutres et factuelles** (pas d'interprétation politique)

---

## 🏷️ Types d'issues

| Label              | Description                             |
| ------------------ | --------------------------------------- |
| `good first issue` | Idéal pour commencer, scope limité      |
| `bug`              | Comportement incorrect à corriger       |
| `enhancement`      | Nouvelle fonctionnalité ou amélioration |
| `documentation`    | Amélioration de la doc                  |
| `data`             | Problème lié aux données AN/CIVIX/CLAIR |
| `performance`      | Optimisation vitesse ou taille          |

---

## 💬 Questions ?

Ouvrez une [Discussion GitHub](https://github.com/Simonc44/mandat/discussions) ou mentionnez `@Simonc44` dans une issue.

---

> Mandat est un projet citoyen indépendant. Toute contribution doit respecter la neutralité politique du projet.
