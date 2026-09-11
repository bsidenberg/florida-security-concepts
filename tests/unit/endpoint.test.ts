import { beforeEach, describe, expect, it, vi } from 'vitest';
const delivery = vi.hoisted(() => vi.fn());
vi.mock('../../lib/leads/leadDelivery', () => ({ deliverLead: delivery }));
import { POST, GET } from '../../app/api/leads/route';
import { validLead } from '../fixtures/lead';
const request = (body: string, type = 'application/json') => new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': type }, body });
describe('endpoint rejection before delivery', () => {
  beforeEach(() => delivery.mockReset());
  it.each([['{', 400], ['null', 400], ['[]', 400], ['{}', 400], [JSON.stringify({ ...validLead, honeypot: 'bot' }), 400], ['x'.repeat(32769), 413]])('rejects malformed or unsafe input with %s', async (body, status) => {
    const response = await POST(request(body as string));
    expect(response.status).toBe(status);
    expect((await response.json()).ok).toBe(false);
    expect(delivery).not.toHaveBeenCalled();
  });
  it('rejects unsupported content type without delivery', async () => {
    expect((await POST(request('{}', 'text/plain'))).status).toBe(415);
    expect(delivery).not.toHaveBeenCalled();
  });
  it('rejects GET explicitly', async () => {
    const response = await GET(); expect(response.status).toBe(405); expect(response.headers.get('allow')).toBe('POST');
  });
  it('returns unavailable when a valid lead cannot be delivered', async () => {
    delivery.mockResolvedValue({ ok: false, mode: 'unknown', reason: 'Synthetic failure' });
    const response = await POST(request(JSON.stringify(validLead)));
    expect(response.status).toBe(503); expect(delivery).toHaveBeenCalledOnce();
    expect((await response.json()).ok).toBe(false);
  });
});
