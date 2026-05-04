import type { LeadInput, ValidationResult } from './types';

const MAX = {
  short: 200,
  medium: 500,
  long: 2000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Allow digits, spaces, dashes, parens, plus, dots, and `x`/`ext.` for extensions.
const PHONE_RE = /^[+()0-9\s.\-extEXT]{7,32}$/;

const ALLOWED_PROPERTY_TYPES = [
  'HOA / gated community',
  'Multifamily / apartment / condo',
  'Storage facility',
  'Commercial property',
  'Industrial / warehouse',
  'Residential / estate',
  'Other',
];

const ALLOWED_SERVICES = [
  'New gate system',
  'Gate automation',
  'Access control',
  'Video surveillance',
  'Emergency repair',
  'Maintenance / service',
  'Full security system integration',
  'Not sure yet',
];

const ALLOWED_URGENCY = [
  'Emergency',
  'This week',
  'This month',
  'Planning / budgeting',
];

const ALLOWED_CONTACT_METHODS = ['Email', 'Phone call', 'Text message'];

// Strip ASCII control characters (0-31 and 127), trim, and cap length.
function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) continue;
    out += value[i];
  }
  return out.trim().slice(0, max);
}

function optional(value: unknown, max: number): string | undefined {
  const c = clean(value, max);
  return c.length > 0 ? c : undefined;
}

export function validateLead(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { ok: false, errors: { _form: 'Request body must be an object.' } };
  }

  const raw = input as Record<string, unknown>;

  // Honeypot — if filled, treat as bot and reject with a generic error.
  const honeypot = clean(raw.honeypot, MAX.short);
  if (honeypot.length > 0) {
    return {
      ok: false,
      errors: { _form: 'Submission rejected.' },
    };
  }

  const fullName = clean(raw.fullName, MAX.short);
  const phone = clean(raw.phone, MAX.short);
  const email = clean(raw.email, MAX.short).toLowerCase();
  const propertyType = clean(raw.propertyType, MAX.short);
  const service = clean(raw.service, MAX.short);
  const urgency = clean(raw.urgency, MAX.short);

  if (fullName.length < 2) errors.fullName = 'Please enter your full name.';
  if (!PHONE_RE.test(phone)) errors.phone = 'Please enter a valid phone number.';
  if (!EMAIL_RE.test(email) || email.length > MAX.short) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!ALLOWED_PROPERTY_TYPES.includes(propertyType)) {
    errors.propertyType = 'Please select a property type.';
  }
  if (!ALLOWED_SERVICES.includes(service)) {
    errors.service = 'Please select a service.';
  }
  if (!ALLOWED_URGENCY.includes(urgency)) {
    errors.urgency = 'Please select an urgency.';
  }

  const contactMethod = optional(raw.contactMethod, MAX.short);
  if (contactMethod && !ALLOWED_CONTACT_METHODS.includes(contactMethod)) {
    errors.contactMethod = 'Please select a valid preferred contact method.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    lead: {
      fullName,
      phone,
      email,
      propertyType,
      service,
      urgency,
      company: optional(raw.company, MAX.short),
      city: optional(raw.city, MAX.short),
      contactMethod,
      message: optional(raw.message, MAX.long),
      sourcePage: optional(raw.sourcePage, MAX.short),
      serviceSlug: optional(raw.serviceSlug, MAX.short),
      industrySlug: optional(raw.industrySlug, MAX.short),
      locationSlug: optional(raw.locationSlug, MAX.short),
      utmSource: optional(raw.utmSource ?? raw.utm_source, MAX.short),
      utmMedium: optional(raw.utmMedium ?? raw.utm_medium, MAX.short),
      utmCampaign: optional(raw.utmCampaign ?? raw.utm_campaign, MAX.short),
      referrer: optional(raw.referrer, MAX.medium),
      submittedAt: new Date().toISOString(),
    },
  };
}

// Re-export for tests/external callers if needed.
export type { LeadInput };
