// D-031 N-9: productionDependencies() must never throw because of CRM
// configuration. crmDependencies() is replaced here by one that throws (a
// future defect); the primary production dependencies must still be built,
// without a crm client, so the email/Prime path is untouched (no CONFIGURATION
// 503 caused by the CRM). Real dispatcher + real productionReceipt module; the
// only fake is the stubbed global fetch, which never reaches a network.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validLead } from '../fixtures/lead';

vi.mock('../../lib/leads/crmIntake', async importOriginal => {
  const actual = await importOriginal<typeof import('../../lib/leads/crmIntake')>();
  return { ...actual, crmDependencies: () => { throw new Error('synthetic crm configuration defect'); } };
});

const PRIME = 'https://prime-synthetic.example.invalid';
const CONFIG: Record<string, string> = {
  LEAD_DELIVERY_MODE: 'resend+supabase', FSC_LOCAL_PREVIEW: '', VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: '',
  PRIME_SUPABASE_URL: PRIME, PRIME_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role-not-secret', PRIME_ACCOUNT_SLUG: 'fsc',
  RESEND_API_KEY: 're_synthetic_not_secret', LEAD_NOTIFICATION_FROM: 'FSC Synthetic <notify@example.invalid>', LEAD_CONFIRMATION_ENABLED: 'false',
  FSC_ADMISSION_HMAC_KEY: '2b'.repeat(32),
  FSC_CRM_INTAKE_URL: 'https://izhandnebyywemsjisye.supabase.co/functions/v1/crm-intake', FSC_CRM_INTAKE_HMAC_SECRET: 'synthetic-isolation-crm-secret-0123456789',
};

beforeEach(() => {
  for (const [key, value] of Object.entries(CONFIG)) vi.stubEnv(key, value);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('CRM configuration can never break the primary configuration path', () => {
  it('productionDependencies() does not throw and attaches no crm when crmDependencies() throws', async () => {
    const { productionDependencies } = await import('../../lib/leads/productionReceipt');
    let deps: ReturnType<typeof productionDependencies> | undefined;
    expect(() => { deps = productionDependencies(); }).not.toThrow();
    expect(typeof deps!.rpc).toBe('function');
    expect(typeof deps!.send).toBe('function');
    expect('crm' in deps!).toBe(false);
  });

  it('the dispatcher still reaches the primary receipt RPC (not a CONFIGURATION 503) and the CRM is never contacted', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input instanceof Request ? input.url : input);
      urls.push(url);
      if (url === `${PRIME}/rest/v1/rpc/fsc_receipt_create_draft`) return new Response(JSON.stringify({ code: 'RATE_LIMIT', retry_after: 17 }), { status: 200, headers: { 'content-type': 'application/json' } });
      return new Response('{}', { status: 500 });
    }));
    const { deliverLead } = await import('../../lib/leads/leadDelivery');
    const result = await deliverLead({ ...validLead, submittedAt: new Date().toISOString() }, validLead.requestId, new Headers({ 'x-vercel-forwarded-for': '203.0.113.61' }));
    expect(result).toMatchObject({ ok: false, code: 'RATE_LIMIT', status: 429, retryAfter: 17 });
    expect(urls).toEqual([`${PRIME}/rest/v1/rpc/fsc_receipt_create_draft`]);
  });
});
