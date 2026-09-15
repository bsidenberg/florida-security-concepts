// D-023 / review M-2a: an unexpected throw from delivery can never be proven a
// known failure, so the route must answer 504 RECEIPT_UNKNOWN (retry the same
// request), never 503 DELIVERY_FAILED, in both local and production modes.
// Kept separate from endpoint.test.ts: with that file's beforeEach mockReset,
// Vitest 4 reports the mock's rejection as a test error even though the route
// handles it (verified by a temporary bisect: the route returned 504 in both).
import { afterEach, describe, expect, it, vi } from 'vitest';
const delivery = vi.hoisted(() => vi.fn());
vi.mock('../../lib/leads/leadDelivery', () => ({ deliverLead: delivery }));
import { POST } from '../../app/api/leads/route';
import { validLead } from '../fixtures/lead';

afterEach(() => { vi.unstubAllEnvs(); });

describe('route handling of unexpected delivery errors', () => {
  it.each(['', '1'])('FSC_LOCAL_PREVIEW=%j: a rejected delivery returns 504 RECEIPT_UNKNOWN with the request ID', async localFlag => {
    vi.stubEnv('FSC_LOCAL_PREVIEW', localFlag);
    delivery.mockImplementation(async () => { throw new Error('synthetic unexpected failure'); });
    const response = await POST(new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validLead) }));
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ ok: false, code: 'RECEIPT_UNKNOWN', requestId: validLead.requestId });
    expect(delivery).toHaveBeenCalledTimes(1);
    delivery.mockClear();
  });
});
