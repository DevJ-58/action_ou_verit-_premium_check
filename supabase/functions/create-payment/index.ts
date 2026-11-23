// Supabase Edge Function « create-payment » (Deno).
// The signed-in player asks to buy a plan: we record a pending payment and open a
// CinetPay transaction, then return its payment page.
// Secrets: CINETPAY_APIKEY, CINETPAY_SITE_ID, APP_URL (e.g. https://your-app.vercel.app/).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

type Env = Record<string, string | undefined>
export interface Deps {
  env: Env
  fetch: typeof fetch
}

const PLANS = { pass: 300, month: 1500 } as const
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

export async function handle(req: Request, { env, fetch }: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method' })
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = env
  const { CINETPAY_APIKEY, CINETPAY_SITE_ID, APP_URL } = env
  if (
    !CINETPAY_APIKEY ||
    !CINETPAY_SITE_ID ||
    !APP_URL ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json(503, { error: 'not_configured' })
  }

  // Who is buying: the player's own session token.
  const auth = req.headers.get('Authorization') ?? ''
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY ?? '' },
  })
  if (!userRes.ok) return json(401, { error: 'auth' })
  const user = (await userRes.json()) as { id?: string; email?: string }
  if (!user.id) return json(401, { error: 'auth' })

  const body = (await req.json().catch(() => ({}))) as { plan?: string }
  const plan = body.plan === 'pass' || body.plan === 'month' ? body.plan : null
  if (!plan) return json(400, { error: 'plan' })
  const amount = PLANS[plan]
  const transactionId = `AOV${Date.now()}${Math.floor(Math.random() * 1e6)}`

  const service = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
  const saved = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: service,
    body: JSON.stringify({ transaction_id: transactionId, user_id: user.id, plan, amount }),
  })
  if (!saved.ok) return json(500, { error: 'save' })

  const webhook = `${SUPABASE_URL}/functions/v1/cinetpay-webhook`
  const init = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: CINETPAY_APIKEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      description:
        plan === 'pass'
          ? 'Action ou Verite - Pass soiree 24h'
          : 'Action ou Verite - Premium 1 mois',
      notify_url: webhook,
      return_url: `${webhook}?return=1`,
      channels: 'ALL',
      lang: 'fr',
      metadata: user.id,
    }),
  })
  const data = (await init.json().catch(() => ({}))) as {
    code?: string
    data?: { payment_url?: string }
  }
  const url = data.data?.payment_url
  if (!init.ok || data.code !== '201' || !url) return json(502, { error: 'cinetpay' })
  return json(200, { url, transactionId })
}

declare const Deno: { env: { toObject(): Env }; serve(h: (r: Request) => Promise<Response>): void }
if (typeof Deno !== 'undefined') {
  Deno.serve((req) => handle(req, { env: Deno.env.toObject(), fetch }))
}
