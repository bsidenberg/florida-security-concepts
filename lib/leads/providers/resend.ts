// Resend delivery provider — sends two emails per validated lead:
//
//   1. Internal/company notification (primary, must succeed for the API to
//      return success).
//   2. Customer-facing confirmation to the submitter (best-effort; a failure
//      logs a warning but does NOT fail the lead — the lead was already
//      captured and the company already received it).
//
// Required env vars:
//   RESEND_API_KEY            — secret API key from resend.com
//   LEAD_NOTIFICATION_TO      — internal recipient(s); comma-separated list ok
//   LEAD_NOTIFICATION_FROM    — verified sender address (on a Resend-verified
//                               domain, or the Resend onboarding domain)
//
// Optional env vars for the customer confirmation:
//   LEAD_CONFIRMATION_ENABLED  — "false"/"0"/"no"/"off" disables. Default on.
//   LEAD_CONFIRMATION_FROM     — sender for confirmation. Falls back to
//                                LEAD_NOTIFICATION_FROM when unset/blank.
//   LEAD_CONFIRMATION_REPLY_TO — Reply-To on confirmation. Falls back to the
//                                first address in LEAD_NOTIFICATION_TO so
//                                replies route to the company inbox.
//
// Behavior on missing required env vars: returns a configuration error so the
// API route can respond with 503. The lead is NOT considered delivered.

import { Resend } from 'resend';
import type { DeliveryResult, ValidatedLead } from '../types';
import { site, hasPhone } from '@/data/site';

type EnvCheck =
  | { ok: true; apiKey: string; to: string[]; from: string }
  | { ok: false; reason: string };

function readEnv(): EnvCheck {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toRaw = process.env.LEAD_NOTIFICATION_TO?.trim();
  const from = process.env.LEAD_NOTIFICATION_FROM?.trim();

  const missing: string[] = [];
  if (!apiKey) missing.push('RESEND_API_KEY');
  if (!toRaw) missing.push('LEAD_NOTIFICATION_TO');
  if (!from) missing.push('LEAD_NOTIFICATION_FROM');
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Resend provider missing required env var(s): ${missing.join(', ')}.`,
    };
  }

  const to = (toRaw as string)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (to.length === 0) {
    return {
      ok: false,
      reason: 'LEAD_NOTIFICATION_TO is set but contains no valid addresses.',
    };
  }

  return {
    ok: true,
    apiKey: apiKey as string,
    from: from as string,
    to,
  };
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] || c);
}

function buildSubject(lead: ValidatedLead): string {
  const parts = [
    lead.urgency,
    lead.service,
    lead.city,
    lead.propertyType,
  ].filter((p): p is string => Boolean(p && p.trim().length > 0));
  const tag = lead.urgency === 'Emergency' ? '[FSC EMERGENCY]' : '[FSC Lead]';
  return `${tag} ${parts.join(' · ')}`.slice(0, 200);
}

type FieldRow = { label: string; value: string | undefined };

function rowsFor(lead: ValidatedLead): FieldRow[] {
  return [
    { label: 'Submitted', value: lead.submittedAt },
    { label: 'Urgency', value: lead.urgency },
    { label: 'Service needed', value: lead.service },
    { label: 'Property type', value: lead.propertyType },
    { label: 'City / service area', value: lead.city },
    { label: 'Full name', value: lead.fullName },
    { label: 'Phone', value: lead.phone },
    { label: 'Email', value: lead.email },
    { label: 'Company / community', value: lead.company },
    { label: 'Preferred contact method', value: lead.contactMethod },
    { label: 'Message', value: lead.message },
    { label: 'Source page', value: lead.sourcePage },
    { label: 'Service slug', value: lead.serviceSlug },
    { label: 'Industry slug', value: lead.industrySlug },
    { label: 'Location slug', value: lead.locationSlug },
    { label: 'UTM source', value: lead.utmSource },
    { label: 'UTM medium', value: lead.utmMedium },
    { label: 'UTM campaign', value: lead.utmCampaign },
    { label: 'Referrer', value: lead.referrer },
  ];
}

function buildPlainText(lead: ValidatedLead): string {
  const lines = [
    'New Florida Security Concepts lead',
    '----------------------------------',
  ];
  for (const { label, value } of rowsFor(lead)) {
    if (value && value.toString().trim().length > 0) {
      lines.push(`${label}: ${value}`);
    }
  }
  lines.push('');
  lines.push('Reply directly to this email to contact the requester.');
  return lines.join('\n');
}

function buildHtml(lead: ValidatedLead): string {
  const rows = rowsFor(lead)
    .filter(({ value }) => value && value.toString().trim().length > 0)
    .map(({ label, value }) => {
      const safeValue = escapeHtml(String(value));
      return `<tr>
        <td style="padding:8px 14px 8px 0;border-bottom:1px solid #e5e7eb;font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;vertical-align:top;">${escapeHtml(
        label
      )}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;vertical-align:top;">${safeValue.replace(
          /\n/g,
          '<br>'
        )}</td>
      </tr>`;
    })
    .join('');

  const accent = lead.urgency === 'Emergency' ? '#b45309' : '#1d4ed8';
  const eyebrow =
    lead.urgency === 'Emergency'
      ? 'EMERGENCY · NEW LEAD'
      : 'NEW LEAD · FLORIDA SECURITY CONCEPTS';

  return `<!doctype html>
<html><body style="margin:0;background:#f3f4f6;padding:24px;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="padding:18px 24px;background:#0f1422;color:#e2e8f0;">
        <div style="font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:${accent === '#b45309' ? '#fbbf24' : '#60a5fa'};">${eyebrow}</div>
        <div style="margin-top:6px;font:600 18px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;">
          ${escapeHtml(lead.service)} · ${escapeHtml(lead.propertyType)}${lead.city ? ' · ' + escapeHtml(lead.city) : ''}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="margin:18px 0 0;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;">
          Reply to this email to contact the requester. Their address is set as Reply-To.
        </p>
      </td>
    </tr>
  </table>
</body></html>`;
}

// --- Customer confirmation -------------------------------------------------

type ConfirmationConfig = {
  enabled: boolean;
  from: string;
  replyTo: string | undefined;
};

const FALSY = new Set(['false', '0', 'no', 'off']);

function readConfirmationConfig(
  internalFrom: string,
  internalTo: string[]
): ConfirmationConfig {
  const rawEnabled = process.env.LEAD_CONFIRMATION_ENABLED?.trim().toLowerCase();
  const enabled =
    rawEnabled === undefined || rawEnabled === ''
      ? true
      : !FALSY.has(rawEnabled);

  const fromOverride = process.env.LEAD_CONFIRMATION_FROM?.trim();
  const replyToOverride = process.env.LEAD_CONFIRMATION_REPLY_TO?.trim();

  return {
    enabled,
    from:
      fromOverride && fromOverride.length > 0 ? fromOverride : internalFrom,
    replyTo:
      replyToOverride && replyToOverride.length > 0
        ? replyToOverride
        : internalTo.length > 0
        ? internalTo[0]
        : undefined,
  };
}

function firstName(fullName: string): string | undefined {
  const t = fullName.trim();
  if (!t) return undefined;
  const first = t.split(/\s+/)[0];
  return first.length > 0 ? first : undefined;
}

const CONFIRMATION_SUBJECT = 'Florida Security Concepts received your request';

// Customer-facing summary: ONLY user-submitted, user-relevant fields.
// Excludes UTM, referrer, sourcePage, slugs, honeypot, system metadata.
function customerSummaryRows(lead: ValidatedLead): { label: string; value: string }[] {
  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Service needed', value: lead.service },
    { label: 'Property type', value: lead.propertyType },
    { label: 'City / service area', value: lead.city },
    { label: 'Urgency', value: lead.urgency },
    { label: 'Preferred contact method', value: lead.contactMethod },
  ];
  return rows.filter(
    (r): r is { label: string; value: string } =>
      typeof r.value === 'string' && r.value.trim().length > 0
  );
}

function buildConfirmationPlainText(lead: ValidatedLead): string {
  const fn = firstName(lead.fullName);
  const greeting = fn ? `Hi ${fn},` : 'Hello,';
  const lines: string[] = [
    greeting,
    '',
    "Thanks for reaching out to Florida Security Concepts. We've received your request, and a member of our team will review your property and service details before following up.",
    '',
    'Most assessment requests are reviewed the same business day.',
    '',
    "Here's what we received:",
  ];
  for (const { label, value } of customerSummaryRows(lead)) {
    lines.push(`- ${label}: ${value}`);
  }
  lines.push('');

  if (hasPhone()) {
    lines.push(
      `If this is an urgent gate, access, or security system issue, please call us directly at ${site.phoneDisplay}.`
    );
  } else {
    lines.push(
      'If this is an urgent gate, access, or security system issue, please reply to this email and note that it is urgent so we can triage it quickly.'
    );
  }

  lines.push('');
  lines.push('— Florida Security Concepts');
  return lines.join('\n');
}

function buildConfirmationHtml(lead: ValidatedLead): string {
  const fn = firstName(lead.fullName);
  const greeting = fn ? `Hi ${escapeHtml(fn)},` : 'Hello,';
  const summary = customerSummaryRows(lead)
    .map(
      ({ label, value }) => `<tr>
        <td style="padding:8px 14px 8px 0;border-bottom:1px solid #e5e7eb;font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  const urgentLine = hasPhone()
    ? `If this is an urgent gate, access, or security system issue, please call us directly at <strong>${escapeHtml(site.phoneDisplay)}</strong>.`
    : 'If this is an urgent gate, access, or security system issue, please reply to this email and note that it is urgent so we can triage it quickly.';

  return `<!doctype html>
<html><body style="margin:0;background:#f3f4f6;padding:24px;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="padding:18px 24px;background:#0f1422;color:#e2e8f0;">
        <div style="font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#60a5fa;">REQUEST RECEIVED</div>
        <div style="margin-top:6px;font:600 18px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;">Florida Security Concepts</div>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px 6px;">
        <p style="margin:0 0 12px;font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">${greeting}</p>
        <p style="margin:0 0 12px;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#374151;">Thanks for reaching out to Florida Security Concepts. We&rsquo;ve received your request, and a member of our team will review your property and service details before following up.</p>
        <p style="margin:0 0 18px;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#374151;">Most assessment requests are reviewed the same business day.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 8px;">
        <div style="font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">What we received</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${summary}</table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px 22px;">
        <p style="margin:0;font:13px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#374151;">${urgentLine}</p>
        <p style="margin:14px 0 0;font:13px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;">&mdash; Florida Security Concepts</p>
      </td>
    </tr>
  </table>
</body></html>`;
}

type ConfirmationResult =
  | { ok: true; deliveryId?: string }
  | { ok: false; reason: string; errorName?: string };

async function sendCustomerConfirmation(
  client: Resend,
  config: ConfirmationConfig,
  lead: ValidatedLead
): Promise<ConfirmationResult> {
  try {
    const { data, error } = await client.emails.send({
      from: config.from,
      to: lead.email,
      replyTo: config.replyTo,
      subject: CONFIRMATION_SUBJECT,
      text: buildConfirmationPlainText(lead),
      html: buildConfirmationHtml(lead),
    });

    if (error) {
      return {
        ok: false,
        reason: `${error.name || 'unknown'} — ${error.message || 'no message'}`,
        errorName: error.name || undefined,
      };
    }
    return { ok: true, deliveryId: data?.id };
  } catch (err) {
    const reason =
      err instanceof Error
        ? err.message
        : 'Unknown error during confirmation send.';
    return { ok: false, reason };
  }
}

// --- Main delivery ---------------------------------------------------------

export async function deliverViaResend(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const env = readEnv();
  if (!env.ok) {
    return { ok: false, mode: 'resend', reason: env.reason };
  }

  const client = new Resend(env.apiKey);

  // 1) Internal/company notification — primary, must succeed for API success.
  let internalDeliveryId: string | undefined;
  try {
    const { data, error } = await client.emails.send({
      from: env.from,
      to: env.to,
      replyTo: lead.email,
      subject: buildSubject(lead),
      text: buildPlainText(lead),
      html: buildHtml(lead),
    });

    if (error) {
      console.error('[lead-delivery:resend] internal send failed:', {
        name: error.name,
        message: error.message,
      });
      return {
        ok: false,
        mode: 'resend',
        reason: `Resend API error: ${error.name || 'unknown'} — ${error.message || 'no message'}`,
      };
    }
    internalDeliveryId = data?.id;
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : 'Unknown error during Resend send.';
    console.error('[lead-delivery:resend] internal unexpected error:', reason);
    return { ok: false, mode: 'resend', reason };
  }

  // 2) Customer confirmation — best-effort. A failure does NOT fail the lead.
  const confirmationConfig = readConfirmationConfig(env.from, env.to);
  if (confirmationConfig.enabled) {
    const result = await sendCustomerConfirmation(
      client,
      confirmationConfig,
      lead
    );
    if (!result.ok) {
      console.warn('[lead-delivery:resend] customer confirmation failed', {
        mode: 'resend',
        confirmationFailed: true,
        errorName: result.errorName,
        errorMessage: result.reason,
        submittedAt: lead.submittedAt,
        serviceNeeded: lead.service,
        urgency: lead.urgency,
      });
    }
  }

  return { ok: true, mode: 'resend', deliveryId: internalDeliveryId };
}
