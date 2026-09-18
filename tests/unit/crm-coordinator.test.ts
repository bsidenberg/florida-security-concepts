// resolveCrmLead() inside lib/leads/productionReceipt.ts (S-CRM-001 §14.3) with a
// pure in-memory RPC fake. Only the cases that need exact clocks or injected
// defects live here; everything that can run against the real SQL does so in
// tests/gate/crm-coordinator.test.ts.
//
// The fake returns EXACTLY the shapes the real AM-003/AM-005 SQL returns:
// create {code:'READY',receipt_id}; claims {code:'CLAIMED',lease_token,
// lease_until,retry_cutoff (ISO timestamptz strings),idempotency_key,envelope,
// prime_lead_id,prior_uncertain} (+payload for fsc_crm_claim_draft only);
// finish {code:upper(state),receipt_id}; prime {code:'SUCCEEDED',lead_id}; every
// other outcome {code}. The key sets come from REAL_RPC_SHAPES, which the gate
// suite asserts against real PostgreSQL, and are re-checked here on every call.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { deliverProductionReceipt, type ReceiptDependencies, type ResendOutcome, type RpcResult } from '../../lib/leads/productionReceipt';
import type { CrmDependencies, CrmOutcome } from '../../lib/leads/crmIntake';
import type { ValidatedLead } from '../../lib/leads/types';
import type { EmailEnvelope } from '../../lib/leads/providers/resend';
import { REAL_RPC_SHAPES } from '../helpers/crm';
import { validLead } from '../fixtures/lead';

const RECEIPT = '0f6c1c0e-1f7a-4d53-9d0e-6b1f5a2c3d4e';
const PRIME_LEAD = '5b2a7c9e-3d1f-4e8a-b6c4-2f9e8d7c6b5a';
const FIXED_NOW = Date.parse('2026-09-18T12:00:00.000Z');
const NO_CRM_NAMES = [
  'fsc_receipt_create_draft', 'fsc_effect_claim_draft:company_email', 'fsc_effect_finish_draft:company_email',
  'fsc_effect_claim_draft:prime_lead', 'fsc_prime_record_draft',
  'fsc_effect_claim_draft:customer_email', 'fsc_effect_finish_draft:customer_email',
];
const CRM_NAMES = [
  'fsc_receipt_create_draft', 'fsc_effect_claim_draft:company_email', 'fsc_effect_finish_draft:company_email',
  'fsc_effect_claim_draft:prime_lead', 'fsc_prime_record_draft',
  'fsc_crm_claim_draft', 'fsc_effect_finish_draft:crm_lead',
  'fsc_effect_claim_draft:customer_email', 'fsc_effect_finish_draft:customer_email',
];
const OK_RESULT = { ok: true, mode: 'resend+supabase', deliveryId: RECEIPT, supabaseStatus: 'ok' };
const STORED_PAYLOAD = { city: 'Orlando', email: 'stored-copy@example.invalid', phone: '2025550100', fullName: 'Stored Synthetic Copy', submittedAt: '2026-09-18T11:59:00.000Z' };

/** PostgREST renders jsonb timestamptz with microseconds and an explicit offset. */
const iso = (ms: number) => new Date(ms).toISOString().replace('Z', '000+00:00');

type Clock = { value: number };
type Hook = (clock: Clock) => void;
type FakeOptions = {
  crmClaim?: () => RpcResult;
  primeRecord?: RpcResult;
  onRpc?: Partial<Record<string, Hook>>;
  throwOn?: (name: string, args: Record<string, unknown>) => boolean;
  /** Override the crm_lead finish result (e.g. STALE_LEASE); default emulates fsc_effect_finish_draft incl. its backstop. */
  crmFinishResult?: (args: Record<string, unknown>) => RpcResult;
};

function assertShape(result: RpcResult, shape: readonly string[]) {
  expect(Object.keys(result).sort(), `fake RPC drifted from the real SQL shape`).toEqual([...shape].sort());
}

function claimed(effect: string, extra: Record<string, unknown> = {}): RpcResult {
  const email = effect === 'company_email' || effect === 'customer_email';
  return {
    code: 'CLAIMED', lease_token: randomUUID(), lease_until: iso(Date.now() + 30_000), retry_cutoff: iso(Date.now() + (23 * 60 + 55) * 60_000),
    idempotency_key: email ? `fsc/${RECEIPT}/${effect}` : null, envelope: email ? { to: effect === 'company_email' ? 'info@floridasecurityconcepts.com' : 'visitor@example.invalid', subject: 's', text: 't', html: '<p>h</p>' } : null,
    prime_lead_id: PRIME_LEAD, prior_uncertain: false, ...extra,
  };
}
const crmClaimed = (extra: Record<string, unknown> = {}) => claimed('crm_lead', { payload: STORED_PAYLOAD, ...extra });

function harness(options: FakeOptions = {}) {
  const clock: Clock = { value: 0 };
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const names: string[] = [];
  let crmPriorUncertain = false;
  const rpc: ReceiptDependencies['rpc'] = async (name, args, signal) => {
    expect(signal).toBeInstanceOf(AbortSignal);
    calls.push({ name, args });
    names.push(args.p_effect ? `${name}:${String(args.p_effect)}` : name);
    options.onRpc?.[args.p_effect ? `${name}:${String(args.p_effect)}` : name]?.(clock);
    if (options.throwOn?.(name, args)) throw new Error('RECEIPT_UNAVAILABLE');
    let result: RpcResult;
    switch (name) {
      case 'fsc_receipt_create_draft': result = { code: 'READY', receipt_id: RECEIPT }; assertShape(result, REAL_RPC_SHAPES.createReady); break;
      case 'fsc_effect_claim_draft': result = claimed(String(args.p_effect)); assertShape(result, REAL_RPC_SHAPES.effectClaimed); break;
      case 'fsc_prime_record_draft': result = options.primeRecord ?? { code: 'SUCCEEDED', lead_id: PRIME_LEAD }; break;
      case 'fsc_crm_claim_draft': {
        result = options.crmClaim ? options.crmClaim() : crmClaimed();
        crmPriorUncertain = result.prior_uncertain === true;
        if (result.code === 'CLAIMED' && 'payload' in result && typeof result.lease_token === 'string' && result.payload && typeof result.payload === 'object' && !Array.isArray(result.payload)) assertShape(result, REAL_RPC_SHAPES.crmClaimed);
        break;
      }
      case 'fsc_effect_finish_draft': {
        if (args.p_effect === 'crm_lead' && options.crmFinishResult) { result = options.crmFinishResult(args); break; }
        // Same rule as the real SQL: failed after a prior uncertain claim is recorded UNCERTAIN (claimed_from_state backstop).
        const backstop = args.p_effect === 'crm_lead' && args.p_state === 'failed' && crmPriorUncertain;
        result = { code: backstop ? 'UNCERTAIN' : String(args.p_state).toUpperCase(), receipt_id: RECEIPT };
        assertShape(result, REAL_RPC_SHAPES.finish);
        break;
      }
      default: throw new Error(`unexpected RPC ${name}`);
    }
    return result;
  };
  const sends: { envelope: EmailEnvelope; key: string; signal: AbortSignal }[] = [];
  const send: ReceiptDependencies['send'] = async (envelope, key, signal): Promise<ResendOutcome> => { sends.push({ envelope, key, signal }); return { kind: 'accepted', id: `synthetic-resend-${sends.length}` }; };
  const self = { clock, calls, names, rpc, send, sends };
  return self;
}

type Harness = ReturnType<typeof harness>;
function deps(h: Harness, crm?: CrmDependencies): ReceiptDependencies {
  return { rpc: (name, args, signal) => h.rpc(name, args, signal), send: h.send, snapshot: () => ({ company_email: { to: 'info@floridasecurityconcepts.com' } as unknown as EmailEnvelope }), now: () => h.clock.value, ...(crm ? { crm } : {}) };
}
function crmRecorder(outcome: CrmOutcome | ((raw: string, signal: AbortSignal) => Promise<CrmOutcome>) = { kind: 'succeeded', receiptId: 'crm-receipt-1' }) {
  const posts: { raw: string; signal: AbortSignal }[] = [];
  const crm: CrmDependencies = {
    async post(raw, signal) { posts.push({ raw, signal }); return typeof outcome === 'function' ? outcome(raw, signal) : outcome; },
  };
  return { crm, posts };
}
const lead: ValidatedLead = { ...validLead, submittedAt: '2026-09-18T12:00:00.000Z' };
const run = (h: Harness, crm?: CrmDependencies) => deliverProductionReceipt(lead, lead.requestId!, deps(h, crm), 'a'.repeat(64));

let warns: ReturnType<typeof vi.spyOn>;
let timeouts: Map<AbortSignal, number>;
beforeEach(() => {
  warns = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  for (const method of ['log', 'info', 'error', 'debug'] as const) vi.spyOn(console, method).mockImplementation(() => undefined);
  timeouts = new Map();
  const original = AbortSignal.timeout.bind(AbortSignal);
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => { const signal = original(ms); timeouts.set(signal, ms); return signal; });
});
afterEach(() => { vi.restoreAllMocks(); });
const crmLogs = () => (warns.mock.calls as unknown[][]).filter(a => a[0] === '[lead-receipt]' && String(a[1]).startsWith('crm_')).map(a => { expect(a).toHaveLength(2); return String(a[1]); });
const finishOf = (h: Harness, effect: string) => h.calls.filter(c => c.name === 'fsc_effect_finish_draft' && c.args.p_effect === effect);

describe('fixture sanity', () => {
  it('fake timestamps parse like the coordinator parses real ones', () => {
    expect(Number.isFinite(Date.parse(iso(FIXED_NOW)))).toBe(true);
    expect(Date.parse(iso(FIXED_NOW))).toBe(FIXED_NOW);
  });
});

describe('kill switch and baseline', () => {
  it('without crm: the RPC sequence is the pinned pre-AM-005 sequence, exactly one crm_configuration warn, and the result is unchanged', async () => {
    const h = harness();
    expect(await run(h)).toEqual(OK_RESULT);
    expect(h.names).toEqual(NO_CRM_NAMES);
    expect(crmLogs()).toEqual(['crm_configuration']);
    expect(h.sends.map(s => s.envelope.to)).toEqual(['info@floridasecurityconcepts.com', 'visitor@example.invalid']);
  });

  it('with crm: fsc_crm_claim_draft (only p_slug/p_request) sits between Prime and customer_email; same result as the kill-switch run', async () => {
    const baseline = await run(harness());
    const h = harness();
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(baseline);
    expect(h.names).toEqual(CRM_NAMES);
    expect(h.calls.find(c => c.name === 'fsc_crm_claim_draft')!.args).toEqual({ p_slug: 'fsc', p_request: lead.requestId });
    expect(posts).toHaveLength(1);
  });

  it('a failed Prime record keeps supabaseStatus "failed" identically with and without the CRM', async () => {
    const without = await run(harness({ primeRecord: { code: 'STALE_LEASE' } }));
    const withCrm = await run(harness({ primeRecord: { code: 'STALE_LEASE' } }), crmRecorder().crm);
    expect(without).toEqual({ ...OK_RESULT, supabaseStatus: 'failed' });
    expect(withCrm).toEqual(without);
  });
});

describe('body and finish mapping (outcome × first attempt / retry)', () => {
  it('posts JSON.stringify({requestId, lead: <claim payload>}) — the claim-returned payload, not the in-memory lead', async () => {
    const h = harness();
    const { crm, posts } = crmRecorder();
    await run(h, crm);
    expect(posts[0].raw).toBe(JSON.stringify({ requestId: lead.requestId, lead: STORED_PAYLOAD }));
    expect(posts[0].raw).not.toContain(lead.email);
  });

  const outcomes: [string, CrmOutcome, { state: string; provider: string | null; error: string | null; log: string[] }][] = [
    ['succeeded with receipt id', { kind: 'succeeded', receiptId: 'crm-receipt-77' }, { state: 'succeeded', provider: 'crm-receipt-77', error: null, log: [] }],
    ['succeeded without receipt id', { kind: 'succeeded', receiptId: null }, { state: 'succeeded', provider: null, error: null, log: [] }],
    ['conflict', { kind: 'conflict' }, { state: 'failed', provider: null, error: 'conflict', log: ['crm_failed'] }],
    ['validation', { kind: 'validation' }, { state: 'failed', provider: null, error: 'validation', log: ['crm_failed'] }],
    ['configuration', { kind: 'configuration' }, { state: 'failed', provider: null, error: 'configuration', log: ['crm_failed'] }],
    ['ambiguous', { kind: 'ambiguous' }, { state: 'uncertain', provider: null, error: 'ambiguous', log: ['crm_pending'] }],
    ['unrecognised outcome kind', { kind: 'bogus' } as unknown as CrmOutcome, { state: 'uncertain', provider: null, error: 'ambiguous', log: ['crm_pending'] }],
  ];
  for (const attempt of ['first attempt', 'retry after an uncertain attempt'] as const) {
    it.each(outcomes)(`${attempt}: %s → finish crm_lead with the §14.3 arguments and the lease token`, async (_label, outcome, expected) => {
      let token = '';
      const h = harness({ crmClaim: () => { const c = crmClaimed({ prior_uncertain: attempt !== 'first attempt' }); token = String(c.lease_token); return c; } });
      expect(await run(h, crmRecorder(outcome).crm)).toEqual(OK_RESULT);
      const finishes = finishOf(h, 'crm_lead');
      expect(finishes).toHaveLength(1);
      expect(finishes[0].args).toEqual({ p_slug: 'fsc', p_request: lead.requestId, p_effect: 'crm_lead', p_token: token, p_state: expected.state, p_provider_id: expected.provider, p_error: expected.error });
      // D-032 TG-2: the log follows the RECORDED finish code; after an uncertain attempt a failed finish is recorded UNCERTAIN.
      const log = attempt !== 'first attempt' && expected.state === 'failed' ? ['crm_pending'] : expected.log;
      expect(crmLogs()).toEqual(log);
      expect(h.names.slice(-2)).toEqual(['fsc_effect_claim_draft:customer_email', 'fsc_effect_finish_draft:customer_email']);
    });
  }
});

describe('logging follows the recorded finish result (D-032 TG-2)', () => {
  it.each([
    ['succeeded, finish STALE_LEASE', { kind: 'succeeded', receiptId: 'crm-x' } as CrmOutcome, (): RpcResult => ({ code: 'STALE_LEASE' }), ['crm_pending']],
    ['succeeded, finish EXPIRED', { kind: 'succeeded', receiptId: 'crm-x' } as CrmOutcome, (): RpcResult => ({ code: 'EXPIRED' }), ['crm_pending']],
    ['succeeded, finish RPC throws (RPC_FAILURE)', { kind: 'succeeded', receiptId: 'crm-x' } as CrmOutcome, (): RpcResult => { throw new Error('RECEIPT_UNAVAILABLE'); }, ['crm_pending']],
    ['succeeded, finish SUCCEEDED', { kind: 'succeeded', receiptId: 'crm-x' } as CrmOutcome, (): RpcResult => ({ code: 'SUCCEEDED', receipt_id: RECEIPT }), []],
    ['conflict, finish FAILED', { kind: 'conflict' } as CrmOutcome, (): RpcResult => ({ code: 'FAILED', receipt_id: RECEIPT }), ['crm_failed']],
    ['conflict, finish UNCERTAIN (backstop)', { kind: 'conflict' } as CrmOutcome, (): RpcResult => ({ code: 'UNCERTAIN', receipt_id: RECEIPT }), ['crm_pending']],
    ['validation, finish STALE_LEASE', { kind: 'validation' } as CrmOutcome, (): RpcResult => ({ code: 'STALE_LEASE' }), ['crm_pending']],
    ['configuration, finish RPC throws', { kind: 'configuration' } as CrmOutcome, (): RpcResult => { throw new Error('RECEIPT_UNAVAILABLE'); }, ['crm_pending']],
  ] as const)('%s → %j', async (_label, outcome, finishResult, log) => {
    const h = harness({ crmFinishResult: finishResult });
    expect(await run(h, crmRecorder(outcome).crm)).toEqual(OK_RESULT);
    expect(crmLogs()).toEqual(log);
    expect(h.sends).toHaveLength(2);
  });
});

describe('claim outcomes and malformed claims (no post, no finish, result unchanged)', () => {
  it.each(['BUSY', 'EXPIRED', 'CUTOFF', 'PRIMARY_PENDING', 'NOT_FOUND', 'SKIPPED', 'SOMETHING_NEW'])('%s → crm_pending', async code => {
    const h = harness({ crmClaim: () => { const r = { code }; assertShape(r, REAL_RPC_SHAPES.codeOnly); return r; } });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    expect(finishOf(h, 'crm_lead')).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends).toHaveLength(2);
  });

  it('SUCCEEDED → returns quietly: no post, no finish, no log', async () => {
    const h = harness({ crmClaim: () => ({ code: 'SUCCEEDED' }) });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    expect(finishOf(h, 'crm_lead')).toHaveLength(0);
    expect(crmLogs()).toEqual([]);
  });

  it.each([
    ['missing lease_token', () => { const c = crmClaimed(); delete c.lease_token; return c; }],
    ['numeric lease_token', () => crmClaimed({ lease_token: 12345 })],
    ['unparseable lease_until', () => crmClaimed({ lease_until: 'not-a-time' })],
    ['missing lease_until', () => { const c = crmClaimed(); delete c.lease_until; return c; }],
    ['missing retry_cutoff', () => { const c = crmClaimed(); delete c.retry_cutoff; return c; }],
    ['missing payload (e.g. claim routed to fsc_effect_claim_draft)', () => claimed('crm_lead')],
    ['null payload', () => crmClaimed({ payload: null })],
    ['array payload', () => crmClaimed({ payload: [STORED_PAYLOAD] })],
    ['string payload', () => crmClaimed({ payload: JSON.stringify(STORED_PAYLOAD) })],
  ])('malformed CLAIMED (%s) → crm_pending, lease left to expire', async (_label, make) => {
    const h = harness({ crmClaim: make as () => RpcResult });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    expect(finishOf(h, 'crm_lead')).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends).toHaveLength(2);
  });
});

describe('throw paths never escape (result unchanged, customer_email still runs)', () => {
  it('the claim RPC throws → crm_pending, no post', async () => {
    const h = harness({ throwOn: name => name === 'fsc_crm_claim_draft' });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends).toHaveLength(2);
  });

  it.each([
    ['synchronous throw', () => { throw new Error('synthetic defect'); }],
    ['rejection', () => Promise.reject(new TypeError('synthetic rejection'))],
    ['non-Error throw', () => { throw 42; }],
  ])('crm.post %s → finished uncertain/ambiguous', async (_label, post) => {
    const h = harness();
    expect(await run(h, { post: post as unknown as CrmDependencies['post'] })).toEqual(OK_RESULT);
    expect(finishOf(h, 'crm_lead').map(c => [c.args.p_state, c.args.p_error])).toEqual([['uncertain', 'ambiguous']]);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends).toHaveLength(2);
  });

  it('crm.post resolving to a non-object is contained', async () => {
    const h = harness();
    expect(await run(h, { post: async () => undefined as unknown as CrmOutcome })).toEqual(OK_RESULT);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends).toHaveLength(2);
  });

  it('the crm_lead finish RPC throws → result unchanged and customer_email still runs', async () => {
    const h = harness({ throwOn: (name, args) => name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead' });
    expect(await run(h, crmRecorder({ kind: 'conflict' }).crm)).toEqual(OK_RESULT);
    expect(h.names.slice(-2)).toEqual(['fsc_effect_claim_draft:customer_email', 'fsc_effect_finish_draft:customer_email']);
    expect(h.sends).toHaveLength(2);
  });
});

describe('budget (invariant 7 as corrected by D-031 M-1) with an exact elapsed clock', () => {
  const afterPrime = (elapsed: number): Partial<Record<string, Hook>> => ({ fsc_prime_record_draft: clock => { clock.value = elapsed; } });
  const msOf = (signal: AbortSignal) => {
    const ms = timeouts.get(signal);
    expect(ms, 'signal was created by AbortSignal.timeout').toBeTypeOf('number');
    return ms!;
  };

  it('5999 ms remaining → no claim, crm_pending, customer_email still sent', async () => {
    const h = harness({ onRpc: afterPrime(9001) });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(h.names).toEqual(NO_CRM_NAMES);
    expect(posts).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(h.sends.map(s => s.envelope.to)).toEqual(['info@floridasecurityconcepts.com', 'visitor@example.invalid']);
  });

  it('exactly 6000 ms remaining → window min(7000, 6000−3000)=3000 → post timeout 2000 ms', async () => {
    const h = harness({ onRpc: afterPrime(9000) });
    const { crm, posts } = crmRecorder();
    await run(h, crm);
    expect(posts).toHaveLength(1);
    expect(msOf(posts[0].signal)).toBe(2000);
  });

  it('a full budget caps the window at 7000 and the POST at 4000 ms', async () => {
    const h = harness();
    const { crm, posts } = crmRecorder();
    await run(h, crm);
    expect(msOf(posts[0].signal)).toBe(4000);
  });

  it('claim and finish RPCs use their own ≤1500 ms signals (never the shared 8 s signal) and only p_slug/p_request/finish args', async () => {
    const signals: Record<string, AbortSignal> = {};
    const h = harness();
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => { if (name === 'fsc_crm_claim_draft' || (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead')) signals[name] = signal; return rpc(name, args, signal); };
    await run(h, crmRecorder().crm);
    expect(msOf(signals.fsc_crm_claim_draft)).toBe(1500);
    expect(msOf(signals.fsc_effect_finish_draft)).toBe(1500);
  });

  it('time spent in the claim is charged to the window: 3500 ms used of 7000 → post timeout 2500 ms', async () => {
    const h = harness({ onRpc: { fsc_crm_claim_draft: clock => { clock.value = 3_500; } } });
    const { crm, posts } = crmRecorder();
    await run(h, crm);
    expect(msOf(posts[0].signal)).toBe(2500);
  });

  it('2000 ms of window left at post time → 1000 ms timeout (boundary still posts); the finish gets what is left, ≤1500 ms', async () => {
    const signals: AbortSignal[] = [];
    const h = harness({ onRpc: { fsc_crm_claim_draft: clock => { clock.value = 5_000; } } });
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => { if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') signals.push(signal); return rpc(name, args, signal); };
    const { crm, posts } = crmRecorder(async (_raw, signal) => { h.clock.value += msOf(signal); return { kind: 'ambiguous' }; });
    await run(h, crm);
    expect(posts).toHaveLength(1);
    expect(msOf(posts[0].signal)).toBe(1000);
    expect(msOf(signals[0])).toBe(1000);
  });

  it('1999 ms of window left at post time → no post; finished uncertain/cutoff (D-032 R2-N1) with a finish signal inside the window; crm_pending', async () => {
    const signals: AbortSignal[] = [];
    const h = harness({ onRpc: { fsc_crm_claim_draft: clock => { clock.value = 5_001; } } });
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => { if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') signals.push(signal); return rpc(name, args, signal); };
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    const finishes = finishOf(h, 'crm_lead');
    expect(finishes.map(c => [c.args.p_state, c.args.p_provider_id, c.args.p_error])).toEqual([['uncertain', null, 'cutoff']]);
    expect(msOf(signals[0])).toBe(1500); // min(1500, 7000 − 5001)
    expect(crmLogs()).toEqual(['crm_pending']);
  });

  it('window nearly exhausted by the claim (entry 6000, claim used 2600) → cutoff finish signal is capped by the window left (400 ms)', async () => {
    const signals: AbortSignal[] = [];
    let customerRemaining = -1;
    const h = harness({ onRpc: { fsc_prime_record_draft: clock => { clock.value = 9_000; }, fsc_crm_claim_draft: clock => { clock.value = 11_600; }, 'fsc_effect_claim_draft:customer_email': clock => { customerRemaining = 15_000 - clock.value; } } });
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => {
      if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') { signals.push(signal); h.clock.value += msOf(signal); }
      return rpc(name, args, signal);
    };
    expect(await run(h, crmRecorder().crm)).toEqual(OK_RESULT);
    expect(finishOf(h, 'crm_lead').map(c => [c.args.p_state, c.args.p_error])).toEqual([['uncertain', 'cutoff']]);
    expect(msOf(signals[0])).toBe(400);
    expect(customerRemaining).toBeGreaterThanOrEqual(3000);
  });

  it.each([
    ['lease_until', 2500, 1500, true],
    ['lease_until', 2000, 1000, true],
    ['lease_until', 1999, 0, false],
    ['retry_cutoff', 2500, 1500, true],
    ['retry_cutoff', 1999, 0, false],
  ] as const)('%s %i ms away (frozen wall clock) → timeout %i ms / post=%s', async (field, away, expectedMs, posted) => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const h = harness({ crmClaim: () => crmClaimed({ [field]: iso(FIXED_NOW + away) }) });
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(posted ? 1 : 0);
    if (posted) expect(msOf(posts[0].signal)).toBe(expectedMs);
    else {
      expect(crmLogs()).toEqual(['crm_pending']);
      expect(finishOf(h, 'crm_lead').map(c => [c.args.p_state, c.args.p_error])).toEqual([['uncertain', 'cutoff']]);
    }
  });

  // Adversarial: every CRM RPC and the POST consume (almost) their entire abort budget.
  const entries = [6000, 6001, 6500, 7000, 8000, 9999, 10_000, 12_000, 15_000];
  it.each(entries)('customer_email keeps ≥3000 ms whatever the CRM does (entry remaining %i ms, claim/POST/finish all stall to their limits)', async entry => {
    let customerRemaining = -1;
    const h = harness({ onRpc: { ...afterPrime(15_000 - entry), 'fsc_effect_claim_draft:customer_email': clock => { customerRemaining = 15_000 - clock.value; } } });
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => {
      if (name === 'fsc_crm_claim_draft') { const out = await rpc(name, args, signal); h.clock.value += msOf(signal) - 1; return out; }
      if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') { h.clock.value += msOf(signal); throw new DOMException('aborted', 'TimeoutError'); }
      return rpc(name, args, signal);
    };
    const { crm } = crmRecorder(async (_raw, signal) => { h.clock.value += msOf(signal); return { kind: 'ambiguous' }; });
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(customerRemaining).toBeGreaterThanOrEqual(3000);
    const customer = h.sends.find(s => s.envelope.to === 'visitor@example.invalid');
    expect(customer, 'customer_email send attempted').toBeDefined();
    expect(msOf(customer!.signal)).toBeGreaterThanOrEqual(2000);
  });

  it.each(entries)('customer_email keeps ≥3000 ms when the claim RPC itself stalls until aborted (entry remaining %i ms)', async entry => {
    let customerRemaining = -1;
    const h = harness({ onRpc: { ...afterPrime(15_000 - entry), 'fsc_effect_claim_draft:customer_email': clock => { customerRemaining = 15_000 - clock.value; } } });
    const rpc = h.rpc;
    h.rpc = async (name, args, signal) => {
      if (name === 'fsc_crm_claim_draft') { h.clock.value += msOf(signal); throw new DOMException('aborted', 'TimeoutError'); }
      return rpc(name, args, signal);
    };
    const { crm, posts } = crmRecorder();
    expect(await run(h, crm)).toEqual(OK_RESULT);
    expect(posts).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerRemaining).toBeGreaterThanOrEqual(3000);
    expect(h.sends.map(s => s.envelope.to)).toContain('visitor@example.invalid');
  });
});

describe('preview isolation (invariant 9) through the real dispatcher', () => {
  it('a hosted preview with valid CRM configuration refuses before any fetch', async () => {
    const { deliverLead } = await import('../../lib/leads/leadDelivery');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const [key, value] of Object.entries({
      LEAD_DELIVERY_MODE: 'resend+supabase', FSC_LOCAL_PREVIEW: '', VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: '',
      PRIME_SUPABASE_URL: 'https://prime-synthetic.example.invalid', PRIME_SUPABASE_SERVICE_ROLE_KEY: 'synthetic', PRIME_ACCOUNT_SLUG: 'fsc', RESEND_API_KEY: 're_synthetic',
      LEAD_NOTIFICATION_FROM: 'FSC Synthetic <notify@example.invalid>', FSC_ADMISSION_HMAC_KEY: '4a'.repeat(32),
      FSC_CRM_INTAKE_URL: 'https://izhandnebyywemsjisye.supabase.co/functions/v1/crm-intake', FSC_CRM_INTAKE_HMAC_SECRET: 'synthetic-unit-crm-secret-0123456789abcdef',
    })) vi.stubEnv(key, value);
    try {
      expect(await deliverLead(lead, lead.requestId, new Headers({ 'x-vercel-forwarded-for': '203.0.113.5' }))).toMatchObject({ ok: false, code: 'CONFIGURATION', status: 503 });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
  });
});
