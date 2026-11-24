import { expect, test } from './test.js'

test('alone with Axis: he greets, plays his turns, votes, and the game ends', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('./compte?next=%2F')
  const age = page.getByRole('button', { name: /J’ai 18 ans ou plus/ })
  const signUpTab = page.getByRole('radio', { name: /Créer un compte/ })
  await expect(age.or(signUpTab)).toBeVisible()
  if (await age.isVisible()) {
    await age.click()
    await page.goto('./compte?next=%2F')
  }
  await signUpTab.check({ force: true })
  await page.getByLabel('Pseudo').fill('Awa')
  await page.getByLabel('E-mail').fill(`awa-${Date.now()}@example.com`)
  await page.getByLabel('Mot de passe').fill('motdepasse')
  await page.getByRole('button', { name: /^Créer mon compte$/ }).click()
  await page.getByRole('button', { name: 'C’est parti !' }).click()

  await page.getByRole('link', { name: /Jouer avec l’IA/ }).click()
  await page.waitForURL(/salon\/[A-Z2-9]{6}$/)
  await expect(page.getByRole('button', { name: /voir le profil de axis/i })).toBeVisible()
  await page.getByRole('button', { name: /Juste pour rire/ }).click()
  await page.getByRole('radio', { name: '1', exact: true }).check({ force: true })
  await page.getByRole('button', { name: /Lancer la partie/ }).click()

  const recap = page.getByRole('heading', { name: /remporte la partie|classement/i })
  const steps = [
    page.getByRole('button', { name: /Tourner la bouteille/ }),
    page.getByRole('button', { name: 'Action', exact: true }),
    page.getByRole('button', { name: /^Proposer$/ }),
    page.getByRole('button', { name: 'Carte 1' }),
    page.getByRole('button', { name: /^Envoyer ma réponse/i }),
    page.getByRole('button', { name: /Validé/ }),
    page.getByRole('button', { name: /C’est fait/ }),
  ]
  const deadline = Date.now() + 120_000
  while (!(await recap.isVisible())) {
    expect(Date.now(), 'the game should end').toBeLessThan(deadline)
    const dare = page.getByLabel(/Ton défi pour/)
    if (await dare.isVisible()) await dare.fill('Chante une chanson pour Axis')
    const answer = page.getByLabel(/Raconte|Ta réponse/)
    if (await answer.isVisible()) await answer.fill('Je l’ai fait !')
    let clicked = false
    for (const step of steps) {
      if ((await step.isVisible()) && (await step.isEnabled())) {
        await step.click({ timeout: 2000 }).catch(() => {})
        clicked = true
        break
      }
    }
    if (!clicked) await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: /ouvrir la discussion/i }).click()
  await expect(page.getByRole('dialog').getByText('IA').first()).toBeVisible()
})
