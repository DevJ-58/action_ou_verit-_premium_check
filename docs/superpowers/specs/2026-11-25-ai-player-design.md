# Jouer avec l'IA — un ami fictif dans les salons

## Pourquoi
Pouvoir jouer à tout moment, même seul, et animer les petites tablées : un joueur fictif
toujours disponible, qui joue vraiment et parle dans le chat.

## Choix du porteur
- **Robot intégré (option B)** : aucune IA externe, gratuit, pas de clé, phrases écrites à l'avance.
- **Dans les salons seulement** pour commencer (le chat n'existe que là). Hors-ligne « Autour de la table » : plus tard, si demandé.

## Objectifs
- Accueil : une entrée **« Jouer avec l'IA »** → crée un salon avec l'IA déjà assise ; on peut lancer seul (toi + l'IA).
- Salon (hôte) : bouton **« Ajouter l'IA »** / « Retirer l'IA » dans la liste des joueurs. Une seule IA par salon.
- L'IA joue tout le tour : tourne la bouteille, choisit Vérité/Action, retourne une carte, répond (vérité) ou raconte qu'elle a relevé le défi (action), écrit des défis pour les autres (pioche dans les défis du jeu, catégories du salon), vote (presque toujours « Validé »), passe parfois son tour, réagit avec des emojis.
- Elle **parle dans le chat** : commente les moments clés (choix, défi reçu, verdict, fin de partie) et répond quand on la mentionne ou qu'on la salue. Pas plus d'un message toutes les ~8 s pour ne pas envahir.
- Délais « humains » (1,5 à 4 s) avant chaque action ; les minuteurs du salon restent respectés.
- Toujours identifiable : prénom **Axis**, son visage (6 expressions fournies par le porteur), badge **IA** partout (table, liste, chat, profil). Pas de demande d'ami possible.

## Non-objectifs
- Pas de vraie compréhension du langage ; pas de vidéo, micro ou photo pour l'IA.
- Pas de stats ni de classement de compte pour l'IA (elle apparaît au classement de la partie).

## Anti-objectifs
- L'IA ne doit jamais bloquer une partie (si un tour attend l'IA, il avance toujours).
- Elle ne doit pas se faire passer pour un humain.
- Pas de contenu au-delà des catégories et limites choisies par l'hôte.

## Approches (comment la faire jouer)
1. **Le téléphone de l'hôte la fait jouer (choisi)** : l'hôte décide déjà de tout le déroulé ; il envoie les actions de l'IA comme celles d'un joueur. Si l'hôte change, le nouvel hôte reprend l'IA. Aucune base de données à modifier pour le jeu.
2. Une fonction serveur qui joue l'IA : fonctionne même téléphone de l'hôte en veille, mais demande un serveur qui tourne en continu, du SQL et des coûts.
3. Chaque téléphone simule l'IA : risques de doublons et de désaccords.

## Décisions (choix de l'implémenteur, à corriger si besoin)
- L'IA est un membre du salon (`id` commençant par `bot-`) ; elle compte dans la capacité (6/12) et est toujours « en ligne ».
- Ses messages de chat passent par l'état du salon (écrit par l'hôte), puis s'affichent mêlés aux autres messages : pas de migration SQL.
- Les comptes de stats ignorent déjà les identifiants non-uuid : rien à changer côté serveur.
- Textes FR + EN ; environ 15 répliques par situation pour éviter les répétitions.
- Gratuit pour tous (pas de couronne).
- Expressions d'Axis (image du porteur découpée en 6) : 1 content (défaut), 2 parle, 3 calme, 4 taquin, 5 sceptique, 6 rit. Quand il écrit dans le chat, sa bouche s'anime ~2 s (2→3→1) ; son humeur suit le moment (taquin quand il pose un défi, sceptique quand il hésite à valider, rit quand quelqu'un passe son tour).
- Ses choix aléatoires dépendent du tour (graine = tour), pour qu'il ne change pas d'avis si l'écran de l'hôte se rafraîchit.
- Axis ne devient jamais hôte ; si l'hôte part et qu'il ne reste qu'Axis, le salon se ferme.
