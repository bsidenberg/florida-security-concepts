import { randomUUID } from 'node:crypto';
import type { DeliveryResult, ValidatedLead } from './types';
import { deliverLocalReceipt } from './localReceipt';
import { allowLocalRequest } from './localRate';
import { isHostedPreview } from './environment';
export const hostedMarkers = ['VERCEL','VERCEL_ENV','VERCEL_TARGET_ENV','NETLIFY','RENDER','AWS_LAMBDA_FUNCTION_NAME'];
function unavailable(): DeliveryResult { return { ok: false, mode: 'unknown', reason: 'CONFIGURATION', code: 'CONFIGURATION', status: 503 }; }
export async function deliverLead(lead: ValidatedLead, requestId = lead.requestId || randomUUID(), headers?: Headers): Promise<DeliveryResult> {
  const mode = process.env.LEAD_DELIVERY_MODE?.trim();
  const localFlag = process.env.FSC_LOCAL_PREVIEW;
  const hosted = hostedMarkers.some(key => Boolean(process.env[key]));
  if (isHostedPreview()) return unavailable();
  // Exclusive branch before provider imports: environment-file credentials cannot escape local mode.
  if (localFlag || mode === 'local') {
    if (localFlag !== '1' || mode !== 'local' || hosted) return unavailable();
    if (process.env.FSC_LOCAL_FAILURE === '1') return { ok: false, mode: 'local', reason: 'DELIVERY_FAILED', code: 'DELIVERY_FAILED', status: 503 };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        deliverLocalReceipt(lead, requestId, { beforeCreate: () => allowLocalRequest('loopback', requestId) }),
        new Promise<DeliveryResult>(resolve => { timeout = setTimeout(() => resolve({ ok: false, mode: 'local', reason: 'RECEIPT_UNKNOWN', code: 'RECEIPT_UNKNOWN', status: 504 }), 15000); }),
      ]);
    } finally { if (timeout) clearTimeout(timeout); }
  }
  if (!mode || (mode === 'console' && (hosted || process.env.NODE_ENV === 'production'))) return unavailable();
  let result: DeliveryResult;
  try {
    switch (mode) {
      case 'console': result = await (await import('./providers/console')).deliverViaConsole(lead); break;
      case 'resend':
      case 'resend+supabase': {
        const receipt = await import('./productionReceipt');
        let deps: ReturnType<typeof receipt.productionDependencies>;
        try { deps = receipt.productionDependencies(); }
        catch { result = { ok: false, mode: 'resend+supabase', reason: 'CONFIGURATION', code: 'CONFIGURATION', status: 503 }; break; }
        const { trustedSourceDigest } = await import('./admission');
        const source = headers ? trustedSourceDigest(headers) : null;
        // M-2a: deliverProductionReceipt is designed never to throw, but an
        // unexpected exception here must never be mislabeled a known
        // failure — the provider state may be genuinely unknown.
        try { result = await receipt.deliverProductionReceipt(lead, requestId, deps, source); }
        catch { result = { ok: false, mode: 'resend+supabase', reason: 'RECEIPT_UNKNOWN', code: 'RECEIPT_UNKNOWN', status: 504 }; }
        break;
      }
      default: return unavailable();
    }
  } catch {
    // R2-2: reachable before any RPC (e.g. a dynamic import failure) on a
    // same-ID retry of a possibly-already-sent email — never label an
    // unknown outcome a known failure.
    result = { ok: false, mode: 'unknown', reason: 'RECEIPT_UNKNOWN', code: 'RECEIPT_UNKNOWN', status: 504 };
  }
  console.info('[lead-delivery]', { result: result.ok ? 'received' : 'unavailable', mode: result.mode });
  return result;
}
