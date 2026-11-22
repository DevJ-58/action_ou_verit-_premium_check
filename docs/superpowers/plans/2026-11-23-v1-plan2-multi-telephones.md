# Plan 2 — Multi-téléphones, comptes, profils et refonte vivante

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chacun joue depuis son téléphone, à distance : comptes, profil avec avatar 3D, salons synchronisés, tour « tout le monde pose », dans une interface vivante et parfaitement adaptée à tous les écrans.

**Architecture:** Le moteur pur `src/engine` gagne le tour « tout le monde pose ». Le réseau passe par deux interfaces, `AuthService` et `RoomTransport`, chacune avec une implémentation locale (onglets d'un même navigateur, pour le développement et les tests) et une implémentation Supabase. En salon, l'hôte fait autorité : il applique `reduce` et diffuse l'état ; les autres envoient des intentions.

**Tech Stack:** celui du Plan 1, plus `@supabase/supabase-js`, `qrcode` (QR de salon), les WebP de `@lobehub/fluent-emoji-3d` (MIT) copiés dans `src/assets/fluent/`.

**Spec:** `docs/superpowers/specs/2026-11-23-v1-etape2-multi-telephones-design.md` (complète `2026-11-22-action-verite-v1-design.md`)

## Global Constraints

- Toutes les contraintes du Plan 1 restent valables : fichiers courts, un composant par fichier, moteur pur, AA, cibles ≥ 44 px, `prefers-reduced-motion`, budget JS initial ≤ 200 Ko gzip, aucun dégradé.
- Les avatars et emojis viennent de Fluent Emoji 3D (MIT) ; la licence est citée dans le README.
- Aucune clé secrète dans le dépôt ; seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (publiques) sont lues par le client.
- Sans configuration Supabase, l'app utilise les implémentations locales (salons entre onglets) ; avec la configuration, elle utilise Supabase.
- Adaptation aux écrans : aucun défilement horizontal de 320 px à 1440 px ; mise en page deux colonnes à partir de 900 px pour les écrans de jeu et de profil.

## Review Focus

1. **Un joueur se déconnecte ou ferme l'app en plein tour** (y compris l'hôte) : la partie continue ; l'hôte passe au joueur suivant ; un joueur qui revient récupère l'état.
2. **Le temps de proposition expire sans aucune proposition, ou le joueur désigné ne choisit pas de carte** : un défi du jeu est tiré, ou la carte est choisie au hasard au bout du temps ; on ne reste jamais bloqué.
3. **Deux joueurs agissent en même temps** (double tap, intentions qui se croisent) : l'hôte applique une seule intention valide et ignore les doublons ; aucun téléphone ne diverge.
4. **Rejoindre un salon** avec un code faux, expiré, plein (12 joueurs) ou déjà en partie : message clair, jamais d'écran vide.
5. **Petits écrans (320 × 568) et grands écrans** : table, cartes, galerie d'avatars et compositeur de défi restent lisibles et utilisables.

---

### Task 1: Galerie d'avatars 3D et emojis
- Copier ~36 avatars et ~40 emojis WebP choisis dans `src/assets/fluent/`.
- `src/content/avatars.ts` : `AVATARS: readonly { id: string; label: string; src: string }[]` (36 entrées, ids uniques).
- `src/design-system/Emoji.tsx` : `Emoji({ name: EmojiName, size?, label? })` (décoratif par défaut, `aria-hidden`).
- `Avatar` accepte `avatarId?` et affiche l'image 3D, sinon l'initiale.
- Tests : 36 avatars aux ids uniques dont chaque `src` est résolu ; `Emoji` est décoratif par défaut et a un nom accessible quand `label` est donné ; `Avatar` avec `avatarId` affiche une image au texte alternatif égal au nom.

### Task 2: Refonte vivante et adaptation aux écrans
- Tokens : rayons plus généreux (`--radius-xl: 28px`, `--radius-2xl: 36px`), ressorts Motion partagés (`src/design-system/motion.ts`).
- `FlipCard` (retournement 3D en CSS, face cachée en motif wax), `PageTransition` (fondu et glissement entre routes), `Pressable` (effet de pression par ressort sur les boutons).
- Emojis 3D sur l'accueil, les catégories, les états vides, le récap et le profil ; icônes sur toutes les actions principales.
- Mise en page fluide : conteneur `max-w` adaptatif, deux colonnes à partir de 900 px (table et panneau côte à côte), typographie en `clamp()`.
- Tests : `FlipCard` expose sa face visible aux lecteurs d'écran et se retourne au clic ; e2e « aucun défilement horizontal » sur toutes les routes principales en 320, 390, 768 et 1280 px ; captures dans le rapport de PR.

### Task 3: Moteur — tour « tout le monde pose »
- `GameSettings.flow: 'asker' | 'everyone'` (un téléphone → `asker` ; salon → `everyone`) et `proposeSeconds: 30 | 60 | 90` (60 par défaut).
- Nouvelles phases `proposing` (après `CHOOSE_KIND` en mode `everyone`) et `picking`.
- Nouvelles actions :
  - `{ type: 'PROPOSE'; playerId: string; dare: Dare }` : une seule proposition par joueur, jamais du joueur désigné ; elle respecte ses limites ; elle peut être remplacée tant que la phase est ouverte ;
  - `{ type: 'CLOSE_PROPOSALS' }` : passe en `picking` ; sans aucune proposition, tire un défi du jeu et passe en `challenge` ;
  - `{ type: 'PICK_PROPOSAL'; index: number }` : passe en `challenge` avec ce défi ;
  - `{ type: 'TIMEOUT_PICK' }` : choisit une proposition au hasard.
- `Turn.proposals: { playerId: string; dare: Dare }[]` (mélangées à la fermeture, l'auteur est conservé).
- Tests :
  - `proposing` est atteint seulement en mode `everyone` ;
  - le joueur désigné ne peut pas proposer ;
  - une deuxième proposition du même joueur remplace la première ;
  - une proposition hors limites est refusée (`dareNotAllowed`) ;
  - `CLOSE_PROPOSALS` sans proposition passe en `challenge` avec un défi du jeu ;
  - `PICK_PROPOSAL` hors bornes est refusé ;
  - `TIMEOUT_PICK` choisit une proposition existante ;
  - la règle « aucune mutation » tient toujours.

### Task 4: Comptes
- `src/features/account/authService.ts` : interface `AuthService { current(): Account | null; signUp(email, password, pseudo): Promise<Account>; signIn(email, password): Promise<Account>; signOut(): Promise<void>; onChange(cb): () => void }`.
- `localAuth.ts` (comptes enregistrés sur l'appareil, développement et tests) et `supabaseAuth.ts`.
- `accountStore` : `{ account: Account | null; profile: Profile | null }`.
- Écrans « Créer un compte » et « Se connecter », avec la validation du pseudo existante.
- Tests :
  - inscription puis connexion ;
  - mauvais mot de passe → message ;
  - e-mail déjà pris → message ;
  - mot de passe d'au moins 8 caractères ;
  - les routes salon exigent un compte (redirection vers la connexion).

### Task 5: Espace profil
- `Profile = { id; pseudo; avatarId; bio; limits; customDares; stats }`, enregistré via `AuthService` (local ou table `profiles`).
- Écran Profil réorganisé :
  - un en-tête avec l'avatar 3D en grand et le pseudo ;
  - des sections : galerie d'avatars, bio (160 caractères maximum), mes limites, mes défis, apparence (thème, langue), sons et vibrations, déconnexion.
- Tests : choisir un avatar le met à jour partout ; bio de plus de 160 caractères refusée ; les défis perso du profil sont ceux proposés en salon.

### Task 6: Transport de salon et état partagé
- `RoomTransport` :
  - `create(host: Member): Promise<RoomInfo>` ;
  - `join(code, member): Promise<RoomInfo>`, qui lève `roomNotFound`, `roomFull` ou `roomStarted` ;
  - `leave()` ;
  - `publishState(state: RoomState)` ;
  - `sendIntent(intent: Intent)` ;
  - `onState(cb)`, `onIntent(cb)` ;
  - `presence(cb)`.
- `localTransport.ts` (BroadcastChannel + localStorage pour la reprise).
- `roomStore` : l'hôte reçoit les intentions et applique `reduce` ; il ignore les intentions invalides et celles déjà appliquées (`intentId`) ; il publie l'état versionné (`version`), et les autres ignorent un état plus ancien ; l'hôte qui part est remplacé par le premier joueur présent.
- Tests (deux stores reliés par le transport local dans le même processus) :
  - les deux voient le même état après chaque action ;
  - les intentions en double sont ignorées ;
  - un état ancien est ignoré ;
  - le départ de l'hôte promeut le suivant ;
  - un salon plein, inconnu ou déjà lancé est refusé.

### Task 7: Créer et rejoindre un salon
- Accueil : « Créer un salon », « Rejoindre » et « Jouer sur ce téléphone ».
- Création : code à 6 caractères sans caractères ambigus, lien `…/salon/CODE`, QR code, bouton « Partager » (`navigator.share`, sinon copie).
- Rejoindre : saisie du code ou ouverture du lien.
- Salle d'attente : avatars des présents, leur état (en ligne ou absent), réglages modifiables par l'hôte seulement, « Lancer » à partir de 2 joueurs.
- Tests :
  - un code invalide affiche un message ;
  - le lien `/salon/CODE` pré-remplit le salon ;
  - seul l'hôte voit les réglages et le bouton Lancer ;
  - Lancer est désactivé à moins de 2 joueurs.

### Task 8: Partie en salon
- Écran de jeu du salon, avec une vue différente selon le rôle de chaque téléphone :
  - **joueur désigné** : choisit Vérité ou Action, attend pendant que les autres posent, puis retourne une carte parmi les cartes faces cachées ;
  - **autres joueurs** : composent leur défi (écrire, « Mes défis », « Inspire-moi »), voient « Proposé ✓ », puis la carte retournée ;
  - **tout le monde** voit la table, la bouteille, le minuteur, les réactions emoji flottantes et le récap.
- L'hôte déclenche `CLOSE_PROPOSALS` à la fin du temps ou dès que tout le monde a proposé, et `TIMEOUT_PICK` après 30 s.
- Tests (deux stores reliés) :
  - un tour complet à 3 joueurs : deux proposent, le désigné retourne une carte, tous voient la même carte et son auteur ;
  - une réaction envoyée apparaît chez l'autre ;
  - le récap s'affiche chez tous.

### Task 9: Supabase
- `supabase/migrations/0001_init.sql` :
  - tables `profiles` (id = auth.uid, pseudo, avatar_id, bio, limits jsonb, custom_dares jsonb, stats jsonb) et `rooms` (code, host_id, status, state jsonb, version, updated_at) ;
  - règles RLS : chacun lit et écrit son profil ; les membres lisent le salon ; seul l'hôte écrit l'état.
- `supabaseAuth.ts`, `supabaseTransport.ts` (Realtime broadcast pour les intentions et l'état, presence pour la présence, ligne `rooms` pour la reprise et le contrôle d'accès).
- Sélection automatique selon `VITE_SUPABASE_URL`.
- Bloqué tant que le projet Supabase n'existe pas : le code est écrit et typé, les tests portent sur la logique (adaptateurs avec un client simulé).
- Le test réel à deux téléphones se fait dès que le porteur du projet a fourni l'URL.

### Task 10: Parcours complets et livraison
- e2e : deux « téléphones » (deux pages dans le même navigateur avec le transport local) : comptes, salon, tour complet « tout le monde pose », récap.
- e2e d'adaptation aux écrans (Task 2) ajouté à la CI.
- Budget JS initial vérifié ; captures 320, 390, 768 et 1280 jointes ; déploiement sur `main` après validation du porteur du projet.
