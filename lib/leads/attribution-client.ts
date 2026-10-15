// First and last touch, captured in the browser.
// Stored in sessionStorage and a first-party session cookie.
// First touch is kept. Last touch updates on a later arrival that carries
// a campaign parameter or an external referrer. Moving around the site does not.

import {
  ATTRIBUTION_FIELDS,
  type AttributionField,
  type StoredVisit,
  type Touch,
  combineVisits,
  mergeVisit,
  parseStoredAttribution,
} from './attribution';

export const ATTRIBUTION_STORAGE_KEY = 'fsc_attr';

const QUERY_FIELDS: AttributionField[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
];

const LIMIT = 200;
let appliedThisDocument = false;

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, LIMIT);
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

function readStored(): StoredVisit | null {
  let session: StoredVisit | null = null;
  let cookie: StoredVisit | null = null;
  try {
    session = parseStoredAttribution(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY));
  } catch {
    session = null;
  }
  try {
    cookie = parseStoredAttribution(readCookie());
  } catch {
    cookie = null;
  }
  if (session && cookie) return combineVisits(session, cookie);
  return session ?? cookie;
}

function persist(visit: StoredVisit) {
  const serialized = JSON.stringify(visit);
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
  } catch {
    /* sessionStorage can be blocked; the cookie still holds the visit. */
  }
  try {
    writeCookie(serialized);
  } catch {
    /* Cookie writes can be blocked. The form still sends this page's touch. */
  }
}

function currentTouch(): Touch {
  const params = new URLSearchParams(window.location.search);
  const out: Touch = {};
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

function externalReferrer(referrer: string | undefined): boolean {
  if (!referrer) return false;
  try {
    return new URL(referrer).host !== window.location.host;
  } catch {
    return false;
  }
}

/** Read the visit, recording this document when it is a new arrival. */
export function captureAttribution(): StoredVisit {
  const current = currentTouch();
  try {
    const stored = readStored();
    if (appliedThisDocument) return stored ?? { v: 2, first: current, last: { ...current } };
    const visit = mergeVisit(stored, current, externalReferrer(current.referrer));
    appliedThisDocument = true;
    if (visit !== stored) persist(visit);
    return visit;
  } catch {
    appliedThisDocument = true;
    return { v: 2, first: current, last: { ...current } };
  }
}

function assign(out: Record<string, string>, key: string, value: string | undefined) {
  if (value) out[key] = value;
}

/** Camel-case fields for POST /api/leads. Empty campaign fields are omitted. Landing pages are always sent. */
export function attributionPayload(): Record<string, string> {
  const visit = captureAttribution();
  const out: Record<string, string> = {};
  const firstMap: Record<AttributionField, string> = {
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
  const lastMap: Record<AttributionField, string> = {
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
  for (const field of ATTRIBUTION_FIELDS) {
    assign(out, firstMap[field], visit.first[field]);
    assign(out, lastMap[field], visit.last[field]);
  }
  return out;
}
