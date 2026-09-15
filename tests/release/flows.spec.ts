// Cross-browser assessment and emergency journeys against the compiled local preview (synthetic receipt sink).
// Servers (tests/release/support/global-setup.ts): the local preview on 3161 is started by scripts/local-server.mjs
// --compiled. The known-failure server on 3162 is test-owned (support/prebuilt-local-failure-server.mjs): it serves the
// build the launcher just produced, read-only, with the launcher's local-preview isolation environment plus
// FSC_LOCAL_FAILURE=1 (read at request time). A second launcher would rebuild the shared .fsc-local/build underneath the
// running preview server. It is started only after the preview server is ready; a contract test verifies no build was overwritten.
import { existsSync } from 'node:fs';
import type { Page, Request } from '@playwright/test';
import { test, expect } from './support/guard';
import { ORIGINS } from './support/constants';
import { expectTruthfulConfirmation, expectValuesPreserved, fillLead, form, readReceipt, receiptPath, submitButton, syntheticLead } from './support/form';

test.use({ baseURL: ORIGINS.local });

const leadPosts = (page: Page, origin = ORIGINS.local) => (request: Request) => request.url() === `${origin}/api/leads` && request.method() === 'POST';
const unique = (label: string, browserName: string) => `${label}-${browserName}-${Date.now().toString(36)}`;

async function expectPresentation(page: Page, mode: 'emergency' | 'routine') {
  const f = form(page);
  if (mode === 'emergency') {
    await expect(page.locator('h1')).toHaveText('Request emergency service.');
    await expect(f.locator('[name="urgency"]')).toHaveValue('Emergency');
    await expect(submitButton(page)).toHaveText(/^Send emergency request/);
    await expect(page.locator('.fsc-contact-intro a[href^="tel:"]')).toBeVisible();
  } else {
    await expect(page.locator('h1')).toHaveText('Tell us about your property.');
    await expect(f.locator('[name="urgency"]')).toHaveValue('Not specified');
    await expect(submitButton(page)).toHaveText(/^Request a Free Property Assessment/);
  }
}

test('home to contact assessment succeeds with a real local receipt and truthful confirmation', async ({ page, browserName }) => {
  const lead = syntheticLead(unique('home', browserName));
  await page.goto('/');
  await page.locator('main a.fsc-main-cta[href="/contact"]').click();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact`);
  await expectPresentation(page, 'routine');
  await fillLead(page, lead);
  const responsePromise = page.waitForResponse(response => leadPosts(page)(response.request()));
  await submitButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const sent = response.request().postDataJSON() as Record<string, string>;
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.requestId).toBe(sent.requestId.toLowerCase());
  await expectTruthfulConfirmation(page, body.requestId);
  await expect(page.getByRole('status')).toBeFocused();
  await expect(page.getByRole('status')).toContainText('Your test request was saved locally. No message was sent to FSC.');
  const receipt = readReceipt(body.requestId);
  expect(receipt.payload).toMatchObject({ fullName: lead.fullName, email: lead.email, phone: lead.phone, propertyType: lead.propertyType, service: lead.service, city: lead.city, urgency: 'Not specified' });
  // Local preview must never load analytics (also enforced by the network guard for plausible.io).
  await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
  expect(await page.evaluate(() => typeof (window as unknown as { plausible?: unknown }).plausible)).toBe('undefined');
});

test('client validation blocks the request, focuses the error summary and links every invalid field', async ({ page }) => {
  const posts: string[] = [];
  page.on('request', request => { if (leadPosts(page)(request)) posts.push(request.url()); });
  await page.goto('/contact');
  const f = form(page);
  await f.locator('[name="fullName"]').fill('Zyx Valid Name');
  await f.locator('[name="email"]').fill('not-an-email');
  await submitButton(page).click();
  const alert = f.getByRole('alert');
  await expect(alert).toBeFocused();
  await expect(alert).toContainText('Please review the highlighted fields. Your other details are still here.');
  const invalid = ['email', 'phone', 'propertyType', 'city', 'service'];
  const hrefs = await alert.locator('li a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  const expected: string[] = [];
  for (const name of invalid) {
    const control = f.locator(`[name="${name}"]`);
    await expect(control, `${name} must be marked invalid`).toHaveAttribute('aria-invalid', 'true');
    const id = await control.getAttribute('id');
    const describedBy = await control.getAttribute('aria-describedby');
    expect(describedBy, `${name} must reference its error text`).toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).not.toHaveText('');
    expected.push(`#${id}`);
  }
  expect([...hrefs].sort()).toEqual([...expected].sort());
  await expect(f.locator('[name="fullName"]')).not.toHaveAttribute('aria-invalid', 'true');
  await expect(f.locator('[name="fullName"]')).toHaveValue('Zyx Valid Name');
  await expect(f.locator('[name="email"]')).toHaveValue('not-an-email');
  // Keyboard activation of a summary link moves focus to that field.
  const emailId = await f.locator('[name="email"]').getAttribute('id');
  await alert.locator(`li a[href="#${emailId}"]`).focus();
  await page.keyboard.press('Enter');
  await expect(f.locator('[name="email"]')).toBeFocused();
  await alert.locator(`li a[href="#${await f.locator('[name="service"]').getAttribute('id')}"]`).click();
  await expect(f.locator('[name="service"]')).toBeFocused();
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(posts, 'invalid input must not send a request').toEqual([]);
});

test('known delivery failure shows the safe failure message, keeps values and writes no receipt', async ({ page, browserName }) => {
  const lead = syntheticLead(unique('failure', browserName));
  await page.goto(`${ORIGINS.localFailure}/contact`);
  await fillLead(page, lead);
  const responsePromise = page.waitForResponse(response => leadPosts(page, ORIGINS.localFailure)(response.request()));
  await submitButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, code: 'DELIVERY_FAILED' });
  const alert = form(page).getByRole('alert');
  await expect(alert).toContainText('Your request could not be delivered. Please contact us directly or try again shortly.');
  await expect(alert.locator('a[href^="tel:"]')).toBeVisible();
  await expect(alert).toBeFocused();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Request received')).toHaveCount(0);
  await expectValuesPreserved(page, lead);
  await expect(submitButton(page)).toBeEnabled();
  const sent = response.request().postDataJSON() as Record<string, string>;
  expect(existsSync(receiptPath(sent.requestId)), 'a known failure must not produce a receipt').toBe(false);
});

for (const failure of ['504 RECEIPT_UNKNOWN', 'lost connection'] as const) {
  test(`unknown receipt (${failure}) allows one explicit retry with the same request ID and body`, async ({ page, browserName }) => {
    const lead = syntheticLead(unique(failure.startsWith('504') ? 'r504' : 'rlost', browserName));
    const bodies: Record<string, string>[] = [];
    await page.route(`${ORIGINS.local}/api/leads`, async route => {
      bodies.push(route.request().postDataJSON());
      if (bodies.length > 1) return route.continue();
      if (failure === 'lost connection') return route.abort('failed');
      return route.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'RECEIPT_UNKNOWN', error: 'We could not confirm receipt. Keep your details and retry this same request.' }) });
    });
    await page.goto('/contact');
    await fillLead(page, lead);
    await submitButton(page).click();
    const alert = form(page).getByRole('alert');
    await expect(alert).toContainText('We could not confirm whether your request was received. Retry the same request below, or call us to check. Your details have been kept.');
    await expect(page.getByRole('status')).toHaveCount(0);
    await expectValuesPreserved(page, lead);
    await expect(submitButton(page)).toHaveText(/^Retry request/);
    await page.waitForTimeout(1500);
    expect(bodies, 'no automatic resend after an unknown receipt').toHaveLength(1);
    const responsePromise = page.waitForResponse(response => leadPosts(page)(response.request()) && response.status() === 200);
    await submitButton(page).click();
    const response = await responsePromise;
    expect(bodies).toHaveLength(2);
    expect(bodies[1].requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(bodies[1]).toEqual(bodies[0]);
    const body = await response.json();
    expect(body.requestId).toBe(bodies[0].requestId.toLowerCase());
    await expectTruthfulConfirmation(page, body.requestId);
    expect(readReceipt(body.requestId).payload).toMatchObject({ fullName: lead.fullName, email: lead.email });
  });
}

test('emergency direct entry keeps heading, urgency, submit label, payload and confirmation consistent', async ({ page, browserName }) => {
  const lead = syntheticLead(unique('emergency', browserName));
  await page.goto('/contact?urgency=emergency');
  await expectPresentation(page, 'emergency');
  await expect(page.locator('.fsc-kicker').first()).toHaveText('24/7 emergency service');
  await fillLead(page, lead);
  const responsePromise = page.waitForResponse(response => leadPosts(page)(response.request()));
  await submitButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect((response.request().postDataJSON() as Record<string, string>).urgency).toBe('Emergency');
  const body = await response.json();
  await expectTruthfulConfirmation(page, body.requestId);
  await expect(page.locator('h1')).toHaveText('Request emergency service.');
  expect(readReceipt(body.requestId).payload.urgency).toBe('Emergency');
});

test('emergency context agrees through client navigation, back/forward and an explicit switch to routine', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer a[href="/contact?urgency=emergency"]').click();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact?urgency=emergency`);
  await expectPresentation(page, 'emergency');
  await page.getByRole('link', { name: 'Return to a routine assessment' }).click();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact`);
  await expectPresentation(page, 'routine');
  const f = form(page);
  await f.locator('[name="fullName"]').fill('Zyx History Manager');
  await f.locator('[name="email"]').fill('fsc-history-release@example.invalid');
  await page.getByRole('link', { name: 'Use the emergency contact form' }).click();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact?urgency=emergency`);
  await expectPresentation(page, 'emergency');
  await expect(f.locator('[name="fullName"]')).toHaveValue('Zyx History Manager');
  await page.goBack();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact`);
  await expectPresentation(page, 'routine');
  await expect(f.locator('[name="fullName"]')).toHaveValue('Zyx History Manager');
  await page.goForward();
  await expect(page).toHaveURL(`${ORIGINS.local}/contact?urgency=emergency`);
  await expectPresentation(page, 'emergency');
  await expect(f.locator('[name="email"]')).toHaveValue('fsc-history-release@example.invalid');
  // The submitted payload must agree with what is displayed after history traversal.
  const bodies: Record<string, string>[] = [];
  await page.route(`${ORIGINS.local}/api/leads`, async route => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'DELIVERY_FAILED' }) });
  });
  await f.locator('[name="phone"]').fill('2025550166');
  await f.locator('[name="propertyType"]').selectOption('Storage facility');
  await f.locator('[name="service"]').selectOption('Repair / service');
  await f.locator('[name="city"]').fill('Tampa');
  await submitButton(page).click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ urgency: 'Emergency', fullName: 'Zyx History Manager', email: 'fsc-history-release@example.invalid' });
  await expect(page.locator('h1')).toHaveText('Request emergency service.');
});

test('keyboard-only completion submits the assessment with no hidden focus', async ({ page, browserName }) => {
  const lead = syntheticLead(unique('keyboard', browserName));
  await page.goto('/contact');
  const obscured: string[] = [];
  const f = form(page);
  async function tabTo(name: string) {
    const target = name === 'submit' ? submitButton(page) : f.locator(`[name="${name}"]`);
    for (let step = 0; step < 80; step++) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return { label: 'body', hidden: false };
        const rect = element.getBoundingClientRect();
        const x = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1);
        const y = Math.min(Math.max(rect.top + Math.min(rect.height / 2, 10), 0), window.innerHeight - 1);
        const hit = document.elementFromPoint(x, y);
        const offscreen = rect.bottom <= 0 || rect.top >= window.innerHeight;
        const hidden = offscreen || !(hit && (hit === element || element.contains(hit) || hit.contains(element)));
        return { label: `${element.tagName.toLowerCase()}${element.getAttribute('name') ? `[name=${element.getAttribute('name')}]` : ''} "${(element.textContent || '').trim().slice(0, 30)}"`, hidden };
      });
      if (state.hidden) obscured.push(state.label);
      if (await target.evaluate(element => element === document.activeElement)) return;
    }
    throw new Error(`Tab never reached ${name}`);
  }
  await tabTo('fullName'); await page.keyboard.type(lead.fullName);
  await tabTo('email'); await page.keyboard.type(lead.email);
  await tabTo('phone'); await page.keyboard.type(lead.phone);
  await tabTo('propertyType'); await page.keyboard.type('HOA');
  await expect(f.locator('[name="propertyType"]')).toHaveValue(lead.propertyType);
  await tabTo('city'); await page.keyboard.type(lead.city);
  await tabTo('service'); await page.keyboard.type('Preventive');
  await expect(f.locator('[name="service"]')).toHaveValue(lead.service);
  await tabTo('submit');
  const responsePromise = page.waitForResponse(response => leadPosts(page)(response.request()));
  await page.keyboard.press('Enter');
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const body = await response.json();
  await expectTruthfulConfirmation(page, body.requestId);
  await expect(page.getByRole('status')).toBeFocused();
  expect(readReceipt(body.requestId).payload).toMatchObject({ fullName: lead.fullName, email: lead.email, phone: lead.phone, propertyType: lead.propertyType, service: lead.service, city: lead.city });
  expect(obscured, 'every keyboard focus stop must be visible and not covered').toEqual([]);
});
