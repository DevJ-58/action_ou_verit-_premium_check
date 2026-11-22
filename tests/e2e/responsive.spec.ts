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
