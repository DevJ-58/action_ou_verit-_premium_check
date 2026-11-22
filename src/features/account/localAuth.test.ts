import { createLocalAuth } from './localAuth'
import { AuthError } from './authService'

async function expectAuthError(promise: Promise<unknown>, code: AuthError['code']) {
  await expect(promise).rejects.toMatchObject({ code })
}

test('sign up creates an account with a default profile and opens a session', async () => {
  const auth = createLocalAuth()
  const session = await auth.signUp('awa@example.com', 'motdepasse', 'Awa')
  expect(session.account.email).toBe('awa@example.com')
  expect(session.profile).toMatchObject({
    pseudo: 'Awa',
    bio: '',
    customDares: [],
    limits: { excludedCategories: [], maxIntensity: 4 },
  })
  expect(typeof session.profile.avatarId).toBe('string')
  expect(await auth.current()).toEqual(session)
})

test('the session survives a new instance (app restart)', async () => {
  await createLocalAuth().signUp('kofi@example.com', 'motdepasse', 'Kofi')
  expect((await createLocalAuth().current())?.profile.pseudo).toBe('Kofi')
})

test('sign in checks the password; sign out ends the session', async () => {
  const auth = createLocalAuth()
  await auth.signUp('ines@example.com', 'motdepasse', 'Inès')
  await auth.signOut()
  expect(await auth.current()).toBeNull()
  await expectAuthError(auth.signIn('ines@example.com', 'mauvais!!'), 'badCredentials')
  await expectAuthError(auth.signIn('personne@example.com', 'motdepasse'), 'badCredentials')
  expect((await auth.signIn('INES@example.com ', 'motdepasse')).profile.pseudo).toBe('Inès')
})

test('refuses a taken e-mail, a short password and an invalid e-mail', async () => {
  const auth = createLocalAuth()
  await auth.signUp('yann@example.com', 'motdepasse', 'Yann')
  await expectAuthError(auth.signUp('yann@example.com', 'motdepasse', 'Yann2'), 'emailTaken')
  await expectAuthError(auth.signUp('new@example.com', 'court', 'Neuf'), 'weakPassword')
  await expectAuthError(auth.signUp('pas-un-email', 'motdepasse', 'Neuf'), 'invalidEmail')
})

test('passwords are never stored in clear', async () => {
  await createLocalAuth().signUp('awa@example.com', 'motdepasse-secret', 'Awa')
  expect(JSON.stringify(localStorage)).not.toContain('motdepasse-secret')
})

test('saveProfile persists profile changes', async () => {
  const auth = createLocalAuth()
  const { profile } = await auth.signUp('awa@example.com', 'motdepasse', 'Awa')
  await auth.saveProfile({ ...profile, bio: 'Reine du zouk', avatarId: '1f981' })
  expect((await createLocalAuth().current())?.profile).toMatchObject({
    bio: 'Reine du zouk',
    avatarId: '1f981',
  })
})

test('each tab keeps its own signed-in account (two phones simulated in one browser)', async () => {
  const auth = createLocalAuth()
  await auth.signUp('awa@example.com', 'motdepasse', 'Awa')
  const tabOneSession = sessionStorage.getItem('av:session')
  await auth.signUp('kofi@example.com', 'motdepasse', 'Kofi')
  // Tab one still sees Awa once its own session id is restored.
  sessionStorage.setItem('av:session', tabOneSession!)
  expect((await createLocalAuth().current())?.profile.pseudo).toBe('Awa')
  // A brand-new tab (empty sessionStorage) falls back to the last account used on the device.
  sessionStorage.clear()
  expect((await createLocalAuth().current())?.profile.pseudo).toBe('Kofi')
})
