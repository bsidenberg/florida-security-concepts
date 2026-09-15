// Synthetic receipt RPC arguments for SQL-level tests (all data @example.invalid).
import { createHash, randomUUID } from 'node:crypto';

export const COMPANY_TO = 'info@floridasecurityconcepts.com';
export const TEMPLATE = 'fsc-assessment-v3';

export function uuid4(): string { return randomUUID(); }
export function digestFor(label: string): string { return createHash('sha256').update(`synthetic-source:${label}`).digest('hex'); }

export type ReceiptOptions = { requestId?: string; message?: string; source?: string | null; customer?: boolean; utmSource?: string; email?: string };
export function receiptArgs(options: ReceiptOptions = {}) {
  const email = options.email ?? `fsc-sql-${Math.random().toString(16).slice(2, 10)}@example.invalid`;
  const payload = {
    fullName: 'Synthetic Sql Tester', email, phone: '2025550100', propertyType: 'HOA / gated community', service: 'Maintenance / service',
    city: 'Orlando', company: '', urgency: 'Planning / budgeting', contactMethod: 'Email', message: options.message ?? 'Synthetic SQL verification only.',
    ...(options.utmSource ? { utmSource: options.utmSource } : {}),
  };
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...payload, utmSource: undefined })).digest('hex');
  const envelopes: Record<string, unknown> = {
    company_email: { from: 'FSC Synthetic <sender@example.invalid>', to: COMPANY_TO, reply_to: email, subject: '[FSC Lead] synthetic', text: `Synthetic ${payload.message}`, html: '<p>Synthetic</p>' },
  };
  if (options.customer !== false) envelopes.customer_email = { from: 'FSC Synthetic <sender@example.invalid>', to: email, subject: 'Synthetic confirmation', text: 'Synthetic', html: '<p>Synthetic</p>' };
  return {
    p_slug: 'fsc', p_request: options.requestId ?? uuid4(), p_fingerprint: fingerprint, p_payload: payload, p_envelopes: envelopes, p_template: TEMPLATE,
    p_source: options.source === undefined ? digestFor('default') : options.source,
  };
}
