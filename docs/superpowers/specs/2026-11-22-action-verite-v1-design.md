# Action ou Vérité — Refonte V1 : document de conception

Date : 2026-11-22 · Statut : en attente de validation

## 1. Intention

L'application actuelle (`DevJ-58/action-verite`, un seul `App.js` de 2 444 lignes) est une maquette : comptes, amis, joueurs en ligne, statistiques et paiement sont simulés, 7 catégories sur 11 sont vides, la bouteille ne s'arrête pas sur le joueur tiré, la partie ne se termine jamais, les défis personnalisés ne sont jamais utilisés en jeu.

L'objectif est de **tout reconstruire selon les bonnes pratiques, de la logique au design**, pour obtenir une application **fluide, intuitive et très belle**, capable d'**attirer de vrais joueurs**. Le mode payant viendra après la V1, mais la V1 doit être prête à l'accueillir.

## 2. Objectifs V1

1. **Trois façons de jouer**
   - **Un seul téléphone** (« pass-and-play ») : le téléphone passe de main en main, fonctionne hors ligne.
   - **Plusieurs téléphones, même lieu** : un hôte crée un salon, les autres rejoignent par code à 6 caractères, lien ou QR code ; la bouteille tourne en même temps sur tous les écrans.
   - **À distance** : même salon, plus chat et appel vidéo.
2. **Chat de salon** (uniquement pendant une partie) : messages texte, messages vocaux courts (≤ 30 s), réactions emoji en direct.
3. **Appels vidéo à durée limitée** pendant les défis à distance, pour voir l'action se faire.
4. **Défis** : catégories système avec du vrai contenu + défis personnalisés ; l'hôte choisit à la création de la partie « système », « perso » ou « les deux », et les défis perso sont réellement tirés en jeu.
5. **Une partie qui a un début et une fin** : nombre de tours, points, récap final.
6. **Les « p'tits trucs » d'une app de jeu complète** (voir §6).
7. **Le système Premium est prêt** (droits, écrans), sans paiement en V1.

## 3. Non-objectifs V1

- Paiement réel (Mobile Money / carte) → V2. Aucun formulaire de carte bancaire en V1.
- Messagerie entre amis en dehors des parties.
- Système d'amis complet (demandes, acceptation). En V1 : liste des « joueurs récents » pour réinviter facilement.
- Applications natives sur les stores (la V1 est une PWA installable ; une coque native viendra plus tard si besoin).

## 4. Anti-objectifs (ce qui serait un échec même si « ça marche »)

- Afficher des données fausses comme si elles étaient vraies (faux joueurs en ligne, fausses stats).
- Une app lente ou lourde sur un Android d'entrée de gamme en 3G/4G.
- Des écrans désynchronisés entre téléphones (la bouteille qui ne montre pas le même joueur).
- Un design « template » générique, sans identité.
- Du contenu osé accessible sans garde-fou (âge, limites des joueurs).

## 5. Contraintes

- **Public** : francophone d'abord (prix prévus en F CFA, numéros +225), téléphones Android modestes, data mobile coûteuse. Budget : JS initial ≤ 200 Ko gzip, premier affichage < 2,5 s en 4G moyenne.
- **Mobile d'abord**, utilisable sur ordinateur.
- **Langues** : interface FR + EN ; contenu des défis en FR en V1 (EN plus tard).
- **18 ans et +** : certaines catégories sont explicitement adultes.
- **Coûts** : rester dans les offres gratuites (Supabase, LiveKit Cloud) au lancement.
- **Dépôt** : le code vit dans `DevJ-58/action_ou_verit-_premium_check` (le lien cassé `action-verite` est remplacé par la nouvelle app à la racine).

## 6. Fonctionnalités détaillées

### 6.1 Accueil et identité
- Écran d'accueil animé + **porte d'âge 18+** (mémorisée sur l'appareil).
- **Sans compte pour jouer** : on choisit un pseudo et un avatar, une session anonyme est créée automatiquement (nécessaire pour les salons en ligne).
- **Compte optionnel** (lien magique par e-mail ou Google) pour conserver profil, défis perso, stats et joueurs récents entre appareils. Un compte anonyme peut être « converti » sans rien perdre.

### 6.2 Création de partie
- Choix du mode : un téléphone / salon (plusieurs téléphones, sur place ou à distance).
- Joueurs : en mode un téléphone, on ajoute des noms + avatars ; en salon, ce sont les participants connectés.
- Catégories (avec niveau d'intensité visible 1 à 4), source des défis (système / perso / les deux), nombre de tours, minuteur par défi (désactivé / 30 / 60 / 90 s), durée des appels vidéo (60 / 90 / 120 s).
- **Limites par joueur** : chaque joueur peut exclure des catégories ou des intensités ; un défi n'est jamais tiré pour un joueur au-delà de ses limites.

### 6.3 Déroulé d'une partie (machine à états)
`lobby → spinning → choosing (Action / Vérité) → challenge → resolved → (tour suivant | finished)`
- **Bouteille** : la cible est tirée d'abord, l'animation s'arrête exactement sur le joueur tiré (tours entiers + angle de la cible). Alternative « tirage aléatoire » pour les grands groupes.
- **Défi** : tiré selon catégories, type, mode (sur place / à distance), limites du joueur, sans répétition dans la partie.
- **Résolution** : « Fait » (+points), « Passer » (gage ou −points, nombre de passes limité), en multi-téléphones les autres joueurs peuvent valider d'un tap.
- **Fin** : après le dernier tour → récap (classement, titres : « Le plus courageux », « Le roi de la vérité »…), bouton « Rejouer ».

### 6.4 Salons (multi-téléphones et à distance)
- Création par l'hôte → code 6 caractères (sans caractères ambigus), lien de partage, QR code.
- Présence en direct (qui est connecté), reconnexion automatique, l'hôte peut exclure un joueur ; si l'hôte part, l'hôte passe au joueur suivant.
- Jusqu'à 10 joueurs par salon (limite gratuite proposée : 4, voir §8).

### 6.5 Chat de salon
- Panneau coulissant pendant la partie : texte, vocaux ≤ 30 s, réactions emoji flottantes.
- **Signaler / bloquer / exclure** un joueur. Messages et vocaux supprimés à la fermeture du salon (rétention max 24 h).

### 6.6 Appels vidéo de défi
- Lorsqu'un défi « à distance » est lancé, un appel s'ouvre : le joueur actif filme, les autres regardent (et peuvent activer leur caméra).
- **Durée déterminée** par l'hôte, compte à rebours visible, coupure automatique côté serveur (jeton d'accès à durée limitée).
- Qualité adaptative pour économiser la data ; possibilité de refuser la caméra (le défi passe alors en mode « sur parole »).

### 6.7 Défis personnalisés
- Créer / modifier / supprimer : type (Action / Vérité), catégorie, intensité, mode (sur place / à distance / les deux), texte.
- Dans un salon, les défis perso de chaque joueur peuvent être mis en commun (choix de l'hôte).

### 6.8 Profil et extras
- Profil : pseudo, avatar (emoji ou photo), stats réelles (parties, défis faits, passes), badges débloqués.
- Sons et vibrations (désactivables), thèmes de bouteille, installation PWA, FR/EN.
- Écran « Premium » présentant l'offre (sans paiement en V1).

## 7. Approches envisagées

| Approche | Résumé | Compromis |
|---|---|---|
| A. Tout sur le téléphone | Refonte front seule, données locales | Rapide, mais pas de jeu à distance → **exclue** (le jeu à distance est requis en V1) |
| B. Produit complet d'un coup | Front + serveur + vidéo + paiement | Le paiement exige des comptes commerciaux et des validations → retarde tout |
| **C. Retenue** | Front neuf + serveur pour les salons, le chat et la vidéo ; Premium préparé, paiement en V2 | Le meilleur équilibre ; choisie par le porteur du projet |

## 8. Gratuit / Premium (proposition, à affiner avec le porteur du projet)

| Gratuit | Premium |
|---|---|
| Mode un téléphone illimité | Toutes les catégories (y compris osées) |
| Catégories « soft » : Juste pour rire, Romantique, Limite franchise | Défis perso illimités + packs de défis |
| Salons jusqu'à 4 joueurs | Salons jusqu'à 10 joueurs |
| Chat texte + réactions | Messages vocaux |
| 5 défis perso | Appels vidéo de défi |
| | Thèmes / bouteilles exclusifs, stats détaillées |

En V1, tout passe par une **vérification de droits** (`canUse(feature)`) centralisée ; une configuration de lancement débloque tout (période de lancement). Le paiement V2 n'aura qu'à alimenter ces droits.

## 9. Architecture (décisions techniques)

- **Front** : Vite + React 19 + TypeScript strict, Tailwind CSS v4 (tokens de design), Motion pour les animations, React Router, Zustand (état local), TanStack Query (données serveur), PWA (vite-plugin-pwa), i18n typé FR/EN.
- **Moteur de jeu** : module TypeScript **pur** (réducteur + machine à états + tirage des défis), sans dépendance à React, entièrement testé. Il est utilisé tel quel en mode un téléphone, et **le même code** tourne côté serveur pour les salons.
- **Serveur : Supabase**
  - Auth : sessions anonymes + lien magique / Google.
  - Postgres + règles d'accès (RLS) : `profiles`, `rooms`, `room_players`, `dares` (système), `custom_dares`, `room_messages`, `reports`, `game_stats`.
  - **Salons autoritaires côté serveur** : chaque action de jeu passe par une Edge Function `game-action` qui charge l'état, applique le moteur partagé (tirages aléatoires faits côté serveur), enregistre le nouvel état ; tous les téléphones le reçoivent via Realtime. Pas de triche, pas de désynchronisation.
  - Realtime : présence, chat, réactions (broadcast).
  - Storage : vocaux (supprimés à la fermeture du salon).
- **Vidéo : LiveKit Cloud** (offre gratuite au départ) ; une Edge Function délivre un jeton dont la durée de vie = durée de l'appel.
- **Contenu** : défis système stockés en base (catégorie, type, intensité 1–4, mode, langue) et embarqués en JSON pour le mode hors ligne. Objectif V1 : **≥ 20 vérités + ≥ 20 actions par catégorie** en français, rédigées et relues.
- **Qualité** : ESLint + Prettier, Vitest + Testing Library (moteur et composants), Playwright (parcours clés, dont une partie à 2 téléphones simulés), CI GitHub Actions.
- **Hébergement** : front sur GitHub Pages via GitHub Actions ; Supabase et LiveKit en services hébergés.

### 9.1 Catégories retenues (validées par le porteur du projet)

| Catégorie | Intensité | Gratuit |
|---|---|---|
| Juste pour rire | 1 | oui |
| Limite franchise | 1–2 | oui |
| Romantique | 2 | oui |
| Rapproche-toi | 2 | non |
| Osé (absorbe « Vague de chaleur ») | 3 | non |
| Après la tombée de la nuit (absorbe « Nuit blanche ») | 3 | non |
| Très intime (absorbe « Plaisir coquin ») | 4 | non |
| Pas de retour en arrière | 4 | non |

≥ 20 vérités + ≥ 20 actions par catégorie (≈ 320 textes FR), rédigés par le constructeur, relus par le porteur du projet avant mise en ligne.

### 9.2 Organisation du code (exigence : bonnes pratiques, jamais de fichier fourre-tout)

Organisation par fonctionnalité ; un composant par fichier ; fichiers courts (≈ 200 lignes max, au-delà on découpe) ; logique métier hors des composants ; aucun composant défini à l'intérieur d'un autre.

```
src/
  app/            routeur, providers, layout racine
  design-system/  tokens, primitives (Button, Sheet, Avatar, Card…)
  features/
    onboarding/   porte 18+, pseudo/avatar
    game-setup/   création de partie, catégories, réglages, limites
    game/         écran de jeu, bouteille, carte défi, récap
    rooms/        salon, code/QR, présence
    chat/         panneau, messages, vocaux, réactions
    video/        appel de défi
    dares/        défis perso (CRUD)
    profile/      profil, stats, badges
    premium/      droits (canUse), écran Premium
  engine/         moteur de jeu pur TS (partagé avec le serveur)
  content/        défis système (JSON par catégorie)
  i18n/           dictionnaires FR/EN typés
  lib/            client Supabase, stockage, utilitaires
supabase/
  migrations/     schéma SQL + RLS
  functions/      game-action, video-token, cleanup
tests/e2e/        parcours Playwright
```

## 10. Design

- Direction à finaliser avec les skills design (ui-ux-pro-max, awwwards) et une maquette validée par le porteur du projet avant d'écrire les écrans.
- Piste proposée : **« Nuit de fête »** : fond encre profond, un accent chaud pour Action et un accent froid pour Vérité, typographie d'affichage expressive, bouteille travaillée au centre, micro-animations et retours haptiques, aucune donnée fictive affichée.
- Accessibilité : contrastes AA, zones tactiles ≥ 44 px, respect de « réduire les animations ».

## 11. Étapes de livraison V1

1. Fondations : projet, design system, i18n, PWA, porte 18+.
2. Moteur de jeu + mode un téléphone + contenu des défis + défis perso (local).
3. Supabase : auth anonyme/compte, profils, défis perso synchronisés.
4. Salons multi-téléphones (création, code/QR, présence, jeu synchronisé).
5. Chat de salon (texte, vocaux, réactions, signalement).
6. Appels vidéo à durée limitée.
7. Récap de fin, stats, badges, écran Premium, finitions et performance.

Chaque étape est livrable et testable seule.

## 12. Règles précisées (choix du concepteur, à vérifier par le porteur du projet)

- **Toute l'application est 18+** : une seule porte d'âge déclarative à l'entrée ; pas de version mineurs.
- **Mode par salon** : l'hôte choisit « sur place » ou « à distance » pour tout le salon. Le chat existe dans les deux ; la vidéo uniquement « à distance ». Le filtre des défis utilise ce mode.
- **Un tour = une manche complète** : chaque joueur joue une fois par tour ; la bouteille ne peut pas désigner un joueur ayant déjà joué dans le tour en cours (égalité des chances pour les points).
- **Validation « Fait »** : le joueur actif déclare « Fait » ; en multi-téléphones, les autres ont 10 s pour contester ; contestation majoritaire = défi compté comme passé. Sans réaction, le défi est validé. Mode un téléphone : pas de contestation.
- **Rejouer** garde le même salon, code et chat. Un salon est fermé quand tous les joueurs l'ont quitté ou après 24 h d'inactivité ; chat et vocaux sont alors supprimés.
- **Signalements** : enregistrés en base (`reports`), consultés par le porteur du projet dans le tableau de bord Supabase. Pas d'outil d'administration en V1 ; un joueur bloqué ne voit plus les messages de l'autre ; l'hôte peut exclure.
- **Dépassement des offres gratuites** : si la vidéo n'est plus disponible (quota LiveKit), le défi bascule « sur parole » avec un message clair ; les quotas passent par `canUse`. Les actions de jeu passent par l'Edge Function (≈ 1 appel par action, compatible avec l'offre gratuite au lancement).
- **Comptes en V1** : lien magique par e-mail (expéditeur SMTP gratuit type Resend à configurer à l'étape 3) ; Google ajouté si le porteur crée un client OAuth Google. URL de départ : GitHub Pages (`devj-58.github.io/action_ou_verit-_premium_check`), avec routage compatible (fallback 404) ; domaine personnalisé possible plus tard.

## 13. Laissé au constructeur

Découpage exact des composants, nommage, schéma SQL détaillé, choix des bibliothèques secondaires (QR code, enregistrement audio), barème de points précis, textes d'interface.

## 14. Ce que le porteur du projet devra fournir

- Un projet Supabase (gratuit) et un projet LiveKit Cloud (gratuit), au moment des étapes 3 et 6.
- La validation de la direction visuelle (maquette) avant l'étape 2.
