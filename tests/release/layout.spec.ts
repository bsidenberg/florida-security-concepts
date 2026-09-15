// Cross-browser layout, reflow, motion and automated accessibility on the production-equivalent measurement build.
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from './support/guard';
import { ORIGINS, REPRESENTATIVE } from './support/constants';
import { currentEvidenceDir } from './support/evidence';
import { form, submitButton } from './support/form';

test.use({ baseURL: ORIGINS.measure });

/** Horizontal page scrolling, plus visible content pushed outside the viewport while overflow is clipped. */
async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const width = root.clientWidth;
    const offenders: string[] = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (rect.right <= width + 1 && rect.left >= -1) continue;
      let scroller = false;
      let clipped = false;
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') { scroller = true; break; }
        if ((overflowX === 'hidden' || overflowX === 'clip') && parent.getBoundingClientRect().right <= width + 1) { clipped = true; break; }
        if (getComputedStyle(parent).clip === 'rect(0px, 0px, 0px, 0px)' || getComputedStyle(parent).clipPath === 'inset(50%)') { clipped = true; break; }
      }
      if (scroller || clipped) continue;
      if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)') continue;
      offenders.push(`${element.tagName.toLowerCase()}.${String(element.className).split(' ').slice(0, 2).join('.')} [${Math.round(rect.left)}..${Math.round(rect.right)}]`);
    }
    return { scrollWidth: root.scrollWidth, clientWidth: width, offenders: offenders.slice(0, 10) };
  });
}

const routes = Object.entries(REPRESENTATIVE);
for (const width of [390, 1440]) {
  for (const [family, path] of routes) {
    test(`no horizontal overflow at ${width}px: ${family} ${path}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      expect((await page.goto(path))?.status()).toBe(200);
      const report = await overflowReport(page);
      expect(report.scrollWidth, `page must not scroll horizontally (${JSON.stringify(report)})`).toBeLessThanOrEqual(report.clientWidth);
      expect(report.offenders, 'content must not extend beyond the viewport').toEqual([]);
      await expect(page.getByRole('link', { name: 'Florida Security Concepts home' })).toBeVisible();
      // AC-08: urgent phone option visible without menu expansion.
      await expect(page.locator('header a[href^="tel:"]').first()).toBeVisible();
      if (family === 'home' || family === 'contact') {
        const dir = join(currentEvidenceDir(), 'screenshots');
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: join(dir, `${browserName}-${family}-${width}.png`), fullPage: true });
      }
    });
  }
}

// 200% zoom on a 1280x900 window yields a 640x450 CSS-pixel viewport at device pixel ratio 2; 400% on 1280x1024
// yields 320x256 at ratio 4 (WCAG 1.4.10 reflow). This emulates the resulting CSS viewport and pixel ratio in a new
// context for every engine; it is not the browser's zoom UI and does not cover text-only zoom.
for (const zoom of [{ label: '200% zoom', width: 640, height: 450, scale: 2, paths: [REPRESENTATIVE.home, REPRESENTATIVE.contact, REPRESENTATIVE.serviceDetail] }, { label: '400% reflow', width: 320, height: 256, scale: 4, paths: [REPRESENTATIVE.contact] }]) {
  test(`${zoom.label} equivalent keeps content reflowed and the form usable`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: zoom.width, height: zoom.height }, deviceScaleFactor: zoom.scale, serviceWorkers: 'block' });
    const external: string[] = [];
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === ORIGINS.measure) return route.continue();
      external.push(url); return route.abort('failed');
    });
    try {
      const page = await context.newPage();
      for (const path of zoom.paths) {
        expect((await page.goto(`${ORIGINS.measure}${path}`))?.status()).toBe(200);
        expect(await page.evaluate(() => window.devicePixelRatio)).toBe(zoom.scale);
        const report = await overflowReport(page);
        expect(report.scrollWidth, `${path}: ${JSON.stringify(report)}`).toBeLessThanOrEqual(report.clientWidth);
        expect(report.offenders, path).toEqual([]);
      }
      await page.goto(`${ORIGINS.measure}/contact`);
      await form(page).locator('[name="fullName"]').fill('Zyx Zoom Reflow');
      await expect(form(page).locator('[name="fullName"]')).toHaveValue('Zyx Zoom Reflow');
      await submitButton(page).click();
      const alert = form(page).getByRole('alert');
      await expect(alert).toBeVisible();
      const box = await alert.boundingBox();
      expect(box, 'error summary must render').not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(zoom.width + 1);
      const after = await overflowReport(page);
      expect(after.scrollWidth, 'errors must not introduce horizontal scrolling').toBeLessThanOrEqual(after.clientWidth);
    } finally {
      await context.close();
    }
    expect(external).toEqual([]);
  });
}

test('prefers-reduced-motion removes animations and transitions that exist without it', async ({ page }) => {
  const motion = () => page.evaluate(() => {
    const moving: string[] = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body, body *'))) {
      const style = getComputedStyle(element);
      const seconds = (value: string) => Math.max(...value.split(',').map(part => part.trim().endsWith('ms') ? parseFloat(part) / 1000 : parseFloat(part) || 0));
      const animated = style.animationName !== 'none' && seconds(style.animationDuration) > 0.01;
      const transitioned = seconds(style.transitionDuration) > 0.01;
      if (animated || transitioned) moving.push(`${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}`);
    }
    return { moving, smooth: getComputedStyle(document.documentElement).scrollBehavior };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const normal = await motion();
  expect(normal.moving.length, 'control: the homepage has motion without the preference').toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact');
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const reduced = await motion();
  expect(reduced.moving, 'no element may animate or transition under reduced motion').toEqual([]);
  expect(reduced.smooth).not.toBe('smooth');
});

for (const [family, path] of routes) {
  test(`axe: no critical or serious violations on ${family} ${path}`, async ({ page }, testInfo) => {
    expect((await page.goto(path))?.status()).toBe(200);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    const minor = results.violations.filter(v => !blocking.includes(v));
    testInfo.annotations.push({ type: 'axe-non-blocking', description: JSON.stringify(minor.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))) });
    expect(blocking.map(v => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.slice(0, 5).map(n => n.target) }))).toEqual([]);
  });
}
