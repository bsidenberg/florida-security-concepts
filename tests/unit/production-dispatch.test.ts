// Real dispatcher + real productionReceipt module, with global fetch replaced by a
// recording stub that never reaches a network. Proves the configuration gate
// happens before any RPC/send and that the HMAC key only gates NEW admissions
// (D-023): a missing/malformed key still calls create with p_source = null.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { deliverLead } from '../../lib/leads/leadDelivery';
import { validLead } from '../fixtures/lead';

const PRIME = 'https://prime-synthetic.example.invalid';
const HMAC_KEY = '3d'.repeat(32);
const CONFIG: Record<string, string> = {
  LEAD_DELIVERY_MODE: 'resend+supabase', FSC_LOCAL_PREVIEW: '', VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: '',
  PRIME_SUPABASE_URL: PRIME, PRIME_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role-not-secret', PRIME_ACCOUNT_SLUG: 'fsc',
  RESEND_API_KEY: 're_synthetic_not_secret', LEAD_NOTIFICATION_FROM: 'FSC Synthetic <notify@example.invalid>', LEAD_CONFIRMATION_ENABLED: 'false', FSC_ADMISSION_HMAC_KEY: HMAC_KEY,
};
const lead = { ...validLead, submittedAt: new Date().toISOString() };
const headers = () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.44' });
type Seen = { url: string; body: any };
let seen: Seen[];
let spies: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  for (const [key, value] of Object.entries(CONFIG)) vi.stubEnv(key, value);
  seen = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    seen.push({ url, body: init.body ? JSON.parse(String(init.body)) : null });
    if (url === `${PRIME}/rest/v1/rpc/fsc_receipt_create_draft`) return new Response(JSON.stringify(init.body && JSON.parse(String(init.body)).p_source ? { code: 'RATE_LIMIT', retry_after: 42 } : { code: 'SOURCE_UNAVAILABLE' }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response('{}', { status: 500 });
  }));
  spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined));
});
afterEach(() => {
  const logged = JSON.stringify(spies.flatMap(spy => spy.mock.calls));
  for (const forbidden of [lead.email, lead.fullName, lead.phone, '203.0.113.44', HMAC_KEY, CONFIG.RESEND_API_KEY, CONFIG.PRIME_SUPABASE_SERVICE_ROLE_KEY]) expect(logged.includes(forbidden), `log leaked ${forbidden}`).toBe(false);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('production configuration gate', () => {
  it.each([
    ['PRIME_SUPABASE_URL missing', { PRIME_SUPABASE_URL: '' }],
    ['PRIME_SUPABASE_URL not https', { PRIME_SUPABASE_URL: 'http://prime-synthetic.example.invalid' }],
    ['service role key missing', { PRIME_SUPABASE_SERVICE_ROLE_KEY: '' }],
    ['account slug not fsc', { PRIME_ACCOUNT_SLUG: 'fpb' }],
    ['account slug missing', { PRIME_ACCOUNT_SLUG: '' }],
    ['RESEND_API_KEY missing', { RESEND_API_KEY: '' }],
    ['LEAD_NOTIFICATION_FROM missing', { LEAD_NOTIFICATION_FROM: '' }],
  ])('%s → 503 CONFIGURATION before any RPC or send', async (_label, override) => {
    for (const [key, value] of Object.entries(override)) vi.stubEnv(key, value);
    expect(await deliverLead(lead, validLead.requestId, headers())).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(seen).toEqual([]);
  });

  it('control: complete configuration reaches the Prime create RPC with the trusted digest and maps its RATE_LIMIT result', async () => {
    const result = await deliverLead(lead, validLead.requestId, headers());
    expect(result).toMatchObject({ ok: false, status: 429, code: 'RATE_LIMIT', retryAfter: 42 });
    expect(seen.map(call => call.url)).toEqual([`${PRIME}/rest/v1/rpc/fsc_receipt_create_draft`]);
    expect(seen[0].body).toMatchObject({ p_slug: 'fsc', p_request: validLead.requestId, p_template: 'fsc-assessment-v3' });
    expect(seen[0].body.p_source).toBe(createHmac('sha256', Buffer.from(HMAC_KEY, 'hex')).update(Buffer.concat([Buffer.from('fsc-admission-v1\0'), Buffer.from([203, 0, 113, 44])])).digest('hex'));
    expect(seen[0].body.p_payload.email).toBe(lead.email);
    expect(seen.some(call => call.url.includes('resend'))).toBe(false);
  });

  it.each([['missing', ''], ['62 hex', 'ab'.repeat(31)], ['non-hex', 'zz'.repeat(32)]])('%s HMAC key does not refuse up front: create is called with p_source null and SOURCE_UNAVAILABLE maps to 503 (D-023)', async (_label, key) => {
    vi.stubEnv('FSC_ADMISSION_HMAC_KEY', key);
    expect(await deliverLead(lead, validLead.requestId, headers())).toMatchObject({ ok: false, status: 503, code: 'CONFIGURATION' });
    expect(seen.map(call => call.url)).toEqual([`${PRIME}/rest/v1/rpc/fsc_receipt_create_draft`]);
    expect(seen[0].body.p_source).toBeNull();
  });
});
