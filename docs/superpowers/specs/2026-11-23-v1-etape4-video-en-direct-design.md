# Étape 4 — Vidéo en direct pendant les défis (à distance)

Date : 2026-11-23 · Décidé avec le porteur du projet :
- **Format :** le joueur désigné filme, les autres regardent.
- **Durée :** choisie par l'hôte (non, 30 s, 1 min ou 2 min ; 1 min par défaut).
- **Transport :** WebRTC direct et gratuit ; Supabase sert seulement à mettre les téléphones en contact.

## Fonctionnement
1. **Réglage.** Dans la salle d'attente, l'hôte règle « Vidéo en direct » : Non, 30 s, 1 min ou 2 min. La valeur est enregistrée dans `GameSettings.liveSeconds`.
2. **Démarrer.** Pendant le défi, le joueur désigné touche « Filmer en direct ».
   - Il envoie l'intention `live` (on) ; l'hôte écrit `room.live = { by, turnKey, seconds, startedAt }`.
   - Seul le joueur désigné du tour en cours peut lancer le direct.
   - L'hôte efface `room.live` dans trois cas : le temps est écoulé, le joueur arrête, ou le tour change.
3. **Signalisation.** Elle passe par un canal temps réel `live:CODE`.
   - Chaque spectateur envoie `hello` au joueur qui filme.
   - Le joueur qui filme crée une connexion par spectateur et envoie une `offer` ; le spectateur répond par une `answer` ; les candidats ICE passent dans les deux sens.
   - Serveurs STUN publics (Google et Cloudflare). Pas de relais TURN pour l'instant : on l'ajoutera si certains réseaux 4G bloquent.
4. **À l'écran.**
   - Le joueur qui filme voit son aperçu (en miroir pour la caméra avant), un compte à rebours, un bouton pour changer de caméra et un bouton Arrêter.
   - Les spectateurs voient la vidéo avec un badge « EN DIRECT » et le compte à rebours, plus un message si la connexion échoue.
   - Rien n'est enregistré.
5. **Sécurité.** Le canal `live:CODE` est privé : seuls les membres du salon peuvent y lire et y écrire (Realtime Authorization, politiques sur `realtime.messages`, script `0005_live_video.sql`). La vidéo elle-même est chiffrée de bout en bout entre les téléphones (DTLS-SRTP).

## Limites connues
- Sans relais TURN, la connexion peut échouer derrière certains NAT stricts (quelques opérateurs 4G). Un message s'affiche alors.
- En direct (P2P), le joueur qui filme envoie un flux par spectateur. La résolution est donc limitée à 480p, ce qui reste raisonnable jusqu'à environ 6 spectateurs.
