// Shared analytics payload scenarios, run against two tracker builds (see guard.ts AnalyticsMode):
//  - live: the exact saved hosted pa- script for this site (hash-verified), all engines;
//  - npm:  the pinned @plausible-analytics/tracker core behind a loader adapter, Chromium.
// Every payload reaches a loopback collector (never plausible.io); the application's declared endpoint is asserted.
// Measurement mode returns 503 for real submissions (delivery disabled), so confirmed receipts for `Lead Submitted`
// are simulated by fulfilling /api/leads in the browser; server-side receipt truth is covered by flows.spec.ts.
import type { Page } from '@playwright/test';
import { test, expect, type CapturedEvent, type NetworkGuard, type TrackerBuild } from './guard';
import { EVENT_ENDPOINT, ORIGINS, PRODUCTION_ORIGIN } from './constants';
import { fillLead, form, submitButton, syntheticLead, type LeadInput } from './form';
import { routes } from '../../fixtures/routes';

const EVENT_PROPS: Record<string, string[]> = {
  assessment_cta_click: ['placement', 'service_category'],
  assessment_form_start: ['page_template'],
  assessment_submit_attempt: ['property_category', 'region', 'service_category', 'urgency_category'],
  assessment_validation_error: ['error_class', 'field_category'],
  assessment_delivery_error: ['error_class'],
  'Lead Submitted': ['service_category', 'urgency_category'],
  emergency_call_click: ['placement'],
  maintenance_interest_click: ['placement'],
};
const EVENT_KEYS = new Set(['n', 'v', 'u', 'd', 'r', 'p', 'i', 'h']);
const ENGAGEMENT_KEYS = new Set(['n', 'v', 'u', 'd', 'p', 'sd', 'e', 'h']);
const CATEGORY = /^[a-z0-9_]{1,40}$/;
const UTM_VALUE = /^[a-z0-9._-]{1,40}$/;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
const SETTLE_MS = 1000;

const named = (guard: NetworkGuard, name: string) => guard.events.filter(event => event.body.n === name);

/** Contract invariants for every captured payload, plus a search for every synthetic/hostile value used by the test. */
function expectHygienicPayloads(events: CapturedEvent[], canaries: string[]) {
  expect(events.length, 'scenario must produce analytics payloads to inspect').toBeGreaterThan(0);
  for (const { body, raw, declared, contentType, seq } of events) {
    const label = raw.slice(0, 400);
    expect(seq, `every send must carry the transport sequence tag: ${label}`).toMatch(/^[a-z0-9]+-\d+$/);
    expect(['', EVENT_ENDPOINT], `the application must use the official Plausible event endpoint: ${declared}`).toContain(declared);
    expect(contentType, label).toBe('text/plain');
    expect(body.__unparseable, `payload must be JSON: ${label}`).toBeUndefined();
    const name = String(body.n);
    const allowedNames = ['pageview', 'engagement', ...Object.keys(EVENT_PROPS)];
    expect(allowedNames, `unexpected event name in ${label}`).toContain(name);
    const keys = name === 'engagement' ? ENGAGEMENT_KEYS : EVENT_KEYS;
    for (const key of Object.keys(body)) expect(keys.has(key), `unexpected top-level key "${key}" in ${label}`).toBe(true);
    expect(typeof body.u, label).toBe('string');
    const url = new URL(String(body.u));
    expect(url.origin, `u must use the production origin: ${label}`).toBe(PRODUCTION_ORIGIN);
    expect([...routes, '/404'], `u must be a canonical path or /404: ${label}`).toContain(url.pathname);
    expect(url.hash, label).toBe('');
    expect(url.username + url.password, label).toBe('');
    const searchKeys = [...url.searchParams.keys()];
    expect(new Set(searchKeys).size, `duplicate query keys: ${label}`).toBe(searchKeys.length);
    for (const key of searchKeys) {
      expect(UTM_KEYS, `only allowlisted UTM keys may remain: ${label}`).toContain(key);
      expect(url.searchParams.get(key), label).toMatch(UTM_VALUE);
    }
    if ('r' in body && body.r !== null) expect(String(body.r), `referrer must be origin-only: ${label}`).toMatch(/^https?:\/\/[^/?#@\s]+$/);
    if ('i' in body) expect(body.i, label).toBe(false);
    if ('h' in body) expect(body.h, label).toBe(1);
    if (name === 'pageview' || name === 'engagement') {
      if (body.p !== undefined) expect(body.p, `${name} must carry no custom properties: ${label}`).toEqual({});
    } else {
      const props = body.p as Record<string, unknown>;
      expect(Object.keys(props ?? {}).sort(), `property keys for ${name}: ${label}`).toEqual(EVENT_PROPS[name]);
      for (const value of Object.values(props)) expect(String(value), `categorical value for ${name}: ${label}`).toMatch(CATEGORY);
      if ('region' in props) expect(['orlando', 'tampa', 'other', 'unknown']).toContain(props.region);
    }
    const lower = raw.toLowerCase();
    for (const canary of canaries.filter(Boolean)) expect(lower.includes(canary.toLowerCase()), `payload leaked "${canary}": ${label}`).toBe(false);
  }
}

function leadCanaries(lead: LeadInput) {
  return [lead.fullName, lead.email, lead.email.split('@')[0], lead.phone, lead.phone.slice(-7), 'zyx', 'canary', '@example.invalid'];
}
async function waitCount(guard: NetworkGuard, name: string, count: number) {
  await expect.poll(() => named(guard, name).length, { message: `${name} count`, timeout: 15000 }).toBe(count);
}
async function settleExactly(page: Page, guard: NetworkGuard, counts: Record<string, number>) {
  for (const [name, count] of Object.entries(counts)) await waitCount(guard, name, count);
  await page.waitForTimeout(SETTLE_MS);
  for (const [name, count] of Object.entries(counts)) expect(named(guard, name).length, `${name} must stay at ${count}`).toBe(count);
}
/** Prevent tel: (and test-injected link) navigation after application and tracker handlers ran, so no call handler/dialog or external navigation occurs. */
export async function blockTelNavigation(page: Page) {
  await page.addInitScript(() => window.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('a[href^="tel:"], a[data-fsc-test-block]') : null;
    if (target) event.preventDefault();
  }));
}
function captureLeadBodies(page: Page) {
  const ids: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/leads') && request.method() === 'POST') { try { ids.push(String(request.postDataJSON().requestId)); } catch { /* not JSON */ } }
  });
  return ids;
}

export function defineAnalyticsSuite(tracker: TrackerBuild) {
  test.describe(`${tracker} tracker`, () => {
  test.use({ baseURL: ORIGINS.analytics });

  test('manual pageviews only: one sanitized URL per navigation, hostile query strings and unknown routes', async ({ page, guard }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    const hostile = ['jane.doe', 'example.com', '4075551234', 'call me', 'frag-secret', 'private-note'];
    await page.goto('/?utm_source=Google&utm_medium=CPC&utm_campaign=jane.doe@example.com&email=jane.doe%40example.com&phone=4075551234&note=call+me#frag-secret');
    await settleExactly(page, guard, { pageview: 1 });
    const first = new URL(String(named(guard, 'pageview')[0].body.u));
    expect(first.pathname).toBe('/');
    expect([...first.searchParams.keys()].sort()).toEqual(['utm_campaign', 'utm_medium', 'utm_source']);
    expect(['google', 'other']).toContain(first.searchParams.get('utm_source'));
    expect(['cpc', 'other']).toContain(first.searchParams.get('utm_medium'));
    expect(first.searchParams.get('utm_campaign')).toBe('other');

    // Client-side navigation from the header CTA: a second pageview, query from the previous page not carried over.
    await page.locator('header a.fsc-header-assessment[href="/contact"]').click();
    await expect(page).toHaveURL(`${ORIGINS.analytics}/contact`);
    await settleExactly(page, guard, { pageview: 2 });
    expect(named(guard, 'pageview')[1].body.u).toBe(`${PRODUCTION_ORIGIN}/contact`);

    await page.goto('/contact?service=repair&email=jane.doe%40example.com&utm_source=newsletter');
    await settleExactly(page, guard, { pageview: 3 });
    expect(named(guard, 'pageview')[2].body.u).toBe(`${PRODUCTION_ORIGIN}/contact?utm_source=newsletter`);

    expect((await page.goto('/private-note/jane.doe@example.com?phone=4075551234'))?.status()).toBe(404);
    await settleExactly(page, guard, { pageview: 4 });
    expect(named(guard, 'pageview')[3].body.u).toBe(`${PRODUCTION_ORIGIN}/404`);

    await page.goto('/services/access-control/?utm_campaign=Spring%202026');
    await expect(page).toHaveURL(/\/services\/access-control\?/);
    await settleExactly(page, guard, { pageview: 5 });
    expect(named(guard, 'pageview')[4].body.u).toBe(`${PRODUCTION_ORIGIN}/services/access-control?utm_campaign=other`);

    expect(guard.scriptRequests, 'the synthetic pa- script URL must have been requested').toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { __fscTrackerOptions?: { autoCapturePageviews?: unknown } }).__fscTrackerOptions?.autoCapturePageviews)).toBe(false);
    expectHygienicPayloads(guard.events, hostile);
  });

  test('referrer is reduced to an origin or removed, never a full URL', async ({ page, guard }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    const referer = 'https://search.example/results?q=jane.doe%40example.com&phone=4075551234';
    await page.goto('/services', { referer });
    expect(await page.evaluate(() => document.referrer), 'precondition: the browser exposes the hostile referrer to the page').toContain('search.example/results');
    await settleExactly(page, guard, { pageview: 1 });
    const r = named(guard, 'pageview')[0].body.r;
    expect([null, undefined, 'https://search.example']).toContain(r);
    test.info().annotations.push({ type: 'observed-referrer', description: JSON.stringify(r ?? null) });
    expectHygienicPayloads(guard.events, ['results', 'jane.doe', '4075551234']);
  });

  test('CTA, maintenance and emergency call clicks send only placement/category properties', async ({ page, guard }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    await blockTelNavigation(page);
    await page.goto('/');
    await settleExactly(page, guard, { pageview: 1 });
    await page.locator('header .fsc-emergency-strip a[href^="tel:"]').click();
    await settleExactly(page, guard, { emergency_call_click: 1 });
    await page.locator('main a.fsc-emergency-call[href^="tel:"]').click();
    await settleExactly(page, guard, { emergency_call_click: 2 });
    const [strip, block] = named(guard, 'emergency_call_click').map(event => (event.body.p as Record<string, string>).placement);
    expect(strip, 'placements must distinguish the header strip from the homepage emergency block').not.toBe(block);
    await expect(page).toHaveURL(`${ORIGINS.analytics}/`);

    await page.locator('[aria-label="Service choices"] a[href="#maintenance"]').click();
    await settleExactly(page, guard, { maintenance_interest_click: 1, pageview: 1 });

    await page.locator('main a.fsc-main-cta[href="/contact"]').click();
    await expect(page).toHaveURL(`${ORIGINS.analytics}/contact`);
    await settleExactly(page, guard, { assessment_cta_click: 1, pageview: 2 });
    const generic = named(guard, 'assessment_cta_click')[0].body.p as Record<string, string>;

    // A service-specific assessment CTA must report a different service category than the generic /contact CTA.
    await page.goto('/services/access-control');
    const serviceCta = page.locator('main section.fsc-page-hero a[href="/contact?service=access-control"]');
    await expect(serviceCta).toBeVisible();
    await serviceCta.click();
    await expect(page).toHaveURL(/\/contact\?service=/);
    await settleExactly(page, guard, { assessment_cta_click: 2 });
    const specific = named(guard, 'assessment_cta_click')[1].body.p as Record<string, string>;
    expect(specific.service_category).not.toBe(generic.service_category);
    expectHygienicPayloads(guard.events, ['3522820692', 'tel:', 'access-control?']);
  });

  test('form start, validation error, submit attempt and delivery error fire once each with categorical properties', async ({ page, guard, browserName }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    const lead = { ...syntheticLead(`events-${browserName}`), city: 'Zyx Hamlet 4075551234 jane.doe@example.com' };
    const ids = captureLeadBodies(page);
    await page.goto('/contact');
    await settleExactly(page, guard, { pageview: 1 });
    await submitButton(page).click();
    await expect(form(page).getByRole('alert')).toBeVisible();
    await settleExactly(page, guard, { assessment_validation_error: 1, assessment_submit_attempt: 0, assessment_delivery_error: 0, 'Lead Submitted': 0 });

    await fillLead(page, lead);
    await page.locator('summary', { hasText: 'Add details' }).click();
    await form(page).locator('[name="company"]').fill('Zyx Canary Towers HOA');
    await form(page).locator('[name="message"]').fill('Zyx private note: gate code QX7Z, call jane.doe@example.com');
    await settleExactly(page, guard, { assessment_form_start: 1 });
    const contactTemplate = (named(guard, 'assessment_form_start')[0].body.p as Record<string, string>).page_template;

    const response = page.waitForResponse(r => r.url() === `${ORIGINS.analytics}/api/leads`);
    await submitButton(page).click();
    expect((await response).status(), 'measurement mode has delivery disabled').toBe(503);
    await expect(form(page).getByRole('alert')).toContainText("We couldn't process your request right now");
    await settleExactly(page, guard, { assessment_submit_attempt: 1, assessment_delivery_error: 1, 'Lead Submitted': 0, assessment_form_start: 1, assessment_validation_error: 1 });
    expect((named(guard, 'assessment_submit_attempt')[0].body.p as Record<string, string>).region, 'a typed town outside the location data is not echoed').toBe('other');

    // The embedded form on a service page reports a different page template than the contact page.
    await page.goto('/services/access-control');
    await form(page).locator('[name="fullName"]').fill('Zyx Service Page');
    await settleExactly(page, guard, { assessment_form_start: 2 });
    expect((named(guard, 'assessment_form_start')[1].body.p as Record<string, string>).page_template).not.toBe(contactTemplate);

    expect(ids.length).toBe(1);
    expectHygienicPayloads(guard.events, [...leadCanaries(lead), 'hamlet', 'qx7z', 'towers', 'jane.doe', ...ids]);
  });

  test('Lead Submitted fires exactly once per logical request, including an unknown receipt followed by a successful retry', async ({ page, guard, browserName }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    const first = { ...syntheticLead(`lead1-${browserName}`), city: 'Tampa' };
    const second = { ...syntheticLead(`lead2-${browserName}`), city: 'Orlando' };
    const bodies: Record<string, string>[] = [];
    const replies: number[] = [504, 200, 200];
    await page.route(`${ORIGINS.analytics}/api/leads`, async route => {
      const body = route.request().postDataJSON() as Record<string, string>;
      bodies.push(body);
      const status = replies[bodies.length - 1];
      if (status === 504) return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'RECEIPT_UNKNOWN', requestId: body.requestId }) });
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: true, requestId: body.requestId, message: 'Request received.' }) });
    });
    await page.goto('/contact');
    await fillLead(page, first);
    await submitButton(page).click();
    await expect(form(page).getByRole('alert')).toContainText('could not confirm');
    await settleExactly(page, guard, { assessment_submit_attempt: 1, assessment_delivery_error: 1, 'Lead Submitted': 0 });
    await submitButton(page).click();
    await expect(page.getByRole('status')).toContainText('Request received');
    await settleExactly(page, guard, { 'Lead Submitted': 1, assessment_submit_attempt: 2, assessment_delivery_error: 1 });
    expect(bodies[1].requestId).toBe(bodies[0].requestId);
    expect((named(guard, 'assessment_submit_attempt')[0].body.p as Record<string, string>).region).toBe('tampa');

    // History traversal after the confirmation must not replay the success event.
    await page.goto('/services');
    await expect(page.locator('h1')).toBeVisible();
    await page.goBack({ waitUntil: 'commit' });
    await expect(page).toHaveURL(`${ORIGINS.analytics}/contact`);
    await expect(page.locator('h1')).toBeVisible();
    await page.goForward({ waitUntil: 'commit' });
    await expect(page).toHaveURL(`${ORIGINS.analytics}/services`);
    await expect(page.locator('h1')).toBeVisible();
    await settleExactly(page, guard, { 'Lead Submitted': 1 });

    // A new logical request (different details, emergency context) is counted separately.
    await page.goto('/contact?urgency=emergency');
    await fillLead(page, second);
    await submitButton(page).click();
    await expect(page.getByRole('status')).toContainText('Request received');
    await settleExactly(page, guard, { 'Lead Submitted': 2 });
    expect(bodies[2].requestId).not.toBe(bodies[0].requestId);
    const [routine, emergency] = named(guard, 'Lead Submitted').map(event => event.body.p as Record<string, string>);
    expect(emergency.urgency_category, 'emergency and routine urgency categories must differ').not.toBe(routine.urgency_category);
    expect((named(guard, 'assessment_submit_attempt')[2].body.p as Record<string, string>).region).toBe('orlando');
    expectHygienicPayloads(guard.events, [...leadCanaries(first), ...leadCanaries(second), ...bodies.map(b => b.requestId)]);
  });

  const failureModes = [
    { label: 'working analytics (baseline)', mode: { script: 'official', events: 'accept' } as const, throwing: false },
    { label: 'event endpoint failing', mode: { script: 'official', events: 'fail' } as const, throwing: false },
    { label: 'tracker script failing to load', mode: { script: 'fail', events: 'accept' } as const, throwing: false },
    { label: 'tracker script throwing', mode: { script: 'throw', events: 'accept' } as const, throwing: false },
    { label: 'window.plausible throwing on every call', mode: { script: 'fail', events: 'accept' } as const, throwing: true },
  ];
  for (const scenario of failureModes) {
    test(`analytics failure never changes the form outcome: ${scenario.label}`, async ({ page, guard, browserName }) => {
      await guard.enableAnalyticsFixture({ tracker, ...scenario.mode });
      if (scenario.throwing) {
        await page.addInitScript(() => {
          const w = window as unknown as { __fscAnalyticsThrows: number };
          w.__fscAnalyticsThrows = 0;
          const thrower = Object.assign(function () { w.__fscAnalyticsThrows++; throw new Error('synthetic analytics exception'); }, { init() { /* accept options */ } });
          Object.defineProperty(window, 'plausible', { configurable: false, get: () => thrower, set: () => undefined });
        });
      }
      const lead = syntheticLead(`fail-${browserName}-${scenario.label.length}`);
      const bodies: Record<string, string>[] = [];
      await page.route(`${ORIGINS.analytics}/api/leads`, async route => {
        const body = route.request().postDataJSON() as Record<string, string>;
        bodies.push(body);
        if (bodies.length === 1) return route.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'RECEIPT_UNKNOWN' }) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, requestId: body.requestId }) });
      });
      await page.goto('/contact');
      await submitButton(page).click();
      const alert = form(page).getByRole('alert');
      await expect(alert).toBeFocused();
      await expect(alert).toContainText('Please review the highlighted fields. Your other details are still here.');
      await fillLead(page, lead);
      await submitButton(page).click();
      await expect(alert).toContainText('We could not confirm whether your request was received. Retry the same request below, or call us to check. Your details have been kept.');
      await expect(submitButton(page)).toHaveText(/^Retry request/);
      await submitButton(page).click();
      const status = page.getByRole('status');
      await expect(status).toBeFocused();
      await expect(status.getByRole('heading', { name: 'Request received' })).toBeVisible();
      await expect(status).toContainText(`Request reference: ${bodies[0].requestId}`);
      expect(bodies).toHaveLength(2);
      expect(bodies[1].requestId).toBe(bodies[0].requestId);
      await page.waitForTimeout(SETTLE_MS);
      if (scenario.mode.script === 'official') {
        expect(guard.events.length, 'the tracker ran and attempted to send events').toBeGreaterThan(0);
        expect(named(guard, 'Lead Submitted')).toHaveLength(1);
      } else {
        expect(guard.scriptRequests, 'the failing script URL was requested').toBeGreaterThan(0);
        expect(guard.events, 'no events can be sent without a working tracker').toEqual([]);
      }
      if (scenario.throwing) expect(await page.evaluate(() => (window as unknown as { __fscAnalyticsThrows: number }).__fscAnalyticsThrows), 'application analytics calls were made and threw').toBeGreaterThan(0);
    });
  }

  test('dashboard-default automatic events (form submission, outbound link, file download) never produce a POST', async ({ page, guard }) => {
    await guard.enableAnalyticsFixture({ tracker, script: 'official', events: 'accept' });
    await blockTelNavigation(page);
    await page.goto('/contact');
    await settleExactly(page, guard, { pageview: 1 });
    // Links that the hosted script's dashboard defaults (outboundLinks, fileDownloads) would track if enabled.
    await page.evaluate(() => {
      const main = document.querySelector('main')!;
      for (const [id, href] of [['fsc-test-outbound', 'https://outbound.example/partner?email=jane.doe%40example.com'], ['fsc-test-download', '/fsc-test-brochure.pdf']]) {
        const link = document.createElement('a');
        link.id = id; link.href = href; link.textContent = id; link.setAttribute('data-fsc-test-block', '');
        main.prepend(link);
      }
    });
    await page.locator('#fsc-test-outbound').click();
    await page.locator('#fsc-test-download').click();
    await expect(page).toHaveURL(`${ORIGINS.analytics}/contact`);
    // Native submit events on the assessment form (formSubmissions default): one invalid, one valid (measurement 503).
    await submitButton(page).click();
    await expect(form(page).getByRole('alert')).toBeVisible();
    await fillLead(page, syntheticLead('auto-events'));
    const response = page.waitForResponse(r => r.url() === `${ORIGINS.analytics}/api/leads`);
    await submitButton(page).click();
    expect((await response).status()).toBe(503);
    // Control: the transport is live at this point, so absence of automatic events is not a dead tracker.
    await page.locator('header .fsc-emergency-strip a[href^="tel:"]').click();
    await settleExactly(page, guard, { emergency_call_click: 1, 'Form: Submission': 0, 'Outbound Link: Click': 0, 'File Download': 0 });
    expect(await page.evaluate(() => (window as unknown as { __fscTrackerOptions?: Record<string, unknown> }).__fscTrackerOptions), 'application init options were applied').toMatchObject({ autoCapturePageviews: false, transformRequest: 'function' });
    expectHygienicPayloads(guard.events, ['outbound.example', 'brochure', 'jane.doe', ...leadCanaries(syntheticLead('auto-events'))]);
  });

  });
}
