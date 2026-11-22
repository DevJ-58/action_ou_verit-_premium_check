import { expect, test, type Page } from '@playwright/test'

async function signUp(page: Page, pseudo: string) {
  await page.goto('./compte?next=%2F')
  const age = page.getByRole('button', { name: /J’ai 18 ans ou plus/ })
  const signUpTab = page.getByRole('radio', { name: /Créer un compte/ })
  await expect(age.or(signUpTab)).toBeVisible()
  if (await age.isVisible()) {
    await age.click()
    await page.goto('./compte?next=%2F')
  }
  await signUpTab.check({ force: true })
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('E-mail').fill(`${pseudo.toLowerCase()}-${Date.now()}@example.com`)
  await page.getByLabel('Mot de passe').fill('motdepasse')
  await page.getByRole('button', { name: /^Créer mon compte$/ }).click()
  await expect(page.getByRole('link', { name: /Créer un salon/ })).toBeVisible()
}

test('two phones play a room turn: everyone proposes, the answerer turns a card', async ({
  context,
}) => {
  test.setTimeout(90_000)
  const awa = await context.newPage()
  const kofi = await context.newPage()
  await signUp(awa, 'Awa')
  await signUp(kofi, 'Kofi')

  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL(/salon\/[A-Z2-9]{6}$/)
  const code = awa.url().slice(-6)

  await kofi.getByRole('link', { name: /Rejoindre/ }).click()
  await kofi.getByLabel('Code du salon').fill(code)
  await kofi.getByRole('button', { name: /^Rejoindre$/ }).click()
  await expect(kofi.getByText(/En attente de Awa/)).toBeVisible()
  await expect(awa.getByText('Kofi')).toBeVisible()

  await awa.getByRole('button', { name: /Juste pour rire/ }).click()
  await awa.getByRole('button', { name: /Lancer la partie/ }).click()
  await kofi.getByRole('button', { name: /Tourner la bouteille/ }).click()

  const chooser = (p: Page) => p.getByRole('button', { name: 'Action', exact: true })
  await expect
    .poll(async () => (await chooser(awa).isVisible()) || (await chooser(kofi).isVisible()), {
      timeout: 10_000,
    })
    .toBe(true)
  const [answerer, proposer] = (await chooser(awa).isVisible()) ? [awa, kofi] : [kofi, awa]
  await chooser(answerer).click()

  await proposer.getByLabel(/Ton défi pour/).fill('Imite un flamant rose pendant dix secondes')
  await proposer.getByRole('button', { name: /^Proposer$/ }).click()

  await answerer.getByRole('button', { name: 'Carte 1' }).click()
  for (const phone of [awa, kofi]) {
    await expect(phone.getByRole('article')).toContainText(
      'Imite un flamant rose pendant dix secondes',
    )
    await expect(phone.getByRole('article')).toContainText(/Posé par/)
  }
  await expect(answerer.getByRole('button', { name: /C’est fait/ })).toBeVisible()
  await expect(proposer.getByRole('button', { name: /C’est fait/ })).toHaveCount(0)

  await proposer.getByRole('toolbar', { name: 'Réactions' }).getByRole('button').first().click()
  await expect(answerer.getByRole('img', { name: /feu/ })).toBeVisible()
})
