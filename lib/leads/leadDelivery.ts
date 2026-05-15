import type { DeliveryMode, DeliveryResult, ValidatedLead } from './types';
import { deliverViaConsole } from './providers/console';
import { deliverViaResend } from './providers/resend';
import { deliverViaSupabase } from './providers/supabase';
import { deliverViaWebhook } from './providers/webhook';

const VALID_MODES: ReadonlyArray<DeliveryMode> = [
  'console',
  'resend',
  'resend+supabase',
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
    supabaseStatus: result.supabaseStatus,
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

// Dual-write dispatcher: Resend is the primary (its success is the
// user-facing 200 contract); Supabase is the secondary (Prime measurement,
// best-effort).
//
// Failure semantics:
//   - Resend fails → return Resend's failure. Do NOT attempt Supabase.
//     The form will surface 503 and the user will retry. No point burning
//     a row in Prime for a lead the customer hasn't actually been
//     confirmed for.
//   - Resend succeeds, Supabase fails → return success with
//     supabaseStatus='failed'. Customer got their email; Brian sees the
//     measurement gap in [LEAD-SUPABASE-FAILURE] logs.
//   - Both succeed → return success with supabaseStatus='ok'.
async function dispatchResendPlusSupabase(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const resendResult = await deliverViaResend(lead);
  if (!resendResult.ok) {
    return resendResult; // already mode='resend', clear failure path
  }

  const supabaseResult = await deliverViaSupabase(lead);
  if (!supabaseResult.ok) {
    // The provider already logged with [LEAD-SUPABASE-FAILURE]. Add a
    // dispatcher-level breadcrumb so the dual-write context is in logs.
    console.warn(
      '[lead-delivery:resend+supabase] supabase secondary write failed (resend succeeded)',
      {
        resendDeliveryId: resendResult.deliveryId,
        supabaseReason: supabaseResult.reason,
      }
    );
  }

  return {
    ok: true,
    mode: 'resend+supabase',
    deliveryId: resendResult.deliveryId,
    supabaseStatus: supabaseResult.ok ? 'ok' : 'failed',
  };
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
      // Supabase-only is supported for debugging and Supabase-only smoke
      // tests. Production should generally use 'resend+supabase' so the
      // customer still gets their confirmation email.
      return deliverViaSupabase(lead);
    case 'resend+supabase':
      return dispatchResendPlusSupabase(lead);
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
