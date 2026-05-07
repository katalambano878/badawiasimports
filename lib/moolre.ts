/**
 * Helpers for talking to Moolre's payment status API.
 *
 * Why this exists:
 *   The webhook at /api/payment/moolre/callback used to require a `secret`
 *   field in the body, but Moolre's documented webhook payload doesn't
 *   include a secret. That meant we were silently rejecting every legitimate
 *   payment callback. Instead of trusting the callback alone we now make a
 *   second authenticated round-trip to Moolre's status API, which an attacker
 *   cannot forge.
 *
 * Endpoint: POST https://api.moolre.com/open/transact/status
 * Auth: X-API-USER + X-API-PUBKEY
 * Body: { type: 1, idtype: 'externalref' | 'transactionid', id: string }
 * Success body: { status: 1, code: 'SS01', data: { txstatus: 1, ... } }
 */

const STATUS_URL = 'https://api.moolre.com/open/transact/status';

export interface MoolreStatusResult {
  ok: boolean; // true = Moolre says this txn succeeded
  raw: unknown;
  message?: string;
  authError?: boolean; // true if Moolre rejected our auth
}

interface MoolreStatusBody {
  status?: number | string;
  code?: string;
  message?: string;
  data?: {
    txstatus?: number | string;
    status?: number | string;
    amount?: number | string;
    transactionid?: string;
    externalref?: string;
    [k: string]: unknown;
  } | null;
}

export async function checkMoolreTransaction(args: {
  id: string;
  idtype?: 'externalref' | 'transactionid';
}): Promise<MoolreStatusResult> {
  const { id } = args;
  const idtype = args.idtype || 'externalref';

  const apiUser = process.env.MOOLRE_API_USER;
  const apiKey = process.env.MOOLRE_API_PUBKEY;
  if (!apiUser || !apiKey) {
    return { ok: false, raw: null, message: 'Moolre API credentials not configured' };
  }

  try {
    const res = await fetch(STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': apiUser,
        'X-API-PUBKEY': apiKey,
      },
      body: JSON.stringify({ type: 1, idtype, id }),
    });

    let body: MoolreStatusBody | null = null;
    try {
      body = (await res.json()) as MoolreStatusBody;
    } catch {
      const text = await res.text().catch(() => '');
      return { ok: false, raw: text, message: `Non-JSON response (${res.status})` };
    }

    const apiStatus = body?.status;
    const code = (body?.code || '').toString().toUpperCase();
    const txStatus = body?.data?.txstatus ?? body?.data?.status;
    const messageStr = (body?.message || '').toString().toLowerCase();

    const success =
      ((apiStatus === 1 || apiStatus === '1') && (txStatus === 1 || txStatus === '1')) ||
      code === 'SS01' ||
      messageStr.includes('successful') ||
      messageStr.includes('completed');

    const authError =
      code === 'AIN01' ||
      code === 'AUTH01' ||
      messageStr.includes('authentication');

    return {
      ok: !!success,
      raw: body,
      message: body?.message,
      authError,
    };
  } catch (e: unknown) {
    return { ok: false, raw: null, message: e instanceof Error ? e.message : String(e) };
  }
}
