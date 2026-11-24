import { expect, test, type Page } from './test.js'

async function confirmAge(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: /J’ai 18 ans ou plus/ }).click()
  await expect(page.getByRole('link', { name: /Jouer sur ce téléphone/ })).toBeVisible()
}

async function addPlayers(page: Page, names: string[]) {
  await page.getByRole('link', { name: 'Joueurs' }).click()
  for (const name of names) {
    await page.getByRole('button', { name: 'Ajouter un joueur' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Pseudo').fill(name)
    await dialog.getByRole('button', { name: 'Ajouter un joueur' }).click()
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
}

async function addCustomDare(page: Page, player: string, text: string) {
  await page.getByRole('link', { name: new RegExp(player) }).click()
  await page.getByRole('button', { name: /Créer un défi/ }).click()
  await page.getByLabel('Texte du défi').fill(text)
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(text)).toBeVisible()
  await page.getByRole('button', { name: 'Retour', exact: true }).click()
}

async function startGame(page: Page) {
  await page.getByRole('link', { name: 'Jouer' }).click()
  await page.getByRole('link', { name: /Jouer sur ce téléphone/ }).click()
  await page.getByRole('button', { name: /Juste pour rire/ }).click()
  await page.getByRole('button', { name: /Limite franchise/ }).click()
  await page.getByRole('radio', { name: '1', exact: true }).first().check({ force: true })
  await page.getByRole('button', { name: /Lancer la partie/ }).click()
  await expect(page.getByRole('button', { name: /Tourner la bouteille/ })).toBeVisible()
}

test('a full one-phone game, from the age gate to the recap', async ({ page }) => {
  await confirmAge(page)
  await addPlayers(page, ['Awa', 'Kofi', 'Inès'])
  for (const name of ['Awa', 'Kofi', 'Inès'])
    await addCustomDare(page, name, `Le défi perso de ${name}`)
  await startGame(page)

  const sources = ['system', 'custom', 'written'] as const
  for (let turn = 0; turn < 3; turn++) {
    await page.getByRole('button', { name: /Tourner la bouteille/ }).click()
    await page.getByRole('button', { name: 'Action', exact: true }).click()
    const source = sources[turn]!
    if (source === 'system') await page.getByRole('button', { name: /Défi du jeu/ }).click()
    if (source === 'custom') {
      await page.getByRole('button', { name: /Un de mes défis/ }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /Le défi perso de/ })
        .click()
    }
    if (source === 'written') {
      await page.getByRole('button', { name: /J’écris maintenant/ }).click()
      await page.getByLabel(/Ton défi pour/).fill('Imite un pingouin pendant dix secondes')
      await page.getByRole('button', { name: /Envoyer à/ }).click()
      await expect(page.getByText('Imite un pingouin pendant dix secondes')).toBeVisible()
    }
    await expect(page.getByRole('article')).toBeVisible()
    if (turn === 1) await page.getByRole('button', { name: /Passer/ }).click()
    else await page.getByRole('button', { name: /C’est fait/ }).click()
  }

  await expect(page.getByRole('heading', { name: /remporte la partie/ })).toBeVisible()
  await page.getByRole('button', { name: 'Rejouer' }).click()
  await expect(page.getByRole('button', { name: /Tourner la bouteille/ })).toBeVisible()
})

test('reloading in the middle of a game resumes at the same point', async ({ page }) => {
  await confirmAge(page)
  await addPlayers(page, ['Awa', 'Kofi'])
  await startGame(page)
  await page.getByRole('button', { name: /Tourner la bouteille/ }).click()
  const prompt = page.getByText(/, tire ta carte/)
  await expect(prompt).toBeVisible()
  const before = await prompt.textContent()
  await page.reload()
  await expect(page.getByText(before!)).toBeVisible()
  await page.goto('./')
  await expect(page.getByRole('button', { name: /Reprendre la partie/ })).toBeVisible()
})
