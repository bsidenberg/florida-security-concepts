import { canonicalFingerprint } from './localReceipt';
import type { DeliveryResult, ValidatedLead } from './types';
import { RECEIPT_TEMPLATE_VERSION, snapshotEmailEnvelopes, type EmailEnvelope } from './providers/resend';

export type RpcResult = { code?: string; [key: string]: unknown };

/** Every effect is awaited; no serverless work continues after the response. */
export type ResendOutcome =
  | { kind: 'accepted'; id: string }
  | { kind: 'concurrent' } // 409, same idempotency key still in flight
  | { kind: 'payload-mismatch' } // 409, same idempotency key reused with a different payload
  | { kind: 'rejected' } // definitive 400/401/403/422
  | { kind: 'ambiguous' }; // timeout/network error, 5xx, 429, 2xx without an id, or any other unclassified response

export type ReceiptDependencies = {
  rpc: (name: string, args: Record<string, unknown>, signal: AbortSignal) => Promise<RpcResult>;
  send: (envelope: EmailEnvelope, idempotencyKey: string, signal: AbortSignal) => Promise<ResendOutcome>;
  snapshot?: (lead: ValidatedLead) => Record<string, EmailEnvelope>;
  /**
   * Elapsed/monotonic clock in milliseconds (M-6), used ONLY to track the
   * 15s total server budget — immune to wall-clock jumps. Defaults to
   * `performance.now()`. Never compared against DB timestamps: lease/cutoff
   * comparisons always use `Date.now()` directly, regardless of this.
   */
  now?: () => number;
};

const mode = 'resend+supabase' as const;
function failure(code: string, status: number, retryAfter?: number): DeliveryResult {
  return { ok: false, mode, reason: code, code, status, ...(retryAfter !== undefined ? { retryAfter } : {}) };
}

/**
 * Classifies a raw Resend `/emails` response by HTTP status and parsed JSON
 * body. Exported as a pure function so tests can assert every branch
 * without a network call. Only `status` and `body.id`/`body.name` (Resend's
 * error discriminator) are consulted — the response is never logged.
 */
export function classifyResendResponse(status: number, body: unknown): ResendOutcome {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  if (status >= 200 && status < 300) {
    const id = record && typeof record.id === 'string' ? record.id : null;
    return id ? { kind: 'accepted', id } : { kind: 'ambiguous' };
  }
  if (status === 409) {
    const name = record && typeof record.name === 'string' ? record.name.toLowerCase() : '';
    return name.includes('concurrent') ? { kind: 'concurrent' } : { kind: 'payload-mismatch' };
  }
  if (status === 400 || status === 401 || status === 403 || status === 422) return { kind: 'rejected' };
  return { kind: 'ambiguous' };
}

type EffectOutcome =
  | { kind: 'succeeded' }
  | { kind: 'skipped' } // N-1: only expected for customer_email; treated as unknown for company_email
  | { kind: 'busy' }
  | { kind: 'expired' }
  | { kind: 'failed' }
  | { kind: 'uncertain' } // finish recorded (or attempted) uncertain; recoverable via same-ID retry
  | { kind: 'unreachable' }; // claim CUTOFF, malformed claim, or an RPC call itself failed

export async function deliverProductionReceipt(
  lead: ValidatedLead,
  requestId: string,
  deps: ReceiptDependencies,
  source: string | null
): Promise<DeliveryResult> {
  // M-6: two independent clocks. `elapsed()` is monotonic and tracks only
  // the 15s total server budget (immune to wall-clock jumps). Lease/cutoff
  // are absolute DB timestamps and are always compared against Date.now()
  // directly, never against `elapsed()`/deps.now.
  const elapsed = deps.now || (() => performance.now());
  const elapsedStart = elapsed();
  const remainingServerBudget = () => 15000 - (elapsed() - elapsedStart);

  const signal = (reserve = 0) => {
    const remaining = remainingServerBudget() - reserve;
    if (remaining <= 0) throw new Error('DEADLINE');
    return AbortSignal.timeout(Math.min(8000, Math.max(1, Math.floor(remaining))));
  };
  const rpc = (name: string, args: Record<string, unknown>) =>
    deps.rpc(name, { p_slug: 'fsc', p_request: requestId, ...args }, signal());

  async function finish(effect: 'company_email' | 'customer_email', token: string, state: string, providerId: string | null, category: string | null) {
    try {
      return await rpc('fsc_effect_finish_draft', { p_effect: effect, p_token: token, p_state: state, p_provider_id: providerId, p_error: category });
    } catch {
      // The durable lease remains recoverable with the same key; nothing to report locally.
      return { code: 'RPC_FAILURE' } as RpcResult;
    }
  }

  async function claimAndSend(effect: 'company_email' | 'customer_email'): Promise<EffectOutcome> {
    let claim: RpcResult;
    try {
      claim = await rpc('fsc_effect_claim_draft', { p_effect: effect });
    } catch {
      return { kind: 'unreachable' };
    }
    if (claim.code === 'SUCCEEDED') return { kind: 'succeeded' };
    if (claim.code === 'SKIPPED') return { kind: 'skipped' };
    if (claim.code === 'BUSY') return { kind: 'busy' };
    if (claim.code === 'EXPIRED') return { kind: 'expired' };
    if (claim.code !== 'CLAIMED') return { kind: 'unreachable' }; // CUTOFF, PRIMARY_PENDING, or unrecognized

    const leaseUntil = Date.parse(String(claim.lease_until));
    const cutoff = Date.parse(String(claim.retry_cutoff));
    if (
      !Number.isFinite(leaseUntil) ||
      !Number.isFinite(cutoff) ||
      typeof claim.idempotency_key !== 'string' ||
      typeof claim.lease_token !== 'string' ||
      !claim.envelope
    ) {
      return { kind: 'unreachable' };
    }
    const token = claim.lease_token;
    // R2-4/R2-5: whether an earlier claim on this same effect already
    // reached an ambiguous provider state (captured by the SQL before this
    // claim's UPDATE; missing/anything but explicit false is treated as
    // uncertain, the conservative default). Only a truly first attempt may
    // finish as a known 'failed'; any later attempt on a definitive
    // rejection is uncertain, never failed, because an earlier attempt may
    // already have been delivered. SQL enforces this independently too
    // (fsc_effect_finish_draft's claimed_from_state backstop), so the
    // actual returned finish code is authoritative, not this local guess.
    const priorUncertain = claim.prior_uncertain !== false;

    // M-2a: any throw/rejection past this point (including from deps.send)
    // must never surface as a known failure — the provider state is
    // genuinely unknown. Leave the lease to expire/reclaim, or record
    // 'uncertain' when there is still time to do so safely.
    try {
      // M-6: reserve 1s after the send for the finish() call; never send
      // with under 1s of margin on ANY of the three independent budgets.
      const serverBudget = remainingServerBudget() - 1000;
      const leaseBudget = leaseUntil - 1000 - Date.now();
      const cutoffBudget = cutoff - 1000 - Date.now();
      const budget = Math.min(serverBudget, leaseBudget, cutoffBudget);
      if (budget < 1000) return { kind: 'unreachable' };

      const outcome = await deps.send(claim.envelope as EmailEnvelope, claim.idempotency_key, AbortSignal.timeout(Math.min(8000, Math.floor(budget))));

      switch (outcome.kind) {
        case 'accepted': {
          const recorded = await finish(effect, token, 'succeeded', outcome.id, null);
          return recorded.code === 'SUCCEEDED' ? { kind: 'succeeded' } : { kind: 'uncertain' };
        }
        case 'concurrent':
          // Another worker's send with the same idempotency key is already in flight; leave the lease to expire naturally.
          return { kind: 'busy' };
        case 'rejected': {
          if (priorUncertain) {
            // A later definitive rejection (e.g. rotated key) does not prove
            // the earlier attempt failed; Resend may already have delivered it.
            await finish(effect, token, 'uncertain', null, 'configuration');
            return { kind: 'uncertain' };
          }
          // SQL is authoritative: fsc_effect_finish_draft may still
          // downgrade 'failed' to 'uncertain' (code UNCERTAIN) via its own
          // claimed_from_state backstop even when this app-level guess was
          // wrong. Only a returned FAILED may become a known failure.
          const recorded = await finish(effect, token, 'failed', null, 'configuration');
          return recorded.code === 'FAILED' ? { kind: 'failed' } : { kind: 'uncertain' };
        }
        case 'payload-mismatch':
          // Never generate a new key for the same effect; leave for manual reconciliation.
          await finish(effect, token, 'uncertain', null, 'configuration');
          return { kind: 'uncertain' };
        case 'ambiguous':
        default:
          await finish(effect, token, 'uncertain', null, 'ambiguous');
          return { kind: 'uncertain' };
      }
    } catch {
      try {
        await finish(effect, token, 'uncertain', null, 'ambiguous');
      } catch {
        /* The durable lease remains recoverable with the same key. */
      }
      return { kind: 'uncertain' };
    }
  }

  async function resolvePrimeLead(): Promise<boolean> {
    try {
      const claim = await rpc('fsc_effect_claim_draft', { p_effect: 'prime_lead' });
      if (claim.code === 'SUCCEEDED') return true;
      if (claim.code === 'CLAIMED' && typeof claim.lease_token === 'string') {
        const recorded = await rpc('fsc_prime_record_draft', { p_token: claim.lease_token });
        return recorded.code === 'SUCCEEDED';
      }
      return false;
    } catch {
      console.warn('[lead-receipt]', 'prime_pending');
      return false;
    }
  }

  let created: RpcResult;
  try {
    created = await rpc('fsc_receipt_create_draft', {
      p_fingerprint: canonicalFingerprint(lead),
      p_payload: lead,
      p_envelopes: (deps.snapshot || snapshotEmailEnvelopes)(lead),
      p_template: RECEIPT_TEMPLATE_VERSION,
      p_source: source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('FSC_ACCOUNT_REFUSED')) return failure('CONFIGURATION', 503);
    return failure('RECEIPT_UNKNOWN', 504);
  }

  if (created.code === 'SOURCE_UNAVAILABLE') return failure('CONFIGURATION', 503);
  if (created.code === 'CONFLICT') return failure('CONFLICT', 409);
  if (created.code === 'EXPIRED') return failure('EXPIRED', 409);
  if (created.code === 'RATE_LIMIT') {
    const retryAfter = typeof created.retry_after === 'number' && created.retry_after > 0 ? Math.ceil(created.retry_after) : 1;
    return failure('RATE_LIMIT', 429, retryAfter);
  }
  if ((created.code !== 'READY' && created.code !== 'RECEIVED') || typeof created.receipt_id !== 'string') {
    return failure('RECEIPT_UNKNOWN', 504);
  }
  const receiptId = created.receipt_id;

  const companyOutcome: EffectOutcome = created.code === 'RECEIVED' ? { kind: 'succeeded' } : await claimAndSend('company_email');

  switch (companyOutcome.kind) {
    case 'succeeded':
      break; // A durable primary acceptance — secondary failures below never change this response.
    case 'busy':
      return failure('PENDING', 409);
    case 'expired':
      return failure('EXPIRED', 409);
    case 'failed':
      return failure('DELIVERY_FAILED', 503);
    case 'skipped': // N-1: company_email should never legitimately be skipped; treat as unknown.
    case 'uncertain':
    case 'unreachable':
    default:
      return failure('RECEIPT_UNKNOWN', 504);
  }

  const primeOk = await resolvePrimeLead();
  try {
    await claimAndSend('customer_email');
  } catch {
    console.warn('[lead-receipt]', 'customer_pending');
  }
  return { ok: true, mode, deliveryId: receiptId, supabaseStatus: primeOk ? 'ok' : 'failed' };
}

export function productionDependencies(): ReceiptDependencies {
  const base = process.env.PRIME_SUPABASE_URL?.trim();
  const key = process.env.PRIME_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resend = process.env.RESEND_API_KEY?.trim();
  // M-2b: FSC_ADMISSION_HMAC_KEY is deliberately NOT required here. A
  // missing/malformed key makes admission.ts's trustedSourceDigest() return
  // null, which SQL treats as SOURCE_UNAVAILABLE for NEW request IDs only —
  // existing-ID retries must still reconcile (AM-004/D-023a).
  if (
    !base ||
    !key ||
    !resend ||
    !process.env.LEAD_NOTIFICATION_FROM?.trim() ||
    process.env.PRIME_ACCOUNT_SLUG?.trim() !== 'fsc' ||
    new URL(base).protocol !== 'https:'
  ) {
    throw new Error('CONFIGURATION');
  }
  return {
    async rpc(name, args, signal) {
      const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal,
        redirect: 'error',
        cache: 'no-store',
      });
      if (!response.ok) {
        let message = 'RECEIPT_UNAVAILABLE';
        try {
          const body = await response.json();
          if (body && typeof body.message === 'string') message = body.message;
        } catch {
          /* keep default */
        }
        throw new Error(message);
      }
      return response.json();
    },
    async send(envelope, idempotencyKey, signal) {
      let response: Response;
      try {
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify(envelope),
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
      return classifyResendResponse(response.status, body);
    },
  };
}
