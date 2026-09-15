// Analytics URL, referrer and script-URL sanitization (lib/analytics/sanitize.ts, routes.ts, config.ts).
import { describe, expect, it } from 'vitest';
import { normalizeUtm, sanitizePageUrl, sanitizeReferrer } from '../../lib/analytics/sanitize';
import { CANONICAL_ROUTES, canonicalPathname, pageTemplateFor } from '../../lib/analytics/routes';
import { analyticsScriptSrc } from '../../lib/analytics/config';
import { routes } from '../fixtures/routes';

const ORIGIN = 'https://www.floridasecurityconcepts.com';
const HOSTILE = ['jane', 'doe', 'example.com', '4075551234', '555', 'secret', 'token', 'gate code', '%40', '@'];
function expectNoHostile(value: string) {
  const lower = value.toLowerCase();
  for (const fragment of HOSTILE) expect(lower.includes(fragment.toLowerCase()), `"${value}" leaked "${fragment}"`).toBe(false);
}

describe('canonical route inventory', () => {
  it('equals the independent 38-route launch contract exactly', () => {
    expect([...CANONICAL_ROUTES].sort()).toEqual([...routes].sort());
    expect(new Set(CANONICAL_ROUTES).size).toBe(CANONICAL_ROUTES.length);
  });
  it.each(routes)('keeps %s (and one trailing slash) as itself', path => {
    expect(canonicalPathname(path)).toBe(path);
    if (path !== '/') expect(canonicalPathname(`${path}/`)).toBe(path);
  });
  it.each([
    '/Contact', '/contact//', '/contact/extra', '/%63ontact', '/services/', '/services/unknown', '/private/jane@example.com',
    '/contact;jsessionid=1', '', '/'.repeat(300), 'contact', '//contact',
  ])('maps unknown or altered path %j to /404', path => {
    expect(canonicalPathname(path)).toBe(path === '/services/' ? '/services' : '/404');
  });
  it('rejects non-string paths', () => {
    for (const value of [undefined, null, 42, ['/contact'], { pathname: '/contact' }]) expect(canonicalPathname(value)).toBe('/404');
  });
  it('assigns every canonical route a non-not_found template and unknown paths not_found', () => {
    for (const path of routes) expect(pageTemplateFor(path)).not.toBe('not_found');
    expect(pageTemplateFor('/contact')).not.toBe(pageTemplateFor('/services/access-control'));
    expect(pageTemplateFor('/services/access-control')).toBe(pageTemplateFor('/services/gate-automation'));
    expect(pageTemplateFor('/services/not-a-service')).toBe('not_found');
  });
});

describe('normalizeUtm', () => {
  it.each([['google', 'google'], [' Google ', 'google'], ['CPC', 'cpc'], ['spring_2026', 'spring_2026'], ['hoa-mailer', 'hoa-mailer'], ['a-b', 'a-b'], ['q3_2026-promo', 'q3_2026-promo'], ['x'.repeat(40), 'x'.repeat(40)]])('keeps simple value %j as %j', (input, output) => {
    expect(normalizeUtm(input)).toBe(output);
  });
  it.each([
    ['empty', ''], ['too long', 'x'.repeat(41)], ['space', 'spring 2026'], ['email', 'jane.doe@example.com'], ['plus', 'a+b'],
    ['unicode', 'café'], ['slash', 'a/b'], ['percent', 'jane%40example.com'], ['newline', 'a\nb'],
    ['10-digit phone', '4075551234'], ['7-digit run', 'call5551234'], ['E.164 digits', '14075551234'],
    ['uuid', '18a85f2b-5ba9-43c2-a475-84ac0ac98310'], ['uuid without dashes', '18a85f2b5ba943c2a47584ac0ac98310'],
    ['16+ hex token', 'deadbeefdeadbeef'], ['webmail name', 'jane_gmail'], ['dotted email-like', 'jane.doe.example'], ['outlook', 'outlook.com'],
    ['any dot: two labels', 'fb.ads'], ['any dot: name', 'jane.doe'], ['any dot: trailing', 'google.'], ['phone fragment dash', '555-0100'], ['phone fragment dot', '555.0100'],
    ['phone fragment plain', '5550100'], ['phone fragment embedded', 'call-555-0100-now'], ['US phone dashed', '407-555-0100'],
  ])('maps %s to other', (_label, input) => {
    expect(normalizeUtm(input)).toBe('other');
  });
  it('maps non-strings to other', () => {
    for (const value of [undefined, null, 7, ['google'], { toString: () => 'google' }]) expect(normalizeUtm(value)).toBe('other');
  });
});

describe('sanitizePageUrl', () => {
  it('reduces a hostile loopback URL to production origin, canonical path and normalized UTMs in fixed order', () => {
    const url = sanitizePageUrl('http://user:pass@127.0.0.1:3164/contact?email=jane.doe%40example.com&utm_campaign=Spring&phone=4075551234&utm_source=Google#gate-code');
    expect(url).toBe(`${ORIGIN}/contact?utm_source=google&utm_campaign=spring`);
    expectNoHostile(url);
  });
  it('drops every non-UTM parameter and the fragment', () => {
    expect(sanitizePageUrl('https://www.floridasecurityconcepts.com/?service=repair&industry=hoa&q=free+text#x')).toBe(`${ORIGIN}/`);
  });
  it('keeps only the first value of a repeated UTM key and normalizes identifier-shaped values', () => {
    expect(sanitizePageUrl('/services?utm_source=newsletter&utm_source=jane.doe%40example.com&utm_medium=4075551234')).toBe(`${ORIGIN}/services?utm_source=newsletter&utm_medium=other`);
  });
  it.each([
    ['unknown route', 'https://evil.example/private/jane.doe@example.com?token=secret'],
    ['javascript URL', 'javascript:alert(document.cookie)'],
    ['data URL', 'data:text/html,secret'],
    ['protocol-relative host', '//evil.example/private'],
    ['encoded traversal', '/contact/..%2Fprivate'],
    ['oversized', `/contact?x=${'a'.repeat(5000)}`],
  ])('maps %s to /404 without echoing input', (_label, href) => {
    const url = sanitizePageUrl(href);
    expect(new URL(url).origin).toBe(ORIGIN);
    expect(new URL(url).pathname).toBe('/404');
    expectNoHostile(url);
  });
  it('maps non-string input to /404', () => {
    for (const value of [undefined, null, 1, {}, ['https://www.floridasecurityconcepts.com/']]) expect(sanitizePageUrl(value)).toBe(`${ORIGIN}/404`);
  });
  it('never returns a URL with anything but the allowlisted shape', () => {
    const samples = ['/', '/contact?utm_source=a&utm_medium=b&utm_campaign=c&x=1', 'https://www.floridasecurityconcepts.com/resources/how-much-does-an-automatic-gate-cost/?utm_campaign=../../etc', '/services/access-control?utm_source=%00', '\\\\evil.example\\contact'];
    for (const sample of samples) {
      const url = new URL(sanitizePageUrl(sample));
      expect(url.origin).toBe(ORIGIN);
      expect([...routes, '/404']).toContain(url.pathname);
      expect(url.hash).toBe('');
      for (const [key, value] of url.searchParams) {
        expect(['utm_source', 'utm_medium', 'utm_campaign']).toContain(key);
        expect(value).toMatch(/^[a-z0-9._-]{1,40}$/);
      }
    }
  });
});

describe('sanitizeReferrer', () => {
  it('reduces an external referrer to its origin, dropping path, query, fragment and credentials', () => {
    const referrer = sanitizeReferrer('https://jane:secret@search.example:8443/results?q=jane.doe%40example.com#top');
    expect(referrer).toBe('https://search.example:8443');
  });
  it('returns null for this site, the current page origin, invalid and non-http referrers', () => {
    expect(sanitizeReferrer('https://www.floridasecurityconcepts.com/contact?email=x')).toBeNull();
    expect(sanitizeReferrer('https://floridasecurityconcepts.com/')).toBeNull();
    expect(sanitizeReferrer('http://127.0.0.1:3164/contact?email=x', 'http://127.0.0.1:3164')).toBeNull();
    for (const value of ['', 'not a url', 'javascript:alert(1)', 'file:///C:/secret.txt', 'android-app://com.example/path', undefined, null, 5, `https://x.example/${'a'.repeat(5000)}`]) {
      expect(sanitizeReferrer(value), String(value).slice(0, 40)).toBeNull();
    }
  });
  it('does not treat a look-alike host as this site', () => {
    expect(sanitizeReferrer('https://www.floridasecurityconcepts.com.evil.example/x')).toBe('https://www.floridasecurityconcepts.com.evil.example');
  });
});

describe('analyticsScriptSrc', () => {
  const allowed = { scriptUrl: 'https://plausible.io/js/pa-AbC_12-x.js', localPreview: false, hostedPreview: false, production: true };
  it('returns the exact official pa- URL only for a production, non-preview build', () => {
    expect(analyticsScriptSrc(allowed)).toBe(allowed.scriptUrl);
    expect(analyticsScriptSrc({ ...allowed, production: false })).toBe('');
    expect(analyticsScriptSrc({ ...allowed, localPreview: true })).toBe('');
    expect(analyticsScriptSrc({ ...allowed, hostedPreview: true })).toBe('');
  });
  it.each([
    'https://plausible.io/js/script.js', 'https://plausible.io/js/script.tagged-events.js', 'http://plausible.io/js/pa-x.js',
    'https://plausible.io.evil.example/js/pa-x.js', 'https://evil.example/js/pa-x.js', 'https://plausible.io/js/pa-x.js?x=1',
    'https://plausible.io/js/pa-x.js#x', 'https://plausible.io/js/pa-.js', 'https://plausible.io/js/pa-x/../y.js', ' https://plausible.io/js/pa-x.js',
    'https://PLAUSIBLE.io/js/pa-x.js', '',
  ])('rejects %j', scriptUrl => {
    expect(analyticsScriptSrc({ ...allowed, scriptUrl })).toBe('');
  });
  it('rejects non-string configuration', () => {
    for (const scriptUrl of [undefined, null, 1, ['https://plausible.io/js/pa-x.js']]) expect(analyticsScriptSrc({ ...allowed, scriptUrl })).toBe('');
  });
});
