# Guide pas à pas et page « Comment jouer »

## Pourquoi
Les nouveaux joueurs et ceux qui maîtrisent mal l'app se perdent dans les écrans et les règles.
Le porteur veut « rien de plus simple » : un guide qui sélectionne un élément et dit à quoi il sert,
et des règles de jeu claires, étape par étape.

## Objectifs
- Guide en surbrillance : l'écran s'assombrit sauf l'élément expliqué, une bulle explique, Suivant / Passer, compteur « n / N ».
- Trois parcours, lancés automatiquement la première fois sur l'écran :
  - Accueil : Autour de la table, Créer un salon, Rejoindre, onglets (Joueurs, Mes défis, Profil), Réglages.
  - Salon (avant la partie) : code à partager, catégories, nombre de tours, Lancer la partie.
  - Partie en salon : barre d'étapes, carte, verdict (Validé / Pas convaincu), « C'est fait », barre du bas (Discussion, Micro, Réagir, Joueurs).
- Bouton « ? » sur ces écrans pour relancer le guide ; « Revoir le guide » dans les Réglages.
- Page `/regles` « Comment jouer » : but, autour de la table, à distance, points et passes, Premium.
  Accessible depuis l'accueil, le « ? » et les Réglages.

## Non-objectifs
- Pas de partie d'entraînement, pas de vidéo, pas de bibliothèque de tutoriel externe.

## Anti-objectifs
- Le guide ne doit jamais bloquer le jeu (toujours « Passer », Échap ferme, il ne revient pas tout seul une fois vu).
- Ne pas dépasser le budget de 200 Ko de JS initial.

## Approches
1. **Guide maison (choisi)** : cibles marquées `data-tour`, superposition avec découpe, bulle positionnée ; chargé à la demande. Léger, au style de l'app.
2. Bibliothèque (driver.js, shepherd) : rapide mais ajoute du poids et un style à réécrire.
3. Page de règles seule : ne répond pas au « sélectionne un élément et dit à quoi il sert ».

## Décisions (choix de l'implémenteur)
- Cible absente de l'écran (ex. micro masqué) : l'étape est sautée.
- « Vu » enregistré par parcours dans les réglages locaux (`settingsStore`), donc par appareil.
- Le parcours de partie démarre seulement quand la carte est visible ; sinon les étapes absentes sont sautées.
- FR + EN, accessible (role="dialog", focus sur la bulle, Échap).
