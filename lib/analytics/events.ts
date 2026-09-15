// The eight SPEC §8 analytics events and their strict categorical allowlist.
// Every property value is mapped through an enumeration; unknown input becomes
// `other`/`unknown`. No free text, contact fields, city strings, request IDs,
// URLs or query strings can pass. All public functions are pure except `track`.
import { PAGE_TEMPLATES, pageTemplateFor } from './routes';
import { sanitizePageUrl } from './sanitize';

export const PLACEMENTS = [
  'header', 'mobile_nav', 'hero', 'page_hero', 'home_services', 'home_maintenance', 'home_emergency',
  'home_final', 'cta_section', 'footer', 'emergency_strip', 'contact_intro', 'other',
] as const;
export const SERVICE_CATEGORIES = [
  'maintenance', 'repair', 'new_installation', 'retrofit_upgrade', 'access_control',
  'surveillance_integration', 'gate_automation', 'not_sure', 'other', 'unknown',
] as const;
export const PROPERTY_CATEGORIES = [
  'hoa', 'multifamily', 'storage', 'commercial', 'industrial', 'residential', 'other', 'unknown',
] as const;
export const REGIONS = ['orlando', 'tampa', 'other', 'unknown'] as const;
export const URGENCY_CATEGORIES = [
  'not_specified', 'emergency', 'this_week', 'this_month', 'planning', 'other', 'unknown',
] as const;
export const VALIDATION_ERROR_CLASSES = [
  'required', 'invalid_format', 'invalid_option', 'too_long', 'rejected', 'multiple', 'other',
] as const;
export const FIELD_CATEGORIES = ['contact', 'property', 'service', 'message', 'request', 'multiple', 'other'] as const;
export const DELIVERY_ERROR_CLASSES = [
  'delivery_failed', 'unavailable', 'receipt_unknown', 'network', 'timeout', 'rate_limited',
  'conflict', 'expired', 'rejected', 'other',
] as const;

export type Placement = (typeof PLACEMENTS)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];
export type Region = (typeof REGIONS)[number];
export type UrgencyCategory = (typeof URGENCY_CATEGORIES)[number];
export type ValidationErrorClass = (typeof VALIDATION_ERROR_CLASSES)[number];
export type FieldCategory = (typeof FIELD_CATEGORIES)[number];
export type DeliveryErrorClass = (typeof DELIVERY_ERROR_CLASSES)[number];

type Mapper = (value: unknown) => string;

function enumMapper(allowed: readonly string[], aliases: Record<string, string>, empty: string, fallback: string): Mapper {
  const allowedSet = new Set(allowed);
  const aliasMap = new Map(Object.entries(aliases));
  return value => {
    if (typeof value !== 'string') return empty;
    const trimmed = value.trim();
    if (!trimmed) return empty;
    const alias = aliasMap.get(trimmed);
    if (alias !== undefined) return alias;
    return allowedSet.has(trimmed) ? trimmed : fallback;
  };
}

/** Form values (lib/leads/options), legacy labels and contact `?service=` slugs. */
export const mapServiceCategory = enumMapper(SERVICE_CATEGORIES, {
  'Maintenance / service': 'maintenance', 'Repair / service': 'repair', 'New gate system': 'new_installation',
  'Retrofit / upgrade': 'retrofit_upgrade', 'Access control': 'access_control', 'Video surveillance': 'surveillance_integration',
  'Full security system integration': 'surveillance_integration', 'Not sure yet': 'not_sure',
  'Gate automation': 'gate_automation', 'Emergency repair': 'repair',
  'preventive-maintenance': 'maintenance', retrofit: 'retrofit_upgrade', 'security-gate-systems': 'new_installation',
  'gate-automation': 'gate_automation', 'access-control': 'access_control', 'video-surveillance': 'surveillance_integration',
  'security-system-integration': 'surveillance_integration', 'emergency-service': 'repair',
}, 'unknown', 'other');

export const mapPropertyCategory = enumMapper(PROPERTY_CATEGORIES, {
  'HOA / gated community': 'hoa', 'Multifamily / apartment / condo': 'multifamily', 'Storage facility': 'storage',
  'Commercial property': 'commercial', 'Industrial / warehouse': 'industrial', 'Residential / estate': 'residential', Other: 'other',
}, 'unknown', 'other');

export const mapUrgencyCategory = enumMapper(URGENCY_CATEGORIES, {
  'Not specified': 'not_specified', Emergency: 'emergency', 'This week': 'this_week', 'This month': 'this_month',
  'Planning / budgeting': 'planning',
}, 'unknown', 'other');

export const mapRegion = enumMapper(REGIONS, {}, 'unknown', 'other');
export const mapPlacement = enumMapper(PLACEMENTS, {}, 'other', 'other');
export const mapValidationErrorClass = enumMapper(VALIDATION_ERROR_CLASSES, {}, 'other', 'other');
export const mapFieldCategory = enumMapper(FIELD_CATEGORIES, {}, 'other', 'other');
export const mapDeliveryErrorClass = enumMapper(DELIVERY_ERROR_CLASSES, {}, 'other', 'other');
const templateSet = new Set<string>(PAGE_TEMPLATES);
/** Accepts a template name or a pathname (sanitized through the route inventory). */
export const mapPageTemplate: Mapper = value => typeof value === 'string' && templateSet.has(value) ? value : pageTemplateFor(value);

export const EVENT_PROPERTIES = {
  assessment_cta_click: { placement: mapPlacement, service_category: mapServiceCategory },
  assessment_form_start: { page_template: mapPageTemplate },
  assessment_submit_attempt: { service_category: mapServiceCategory, property_category: mapPropertyCategory, region: mapRegion, urgency_category: mapUrgencyCategory },
  assessment_validation_error: { error_class: mapValidationErrorClass, field_category: mapFieldCategory },
  assessment_delivery_error: { error_class: mapDeliveryErrorClass },
  'Lead Submitted': { service_category: mapServiceCategory, urgency_category: mapUrgencyCategory },
  emergency_call_click: { placement: mapPlacement },
  maintenance_interest_click: { placement: mapPlacement },
} as const satisfies Record<string, Record<string, Mapper>>;

export type AnalyticsEvent = keyof typeof EVENT_PROPERTIES;
export const ANALYTICS_EVENTS = Object.keys(EVENT_PROPERTIES) as AnalyticsEvent[];
export type AnalyticsProps<E extends AnalyticsEvent> = { [K in keyof (typeof EVENT_PROPERTIES)[E]]?: unknown };
export type BuiltEvent = { name: AnalyticsEvent; props: Record<string, string> };

export function isAnalyticsEvent(name: unknown): name is AnalyticsEvent {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(EVENT_PROPERTIES, name);
}

/** Pure: exactly the allowlisted keys for the event, every value enumerated. Unknown event → null. */
export function buildEvent(name: unknown, props?: unknown): BuiltEvent | null {
  if (!isAnalyticsEvent(name)) return null;
  const source = props && typeof props === 'object' ? props as Record<string, unknown> : {};
  const out: Record<string, string> = {};
  for (const [key, map] of Object.entries(EVENT_PROPERTIES[name]) as [string, Mapper][]) {
    out[key] = map(Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined);
  }
  return { name, props: out };
}

const FIELD_GROUPS: Record<string, FieldCategory> = {
  fullName: 'contact', email: 'contact', phone: 'contact', contactMethod: 'contact',
  propertyType: 'property', city: 'property', company: 'property',
  service: 'service', urgency: 'service', message: 'message',
  requestId: 'request', _form: 'request', honeypot: 'request',
};
const OPTION_FIELDS = new Set(['propertyType', 'service', 'urgency', 'contactMethod']);

/** Pure: classify blocking field errors without reading or emitting any entered value. */
export function validationErrorProps(errors: unknown, values: unknown = {}): { error_class: ValidationErrorClass; field_category: FieldCategory } {
  const entries = errors && typeof errors === 'object' ? Object.entries(errors as Record<string, unknown>) : [];
  const fieldValues = values && typeof values === 'object' ? values as Record<string, unknown> : {};
  if (entries.length === 0) return { error_class: 'other', field_category: 'other' };
  const classes = new Set<ValidationErrorClass>();
  const groups = new Set<FieldCategory>();
  for (const [key, message] of entries) {
    groups.add(Object.prototype.hasOwnProperty.call(FIELD_GROUPS, key) ? FIELD_GROUPS[key] : 'other');
    const value = fieldValues[key];
    const empty = typeof value !== 'string' || value.trim() === '';
    if (key === '_form' || key === 'honeypot') classes.add('rejected');
    else if (typeof message === 'string' && /characters or fewer/i.test(message)) classes.add('too_long');
    else if (empty && key !== 'requestId') classes.add('required');
    else if (OPTION_FIELDS.has(key)) classes.add('invalid_option');
    else classes.add('invalid_format');
  }
  return {
    error_class: classes.size === 1 ? [...classes][0] : 'multiple',
    field_category: groups.size === 1 ? [...groups][0] : 'multiple',
  };
}

/** Pure: safe failure category for an unsuccessful or unconfirmed receipt. */
export function deliveryErrorClass(input: { status?: number; code?: unknown; hasBody?: boolean; thrown?: boolean; timedOut?: boolean }): DeliveryErrorClass {
  if (input.thrown) return input.timedOut ? 'timeout' : 'network';
  const code = typeof input.code === 'string' ? input.code : '';
  if (code === 'EXPIRED') return 'expired';
  if (input.status === 504 || code === 'PENDING' || code === 'RECEIPT_UNKNOWN' || !input.hasBody) return 'receipt_unknown';
  if (input.status === 429 || code === 'RATE_LIMIT') return 'rate_limited';
  if (code === 'CONFLICT') return 'conflict';
  if (code === 'DELIVERY_FAILED') return 'delivery_failed';
  if (code === 'CONFIGURATION') return 'unavailable';
  if (typeof input.status === 'number' && input.status >= 400 && input.status < 500) return 'rejected';
  return 'other';
}

/** Pure: service category from an assessment link's `?service=` slug (no other query data is read). */
export function serviceCategoryFromHref(href: unknown): ServiceCategory {
  if (typeof href !== 'string') return 'unknown';
  try {
    const url = new URL(href, 'https://analytics.invalid');
    const slug = url.searchParams.get('service');
    return (slug ? mapServiceCategory(slug) : 'unknown') as ServiceCategory;
  } catch { return 'unknown'; }
}

const CLICK_TOKENS: Record<string, AnalyticsEvent> = {
  assessment_cta: 'assessment_cta_click',
  emergency_call: 'emergency_call_click',
  maintenance_interest: 'maintenance_interest_click',
};

/** Pure: events for a `data-fsc-event` token list on an activated link. */
export function eventsFromAttributes(tokens: unknown, placement: unknown, href: unknown): BuiltEvent[] {
  if (typeof tokens !== 'string') return [];
  const names = [...new Set(tokens.split(/\s+/).filter(token => Object.prototype.hasOwnProperty.call(CLICK_TOKENS, token)).map(token => CLICK_TOKENS[token]))];
  return names.map(name => buildEvent(name, name === 'assessment_cta_click'
    ? { placement, service_category: serviceCategoryFromHref(href) }
    : { placement })).filter((event): event is BuiltEvent => event !== null);
}

type PlausibleCall = (name: string, options?: Record<string, unknown>) => unknown;
let active = false;
const reportedLeads = new Set<string>();

/** Set only by the analytics loader after its privacy configuration is installed. */
export function setAnalyticsActive(value: boolean): void { active = value; }

function send(name: string, options: Record<string, unknown>): void {
  if (!active || typeof window === 'undefined') return;
  const plausible = (window as unknown as { plausible?: PlausibleCall }).plausible;
  // Explicit sanitized `u` on every call, so the page URL is controlled even before transformRequest.
  if (typeof plausible === 'function') plausible(name, { u: sanitizePageUrl(window.location.href), ...options });
}

/** Safe: validates and maps every value; swallows every error; never throws or returns a failure. */
export function track<E extends AnalyticsEvent>(event: E, props?: AnalyticsProps<E>): void {
  try {
    const built = buildEvent(event, props);
    if (built) send(built.name, { props: built.props });
  } catch { /* Analytics can never alter form, delivery or navigation state. */ }
}

/** `Lead Submitted` at most once per logical request ID for this page session. */
export function trackLeadSubmitted(requestId: string, props: AnalyticsProps<'Lead Submitted'>): void {
  try {
    if (typeof requestId !== 'string' || !requestId || reportedLeads.has(requestId)) return;
    reportedLeads.add(requestId);
    track('Lead Submitted', props);
  } catch { /* swallowed */ }
}

/** Safe: tracks every allowlisted click event declared on a link. */
export function trackClick(tokens: unknown, placement: unknown, href: unknown): void {
  try { for (const event of eventsFromAttributes(tokens, placement, href)) send(event.name, { props: event.props }); }
  catch { /* swallowed */ }
}

/** Safe: manual pageview with a sanitized URL (sanitized again by transformRequest). */
export function sendPageview(href: unknown): void {
  try { send('pageview', { u: sanitizePageUrl(href) }); } catch { /* swallowed */ }
}
