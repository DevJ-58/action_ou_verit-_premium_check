import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabasePayments } from './supabasePayments'

function client(result: { data?: unknown; error?: { context?: { status?: number } } | null }) {
  const calls: unknown[] = []
  const c = {
    functions: {
      invoke: async (name: string, opts: { body: unknown }) => {
        calls.push([name, opts.body])
        return { data: result.data ?? null, error: result.error ?? null }
      },
    },
  }
  return { client: c as unknown as SupabaseClient, calls }
}

test('asks the server for a GeniusPay checkout page and sends the player there', async () => {
  const f = client({ data: { url: 'https://geniuspay.ci/checkout/MTX-A1B2C3D4E5' } })
  const payments = createSupabasePayments(async () => f.client)
  expect(await payments.checkout('month')).toEqual({
    kind: 'redirect',
    url: 'https://geniuspay.ci/checkout/MTX-A1B2C3D4E5',
  })
  expect(f.calls).toEqual([['geniuspay', { action: 'create', plan: 'month' }]])
})

test('says payment is not available yet when the server function is missing or not configured', async () => {
  for (const status of [404, 503]) {
    const f = client({ error: { context: { status } } })
    expect(await createSupabasePayments(async () => f.client).checkout('pass')).toEqual({
      kind: 'unavailable',
    })
  }
})

test('anything else is a failure, never a redirect to an unknown site', async () => {
  const f = client({ data: { url: 'https://evil.example/pay' } })
  expect(await createSupabasePayments(async () => f.client).checkout('pass')).toEqual({
    kind: 'failed',
  })
})

test('back in the app, asks the server to check the player’s payments', async () => {
  const f = client({ data: { paid: true } })
  await createSupabasePayments(async () => f.client).verify()
  expect(f.calls).toEqual([['geniuspay', { action: 'verify' }]])
})
