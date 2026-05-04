// Webhook delivery provider — POSTs the normalized lead to an external URL.
// Suitable for HubSpot, Zapier, Make, n8n, or a private CRM endpoint.
//
// Required env vars:
//   LEADS_WEBHOOK_URL    — full URL to POST the lead JSON to
// Optional:
//   LEADS_WEBHOOK_SECRET — sent as `X-Webhook-Secret` header for receiver verification
//
// Active only when LEAD_DELIVERY_MODE=webhook.

import type { DeliveryResult, ValidatedLead } from '../types';

const REQUEST_TIMEOUT_MS = 8000;

export async function deliverViaWebhook(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const url = process.env.LEADS_WEBHOOK_URL?.trim();
  const secret = process.env.LEADS_WEBHOOK_SECRET?.trim();

  if (!url) {
    return {
      ok: false,
      mode: 'webhook',
      reason: 'Webhook provider missing required env var: LEADS_WEBHOOK_URL.',
    };
  }

  // Validate URL — reject obvious misconfigurations early.
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('protocol');
    }
  } catch {
    return {
      ok: false,
      mode: 'webhook',
      reason: 'LEADS_WEBHOOK_URL is not a valid http/https URL.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'FloridaSecurityConcepts-Leads/1.0',
  };
  if (secret) headers['X-Webhook-Secret'] = secret;

  try {
    const res = await fetch(parsed.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'florida-security-concepts', lead }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Capture a small slice of the response body for diagnostics; cap to avoid
      // dragging huge HTML error pages into logs.
      let bodyPreview = '';
      try {
        bodyPreview = (await res.text()).slice(0, 500);
      } catch {
        // ignore
      }
      console.error('[lead-delivery:webhook] non-2xx response', {
        status: res.status,
        statusText: res.statusText,
        preview: bodyPreview,
      });
      return {
        ok: false,
        mode: 'webhook',
        reason: `Webhook responded ${res.status} ${res.statusText}.`,
      };
    }

    return { ok: true, mode: 'webhook' };
  } catch (err) {
    clearTimeout(timeoutId);
    const reason =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Webhook request timed out after ${REQUEST_TIMEOUT_MS}ms.`
          : err.message
        : 'Unknown error during webhook send.';
    console.error('[lead-delivery:webhook] error:', reason);
    return { ok: false, mode: 'webhook', reason };
  }
}
