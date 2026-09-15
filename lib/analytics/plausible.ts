// Plausible pa- script wiring. Evidence (see S-006 builder handoff): the official
// tracker (@plausible-analytics/tracker 0.4.6, plausible.js `track`) builds
// {n,v,u,d,r,p,i,$,h}, with u = options.u || options.url || location.href and
// r = document.referrer || null, then calls config.transformRequest(payload) last
// and drops the event on a falsy result. The pa- snippet stores init options in
// `plausible.o` (same queue/init stub as next-plausible 4.0.0 PlausibleProvider).
import { buildEvent, isAnalyticsEvent, setAnalyticsActive } from './events';
import { sanitizePageUrl, sanitizeReferrer } from './sanitize';
import { PLAUSIBLE_SCRIPT_URL_PATTERN } from './config';

export type SanitizedPayload = { n: string; u: string; d: string; r: string | null; v?: number; p?: Record<string, string>; i?: false; h?: 1 };

/**
 * Pure transformRequest body: only `pageview` or the eight allowlisted events;
 * u → sanitized production URL; r → external origin or null; props rebuilt from
 * the allowlist (pageviews carry none); revenue and any unknown key dropped.
 * Returns null (event ignored) on anything unexpected.
 */
export function sanitizePayload(payload: unknown, currentOrigin?: string): SanitizedPayload | null {
  try {
    if (!payload || typeof payload !== 'object') return null;
    const source = payload as Record<string, unknown>;
    const name = source.n;
    if (name !== 'pageview' && !isAnalyticsEvent(name)) return null;
    if (typeof source.d !== 'string' || !/^[A-Za-z0-9.-]{1,253}$/.test(source.d)) return null;
    const out: SanitizedPayload = { n: name, u: sanitizePageUrl(source.u), d: source.d, r: sanitizeReferrer(source.r, currentOrigin) };
    if (typeof source.v === 'number' && Number.isFinite(source.v)) out.v = source.v;
    if (source.i === false) out.i = false;
    if (source.h === 1) out.h = 1;
    if (name !== 'pageview') {
      const built = buildEvent(name, source.p);
      if (!built) return null;
      out.p = built.props;
    }
    return out;
  } catch { return null; }
}

type Stub = ((...args: unknown[]) => unknown) & { q?: unknown[]; o?: unknown; init?: (options?: unknown) => void };
let installed = false;

/**
 * Installs the official queue/init stub with privacy options BEFORE the script is
 * requested, then appends the pa- script once. Returns false (nothing loaded) for any
 * non-pa URL or failure.
 */
export function installPlausible(src: string): boolean {
  try {
    if (typeof window === 'undefined' || !PLAUSIBLE_SCRIPT_URL_PATTERN.test(src)) return false;
    if (installed) return true;
    const w = window as unknown as { plausible?: Stub };
    // Official Plausible snippet stub (queue + init storing options in plausible.o).
    w.plausible = w.plausible || function () {
      // eslint-disable-next-line prefer-rest-params
      ((w.plausible as Stub).q = (w.plausible as Stub).q || []).push(arguments);
    } as Stub;
    w.plausible.init = w.plausible.init || function (options?: unknown) { (w.plausible as Stub).o = options || {}; };
    w.plausible.init({
      autoCapturePageviews: false,
      hashBasedRouting: false,
      outboundLinks: false,
      fileDownloads: false,
      formSubmissions: false,
      logging: false,
      transformRequest: (payload: unknown) => sanitizePayload(payload, window.location.origin),
    });
    installed = true;
    setAnalyticsActive(true);
    if (!document.querySelector('script[data-fsc-analytics]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      script.referrerPolicy = 'no-referrer';
      script.setAttribute('data-fsc-analytics', '');
      document.head.appendChild(script);
    }
    return true;
  } catch {
    setAnalyticsActive(false);
    return false;
  }
}
