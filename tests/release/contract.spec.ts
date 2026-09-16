// Server-mode contract for the release suite (runs once, in the chromium project). The known-failure local server it
// checks is test-owned; see the header of flows.spec.ts and support/prebuilt-local-failure-server.mjs.
import { existsSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';
import { test, expect } from './support/guard';
import { ORIGINS, REPRESENTATIVE } from './support/constants';
import { receiptPath } from './support/form';
import { staticChunksIntact } from './support/global-setup';
import { routes } from '../fixtures/routes';
import { locations } from '../../data/locations';
import { liveTrackerBytes } from './support/live-tracker';

function syntheticBody(requestId: string) {
  return { requestId, fullName: 'Zyx Contract Probe', email: 'fsc-contract-probe@example.invalid', phone: '2025550143', propertyType: 'HOA / gated community', service: 'Maintenance / service', city: 'Orlando', urgency: 'Not specified', contactMethod: 'Email' };
}
const uuid = () => crypto.randomUUID();

test('representative release routes come from the independent 38-route contract', () => {
  expect(routes).toHaveLength(38);
  for (const path of Object.values(REPRESENTATIVE)) expect(routes, `${path} must be a canonical launch route`).toContain(path);
});

/** Runtime proof that a measurement server is production-equivalent (an inherited hosted-preview marker would flip these). */
async function expectIndexable(request: APIRequestContext, base: string) {
  for (const path of [REPRESENTATIVE.home, REPRESENTATIVE.contact, REPRESENTATIVE.serviceDetail]) {
    const response = await request.get(`${base}${path}`);
    expect(response.status(), `${base}${path}`).toBe(200);
    expect(response.headers()['x-robots-tag'], `${base}${path} must not send X-Robots-Tag`).toBeUndefined();
    const html = await response.text();
    expect(html, `${base}${path} must not be noindex`).not.toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
    expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="index, follow/i);
    expect(html).not.toContain('fsc-preview-notice');
  }
  const robots = await (await request.get(`${base}/robots.txt`)).text();
  expect(robots).toMatch(/^Allow: \/$/m);
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toMatch(/^Sitemap: https:\/\/www\.floridasecurityconcepts\.com\/sitemap\.xml$/m);
}

test('measurement server is production-equivalent: indexable, no preview notice, no analytics, delivery disabled', async ({ request }) => {
  await expectIndexable(request, ORIGINS.measure);
  for (const path of [REPRESENTATIVE.home, REPRESENTATIVE.contact]) expect(await (await request.get(`${ORIGINS.measure}${path}`)).text()).not.toContain('plausible.io');
  const requestId = uuid();
  const response = await request.post(`${ORIGINS.measure}/api/leads`, { data: syntheticBody(requestId) });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, code: 'CONFIGURATION' });
  expect(existsSync(receiptPath(requestId)), 'measurement mode must never write a local receipt').toBe(false);
});

test('analytics-fixture measurement server is production-equivalent and references only the synthetic pa- script URL', async ({ request }) => {
  await expectIndexable(request, ORIGINS.analytics);
  const html = await (await request.get(`${ORIGINS.analytics}/contact`)).text();
  expect(html).toContain('https://plausible.io/js/pa-fsc-release-fixture.js');
  expect([...html.matchAll(/plausible\.io\/js\/[^"'\s\\]+/g)].map(m => m[0]).every(url => url === 'plausible.io/js/pa-fsc-release-fixture.js')).toBe(true);
  const response = await request.post(`${ORIGINS.analytics}/api/leads`, { data: syntheticBody(uuid()) });
  expect(response.status()).toBe(503);
});

test('saved hosted Plausible script is present and unchanged (required by the live-tracker payload suite)', () => {
  expect(() => liveTrackerBytes()).not.toThrow();
  expect(liveTrackerBytes().toString('utf8')).toContain('plausible.o&&S(plausible.o)');
});

test('client JavaScript for form pages does not ship location page copy', async ({ request }) => {
  // Distinctive ASCII windows from every location's long-form copy (privacy review m-2: region mapping must not bundle data/locations).
  const samples = locations.flatMap(location => [location.intro, location.localContext, location.metaDescription])
    .map(text => /[\x20-\x7e]{48,}/.exec(text)?.[0].slice(0, 48))
    .filter((sample): sample is string => Boolean(sample));
  expect(samples.length).toBeGreaterThanOrEqual(14);
  const leaks: string[] = [];
  let chunkCount = 0;
  for (const path of [REPRESENTATIVE.contact, REPRESENTATIVE.serviceDetail]) {
    const html = await (await request.get(`${ORIGINS.analytics}${path}`)).text();
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s)\\]+\.js/g)].map(m => m[0]))];
    for (const chunk of chunks) {
      const body = await (await request.get(`${ORIGINS.analytics}${chunk}`)).text();
      chunkCount++;
      for (const sample of samples) if (body.includes(sample)) leaks.push(`${path} ${chunk}: "${sample}"`);
    }
  }
  expect(chunkCount).toBeGreaterThan(0);
  expect(leaks).toEqual([]);
});

for (const [path, canonical] of [
  ['/', null],
  ['/contact', 'https://www.floridasecurityconcepts.com/contact'],
  ['/contact?service=repair', 'https://www.floridasecurityconcepts.com/contact'],
] as const) {
  test(`metadata is in <head> on the measurement build: ${path}`, async ({ page, request, browserName }) => {
    // Served HTML for this browser's user agent: description and canonical before </head>, exactly once each.
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const html = await (await request.get(`${ORIGINS.measure}${path}`, { headers: { 'user-agent': userAgent } })).text();
    const headEnd = html.indexOf('</head>');
    expect(headEnd, `${browserName} HTML must have a head`).toBeGreaterThan(0);
    for (const pattern of [/<meta[^>]+name="description"[^>]*>/g, /<link[^>]+rel="canonical"[^>]*>/g]) {
      const matches = [...html.matchAll(pattern)];
      expect(matches.map(m => m.index! < headEnd ? 'head' : 'body'), `${path} served ${pattern.source}`).toEqual(['head']);
    }
    // Rendered DOM after hydration.
    expect((await page.goto(`${ORIGINS.measure}${path}`))?.status()).toBe(200);
    await page.waitForLoadState('load');
    const dom = await page.evaluate(() => ({
      headDescription: [...document.head.querySelectorAll('meta[name="description"]')].map(m => m.getAttribute('content') || ''),
      bodyDescription: document.body.querySelectorAll('meta[name="description"]').length,
      headCanonical: [...document.head.querySelectorAll('link[rel="canonical"]')].map(l => l.getAttribute('href') || ''),
      bodyCanonical: document.body.querySelectorAll('link[rel="canonical"]').length,
    }));
    expect(dom.headDescription).toHaveLength(1);
    expect(dom.headDescription[0].trim().length).toBeGreaterThan(50);
    expect(dom.bodyDescription).toBe(0);
    expect(dom.headCanonical).toHaveLength(1);
    expect(dom.bodyCanonical).toBe(0);
    if (canonical) expect(dom.headCanonical[0]).toBe(canonical);
    else expect(new URL(dom.headCanonical[0]).origin).toBe('https://www.floridasecurityconcepts.com');
  });
}

test('local preview server stays private and analytics-free', async ({ request }) => {
  const html = await (await request.get(`${ORIGINS.local}/contact`)).text();
  expect(html).toContain('fsc-preview-notice');
  expect(html).toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
  expect(html).not.toContain('plausible.io');
  const robots = await (await request.get(`${ORIGINS.local}/robots.txt`)).text();
  expect(robots).toMatch(/^Disallow: \/\s*$/m);
});

test('known-failure local server returns DELIVERY_FAILED and writes no receipt', async ({ request }) => {
  const requestId = uuid();
  const response = await request.post(`${ORIGINS.localFailure}/api/leads`, { data: syntheticBody(requestId) });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, code: 'DELIVERY_FAILED', requestId });
  expect(existsSync(receiptPath(requestId))).toBe(false);
});

test('no release build overwrote another running release server', async () => {
  for (const base of Object.values(ORIGINS)) expect(await staticChunksIntact(base), base).toEqual([]);
});
