import { NextResponse } from 'next/server';
import { validateLead } from '@/lib/leads/validateLead';
import { deliverLead } from '@/lib/leads/leadDelivery';
import type { ApiResponse } from '@/lib/leads/types';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const MAX_BODY_BYTES = 32 * 1024;
function error(status: number, message: string, code = 'INVALID', extra: Partial<ApiResponse> = {}, headers: Record<string, string> = {}) {
  return NextResponse.json({ ok: false, error: message, code, ...extra }, { status, headers });
}
export async function POST(req: Request): Promise<NextResponse> {
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error(415, 'Expected application/json request body.');
  const reader = req.body?.getReader();
  let text = '';
  let size = 0;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    if (reader) while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return error(413, 'Request body too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch { return error(400, 'Unable to read request body.'); }
  finally { reader?.releaseLock(); }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return error(400, 'Invalid JSON body.'); }
  const result = validateLead(parsed);
  if (!result.ok) return error(400, result.errors._form || 'Some fields need attention. Please review and try again.', 'INVALID', { fields: result.errors });
  if (!result.lead.requestId) return error(400, 'A request ID is required. Please reload the form and try again.', 'INVALID', { fields: { requestId: 'Required.' } });
  const requestId = result.lead.requestId;
  let delivery;
  try { delivery = await deliverLead(result.lead, requestId, req.headers); }
  catch {
    // M-2a: an unexpected throw here can never be proven a known failure —
    // never label it DELIVERY_FAILED (503). Always uncertain/504, same as
    // the local path already did.
    return error(504, 'We could not confirm receipt. Keep your details and retry this same request.', 'RECEIPT_UNKNOWN', { requestId });
  }
  if (!delivery.ok) {
    const code = delivery.code || 'DELIVERY_FAILED';
    const messages: Record<string, string> = {
      LOCAL_ONLY: 'This local preview accepts test addresses ending in @example.invalid only.',
      CONFLICT: 'This request ID belongs to different details. Start a new request.',
      PENDING: 'Receipt is still uncertain. Keep these details and retry this same request.',
      EXPIRED: 'This request has expired. Start a new request.',
      RATE_LIMIT: 'Too many new requests. Please wait before trying again.',
      RECEIPT_UNKNOWN: 'We could not confirm receipt. Keep your details and retry this same request.',
      // M-2/item 3: CONFIGURATION must not assert non-delivery — it can occur
      // before any provider attempt (e.g. missing config) and must not read
      // like a confirmed failed send.
      CONFIGURATION: "We couldn't process your request right now. Your details have been kept — please try again shortly or call us directly.",
      DELIVERY_FAILED: 'We were unable to deliver your request. Please contact us directly.',
    };
    return error(delivery.status || 503, messages[code] || 'Request delivery is temporarily unavailable. Please try again or contact us directly.', code, { requestId }, delivery.retryAfter ? { 'Retry-After': String(delivery.retryAfter) } : {});
  }
  return NextResponse.json({ ok: true, requestId: delivery.mode === 'local' ? delivery.deliveryId : requestId, message: 'Request received. This is an assessment request, not a confirmed appointment.' }, { status: 200 });
}
export async function GET() { return error(405, 'Method Not Allowed.', 'METHOD', {}, { Allow: 'POST' }); }
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const HEAD = GET;
export const OPTIONS = GET;
