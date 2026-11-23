import { settingsStore } from '@/features/settings/settingsStore'
import { pickVoice, readAloud } from './readAloud'

const v = (name: string, lang: string) => ({ name, lang, voiceURI: name }) as SpeechSynthesisVoice

const VOICES = [
  v('Google UK English Male', 'en-GB'),
  v('Thomas', 'fr-FR'),
  v('Amélie', 'fr-CA'),
  v('Microsoft Denise Online (Natural) - French (France)', 'fr-FR'),
  v('Microsoft Henri Online (Natural) - French (France)', 'fr-FR'),
]

test('picks a voice of the right language and gender, best match first', () => {
  expect(pickVoice(VOICES, 'fr', 'female')?.voice?.name).toMatch(/Denise/)
  expect(pickVoice(VOICES, 'fr', 'male')?.voice?.name).toMatch(/Henri/)
  expect(pickVoice(VOICES, 'en', 'male')?.voice?.name).toBe('Google UK English Male')
})

test('when no voice of that gender exists, a voice of the language is tuned higher or lower', () => {
  const only = [v('Google français', 'fr-FR')]
  expect(pickVoice(only, 'fr', 'female')).toMatchObject({ pitch: 1.25 })
  expect(pickVoice(only, 'fr', 'male')).toMatchObject({ pitch: 0.75 })
})

describe('reading aloud', () => {
  const spoken: SpeechSynthesisUtterance[] = []
  beforeEach(() => {
    spoken.length = 0
    class Utterance {
      text: string
      lang = ''
      pitch = 1
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => VOICES,
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
      cancel: vi.fn(),
    })
    settingsStore.setState({ sound: true, language: 'fr' })
  })
  afterEach(() => vi.unstubAllGlobals())

  test('speaks the text in French with the chosen voice', () => {
    readAloud('Vérité pour Awa. Ton pire mensonge ?', 'female')
    expect(spoken).toHaveLength(1)
    expect(spoken[0]).toMatchObject({ text: 'Vérité pour Awa. Ton pire mensonge ?', lang: 'fr-FR' })
    expect(spoken[0]!.voice?.name).toMatch(/Denise/)
  })

  test('stays silent when sounds are off', () => {
    settingsStore.setState({ sound: false })
    readAloud('Action pour Kofi.', 'male')
    expect(spoken).toHaveLength(0)
  })
})
