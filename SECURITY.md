# Politique de sécurité — Mandat

## 🔒 Signalement d'une vulnérabilité

**Ne créez pas d'issue GitHub publique pour signaler une faille de sécurité.**

Si vous découvrez une vulnérabilité dans Mandat, merci de la signaler de manière responsable :

### Comment signaler

1. **Email** : Envoyez un message détaillé à l'adresse disponible sur le profil GitHub de [@Simonc44](https://github.com/Simonc44)
2. **GitHub Security Advisories** : Utilisez l'onglet [Security → Report a vulnerability](https://github.com/Simonc44/mandat/security/advisories/new) de ce repo

### Informations à inclure

- Description précise de la vulnérabilité
- Étapes pour reproduire le problème
- Impact potentiel estimé
- Version ou commit concerné
- Si possible, une suggestion de correctif

---

## ⏱️ Délais de réponse

| Étape | Délai |
|---|---|
| Accusé de réception | 48 heures |
| Évaluation initiale | 5 jours ouvrés |
| Correctif ou plan d'action | 30 jours |

---

## ✅ Versions supportées

Seule la version déployée en production sur [mandat-fr.is-a.dev](https://mandat-fr.is-a.dev) (branche `main`) reçoit des correctifs de sécurité.

---

## 🛡️ Mesures de sécurité en place

- **Dependabot** activé pour les mises à jour automatiques des dépendances
- **CodeQL** pour l'analyse statique du code (JavaScript/TypeScript)
- **Variables d'environnement** pour tous les secrets (jamais commitées)
- **TypeScript strict** pour réduire les erreurs de type en production
- **Validation Zod** sur tous les schémas de données entrants

---

## 🙏 Divulgation responsable

Nous nous engageons à :
- Traiter les signalements avec sérieux et confidentialité
- Informer le rapporteur dès que le correctif est déployé
- Créditer publiquement les contributeurs sécurité (sauf demande contraire)

Merci de contribuer à la sécurité de Mandat et à la confiance des citoyens dans cet outil.
