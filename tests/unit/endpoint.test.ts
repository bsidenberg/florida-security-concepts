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
  it('measures UTF-8 bytes rather than JavaScript character count', async () => {
    const response = await POST(request(JSON.stringify({ ...validLead, message: '界'.repeat(11000) })));
    expect(response.status).toBe(413); expect(delivery).not.toHaveBeenCalled();
  });
  it('rejects malformed logical request IDs before delivery', async () => {
    const response = await POST(request(JSON.stringify({ ...validLead, requestId: '../receipt' })));
    expect(response.status).toBe(400); expect(delivery).not.toHaveBeenCalled();
  });
  it('accepts exact body-byte ceiling without truncating payload', async () => {
    delivery.mockResolvedValue({ ok: true, mode: 'local', deliveryId: validLead.requestId });
    const json = JSON.stringify(validLead);
    const body = json + ' '.repeat(32768 - Buffer.byteLength(json));
    expect((await POST(request(body))).status).toBe(200);
    expect(delivery).toHaveBeenCalledOnce();
  });
  it('does not trust a small Content-Length on an oversized stream', async () => {
    const req = new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '2' }, body: ' '.repeat(32769) });
    expect((await POST(req)).status).toBe(413); expect(delivery).not.toHaveBeenCalled();
  });
  it('returns unavailable when a valid lead cannot be delivered', async () => {
    delivery.mockResolvedValue({ ok: false, mode: 'unknown', reason: 'Synthetic failure' });
    const response = await POST(request(JSON.stringify(validLead)));
    expect(response.status).toBe(503); expect(delivery).toHaveBeenCalledOnce();
    expect((await response.json()).ok).toBe(false);
  });
  it('passes the incoming request headers to delivery so the dispatcher can read the trusted source header', async () => {
    delivery.mockResolvedValue({ ok: true, mode: 'resend+supabase', deliveryId: 'synthetic' });
    const req = new Request('http://127.0.0.1/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.61' }, body: JSON.stringify(validLead) });
    expect((await POST(req)).status).toBe(200);
    const [passedLead, passedId, passedHeaders] = delivery.mock.calls[0];
    expect(passedLead).toMatchObject({ email: validLead.email, requestId: validLead.requestId });
    expect(passedId).toBe(validLead.requestId);
    expect((passedHeaders as Headers).get('x-vercel-forwarded-for')).toBe('203.0.113.61');
  });
  it('rejects a valid lead without a request ID before delivery', async () => {
    const { requestId: _omit, ...withoutId } = validLead;
    const response = await POST(request(JSON.stringify(withoutId)));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, code: 'INVALID', fields: { requestId: expect.any(String) } });
    expect(delivery).not.toHaveBeenCalled();
  });
  it.each([['CONFLICT', 409],['PENDING', 409], ['EXPIRED', 409], ['RATE_LIMIT', 429], ['RECEIPT_UNKNOWN', 504], ['CONFIGURATION', 503]])('exposes safe %s state and retains request ID', async (code, status) => {
    delivery.mockResolvedValue({ ok: false, mode: 'local', code, status, retryAfter: code === 'RATE_LIMIT' ? 600 : undefined });
    const response = await POST(request(JSON.stringify(validLead)));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ ok: false, code, requestId: validLead.requestId });
    if (code === 'RATE_LIMIT') expect(response.headers.get('retry-after')).toBe('600');
  });
});
