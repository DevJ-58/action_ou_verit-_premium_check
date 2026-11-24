import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 320, height: 568 } })

test('a newcomer gets the home guide once, step by step, without the page sliding sideways', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: /J’ai 18 ans ou plus/ }).click()
  const bubble = page.getByRole('dialog')
  await expect(bubble).toBeVisible()
  await expect(bubble).toContainText('1 / 5')
  for (let step = 1; step <= 5; step++) {
    await expect(bubble).toContainText(`${step} / 5`)
    const box = (await bubble.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(568)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0)
    await bubble.getByRole('button', { name: step === 5 ? 'Terminer' : 'Suivant' }).click()
  }
  await expect(bubble).toBeHidden()
  await page.reload()
  await expect(page.getByRole('link', { name: /Créer un salon/ })).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('button', { name: /guide de l’écran/i }).click()
  await expect(page.getByRole('dialog')).toContainText('1 / 5')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('the rules page reads well on a small phone', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /J’ai 18 ans ou plus/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Passer' }).click()
  await page.getByRole('link', { name: 'Comment jouer' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Comment jouer' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0)
})
