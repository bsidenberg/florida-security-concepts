import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { allowLocalRequest } from '../../lib/leads/localRate';
const receipt = vi.hoisted(() => vi.fn());
const resend = vi.hoisted(() => vi.fn());
const secondary = vi.hoisted(() => vi.fn());
vi.mock('../../lib/leads/localReceipt', () => ({ deliverLocalReceipt: receipt }));
vi.mock('../../lib/leads/providers/resend', () => ({ deliverViaResend: resend }));
vi.mock('../../lib/leads/providers/supabase', () => ({ deliverViaSupabase: secondary }));
import { deliverLead, hostedMarkers } from '../../lib/leads/leadDelivery';
import { validLead } from '../fixtures/lead';
const lead = { ...validLead, submittedAt: new Date().toISOString() };
beforeEach(() => { vi.resetAllMocks(); for (const key of hostedMarkers) vi.stubEnv(key, ''); vi.stubEnv('LEAD_DELIVERY_MODE', 'local'); vi.stubEnv('FSC_LOCAL_PREVIEW', '1'); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
describe('isolated dispatch and timeout contract', () => {
  it.each(['resend', '', 'console'])('rejects local flag with mismatched mode %s', async mode => {
    vi.stubEnv('LEAD_DELIVERY_MODE', mode); expect(await deliverLead(lead)).toMatchObject({ ok: false, status: 503 }); expect(receipt).not.toHaveBeenCalled(); expect(resend).not.toHaveBeenCalled();
  });
  it.each(hostedMarkers)('rejects hosted marker %s', async marker => {
    vi.stubEnv(marker, '1'); expect(await deliverLead(lead)).toMatchObject({ ok: false, status: 503 }); expect(receipt).not.toHaveBeenCalled();
  });
  it('local success ignores inherited provider credentials', async () => {
    vi.stubEnv('RESEND_API_KEY', 'synthetic-fixture-only'); receipt.mockResolvedValue({ ok: true, mode: 'local', deliveryId: validLead.requestId });
    expect((await deliverLead(lead)).ok).toBe(true); expect(resend).not.toHaveBeenCalled(); expect(secondary).not.toHaveBeenCalled();
  });
  it('returns receipt unknown after local timeout without a second dispatch', async () => {
    vi.useFakeTimers(); receipt.mockImplementation(() => new Promise(() => {}));
    const result = deliverLead(lead); await vi.advanceTimersByTimeAsync(15000);
    expect(await result).toMatchObject({ ok: false, code: 'RECEIPT_UNKNOWN', status: 504 }); expect(receipt).toHaveBeenCalledOnce();
  });
  it('simulation preserves primary success when secondary fails', async () => {
    vi.stubEnv('FSC_LOCAL_PREVIEW', ''); vi.stubEnv('LEAD_DELIVERY_MODE', 'resend+supabase');
    resend.mockResolvedValue({ ok: true, mode: 'resend', deliveryId: 'synthetic' }); secondary.mockResolvedValue({ ok: false, mode: 'supabase' });
    expect(await deliverLead(lead)).toMatchObject({ ok: true, supabaseStatus: 'failed' }); expect(resend).toHaveBeenCalledOnce();
  });
  it('simulation preserves primary success when secondary throws', async () => {
    vi.stubEnv('FSC_LOCAL_PREVIEW', ''); vi.stubEnv('LEAD_DELIVERY_MODE', 'resend+supabase');
    resend.mockResolvedValue({ ok: true, mode: 'resend', deliveryId: 'synthetic' }); secondary.mockRejectedValue(new Error('synthetic'));
    expect(await deliverLead(lead)).toMatchObject({ ok: true, supabaseStatus: 'failed' }); expect(resend).toHaveBeenCalledOnce();
  });
  it('simulation does not invoke secondary after primary failure', async () => {
    vi.stubEnv('FSC_LOCAL_PREVIEW', ''); vi.stubEnv('LEAD_DELIVERY_MODE', 'resend+supabase');
    resend.mockResolvedValue({ ok: false, mode: 'resend' });
    expect((await deliverLead(lead)).ok).toBe(false); expect(secondary).not.toHaveBeenCalled();
  });
});
it('local rate allowance counts new IDs and resets precisely at10minutes', () => {
  const source = randomUUID(); const first = randomUUID(); expect(allowLocalRequest(source, first, 0)).toBe(true);
  for (let i = 1; i < 20; i++) expect(allowLocalRequest(source, randomUUID(), 0)).toBe(true);
  expect(allowLocalRequest(source, randomUUID(), 599999)).toBe(false);
  expect(allowLocalRequest(source, first, 599999)).toBe(true);
  expect(allowLocalRequest(source, randomUUID(), 600000)).toBe(true);
});
