# Étape 2 — Jeu sur plusieurs téléphones, comptes, profils et refonte vivante

Date : 2026-11-23 · Complète `2026-11-22-action-verite-v1-design.md` · Statut : décidé avec le porteur du projet (« vas-y »)

## 1. Pourquoi

Le porteur du projet a testé l'étape 1. Retours :

- **But premier du jeu** : chacun joue **depuis son propre téléphone**, y compris **à distance**.
- Chaque joueur a **un compte et son espace profil** (infos, **avatar 3D déjà fait**, ses défis).
- **Le choix du défi est trop rigide** : « quand c'est au tour de quelqu'un, chacun lui pose sa question en fonction du choix, que ce soit action ou vérité ».
- **Le design est trop « carré »** : pas assez d'animations, ni d'icônes, ni d'emojis.
- **L'adaptation aux écrans** doit être cadrée sérieusement.

## 2. Objectifs

1. **Comptes** : inscription et connexion (e-mail + mot de passe ; Google plus tard), session conservée sur le téléphone.
2. **Profil** : pseudo, avatar 3D choisi dans une galerie, bio courte, statistiques, limites, défis perso, thème et langue.
3. **Salons à distance** : un joueur crée un salon (code à 6 caractères, lien et QR code à partager) ; les autres le rejoignent depuis leur téléphone ; salle d'attente avec présence en direct ; l'hôte lance la partie ; tous les téléphones voient la même table, la même bouteille et la même carte au même moment.
4. **Nouveau tour de jeu « tout le monde pose »** (en salon) :
   1. la bouteille désigne un joueur, qui choisit Vérité ou Action ;
   2. **chaque autre joueur pose son défi** sur son téléphone : il l'écrit, prend un de ses défis, ou touche « Inspire-moi » (un défi du jeu qu'il peut modifier) ; durée limitée (60 s par défaut) ;
   3. le joueur désigné voit les propositions **faces cachées** et en **retourne une** (il choisit à l'aveugle, pour garder la surprise) ;
   4. la carte retournée s'affiche chez tout le monde avec le nom de son auteur ; le joueur la relève ; les autres peuvent réagir avec des emojis.
   Si personne n'a rien proposé quand le temps est écoulé, un défi du jeu est tiré automatiquement.
5. **Refonte vivante** : formes arrondies et organiques, cartes qui se retournent en 3D (CSS), transitions entre écrans, micro-animations, emojis 3D (catégories, réactions, récap, états vides), icônes partout où elles aident.
6. **Adaptation aux écrans** : de 320 px à l'ordinateur, sans défilement horizontal, avec des tailles fluides et une mise en page tablette et ordinateur, vérifiée par captures automatiques.

## 3. Non-objectifs de l'étape 2

- Chat texte et vocal, appels vidéo → étape 3.
- Paiement et Premium → plus tard.
- Vraie 3D WebGL de la table → plus tard.

## 4. Décisions (prises par le concepteur, à corriger si besoin)

- **Avatars** : galerie de 36 avatars issus de **Microsoft Fluent Emoji 3D** (licence MIT) : visages dans les 5 couleurs de peau, coiffures variées, plus des animaux et des personnages. Ce sont des images WebP d'environ 5 Ko, embarquées dans l'app (donc hors ligne). Les mêmes emojis 3D servent aux réactions et aux décorations.
- **Serveur : Supabase** (Auth, Postgres, Realtime). **L'hôte fait autorité** : le téléphone de l'hôte applique le moteur de jeu (le même que celui de l'étape 1) et diffuse l'état ; les autres envoient leurs intentions ; l'état est aussi enregistré en base pour qu'un joueur qui se reconnecte reprenne la partie. Si l'hôte quitte, l'hôte passe au joueur suivant. C'est plus simple que des fonctions serveur pour une V1 entre amis ; on pourra passer à un arbitre serveur plus tard sans toucher au moteur.
- **Le code est découplé du serveur** : une interface `RoomTransport` a deux implémentations :
  - un **transport local** (onglets d'un même navigateur), qui sert au développement et aux tests automatisés à 2 « téléphones » ;
  - le **transport Supabase**, branché dès que le projet Supabase existe.
  De même, une interface `AuthService` a une version locale et une version Supabase.
- **Mode un téléphone conservé** (« Jouer sur ce téléphone »), avec le tour actuel ; il profite de la refonte visuelle.
- **Écran d'accueil** : « Créer un salon » et « Rejoindre » en premier, « Jouer sur un seul téléphone » ensuite.

## 5. Ce que le porteur du projet devra faire

- Créer un **projet Supabase gratuit** et me donner l'adresse du projet. La clé publique (`anon`) peut être dans le code ; aucune clé secrète n'est jamais collée dans le chat.
- Autoriser l'adresse du projet dans le réseau de cet environnement de travail (une demande d'autorisation s'affichera).
