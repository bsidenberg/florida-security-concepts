import { describe, expect, it } from 'vitest';
import { validateLead } from '../../lib/leads/validateLead';
import { validLead } from '../fixtures/lead';
describe('lead validation baseline', () => {
  it('accepts a real-shaped synthetic maintenance enquiry', () => {
    const result = validateLead(validLead);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead).toMatchObject(validLead);
  });
  it.each([null, undefined, 'text', 17, true, [], {}])('rejects malformed body %j', input => {
    expect(validateLead(input).ok).toBe(false);
  });
  it.each(['fullName', 'email', 'phone', 'propertyType', 'service'])('rejects missing required %s', field => {
    const result = validateLead({ ...validLead, [field]: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toEqual(expect.any(String));
  });
  it.each([['email', 'not-an-email'], ['phone', 'CALL-ME'], ['propertyType', 'invented'], ['service', 'invented'], ['contactMethod', 'Carrier pigeon']])('rejects invalid %s', (field, value) => {
    expect(validateLead({ ...validLead, [field]: value }).ok).toBe(false);
  });
  it('rejects honeypot even when all visible values are valid', () => {
    expect(validateLead({ ...validLead, honeypot: 'bot' }).ok).toBe(false);
  });
  it('normalizes surrounding whitespace and email case', () => {
    const result = validateLead({ ...validLead, fullName: '  Ana María  ', email: ' FSC-TEST@EXAMPLE.INVALID ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead).toMatchObject({ fullName: 'Ana María', email: validLead.email });
  });
});
