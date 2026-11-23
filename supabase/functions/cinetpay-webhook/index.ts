// Supabase Edge Function « cinetpay-webhook » (Deno). Deploy with JWT verification OFF:
// CinetPay calls it without a Supabase session.
// - notify_url: CinetPay tells us a transaction changed (POST, form with cpm_trans_id).
// - return_url (?return=1): the player comes back from the payment page; we send them to the app.
// In both cases we never trust what we receive: we ask CinetPay for the transaction's real
// status and amount, then grant Premium once (grant_premium in SQL 0006).

type Env = Record<string, string | undefined>
export interface Deps {
  env: Env
  fetch: typeof fetch
}

interface Payment {
  transaction_id: string
  amount: number
  status: string
}

async function readTransactionId(req: Request, url: URL): Promise<string | null> {
  const fromQuery = url.searchParams.get('transaction_id') ?? url.searchParams.get('cpm_trans_id')
  if (fromQuery) return fromQuery
  if (req.method !== 'POST') return null
  const type = req.headers.get('content-type') ?? ''
  if (type.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as Record<string, string>
    return body.cpm_trans_id ?? body.transaction_id ?? null
  }
  const form = await req.formData().catch(() => null)
  const value = form?.get('cpm_trans_id') ?? form?.get('transaction_id')
  return typeof value === 'string' ? value : null
}

/** Checks the transaction with CinetPay and grants Premium if it is really paid. */
export async function settle(
  transactionId: string,
  { env, fetch }: Deps,
): Promise<'paid' | 'refused' | 'pending'> {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CINETPAY_APIKEY, CINETPAY_SITE_ID } = env
  const service = {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? '',
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
  const found = await fetch(
    `${SUPABASE_URL}/rest/v1/payments?transaction_id=eq.${encodeURIComponent(transactionId)}&select=transaction_id,amount,status`,
    { headers: service },
  )
  const [payment] = ((await found.json().catch(() => [])) as Payment[]) ?? []
  if (!payment) return 'pending'
  if (payment.status !== 'pending') return payment.status === 'paid' ? 'paid' : 'refused'

  const check = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: CINETPAY_APIKEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  })
  const result = (await check.json().catch(() => ({}))) as {
    data?: { status?: string; amount?: string | number; currency?: string }
  }
  const status = result.data?.status
  if (
    status === 'ACCEPTED' &&
    Number(result.data?.amount) === payment.amount &&
    result.data?.currency === 'XOF'
  ) {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/grant_premium`, {
      method: 'POST',
      headers: service,
      body: JSON.stringify({ p_transaction: transactionId }),
    })
    return 'paid'
  }
  if (status === 'REFUSED' || status === 'CANCELED') {
    await fetch(
      `${SUPABASE_URL}/rest/v1/payments?transaction_id=eq.${encodeURIComponent(transactionId)}&status=eq.pending`,
      { method: 'PATCH', headers: service, body: JSON.stringify({ status: 'refused' }) },
    )
    return 'refused'
  }
  return 'pending'
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const url = new URL(req.url)
  const returning = url.searchParams.get('return') === '1'
  const appUrl = deps.env.APP_URL ?? '/'
  const transactionId = await readTransactionId(req, url)
  if (transactionId && /^[A-Za-z0-9_-]{1,64}$/.test(transactionId)) {
    await settle(transactionId, deps).catch(() => 'pending')
  }
  if (returning) {
    return new Response(null, {
      status: 303,
      headers: { Location: `${appUrl.replace(/\/?$/, '/')}premium/merci` },
    })
  }
  // CinetPay also pings the URL with GET to see that it is reachable.
  return new Response('ok', { status: 200 })
}

declare const Deno: { env: { toObject(): Env }; serve(h: (r: Request) => Promise<Response>): void }
if (typeof Deno !== 'undefined') {
  Deno.serve((req) => handle(req, { env: Deno.env.toObject(), fetch }))
}
