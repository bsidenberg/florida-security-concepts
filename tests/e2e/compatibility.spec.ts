import { test, expect } from '@playwright/test';
let blocked = false;
test.beforeEach(async ({ context, baseURL }) => { blocked = false; await context.route('**/*', route => { if (new URL(route.request().url()).origin === baseURL) return route.continue(); blocked = true; return route.abort(); }); });
test.afterEach(async () => expect(blocked).toBe(false));
for (const [query, value] of [['gate-automation', 'Gate automation'], ['emergency-service', 'Emergency repair']]) test(`legacy prefill ${query}`, async ({ page }) => {
  await page.goto(`/contact?service=${query}`); await expect(page.locator('[name="service"]')).toHaveValue(value);
  await expect(page.locator('[name="service"] option:checked')).toHaveText(value);
});
test('local receipts have no public listing or retrieval route', async ({ request }) => {
  for (const url of ['/api/receipts', '/.fsc-local/receipts', '/.fsc-local/receipts/18a85f2b-5ba9-43c2-a475-84ac0ac98310.json']) expect((await request.get(url)).status()).toBe(404);
  expect((await request.get('/api/leads')).status()).toBe(405);
});
test('reduced motion and simulated 200percent reflow preserve contact controls', async ({ page, context }) => {
  // Native 200% zoom halves the CSS viewport. CSS zoom alone does not update media queries.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 640, height: 450, deviceScaleFactor: 2, mobile: false });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/contact');
  await expect(page.locator('[name="fullName"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('[name="fullName"]').fill('FSC Zoom Test');
  await expect(page.locator('[name="fullName"]')).toHaveValue('FSC Zoom Test');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
});
