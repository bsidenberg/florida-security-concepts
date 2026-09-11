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
  });
}
test('homepage navigates to contact and submits through real local endpoint', async ({ page }) => {
  await page.goto('/');
  const contactLink = page.locator('a[href="/contact"]').filter({ visible: true }).first();
  await contactLink.click();
  await expect(page).toHaveURL(/\/contact/);
  const form = page.getByRole('form', { name: 'Site assessment request form' });
  for (const name of ['fullName', 'email', 'phone'] as const) await form.locator(`[name="${name}"]`).fill(validLead[name]);
  for (const name of ['propertyType', 'service', 'city', 'urgency'] as const) await form.locator(`[name="${name}"]`).selectOption(validLead[name]);
  const response = page.waitForResponse(r => r.url().endsWith('/api/leads') && r.request().method() === 'POST');
  await form.getByRole('button', { name: /submit|request|assessment/i }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByRole('status')).toContainText('Request received');
  await expect.poll(async () => readFile(process.env.FSC_SERVER_LOG || '.fsc-test/server.log', 'utf8')).toContain(validLead.email);
  const log = await readFile(process.env.FSC_SERVER_LOG || '.fsc-test/server.log', 'utf8');
  expect(log).toContain('[lead-delivery:console] new lead');
});
test('empty assessment displays server validation instead of confirmation', async ({ page }) => {
  await page.goto('/contact');
  const form = page.getByRole('form', { name: 'Site assessment request form' });
  await form.getByRole('button', { name: /submit|request|assessment/i }).click();
  await expect(form.getByRole('alert')).toContainText(/attention|review/i);
  await expect(form.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toHaveCount(0);
});
