import { describe, expect, it } from 'vitest';
import { attributionNotesBlock, crmIntakeLead, mergeVisit, parseStoredAttribution } from '../../lib/leads/attribution';
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
      msclkid: 'synthetic-msclkid',
      landing_page: '/?utm_source=google',
      referrer: 'https://www.google.com/',
      last_utm_source: 'bing',
      last_msclkid: 'synthetic-last-msclkid',
      last_landing_page: '/contact?msclkid=synthetic-last-msclkid',
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
      msclkid: 'synthetic-msclkid',
      landingPage: '/?utm_source=google',
      referrer: 'https://www.google.com/',
      lastUtmSource: 'bing',
      lastMsclkid: 'synthetic-last-msclkid',
      lastLandingPage: '/contact?msclkid=synthetic-last-msclkid',
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
    expect(lead).not.toHaveProperty('msclkid');
    expect(lead).not.toHaveProperty('lastUtmSource');
    expect(lead.message).toBe(
      [
        'The gate stopped halfway.',
        '',
        '[Attribution]',
        'first.utm_source: google',
        'first.utm_medium: cpc',
        'first.utm_campaign: gates',
        'first.utm_term: gate repair',
        'first.utm_content: ad-1',
        'first.gclid: synthetic-gclid',
        'first.fbclid: synthetic-fbclid',
        'first.msclkid: (none)',
        'first.referrer: https://www.google.com/',
        'first.landing_page: /contact?utm_source=google',
        'last.utm_source: google',
        'last.utm_medium: cpc',
        'last.utm_campaign: gates',
        'last.utm_term: gate repair',
        'last.utm_content: ad-1',
        'last.gclid: synthetic-gclid',
        'last.fbclid: synthetic-fbclid',
        'last.msclkid: (none)',
        'last.referrer: https://www.google.com/',
        'last.landing_page: /contact?utm_source=google',
      ].join('\n'),
    );
    expect(attributionNotesBlock(payload)).toContain('first.gclid: synthetic-gclid');
  });

  it('records a later Microsoft click as last touch without replacing the first', () => {
    const payload = {
      utmSource: 'google',
      gclid: 'synthetic-gclid',
      landingPage: '/?gclid=synthetic-gclid',
      referrer: 'https://www.google.com/',
      lastUtmSource: 'bing',
      lastMsclkid: 'synthetic-msclkid',
      lastLandingPage: '/gate-repair/clermont-fl?msclkid=synthetic-msclkid',
      lastReferrer: 'https://www.bing.com/',
    };
    const lead = crmIntakeLead(payload);
    expect(lead.utmSource).toBe('google');
    expect(lead).not.toHaveProperty('lastMsclkid');
    expect(lead.message).toContain('first.gclid: synthetic-gclid');
    expect(lead.message).toContain('first.msclkid: (none)');
    expect(lead.message).toContain('last.utm_source: bing');
    expect(lead.message).toContain('last.msclkid: synthetic-msclkid');
    expect(lead.message).toContain('last.landing_page: /gate-repair/clermont-fl?msclkid=synthetic-msclkid');
    expect(lead.message).toContain('last.referrer: https://www.bing.com/');
  });
});

describe('first and last touch', () => {
  it('keeps the first arrival and moves last touch only for a new acquisition', () => {
    const first = mergeVisit(null, { utm_source: 'google', gclid: 'synthetic-gclid', landing_page: '/', referrer: 'https://www.google.com/', at: 10 }, true);
    const internal = mergeVisit(first, { landing_page: '/contact', referrer: 'https://www.floridasecurityconcepts.com/contact', at: 20 }, false);
    expect(internal).toBe(first);
    const last = mergeVisit(first, { utm_source: 'bing', msclkid: 'synthetic-msclkid', landing_page: '/contact?msclkid=synthetic-msclkid', referrer: 'https://www.bing.com/', at: 30 }, true);
    expect(last.first).toEqual(first.first);
    expect(last.last.msclkid).toBe('synthetic-msclkid');
    expect(last.last.utm_source).toBe('bing');
  });

  it('reads an older flat cookie as both touches', () => {
    const visit = parseStoredAttribution(JSON.stringify({ utm_source: 'google', landing_page: '/services/gate-repair', gclid: 'synthetic-gclid' }));
    expect(visit?.first.utm_source).toBe('google');
    expect(visit?.last.landing_page).toBe('/services/gate-repair');
  });
});
