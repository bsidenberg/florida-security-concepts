// Server-only signer/client for the website -> FSC CRM `crm-intake` amendment
// (AM-005, D-025). Web Crypto only (globalThis.crypto.subtle), so this runs
// unchanged in the Node/Edge server runtime. Never imported from the CRM
// repo — the HMAC algorithm is independently re-implemented here from
// fsc-crm/supabase/functions/_shared/hmac.mjs `signRequest`, and must stay
// byte-for-byte compatible with it.
//
// This module never logs anything: not the URL, the secret, the signature,
// the raw body, or the response body. Callers (productionReceipt.ts) log
// only fixed category strings.
//
// MUST NOT be imported by any client component.

export const CRM_MIN_SECRET_LENGTH = 32;
export const CRM_TIMEOUT_CAP_MS = 4000;
export const CRM_MIN_REMAINING_MS = 6000;
/** M-1 (safety review round 1): CRM-specific RPC cap for claim/finish, independent of the shared 8s signal(). */
export const CRM_RPC_CAP_MS = 1500;
/** M-1: minimum budget the CRM step must always leave for customer_email. */
export const CRM_CUSTOMER_RESERVE_MS = 3000;
/** m-2 (safety review round 1): the exact, pinned FSC CRM project — never a wildcard `*.supabase.co`. */
export const CRM_INTAKE_HOST = 'izhandnebyywemsjisye.supabase.co';

const SIGNATURE_VERSION = 'v1';
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Mirrors fsc-crm/supabase/functions/_shared/hmac.mjs `signRequest` exactly:
 * same validation, same throw codes, same message format
 * (`${timestamp}.${body}`), same `v1=<lowercase hex>` output shape.
 */
export async function signCrmRequest(secret: string, timestamp: number, body: string): Promise<string> {
  if (typeof secret !== 'string' || secret.length < CRM_MIN_SECRET_LENGTH) throw new Error('MISSING_SECRET');
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw new Error('BAD_TIMESTAMP');
  if (typeof body !== 'string') throw new Error('BAD_BODY');
  const key = await globalThis.crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`)));
  return `${SIGNATURE_VERSION}=${toHex(signature)}`;
}

/** Builds the exact wire body: `{"requestId": <id>, "lead": <db-stored payload>}`. */
export function buildCrmBody(requestId: string, payload: Record<string, unknown>): string {
  return JSON.stringify({ requestId, lead: payload });
}

export type CrmOutcome =
  | { kind: 'succeeded'; receiptId: string | null }
  | { kind: 'conflict' }
  | { kind: 'validation' }
  | { kind: 'configuration' }
  | { kind: 'ambiguous' };

/**
 * Pure classifier so tests can exercise every branch without a network
 * call. Only `status` and `body.code`/`body.receiptId` are consulted — the
 * response is never logged.
 */
export function classifyCrmResponse(status: number, body: unknown): CrmOutcome {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  if (status === 200) {
    const code = record && typeof record.code === 'string' ? record.code : '';
    if (code === 'RECEIVED' || code === 'REPLAYED') {
      const receiptId = record && typeof record.receiptId === 'string' && record.receiptId.length <= 200 ? record.receiptId : null;
      return { kind: 'succeeded', receiptId };
    }
    return { kind: 'ambiguous' };
  }
  if (status >= 200 && status < 300) return { kind: 'ambiguous' };
  if (status === 409) return { kind: 'conflict' };
  if (status === 422) return { kind: 'validation' };
  if (status === 401 || status === 405 || status === 413) return { kind: 'configuration' };
  return { kind: 'ambiguous' };
}

export type CrmDependencies = {
  post(rawBody: string, signal: AbortSignal): Promise<CrmOutcome>;
};

/**
 * Reads and validates FSC_CRM_INTAKE_URL / FSC_CRM_INTAKE_HMAC_SECRET.
 * Returns null when either is missing or invalid — the caller must treat
 * that as the kill switch (zero RPC calls, zero fetches, log
 * `crm_configuration` only).
 */
export function crmDependencies(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  nowSeconds: () => number = () => Math.floor(Date.now() / 1000)
): CrmDependencies | null {
  const rawUrl = env.FSC_CRM_INTAKE_URL?.trim();
  // m-3 (safety review round 1): the secret is never trimmed — the CRM side
  // (fsc-crm/supabase/functions/crm-intake/index.ts) does not trim either,
  // so a value with surrounding whitespace would sign bytes the CRM
  // verifies differently. Surrounding whitespace on either side is treated
  // as invalid config (the kill switch), not silently stripped.
  const rawSecret = env.FSC_CRM_INTAKE_HMAC_SECRET;
  if (!rawUrl || typeof rawSecret !== 'string' || rawSecret !== rawSecret.trim() || rawSecret.length < CRM_MIN_SECRET_LENGTH) return null;
  const secret = rawSecret;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    // m-2 (safety review round 1): pin the exact project host, not any
    // `*.supabase.co` project, and refuse a non-default port.
    url.hostname !== CRM_INTAKE_HOST ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.pathname !== '/functions/v1/crm-intake'
  ) {
    return null;
  }

  const endpoint = url.toString();

  return {
    async post(rawBody, signal) {
      const timestamp = nowSeconds();
      let signature: string;
      try {
        signature = await signCrmRequest(secret, timestamp, rawBody);
      } catch {
        return { kind: 'ambiguous' };
      }
      let response: Response;
      try {
        response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FSC-CRM-Timestamp': String(timestamp),
            'X-FSC-CRM-Signature': signature,
          },
          body: rawBody,
          signal,
          redirect: 'error',
          cache: 'no-store',
        });
      } catch {
        return { kind: 'ambiguous' };
      }
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      return classifyCrmResponse(response.status, body);
    },
  };
}
