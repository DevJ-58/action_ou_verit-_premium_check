// Supabase Edge Function « geniuspay » (Deno). Deploy with « Verify JWT » OFF:
// GeniusPay's webhook calls it without a Supabase session (players are checked below).
//
// Three uses, one function:
//  - { action: 'create', plan }  (player signed in): opens a GeniusPay checkout page.
//  - { action: 'verify' }        (player signed in): back in the app, checks their pending payments.
//  - GeniusPay webhook (signed with X-Webhook-Signature): a payment changed.
// In every case Premium is granted only after asking GeniusPay for the payment itself
// (status, amount, currency, environment), and once per payment (grant_premium, SQL 0006).
//
// Secrets: GENIUSPAY_API_KEY (pk_…), GENIUSPAY_API_SECRET (sk_…), GENIUSPAY_WEBHOOK_SECRET (whsec_…),
// APP_URL (e.g. https://your-app.vercel.app/). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

type Env = Record<string, string | undefined>
export interface Deps {
  env: Env
  fetch: typeof fetch
}

const API = 'https://geniuspay.ci/api/v1/merchant'
// What the player pays, payment fees included (300 / 1 500 FCFA + fees, see src/features/premium/premium.ts).
const PLANS = { pass: 415, month: 1645 } as const
const WEBHOOK_MAX_AGE_S = 300
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

interface StoredPayment {
  transaction_id: string
  amount: number
  status: string
}

function service(env: Env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

function geniusHeaders(env: Env) {
  return {
    'X-API-Key': env.GENIUSPAY_API_KEY ?? '',
    'X-API-Secret': env.GENIUSPAY_API_SECRET ?? '',
    'Content-Type': 'application/json',
  }
}

/** Live keys only accept live payments; sandbox keys only sandbox ones. */
const expectedEnvironment = (env: Env) =>
  env.GENIUSPAY_API_KEY?.startsWith('pk_live_') ? 'live' : 'sandbox'

/** Asks GeniusPay about a payment and grants Premium if it is really paid. */
export async function settle(
  reference: string,
  { env, fetch }: Deps,
): Promise<'paid' | 'refused' | 'pending'> {
  const base = `${env.SUPABASE_URL}/rest/v1/payments?transaction_id=eq.${encodeURIComponent(reference)}`
  const found = await fetch(`${base}&select=transaction_id,amount,status`, {
    headers: service(env),
  })
  const [payment] = ((await found.json().catch(() => [])) as StoredPayment[]) ?? []
  if (!payment) return 'pending'
  if (payment.status !== 'pending') return payment.status === 'paid' ? 'paid' : 'refused'

  const res = await fetch(`${API}/payments/${encodeURIComponent(reference)}`, {
    headers: geniusHeaders(env),
  })
  const remote = (
    (await res.json().catch(() => ({}))) as {
      data?: { status?: string; amount?: number | string; currency?: string; environment?: string }
    }
  ).data
  if (!res.ok || !remote) return 'pending'
  if (
    remote.status === 'completed' &&
    Number(remote.amount) === payment.amount &&
    (remote.currency ?? 'XOF') === 'XOF' &&
    remote.environment === expectedEnvironment(env)
  ) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/grant_premium`, {
      method: 'POST',
      headers: service(env),
      body: JSON.stringify({ p_transaction: reference }),
    })
    return 'paid'
  }
  if (['failed', 'cancelled', 'expired', 'refunded'].includes(remote.status ?? '')) {
    await fetch(`${base}&status=eq.pending`, {
      method: 'PATCH',
      headers: service(env),
      body: JSON.stringify({ status: 'refused' }),
    })
    return 'refused'
  }
  return 'pending'
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** GeniusPay webhook: HMAC-SHA256(timestamp + "." + body, whsec) in X-Webhook-Signature. */
async function webhook(req: Request, deps: Deps): Promise<Response> {
  const secret = deps.env.GENIUSPAY_WEBHOOK_SECRET
  if (!secret) return json(503, { error: 'not_configured' })
  const raw = await req.text()
  const signature = req.headers.get('X-Webhook-Signature') ?? ''
  const timestamp = req.headers.get('X-Webhook-Timestamp') ?? ''
  if (!sameText(await hmacHex(secret, `${timestamp}.${raw}`), signature.toLowerCase())) {
    return json(401, { detail: 'Invalid signature' })
  }
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > WEBHOOK_MAX_AGE_S) {
    return json(400, { detail: 'Timestamp too old' })
  }
  const payload = JSON.parse(raw || '{}') as { data?: { reference?: string } }
  const reference = payload.data?.reference
  if (reference && /^[A-Za-z0-9_-]{1,64}$/.test(reference)) await settle(reference, deps)
  return json(200, { received: true })
}

async function playerId(req: Request, { env, fetch }: Deps): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: req.headers.get('Authorization') ?? '',
      apikey: env.SUPABASE_ANON_KEY ?? '',
    },
  })
  if (!res.ok) return null
  return ((await res.json()) as { id?: string }).id ?? null
}

async function create(
  userId: string,
  plan: keyof typeof PLANS,
  { env, fetch }: Deps,
): Promise<Response> {
  const amount = PLANS[plan]
  const app = (env.APP_URL ?? '').replace(/\/?$/, '/')
  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: geniusHeaders(env),
    body: JSON.stringify({
      amount,
      currency: 'XOF',
      description:
        plan === 'pass'
          ? 'Action ou Vérité — Pass soirée 24 h'
          : 'Action ou Vérité — Premium 1 mois',
      success_url: `${app}premium/merci`,
      error_url: `${app}premium?paiement=echec`,
      metadata: { user_id: userId, plan },
    }),
  })
  const created = (
    (await res.json().catch(() => ({}))) as {
      data?: { reference?: string; checkout_url?: string; payment_url?: string }
    }
  ).data
  const url = created?.checkout_url ?? created?.payment_url
  if (!res.ok || !created?.reference || !url) return json(502, { error: 'geniuspay' })
  const saved = await fetch(`${env.SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: service(env),
    body: JSON.stringify({ transaction_id: created.reference, user_id: userId, plan, amount }),
  })
  if (!saved.ok) return json(500, { error: 'save' })
  return json(200, { url, reference: created.reference })
}

async function verify(userId: string, deps: Deps): Promise<Response> {
  const { env, fetch } = deps
  const since = new Date(Date.now() - 24 * 3600e3).toISOString()
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/payments?user_id=eq.${userId}&status=eq.pending&created_at=gte.${since}&select=transaction_id,amount,status`,
    { headers: service(env) },
  )
  const pending = ((await res.json().catch(() => [])) as StoredPayment[]) ?? []
  const results = []
  for (const p of pending.slice(0, 5)) results.push(await settle(p.transaction_id, deps))
  return json(200, { paid: results.includes('paid') })
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method' })
  const { env } = deps
  if (
    !env.GENIUSPAY_API_KEY ||
    !env.GENIUSPAY_API_SECRET ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json(503, { error: 'not_configured' })
  }
  if (req.headers.has('X-Webhook-Signature')) return webhook(req, deps)

  const userId = await playerId(req, deps)
  if (!userId) return json(401, { error: 'auth' })
  const body = (await req.json().catch(() => ({}))) as { action?: string; plan?: string }
  if (body.action === 'verify') return verify(userId, deps)
  if (body.action === 'create') {
    if (body.plan !== 'pass' && body.plan !== 'month') return json(400, { error: 'plan' })
    if (!env.APP_URL) return json(503, { error: 'not_configured' })
    return create(userId, body.plan, deps)
  }
  return json(400, { error: 'action' })
}

declare const Deno: { env: { toObject(): Env }; serve(h: (r: Request) => Promise<Response>): void }
if (typeof Deno !== 'undefined') {
  Deno.serve((req) => handle(req, { env: Deno.env.toObject(), fetch }))
}
