import { test as base, expect, type BrowserContext, type Route } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { COLLECTOR_ENV, COLLECTOR_ORIGIN, EVENT_ENDPOINT, FIXTURE_SCRIPT_URL, SERVER_ORIGINS, SINKHOLE_ENV } from './constants';
import { liveTrackerBytes } from './live-tracker';
import { trackerAdapterSource, transportTaggerSource } from './tracker-adapter';

export type CapturedEvent = { raw: string; body: Record<string, unknown>; at: number; declared: string; contentType: string; seq: string };
export type TrackerBuild = 'live' | 'npm';
export type AnalyticsMode = {
  /** 'live' = exact saved hosted pa- script (hash-verified); 'npm' = pinned @plausible-analytics/tracker core + loader adapter. */
  tracker: TrackerBuild;
  /** 'official' serves the selected tracker; 'fail' aborts the script request; 'throw' serves a script that throws. */
  script: 'official' | 'fail' | 'throw';
  /** 'accept' answers 202; 'fail' makes the collector drop every event connection. */
  events: 'accept' | 'fail';
};

/**
 * Runs before any page script when the exact hosted script is used. It pre-creates the official snippet stub so the
 * application's installPlausible() keeps it, and records the application's init options while adding only the
 * test-environment overrides (loopback host, webdriver flag, collector transport).
 */
function liveInitScript({ collector }: { collector: string }) {
  const w = window as unknown as Record<string, unknown>;
  w.__plausible = true;
  const stub = Object.assign(function (...args: unknown[]) { ((stub as unknown as { q: unknown[] }).q ||= []).push(args); }, {
    init(options?: Record<string, unknown>) {
      const declared = options && options.endpoint !== undefined ? String(options.endpoint) : '';
      (stub as unknown as { o: unknown }).o = Object.assign({}, options || {}, { captureOnLocalhost: true, endpoint: `${collector}&declared=${encodeURIComponent(declared)}` });
      w.__fscTrackerOptions = { autoCapturePageviews: options?.autoCapturePageviews, transformRequest: typeof options?.transformRequest, declaredEndpoint: declared };
    },
  });
  w.plausible = stub;
}

export class NetworkGuard {
  readonly unexpected: string[] = [];
  scriptRequests = 0;
  private analytics: AnalyticsMode | null = null;
  private readonly token = randomUUID();
  constructor(private readonly context: BrowserContext) {}

  private get collectorEndpoint() { return `${COLLECTOR_ORIGIN}/api/event?t=${this.token}&m=${this.analytics?.events ?? 'accept'}`; }

  /** Only analytics payload tests opt in; everywhere else any plausible.io request is an unexpected external attempt. */
  async enableAnalyticsFixture(mode: AnalyticsMode) {
    if (mode.tracker === 'live') liveTrackerBytes(); // fail clearly before any navigation if the saved script is missing or changed
    this.analytics = mode;
    if (mode.tracker === 'live') {
      await this.context.addInitScript({ content: transportTaggerSource(this.collectorEndpoint) });
      await this.context.addInitScript(liveInitScript, { collector: this.collectorEndpoint });
    }
  }

  /** Every HTTP attempt the collector received for this test, including browser-level retries of the same send. */
  get transportAttempts(): CapturedEvent[] {
    const path = process.env[COLLECTOR_ENV];
    if (!path || !existsSync(path)) throw new Error(`${COLLECTOR_ENV} is missing; release global setup did not start the analytics collector`);
    return readFileSync(path, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(entry => entry.token === this.token).map(entry => {
      let body: Record<string, unknown>;
      try { body = JSON.parse(entry.raw); } catch { body = { __unparseable: entry.raw }; }
      return { raw: entry.raw, body, at: entry.at, declared: entry.declared, contentType: entry.contentType, seq: entry.seq };
    });
  }

  /** Logical sends: one entry per tracker fetch call (sequence-tagged); an untagged attempt is kept and fails hygiene. */
  get events(): CapturedEvent[] {
    const seen = new Set<string>();
    return this.transportAttempts.filter(event => {
      if (!event.seq) return true;
      if (seen.has(event.seq)) return false;
      seen.add(event.seq);
      return true;
    });
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    const parsed = new URL(url);
    if (SERVER_ORIGINS.has(parsed.origin)) return route.continue();
    if (this.analytics && parsed.origin === COLLECTOR_ORIGIN && parsed.searchParams.get('t') === this.token) return route.continue();
    if (this.analytics && url === FIXTURE_SCRIPT_URL) {
      this.scriptRequests++;
      if (this.analytics.script === 'fail') return route.abort('failed');
      if (this.analytics.script === 'throw') return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: 'throw new Error("FSC synthetic tracker failure");' });
      const body = this.analytics.tracker === 'live' ? liveTrackerBytes() : trackerAdapterSource(this.collectorEndpoint);
      return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body });
    }
    // Neither tracker fixture targets the real endpoint; a request here means something bypassed the fixture transport.
    if (url.startsWith(EVENT_ENDPOINT)) { this.unexpected.push(`${request.method()} ${url} (real event endpoint)`); return route.abort('failed'); }
    this.unexpected.push(`${request.method()} ${url}`);
    return route.abort('failed');
  }
}

function sinkholeLines(): string[] {
  const path = process.env[SINKHOLE_ENV];
  if (!path || !existsSync(path)) throw new Error(`${SINKHOLE_ENV} is missing; release global setup did not start the sinkhole proxy`);
  return readFileSync(path, 'utf8').split('\n').filter(Boolean);
}

export const test = base.extend<{ guard: NetworkGuard }>({
  guard: [async ({ context }, use) => {
    const guard = new NetworkGuard(context);
    const before = sinkholeLines().length;
    await context.route('**/*', async route => {
      try { await guard.handle(route); }
      catch (error) {
        guard.unexpected.push(`guard error for ${route.request().url()}: ${error instanceof Error ? error.message : String(error)}`);
        await route.abort('failed').catch(() => undefined);
      }
    });
    await use(guard);
    expect(guard.unexpected, 'Browser attempted a non-loopback destination that is not an intercepted fixture').toEqual([]);
    expect(sinkholeLines().slice(before), 'A browser connection escaped route interception and reached the dead-end proxy').toEqual([]);
  }, { auto: true }],
});
export { expect };
