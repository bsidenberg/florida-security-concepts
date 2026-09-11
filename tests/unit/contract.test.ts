import { describe, it, expect } from 'vitest';
import { validateLead } from '../../lib/leads/validateLead';
import { validLead } from '../fixtures/lead';
describe('assessment input contract', () => {
  it('accepts six fields without timing or preferred contact', () => {
    const result = validateLead({ ...validLead, urgency: undefined, contactMethod: undefined });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead).toMatchObject({ urgency: 'Not specified', contactMethod: 'Email' });
  });
  it.each(['fullName', 'email', 'phone', 'propertyType', 'service', 'city', 'company', 'urgency', 'message', 'contactMethod'])('rejects unsafe type for %s', field => {
    expect(validateLead({ ...validLead, [field]: ['unsafe'] }).ok).toBe(false);
  });
  it.each([['fullName', 201], ['company', 201], ['city', 201], ['message', 2001]])('rejects excess %s instead of truncation', (field, length) => {
    expect(validateLead({ ...validLead, [field]: 'a'.repeat(Number(length)) }).ok).toBe(false);
  });
  it('preserves accepted message boundary and newlines', () => {
    const message = 'A\n' + 'b'.repeat(1998);
    const result = validateLead({ ...validLead, message }); expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead.message).toBe(message);
  });
  it.each(['2025550', '+1 (202) 555-0100', '2025550100 ext. 123456', '123456789012345'])('accepts phone %s', phone => {
    expect(validateLead({ ...validLead, phone }).ok).toBe(true);
  });
  it.each(['------x', '123456', '1234567890123456', '2025550100 ext. 1234567', '202CALLNOW'])('rejects invalid phone %s', phone => {
    expect(validateLead({ ...validLead, phone }).ok).toBe(false);
  });
  it.each(['Repair / service', 'Retrofit / upgrade', 'Maintenance / service', 'New gate system', 'Emergency repair'])('supports service %s', service => {
    expect(validateLead({ ...validLead, service }).ok).toBe(true);
  });
});
