import { defineConfig } from '@playwright/test';
const port = Number(process.env.FSC_TEST_PORT || 3100);
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 60000,
  reporter: [['list'], ['json', { outputFile: process.env.FSC_E2E_REPORT || '.fsc-test/e2e.json' }]],
  outputDir: '.fsc-test/browser',
  globalSetup: './tests/e2e/server-setup.ts',
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium', trace: 'retain-on-failure', serviceWorkers: 'block' },
});
