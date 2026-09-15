import { defineConfig } from '@playwright/test';
import { PORTS } from './tests/release/support/constants';

// Defence in depth for browsers: every context route-aborts non-loopback requests (tests/release/support/guard.ts);
// anything that escapes interception goes to a local dead-end proxy that records and drops it.
const proxy = { server: `http://127.0.0.1:${PORTS.sinkhole}`, bypass: '127.0.0.1,localhost' };
const chromiumArgs = ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'];
// Playwright's Firefox otherwise checks media-plugin/system add-on updates (aus5.mozilla.org) about 30 s after start; the
// dead-end proxy recorded those attempts. Disabling the update checks removes browser-internal traffic, not page behavior.
const firefoxUserPrefs = {
  'app.update.disabledForTesting': true, 'app.update.auto': false, 'app.update.enabled': false, 'app.update.checkInstallTime': false,
  'app.update.service.enabled': false, 'app.update.staging.enabled': false, 'app.update.background.scheduling.enabled': false,
  'media.gmp-manager.updateEnabled': false, 'media.gmp-gmpopenh264.autoupdate': false, 'media.gmp-widevinecdm.autoupdate': false,
  'media.gmp-gmpopenh264.enabled': false, 'media.gmp-widevinecdm.enabled': false,
  'extensions.systemAddon.update.enabled': false, 'extensions.update.enabled': false,
};

export default defineConfig({
  testDir: './tests/release',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['json', { outputFile: process.env.FSC_RELEASE_REPORT || '.fsc-test/release.json' }]],
  outputDir: '.fsc-test/release-browser',
  globalSetup: './tests/release/support/global-setup.ts',
  use: { trace: 'retain-on-failure', serviceWorkers: 'block' },
  // Engine-independent server-mode checks (contract.spec.ts) and the npm-core tracker variant (analytics-npm.spec.ts) run
  // in the chromium project only; the exact hosted tracker script (analytics.spec.ts) runs in all three engines.
  projects: [
    // Lighthouse first while no other browser load competes with the measurement server.
    { name: 'lighthouse', testMatch: /lighthouse\.spec\.ts$/, timeout: 20 * 60000, use: { browserName: 'chromium' } },
    { name: 'chromium', testIgnore: /lighthouse\.spec\.ts$/, use: { browserName: 'chromium', launchOptions: { args: chromiumArgs, proxy } } },
    { name: 'firefox', testIgnore: /(lighthouse|contract|analytics-npm)\.spec\.ts$/, use: { browserName: 'firefox', launchOptions: { proxy, firefoxUserPrefs } } },
    { name: 'webkit', testIgnore: /(lighthouse|contract|analytics-npm)\.spec\.ts$/, use: { browserName: 'webkit', launchOptions: { proxy } } },
  ],
});
