import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { routes } from '../fixtures/routes';
import { validLead } from '../fixtures/lead';

let blockedExternal = false;
test.beforeEach(async ({ context, baseURL }) => {
  blockedExternal = false;
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === baseURL || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    blockedExternal = true;
    return route.abort('blockedbyclient');
  });
});
test.afterEach(async ({ page }) => {
  expect(blockedExternal, 'No browser request may attempt an external destination').toBe(false);
  await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
});
for (const path of routes) {
  test(`public route renders: ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).not.toHaveText('');
    await expect(page.locator('main')).toBeVisible();
    const canvas = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number));
    expect(canvas, 'Every preserved route must retain the light page canvas').toBeDefined();
    expect(Math.min(...canvas!)).toBeGreaterThan(200);
  });
}
test('homepage navigates to contact and submits through real local endpoint', async ({ page }) => {
  await page.goto('/');
  const contactLink = page.locator('a[href="/contact"]').filter({ visible: true }).first();
  await contactLink.click();
  await expect(page).toHaveURL(/\/contact/);
  const form = page.getByRole('form', { name: 'Site assessment request form' });
  for (const name of ['fullName', 'email', 'phone'] as const) await form.locator(`[name="${name}"]`).fill(validLead[name]);
  for (const name of ['propertyType', 'service'] as const) await form.locator(`[name="${name}"]`).selectOption(validLead[name]);
  await form.locator('[name="city"]').fill(validLead.city);
  const response = page.waitForResponse(r => r.url().endsWith('/api/leads') && r.request().method() === 'POST');
  await form.getByRole('button', { name: /submit|request|assessment/i }).click();
  const received = await response;
  expect(received.status()).toBe(200);
  const body = await received.json();
  expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByRole('status')).toContainText('Request received');
  await expect(page.getByRole('status')).toBeFocused();
  const receipt = JSON.parse(await readFile(`.fsc-local/receipts/${body.requestId}.json`, 'utf8'));
  expect(receipt.payload.email).toBe(validLead.email);
  const log = await readFile(process.env.FSC_SERVER_LOG || '.fsc-test/server.log', 'utf8');
  expect(log).not.toContain(validLead.email);
  expect(log).not.toContain(validLead.phone);
});
test('empty assessment displays server validation instead of confirmation', async ({ page }) => {
  await page.goto('/contact');
  const form = page.getByRole('form', { name: 'Site assessment request form' });
  await form.getByRole('button', { name: /submit|request|assessment/i }).click();
  await expect(form.getByRole('alert')).toContainText(/attention|review/i);
  await expect(form.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toHaveCount(0);
});
