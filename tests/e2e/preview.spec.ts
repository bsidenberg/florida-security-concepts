import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
let blocked = false;
test.beforeEach(async ({ context, baseURL }) => {
  blocked = false;
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === baseURL) return route.continue();
    blocked = true; return route.abort();
  });
});
test.afterEach(async () => expect(blocked, 'No external browser requests').toBe(false));
for (const width of [320, 390, 768, 1024, 1440]) for (const path of ['/', '/contact']) {
  test(`${path} layout at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 }); await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: 'Florida Security Concepts home' })).toBeVisible();
    await expect(page.locator('header')).toContainText(/Florida Security\s*Concepts/);
    await expect(page.locator('header a[href^="tel:"]').first()).toBeVisible();
    if (width === 390 && path === '/') {
      await expect(page.locator('.fsc-main-cta')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('[aria-label="Service choices"]')).toBeInViewport({ ratio: 1 });
    }
    if (width === 390 || width === 1440) await page.screenshot({ path: `harness/evidence/S-002-${path === '/' ? 'home' : 'contact'}-${width}.png`, fullPage: true });
  });
}
for (const path of ['/', '/contact']) test(`${path} automated accessibility`, async ({ page }) => {
  await page.goto(path);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }))).toEqual([]);
});
test('emergency navigation preserves entered identity across history', async ({ page }) => {
  await page.goto('/contact');
  await page.locator('[name="fullName"]').fill('FSC Synthetic Manager');
  await page.locator('[name="email"]').fill('fsc-history@example.invalid');
  await page.locator('a[href*="urgency=emergency"]').first().click();
  await expect(page.locator('[name="urgency"]')).toHaveValue('Emergency');
  await expect(page.locator('[name="fullName"]')).toHaveValue('FSC Synthetic Manager');
  await page.goBack();
  await expect(page.locator('[name="fullName"]')).toHaveValue('FSC Synthetic Manager');
  await page.goForward();
  await expect(page.locator('[name="urgency"]')).toHaveValue('Emergency');
  await expect(page.locator('[name="email"]')).toHaveValue('fsc-history@example.invalid');
});
test('mobile menu Escape returns focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const trigger = page.getByRole('button', { name: /menu/i });
  await trigger.click(); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape'); await expect(trigger).toHaveAttribute('aria-expanded', 'false'); await expect(trigger).toBeFocused();
});
