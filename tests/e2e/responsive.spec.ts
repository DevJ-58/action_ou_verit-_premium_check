import { expect, test } from '@playwright/test'

// Measure the real layout width: a mobile emulation would zoom out to fit and hide overflow.
test.use({ isMobile: false, hasTouch: false })

const ROUTES = [
  './',
  './joueurs',
  './defis',
  './profil',
  './partie/nouvelle',
  './compte',
  './bienvenue',
]
const WIDTHS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => {
    localStorage.setItem(
      'av:settings',
      JSON.stringify({
        state: {
          language: 'fr',
          theme: 'nuit',
          sound: false,
          haptics: false,
          ageConfirmedAt: '2026-01-01',
        },
        version: 1,
      }),
    )
  })
})

for (const size of WIDTHS) {
  test(`no horizontal scrolling at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size)
    for (const route of ROUTES) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `${route} at ${size.width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('the room lobby fits a 320 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./compte?next=%2Fsalon%2Fnouveau')
  await page.getByRole('radio', { name: /Créer un compte/ }).check({ force: true })
  await page.getByLabel('Pseudo').fill('Petit')
  await page.getByLabel('E-mail').fill(`petit-${Date.now()}@example.com`)
  await page.getByLabel('Mot de passe').fill('motdepasse')
  await page.getByRole('button', { name: /^Créer mon compte$/ }).click()
  await page.waitForURL(/salon\/[A-Z2-9]{6}$/)
  await expect(page.getByRole('button', { name: /Lancer la partie/ })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
