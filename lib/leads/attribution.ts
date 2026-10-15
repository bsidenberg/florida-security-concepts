// Full source attribution for every lead: all UTMs, gclid, fbclid, msclkid,
// referrer, and landing page, for both the first and last touch.
//
// The CRM intake allowlist accepts utmSource, utmMedium, utmCampaign, and
// referrer. It has no columns for the other click ids, the landing page, or a
// second touch. Those keys are removed from the CRM body and the complete
// first-and-last record is appended to `message`, which the intake stores as
// notes. A payload that only has the allowlisted columns is returned unchanged.

export const ATTRIBUTION_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'referrer',
  'landing_page',
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];

const FIRST_KEY: Record<AttributionField, string> = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_term: 'utmTerm',
  utm_content: 'utmContent',
  gclid: 'gclid',
  fbclid: 'fbclid',
  msclkid: 'msclkid',
  referrer: 'referrer',
  landing_page: 'landingPage',
};

const LAST_KEY: Record<AttributionField, string> = {
  utm_source: 'lastUtmSource',
  utm_medium: 'lastUtmMedium',
  utm_campaign: 'lastUtmCampaign',
  utm_term: 'lastUtmTerm',
  utm_content: 'lastUtmContent',
  gclid: 'lastGclid',
  fbclid: 'lastFbclid',
  msclkid: 'lastMsclkid',
  referrer: 'lastReferrer',
  landing_page: 'lastLandingPage',
};

/** Keys the CRM intake cannot store as their own columns. */
export const ATTRIBUTION_NOTE_FIELDS = [
  'utmTerm',
  'utmContent',
  'gclid',
  'fbclid',
  'msclkid',
  'landingPage',
  'lastUtmSource',
  'lastUtmMedium',
  'lastUtmCampaign',
  'lastUtmTerm',
  'lastUtmContent',
  'lastGclid',
  'lastFbclid',
  'lastMsclkid',
  'lastReferrer',
  'lastLandingPage',
] as const;

const NOTE_LIMIT = 2000;
const CAMPAIGN_FIELDS: AttributionField[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
];

export type Touch = Partial<Record<AttributionField, string>> & { at?: number };

export type StoredVisit = { v: 2; first: Touch; last: Touch };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function display(field: AttributionField, value: string): string {
  if (value) return value;
  return field === 'referrer' ? '(direct)' : '(none)';
}

function asRecord(payload: object): Record<string, unknown> {
  return payload as Record<string, unknown>;
}

function hasNoteField(payload: object): boolean {
  const record = asRecord(payload);
  return ATTRIBUTION_NOTE_FIELDS.some((key) => text(record[key]).length > 0);
}

export function attributionNotesBlock(payload: object): string {
  const record = asRecord(payload);
  if (!hasNoteField(record)) return '';
  const lines = ['[Attribution]'];
  for (const touch of ['first', 'last'] as const) {
    for (const field of ATTRIBUTION_FIELDS) {
      const first = text(record[FIRST_KEY[field]]);
      const last = text(record[LAST_KEY[field]]) || first;
      const value = touch === 'first' ? first : last;
      lines.push(`${touch}.${field}: ${display(field, value)}`);
    }
  }
  return lines.join('\n');
}

/** Structured copy of the same record, for Prime's raw_payload. */
export function attributionRecord(payload: object): { first: Record<string, string>; last: Record<string, string> } | undefined {
  const record = asRecord(payload);
  if (!hasNoteField(record)) return undefined;
  const first: Record<string, string> = {};
  const last: Record<string, string> = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const firstValue = text(record[FIRST_KEY[field]]);
    const lastValue = text(record[LAST_KEY[field]]) || firstValue;
    first[field] = display(field, firstValue);
    last[field] = display(field, lastValue);
  }
  return { first, last };
}

/**
 * CRM wire lead. Returns the stored payload unchanged when none of the
 * missing columns are present, so key order and bytes stay identical.
 * Otherwise copies the payload, drops those keys, and appends the full
 * first-and-last record to `message`.
 */
export function crmIntakeLead(payload: object): Record<string, unknown> {
  const record = asRecord(payload);
  const block = attributionNotesBlock(record);
  if (!block) return record;
  const lead: Record<string, unknown> = { ...record };
  for (const key of ATTRIBUTION_NOTE_FIELDS) delete lead[key];
  const message = typeof lead.message === 'string' ? lead.message.trim() : '';
  const combined = message ? `${message}\n\n${block}` : block;
  if (combined.length <= NOTE_LIMIT) {
    lead.message = combined;
  } else if (block.length >= NOTE_LIMIT) {
    lead.message = block.slice(0, NOTE_LIMIT);
  } else {
    const room = NOTE_LIMIT - block.length - 2;
    lead.message = `${message.slice(0, room)}\n\n${block}`;
  }
  return lead;
}

export function touchHasCampaign(touch: Touch): boolean {
  return CAMPAIGN_FIELDS.some((field) => Boolean(touch[field]));
}

/** First touch sticks. Last touch moves when this page is a new acquisition. */
export function mergeVisit(stored: StoredVisit | null, current: Touch, externalReferrer: boolean): StoredVisit {
  const touch: Touch = { ...current };
  if (!touch.at) touch.at = Date.now();
  if (!stored) return { v: 2, first: touch, last: { ...touch } };
  if (!touchHasCampaign(touch) && !externalReferrer) return stored;
  return { v: 2, first: stored.first, last: touch };
}

export function combineVisits(a: StoredVisit, b: StoredVisit): StoredVisit {
  const first = (a.first.at ?? 0) <= (b.first.at ?? 0) ? a.first : b.first;
  const last = (a.last.at ?? 0) >= (b.last.at ?? 0) ? a.last : b.last;
  return { v: 2, first, last };
}

export function touchFrom(value: unknown): Touch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const touch: Touch = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const item = text(record[field]);
    if (item) touch[field] = item.slice(0, 200);
  }
  if (typeof record.at === 'number' && Number.isFinite(record.at)) touch.at = record.at;
  return Object.keys(touch).length ? touch : null;
}

export function parseStoredAttribution(raw: string | null): StoredVisit | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (record.v === 2) {
      const first = touchFrom(record.first);
      const last = touchFrom(record.last);
      if (!first && !last) return null;
      const kept = first ?? last!;
      return { v: 2, first: kept, last: last ?? kept };
    }
    const flat = touchFrom(record);
    if (!flat) return null;
    return { v: 2, first: flat, last: { ...flat } };
  } catch {
    return null;
  }
}
