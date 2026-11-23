import { createHmac } from 'node:crypto'
import { handle } from '../geniuspay/index'

const env = {
  SUPABASE_URL: 'https://db.example',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  GENIUSPAY_API_KEY: 'pk_live_abc',
  GENIUSPAY_API_SECRET: 'sk_live_abc',
  GENIUSPAY_WEBHOOK_SECRET: 'whsec_test',
  APP_URL: 'https://app.example/',
}

interface Opts {
  user?: string | null
  /** What GeniusPay says when asked about the payment. */
  remote?: { status: string; amount?: number; currency?: string; environment?: string }
  /** Our stored payments. */
  stored?: { transaction_id: string; amount: number; status: string; user_id?: string }[]
}

/** A fake network: Supabase Auth/REST and GeniusPay, recording every call. */
function network(opts: Opts = {}) {
  const calls: string[] = []
  const stored = opts.stored ?? [
    { transaction_id: 'MTX-AAA', amount: 415, status: 'pending', user_id: 'user-1' },
  ]
  const fake = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const headers = new Headers(init?.headers)
    const body = init?.body ? String(init.body) : ''
    calls.push(`${init?.method ?? 'GET'} ${url} ${body}`.trim())
    const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status })
    if (url.endsWith('/auth/v1/user'))
      return opts.user === null
        ? reply(401, {})
        : reply(200, { id: opts.user ?? 'user-1', email: 'awa@x.com' })
    if (url.startsWith('https://geniuspay.ci/')) {
      if (
        headers.get('X-API-Key') !== 'pk_live_abc' ||
        headers.get('X-API-Secret') !== 'sk_live_abc'
      )
        return reply(401, { success: false })
      if (init?.method === 'POST')
        return reply(201, {
          success: true,
          data: {
            reference: 'MTX-NEW',
            amount: JSON.parse(body).amount,
            status: 'pending',
            checkout_url: 'https://geniuspay.ci/checkout/MTX-NEW',
            environment: 'live',
          },
        })
      const ref = url.split('/').pop()
      const r = opts.remote ?? { status: 'completed' }
      return reply(200, {
        success: true,
        data: {
          reference: ref,
          status: r.status,
          amount: r.amount ?? 415,
          currency: r.currency ?? 'XOF',
          environment: r.environment ?? 'live',
        },
      })
    }
    if (url.includes('/rest/v1/payments')) {
      if (init?.method === 'POST' || init?.method === 'PATCH') return reply(201, {})
      const match = /transaction_id=eq\.([^&]+)/.exec(url)
      const list = match
        ? stored.filter((p) => p.transaction_id === decodeURIComponent(match[1]!))
        : stored
      return reply(200, list)
    }
    if (url.endsWith('/rest/v1/rpc/grant_premium')) return reply(200, '2026-12-01T00:00:00Z')
    return reply(404, {})
  }) as typeof fetch
  return { calls, fetch: fake }
}

const asPlayer = (body: unknown) =>
  new Request('https://fn/geniuspay', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', Authorization: 'Bearer jwt' },
  })

function signed(payload: unknown, opts: { secret?: string; age?: number } = {}) {
  const raw = JSON.stringify(payload)
  const timestamp = String(Math.floor(Date.now() / 1000) - (opts.age ?? 0))
  const signature = createHmac('sha256', opts.secret ?? 'whsec_test')
    .update(`${timestamp}.${raw}`)
    .digest('hex')
  return new Request('https://fn/geniuspay', {
    method: 'POST',
    body: raw,
    headers: {
      'content-type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Event': (payload as { event: string }).event,
    },
  })
}
const event = (status = 'completed') => ({
  event: 'payment.success',
  data: {
    reference: 'MTX-AAA',
    amount: 415,
    currency: 'XOF',
    status,
    metadata: { user_id: 'user-1' },
  },
  environment: 'live',
})

const granted = (calls: string[]) => calls.some((c) => c.includes('/rpc/grant_premium'))

describe('creating a payment', () => {
  test('opens a GeniusPay checkout for the signed-in player, fees included, and records it', async () => {
    const n = network()
    const res = await handle(asPlayer({ action: 'create', plan: 'month' }), { env, fetch: n.fetch })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      url: 'https://geniuspay.ci/checkout/MTX-NEW',
      reference: 'MTX-NEW',
    })
    const create = n.calls.find((c) =>
      c.startsWith('POST https://geniuspay.ci/api/v1/merchant/payments'),
    )!
    const body = JSON.parse(create.slice(create.indexOf('{')))
    expect(body).toMatchObject({
      amount: 1645,
      currency: 'XOF',
      success_url: 'https://app.example/premium/merci',
      error_url: 'https://app.example/premium?paiement=echec',
      metadata: { user_id: 'user-1', plan: 'month' },
    })
    expect(body.payment_method).toBeUndefined()
    expect(n.calls.find((c) => c.startsWith('POST https://db.example/rest/v1/payments'))).toMatch(
      /"transaction_id":"MTX-NEW","user_id":"user-1","plan":"month","amount":1645/,
    )
  })

  test('refuses players who are not signed in, and unknown plans', async () => {
    expect(
      (
        await handle(asPlayer({ action: 'create', plan: 'pass' }), {
          env,
          fetch: network({ user: null }).fetch,
        })
      ).status,
    ).toBe(401)
    expect(
      (await handle(asPlayer({ action: 'create', plan: 'year' }), { env, fetch: network().fetch }))
        .status,
    ).toBe(400)
  })

  test('without GeniusPay keys it says payment is not configured', async () => {
    const res = await handle(asPlayer({ action: 'create', plan: 'pass' }), {
      env: { ...env, GENIUSPAY_API_SECRET: undefined },
      fetch: network().fetch,
    })
    expect(res.status).toBe(503)
  })
})

describe('checking on return to the app', () => {
  test('the player’s pending payments are checked with GeniusPay and granted once paid', async () => {
    const n = network()
    const res = await handle(asPlayer({ action: 'verify' }), { env, fetch: n.fetch })
    expect(res.status).toBe(200)
    expect(
      n.calls.some((c) => c.includes('GET https://geniuspay.ci/api/v1/merchant/payments/MTX-AAA')),
    ).toBe(true)
    expect(granted(n.calls)).toBe(true)
  })

  test('nothing is granted while GeniusPay says it is still pending', async () => {
    const n = network({ remote: { status: 'pending' } })
    await handle(asPlayer({ action: 'verify' }), { env, fetch: n.fetch })
    expect(granted(n.calls)).toBe(false)
  })
})

describe('webhook', () => {
  test('a signed notification is double-checked with GeniusPay, then Premium is granted', async () => {
    const n = network()
    const res = await handle(signed(event()), { env, fetch: n.fetch })
    expect(res.status).toBe(200)
    expect(
      n.calls.some((c) => c.includes('GET https://geniuspay.ci/api/v1/merchant/payments/MTX-AAA')),
    ).toBe(true)
    expect(n.calls.find((c) => c.includes('/rpc/grant_premium'))).toMatch(
      /"p_transaction":"MTX-AAA"/,
    )
  })

  test('a wrong signature or an old timestamp is rejected, without granting anything', async () => {
    const bad = network()
    expect(
      (await handle(signed(event(), { secret: 'whsec_other' }), { env, fetch: bad.fetch })).status,
    ).toBe(401)
    const old = network()
    expect((await handle(signed(event(), { age: 600 }), { env, fetch: old.fetch })).status).toBe(
      400,
    )
    expect(granted(bad.calls) || granted(old.calls)).toBe(false)
  })

  test('the payload is never trusted: wrong amount, currency or test mode grant nothing', async () => {
    for (const remote of [
      { status: 'completed', amount: 5 },
      { status: 'completed', currency: 'EUR' },
      { status: 'completed', environment: 'sandbox' },
      { status: 'failed' },
    ]) {
      const n = network({ remote })
      await handle(signed(event()), { env, fetch: n.fetch })
      expect(granted(n.calls)).toBe(false)
    }
  })

  test('an already counted or unknown payment is not checked again', async () => {
    for (const stored of [[{ transaction_id: 'MTX-AAA', amount: 415, status: 'paid' }], []]) {
      const n = network({ stored })
      await handle(signed(event()), { env, fetch: n.fetch })
      expect(n.calls.some((c) => c.includes('GET https://geniuspay.ci/'))).toBe(false)
    }
  })
})
