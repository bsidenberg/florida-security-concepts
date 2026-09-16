// Lighthouse mobile (default config) x3 per representative route against the production-equivalent measurement build.
// Chromium is Playwright's bundled headless Chromium (chromium.launch default, chrome-headless-shell), driven by
// Lighthouse over a loopback CDP port. Every non-loopback hostname is unresolvable and any non-loopback connection is
// sent to the release dead-end proxy. The full Chromium build was not used: under the same flags it attempted Google
// background services (accounts.google.com, update.googleapis.com, android.clients.google.com), which would make the
// zero-external-attempt assertion impossible; a scratch comparison on / scored within 3 points on Performance and
// identically on the other categories.
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { test, expect } from './support/guard';
import { ORIGINS, PORTS, REPRESENTATIVE } from './support/constants';
import { currentEvidenceDir, currentRunId } from './support/evidence';

// SPEC §7 release targets (median of three mobile runs). Not configurable here by design.
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 } as const;
type Category = keyof typeof TARGETS;
const CATEGORIES = Object.keys(TARGETS) as Category[];
const RUNS = 3;
const PAGES = [
  ['home', REPRESENTATIVE.home], ['contact', REPRESENTATIVE.contact], ['services', REPRESENTATIVE.services],
  ['industry', REPRESENTATIVE.industry], ['area', REPRESENTATIVE.area], ['article', REPRESENTATIVE.article],
] as const;
const METRICS = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];

type Lhr = {
  lighthouseVersion: string; requestedUrl: string; finalDisplayedUrl?: string; fetchTime: string; runtimeError?: { code: string; message: string }; runWarnings: string[];
  environment: { hostUserAgent: string; benchmarkIndex: number };
  configSettings: { formFactor: string; throttlingMethod: string; throttling: unknown; screenEmulation: unknown; emulatedUserAgent: unknown };
  categories: Record<string, { score: number | null; auditRefs: { id: string; weight: number }[] }>;
  audits: Record<string, { id: string; title: string; score: number | null; displayValue?: string; numericValue?: number; details?: { items?: { url?: string }[] } }>;
};

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const scoresOf = (lhr: Lhr) => Object.fromEntries(CATEGORIES.map(c => [c, lhr.categories[c]?.score == null ? null : Math.round(lhr.categories[c].score! * 1000) / 10])) as Record<Category, number | null>;
function failingAudits(lhr: Lhr, category: Category) {
  return lhr.categories[category].auditRefs
    .filter(ref => ref.weight > 0 && lhr.audits[ref.id]?.score !== null && (lhr.audits[ref.id]?.score ?? 1) < 1)
    .map(ref => ({ id: ref.id, title: lhr.audits[ref.id].title, score: lhr.audits[ref.id].score, weight: ref.weight, displayValue: lhr.audits[ref.id].displayValue ?? null, impact: ref.weight * (1 - (lhr.audits[ref.id].score ?? 1)) }))
    .sort((a, b) => b.impact - a.impact).slice(0, 6);
}
function sinkholeCount() { return readFileSync(process.env.FSC_RELEASE_SINKHOLE_LOG!, 'utf8').split('\n').filter(Boolean).length; }

test('Lighthouse mobile medians meet the SPEC release targets on six representative routes', async () => {
  const require = createRequire(__filename);
  const lighthousePkg = require.resolve('lighthouse/package.json');
  const lighthouseVersion = JSON.parse(readFileSync(lighthousePkg, 'utf8')).version as string;
  const { default: lighthouse } = await import('lighthouse');

  const evidence = currentEvidenceDir();
  const rawDir = join(evidence, 'lighthouse');
  mkdirSync(rawDir, { recursive: true });
  const sinkBefore = sinkholeCount();
  const chromeFlags = ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost', `--remote-debugging-port=${PORTS.lighthouseCdp}`];
  const proxy = { server: `http://127.0.0.1:${PORTS.sinkhole}`, bypass: '127.0.0.1,localhost' };
  let browserVersion = '';

  const results: Record<string, { run: number; file: string; lhr: Lhr }[]> = {};
  for (let run = 1; run <= RUNS; run++) {
    for (const [id, path] of PAGES) {
      const url = `${ORIGINS.measure}${path}`;
      const browser = await chromium.launch({ args: chromeFlags, proxy });
      browserVersion = browser.version();
      try {
        const outcome = await lighthouse(url, { port: PORTS.lighthouseCdp, output: 'json', logLevel: 'error', onlyCategories: [...CATEGORIES] });
        expect(outcome, `Lighthouse returned no result for ${url}`).toBeTruthy();
        const lhr = outcome!.lhr as unknown as Lhr;
        const file = join(rawDir, `${id}-run${run}.json`);
        writeFileSync(file, JSON.stringify(lhr, null, 2));
        (results[id] ||= []).push({ run, file, lhr });
      } finally {
        await browser.close();
      }
    }
  }

  const sample = results.home[0].lhr;
  const buildIdPath = resolve('.next-measure/BUILD_ID');
  const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8', windowsHide: true }).stdout?.trim() ?? '';
  const summary = {
    session: 'S-006', runId: currentRunId(), generatedAt: new Date().toISOString(),
    tools: { lighthouse: sample.lighthouseVersion, lighthousePackage: lighthouseVersion, playwright: JSON.parse(readFileSync(require.resolve('@playwright/test/package.json'), 'utf8')).version, node: process.version },
    chromium: { build: 'Playwright bundled chromium-headless-shell via chromium.launch() (headless default); Playwright default Chromium switches plus the flags below', browserVersion, proxy, hostUserAgent: sample.environment.hostUserAgent, version: /Chrome\/([\d.]+)/.exec(sample.environment.hostUserAgent)?.[1] ?? null, benchmarkIndex: sample.environment.benchmarkIndex, flags: chromeFlags },
    preset: 'Lighthouse default configuration (mobile form factor, simulated throttling); categories performance, accessibility, best-practices, seo',
    settings: { formFactor: sample.configSettings.formFactor, throttlingMethod: sample.configSettings.throttlingMethod, throttling: sample.configSettings.throttling, screenEmulation: sample.configSettings.screenEmulation, emulatedUserAgent: sample.configSettings.emulatedUserAgent },
    build: { server: 'scripts/local-server.mjs --compiled --measure (FSC_LOCAL_PREVIEW and LEAD_DELIVERY_MODE blank, analytics off)', origin: ORIGINS.measure, buildId: existsSync(buildIdPath) ? readFileSync(buildIdPath, 'utf8').trim() : null, revision: git(['rev-parse', 'HEAD']), dirtyFiles: git(['status', '--short']).split('\n').filter(Boolean).length },
    targets: TARGETS,
    caveats: [
      'Loopback HTTP/1.1 from a local Next.js production server on the verification workstation; no CDN, TLS, HTTP/2 or edge caching as on Vercel.',
      'Performance uses Lighthouse simulated throttling; lab scores are not field Core Web Vitals.',
      'The measurement build has analytics disabled; production additionally loads the Plausible pa- script.',
      'Browser is the Playwright-bundled chrome-headless-shell (Chromium 153 old-headless build), chosen because full Chromium attempted Google background services; scores can differ slightly from full Chrome.',
    ],
    pages: PAGES.map(([id, path]) => {
      const runs = results[id].map(({ run, file, lhr }) => ({ run, file: relative(evidence, file).replaceAll('\\', '/'), fetchTime: lhr.fetchTime, runWarnings: lhr.runWarnings, runtimeError: lhr.runtimeError ?? null, scores: scoresOf(lhr), metrics: Object.fromEntries(METRICS.map(m => [m, lhr.audits[m]?.displayValue ?? null])) }));
      const medians = Object.fromEntries(CATEGORIES.map(c => [c, median(runs.map(r => r.scores[c] ?? -1))])) as Record<Category, number>;
      const medianRun = (c: Category) => results[id].find(r => (scoresOf(r.lhr)[c] ?? -1) === medians[c])!.lhr;
      const belowTarget = CATEGORIES.filter(c => medians[c] < TARGETS[c]).map(c => ({ category: c, median: medians[c], target: TARGETS[c], topFailingAuditsInMedianRun: failingAudits(medianRun(c), c) }));
      return { id, path, url: `${ORIGINS.measure}${path}`, runs, medians, belowTarget };
    }),
  };
  const summaryPath = join(evidence, 'S-006-lighthouse-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Evidence manifest: re-read from disk and recompute every score and median from the raw reports.
  expect(existsSync(summaryPath), 'Lighthouse summary manifest must exist').toBe(true);
  const manifest = JSON.parse(readFileSync(summaryPath, 'utf8')) as typeof summary;
  expect(manifest.pages.map(p => p.path)).toEqual(PAGES.map(([, path]) => path));
  expect(manifest.settings.formFactor, 'mobile preset').toBe('mobile');
  for (const page of manifest.pages) {
    expect(page.runs, `${page.path} must have ${RUNS} runs`).toHaveLength(RUNS);
    const fromDisk = page.runs.map(run => {
      const lhr = JSON.parse(readFileSync(join(evidence, run.file), 'utf8')) as Lhr;
      expect(lhr.runtimeError, `${run.file} runtime error`).toBeUndefined();
      expect(new URL(lhr.requestedUrl).pathname).toBe(page.path);
      const external = (lhr.audits['network-requests']?.details?.items ?? []).map(item => item.url ?? '').filter(u => !u.startsWith(`${ORIGINS.measure}/`) && !u.startsWith('data:') && !u.startsWith('blob:'));
      expect(external, `${run.file}: Lighthouse Chrome requested non-loopback URLs`).toEqual([]);
      expect(scoresOf(lhr)).toEqual(run.scores);
      return scoresOf(lhr);
    });
    for (const category of CATEGORIES) expect(median(fromDisk.map(s => s[category] ?? -1))).toBe(page.medians[category]);
  }
  expect(sinkholeCount() - sinkBefore, 'Lighthouse Chrome made a non-loopback connection').toBe(0);
  test.info().annotations.push({ type: 'lighthouse-summary', description: relative(process.cwd(), summaryPath) });
  test.info().annotations.push({ type: 'lighthouse-medians', description: JSON.stringify(manifest.pages.map(p => ({ path: p.path, ...p.medians }))) });

  for (const page of manifest.pages) {
    for (const category of CATEGORIES) {
      const miss = page.belowTarget.find(b => b.category === category);
      expect.soft(page.medians[category], `${page.path} ${category} median ${page.medians[category]} < ${TARGETS[category]}; top failing audits: ${JSON.stringify(miss?.topFailingAuditsInMedianRun ?? [])}`).toBeGreaterThanOrEqual(TARGETS[category]);
    }
  }
});
