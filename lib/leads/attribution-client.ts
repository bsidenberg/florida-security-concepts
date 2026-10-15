// First-touch attribution captured in the browser on arrival.
// Stored in sessionStorage and a first-party session cookie. Later pages
// in the same visit do not overwrite it.

export const ATTRIBUTION_STORAGE_KEY = 'fsc_attr';

const QUERY_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;

export type StoredAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
};

const LIMIT = 200;

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, LIMIT);
}

function parse(raw: string | null): StoredAttribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const out: StoredAttribution = {};
    for (const key of [...QUERY_FIELDS, 'referrer', 'landing_page'] as const) {
      const item = clean(typeof record[key] === 'string' ? record[key] : undefined);
      if (item) out[key] = item;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function readCookie(): string | null {
  const prefix = `${ATTRIBUTION_STORAGE_KEY}=`;
  for (const part of document.cookie.split(';')) {
    const item = part.trim();
    if (item.startsWith(prefix)) {
      try {
        return decodeURIComponent(item.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function writeCookie(serialized: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ATTRIBUTION_STORAGE_KEY}=${encodeURIComponent(serialized)}; Path=/; SameSite=Lax${secure}`;
}

function currentTouch(): StoredAttribution {
  const params = new URLSearchParams(window.location.search);
  const out: StoredAttribution = {};
  for (const key of QUERY_FIELDS) {
    const value = clean(params.get(key));
    if (value) out[key] = value;
  }
  const referrer = clean(document.referrer);
  if (referrer) out.referrer = referrer;
  const landing = clean(`${window.location.pathname}${window.location.search}`);
  if (landing) out.landing_page = landing;
  return out;
}

/** Read the first-touch record, capturing it when this is the first page of the visit. */
export function captureFirstTouch(): StoredAttribution {
  try {
    const fromSession = parse(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY));
    if (fromSession) return fromSession;
    const fromCookie = parse(readCookie());
    if (fromCookie) {
      window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(fromCookie));
      return fromCookie;
    }
    const touch = currentTouch();
    const serialized = JSON.stringify(touch);
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
    writeCookie(serialized);
    return touch;
  } catch {
    return {};
  }
}

/** Camel-case fields for POST /api/leads. Empty fields are omitted. */
export function attributionPayload(): Record<string, string> {
  const touch = captureFirstTouch();
  const out: Record<string, string> = {};
  if (touch.utm_source) out.utmSource = touch.utm_source;
  if (touch.utm_medium) out.utmMedium = touch.utm_medium;
  if (touch.utm_campaign) out.utmCampaign = touch.utm_campaign;
  if (touch.utm_term) out.utmTerm = touch.utm_term;
  if (touch.utm_content) out.utmContent = touch.utm_content;
  if (touch.gclid) out.gclid = touch.gclid;
  if (touch.fbclid) out.fbclid = touch.fbclid;
  if (touch.referrer) out.referrer = touch.referrer;
  if (touch.landing_page) out.landingPage = touch.landing_page;
  return out;
}
