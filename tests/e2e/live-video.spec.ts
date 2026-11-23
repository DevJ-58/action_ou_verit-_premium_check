import { expect, test, type Page } from '@playwright/test'

// Chromium's fake camera and microphone stand in for real ones.
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
  await expect(page.getByRole('link', { name: /Créer un salon/ })).toBeVisible()
}

test('the designated player goes live and the other phone sees the video', async ({ context }) => {
  test.setTimeout(90_000)
  const awa = await context.newPage()
  const kofi = await context.newPage()
  await signUp(awa, 'Awa')
  await signUp(kofi, 'Kofi')
  // Live video is Premium: the host buys an evening pass (test payment without a server).
  await awa.goto('./premium')
  await awa.getByRole('button', { name: /Payer 300 FCFA/ }).click()
  await expect(awa.getByText(/Tu es Premium jusqu’au/)).toBeVisible()
  await awa.goto('./')
  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL(/salon\/[A-Z2-9]{6}$/)
  await kofi.goto(`./salon/${awa.url().slice(-6)}`)
  await expect(awa.getByText('Kofi')).toBeVisible()
  await awa.getByRole('button', { name: /Osé/ }).click()
  await awa.getByRole('button', { name: /Lancer la partie/ }).click()
  await kofi.getByRole('button', { name: /Tourner la bouteille/ }).click()

  const chooser = (p: Page) => p.getByRole('button', { name: 'Action', exact: true })
  await expect
    .poll(async () => (await chooser(awa).isVisible()) || (await chooser(kofi).isVisible()))
    .toBe(true)
  const [answerer, viewer] = (await chooser(awa).isVisible()) ? [awa, kofi] : [kofi, awa]
  await chooser(answerer).click()
  await viewer.getByRole('radio', { name: /Écrire/ }).check({ force: true })
  await viewer.getByLabel(/Ton défi pour/).fill('Danse la salsa pendant dix secondes')
  await viewer.getByRole('button', { name: /^Proposer$/ }).click()
  await answerer.getByRole('button', { name: 'Carte 1' }).click()

  await answerer.getByRole('button', { name: /Filmer en direct · 1 min/ }).click()
  await expect(answerer.getByRole('region', { name: 'Tu es en direct' })).toBeVisible()
  const watching = viewer.getByRole('region', { name: /en direct$/ })
  await expect(watching).toBeVisible()
  // Real frames arrive over WebRTC: the video has a size and keeps playing.
  await expect
    .poll(() => watching.locator('video').evaluate((v: HTMLVideoElement) => v.videoWidth), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0)

  await answerer.getByRole('button', { name: /Arrêter la vidéo/ }).click()
  await expect(watching).toHaveCount(0)
})
