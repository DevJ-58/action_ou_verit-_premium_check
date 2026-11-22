import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAuth } from './supabaseAuth'

type Row = Record<string, unknown>

function fakeClient(
  opts: { signUpError?: string; signInError?: string; confirmEmail?: boolean } = {},
) {
  const profiles = new Map<string, Row>()
  let session: { user: { id: string; email: string; user_metadata: Row } } | null = null
  const user = (email: string, pseudo = 'Awa') => ({
    id: `uid-${email}`,
    email,
    user_metadata: { pseudo },
  })
  const client = {
    auth: {
      signUp: async ({ email, options }: { email: string; options: { data: Row } }) => {
        if (opts.signUpError)
          return { data: { session: null, user: null }, error: { code: opts.signUpError } }
        const u = user(email, options.data.pseudo as string)
        session = opts.confirmEmail ? null : { user: u }
        return { data: { session, user: u }, error: null }
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        if (opts.signInError) return { data: { session: null }, error: { code: opts.signInError } }
        session = { user: user(email, 'Kofi') }
        return { data: { session }, error: null }
      },
      signOut: async () => {
        session = null
        return { error: null }
      },
      getSession: async () => ({ data: { session } }),
    },
    from: () => ({
      select: () => ({
        eq: (_: string, id: string) => ({
          maybeSingle: async () => ({ data: profiles.get(id) ?? null, error: null }),
        }),
      }),
      upsert: async (row: Row) => {
        profiles.set(row.id as string, row)
        return { error: null }
      },
    }),
  }
  return { client: client as unknown as SupabaseClient, profiles }
}

test('sign up creates the profile row and returns the session', async () => {
  const { client, profiles } = fakeClient()
  const auth = createSupabaseAuth(async () => client)
  const session = await auth.signUp('awa@example.com', 'motdepasse', 'Awa')
  expect(session.account).toEqual({ id: 'uid-awa@example.com', email: 'awa@example.com' })
  expect(session.profile.pseudo).toBe('Awa')
  expect(profiles.get('uid-awa@example.com')).toMatchObject({
    pseudo: 'Awa',
    bio: '',
    custom_dares: [],
  })
})

test('when e-mail confirmation is required, sign up says so', async () => {
  const auth = createSupabaseAuth(async () => fakeClient({ confirmEmail: true }).client)
  await expect(auth.signUp('awa@example.com', 'motdepasse', 'Awa')).rejects.toMatchObject({
    code: 'confirmEmail',
  })
})

test.each([
  ['user_already_exists', 'emailTaken'],
  ['weak_password', 'weakPassword'],
  ['email_address_invalid', 'invalidEmail'],
  ['something_else', 'network'],
])('sign up error %s becomes %s', async (supabaseCode, code) => {
  const auth = createSupabaseAuth(async () => fakeClient({ signUpError: supabaseCode }).client)
  await expect(auth.signUp('awa@example.com', 'motdepasse', 'Awa')).rejects.toMatchObject({ code })
})

test('sign in maps wrong credentials and unconfirmed e-mails', async () => {
  await expect(
    createSupabaseAuth(
      async () => fakeClient({ signInError: 'invalid_credentials' }).client,
    ).signIn('a@b.co', 'xxxxxxxx'),
  ).rejects.toMatchObject({ code: 'badCredentials' })
  await expect(
    createSupabaseAuth(
      async () => fakeClient({ signInError: 'email_not_confirmed' }).client,
    ).signIn('a@b.co', 'xxxxxxxx'),
  ).rejects.toMatchObject({ code: 'confirmEmail' })
})

test('sign in creates a missing profile from the account metadata; profile changes are saved', async () => {
  const { client, profiles } = fakeClient()
  const auth = createSupabaseAuth(async () => client)
  const { profile } = await auth.signIn('kofi@example.com', 'motdepasse')
  expect(profile.pseudo).toBe('Kofi')
  await auth.saveProfile({ ...profile, bio: 'Roi du coupé-décalé', avatarId: '1f981' })
  expect(profiles.get(profile.id)).toMatchObject({ bio: 'Roi du coupé-décalé', avatar_id: '1f981' })
  expect((await auth.current())?.profile.bio).toBe('Roi du coupé-décalé')
  await auth.signOut()
  expect(await auth.current()).toBeNull()
})
