// Resend delivery provider — sends a notification email per lead.
//
// Required env vars:
//   RESEND_API_KEY         — secret API key from resend.com
//   LEAD_NOTIFICATION_TO   — recipient address (or comma-separated list)
//   LEAD_NOTIFICATION_FROM — verified sender address (must be on a domain
//                            verified in Resend, or the Resend onboarding domain)
//
// Behavior on missing env vars: returns a clear configuration error so the API
// route can respond with 503. The lead is NOT considered delivered.

import { Resend } from 'resend';
import type { DeliveryResult, ValidatedLead } from '../types';

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

export async function deliverViaResend(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const env = readEnv();
  if (!env.ok) {
    return { ok: false, mode: 'resend', reason: env.reason };
  }

  const client = new Resend(env.apiKey);

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
      // Resend SDK returns a structured error object — log and surface a safe message.
      console.error('[lead-delivery:resend] send failed:', {
        name: error.name,
        message: error.message,
      });
      return {
        ok: false,
        mode: 'resend',
        reason: `Resend API error: ${error.name || 'unknown'} — ${error.message || 'no message'}`,
      };
    }

    return { ok: true, mode: 'resend', deliveryId: data?.id };
  } catch (err) {
    // Network / unexpected SDK errors. Do NOT pretend the lead was delivered.
    const reason =
      err instanceof Error ? err.message : 'Unknown error during Resend send.';
    console.error('[lead-delivery:resend] unexpected error:', reason);
    return { ok: false, mode: 'resend', reason };
  }
}
