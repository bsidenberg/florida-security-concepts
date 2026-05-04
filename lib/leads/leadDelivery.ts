import type { DeliveryMode, DeliveryResult, ValidatedLead } from './types';
import { deliverViaConsole } from './providers/console';
import { deliverViaResend } from './providers/resend';
import { deliverViaWebhook } from './providers/webhook';

const VALID_MODES: ReadonlyArray<DeliveryMode> = [
  'console',
  'resend',
  'supabase',
  'webhook',
];

function readMode(): { mode: DeliveryMode | null; raw: string | undefined } {
  const raw = process.env.LEAD_DELIVERY_MODE?.trim();
  if (!raw) return { mode: null, raw };
  if ((VALID_MODES as ReadonlyArray<string>).includes(raw)) {
    return { mode: raw as DeliveryMode, raw };
  }
  return { mode: null, raw };
}

// Minimal post-delivery log — safe in production. Excludes phone, email,
// full name, and message body. Useful for ops dashboards and audits.
function logSuccess(result: DeliveryResult, lead: ValidatedLead) {
  if (!result.ok) return;
  console.log('[lead-delivery] success', {
    mode: result.mode,
    deliveryId: result.deliveryId,
    submittedAt: lead.submittedAt,
    city: lead.city,
    serviceNeeded: lead.service,
    urgency: lead.urgency,
    sourcePage: lead.sourcePage,
  });
}

function logFailure(result: DeliveryResult, lead: ValidatedLead) {
  if (result.ok) return;
  console.error('[lead-delivery] failure', {
    mode: result.mode,
    reason: result.reason,
    submittedAt: lead.submittedAt,
    city: lead.city,
    serviceNeeded: lead.service,
    urgency: lead.urgency,
  });
}

async function dispatch(
  mode: DeliveryMode,
  lead: ValidatedLead
): Promise<DeliveryResult> {
  switch (mode) {
    case 'console':
      return deliverViaConsole(lead);
    case 'resend':
      return deliverViaResend(lead);
    case 'webhook':
      return deliverViaWebhook(lead);
    case 'supabase':
      return {
        ok: false,
        mode: 'supabase',
        reason:
          'Supabase delivery provider is not implemented yet. Set LEAD_DELIVERY_MODE to console, resend, or webhook — or implement lib/leads/providers/supabase.ts.',
      };
  }
}

export async function deliverLead(lead: ValidatedLead): Promise<DeliveryResult> {
  const { mode, raw } = readMode();
  const isProd = process.env.NODE_ENV === 'production';

  // Production guardrail — never silently accept a misconfigured pipeline.
  if (!mode) {
    if (isProd) {
      const reason = raw
        ? `LEAD_DELIVERY_MODE="${raw}" is not a supported provider.`
        : 'LEAD_DELIVERY_MODE is not configured.';
      const failure: DeliveryResult = { ok: false, mode: 'unknown', reason };
      logFailure(failure, lead);
      return failure;
    }
    // In development, fall back to console with a notice.
    console.warn(
      '[lead-delivery] LEAD_DELIVERY_MODE not set — defaulting to "console" for development.'
    );
    const result = await deliverViaConsole(lead);
    if (result.ok) logSuccess(result, lead);
    else logFailure(result, lead);
    return result;
  }

  const result = await dispatch(mode, lead);
  if (result.ok) logSuccess(result, lead);
  else logFailure(result, lead);
  return result;
}
