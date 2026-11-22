# Action ou Vérité

Le jeu Action ou Vérité, à jouer autour d'un seul téléphone posé au centre de la table, sur plusieurs téléphones dans la même pièce, ou à distance.

- Conception : [`docs/superpowers/specs/2026-11-22-action-verite-v1-design.md`](docs/superpowers/specs/2026-11-22-action-verite-v1-design.md)
- Plan en cours : [`docs/superpowers/plans/2026-11-22-v1-plan1-fondations-mode-un-telephone.md`](docs/superpowers/plans/2026-11-22-v1-plan1-fondations-mode-un-telephone.md)

## Démarrer

Prérequis : Node.js 22 ou plus.

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires et composants (Vitest)
npm run test:e2e   # parcours complets (Playwright)
npm run lint       # analyse statique (oxlint)
npm run typecheck  # vérification TypeScript
npm run build      # build de production
```

## Organisation du code

Le code est rangé par fonctionnalité : un composant par fichier, une logique métier séparée de l'affichage.

```
src/
  app/            routeur, mise en page générale
  design-system/  tokens et composants de base
  features/       un dossier par fonctionnalité (game, players, dares…)
  engine/         règles du jeu, TypeScript pur (aucun import React)
  content/        défis système par catégorie
  i18n/           traductions FR / EN
  lib/            utilitaires partagés
```
