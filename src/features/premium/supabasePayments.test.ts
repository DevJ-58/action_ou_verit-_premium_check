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

test('asks the server for a CinetPay payment page and sends the player there', async () => {
  const f = client({ data: { url: 'https://checkout.cinetpay.com/payment/abc' } })
  const payments = createSupabasePayments(async () => f.client)
  expect(await payments.checkout('month')).toEqual({
    kind: 'redirect',
    url: 'https://checkout.cinetpay.com/payment/abc',
  })
  expect(f.calls).toEqual([
    ['create-payment', { plan: 'month', returnUrl: expect.stringContaining('/premium/merci') }],
  ])
})

test('says payment is not available yet when the server function is missing', async () => {
  const f = client({ error: { context: { status: 404 } } })
  expect(await createSupabasePayments(async () => f.client).checkout('pass')).toEqual({
    kind: 'unavailable',
  })
})

test('anything else is a failure, never a redirect to an unknown site', async () => {
  const f = client({ data: { url: 'https://evil.example/pay' } })
  expect(await createSupabasePayments(async () => f.client).checkout('pass')).toEqual({
    kind: 'failed',
  })
})
