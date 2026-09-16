import type { LeadInput, ValidationResult } from './types';
import { propertyTypes, serviceOptions, legacyServices, urgencyOptions, contactMethods } from './options';
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateLead(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { _form: 'Request body must be an object.' } };
  const raw = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  function field(key: string, max = 200): string {
    const value = raw[key];
    if (value === undefined) return '';
    if (typeof value !== 'string') { errors[key] = 'Please enter text.'; return ''; }
    if (value.length > max) errors[key] = `Please use ${max} characters or fewer.`;
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) errors[key] = 'Please remove unsupported control characters.';
    return value.trim();
  }
  if (field('honeypot')) errors._form = 'Submission rejected.';
  const fullName = field('fullName');
  const email = field('email').toLowerCase();
  const phone = field('phone');
  const propertyType = field('propertyType');
  const service = field('service');
  const city = field('city');
  const urgency = field('urgency') || 'Not specified';
  const contactMethod = field('contactMethod') || 'Email';
  const requestId = field('requestId').toLowerCase();
  if (fullName.length < 2) errors.fullName = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  const phoneParts = phone.match(/^([+()\d\s.-]+?)(?:\s*(?:x|ext\.?|extension)\s*(\d{1,6}))?$/i);
  const digits = phoneParts?.[1].replace(/\D/g, '') || '';
  if (!phoneParts || digits.length < 7 || digits.length > 15) errors.phone = 'Please enter a phone number with 7–15 digits and an optional extension.';
  if (!propertyTypes.includes(propertyType)) errors.propertyType = 'Please select a property type.';
  if (![...serviceOptions.map(option => option.value), ...legacyServices].includes(service)) errors.service = 'Please select a service.';
  if (!city || city.toLowerCase() === 'other') errors.city = 'Please enter your city or service area.';
  if (!urgencyOptions.includes(urgency)) errors.urgency = 'Please select a timing option.';
  if (!contactMethods.includes(contactMethod)) errors.contactMethod = 'Please select a preferred contact method.';
  if (requestId && !UUID_V4.test(requestId)) errors.requestId = 'Please start a new request.';
  const company = field('company') || undefined;
  const message = field('message', 2000) || undefined;
  const context: Record<string, string | undefined> = {};
  for (const key of ['sourcePage','serviceSlug','industrySlug','locationSlug','utmSource','utmMedium','utmCampaign','referrer']) context[key] = field(key) || undefined;
  for (const [camel, snake] of [['utmSource','utm_source'],['utmMedium','utm_medium'],['utmCampaign','utm_campaign']]) {
    const alias = field(snake);
    if (!context[camel] && alias) context[camel] = alias;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, lead: { fullName, email, phone, propertyType, service, city, urgency, contactMethod, company, message, ...context, requestId: requestId || undefined, submittedAt: new Date().toISOString() } };
}
export type { LeadInput };
