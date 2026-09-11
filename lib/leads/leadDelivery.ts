import { randomUUID } from 'node:crypto';
import type { DeliveryResult, ValidatedLead } from './types';
import { deliverLocalReceipt } from './localReceipt';
import { allowLocalRequest } from './localRate';
export const hostedMarkers = ['VERCEL','VERCEL_ENV','VERCEL_TARGET_ENV','NETLIFY','RENDER','AWS_LAMBDA_FUNCTION_NAME'];
function unavailable(): DeliveryResult { return { ok: false, mode: 'unknown', reason: 'CONFIGURATION', code: 'CONFIGURATION', status: 503 }; }
export async function deliverLead(lead: ValidatedLead, requestId = lead.requestId || randomUUID(), source = 'loopback'): Promise<DeliveryResult> {
  const mode = process.env.LEAD_DELIVERY_MODE?.trim();
  const localFlag = process.env.FSC_LOCAL_PREVIEW;
  const hosted = hostedMarkers.some(key => Boolean(process.env[key]));
  // Exclusive branch before provider imports: environment-file credentials cannot escape local mode.
  if (localFlag || mode === 'local') {
    if (localFlag !== '1' || mode !== 'local' || hosted) return unavailable();
    if (process.env.FSC_LOCAL_FAILURE === '1') return { ok: false, mode: 'local', reason: 'DELIVERY_FAILED', code: 'DELIVERY_FAILED', status: 503 };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        deliverLocalReceipt(lead, requestId, { beforeCreate: () => allowLocalRequest(source, requestId) }),
        new Promise<DeliveryResult>(resolve => { timeout = setTimeout(() => resolve({ ok: false, mode: 'local', reason: 'RECEIPT_UNKNOWN', code: 'RECEIPT_UNKNOWN', status: 504 }), 15000); }),
      ]);
    } finally { if (timeout) clearTimeout(timeout); }
  }
  if (!mode || (mode === 'console' && (hosted || process.env.NODE_ENV === 'production'))) return unavailable();
  let result: DeliveryResult;
  try {
    switch (mode) {
      case 'console': result = await (await import('./providers/console')).deliverViaConsole(lead); break;
      case 'resend': result = await (await import('./providers/resend')).deliverViaResend(lead); break;
      case 'webhook': result = await (await import('./providers/webhook')).deliverViaWebhook(lead); break;
      case 'supabase': result = await (await import('./providers/supabase')).deliverViaSupabase(lead); break;
      case 'resend+supabase': {
        const primary = await (await import('./providers/resend')).deliverViaResend(lead);
        if (!primary.ok) { result = primary; break; }
        let secondaryOk = false;
        try { secondaryOk = (await (await import('./providers/supabase')).deliverViaSupabase(lead)).ok; }
        catch { console.warn('[lead-delivery] secondary_unavailable'); }
        result = { ...primary, mode: 'resend+supabase', supabaseStatus: secondaryOk ? 'ok' : 'failed' };
        break;
      }
      default: return unavailable();
    }
  } catch { result = { ok: false, mode: 'unknown', reason: 'DELIVERY_FAILED' }; }
  console.info('[lead-delivery]', { result: result.ok ? 'received' : 'unavailable', mode: result.mode });
  return result;
}
