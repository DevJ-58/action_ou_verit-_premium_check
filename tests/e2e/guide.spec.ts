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

test('in a game, the guide stays on screen and never stops a player from voting', async ({
  context,
}) => {
  test.setTimeout(90_000)
  const phone = async (pseudo: string) => {
    const p = await context.newPage()
    await p.goto('./')
    await p.evaluate(() =>
      localStorage.setItem(
        'av:settings',
        JSON.stringify({
          state: { ageConfirmedAt: '2026-01-01', toursSeen: ['home', 'lobby'] },
          version: 1,
        }),
      ),
    )
    await p.goto('./compte?next=%2F')
    await p.getByRole('radio', { name: /Créer un compte/ }).check({ force: true })
    await p.getByLabel('Pseudo').fill(pseudo)
    await p.getByLabel('E-mail').fill(`${pseudo.toLowerCase()}-${Date.now()}@example.com`)
    await p.getByLabel('Mot de passe').fill('motdepasse')
    await p.getByRole('button', { name: /^Créer mon compte$/ }).click()
    await p.getByRole('button', { name: 'C’est parti !' }).click()
    return p
  }
  const awa = await phone('Awa')
  const kofi = await phone('Kofi')
  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL(/salon\/[A-Z2-9]{6}$/)
  await kofi.goto(`./salon/${awa.url().slice(-6)}`)
  await expect(awa.getByText('Kofi')).toBeVisible()
  await awa.getByRole('button', { name: /Juste pour rire/ }).click()
  await awa.getByRole('button', { name: /Lancer la partie/ }).click()
  await kofi.getByRole('button', { name: /Tourner la bouteille/ }).click()
  const chooser = (p: typeof awa) => p.getByRole('button', { name: 'Action', exact: true })
  await expect
    .poll(async () => (await chooser(awa).isVisible()) || (await chooser(kofi).isVisible()))
    .toBe(true)
  const [answerer, voter] = (await chooser(awa).isVisible()) ? [awa, kofi] : [kofi, awa]
  await chooser(answerer).click()
  await voter.getByLabel(/Ton défi pour/).fill('Imite un flamant rose pendant dix secondes')
  await voter.getByRole('button', { name: /^Proposer$/ }).click()
  await answerer.getByRole('button', { name: 'Carte 1' }).click()

  // The voter's guide opens on the turned card; every step fits a small phone.
  const bubble = voter.getByRole('dialog')
  await expect(bubble).toBeVisible()
  const total = Number((await bubble.innerText()).match(/1 \/ (\d+)/)![1])
  for (let step = 1; step <= total; step++) {
    await expect(bubble).toContainText(`${step} / ${total}`)
    await voter.waitForTimeout(350)
    const box = (await bubble.boundingBox())!
    expect(box.y, `step ${step}`).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height, `step ${step}`).toBeLessThanOrEqual(568)
    // While the guide shows the verdict, the lit buttons still work: the game goes on.
    if ((await bubble.innerText()).includes('Le verdict')) {
      await voter.getByRole('button', { name: /Validé/ }).click()
      await expect(answerer.getByRole('button', { name: /C’est fait/ })).toBeEnabled()
    }
    if (step < total) await bubble.getByRole('button', { name: 'Suivant' }).click()
  }
  await expect(voter.getByText(/Verdict donné/)).toBeVisible()
})
