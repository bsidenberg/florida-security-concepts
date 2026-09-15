// Dispatcher isolation (lib/leads/leadDelivery.ts). Derived from the committed
// version: hosted-marker rejection, local mode mismatch, local timeout and the
// local rate allowance are kept unchanged. The retired resend→supabase
// dispatcher simulations were replaced by real-coordinator tests against real
// PostgreSQL in tests/gate/coordinator-receipts.test.ts ("Prime record failure
// keeps 200…", "Prime claim transport error keeps 200…", "definitive Resend … no
// Prime lead and no customer send"). Here the production coordinator module is
// replaced by a counting stub only to prove the dispatcher's import boundary
// and status mapping.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createHmac, randomUUID } from 'node:crypto';
import { allowLocalRequest } from '../../lib/leads/localRate';
import { hostedMarkers } from '../../lib/leads/leadDelivery';
import { validLead } from '../fixtures/lead';

const receipt = vi.hoisted(() => vi.fn());
const production = vi.hoisted(() => ({ imports: 0, deliver: vi.fn(), dependencies: vi.fn() }));
const admission = vi.hoisted(() => ({ imports: 0 }));
vi.mock('../../lib/leads/localReceipt', () => ({ deliverLocalReceipt: receipt }));
vi.mock('../../lib/leads/productionReceipt', () => { production.imports += 1; return { deliverProductionReceipt: production.deliver, productionDependencies: production.dependencies }; });
vi.mock('../../lib/leads/admission', async importOriginal => { admission.imports += 1; return importOriginal(); });

const lead = { ...validLead, submittedAt: new Date().toISOString() };
const HMAC_KEY = '7e'.repeat(32);
const PRODUCTION_CONFIG: Record<string, string> = {
  LEAD_DELIVERY_MODE: 'resend+supabase', FSC_LOCAL_PREVIEW: '', PRIME_SUPABASE_URL: 'https://prime-synthetic.example.invalid', PRIME_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role',
  PRIME_ACCOUNT_SLUG: 'fsc', RESEND_API_KEY: 're_synthetic', LEAD_NOTIFICATION_FROM: 'FSC Synthetic <notify@example.invalid>', FSC_ADMISSION_HMAC_KEY: HMAC_KEY,
};
async function loadDispatcher() { return (await import('../../lib/leads/leadDelivery')).deliverLead; }

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  production.imports = 0;
  admission.imports = 0;
  for (const key of hostedMarkers) vi.stubEnv(key, '');
  vi.stubEnv('LEAD_DELIVERY_MODE', 'local');
  vi.stubEnv('FSC_LOCAL_PREVIEW', '1');
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('isolated dispatch and timeout contract', () => {
  it.each(['resend', '', 'console'])('rejects local flag with mismatched mode %s', async mode => {
    vi.stubEnv('LEAD_DELIVERY_MODE', mode);
    const deliverLead = await loadDispatcher();
    expect(await deliverLead(lead)).toMatchObject({ ok: false, status: 503 });
    expect(receipt).not.toHaveBeenCalled();
    expect(production.deliver).not.toHaveBeenCalled();
    expect(production.imports).toBe(0);
  });

  it.each(hostedMarkers)('rejects hosted marker %s', async marker => {
    vi.stubEnv(marker, '1');
    const deliverLead = await loadDispatcher();
    expect(await deliverLead(lead)).toMatchObject({ ok: false, status: 503 });
    expect(receipt).not.toHaveBeenCalled();
    expect(production.deliver).not.toHaveBeenCalled();
  });

  it('local success ignores inherited provider credentials and never loads the production coordinator', async () => {
    vi.stubEnv('RESEND_API_KEY', 'synthetic-fixture-only');
    vi.stubEnv('PRIME_SUPABASE_SERVICE_ROLE_KEY', 'synthetic-fixture-only');
    receipt.mockResolvedValue({ ok: true, mode: 'local', deliveryId: validLead.requestId });
    const deliverLead = await loadDispatcher();
    expect((await deliverLead(lead)).ok).toBe(true);
    expect(receipt).toHaveBeenCalledOnce();
    expect(receipt.mock.calls[0][1]).toBe(validLead.requestId);
    expect(production.imports).toBe(0);
    expect(production.dependencies).not.toHaveBeenCalled();
  });

  it('returns receipt unknown after local timeout without a second dispatch', async () => {
    vi.useFakeTimers();
    receipt.mockImplementation(() => new Promise(() => {}));
    const deliverLead = await loadDispatcher();
    const result = deliverLead(lead);
    await vi.advanceTimersByTimeAsync(15000);
    expect(await result).toMatchObject({ ok: false, code: 'RECEIPT_UNKNOWN', status: 504 });
    expect(receipt).toHaveBeenCalledOnce();
  });
});

describe('hosted preview and production boundaries', () => {
  beforeEach(() => { for (const [key, value] of Object.entries(PRODUCTION_CONFIG)) vi.stubEnv(key, value); });

  it.each([
    ['VERCEL_ENV=preview', { VERCEL: '1', VERCEL_ENV: 'preview' }],
    ['VERCEL_ENV=development', { VERCEL: '1', VERCEL_ENV: 'development' }],
    ['production env with preview target', { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'preview' }],
  ])('hosted preview (%s) returns 503 before importing the production coordinator or admission module', async (_label, env) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const deliverLead = await loadDispatcher();
    const result = await deliverLead(lead, validLead.requestId, new Headers({ 'x-vercel-forwarded-for': '203.0.113.5' }));
    expect(result).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(production.imports).toBe(0);
    expect(admission.imports).toBe(0);
    expect(receipt).not.toHaveBeenCalled();
  });

  it('control: a production deployment loads the coordinator once and passes the trusted-header digest (never x-forwarded-for)', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    const deps = { rpc: vi.fn(), send: vi.fn() };
    production.dependencies.mockReturnValue(deps);
    production.deliver.mockResolvedValue({ ok: true, mode: 'resend+supabase', deliveryId: 'synthetic-receipt' });
    const deliverLead = await loadDispatcher();
    const result = await deliverLead(lead, validLead.requestId, new Headers({ 'x-vercel-forwarded-for': '203.0.113.5', 'x-forwarded-for': '198.51.100.9' }));
    expect(result).toMatchObject({ ok: true });
    expect(production.imports).toBe(1);
    expect(production.deliver).toHaveBeenCalledOnce();
    const [passedLead, passedId, passedDeps, passedSource] = production.deliver.mock.calls[0];
    expect(passedLead).toBe(lead);
    expect(passedId).toBe(validLead.requestId);
    expect(passedDeps).toBe(deps);
    expect(passedSource).toBe(createHmac('sha256', Buffer.from(HMAC_KEY, 'hex')).update(Buffer.concat([Buffer.from('fsc-admission-v1\0'), Buffer.from([203, 0, 113, 5])])).digest('hex'));
    expect(deps.rpc).not.toHaveBeenCalled();
    expect(deps.send).not.toHaveBeenCalled();
  });

  it('missing production configuration (dependencies refuse) returns 503 CONFIGURATION and never runs the coordinator', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    production.dependencies.mockImplementation(() => { throw new Error('CONFIGURATION'); });
    const deliverLead = await loadDispatcher();
    expect(await deliverLead(lead, validLead.requestId, new Headers())).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(production.deliver).not.toHaveBeenCalled();
  });

  it('an unexpected coordinator rejection is reported as 504 RECEIPT_UNKNOWN, never a known failure (D-023)', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    production.dependencies.mockReturnValue({ rpc: vi.fn(), send: vi.fn() });
    production.deliver.mockRejectedValue(new Error('synthetic unexpected failure after a possible claim'));
    const deliverLead = await loadDispatcher();
    expect(await deliverLead(lead, validLead.requestId, new Headers({ 'x-vercel-forwarded-for': '203.0.113.5' }))).toMatchObject({ ok: false, status: 504, code: 'RECEIPT_UNKNOWN' });
  });

  it('dispatcher logs contain no contact values, address or keys', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined));
    production.dependencies.mockReturnValue({ rpc: vi.fn(), send: vi.fn() });
    production.deliver.mockResolvedValueOnce({ ok: true, mode: 'resend+supabase', deliveryId: 'synthetic' }).mockResolvedValueOnce({ ok: false, mode: 'resend+supabase', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', status: 429, retryAfter: 60 });
    const deliverLead = await loadDispatcher();
    const headers = new Headers({ 'x-vercel-forwarded-for': '203.0.113.5' });
    await deliverLead(lead, validLead.requestId, headers);
    await deliverLead(lead, validLead.requestId, headers);
    const calls = spies.flatMap(spy => spy.mock.calls);
    expect(calls.length).toBeGreaterThan(0);
    const logged = JSON.stringify(calls);
    for (const forbidden of [lead.email, lead.fullName, lead.phone, lead.message, '203.0.113.5', HMAC_KEY, PRODUCTION_CONFIG.RESEND_API_KEY, PRODUCTION_CONFIG.PRIME_SUPABASE_SERVICE_ROLE_KEY]) {
      expect(logged.includes(forbidden), `log leaked ${forbidden}`).toBe(false);
    }
  });
});

it('local rate allowance counts new IDs and resets precisely at10minutes', () => {
  const source = randomUUID(); const first = randomUUID(); expect(allowLocalRequest(source, first, 0)).toBe(true);
  for (let i = 1; i < 20; i++) expect(allowLocalRequest(source, randomUUID(), 0)).toBe(true);
  expect(allowLocalRequest(source, randomUUID(), 599999)).toBe(false);
  expect(allowLocalRequest(source, first, 599999)).toBe(true);
  expect(allowLocalRequest(source, randomUUID(), 600000)).toBe(true);
});
