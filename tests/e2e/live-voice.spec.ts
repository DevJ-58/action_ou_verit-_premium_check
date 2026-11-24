import { expect, test, type Page } from './test.js'

// Chromium's fake microphone stands in for a real one.
test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  },
  permissions: ['camera', 'microphone'],
})

async function signUp(page: Page, pseudo: string) {
  await page.goto('./compte?next=%2F')
  const age = page.getByRole('button', { name: /J’ai 18 ans ou plus/ })
  const tab = page.getByRole('radio', { name: /Créer un compte/ })
  await expect(age.or(tab)).toBeVisible()
  if (await age.isVisible()) {
    await age.click()
    await page.goto('./compte?next=%2F')
  }
  await tab.check({ force: true })
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('E-mail').fill(`${pseudo.toLowerCase()}-${Date.now()}@example.com`)
  await page.getByLabel('Mot de passe').fill('motdepasse')
  await page.getByRole('button', { name: /^Créer mon compte$/ }).click()
  await page.getByRole('button', { name: 'C’est parti !' }).click()
  await expect(page.getByRole('link', { name: /Créer un salon/ })).toBeVisible()
}

/** Remote voices playing on this page: live audio tracks received over WebRTC. */
const liveVoices = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLAudioElement>('audio[data-voice-speaker]')].filter((a) =>
        (a.srcObject as MediaStream | null)?.getAudioTracks().some((t) => t.readyState === 'live'),
      ).length,
  )

test('two players turn their mic on and hear each other, with their avatar voices', async ({
  context,
}) => {
  test.setTimeout(90_000)
  const awa = await context.newPage()
  const kofi = await context.newPage()
  await signUp(awa, 'Awa')
  await signUp(kofi, 'Kofi')
  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL(/salon\/[A-Z2-9]{6}$/)
  await kofi.goto(`./salon/${awa.url().slice(-6)}`)
  await expect(awa.getByText('Kofi')).toBeVisible()
  await awa.getByRole('button', { name: /Juste pour rire/ }).click()
  await awa.getByRole('button', { name: /Lancer la partie/ }).click()

  await awa.getByRole('button', { name: 'Activer mon micro' }).click()
  await kofi.getByRole('button', { name: 'Activer mon micro' }).click()
  const strip = kofi.getByRole('list', { name: 'Micros ouverts' })
  await expect(strip).toContainText('Awa')
  await expect(strip).toContainText('Kofi')
  await expect(kofi.getByText(/Ta voix :/)).toBeVisible()

  await expect.poll(() => liveVoices(awa), { timeout: 20_000 }).toBe(1)
  await expect.poll(() => liveVoices(kofi), { timeout: 20_000 }).toBe(1)

  await kofi.getByRole('button', { name: 'Couper mon micro' }).click()
  await expect.poll(() => liveVoices(awa), { timeout: 20_000 }).toBe(0)
})
