import { describe, expect, it } from 'vitest';
import { attributionNotesBlock, crmIntakeLead } from '../../lib/leads/attribution';
import { validateLead } from '../../lib/leads/validateLead';

const base = {
  fullName: 'Synthetic Manager',
  email: 'fsc-attr@example.invalid',
  phone: '3525550100',
  propertyType: 'HOA / gated community',
  service: 'Maintenance / service',
  city: 'Clermont',
  urgency: 'Not specified',
  contactMethod: 'Email',
  requestId: '9b2f1c3e-7a44-4d1b-8e2f-0c6d5a4b3e21',
};

describe('lead attribution', () => {
  it('keeps first-touch fields and accepts snake_case aliases', () => {
    const result = validateLead({
      ...base,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'gates',
      utm_term: 'gate repair clermont',
      utm_content: 'ad-1',
      gclid: 'synthetic-gclid',
      fbclid: 'synthetic-fbclid',
      landing_page: '/?utm_source=google',
      referrer: 'https://www.google.com/',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lead).toMatchObject({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'gates',
      utmTerm: 'gate repair clermont',
      utmContent: 'ad-1',
      gclid: 'synthetic-gclid',
      fbclid: 'synthetic-fbclid',
      landingPage: '/?utm_source=google',
      referrer: 'https://www.google.com/',
    });
  });

  it('drops over-long click ids instead of rejecting the lead', () => {
    const result = validateLead({ ...base, gclid: 'x'.repeat(201), message: 'Gate stopped halfway.' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lead.gclid).toBeUndefined();
    expect(result.lead.message).toBe('Gate stopped halfway.');
  });
});

describe('CRM intake notes fallback', () => {
  it('leaves a payload with only known columns unchanged', () => {
    const payload = { fullName: 'Synthetic', utmSource: 'google', message: 'Hello' };
    expect(crmIntakeLead(payload)).toBe(payload);
  });

  it('moves fields the intake does not store into a structured notes block', () => {
    const payload = {
      fullName: 'Synthetic',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'gates',
      referrer: 'https://www.google.com/',
      utmTerm: 'gate repair',
      utmContent: 'ad-1',
      gclid: 'synthetic-gclid',
      fbclid: 'synthetic-fbclid',
      landingPage: '/contact?utm_source=google',
      message: 'The gate stopped halfway.',
    };
    const lead = crmIntakeLead(payload);
    expect(lead).not.toHaveProperty('utmTerm');
    expect(lead).not.toHaveProperty('gclid');
    expect(lead).not.toHaveProperty('fbclid');
    expect(lead).not.toHaveProperty('landingPage');
    expect(lead.utmSource).toBe('google');
    expect(lead.referrer).toBe('https://www.google.com/');
    expect(lead.message).toBe(
      [
        'The gate stopped halfway.',
        '',
        '[Attribution]',
        'utm_term: gate repair',
        'utm_content: ad-1',
        'gclid: synthetic-gclid',
        'fbclid: synthetic-fbclid',
        'landing_page: /contact?utm_source=google',
      ].join('\n'),
    );
    expect(attributionNotesBlock(payload)).toContain('gclid: synthetic-gclid');
  });
});
