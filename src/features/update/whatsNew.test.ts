import { notesFor } from './whatsNew'

const changelog = {
  entries: [
    { version: '3', fr: ['Vidéo'], en: ['Video'] },
    { version: '2', fr: ['Amis'], en: ['Friends'] },
  ],
}

test('the latest entry, in the player’s language', () => {
  expect(notesFor(changelog, 'fr')).toEqual(['Vidéo'])
  expect(notesFor(changelog, 'en')).toEqual(['Video'])
})

test('a broken file gives no notes', () => {
  expect(notesFor(null, 'fr')).toEqual([])
  expect(notesFor({ entries: 'x' }, 'fr')).toEqual([])
})
