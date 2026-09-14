import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const families = [
  ['services', '/services'],
  ['service-detail', '/services/access-control'],
  ['emergency', '/services/emergency-service'],
  ['industries', '/industries'],
  ['industry-detail', '/industries/hoa-gated-communities'],
  ['areas', '/service-areas'],
  ['area-detail', '/service-areas/orlando'],
  ['resources', '/resources'],
  ['article', '/resources/property-manager-security-system-checklist'],
  ['article-table', '/resources/how-much-does-an-automatic-gate-cost'],
] as const;
let externalAttempt = false;
test.beforeEach(async ({ context, baseURL }) => {
  externalAttempt = false;
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === baseURL) return route.continue();
    externalAttempt = true; return route.abort();
  });
});
test.afterEach(async () => expect(externalAttempt, 'Theme checks must not contact external services').toBe(false));

async function background(locator: Locator) {
  return locator.evaluate(element => {
    let current: Element | null = element;
    while (current) {
      const color = getComputedStyle(current).backgroundColor;
      const values = color.match(/[\d.]+/g)?.map(Number) || [];
      if (values.length >= 3 && (values.length < 4 || values[3] >= 0.95)) return values.slice(0, 3);
      current = current.parentElement;
    }
    return [255, 255, 255];
  });
}

for (const width of [390, 1440]) for (const [family, path] of families) {
  test(`shared theme ${family} at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    expect((await page.goto(path))?.status()).toBe(200);
    await page.screenshot({ path: `harness/evidence/S-UI-001-${family}-${width}.png`, fullPage: true });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Florida Security Concepts home' })).toBeVisible();
    await expect(page.locator('header a[href^="tel:"]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page must reflow without horizontal scrolling').toBe(true);
    const hero = page.locator('h1').locator('xpath=ancestor::section[1]');
    await expect(hero).toBeVisible();
    const heroColor = await background(hero);
    expect(Math.max(...heroColor), 'Hero must retain the dark navy presentation').toBeLessThan(140);
    expect(heroColor[2], 'Hero navy must have more blue than red').toBeGreaterThan(heroColor[0]);
    const bodyColor = await background(page.locator('body'));
    expect(Math.min(...bodyColor), 'The page outside navy hero/footer must use a light canvas').toBeGreaterThan(200);
    const content = page.locator('article').first();
    if (await content.count()) expect(Math.min(...await background(content)), 'Article reading surface must be light').toBeGreaterThan(200);
    for (const table of await page.locator('table').all()) {
      await expect(table).toBeVisible();
      expect(await table.locator('th,td').count(), 'Existing article table content must remain present').toBeGreaterThan(0);
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}
test('not-found page remains readable in the shared theme', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto('/fsc-theme-missing-page'))?.status()).toBe(404);
  await page.screenshot({ path: 'harness/evidence/S-UI-001-not-found-390.png', fullPage: true });
  await expect(page.locator('main')).toContainText(/404|not found/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(v => v.id)).toEqual([]);
});
