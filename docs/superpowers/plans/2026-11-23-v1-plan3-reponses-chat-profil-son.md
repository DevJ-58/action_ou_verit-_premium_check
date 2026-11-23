# Plan 3 — Répondre à distance, chat, profil et réglages, bibliothèque de défis, son

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la partie à distance complète et vivante. Le joueur répond et les autres le voient et votent ; on discute pendant la partie (texte et vocaux) ; le profil et les réglages sont séparés ; les défis se préparent à l'avance et ceux du jeu se choisissent en un tap ; la musique, les sons et les vibrations marchent.

**Spec:** retours du porteur du projet du 2026-11-23, consignés dans le message de cadrage de la session (ci-dessous), avec les specs V1 et Étape 2.

## Décisions
1. **Réponse.**
   - Engine : `ANSWER { text?, voiceId? }` (joueur désigné, une seule réponse, remplaçable) et `VOTE { playerId, ok }` (une voix par autre joueur, modifiable).
   - Le `Turn` stocke `answer` et `votes`.
   - Quand la carte est retournée, toutes les vues affichent la carte, le statut, la réponse et les votes.
   - `COMPLETE` reste l'action qui termine le tour (joueur désigné, ou l'hôte s'il est hors ligne).
2. **Chat.**
   - Messages `{ id, from, text?, voiceId?, at }`, 30 s maximum pour un vocal.
   - Local : via le bus. Supabase : table `room_messages` (expéditeur inscrit par le serveur, lecture par les membres) et stockage `voice` (privé, lecture par les membres).
   - Panneau qui s'ouvre depuis l'écran de jeu, avec un compteur de messages non lus.
3. **Profil et Réglages.**
   - `/profil` : en-tête (avatar, pseudo, bio), statistiques du compte, aperçu de « Mes défis », bouton ⚙️.
   - `/reglages` : avatar (galerie), pseudo et bio, thème, langue, musique, sons, vibrations, déconnexion.
   - Statistiques du compte enregistrées dans le profil (`stats`) à chaque fin de partie, sans double comptage.
4. **Bibliothèque de défis.**
   - `/defis` : les défis du compte (créer, modifier, supprimer, filtrer par type et catégorie), plus « Ajouter depuis le jeu » (parcourir les défis système et les copier).
   - Sans compte : invitation à se connecter, avec les défis des joueurs locaux en dessous.
5. **Défis du jeu en partie** : le compositeur propose « Mes défis », « Défis du jeu » (liste filtrée par les catégories de la partie et les limites du joueur désigné) et « Inspire-moi ».
6. **Son.**
   - `audio.ts` : un contexte audio débloqué au premier geste.
   - Une boucle musicale douce générée en temps réel (sans fichier), réglable.
   - Des sons d'événements.
   - `navigator.vibrate` (Android).
   - Déclencheurs en salon : désignation, carte retournée, réaction reçue, message reçu, fin de partie.

## Tâches
1. Moteur : réponse et votes (tests engine).
2. Partie en salon : vue « défi en cours » pour tous ; réponse texte ; votes ; fin de tour (tests vue).
3. Profil, Réglages et statistiques du compte (tests écrans et stats).
4. Bibliothèque « Mes défis » avec ajout depuis le jeu (tests écran).
5. Compositeur : parcours des défis du jeu (tests).
6. Audio : déblocage, musique, sons, vibrations et déclencheurs (tests unitaires avec AudioContext simulé).
7. Chat texte et vocaux : local, puis Supabase avec `0003_chat_stats.sql` (tests store et transport).
8. Vérification sur le vrai serveur, e2e à deux téléphones, fusion.
