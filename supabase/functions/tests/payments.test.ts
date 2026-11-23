import { handle as createPayment } from '../create-payment/index'
import { handle as webhook } from '../cinetpay-webhook/index'

const env = {
  SUPABASE_URL: 'https://db.example',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  CINETPAY_APIKEY: 'key',
  CINETPAY_SITE_ID: 'site',
  APP_URL: 'https://app.example/',
}

/** A fake network: Supabase Auth/REST and CinetPay, recording every call. */
function network(opts: {
  user?: string | null
  status?: string
  amount?: number
  payment?: object | null
}) {
  const calls: string[] = []
  const fake = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = init?.body ? JSON.parse(String(init.body)) : null
    calls.push(
      `${init?.method ?? 'GET'} ${url.replace(/\?.*$/, '')} ${body ? JSON.stringify(body) : ''}`.trim(),
    )
    const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status })
    if (url.endsWith('/auth/v1/user'))
      return opts.user === null ? reply(401, {}) : reply(200, { id: opts.user ?? 'user-1' })
    if (url.endsWith('/rest/v1/payments') && init?.method === 'POST') return reply(201, {})
    if (url.includes('/rest/v1/payments?')) {
      if (init?.method === 'PATCH') return reply(204, {})
      return reply(
        200,
        opts.payment === null
          ? []
          : [opts.payment ?? { transaction_id: 'T1', amount: 415, status: 'pending' }],
      )
    }
    if (url.endsWith('/rest/v1/rpc/grant_premium')) return reply(200, '2026-11-24T20:00:00Z')
    if (url.endsWith('/v2/payment'))
      return reply(200, {
        code: '201',
        data: { payment_url: 'https://checkout.cinetpay.com/payment/abc' },
      })
    if (url.endsWith('/v2/payment/check'))
      return reply(200, {
        data: {
          status: opts.status ?? 'ACCEPTED',
          amount: String(opts.amount ?? 415),
          currency: 'XOF',
        },
      })
    return reply(404, {})
  }) as typeof fetch
  return { calls, fetch: fake }
}

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  })

describe('create-payment', () => {
  test('records a pending payment for the signed-in player and returns the CinetPay page', async () => {
    const n = network({})
    const res = await createPayment(
      post('https://fn/create-payment', { plan: 'month' }, { Authorization: 'Bearer jwt' }),
      { env, fetch: n.fetch },
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ url: 'https://checkout.cinetpay.com/payment/abc' })
    expect(n.calls.find((c) => c.startsWith('POST https://db.example/rest/v1/payments'))).toMatch(
      /"user_id":"user-1","plan":"month","amount":1645/,
    )
    const init = n.calls.find((c) => c.includes('/v2/payment '))!
    expect(init).toMatch(/"amount":1645,"currency":"XOF"/)
    expect(init).toMatch(/"notify_url":"https:\/\/db.example\/functions\/v1\/cinetpay-webhook"/)
  })

  test('refuses players who are not signed in, and unknown plans', async () => {
    expect(
      (
        await createPayment(post('https://fn', { plan: 'pass' }), {
          env,
          fetch: network({ user: null }).fetch,
        })
      ).status,
    ).toBe(401)
    expect(
      (await createPayment(post('https://fn', { plan: 'year' }), { env, fetch: network({}).fetch }))
        .status,
    ).toBe(400)
  })

  test('without CinetPay secrets it says payment is not configured', async () => {
    const res = await createPayment(post('https://fn', { plan: 'pass' }), {
      env: { ...env, CINETPAY_APIKEY: undefined },
      fetch: network({}).fetch,
    })
    expect(res.status).toBe(503)
  })
})

describe('cinetpay-webhook', () => {
  const notify = (tx: string) => {
    const form = new FormData()
    form.set('cpm_trans_id', tx)
    form.set('cpm_site_id', 'site')
    return new Request('https://fn/cinetpay-webhook', { method: 'POST', body: form })
  }

  test('a notification is checked with CinetPay, then Premium is granted once', async () => {
    const n = network({})
    const res = await webhook(notify('T1'), { env, fetch: n.fetch })
    expect(res.status).toBe(200)
    expect(
      n.calls.some((c) => c.includes('/v2/payment/check') && c.includes('"transaction_id":"T1"')),
    ).toBe(true)
    expect(
      n.calls.some((c) => c.includes('/rpc/grant_premium') && c.includes('"p_transaction":"T1"')),
    ).toBe(true)
  })

  test('nothing is granted if CinetPay says it is not paid, or the amount differs', async () => {
    for (const opts of [{ status: 'REFUSED' }, { status: 'ACCEPTED', amount: 5 }]) {
      const n = network(opts)
      await webhook(notify('T1'), { env, fetch: n.fetch })
      expect(n.calls.some((c) => c.includes('grant_premium'))).toBe(false)
    }
  })

  test('an already counted or unknown transaction is not checked again', async () => {
    for (const payment of [{ transaction_id: 'T1', amount: 415, status: 'paid' }, null]) {
      const n = network({ payment })
      await webhook(notify('T1'), { env, fetch: n.fetch })
      expect(n.calls.some((c) => c.includes('/v2/payment/check'))).toBe(false)
    }
  })

  test('coming back from the payment page sends the player to the app', async () => {
    const n = network({})
    const res = await webhook(
      new Request('https://fn/cinetpay-webhook?return=1&transaction_id=T1', { method: 'GET' }),
      { env, fetch: n.fetch },
    )
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('https://app.example/premium/merci')
  })
})
