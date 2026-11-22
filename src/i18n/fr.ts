/** French dictionary — the source of truth for every UI string. */
export const fr = {
  appName: 'Action ou Vérité',
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
