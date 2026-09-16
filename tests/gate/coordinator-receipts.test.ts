// Production receipt coordinator (lib/leads/productionReceipt.ts) against real
// PostgreSQL 17. The real productionDependencies() rpc/send code runs unchanged;
// only the network is faked (Resend endpoint + PostgREST-shaped endpoint that
// executes the real RPC in the isolated database as service_role).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import type pg from 'pg';
import { deliverProductionReceipt, productionDependencies } from '../../lib/leads/productionReceipt';
import { validateLead } from '../../lib/leads/validateLead';
import { POST } from '../../app/api/leads/route';
import { validLead } from '../fixtures/lead';
import { count, FSC_ACCOUNT, privateTableText, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { expireLease, setReceiptAge } from '../helpers/receipt-time';
import { createPrimeRestEmulator, createResendFake, installTransport, PRIME_BASE, RESEND_URL } from '../helpers/transport';

const COMPANY = 'info@floridasecurityconcepts.com';
const ENV: Record<string, string> = {
  PRIME_SUPABASE_URL: PRIME_BASE,
  PRIME_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role-key-not-a-secret',
  PRIME_ACCOUNT_SLUG: 'fsc',
  RESEND_API_KEY: 're_synthetic_not_a_secret',
  LEAD_NOTIFICATION_FROM: 'FSC Synthetic <notify@example.invalid>',
  LEAD_CONFIRMATION_ENABLED: 'true',
  LEAD_CONFIRMATION_FROM: '',
  LEAD_CONFIRMATION_REPLY_TO: '',
  FSC_ADMISSION_HMAC_KEY: '5c'.repeat(32),
};

let cluster: Cluster;
let db: TestDatabase;
let resend: ReturnType<typeof createResendFake>;
let prime: ReturnType<typeof createPrimeRestEmulator>;
let transport: ReturnType<typeof installTransport>;

beforeAll(async () => { cluster = await startCluster(); db = await cluster.database(); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);
function useDatabase(target: TestDatabase) {
  resend = createResendFake();
  prime = createPrimeRestEmulator(target.service, ENV.PRIME_SUPABASE_SERVICE_ROLE_KEY);
  transport = installTransport(resend, prime);
}
beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  useDatabase(db);
});
afterEach(() => {
  expect(transport.unexpected).toEqual([]);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function makeLead(overrides: Record<string, unknown> = {}) {
  const result = validateLead({ ...validLead, requestId: randomUUID(), ...overrides });
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.lead;
}
type Lead = ReturnType<typeof makeLead>;
const freshSource = () => randomBytes(32).toString('hex');
const deliver = (lead: Lead, source: string | null = freshSource(), deps = productionDependencies()) => deliverProductionReceipt(lead, lead.requestId!, deps, source);
const effect = async (request: string, name: string, client: pg.Client = db.admin) => (await rows(client, `SELECT state, idempotency_key, provider_id, error_category, lease_token::text AS token FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = $2`, [request, name]))[0];
const receipt = async (request: string, client: pg.Client = db.admin) => (await rows(client, `SELECT receipt_id, prime_lead_id, payload, envelopes, created_at, accepted_at FROM fsc_private.assessment_receipts WHERE request_id = $1`, [request]))[0];
const leadCount = async (request: string) => count(db.admin, `SELECT count(*) FROM public.leads l JOIN fsc_private.assessment_receipts r ON r.prime_lead_id = l.id WHERE r.request_id = $1`, [request]);
const companyCalls = () => resend.callsTo(COMPANY);

describe('primary success and retries', { timeout: 60_000 }, () => {
  it('success: one company send (claim key, stored envelope, approved inbox), one Prime lead, customer copy when enabled', async () => {
    const lead = makeLead();
    const result = await deliver(lead);
    const stored = await receipt(lead.requestId!);
    expect(result).toMatchObject({ ok: true, deliveryId: stored.receipt_id, supabaseStatus: 'ok' });
    expect(resend.calls).toHaveLength(2);
    const company = await effect(lead.requestId!, 'company_email');
    const customer = await effect(lead.requestId!, 'customer_email');
    expect(resend.calls[0]).toMatchObject({ method: 'POST', key: company.idempotency_key, authorization: `Bearer ${ENV.RESEND_API_KEY}`, contentType: 'application/json' });
    expect(resend.calls[0].body).toEqual(stored.envelopes.company_email);
    expect(resend.calls[0].body).toMatchObject({ to: COMPANY, from: ENV.LEAD_NOTIFICATION_FROM, reply_to: lead.email });
    expect(resend.calls[1]).toMatchObject({ key: customer.idempotency_key });
    expect(resend.calls[1].body).toEqual(stored.envelopes.customer_email);
    expect(resend.calls[1].body.to).toBe(lead.email);
    expect(company).toMatchObject({ state: 'succeeded', provider_id: resend.accepted.get(company.idempotency_key)!.id, token: null });
    expect(customer).toMatchObject({ state: 'succeeded', token: null });
    expect(await effect(lead.requestId!, 'prime_lead')).toMatchObject({ state: 'succeeded' });
    expect(await leadCount(lead.requestId!)).toBe(1);
    expect(stored.accepted_at).not.toBeNull();
    const [{ template_version: template }] = await rows(db.admin, `SELECT template_version FROM fsc_private.assessment_receipts WHERE request_id = $1`, [lead.requestId]);
    expect(template).toBe('fsc-assessment-v3');
    const customerRendered = `${resend.calls[1].body.subject}
${resend.calls[1].body.text}
${resend.calls[1].body.html}`;
    for (const echoed of [lead.fullName, lead.message!, lead.city!]) expect(customerRendered.includes(echoed), `customer copy echoes ${echoed}`).toBe(false);
    const names = prime.calls.map(call => `${call.name}:${call.args.p_effect ?? ''}`);
    expect(names.slice(0, 3)).toEqual(['fsc_receipt_create_draft:', 'fsc_effect_claim_draft:company_email', 'fsc_effect_finish_draft:company_email']);
    expect(prime.calls.every(call => call.args.p_slug === 'fsc' && call.args.p_request === lead.requestId)).toBe(true);
  });

  it('customer copy disabled: customer effect skipped and exactly one provider call', async () => {
    vi.stubEnv('LEAD_CONFIRMATION_ENABLED', 'false');
    const lead = makeLead();
    expect(await deliver(lead)).toMatchObject({ ok: true, supabaseStatus: 'ok' });
    expect(resend.calls.map(call => call.body.to)).toEqual([COMPANY]);
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'skipped' });
    expect(await leadCount(lead.requestId!)).toBe(1);
  });

  it('an unchanged retry after success sends nothing new, inserts no lead and returns the same receipt', async () => {
    const lead = makeLead();
    const source = freshSource();
    const first = await deliver(lead, source);
    const callsAfterFirst = resend.calls.length;
    const second = await deliver(lead, source);
    const third = await deliver(lead, null);
    expect(first.ok && second.ok && third.ok).toBe(true);
    expect(second).toMatchObject({ ok: true, deliveryId: (first as { deliveryId: string }).deliveryId });
    expect(third).toMatchObject({ ok: true, deliveryId: (first as { deliveryId: string }).deliveryId });
    expect(resend.calls.length).toBe(callsAfterFirst);
    expect(await leadCount(lead.requestId!)).toBe(1);
    const [{ n }] = await rows(db.admin, `SELECT cardinality(admitted_at) AS n FROM fsc_private.admission_counters WHERE source_digest = $1`, [source]);
    expect(n).toBe(1);
  });

  it('a retry with different attribution and submittedAt reuses the frozen envelope/key and never rewrites stored payload or timestamps', async () => {
    const lead = makeLead({ utmSource: 'synthetic-first-source', sourcePage: '/first-page' });
    resend.next({ status: 500 });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    const before = await receipt(lead.requestId!);
    const changed = { ...makeLead({ requestId: lead.requestId, utmSource: 'synthetic-changed-source', utmCampaign: 'changed', sourcePage: '/changed-page' }), submittedAt: '2030-01-01T00:00:00.000Z' };
    const result = await deliver(changed);
    expect(result).toMatchObject({ ok: true, deliveryId: before.receipt_id });
    const company = companyCalls();
    expect(company).toHaveLength(2);
    expect(company[1].key).toBe(company[0].key);
    expect(company[1].body).toEqual(company[0].body);
    expect(company[1].body.text).toContain(lead.submittedAt);
    expect(company[1].body.text).toContain('synthetic-first-source');
    expect(JSON.stringify(company[1].body)).not.toContain('synthetic-changed-source');
    expect(JSON.stringify(company[1].body)).not.toContain('2030-01-01');
    const after = await receipt(lead.requestId!);
    expect({ payload: after.payload, envelopes: after.envelopes, created: after.created_at.getTime() }).toEqual({ payload: before.payload, envelopes: before.envelopes, created: before.created_at.getTime() });
    const [leadRow] = await rows(db.admin, `SELECT utm_source FROM public.leads WHERE id = $1`, [after.prime_lead_id]);
    expect(leadRow.utm_source).toBe('synthetic-first-source');
  });
});

describe('ambiguous company sends and crash recovery', { timeout: 60_000 }, () => {
  it('a send that never answers is aborted at the 8 s cap → 504; the same-ID retry reuses the key/envelope and records success once', async () => {
    const lead = makeLead();
    const source = freshSource();
    resend.next('hang');
    const started = Date.now();
    const first = await deliver(lead, source);
    const elapsed = Date.now() - started;
    expect(first).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(elapsed).toBeGreaterThanOrEqual(7500);
    expect(elapsed).toBeLessThan(9500);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', token: null });
    expect(await leadCount(lead.requestId!)).toBe(0);
    expect(resend.calls.filter(call => call.body.to === lead.email)).toHaveLength(0);

    const second = await deliver(lead, source);
    expect(second).toMatchObject({ ok: true });
    const company = companyCalls();
    expect(company).toHaveLength(2);
    expect(company[1].key).toBe(company[0].key);
    expect(company[1].body).toEqual(company[0].body);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'succeeded' });
    expect(await leadCount(lead.requestId!)).toBe(1);
    await deliver(lead, source);
    expect(companyCalls()).toHaveLength(2);
  });

  it.each([
    ['network error', 'network' as const],
    ['provider 500', { status: 500 }],
    ['provider 429', { status: 429, body: { name: 'rate_limit_exceeded' } }],
    ['2xx without an id', { status: 200, body: {} }],
    ['accepted but the response was lost', 'accept-then-lose-response' as const],
  ])('%s → 504 uncertain/ambiguous; retry reuses the key and the provider holds exactly one delivery', async (_label, behavior) => {
    const lead = makeLead();
    resend.next(behavior);
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', token: null });
    expect(await deliver(lead)).toMatchObject({ ok: true });
    const company = companyCalls();
    expect(company).toHaveLength(2);
    expect(new Set(company.map(call => call.key)).size).toBe(1);
    expect(company[1].body).toEqual(company[0].body);
    expect(resend.accepted.has(company[0].key!)).toBe(true);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'succeeded', provider_id: resend.accepted.get(company[0].key!)!.id });
    expect(await leadCount(lead.requestId!)).toBe(1);
  });

  it('process death after provider acceptance (finish never reaches the DB) → 504; retry is PENDING while the lease lives, then recovers with the same key', async () => {
    const lead = makeLead();
    const source = freshSource();
    prime.fail('fsc_effect_finish_draft', 'network');
    expect(await deliver(lead, source)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    const firstKey = companyCalls()[0].key!;
    const firstId = resend.accepted.get(firstKey)!.id;
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'inflight', idempotency_key: firstKey });
    prime.clearFaults();

    expect(await deliver(lead, source)).toMatchObject({ ok: false, status: 409, code: 'PENDING' });
    expect(companyCalls()).toHaveLength(1);
    await expireLease(db.admin, lead.requestId!, 'company_email');
    expect(await deliver(lead, source)).toMatchObject({ ok: true });
    const company = companyCalls();
    expect(company.map(call => call.key)).toEqual([firstKey, firstKey]);
    expect(company[1].body).toEqual(company[0].body);
    expect([...resend.accepted.keys()].filter(key => key === firstKey)).toHaveLength(1);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'succeeded', provider_id: firstId });
    expect(await leadCount(lead.requestId!)).toBe(1);
  });

  it('the send abort reserves 1 s of the server budget so the uncertain outcome is still recorded (review M-6)', async () => {
    const lead = makeLead();
    const base = productionDependencies();
    let offset = 0;
    const deps = { ...base, now: () => Date.now() + offset, rpc: async (name: string, args: Record<string, unknown>, signal: AbortSignal) => { const out = await base.rpc(name, args, signal); if (name === 'fsc_effect_claim_draft') offset = 10_000; return out; } };
    resend.next('hang');
    const started = Date.now();
    expect(await deliver(lead, freshSource(), deps)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(3500);
    expect(elapsed).toBeLessThan(4700);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', token: null });
  });

  it('a budget with under 1 s left at send time never calls the provider → 504', async () => {
    const lead = makeLead();
    const base = productionDependencies();
    let offset = 0;
    const deps = { ...base, now: () => Date.now() + offset, rpc: async (name: string, args: Record<string, unknown>, signal: AbortSignal) => { const out = await base.rpc(name, args, signal); if (name === 'fsc_effect_claim_draft') offset = 14_200; return out; } };
    expect(await deliver(lead, freshSource(), deps)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(resend.calls).toHaveLength(0);
  });

  it('a claim refused at the provider retry cutoff → 504 with no provider call', async () => {
    const lead = makeLead();
    resend.next({ status: 503 });
    expect(await deliver(lead)).toMatchObject({ status: 504 });
    await db.admin.query('BEGIN');
    await db.admin.query('SET LOCAL session_replication_role = replica');
    await db.admin.query(`UPDATE fsc_private.assessment_effects SET first_attempt_at = first_attempt_at - interval '23 hours 55 minutes', retry_cutoff = retry_cutoff - interval '23 hours 55 minutes' WHERE request_id = $1 AND effect = 'company_email'`, [lead.requestId]);
    await db.admin.query('COMMIT');
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(resend.calls).toHaveLength(1);
  });

  it.each([['create', 'fsc_receipt_create_draft'], ['company claim', 'fsc_effect_claim_draft']])('an RPC failure on %s before primary acceptance → 504 with no provider call', async (_label, name) => {
    const lead = makeLead();
    prime.fail(name, { status: 500 });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(resend.calls).toHaveLength(0);
  });
});

describe('provider rejections and conflicts', { timeout: 60_000 }, () => {
  it.each([400, 401, 403, 422])('first-attempt definitive Resend %i → 503 DELIVERY_FAILED, effect failed/configuration, no Prime lead and no customer send', async status => {
    const lead = makeLead();
    resend.next({ status, body: { name: 'validation_error' } });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 503, code: 'DELIVERY_FAILED' });
    expect(resend.calls).toHaveLength(1);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'failed', error_category: 'configuration', token: null });
    expect(prime.calls.filter(call => call.args.p_effect === 'prime_lead' || call.name === 'fsc_prime_record_draft')).toEqual([]);
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'pending' });
    expect(await leadCount(lead.requestId!)).toBe(0);
  });

  it('a retry of an UNCERTAIN company email that meets a definitive 422 → 504 RECEIPT_UNKNOWN and the effect is never recorded failed (D-023)', async () => {
    const lead = makeLead();
    resend.next({ status: 500 }, { status: 422, body: { name: 'validation_error' } });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'uncertain', error_category: 'configuration', token: null });
    expect(new Set(companyCalls().map(call => call.key)).size).toBe(1);
    expect(companyCalls()).toHaveLength(2);
    expect(await leadCount(lead.requestId!)).toBe(0);
  });

  it('a first-attempt 422 is failed/503 and a same-ID retry meeting 422 again stays failed/503 with the same key (round-2 contract)', async () => {
    const lead = makeLead();
    resend.next({ status: 422 }, { status: 422 });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 503, code: 'DELIVERY_FAILED' });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 503, code: 'DELIVERY_FAILED' });
    expect(companyCalls().map(call => call.key)).toEqual([companyCalls()[0].key, companyCalls()[0].key]);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'failed', error_category: 'configuration' });
  });

  it('a send transport that throws → 504 RECEIPT_UNKNOWN (never 503), with no Prime lead or customer send (D-023)', async () => {
    const lead = makeLead();
    const base = productionDependencies();
    let sends = 0;
    const deps = { ...base, send: async () => { sends += 1; throw new Error('synthetic transport defect'); } };
    expect(await deliver(lead, freshSource(), deps)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(sends).toBe(1);
    expect(await leadCount(lead.requestId!)).toBe(0);
    expect(prime.calls.filter(call => call.args.p_effect === 'prime_lead' || call.args.p_effect === 'customer_email')).toEqual([]);
  });

  it('a company effect in state skipped is not treated as acceptance → 504 with no secondary effects (review N-1)', async () => {
    const lead = makeLead();
    resend.next({ status: 500 });
    await deliver(lead);
    await db.admin.query(`UPDATE fsc_private.assessment_effects SET state = 'skipped', error_category = NULL WHERE request_id = $1 AND effect = 'company_email'`, [lead.requestId]);
    const before = prime.calls.length;
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(prime.calls.slice(before).filter(call => call.args.p_effect === 'prime_lead' || call.args.p_effect === 'customer_email' || call.name === 'fsc_prime_record_draft')).toEqual([]);
    expect(await leadCount(lead.requestId!)).toBe(0);
    expect(resend.calls).toHaveLength(1);
  });

  it('Resend 409 concurrent idempotent request → 409 PENDING without finishing (lease left to expire)', async () => {
    const lead = makeLead();
    resend.next({ status: 409, body: { name: 'concurrent_idempotent_requests' } });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 409, code: 'PENDING' });
    expect(prime.calls.filter(call => call.name === 'fsc_effect_finish_draft')).toEqual([]);
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'inflight' });
  });

  it('Resend 409 payload mismatch → 504, uncertain/configuration, and a retry never uses a new key', async () => {
    const lead = makeLead();
    resend.next({ status: 409, body: { name: 'invalid_idempotent_request' } });
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
    expect(await effect(lead.requestId!, 'company_email')).toMatchObject({ state: 'uncertain', error_category: 'configuration' });
    await deliver(lead);
    expect(new Set(companyCalls().map(call => call.key)).size).toBe(1);
  });

  it('BUSY: another worker holds the company lease → 409 PENDING with no provider call', async () => {
    const lead = makeLead();
    resend.next({ status: 409, body: { name: 'concurrent_idempotent_requests' } });
    await deliver(lead);
    const callsBefore = resend.calls.length;
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 409, code: 'PENDING' });
    expect(resend.calls.length).toBe(callsBefore);
  });

  it('changed payload → 409 CONFLICT and expired ID → 409 EXPIRED, neither sends nor adds effects', async () => {
    const lead = makeLead();
    await deliver(lead);
    const calls = resend.calls.length;
    const effects = await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [lead.requestId]);
    expect(await deliver(makeLead({ requestId: lead.requestId, message: 'A different synthetic message' }))).toMatchObject({ ok: false, status: 409, code: 'CONFLICT' });
    await setReceiptAge(db.admin, lead.requestId!, '24 hours');
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 409, code: 'EXPIRED' });
    expect(resend.calls.length).toBe(calls);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [lead.requestId])).toBe(effects);
  });
});

describe('secondary effects never change primary success', { timeout: 60_000 }, () => {
  it('Prime record failure keeps 200; retries while leased insert nothing; a later retry records exactly one lead and never resends company', async () => {
    const lead = makeLead();
    prime.fail('fsc_prime_record_draft', { status: 503 }, 1);
    expect(await deliver(lead)).toMatchObject({ ok: true, supabaseStatus: 'failed' });
    expect(await leadCount(lead.requestId!)).toBe(0);
    expect(await deliver(lead)).toMatchObject({ ok: true });
    expect(await leadCount(lead.requestId!)).toBe(0);
    await expireLease(db.admin, lead.requestId!, 'prime_lead');
    expect(await deliver(lead)).toMatchObject({ ok: true, supabaseStatus: 'ok' });
    expect(await leadCount(lead.requestId!)).toBe(1);
    expect(await deliver(lead)).toMatchObject({ ok: true, supabaseStatus: 'ok' });
    expect(await leadCount(lead.requestId!)).toBe(1);
    expect(companyCalls()).toHaveLength(1);
  });

  it('Prime claim transport error keeps 200 and the next retry records one lead', async () => {
    const lead = makeLead();
    let primeClaims = 0;
    const base = productionDependencies();
    const deps = { ...base, rpc: async (name: string, args: Record<string, unknown>, signal: AbortSignal) => { if (name === 'fsc_effect_claim_draft' && args.p_effect === 'prime_lead' && primeClaims++ === 0) throw new TypeError('fetch failed'); return base.rpc(name, args, signal); } };
    expect(await deliver(lead, freshSource(), deps)).toMatchObject({ ok: true, supabaseStatus: 'failed' });
    expect(await leadCount(lead.requestId!)).toBe(0);
    expect(await deliver(lead, freshSource(), deps)).toMatchObject({ ok: true, supabaseStatus: 'ok' });
    expect(await leadCount(lead.requestId!)).toBe(1);
    expect(companyCalls()).toHaveLength(1);
  });

  it('customer copy failure keeps 200; a retry resends only the customer copy with the same key and never the company email', async () => {
    const lead = makeLead();
    resend.next('normal', { status: 500 });
    expect(await deliver(lead)).toMatchObject({ ok: true });
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'uncertain', error_category: 'ambiguous' });
    expect(await deliver(lead)).toMatchObject({ ok: true });
    const customer = resend.calls.filter(call => call.body.to === lead.email);
    expect(customer).toHaveLength(2);
    expect(customer[1].key).toBe(customer[0].key);
    expect(companyCalls()).toHaveLength(1);
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'succeeded' });
  });
});

describe('admission outcomes through the coordinator', { timeout: 60_000 }, () => {
  it('RATE_LIMIT → 429 with retryAfter from the database and no receipt or send', async () => {
    const lead = makeLead();
    const source = freshSource();
    await db.admin.query(`INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at)
      SELECT $1, $2, ARRAY(SELECT clock_timestamp() - interval '60 seconds' + g * interval '1 second' FROM generate_series(0, 19) g), clock_timestamp() + interval '9 minutes 19 seconds'`, [FSC_ACCOUNT, source]);
    const result = await deliver(lead, source);
    expect(result).toMatchObject({ ok: false, status: 429, code: 'RATE_LIMIT' });
    const retryAfter = (result as { retryAfter?: number }).retryAfter!;
    expect(retryAfter).toBeGreaterThanOrEqual(530);
    expect(retryAfter).toBeLessThanOrEqual(541);
    expect(await receipt(lead.requestId!)).toBeUndefined();
    expect(resend.calls).toHaveLength(0);
  });

  it('SOURCE_UNAVAILABLE (no trusted source) → 503 CONFIGURATION for a new ID, while an existing ID still succeeds without a source', async () => {
    const lead = makeLead();
    expect(await deliver(lead, null)).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(await receipt(lead.requestId!)).toBeUndefined();
    expect(resend.calls).toHaveLength(0);
    resend.next({ status: 500 });
    expect(await deliver(lead, freshSource())).toMatchObject({ status: 504 });
    expect(await deliver(lead, null)).toMatchObject({ ok: true });
    expect(companyCalls()).toHaveLength(2);
  });

  it('an inactive account → 503 CONFIGURATION with no send and no receipt', async () => {
    const refused = await cluster.database();
    await refused.admin.query(`UPDATE public.accounts SET status = 'inactive' WHERE slug = 'fsc'`);
    vi.unstubAllGlobals();
    useDatabase(refused);
    const lead = makeLead();
    expect(await deliver(lead)).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(resend.calls).toHaveLength(0);
    expect(await count(refused.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`)).toBe(0);
  });
});

describe('route → dispatcher → coordinator (production configuration)', { timeout: 60_000 }, () => {
  const IP = '203.0.113.77';
  const post = (lead: Record<string, unknown>, headers: Record<string, string>) => POST(new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(lead) }));
  const expectedDigest = (bytes: number[]) => createHmac('sha256', Buffer.from(ENV.FSC_ADMISSION_HMAC_KEY, 'hex')).update(Buffer.concat([Buffer.from('fsc-admission-v1\0', 'utf8'), Buffer.from(bytes)])).digest('hex');
  beforeEach(() => {
    vi.stubEnv('LEAD_DELIVERY_MODE', 'resend+supabase');
    vi.stubEnv('FSC_LOCAL_PREVIEW', '');
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_TARGET_ENV', '');
  });

  it('succeeds using the digest of x-vercel-forwarded-for, and logs contain no contact values, address, digest or keys', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined));
    prime.fail('fsc_prime_record_draft', 'network', 1); // exercise the secondary-failure log path too
    const requestId = randomUUID();
    const body = { ...validLead, requestId, fullName: 'Zephyrine Synthetic-Logcheck', phone: '4075550177', message: 'Unique synthetic log probe 7f3a' };
    const response = await post(body, { 'x-vercel-forwarded-for': IP, 'x-forwarded-for': '198.51.100.250' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, requestId });
    const digest = expectedDigest([203, 0, 113, 77]);
    expect((await rows(db.admin, `SELECT source_digest FROM fsc_private.admission_counters WHERE source_digest = $1`, [digest]))).toHaveLength(1);
    const created = prime.calls.find(call => call.name === 'fsc_receipt_create_draft')!;
    expect(created.args.p_source).toBe(digest);
    const logged = spies.flatMap(spy => spy.mock.calls).map(args => JSON.stringify(args, (_k, v) => (v instanceof Error ? v.message : v))).join('\n');
    expect(spies.reduce((total, spy) => total + spy.mock.calls.length, 0)).toBeGreaterThan(0);
    for (const forbidden of [body.email, body.fullName, body.phone, body.message, IP, '198.51.100.250', digest, ENV.FSC_ADMISSION_HMAC_KEY, ENV.RESEND_API_KEY, ENV.PRIME_SUPABASE_SERVICE_ROLE_KEY]) {
      expect(logged.includes(forbidden), `log leaked ${forbidden}`).toBe(false);
    }
    const stored = (await privateTableText(db.admin)) + (await rows(db.admin, `SELECT t::text AS t FROM public.leads t`)).map(r => r.t).join(String.fromCharCode(10));
    expect(stored).toContain(body.email); // the scan covers rows written by this request
    for (const address of [IP, '198.51.100.250']) expect(stored.includes(address), `database stores ${address}`).toBe(false);
  });

  it('without an HMAC key a new request is refused 503 with no receipt, while an earlier uncertain receipt still reconciles to 200 (D-023)', async () => {
    const requestId = randomUUID();
    const body = { ...validLead, requestId };
    resend.next({ status: 500 });
    expect((await post(body, { 'x-vercel-forwarded-for': IP })).status).toBe(504);
    vi.stubEnv('FSC_ADMISSION_HMAC_KEY', '');
    const retry = await post(body, { 'x-vercel-forwarded-for': IP });
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ ok: true, requestId });
    const company = companyCalls();
    expect(company).toHaveLength(2);
    expect(company[1].key).toBe(company[0].key);
    const fresh = randomUUID();
    const refused = await post({ ...validLead, requestId: fresh }, { 'x-vercel-forwarded-for': IP });
    expect(refused.status).toBe(503);
    expect(await refused.json()).toMatchObject({ ok: false, code: 'CONFIGURATION', requestId: fresh });
    expect(await receipt(fresh)).toBeUndefined();
    expect(companyCalls()).toHaveLength(2);
  });

  it('ignores spoofable x-forwarded-for / x-real-ip: without the Vercel header a new request is refused 503 with no receipt or send', async () => {
    const requestId = randomUUID();
    const response = await post({ ...validLead, requestId }, { 'x-forwarded-for': IP, 'x-real-ip': IP });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, code: 'CONFIGURATION', requestId });
    expect(prime.calls.filter(call => call.name === 'fsc_receipt_create_draft').map(call => call.args.p_source)).toEqual([null]);
    expect(await receipt(requestId)).toBeUndefined();
    expect(resend.calls).toHaveLength(0);
  });

  it('IPv4-mapped IPv6 shares the IPv4 counter and a full counter returns 429 with a Retry-After header', async () => {
    const digest = expectedDigest([203, 0, 113, 78]);
    await db.admin.query(`INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at)
      SELECT $1, $2, ARRAY(SELECT clock_timestamp() - interval '2 minutes' FROM generate_series(1, 20)), clock_timestamp() + interval '8 minutes'`, [FSC_ACCOUNT, digest]);
    const response = await post({ ...validLead, requestId: randomUUID() }, { 'x-vercel-forwarded-for': '::ffff:203.0.113.78' });
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ ok: false, code: 'RATE_LIMIT' });
    const header = Number(response.headers.get('retry-after'));
    expect(header).toBeGreaterThanOrEqual(475);
    expect(header).toBeLessThanOrEqual(480);
    expect(resend.calls).toHaveLength(0);
    expect(transport.fetchMock.mock.calls.every(([input]) => String(input) !== RESEND_URL)).toBe(true);
  });
});
