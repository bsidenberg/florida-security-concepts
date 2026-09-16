// Email envelope snapshot content (lib/leads/providers/resend.ts, D-024): the
// company notification carries the inquiry; the optional customer confirmation
// must not echo visitor-controlled free text to the submitted address.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { snapshotEmailEnvelopes } from '../../lib/leads/providers/resend';
import { validateLead } from '../../lib/leads/validateLead';
import { validLead } from '../fixtures/lead';

const FREE_TEXT = { fullName: 'Quillonia Phishbait-Relay', city: 'Zorbtown Clickhere', company: 'Evil Relay Corp http://attacker.example.invalid', message: 'Visit http://attacker.example.invalid/win <script>alert(1)</script>' };
function lead() {
  const result = validateLead({ ...validLead, ...FREE_TEXT });
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.lead;
}
beforeEach(() => {
  vi.stubEnv('LEAD_NOTIFICATION_FROM', 'FSC Synthetic <notify@example.invalid>');
  vi.stubEnv('LEAD_CONFIRMATION_FROM', '');
  vi.stubEnv('LEAD_CONFIRMATION_REPLY_TO', '');
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('snapshotEmailEnvelopes', () => {
  it('company notification goes to the approved inbox from the configured sender, with reply-to the visitor and the full inquiry (HTML escaped)', () => {
    vi.stubEnv('LEAD_CONFIRMATION_ENABLED', 'true');
    const input = lead();
    const { company_email: company } = snapshotEmailEnvelopes(input);
    expect(company).toMatchObject({ to: 'info@floridasecurityconcepts.com', from: 'FSC Synthetic <notify@example.invalid>', reply_to: input.email });
    for (const value of Object.values(FREE_TEXT)) expect(company.text).toContain(value);
    expect(company.html).toContain('Quillonia Phishbait-Relay');
    expect(company.html).not.toContain('<script>');
    expect(company.html).toContain('&lt;script&gt;');
  });

  it('customer confirmation (enabled) is addressed to the visitor and contains no submitted name, city, company or message in subject, text or html', () => {
    vi.stubEnv('LEAD_CONFIRMATION_ENABLED', 'true');
    const input = lead();
    const envelopes = snapshotEmailEnvelopes(input);
    const customer = envelopes.customer_email;
    expect(customer).toBeDefined();
    expect(customer.to).toBe(input.email);
    const rendered = `${customer.subject}\n${customer.text}\n${customer.html}`;
    for (const fragment of ['Quillonia', 'Phishbait', 'Zorbtown', 'Clickhere', 'Evil Relay', 'attacker.example.invalid', 'alert(1)', 'Visit http']) {
      expect(rendered.includes(fragment), `customer confirmation echoes "${fragment}"`).toBe(false);
    }
  });

  it.each(['false', '0', 'no', 'off'])('LEAD_CONFIRMATION_ENABLED=%s snapshots only the company envelope', value => {
    vi.stubEnv('LEAD_CONFIRMATION_ENABLED', value);
    expect(Object.keys(snapshotEmailEnvelopes(lead()))).toEqual(['company_email']);
  });

  it('refuses to snapshot without a configured sender', () => {
    vi.stubEnv('LEAD_NOTIFICATION_FROM', '');
    expect(() => snapshotEmailEnvelopes(lead())).toThrow(/CONFIGURATION/);
  });
});
