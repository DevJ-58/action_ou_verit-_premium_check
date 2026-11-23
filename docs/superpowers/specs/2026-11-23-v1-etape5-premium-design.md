# Étape 5 — Premium

Date : 2026-11-23 · Décidé avec le porteur du projet.

## Offre
- **Pass soirée** : 300 FCFA, valable 24 h. **Premium 1 mois** : 1 500 FCFA, valable 30 jours. Pas de renouvellement automatique ; un nouvel achat prolonge la date de fin.
- **Paiement** : CinetPay (Orange Money, MTN, Moov, Wave, cartes), en FCFA.

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
  1. L'appli appelle la fonction `create-payment` (Supabase Edge Function, joueur connecté), qui crée la transaction chez CinetPay et renvoie l'adresse de paiement.
  2. Le joueur paie chez CinetPay, puis revient sur `/premium/merci`.
  3. CinetPay appelle `cinetpay-notify`, qui **revérifie la transaction auprès de CinetPay** avant de prolonger `premium_until`. Une transaction n'est comptée qu'une fois (table `payments`).
- **Salon** : l'hôte écrit `room.premium` (son droit) dans l'état. Le serveur vérifie lui-même là où c'est possible :
  - `join_room` refuse un 7e joueur si l'hôte n'est pas Premium ;
  - le stockage des vocaux et le canal vidéo exigent que l'hôte du salon soit Premium ;
  - un déclencheur refuse plus de 5 défis perso sans Premium.
- **Sans CinetPay configuré** (développement, tests) : un paiement de test local accorde le droit sur l'appareil. En production, le bouton indique « Paiement bientôt disponible » tant que la fonction n'est pas déployée.
