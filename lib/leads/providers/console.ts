import type { DeliveryResult, ValidatedLead } from '../types';
export async function deliverViaConsole(_lead: ValidatedLead): Promise<DeliveryResult> {
  if (process.env.NODE_ENV === 'production' || ['VERCEL','VERCEL_ENV','VERCEL_TARGET_ENV','NETLIFY','RENDER','AWS_LAMBDA_FUNCTION_NAME'].some(key => process.env[key])) return { ok: false, mode: 'console', reason: 'CONFIGURATION' };
  console.info('[lead-delivery:console] synthetic development receipt');
  return { ok: true, mode: 'console' };
}
