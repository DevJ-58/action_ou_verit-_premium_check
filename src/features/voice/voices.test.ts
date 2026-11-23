import { AVATARS } from '@/content/avatars'
import { FakeAudioContext } from '@/lib/audio/fakeAudio'
import { VOICES, voiceFor } from './presets'
import { changeVoice } from './voiceChain'

test('every avatar has its own voice, and no voice is the natural one', () => {
  for (const avatar of AVATARS) {
    const voice = voiceFor(avatar.id)
    expect(VOICES[voice], avatar.id).toBeDefined()
  }
  expect(voiceFor('1f916')).toBe('robot')
  expect(voiceFor('1f981')).toBe('monster')
  expect(voiceFor('1f47b')).toBe('ghost')
  expect(voiceFor('1f47d')).toBe('alien')
  expect(voiceFor('unknown')).toBe('radio')
})

test('each voice builds an effect chain from the mic to a new audio stream', () => {
  for (const voice of Object.keys(VOICES) as (keyof typeof VOICES)[]) {
    FakeAudioContext.reset()
    const ctx = new FakeAudioContext() as unknown as AudioContext
    const mic = { id: 'mic' } as unknown as MediaStream
    const chain = changeVoice(ctx, mic, voice)
    expect(FakeAudioContext.sources).toEqual([mic])
    expect(chain.stream.getAudioTracks()).toHaveLength(1)
    chain.stop()
  }
})
