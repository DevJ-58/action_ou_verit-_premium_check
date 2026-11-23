# Étape 5 — Premium

Date : 2026-11-23 · Décidé avec le porteur du projet.

## Offre
- **Pass soirée** : 300 FCFA, valable 24 h. **Premium 1 mois** : 1 500 FCFA, valable 30 jours. Pas de renouvellement automatique ; un nouvel achat prolonge la date de fin.
- **Paiement** : GeniusPay (Wave, Orange Money, MTN, Moov, cartes), en FCFA. Les frais de paiement (1 % + 100 FCFA GeniusPay + environ 1,5 % opérateur) sont payés par l'acheteur : 415 FCFA et 1 645 FCFA.

## Gratuit / Premium
| Fonction | Gratuit | Premium | Qui doit être Premium |
|---|---|---|---|
| Catégories | Juste pour rire, Limite franchise, Romantique | + Rapproche-toi, Osé, Après la tombée de la nuit, Très intime, Pas de retour en arrière | l'hôte (salon) ; le téléphone (partie sur un téléphone) |
| Vidéo en direct | — | 30 s, 1 min ou 2 min | l'hôte |
| Taille d'un salon | 6 joueurs | 12 joueurs | l'hôte |
| Messages vocaux (chat et réponses) | — | oui | l'hôte du salon |
| Défis perso dans « Mes défis » | 5 | illimités | le joueur |
| Avatars et thèmes exclusifs | — | 12 avatars, 2 thèmes | le joueur |

## Architecture
- **Droits** : une table `entitlements (user_id, premium_until)` que le joueur peut lire mais jamais écrire. Seules les fonctions serveur l'écrivent, après un paiement vérifié.
- **Achat** :
  1. L'appli appelle la fonction `geniuspay` (`action: 'create'`, joueur connecté) : elle crée le paiement chez GeniusPay et renvoie l'adresse de sa page de paiement, où le joueur choisit son moyen de paiement.
  2. Le joueur paie, puis revient sur `/premium/merci` (ou sur `/premium?paiement=echec`). L'écran appelle `geniuspay` (`action: 'verify'`) toutes les 3 s.
  3. GeniusPay envoie aussi un webhook signé (HMAC-SHA256 du timestamp et du corps de la requête, avec le secret `whsec_…`, valable 5 min).
  4. Dans les deux cas, la fonction **redemande le paiement à GeniusPay** (statut `completed`, montant, devise XOF, environnement live) avant de prolonger `premium_until`. Un paiement n'est compté qu'une fois (table `payments`).
- **Salon** : l'hôte écrit `room.premium` (son droit) dans l'état. Le serveur vérifie lui-même là où c'est possible :
  - `join_room` refuse un 7e joueur si l'hôte n'est pas Premium ;
  - le stockage des vocaux et le canal vidéo exigent que l'hôte du salon soit Premium ;
  - un déclencheur refuse plus de 5 défis perso sans Premium.
- **Sans GeniusPay configuré** (développement, tests) : un paiement de test local accorde le droit sur l'appareil. En production, le bouton indique « Paiement bientôt disponible » tant que la fonction n'est pas déployée.
