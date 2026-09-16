// Event allowlist and categorical mapping (lib/analytics/events.ts, plausible.ts sanitizePayload, region.ts).
import { describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_EVENTS, EVENT_PROPERTIES, buildEvent, deliveryErrorClass, eventsFromAttributes, mapPropertyCategory, mapServiceCategory,
  mapUrgencyCategory, validationErrorProps,
} from '../../lib/analytics/events';
import { sanitizePayload } from '../../lib/analytics/plausible';
import { propertyTypes, serviceOptions, legacyServices, urgencyOptions } from '../../lib/leads/options';
import { queryDefaults } from '../../lib/leads/query';
import { validateLead } from '../../lib/leads/validateLead';
import { validLead } from '../fixtures/lead';

const CATEGORY = /^[a-z0-9_]{1,40}$/;
// SPEC §8 events and their allowlisted property keys (independent of the implementation's table).
const SPEC_EVENTS: Record<string, string[]> = {
  assessment_cta_click: ['placement', 'service_category'],
  assessment_form_start: ['page_template'],
  assessment_submit_attempt: ['property_category', 'region', 'service_category', 'urgency_category'],
  assessment_validation_error: ['error_class', 'field_category'],
  assessment_delivery_error: ['error_class'],
  'Lead Submitted': ['service_category', 'urgency_category'],
  emergency_call_click: ['placement'],
  maintenance_interest_click: ['placement'],
};
const HOSTILE = { email: 'jane.doe@example.com', phone: '4075551234', text: 'Gate code 4417 for Jane', url: 'https://evil.example/?token=secret', requestId: '18a85f2b-5ba9-43c2-a475-84ac0ac98310' };
function expectCategorical(props: Record<string, string>) {
  for (const [key, value] of Object.entries(props)) {
    expect(value, key).toMatch(CATEGORY);
    for (const hostile of Object.values(HOSTILE)) expect(value.includes(hostile.toLowerCase().slice(0, 6)), `${key}=${value}`).toBe(false);
  }
}

describe('event allowlist', () => {
  it('defines exactly the eight SPEC events with exactly their property keys', () => {
    expect([...ANALYTICS_EVENTS].sort()).toEqual(Object.keys(SPEC_EVENTS).sort());
    for (const [name, keys] of Object.entries(SPEC_EVENTS)) expect(Object.keys(EVENT_PROPERTIES[name as keyof typeof EVENT_PROPERTIES]).sort()).toEqual(keys);
  });
  it.each(Object.keys(SPEC_EVENTS))('%s: hostile and extra properties never pass', name => {
    const props = Object.fromEntries([...SPEC_EVENTS[name], 'email', 'phone', 'message', 'requestId', 'url', '__proto__'].map(key => [key, key === 'region' ? HOSTILE.text : HOSTILE[(['email', 'phone', 'url', 'requestId'].includes(key) ? key : 'text') as keyof typeof HOSTILE]]));
    const built = buildEvent(name, props);
    expect(built).not.toBeNull();
    expect(Object.keys(built!.props).sort()).toEqual(SPEC_EVENTS[name]);
    expectCategorical(built!.props);
  });
  it('rejects unknown, prototype and non-string event names', () => {
    for (const name of ['pageview', 'engagement', 'Form: Submission', 'Outbound Link: Click', 'File Download', 'toString', '__proto__', 'constructor', '', undefined, 1]) expect(buildEvent(name, {})).toBeNull();
  });
  it('fills missing properties with a categorical placeholder instead of dropping keys', () => {
    const built = buildEvent('assessment_submit_attempt');
    expect(Object.keys(built!.props).sort()).toEqual(SPEC_EVENTS.assessment_submit_attempt);
    expectCategorical(built!.props);
    expect(built!.props.region).toBe('unknown');
  });
  it('survives a props object whose getters throw or whose values are objects', () => {
    const tricky = { get service_category() { return { toString: () => HOSTILE.email }; }, urgency_category: ['Emergency'] };
    const built = buildEvent('Lead Submitted', tricky);
    expect(built).not.toBeNull();
    expectCategorical(built!.props);
  });
});

describe('categorical mappings cover every form option and query slug', () => {
  it.each([...serviceOptions.map(o => o.value), ...legacyServices])('service option %j maps to a defined category', value => {
    expect(['other', 'unknown']).not.toContain(mapServiceCategory(value));
    expect(mapServiceCategory(value)).toMatch(CATEGORY);
  });
  it('distinguishes the SPEC service groups (maintenance, repair, new installation, retrofit/upgrade, access control, surveillance/integration, not sure)', () => {
    const values = ['Maintenance / service', 'Repair / service', 'New gate system', 'Retrofit / upgrade', 'Access control', 'Video surveillance', 'Not sure yet'].map(v => mapServiceCategory(v));
    expect(new Set(values).size).toBe(7);
  });
  it.each(propertyTypes)('property type %j maps to a defined category (Other → other)', value => {
    const mapped = mapPropertyCategory(value);
    expect(mapped).toMatch(CATEGORY);
    if (value === 'Other') expect(mapped).toBe('other');
    else expect(['other', 'unknown']).not.toContain(mapped);
  });
  it.each(urgencyOptions)('urgency %j maps to a defined category', value => {
    expect(['other', 'unknown']).not.toContain(mapUrgencyCategory(value));
  });
  it('keeps emergency distinguishable from routine and unspecified timing', () => {
    expect(mapUrgencyCategory('Emergency')).not.toBe(mapUrgencyCategory('Not specified'));
    expect(mapUrgencyCategory('Emergency')).not.toBe(mapUrgencyCategory('This week'));
  });
  it.each(['preventive-maintenance', 'maintenance', 'repair', 'retrofit', 'security-gate-systems', 'gate-automation', 'access-control', 'video-surveillance', 'security-system-integration', 'emergency-service'])('contact ?service=%s maps to the same category as the form value it pre-fills', slug => {
    const prefill = queryDefaults({ service: slug }).service;
    expect(prefill).toBeTruthy();
    const fromLink = eventsFromAttributes('assessment_cta', 'hero', `/contact?service=${slug}`)[0].props.service_category;
    expect(fromLink).toBe(mapServiceCategory(prefill));
  });
  it('maps free text, contact data and look-alike labels to other and empties to unknown', () => {
    for (const value of [HOSTILE.email, HOSTILE.text, 'maintenance / service', 'Access control ', 'ACCESS CONTROL']) expect(['other', 'access_control', 'maintenance']).toContain(mapServiceCategory(value));
    expect(mapServiceCategory(HOSTILE.email)).toBe('other');
    expect(mapServiceCategory('')).toBe('unknown');
    expect(mapServiceCategory(undefined)).toBe('unknown');
  });
});

describe('validationErrorProps', () => {
  const errorsFor = (input: Record<string, unknown>) => { const result = validateLead(input); if (result.ok) throw new Error('expected invalid input'); return result.errors; };
  it('classifies a single invalid email as a contact format error without reading the value', () => {
    const values = { ...validLead, email: HOSTILE.email.replace('@', '') };
    const props = validationErrorProps(errorsFor(values), values);
    expect(props).toEqual({ error_class: 'invalid_format', field_category: 'contact' });
  });
  it('classifies an empty form as multiple required fields across groups', () => {
    const values = {};
    expect(validationErrorProps(errorsFor(values), values)).toEqual({ error_class: 'required', field_category: 'multiple' });
  });
  it('classifies over-limit text as too_long and honeypot content as rejected', () => {
    const long = { ...validLead, message: 'x'.repeat(2001) };
    expect(validationErrorProps(errorsFor(long), long)).toEqual({ error_class: 'too_long', field_category: 'message' });
    const bot = { ...validLead, honeypot: 'filled' };
    expect(validationErrorProps(errorsFor(bot), bot).error_class).toBe('rejected');
  });
  it('never echoes error messages, field names outside the enumeration or values', () => {
    const props = validationErrorProps({ [HOSTILE.email]: HOSTILE.text, __proto__: 'x' }, { [HOSTILE.email]: HOSTILE.phone });
    expectCategorical(props as unknown as Record<string, string>);
    expect(validationErrorProps(null)).toEqual({ error_class: 'other', field_category: 'other' });
  });
});

describe('deliveryErrorClass', () => {
  it.each([
    [{ thrown: true, timedOut: true }, 'timeout'], [{ thrown: true }, 'network'], [{ status: 504, code: 'RECEIPT_UNKNOWN', hasBody: true }, 'receipt_unknown'],
    [{ status: 200, hasBody: false }, 'receipt_unknown'], [{ status: 409, code: 'PENDING', hasBody: true }, 'receipt_unknown'], [{ status: 409, code: 'EXPIRED', hasBody: true }, 'expired'],
    [{ status: 429, code: 'RATE_LIMIT', hasBody: true }, 'rate_limited'], [{ status: 409, code: 'CONFLICT', hasBody: true }, 'conflict'],
    [{ status: 503, code: 'DELIVERY_FAILED', hasBody: true }, 'delivery_failed'], [{ status: 503, code: 'CONFIGURATION', hasBody: true }, 'unavailable'],
    [{ status: 413, hasBody: true }, 'rejected'], [{ status: 500, code: HOSTILE.text, hasBody: true }, 'other'],
  ])('%j → %s', (input, expected) => {
    expect(deliveryErrorClass(input)).toBe(expected);
  });
  it('never labels an unknown receipt as a known delivery failure', () => {
    expect(deliveryErrorClass({ status: 504, code: 'DELIVERY_FAILED', hasBody: true })).toBe('receipt_unknown');
  });
});

describe('eventsFromAttributes', () => {
  it('builds each declared click event once with enumerated placement and link-derived service category only', () => {
    const events = eventsFromAttributes('assessment_cta maintenance_interest assessment_cta evil_token toString', 'home_maintenance', `/contact?service=preventive-maintenance&email=${encodeURIComponent(HOSTILE.email)}`);
    expect(events.map(e => e.name).sort()).toEqual(['assessment_cta_click', 'maintenance_interest_click']);
    const cta = events.find(e => e.name === 'assessment_cta_click')!;
    expect(cta.props).toEqual({ placement: 'home_maintenance', service_category: mapServiceCategory('Maintenance / service') });
    for (const event of events) expectCategorical(event.props);
  });
  it('maps an unknown placement to other and a hostile href to unknown/other', () => {
    const [event] = eventsFromAttributes('emergency_call', HOSTILE.text, 'tel:+14075551234');
    expect(event).toEqual({ name: 'emergency_call_click', props: { placement: 'other' } });
    const [cta] = eventsFromAttributes('assessment_cta', 'hero', 'javascript:alert(1)');
    expect(['unknown', 'other']).toContain(cta.props.service_category);
    expect(eventsFromAttributes(undefined, 'hero', '/contact')).toEqual([]);
  });
});

describe('sanitizePayload (transformRequest)', () => {
  const base = { n: 'pageview', v: 36, d: 'floridasecurityconcepts.com', u: `http://127.0.0.1:3164/contact?email=${encodeURIComponent(HOSTILE.email)}&utm_source=Google`, r: `https://mail.example/inbox?msg=${HOSTILE.email}` };
  it('sanitizes pageview URL and referrer and strips properties, revenue and unknown keys', () => {
    const out = sanitizePayload({ ...base, p: { email: HOSTILE.email }, $: { amount: 1, currency: 'USD' }, extra: HOSTILE.phone, h: 1, i: false }, 'http://127.0.0.1:3164');
    expect(out).toEqual({ n: 'pageview', v: 36, d: 'floridasecurityconcepts.com', u: 'https://www.floridasecurityconcepts.com/contact?utm_source=google', r: 'https://mail.example', h: 1, i: false });
  });
  it('rebuilds custom event properties from the allowlist', () => {
    const out = sanitizePayload({ ...base, n: 'Lead Submitted', p: { service_category: 'Access control', urgency_category: 'Emergency', email: HOSTILE.email, requestId: HOSTILE.requestId } });
    expect(Object.keys(out!.p!).sort()).toEqual(['service_category', 'urgency_category']);
    expect(JSON.stringify(out)).not.toContain('jane');
    expect(JSON.stringify(out)).not.toContain(HOSTILE.requestId);
  });
  it.each([
    ['unknown event', { ...base, n: 'Signup' }], ['automatic form submission', { ...base, n: 'Form: Submission' }], ['outbound link', { ...base, n: 'Outbound Link: Click', p: { url: HOSTILE.url } }],
    ['engagement', { ...base, n: 'engagement' }], ['bad domain', { ...base, d: 'evil.example/path?x' }], ['missing domain', { ...base, d: undefined }], ['not an object', 'pageview'], ['null', null],
  ])('drops %s', (_label, payload) => {
    expect(sanitizePayload(payload)).toBeNull();
  });
  it('drops (never throws) when a property getter throws', () => {
    const payload = { ...base, n: 'Lead Submitted', p: {} };
    Object.defineProperty(payload.p, 'service_category', { enumerable: true, get() { throw new Error('boom'); } });
    const spy = vi.fn(() => sanitizePayload(payload));
    expect(spy).not.toThrow();
    expect(spy.mock.results[0].value).toBeNull();
  });
});
