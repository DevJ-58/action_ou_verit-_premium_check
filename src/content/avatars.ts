/**
 * Ready-made 3D avatars — Microsoft Fluent Emoji 3D (MIT licence),
 * via the @lobehub/fluent-emoji-3d package. Files live in src/assets/fluent/avatars.
 */
const FILES = import.meta.glob<string>('../assets/fluent/avatars/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const LABELS: Record<string, string> = {
  '1f469-1f3ff-200d-1f9b1': 'Boucles, peau foncée',
  '1f469-1f3fe-200d-1f9b1': 'Boucles, peau mate',
  '1f468-1f3ff-200d-1f9b1': 'Afro, peau foncée',
  '1f468-1f3fe-200d-1f9b1': 'Afro, peau mate',
  '1f469-1f3ff': 'Femme, peau foncée',
  '1f469-1f3fe': 'Femme, peau mate',
  '1f469-1f3fd': 'Femme, peau métisse',
  '1f469-1f3fc': 'Femme, peau claire',
  '1f469-1f3fb': 'Femme, peau très claire',
  '1f468-1f3ff': 'Homme, peau foncée',
  '1f468-1f3fe': 'Homme, peau mate',
  '1f468-1f3fd': 'Homme, peau métisse',
  '1f468-1f3fc': 'Homme, peau claire',
  '1f468-1f3fb': 'Homme, peau très claire',
  '1f9d1-1f3ff': 'Personne, peau foncée',
  '1f9d1-1f3fd': 'Personne, peau métisse',
  '1f9d4-1f3ff': 'Barbe, peau foncée',
  '1f9d4-1f3fe': 'Barbe, peau mate',
  '1f9d5-1f3ff': 'Foulard, peau foncée',
  '1f9d5-1f3fd': 'Foulard, peau métisse',
  '1f478-1f3ff': 'Princesse',
  '1f934-1f3ff': 'Prince',
  '1f468-1f3fe-200d-1f9b2': 'Crâne rasé',
  '1f469-1f3fc-200d-1f9b0': 'Rousse',
  '1f981': 'Lion',
  '1f98a': 'Renard',
  '1f43c': 'Panda',
  '1f42f': 'Tigre',
  '1f984': 'Licorne',
  '1f431': 'Chat',
  '1f47d': 'Extraterrestre',
  '1f916': 'Robot',
  '1f47b': 'Fantôme',
  '1f608': 'Petit diable',
  '1f920': 'Cowboy',
  '1f60e': 'Lunettes de soleil',
}

export interface AvatarOption {
  id: string
  label: string
  src: string
}

export const AVATARS: readonly AvatarOption[] = Object.entries(LABELS).flatMap(([id, label]) => {
  const src = FILES[`../assets/fluent/avatars/${id}.webp`]
  return src ? [{ id, label, src }] : []
})

export function avatarById(id: string | undefined): AvatarOption | undefined {
  return id ? AVATARS.find((a) => a.id === id) : undefined
}
