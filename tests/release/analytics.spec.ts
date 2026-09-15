// Analytics payload capture against the exact hosted Plausible script (all engines), plus the no-analytics control.
import { test, expect } from './support/guard';
import { ORIGINS } from './support/constants';
import { form, submitButton } from './support/form';
import { blockTelNavigation, defineAnalyticsSuite } from './support/analytics-suite';

defineAnalyticsSuite('live');

const SETTLE_MS = 1000;
test('no analytics script or events in local preview or in the analytics-disabled measurement build', async ({ page, guard }) => {
  // Capture is armed (npm build, no init stub) so a wrongly loaded script or event would be served and recorded, not missed.
  await guard.enableAnalyticsFixture({ tracker: 'npm', script: 'official', events: 'accept' });
  await blockTelNavigation(page);
  for (const base of [ORIGINS.local, ORIGINS.measure]) {
    await page.goto(`${base}/`);
    await page.locator('header .fsc-emergency-strip a[href^="tel:"]').click();
    await page.locator('main a.fsc-main-cta[href="/contact"]').click();
    await expect(page).toHaveURL(`${base}/contact`);
    await form(page).locator('[name="fullName"]').fill('Zyx No Analytics');
    await submitButton(page).click();
    await expect(form(page).getByRole('alert')).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);
    await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
    expect(await page.evaluate(() => typeof (window as unknown as { plausible?: unknown }).plausible), base).toBe('undefined');
  }
  expect(guard.scriptRequests).toBe(0);
  expect(guard.events).toEqual([]);
});
