/** French dictionary — the source of truth for every UI string. */
export const fr = {
  appName: 'Action ou Vérité',
  nav: {
    label: 'Navigation principale',
    play: 'Jouer',
    players: 'Joueurs',
    dares: 'Mes défis',
    profile: 'Profil',
  },
  ageGate: {
    eyebrow: '18 ans et +',
    title: 'Réservé aux adultes',
    body: 'Action ou Vérité contient des défis osés, pensés pour des adultes consentants. Confirme ton âge pour continuer.',
    confirm: 'J’ai 18 ans ou plus',
    decline: 'J’ai moins de 18 ans',
    declined: 'Cette application est réservée aux adultes. Reviens nous voir à tes 18 ans !',
  },
  home: {
    titleBefore: 'Action',
    titleOr: 'ou',
    titleAfter: 'Vérité',
    tagline: 'Le téléphone au centre, chacun à sa place. Tirez la carte, assumez-la.',
    newGame: 'Nouvelle partie',
    resume: 'Reprendre la partie',
    joinRoom: 'Rejoindre un salon',
    soon: 'Bientôt',
  },
  profile: {
    title: 'Profil',
    theme: 'Thème',
    themes: { nuit: 'Nuit', ivoire: 'Ivoire', terre: 'Terre' },
    language: 'Langue',
    sound: 'Sons',
    haptics: 'Vibrations',
  },
  myDares: {
    title: 'Mes défis',
    empty: 'Aucun défi personnalisé pour l’instant.',
    emptyHint: 'Crée tes défis depuis la fiche d’un joueur.',
  },
  comingSoon: 'Bientôt disponible',
  categories: {
    fun: { name: 'Juste pour rire', description: 'Des défis légers pour briser la glace' },
    honest: { name: 'Limite franchise', description: 'Des vérités qui ne trichent pas' },
    romantic: { name: 'Romantique', description: 'Pour rapprocher les cœurs' },
    closer: { name: 'Rapproche-toi', description: 'Moins de distance, plus de complicité' },
    spicy: { name: 'Osé', description: 'On monte la température' },
    night: { name: 'Après la tombée de la nuit', description: 'Quand la lumière baisse' },
    intimate: { name: 'Très intime', description: 'Pour celles et ceux qui osent tout' },
    noreturn: { name: 'Pas de retour en arrière', description: 'Le point de non-retour' },
  },
  common: {
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    close: 'Fermer',
  },
}

export type Dictionary = typeof fr
