// S-CRM-001 coordinator behavior against real PostgreSQL 17 with the AM-005
// migration applied. The real lib/leads/productionReceipt.ts and
// lib/leads/crmIntake.ts code (productionDependencies(), crmDependencies(),
// rpc/send/post fetch code, classifiers) runs unchanged; only the network is
// replaced: the existing Resend fake, the existing PostgREST emulator (every RPC
// runs the real SQL as service_role) and a synthetic crm-intake endpoint that
// verifies the HMAC over the exact bytes it receives.
// Contract: harness/sessions/S-CRM-001-crm-intake-contract.md §6, §7, §8, §14.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { deliverProductionReceipt, productionDependencies, type ReceiptDependencies } from '../../lib/leads/productionReceipt';
import { crmDependencies } from '../../lib/leads/crmIntake';
import { validateLead } from '../../lib/leads/validateLead';
import { POST } from '../../app/api/leads/route';
import { validLead } from '../fixtures/lead';
import { callRpc, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { expireLease, setReceiptAge } from '../helpers/receipt-time';
import { createPrimeRestEmulator, createResendFake, PRIME_BASE } from '../helpers/transport';
import { createCrmFake, crmDatabase, CRM_HOST, CRM_SECRET, CRM_URL, expectedSignature, installCrmTransport, VALIDATED_LEAD_KEYS, type CrmBehavior } from '../helpers/crm';

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
  FSC_ADMISSION_HMAC_KEY: '6d'.repeat(32),
  FSC_CRM_INTAKE_URL: CRM_URL,
  FSC_CRM_INTAKE_HMAC_SECRET: CRM_SECRET,
};
const CRM_LOGS = new Set(['crm_configuration', 'crm_pending', 'crm_failed']);

/** The pre-AM-005 coordinator sequence (AM-003 contract), pinned literally. */
const NO_CRM_TIMELINE = [
  'rpc:fsc_receipt_create_draft', 'rpc:fsc_effect_claim_draft:company_email', 'resend:company', 'rpc:fsc_effect_finish_draft:company_email',
  'rpc:fsc_effect_claim_draft:prime_lead', 'rpc:fsc_prime_record_draft',
  'rpc:fsc_effect_claim_draft:customer_email', 'resend:customer', 'rpc:fsc_effect_finish_draft:customer_email',
];
const CRM_TIMELINE = [
  'rpc:fsc_receipt_create_draft', 'rpc:fsc_effect_claim_draft:company_email', 'resend:company', 'rpc:fsc_effect_finish_draft:company_email',
  'rpc:fsc_effect_claim_draft:prime_lead', 'rpc:fsc_prime_record_draft',
  'rpc:fsc_crm_claim_draft', 'crm:post', 'rpc:fsc_effect_finish_draft:crm_lead',
  'rpc:fsc_effect_claim_draft:customer_email', 'resend:customer', 'rpc:fsc_effect_finish_draft:customer_email',
];
/**
 * Real AbortSignal timers fire late when the whole gate suite runs 12 PostgreSQL clusters in parallel.
 * The exact ≥3000 ms customer reserve is proven with a deterministic clock in tests/unit/crm-coordinator.test.ts;
 * here, against real time and real SQL, allow this much lateness.
 */
const JITTER_MS = 400;
const EXPECTED_OK = { ok: true, mode: 'resend+supabase', deliveryId: '<RECEIPT>', supabaseStatus: 'ok' };

let cluster: Cluster;
let crmDb: TestDatabase; // AM-003 + AM-005
let plainDb: TestDatabase; // AM-003 only (the schema production has before Brian applies AM-005)
let db: TestDatabase;
let resend: ReturnType<typeof createResendFake>;
let prime: ReturnType<typeof createPrimeRestEmulator>;
let crm: ReturnType<typeof createCrmFake>;
let transport: ReturnType<typeof installCrmTransport>;
let spies: ReturnType<typeof vi.spyOn>[];
let usedLeads: Record<string, unknown>[];

beforeAll(async () => { cluster = await startCluster(); crmDb = await crmDatabase(cluster); plainDb = await cluster.database('migrated'); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);
function useDatabase(target: TestDatabase) {
  db = target;
  resend = createResendFake();
  prime = createPrimeRestEmulator(target.service, ENV.PRIME_SUPABASE_SERVICE_ROLE_KEY);
  crm = createCrmFake();
  transport = installCrmTransport(resend, prime, crm);
}
beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  useDatabase(crmDb);
  usedLeads = [];
  spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined));
});
afterEach(() => {
  expect(transport.unexpected).toEqual([]);
  // Invariant 8 / §6: log lines are fixed category strings only.
  const calls = spies.flatMap(spy => spy.mock.calls as unknown[][]);
  for (const args of calls.filter(a => a[0] === '[lead-receipt]' && String(a[1]).startsWith('crm_'))) {
    expect(args.length).toBe(2);
    expect(CRM_LOGS.has(String(args[1])), `unexpected crm log ${String(args[1])}`).toBe(true);
  }
  const logged = calls.map(args => JSON.stringify(args, (_k, v) => (v instanceof Error ? v.message : v))).join('\n');
  const forbidden = [CRM_SECRET, CRM_URL, CRM_HOST, ENV.PRIME_SUPABASE_SERVICE_ROLE_KEY, ENV.RESEND_API_KEY, ...crm.calls.flatMap(c => [c.raw, c.signature ?? '<none>'])];
  for (const lead of usedLeads) for (const key of ['email', 'fullName', 'phone', 'message']) if (typeof lead[key] === 'string') forbidden.push(lead[key] as string);
  for (const value of forbidden) expect(logged.includes(value), `log leaked ${value.slice(0, 40)}`).toBe(false);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

let leadCounter = 0;
function makeLead(overrides: Record<string, unknown> = {}) {
  const n = ++leadCounter;
  const result = validateLead({ ...validLead, requestId: randomUUID(), fullName: `Quillon Synthetic-Crm${n}`, email: `fsc-crm-${n}-${randomBytes(3).toString('hex')}@example.invalid`, message: `Unique synthetic crm probe ${randomBytes(4).toString('hex')}`, ...overrides });
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  usedLeads.push(result.lead as unknown as Record<string, unknown>);
  return result.lead;
}
type Lead = ReturnType<typeof makeLead>;
const freshSource = () => randomBytes(32).toString('hex');
const deliver = (lead: Lead, deps: ReceiptDependencies = productionDependencies(), source: string | null = freshSource()) => deliverProductionReceipt(lead, lead.requestId!, deps, source);
const receiptId = async (request: string, target = db) => (await rows(target.admin, `SELECT receipt_id FROM fsc_private.assessment_receipts WHERE request_id = $1`, [request]))[0]?.receipt_id as string | undefined;
async function normalize(result: unknown, request: string, target = db) {
  const id = await receiptId(request, target);
  const copy = { ...(result as Record<string, unknown>) };
  if (id && copy.deliveryId === id) copy.deliveryId = '<RECEIPT>';
  return copy;
}
const crmRow = async (request: string, target = db) => (await rows(target.admin, `SELECT state, provider_id, error_category, lease_token::text AS token FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'crm_lead'`, [request]))[0];
const effect = async (request: string, name: string, target = db) => (await rows(target.admin, `SELECT state, error_category FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = $2`, [request, name]))[0];
const storedPayload = async (request: string, target = db) => (await rows(target.admin, `SELECT payload FROM fsc_private.assessment_receipts WHERE request_id = $1`, [request]))[0].payload;
const companyCalls = () => resend.callsTo(COMPANY);
const customerCalls = (lead: Lead) => resend.callsTo(lead.email);
const crmLogs = () => spies.flatMap(spy => spy.mock.calls as unknown[][]).filter(a => a[0] === '[lead-receipt]' && String(a[1]).startsWith('crm_')).map(a => String(a[1]));
function withRpcHooks(base: ReceiptDependencies, hooks: { before?: (name: string, args: Record<string, unknown>) => Promise<void> | void; after?: (name: string, args: Record<string, unknown>) => Promise<void> | void }): ReceiptDependencies {
  return { ...base, rpc: async (name, args, signal) => { await hooks.before?.(name, args); const out = await base.rpc(name, args, signal); await hooks.after?.(name, args); return out; } };
}

describe('kill switch: CRM configuration absent or invalid', { timeout: 60_000 }, () => {
  it.each([
    ['both unset', { FSC_CRM_INTAKE_URL: '', FSC_CRM_INTAKE_HMAC_SECRET: '' }],
    ['URL unset', { FSC_CRM_INTAKE_URL: '' }],
    ['secret unset', { FSC_CRM_INTAKE_HMAC_SECRET: '' }],
    ['secret 31 chars', { FSC_CRM_INTAKE_HMAC_SECRET: 's'.repeat(31) }],
    ['secret 31 chars padded with spaces', { FSC_CRM_INTAKE_HMAC_SECRET: `  ${'s'.repeat(31)}  ` }],
    ['valid secret with a leading space (never trimmed, D-031 m-3)', { FSC_CRM_INTAKE_HMAC_SECRET: ` ${CRM_SECRET}` }],
    ['valid secret with a trailing newline (never trimmed, D-031 m-3)', { FSC_CRM_INTAKE_HMAC_SECRET: `${CRM_SECRET}
` }],
    ['another supabase project (host pinned, D-031 m-2)', { FSC_CRM_INTAKE_URL: 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/crm-intake' }],
    ['explicit non-default port (D-031 m-2)', { FSC_CRM_INTAKE_URL: CRM_URL.replace(CRM_HOST, `${CRM_HOST}:8443`) }],
    ['http scheme', { FSC_CRM_INTAKE_URL: CRM_URL.replace('https:', 'http:') }],
    ['non-supabase host', { FSC_CRM_INTAKE_URL: 'https://crm.example.invalid/functions/v1/crm-intake' }],
    ['wrong path', { FSC_CRM_INTAKE_URL: CRM_URL.replace('crm-intake', 'crm-intake-v2') }],
    ['query string', { FSC_CRM_INTAKE_URL: `${CRM_URL}?x=1` }],
    ['not a URL', { FSC_CRM_INTAKE_URL: 'not a url' }],
  ])('%s → productionDependencies() attaches no crm, the RPC timeline is the pinned pre-AM-005 one, one crm_configuration warn, no CRM row', async (_label, env) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const deps = productionDependencies();
    expect('crm' in deps).toBe(false);
    const lead = makeLead();
    const result = await deliver(lead, deps);
    expect(await normalize(result, lead.requestId!)).toEqual(EXPECTED_OK);
    expect(transport.timeline).toEqual(NO_CRM_TIMELINE);
    expect(crm.calls).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_configuration']);
    expect(await crmRow(lead.requestId!)).toBeUndefined();
  });

  it('valid configuration attaches crm (control for the table above)', () => {
    expect(typeof productionDependencies().crm?.post).toBe('function');
  });

  it('kill-switch RPC calls are argument-for-argument identical on the AM-003-only schema and on the migrated schema', async () => {
    vi.stubEnv('FSC_CRM_INTAKE_URL', '');
    const lead = makeLead();
    const source = freshSource();
    useDatabase(plainDb);
    const before = await deliver(lead, productionDependencies(), source);
    const plainCalls = prime.calls.map(c => ({ name: c.name, args: { ...c.args, ...(c.args.p_token ? { p_token: '<TOKEN>' } : {}) } }));
    const plainTimeline = [...transport.timeline];
    const plainResend = resend.calls.map(c => ({ key: c.key, body: c.body }));
    vi.unstubAllGlobals();
    useDatabase(crmDb);
    const after = await deliver(lead, productionDependencies(), source);
    const crmCalls = prime.calls.map(c => ({ name: c.name, args: { ...c.args, ...(c.args.p_token ? { p_token: '<TOKEN>' } : {}) } }));
    expect(crmCalls).toEqual(plainCalls);
    expect(transport.timeline).toEqual(plainTimeline);
    expect(plainTimeline).toEqual(NO_CRM_TIMELINE);
    expect(await normalize(after, lead.requestId!, crmDb)).toEqual(await normalize(before, lead.requestId!, plainDb));
    // Idempotency keys embed the per-database receipt_id; the envelopes sent are identical.
    expect(resend.calls.map(c => c.body)).toEqual(plainResend.map(c => c.body));
    expect(crm.calls).toHaveLength(0);
  });
});

describe('ordering, wire format and stored snapshot', { timeout: 60_000 }, () => {
  it('company_email → prime_lead → fsc_crm_claim_draft → CRM post → finish crm_lead → customer_email, with the exact wire contract', async () => {
    const lead = makeLead();
    const started = Math.floor(Date.now() / 1000);
    const result = await deliver(lead);
    expect(await normalize(result, lead.requestId!)).toEqual(EXPECTED_OK);
    expect(transport.timeline).toEqual(CRM_TIMELINE);
    expect(crm.calls).toHaveLength(1);
    const call = crm.calls[0];
    expect(call).toMatchObject({ url: CRM_URL, method: 'POST', redirect: 'error', cache: 'no-store', hasSignal: true, signatureValid: true });
    expect(Object.keys(call.headers).sort()).toEqual(['content-type', 'x-fsc-crm-signature', 'x-fsc-crm-timestamp']);
    expect(call.headers['content-type']).toBe('application/json');
    expect(call.timestamp).toMatch(/^[1-9][0-9]*$/);
    expect(Number(call.timestamp)).toBeGreaterThanOrEqual(started - 1);
    expect(Number(call.timestamp)).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 1);
    expect(call.signature).toMatch(/^v1=[0-9a-f]{64}$/);
    expect(call.signature).toBe(expectedSignature(CRM_SECRET, call.timestamp!, call.raw));
    const stored = await storedPayload(lead.requestId!);
    expect(call.raw).toBe(JSON.stringify({ requestId: lead.requestId, lead: stored }));
    const receipt = crm.leads.get(lead.requestId!)!;
    expect(await crmRow(lead.requestId!)).toEqual({ state: 'succeeded', provider_id: receipt.receiptId, error_category: null, token: null });
    expect(crmLogs()).toEqual([]);
    expect(companyCalls()).toHaveLength(1);
    expect(customerCalls(lead)).toHaveLength(1);
  });

  it('the body is built from the claim-returned stored payload: a same-ID retry with a freshly validated lead (new submittedAt) posts byte-identical bytes; only timestamp/signature differ', async () => {
    const lead = makeLead({ utmSource: 'synthetic-first-utm', sourcePage: '/first-page' });
    crm.next({ status: 503, accept: true }); // CRM stored it but the answer was lost as a 503
    const firstDeps: ReceiptDependencies = { ...productionDependencies(), crm: crmDependencies(process.env, fetch, () => 1789000000)! };
    expect(await normalize(await deliver(lead, firstDeps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', provider_id: null });
    expect(crmLogs()).toEqual(['crm_pending']);

    // Fresh validation of the same visitor details (new submittedAt, changed attribution → same fingerprint).
    const revalidated = validateLead({ ...lead, utmSource: 'synthetic-changed-utm', sourcePage: '/changed-page' });
    if (!revalidated.ok) throw new Error('revalidation failed');
    const retry = { ...revalidated.lead, submittedAt: '2030-01-01T00:00:00.000Z' };
    const retryDeps: ReceiptDependencies = { ...productionDependencies(), crm: crmDependencies(process.env, fetch, () => 1789000042)! };
    expect(await normalize(await deliver(retry, retryDeps), lead.requestId!)).toEqual(EXPECTED_OK);

    expect(crm.calls).toHaveLength(2);
    const [first, second] = crm.calls;
    expect(second.raw).toBe(first.raw);
    const stored = await storedPayload(lead.requestId!);
    expect(first.raw).toBe(JSON.stringify({ requestId: lead.requestId, lead: stored }));
    const sent = JSON.parse(first.raw).lead;
    expect(sent.submittedAt).toBe(lead.submittedAt);
    expect(sent.utmSource).toBe('synthetic-first-utm');
    expect(first.raw).not.toContain('2030-01-01');
    expect(first.raw).not.toContain('synthetic-changed-utm');
    // Key order is the stored jsonb order, not the in-memory ValidatedLead order.
    expect(Object.keys(sent)).toEqual(Object.keys(stored));
    expect(Object.keys(sent)).not.toEqual(Object.keys(JSON.parse(JSON.stringify(lead))));
    // Headers: identical except timestamp and signature, each signature valid for its own timestamp over the exact bytes.
    expect(Object.keys(second.headers).sort()).toEqual(Object.keys(first.headers).sort());
    expect(second.headers['content-type']).toBe(first.headers['content-type']);
    expect([first.timestamp, second.timestamp]).toEqual(['1789000000', '1789000042']);
    expect(second.signature).not.toBe(first.signature);
    expect(first.signature).toBe(expectedSignature(CRM_SECRET, '1789000000', first.raw));
    expect(second.signature).toBe(expectedSignature(CRM_SECRET, '1789000042', second.raw));
    // REPLAYED → succeeded with the CRM's receipt id; one CRM lead, one company email ever.
    expect(await crmRow(lead.requestId!)).toEqual({ state: 'succeeded', provider_id: crm.leads.get(lead.requestId!)!.receiptId, error_category: null, token: null });
    expect(crm.leads.size).toBe(1);
    expect(companyCalls()).toHaveLength(1);
    await deliver(lead);
    expect(crm.calls).toHaveLength(2); // SUCCEEDED short-circuit: no further post
    expect(companyCalls()).toHaveLength(1);
  });

  it('sent lead keys are a subset of the ValidatedLead keys and never include honeypot (every context field populated)', async () => {
    const lead = makeLead({ honeypot: '', company: 'Synthetic Co', sourcePage: '/services/cctv', serviceSlug: 'cctv', industrySlug: 'hoa', locationSlug: 'orlando', utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'synthetic', referrer: 'https://referrer.example.invalid/' });
    await deliver(lead);
    const sent = JSON.parse(crm.calls[0].raw);
    expect(Object.keys(sent)).toEqual(['requestId', 'lead']);
    expect(sent.requestId).toBe(lead.requestId);
    const sentKeys = Object.keys(sent.lead);
    for (const key of sentKeys) expect(VALIDATED_LEAD_KEYS as readonly string[]).toContain(key);
    expect(sentKeys).not.toContain('honeypot');
    expect(sentKeys.sort()).toEqual(Object.keys(JSON.parse(JSON.stringify(lead))).sort());
  });
});

describe('CRM response table (§6) — visitor result always equals the no-CRM result', { timeout: 60_000 }, () => {
  type Expectation = { state: string; category: string | null; provider?: string | 'crm'; log: string[] };
  const cases: [string, CrmBehavior, Expectation][] = [
    ['200 RECEIVED', 'normal', { state: 'succeeded', category: null, provider: 'crm', log: [] }],
    ['200 REPLAYED', { status: 200, body: { ok: true, code: 'REPLAYED', receiptId: 'synthetic-crm-replayed-7' } }, { state: 'succeeded', category: null, provider: 'synthetic-crm-replayed-7', log: [] }],
    ['200 RECEIVED with an over-long receiptId', { status: 200, body: { ok: true, code: 'RECEIVED', receiptId: 'r'.repeat(201) } }, { state: 'succeeded', category: null, log: [] }],
    ['409', { status: 409 }, { state: 'failed', category: 'conflict', log: ['crm_failed'] }],
    ['422', { status: 422 }, { state: 'failed', category: 'validation', log: ['crm_failed'] }],
    ['401', { status: 401 }, { state: 'failed', category: 'configuration', log: ['crm_failed'] }],
    ['405', { status: 405 }, { state: 'failed', category: 'configuration', log: ['crm_failed'] }],
    ['413', { status: 413 }, { state: 'failed', category: 'configuration', log: ['crm_failed'] }],
    ['400', { status: 400 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['403', { status: 403 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['404', { status: 404 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['429', { status: 429 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['500', { status: 500 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['502', { status: 502 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['503', { status: 503 }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['200 unknown code', { status: 200, body: { ok: true, code: 'QUEUED' } }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['201 RECEIVED', { status: 201, body: { ok: true, code: 'RECEIVED', receiptId: 'x' } }, { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['200 unparseable body', 'non-json', { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
    ['network error', 'network', { state: 'uncertain', category: 'ambiguous', log: ['crm_pending'] }],
  ];
  it.each(cases)('%s', async (_label, behavior, expected) => {
    const lead = makeLead();
    crm.next(behavior);
    const result = await deliver(lead);
    expect(await normalize(result, lead.requestId!)).toEqual(EXPECTED_OK);
    expect(transport.timeline).toEqual(CRM_TIMELINE);
    expect(crm.calls).toHaveLength(1);
    expect(crm.calls[0].signatureValid).toBe(true);
    const provider = expected.provider === 'crm' ? crm.leads.get(lead.requestId!)!.receiptId : expected.provider ?? null;
    expect(await crmRow(lead.requestId!)).toEqual({ state: expected.state, provider_id: provider, error_category: expected.category, token: null });
    expect(crmLogs()).toEqual(expected.log);
    expect(companyCalls()).toHaveLength(1);
    expect(customerCalls(lead)).toHaveLength(1);
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'succeeded' });
  });

  it('a CRM that never answers is aborted at the 4 s cap; the uncertain outcome is recorded and customer_email still runs afterwards', async () => {
    const lead = makeLead();
    crm.next('hang');
    const base = productionDependencies();
    let postMs = -1;
    const deps: ReceiptDependencies = { ...base, crm: { post: async (raw, signal) => { const t = Date.now(); try { return await base.crm!.post(raw, signal); } finally { postMs = Date.now() - t; } } } };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(postMs).toBeGreaterThanOrEqual(3900);
    expect(postMs).toBeLessThan(4600);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', token: null });
    expect(transport.timeline.slice(-3)).toEqual(['rpc:fsc_effect_claim_draft:customer_email', 'resend:customer', 'rpc:fsc_effect_finish_draft:customer_email']);
    expect(await effect(lead.requestId!, 'customer_email')).toMatchObject({ state: 'succeeded' });
    expect(crmLogs()).toEqual(['crm_pending']);
  });

  it.each([
    ['synchronous throw', () => { throw new Error('synthetic crm defect'); }],
    ['rejected promise', async () => { throw new TypeError('synthetic crm rejection'); }],
    ['non-Error throw', () => { throw 'synthetic-string-thrown'; }],
  ])('crm.post %s → finish uncertain/ambiguous and the visitor result is unchanged', async (_label, post) => {
    const lead = makeLead();
    const deps: ReceiptDependencies = { ...productionDependencies(), crm: { post: post as never } };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'ambiguous', token: null });
    expect(customerCalls(lead)).toHaveLength(1);
    expect(crmLogs()).toEqual(['crm_pending']);
  });
});

describe('retries: 503 → REPLAYED, definitive failures and the SQL backstop', { timeout: 60_000 }, () => {
  it('503 (CRM actually stored it) → uncertain/ambiguous; same-ID retry → REPLAYED → succeeded with the CRM receipt id; exactly one company email and one CRM lead ever', async () => {
    const lead = makeLead();
    const source = freshSource();
    crm.next({ status: 503, accept: true });
    expect(await normalize(await deliver(lead, productionDependencies(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'ambiguous' });
    expect(await normalize(await deliver(lead, productionDependencies(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toEqual({ state: 'succeeded', provider_id: crm.leads.get(lead.requestId!)!.receiptId, error_category: null, token: null });
    expect(crm.calls.map(c => c.raw)).toEqual([crm.calls[0].raw, crm.calls[0].raw]);
    expect(crm.leads.size).toBe(1);
    expect(companyCalls()).toHaveLength(1);
    expect(await normalize(await deliver(lead, productionDependencies(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(2);
    expect(companyCalls()).toHaveLength(1);
  });

  it('SQL backstop: a 409 on the retry of an uncertain attempt is recorded uncertain/configuration, never failed; the visitor result is unchanged', async () => {
    const lead = makeLead();
    crm.next({ status: 503 }, { status: 409 });
    await deliver(lead);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'ambiguous' });
    expect(await normalize(await deliver(lead), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toEqual({ state: 'uncertain', provider_id: null, error_category: 'configuration', token: null });
    expect(crm.calls).toHaveLength(2);
    expect(companyCalls()).toHaveLength(1);
    // D-032 TG-2: the second finish was requested 'failed' but RECORDED 'uncertain' by the SQL backstop → crm_pending, never crm_failed.
    expect(crmLogs()).toEqual(['crm_pending', 'crm_pending']);
  });

  it.each([['409', 409], ['422', 422], ['401', 401]] as const)('D-032 TG-2: a first-attempt %s is recorded FAILED and logged crm_failed; after an earlier ambiguous attempt the same answer is downgraded and logged crm_pending', async (_label, status) => {
    const first = makeLead();
    crm.next({ status });
    await deliver(first);
    expect(await crmRow(first.requestId!)).toMatchObject({ state: 'failed' });
    expect(crmLogs()).toEqual(['crm_failed']);

    const second = makeLead();
    crm.next({ status: 503 }, { status });
    await deliver(second);
    expect(await normalize(await deliver(second), second.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(second.requestId!)).toMatchObject({ state: 'uncertain', error_category: 'configuration' });
    expect(crmLogs()).toEqual(['crm_failed', 'crm_pending', 'crm_pending']);
  });

  it('D-032 TG-2: CRM accepted but the finish returns STALE_LEASE (lease expired meanwhile) → crm_pending, never recorded succeeded', async () => {
    const lead = makeLead();
    const deps = withRpcHooks(productionDependencies(), { before: async (name, args) => { if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') await expireLease(db.admin, lead.requestId!, 'crm_lead'); } });
    let recorded: unknown;
    const inner = deps.rpc;
    deps.rpc = async (name, args, signal) => { const out = await inner(name, args, signal); if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') recorded = out; return out; };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(recorded).toEqual({ code: 'STALE_LEASE' });
    expect(crm.leads.size).toBe(1);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'inflight', provider_id: null });
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerCalls(lead)).toHaveLength(1);
  });

  it('F-6: a same-ID retry after a first-attempt 422 posts once more (claimable) and, meeting 422 again, stays failed/validation', async () => {
    const lead = makeLead();
    crm.next({ status: 422 }, { status: 422 });
    await deliver(lead);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'failed', error_category: 'validation' });
    expect(await normalize(await deliver(lead), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(2);
    expect(crm.calls[1].raw).toBe(crm.calls[0].raw);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'failed', error_category: 'validation' });
    expect(companyCalls()).toHaveLength(1);
  });

  it('finish RPC lost after the CRM accepted: 200 unchanged, lease left inflight; after lease expiry the retry reclaims, the CRM replays and there is still one CRM lead', async () => {
    const lead = makeLead();
    const source = freshSource();
    let dropFinish = true;
    const deps = () => withRpcHooks(productionDependencies(), { before: (name, args) => { if (dropFinish && name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') throw new TypeError('fetch failed'); } });
    expect(await normalize(await deliver(lead, deps(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'inflight' });
    expect(customerCalls(lead)).toHaveLength(1);
    expect(crmLogs()).toEqual(['crm_pending']); // D-032 TG-2: CRM said RECEIVED but the finish was never recorded (RPC_FAILURE)
    dropFinish = false;
    expect(await normalize(await deliver(lead, deps(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(1); // BUSY while the lease lives: no post
    await expireLease(db.admin, lead.requestId!, 'crm_lead');
    expect(await normalize(await deliver(lead, deps(), source), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(2);
    expect(crm.calls[1].raw).toBe(crm.calls[0].raw);
    expect(crm.leads.size).toBe(1);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'succeeded', provider_id: crm.leads.get(lead.requestId!)!.receiptId });
    expect(companyCalls()).toHaveLength(1);
  });
});

describe('claim outcomes through the real SQL never post and never change the visitor result', { timeout: 60_000 }, () => {
  const other = async (request: string) => callRpc(db.service, 'fsc_crm_claim_draft', { p_slug: 'fsc', p_request: request });
  const cases: [string, (request: string) => Promise<void>, { row: 'none' | 'inflight' | 'succeeded' | 'pending'; log: string[] }][] = [
    ['BUSY (another worker holds the lease)', async request => { expect((await other(request)).code).toBe('CLAIMED'); }, { row: 'inflight', log: ['crm_pending'] }],
    ['SUCCEEDED (another worker already recorded it)', async request => {
      const lease = await other(request);
      await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: request, p_effect: 'crm_lead', p_token: lease.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic-crm-other-worker', p_error: null });
    }, { row: 'succeeded', log: [] }],
    ['EXPIRED (erased between primary and CRM)', async request => { expect(await callRpc(db.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: request })).toBe(true); }, { row: 'none', log: ['crm_pending'] }],
    ['CUTOFF (inside the final 15 s of the 24 h window)', async request => { await setReceiptAge(db.admin, request, '23 hours 59 minutes 50 seconds'); }, { row: 'pending', log: ['crm_pending'] }],
    ['PRIMARY_PENDING (acceptance missing)', async request => {
      await db.admin.query('BEGIN');
      await db.admin.query('SET LOCAL session_replication_role = replica');
      await db.admin.query(`UPDATE fsc_private.assessment_receipts SET accepted_at = NULL WHERE request_id = $1`, [request]);
      await db.admin.query('COMMIT');
    }, { row: 'none', log: ['crm_pending'] }],
  ];
  it.each(cases)('%s', async (_label, inject, expected) => {
    const lead = makeLead();
    const deps = withRpcHooks(productionDependencies(), { before: async name => { if (name === 'fsc_crm_claim_draft') await inject(lead.requestId!); } });
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(0);
    expect(transport.timeline).not.toContain('rpc:fsc_effect_finish_draft:crm_lead');
    const row = await crmRow(lead.requestId!);
    if (expected.row === 'none') expect(row).toBeUndefined();
    else expect(row?.state).toBe(expected.row);
    expect(crmLogs()).toEqual(expected.log);
    expect(companyCalls()).toHaveLength(1);
    // customer_email is still attempted after the CRM step.
    expect(transport.timeline.indexOf('rpc:fsc_effect_claim_draft:customer_email')).toBeGreaterThan(transport.timeline.indexOf('rpc:fsc_crm_claim_draft'));
  });

  it('AM-005 SQL not yet applied (claim RPC 404 on the AM-003-only schema) → crm_pending, no post, primary and customer unaffected', async () => {
    useDatabase(plainDb);
    const lead = makeLead();
    expect(await normalize(await deliver(lead), lead.requestId!, plainDb)).toEqual(EXPECTED_OK);
    expect(transport.timeline).toEqual(CRM_TIMELINE.filter(step => step !== 'crm:post' && step !== 'rpc:fsc_effect_finish_draft:crm_lead'));
    expect(crm.calls).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerCalls(lead)).toHaveLength(1);
    expect(await effect(lead.requestId!, 'prime_lead', plainDb)).toMatchObject({ state: 'succeeded' });
  });

  it.each([['HTTP 500', { status: 500 }], ['network error', 'network']] as const)('claim RPC failure (%s) → crm_pending, no post, no row, customer still sent', async (_label, fault) => {
    const lead = makeLead();
    prime.fail('fsc_crm_claim_draft', fault as never);
    expect(await normalize(await deliver(lead), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(0);
    expect(await crmRow(lead.requestId!)).toBeUndefined();
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerCalls(lead)).toHaveLength(1);
  });
});

describe('budget (invariant 7 / OD-CRM-3 as corrected by D-031 M-1)', { timeout: 60_000 }, () => {
  /** Elapsed clock = real monotonic time + a test offset. remaining() mirrors the coordinator's 15 s budget from its first now() read. */
  function budgetClock() {
    let start: number | undefined;
    let offset = 0;
    const now = () => { const value = performance.now() + offset; if (start === undefined) start = value; return value; };
    const remaining = () => 15_000 - (now() - start!);
    /** Jump the elapsed clock so exactly `target` ms of server budget remain. */
    const setRemaining = (target: number) => { offset += remaining() - target; };
    return { now, remaining, setRemaining };
  }
  const stallUntilAbort = (signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    signal.addEventListener('abort', () => reject(signal.reason ?? new DOMException('aborted', 'AbortError')));
  });

  it('a claim RPC that stalls (lock wait / slow PostgREST) is abandoned at the ≤1.5 s CRM RPC cap; customer_email still gets ≥3 s and is sent', async () => {
    const lead = makeLead();
    const clock = budgetClock();
    const base = productionDependencies();
    let claimMs = -1;
    let customerRemaining = -1;
    const deps: ReceiptDependencies = {
      ...base,
      now: clock.now,
      rpc: async (name, args, signal) => {
        if (name === 'fsc_crm_claim_draft') { const t = Date.now(); try { return await stallUntilAbort(signal); } finally { claimMs = Date.now() - t; } }
        if (name === 'fsc_effect_claim_draft' && args.p_effect === 'customer_email') customerRemaining = clock.remaining();
        const out = await base.rpc(name, args, signal);
        if (name === 'fsc_prime_record_draft') clock.setRemaining(6_200);
        return out;
      },
    };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(claimMs).toBeGreaterThanOrEqual(1_000);
    expect(claimMs).toBeLessThan(1_800);
    expect(crm.calls).toHaveLength(0);
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerRemaining).toBeGreaterThanOrEqual(3_000 - JITTER_MS); // the 3 s reserve, less real-timer lateness under load
    expect(customerCalls(lead)).toHaveLength(1);
  });

  it('with ~6.2 s left, a hanging CRM POST plus a stalling finish still leave customer_email ≥3 s, and it is sent', async () => {
    const lead = makeLead();
    const clock = budgetClock();
    const base = productionDependencies();
    crm.next('hang');
    let customerRemaining = -1;
    let crmStepMs = -1;
    let crmStarted = 0;
    const deps: ReceiptDependencies = {
      ...base,
      now: clock.now,
      rpc: async (name, args, signal) => {
        if (name === 'fsc_crm_claim_draft') crmStarted = Date.now();
        if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') return stallUntilAbort(signal);
        if (name === 'fsc_effect_claim_draft' && args.p_effect === 'customer_email') { customerRemaining = clock.remaining(); crmStepMs = Date.now() - crmStarted; }
        const out = await base.rpc(name, args, signal);
        if (name === 'fsc_prime_record_draft') clock.setRemaining(6_200);
        return out;
      },
    };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(1);
    expect(crmStepMs).toBeLessThanOrEqual(3_200 + JITTER_MS); // window = min(7 s, 6.2 s − 3 s)
    expect(customerRemaining).toBeGreaterThanOrEqual(3_000 - JITTER_MS);
    expect(customerCalls(lead)).toHaveLength(1);
    expect(await crmRow(lead.requestId!)).toMatchObject({ state: 'inflight' }); // finish never landed: lease left to expire
  });

  it('D-032 R2-N1: a claim that leaves < 1 s of POST budget is finished uncertain/cutoff in the real DB, within the window; customer_email keeps ≥3 s', async () => {
    const lead = makeLead();
    const clock = budgetClock();
    const base = productionDependencies();
    const timeouts = new Map<AbortSignal, number>();
    const original = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => { const signal = original(ms); timeouts.set(signal, ms); return signal; });
    let finishMs = -1;
    let remainingAtFinish = -1;
    let customerRemaining = -1;
    const deps: ReceiptDependencies = {
      ...base,
      now: clock.now,
      rpc: async (name, args, signal) => {
        if (name === 'fsc_effect_finish_draft' && args.p_effect === 'crm_lead') { finishMs = timeouts.get(signal) ?? -1; remainingAtFinish = clock.remaining(); }
        if (name === 'fsc_effect_claim_draft' && args.p_effect === 'customer_email') customerRemaining = clock.remaining();
        const out = await base.rpc(name, args, signal);
        if (name === 'fsc_prime_record_draft') clock.setRemaining(6_200); // window = min(7 s, 6.2 s − 3 s) = 3.2 s
        if (name === 'fsc_crm_claim_draft') clock.setRemaining(4_300); // ~1.3 s of window left → POST budget < 1 s
        return out;
      },
    };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(crm.calls).toHaveLength(0);
    expect(await crmRow(lead.requestId!)).toEqual({ state: 'uncertain', provider_id: null, error_category: 'cutoff', token: null });
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(finishMs).toBeGreaterThan(0);
    expect(finishMs).toBeLessThanOrEqual(1500);
    expect(finishMs).toBeLessThanOrEqual(remainingAtFinish - 3000 + JITTER_MS); // the finish signal ends inside the CRM window
    expect(customerRemaining).toBeGreaterThanOrEqual(3_000 - JITTER_MS);
    expect(customerCalls(lead)).toHaveLength(1);
  });

  it('under 6 s of server budget after Prime → no CRM claim at all, crm_pending, and customer_email still runs', async () => {
    const lead = makeLead();
    const base = productionDependencies();
    let offset = 0;
    const deps: ReceiptDependencies = { ...withRpcHooks(base, { after: name => { if (name === 'fsc_prime_record_draft') offset = 9_500; } }), now: () => performance.now() + offset };
    expect(await normalize(await deliver(lead, deps), lead.requestId!)).toEqual(EXPECTED_OK);
    expect(transport.timeline).toEqual(NO_CRM_TIMELINE);
    expect(crm.calls).toHaveLength(0);
    expect(await crmRow(lead.requestId!)).toBeUndefined();
    expect(crmLogs()).toEqual(['crm_pending']);
    expect(customerCalls(lead)).toHaveLength(1);
  });
});

describe('route → dispatcher → coordinator: response bytes identical to a no-CRM run (invariant 1)', { timeout: 90_000 }, () => {
  const post = (body: Record<string, unknown>, ip: string) => POST(new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': ip }, body: JSON.stringify(body) }));
  beforeEach(() => {
    vi.stubEnv('LEAD_DELIVERY_MODE', 'resend+supabase');
    vi.stubEnv('FSC_LOCAL_PREVIEW', '');
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_TARGET_ENV', '');
  });
  async function snapshot(response: Response) {
    return { status: response.status, headers: [...response.headers.entries()].sort(), body: await response.text() };
  }
  let ipCounter = 10;
  it.each([
    ['200 RECEIVED', 'normal'],
    ['503', { status: 503 }],
    ['409', { status: 409 }],
    ['422', { status: 422 }],
    ['401', { status: 401 }],
    ['network error', 'network'],
    ['unparseable body', 'non-json'],
    ['hang until abort', 'hang'],
  ] as [string, CrmBehavior][])('%s', async (_label, behavior) => {
    const requestId = randomUUID();
    const body = { ...validLead, requestId, fullName: 'Ysolde Synthetic-Route', email: `fsc-route-${requestId.slice(0, 8)}@example.invalid`, phone: '4075550188', message: `Route probe ${requestId}` };
    usedLeads.push(body);
    const ip = `203.0.113.${ipCounter++}`;
    // Baseline: kill switch, on the AM-003-only schema (today's production shape).
    vi.stubEnv('FSC_CRM_INTAKE_URL', '');
    useDatabase(plainDb);
    const baseline = await snapshot(await post(body, ip));
    expect(crm.calls).toHaveLength(0);
    expect(transport.unexpected).toEqual([]);
    vi.unstubAllGlobals();
    // Same request ID and body against the migrated schema with the CRM live.
    vi.stubEnv('FSC_CRM_INTAKE_URL', CRM_URL);
    useDatabase(crmDb);
    crm.next(behavior);
    const withCrm = await snapshot(await post(body, ip));
    expect(crm.calls).toHaveLength(1);
    expect(withCrm).toEqual(baseline);
    expect(baseline.status).toBe(200);
    expect(JSON.parse(baseline.body)).toMatchObject({ ok: true, requestId });
    expect(companyCalls()).toHaveLength(1);
  });

  it('a hosted preview refuses delivery before any RPC, send or CRM call even with valid CRM configuration (invariant 9)', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const requestId = randomUUID();
    const response = await post({ ...validLead, requestId }, '203.0.113.99');
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, code: 'CONFIGURATION', requestId });
    expect(transport.fetchMock).not.toHaveBeenCalled();
    expect(crm.calls).toHaveLength(0);
  });
});
