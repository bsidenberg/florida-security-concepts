// Pure URL/referrer sanitization for analytics payloads. Nothing here echoes an
// unvalidated path, query value, fragment, host or credential.
import { site } from '@/data/site';
import { canonicalPathname, NOT_FOUND_PATH } from './routes';

/** Fixed production origin (not NEXT_PUBLIC_SITE_URL), so preview/loopback hosts never reach reports. */
export const PRODUCTION_ORIGIN = `https://www.${site.domain}`;
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const UTM_VALUE = /^[a-z0-9._-]{1,40}$/;
// Identifier-shaped campaign values (phone/account numbers or fragments, UUIDs, hashes/tokens,
// any dotted value, or webmail names) are never forwarded, even when they fit the character set.
const IDENTIFIER_SHAPES = [
  /\d{7,}/,
  /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/,
  /[0-9a-f]{16,}/,
  /gmail|yahoo|outlook|icloud|hotmail/,
  /\d{3}[-.]?\d{4}/,
  /\d{3}-\d{3}-\d{4}/,
];

/**
 * Lowercased/trimmed value if it matches ^[a-z0-9._-]{1,40}$ and is not identifier-shaped
 * (7+ digit run, phone fragment, UUID, 16+ hex run, webmail name, or any '.'), else `other`.
 */
export function normalizeUtm(value: unknown): string {
  if (typeof value !== 'string') return 'other';
  const normalized = value.trim().toLowerCase();
  if (!UTM_VALUE.test(normalized)) return 'other';
  if (IDENTIFIER_SHAPES.some(shape => shape.test(normalized))) return 'other';
  if (normalized.includes('.')) return 'other';
  return normalized;
}

/**
 * Production origin + canonical pathname (known inventory, else `/404`) + only
 * utm_source/utm_medium/utm_campaign in fixed order, each normalized. Every other
 * query parameter, the fragment, credentials and the original host are dropped.
 */
export function sanitizePageUrl(href: unknown): string {
  let url: URL;
  try {
    if (typeof href !== 'string' || href.length > 4096) throw new Error('unsupported');
    url = new URL(href, PRODUCTION_ORIGIN);
  } catch { return PRODUCTION_ORIGIN + NOT_FOUND_PATH; }
  const path = (url.protocol === 'https:' || url.protocol === 'http:') ? canonicalPathname(url.pathname) : NOT_FOUND_PATH;
  const query: string[] = [];
  for (const key of UTM_KEYS) {
    const raw = url.searchParams.get(key);
    if (raw !== null) query.push(`${key}=${normalizeUtm(raw)}`);
  }
  return PRODUCTION_ORIGIN + path + (query.length ? `?${query.join('&')}` : '');
}

const OWN_HOSTS = new Set([`www.${site.domain}`, site.domain]);

/**
 * External http(s) referrer reduced to its origin (scheme + host + port). Returns null
 * for missing/invalid/non-http referrers and for this site or the current page origin.
 */
export function sanitizeReferrer(referrer: unknown, currentOrigin?: string): string | null {
  if (typeof referrer !== 'string' || referrer.length === 0 || referrer.length > 4096) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (OWN_HOSTS.has(url.hostname) || (currentOrigin && url.origin === currentOrigin)) return null;
    return url.origin;
  } catch { return null; }
}
