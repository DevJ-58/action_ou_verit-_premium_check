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

  // The answerer tells how it went; the other phone sees it and votes.
  await expect(proposer.getByRole('status').filter({ hasText: /relève le défi/ })).toBeVisible()
  await answerer.getByLabel(/Raconte comment/).fill('Fait, sur une jambe !')
  await answerer.getByRole('button', { name: /Envoyer ma réponse/ }).click()
  await expect(proposer.getByRole('status').filter({ hasText: /a répondu/ })).toBeVisible()
  await expect(proposer.getByRole('blockquote')).toHaveText('Fait, sur une jambe !')
  await proposer.getByRole('button', { name: /Validé/ }).click()
  await expect(answerer.getByText(/1 validé · 0 pas convaincu/)).toBeVisible()

  // Chat: a message from one phone shows on the other, with an unread badge.
  await proposer.getByRole('button', { name: /Ouvrir la discussion/ }).click()
  await proposer.getByRole('textbox', { name: 'Message' }).fill('Bravo 👏')
  await proposer.getByRole('textbox', { name: 'Message' }).press('Enter')
  await expect(answerer.getByRole('button', { name: /1 non lu/ })).toBeVisible()
  await answerer.getByRole('button', { name: /Ouvrir la discussion/ }).click()
  await expect(answerer.getByRole('log').getByText('Bravo 👏')).toBeVisible()
})

test('a player met in a room becomes a friend and is invited to the next room', async ({
  context,
}) => {
  test.setTimeout(90_000)
  const awa = await context.newPage()
  const kofi = await context.newPage()
  await signUp(awa, 'Awa')
  await signUp(kofi, 'Kofi')

  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL(/salon\/[A-Z2-9]{6}$/)
  const first = awa.url().slice(-6)
  await kofi.goto(`./salon/${first}`)
  await awa.getByRole('button', { name: 'Ajouter Kofi en ami' }).click()
  await expect(awa.getByRole('button', { name: 'Ajouter Kofi en ami' })).toHaveCount(0)

  // Both leave; Awa opens a new room and invites Kofi.
  await kofi.goto('./')
  await awa.getByRole('button', { name: /Quitter/ }).click()
  await awa.getByRole('link', { name: /Créer un salon/ }).click()
  await awa.waitForURL((url) => /salon\/[A-Z2-9]{6}$/.test(url.pathname) && !url.pathname.endsWith(first))
  const second = awa.url().slice(-6)
  await awa.getByRole('button', { name: /Inviter mes amis/ }).click()
  await awa.getByRole('button', { name: 'Inviter Kofi' }).click()
  await expect(awa.getByText('Invité ✓')).toBeVisible()

  const banner = kofi.getByRole('region', { name: 'Invitation' })
  await expect(banner).toContainText('Awa t’invite à jouer')
  await banner.getByRole('button', { name: 'Rejoindre' }).click()
  await kofi.waitForURL(new RegExp(`salon/${second}$`))
  await expect(awa.getByText('Kofi')).toBeVisible()
})
