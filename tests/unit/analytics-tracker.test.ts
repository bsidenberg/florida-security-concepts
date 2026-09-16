// Real tracker integration: the pinned @plausible-analytics/tracker core runs with the options object the project's
// loader installs (lib/analytics/plausible.ts installPlausible → plausible.o), fed by the project's event helpers, on
// hostile inputs. The page is emulated at the production hostname, so the tracker's localhost/webdriver filters are
// exercised as in production. Every fetch the tracker makes is captured; nothing leaves the process.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

let trackerInstance = 0;
type Sent = { url: string; body: Record<string, unknown>; raw: string; init: RequestInit };
const HOSTILE = ['jane', 'doe', '4075551234', 'secret', 'gate code', '18a85f2b', 'inbox', 'evil.example/'];

function browser(href: string, referrer: string) {
  const sent: Sent[] = [];
  const url = new URL(href);
  const location = { href: url.href, hostname: url.hostname, host: url.host, origin: url.origin, pathname: url.pathname, protocol: url.protocol, search: url.search };
  const appended: Record<string, unknown>[] = [];
  const document = {
    referrer, visibilityState: 'visible', hasFocus: () => true, addEventListener: () => undefined,
    body: { scrollHeight: 1200, offsetHeight: 1200, clientHeight: 1200 }, documentElement: { scrollHeight: 1200, offsetHeight: 1200, clientHeight: 1200 },
    querySelector: () => null, head: { appendChild: (element: Record<string, unknown>) => appended.push(element) },
    createElement: () => ({ setAttribute(name: string, value: string) { (this as Record<string, unknown>)[name] = value; } }),
  };
  const fetch = vi.fn(async (target: string, init: RequestInit) => {
    const raw = String(init.body);
    sent.push({ url: target, raw, body: JSON.parse(raw), init });
    return { status: 202 };
  });
  const window: Record<string, unknown> = { location, document, fetch, navigator: { webdriver: false }, localStorage: {}, innerHeight: 800, scrollY: 0, addEventListener: () => undefined, history: { pushState: () => undefined } };
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', location);
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('ResizeObserver', class { observe() { /* no layout in Node */ } });
  return { sent, appended, window };
}

/** Load fresh module instances, install the project's loader options, then start the real tracker the way the pa- loader does. */
async function start(href: string, referrer: string, beforeInit?: (modules: { events: typeof import('../../lib/analytics/events') }) => void) {
  const env = browser(href, referrer);
  vi.resetModules();
  const plausible = await import('../../lib/analytics/plausible');
  const events = await import('../../lib/analytics/events');
  // init() may run once per module instance; a query-suffixed file URL yields a fresh instance of the pinned file.
  const tracker = await import(/* @vite-ignore */ `${pathToFileURL(createRequire(import.meta.url).resolve('@plausible-analytics/tracker')).href}?instance=${++trackerInstance}`) as typeof import('@plausible-analytics/tracker');
  expect(plausible.installPlausible('https://plausible.io/js/pa-unit-fixture.js')).toBe(true);
  expect(env.appended).toHaveLength(1);
  const stub = env.window.plausible as { o?: Record<string, unknown>; q?: IArguments[] };
  expect(stub.o, 'the loader must install init options before the script loads').toBeTruthy();
  beforeInit?.({ events });
  const queued = [...(stub.q ?? [])];
  tracker.init({ ...(stub.o as object), domain: 'floridasecurityconcepts.com' } as Parameters<typeof tracker.init>[0]);
  for (const args of queued) tracker.track(args[0], args[1] ?? {});
  return { ...env, events, tracker, options: stub.o as Record<string, unknown> };
}
function expectClean(sent: Sent[]) {
  for (const { raw, body, url } of sent) {
    expect(url).toBe('https://plausible.io/api/event');
    const lower = raw.toLowerCase();
    for (const fragment of HOSTILE) expect(lower.includes(fragment), `payload leaked "${fragment}": ${raw}`).toBe(false);
    expect(new URL(String(body.u)).origin).toBe('https://www.floridasecurityconcepts.com');
    expect(body).not.toHaveProperty('$');
    if (body.r !== undefined && body.r !== null) expect(String(body.r)).toMatch(/^https?:\/\/[^/?#@]+$/);
  }
}
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

const HOSTILE_HREF = 'https://www.floridasecurityconcepts.com/contact?email=jane.doe%40example.com&phone=4075551234&utm_source=Google&utm_campaign=18a85f2b-5ba9-43c2-a475-84ac0ac98310#gate-code';
const HOSTILE_REFERRER = 'https://evil.example/inbox?msg=jane.doe@example.com&token=secret';

describe('real @plausible-analytics/tracker with the project loader options', () => {
  it('installs privacy options: no automatic pageviews, outbound, download or form tracking, and a transformRequest', async () => {
    const { options, sent } = await start(HOSTILE_HREF, HOSTILE_REFERRER);
    expect(options).toMatchObject({ autoCapturePageviews: false, outboundLinks: false, fileDownloads: false, formSubmissions: false });
    expect(typeof options.transformRequest).toBe('function');
    expect(options).not.toHaveProperty('endpoint');
    expect(sent, 'init must not send an automatic pageview').toEqual([]);
  });

  it('manual pageview: sanitized URL and origin-only referrer', async () => {
    const { events, sent } = await start(HOSTILE_HREF, HOSTILE_REFERRER);
    events.sendPageview(window.location.href);
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toMatchObject({ n: 'pageview', u: 'https://www.floridasecurityconcepts.com/contact?utm_source=google&utm_campaign=other', r: 'https://evil.example', d: 'floridasecurityconcepts.com' });
    expect(sent[0].body.p).toBeUndefined();
    expectClean(sent);
  });

  it('transformRequest still sanitizes a call that bypasses the project helpers', async () => {
    const { sent } = await start(HOSTILE_HREF, HOSTILE_REFERRER);
    const plausible = (window as unknown as { plausible: (name: string, options?: Record<string, unknown>) => void }).plausible;
    plausible('pageview', { u: 'https://evil.example/private/jane.doe@example.com?token=secret' });
    plausible('Lead Submitted', { props: { service_category: 'Access control', urgency_category: 'Emergency', email: 'jane.doe@example.com', requestId: '18a85f2b-5ba9-43c2-a475-84ac0ac98310' }, revenue: { amount: 4075551234, currency: 'USD' } });
    plausible('Signup', { props: { email: 'jane.doe@example.com' } });
    plausible('Form: Submission');
    plausible('Outbound Link: Click', { props: { url: 'https://evil.example/?token=secret' } });
    expect(sent.map(s => s.body.n)).toEqual(['pageview', 'Lead Submitted']);
    expect(sent[0].body.u).toBe('https://www.floridasecurityconcepts.com/404');
    expect(Object.keys(sent[1].body.p as object).sort()).toEqual(['service_category', 'urgency_category']);
    expectClean(sent);
  });

  it('events queued before the script loads are sanitized when replayed', async () => {
    const { sent } = await start(HOSTILE_HREF, HOSTILE_REFERRER, ({ events }) => {
      events.sendPageview('https://www.floridasecurityconcepts.com/services/access-control/?email=jane.doe%40example.com');
      events.track('assessment_submit_attempt', { service_category: 'Access control', property_category: 'HOA / gated community', region: 'orlando', urgency_category: 'Emergency' });
    });
    expect(sent.map(s => s.body.n)).toEqual(['pageview', 'assessment_submit_attempt']);
    expect(sent[0].body.u).toBe('https://www.floridasecurityconcepts.com/services/access-control');
    expect(sent[1].body.p).toMatchObject({ region: 'orlando' });
    expectClean(sent);
  });

  it('engagement events reuse only the sanitized pageview URL and carry no referrer', async () => {
    const { events, sent } = await start(HOSTILE_HREF, HOSTILE_REFERRER);
    events.sendPageview(window.location.href);
    events.sendPageview('https://www.floridasecurityconcepts.com/services?email=jane.doe%40example.com');
    const engagement = sent.filter(s => s.body.n === 'engagement');
    expect(engagement.length).toBeGreaterThan(0);
    for (const { body } of engagement) {
      expect(body.u).toBe('https://www.floridasecurityconcepts.com/contact?utm_source=google&utm_campaign=other');
      expect(body).not.toHaveProperty('r');
    }
    expectClean(sent);
  });

  it('Lead Submitted is sent once per logical request ID', async () => {
    const { events, sent } = await start(HOSTILE_HREF, '');
    const props = { service_category: 'Maintenance / service', urgency_category: 'Not specified' };
    events.trackLeadSubmitted('18a85f2b-5ba9-43c2-a475-84ac0ac98310', props);
    events.trackLeadSubmitted('18a85f2b-5ba9-43c2-a475-84ac0ac98310', props);
    expect(sent.filter(s => s.body.n === 'Lead Submitted')).toHaveLength(1);
    events.trackLeadSubmitted('9b2f7c1e-0c1d-4c5e-8f3a-2b6d9e4a7c10', props);
    expect(sent.filter(s => s.body.n === 'Lead Submitted')).toHaveLength(2);
    expect(sent[0].body.r).toBeNull();
    expectClean(sent);
  });

  it('project helpers swallow tracker and transport exceptions', async () => {
    const { events } = await start(HOSTILE_HREF, HOSTILE_REFERRER);
    vi.stubGlobal('window', { ...window, plausible: () => { throw new Error('synthetic tracker failure'); }, location: window.location });
    expect(() => events.track('assessment_form_start', { page_template: '/contact' })).not.toThrow();
    expect(() => events.sendPageview('https://www.floridasecurityconcepts.com/')).not.toThrow();
    expect(() => events.trackLeadSubmitted('18a85f2b-5ba9-43c2-a475-84ac0ac98310', {})).not.toThrow();
    expect(() => events.trackClick('emergency_call', 'header', 'tel:+1')).not.toThrow();
  });

  it('control: without installPlausible the helpers send nothing', async () => {
    browser(HOSTILE_HREF, HOSTILE_REFERRER);
    vi.resetModules();
    const events = await import('../../lib/analytics/events');
    const fetchSpy = globalThis.fetch as unknown as (target: string, init: RequestInit) => Promise<unknown>;
    (window as unknown as { plausible: unknown }).plausible = (name: string) => fetchSpy(name, { body: '{}' });
    events.sendPageview(HOSTILE_HREF);
    events.track('emergency_call_click', { placement: 'header' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
