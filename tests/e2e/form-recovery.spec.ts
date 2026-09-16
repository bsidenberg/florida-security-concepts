import { test, expect } from '@playwright/test';
import { validLead } from '../fixtures/lead';
let blocked = false;
test.beforeEach(async ({ context, baseURL }) => {
  blocked = false;
  await context.route('**/*', route => { if (new URL(route.request().url()).origin === baseURL) return route.continue(); blocked = true; return route.abort(); });
});
test.afterEach(async () => expect(blocked).toBe(false));
test('simulated ambiguous response keeps values and logical ID for explicit retry', async ({ page }) => {
  const bodies: Record<string, string>[] = [];
  await page.route('**/api/leads', async route => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'RECEIPT_UNKNOWN', error: 'We could not confirm receipt. Retry this same request.' }) });
  });
  await page.goto('/contact');
  const form = page.getByRole('form', { name: 'Site assessment request form' });
  for (const field of ['fullName', 'phone', 'email'] as const) await form.locator(`[name="${field}"]`).fill(validLead[field]);
  for (const field of ['propertyType', 'service', 'city'] as const) {
    const control = form.locator(`[name="${field}"]`);
    if (await control.evaluate(e => e.tagName === 'SELECT')) await control.selectOption(validLead[field]); else await control.fill(validLead[field]);
  }
  const submit = form.getByRole('button', { name: /request|assessment|retry|submit/i }).first();
  await submit.click(); await expect(form.getByRole('alert')).toContainText('could not confirm');
  await expect(form.locator('[name="email"]')).toHaveValue(validLead.email);
  await submit.click(); await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[0].requestId).toBe(bodies[1].requestId);
  await form.locator('[name="fullName"]').fill('FSC Edited Manager');
  await submit.click(); await expect.poll(() => bodies.length).toBe(3);
  expect(bodies[2].requestId).not.toBe(bodies[1].requestId);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(validLead.email);
  expect(page.url()).not.toContain(validLead.email);
});
for (const status of [503, 429]) test(`simulated ${status} retains assessment input`, async ({ page }) => {
  await page.route('**/api/leads', route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, code: status === 429 ? 'RATE_LIMIT' : 'DELIVERY_FAILED' }) }));
  await page.goto('/contact'); const form = page.getByRole('form', { name: 'Site assessment request form' });
  for (const field of ['fullName', 'phone', 'email', 'city'] as const) await form.locator(`[name="${field}"]`).fill(validLead[field]);
  for (const field of ['propertyType', 'service'] as const) await form.locator(`[name="${field}"]`).selectOption(validLead[field]);
  await form.getByRole('button', { name: /request|assessment|submit/i }).first().click();
  await expect(form.getByRole('alert')).toBeVisible();
  for (const field of ['fullName', 'phone', 'email', 'city'] as const) await expect(form.locator(`[name="${field}"]`)).toHaveValue(validLead[field]);
});
test('two rapid clicks submit one pending request', async ({ page }) => {
  let count = 0;
  await page.route('**/api/leads', async route => { count++; await new Promise(r => setTimeout(r, 250)); await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Synthetic unavailable' }) }); });
  await page.goto('/contact'); const form = page.getByRole('form', { name: 'Site assessment request form' });
  for (const field of ['fullName', 'phone', 'email'] as const) await form.locator(`[name="${field}"]`).fill(validLead[field]);
  for (const field of ['propertyType', 'service', 'city'] as const) { const control = form.locator(`[name="${field}"]`); if (await control.evaluate(e => e.tagName === 'SELECT')) await control.selectOption(validLead[field]); else await control.fill(validLead[field]); }
  await form.getByRole('button', { name: /request|assessment|submit/i }).first().evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(form.getByRole('alert')).toBeVisible(); expect(count).toBe(1);
});
