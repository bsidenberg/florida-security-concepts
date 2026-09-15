// Hosted-preview isolation of indexing and analytics (app/robots.ts, app/layout.tsx).
// Fonts, CSS and site chrome components are stubbed so the real layout module's
// environment gating can be evaluated and rendered outside Next; the Plausible
// provider is replaced by a visible marker so its presence is observable.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-sans-stub' }), JetBrains_Mono: () => ({ variable: 'font-mono-stub' }) }));
vi.mock('../../app/globals.css', () => ({}));
vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/Schema', () => ({ OrganizationSchema: () => null }));
vi.mock('@/components/LocalPreviewContext', () => ({ LocalPreviewProvider: ({ children }: { children: unknown }) => children }));
vi.mock('next-plausible', () => ({ default: ({ src, children }: { src: string; children: unknown }) => createElement('div', { 'data-plausible-src': src }, children as never) }));

const ANALYTICS = 'https://plausible.example.invalid/js/pa-synthetic.js';
const ENVIRONMENTS: [string, Record<string, string>][] = [
  ['Vercel preview', { VERCEL: '1', VERCEL_ENV: 'preview' }],
  ['Vercel development', { VERCEL: '1', VERCEL_ENV: 'development' }],
  ['production env targeting preview', { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'preview' }],
];
function stub(env: Record<string, string>) {
  for (const key of ['VERCEL', 'VERCEL_ENV', 'VERCEL_TARGET_ENV', 'FSC_LOCAL_PREVIEW']) vi.stubEnv(key, '');
  vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL', ANALYTICS);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}
async function loadLayout() {
  vi.resetModules();
  return import('../../app/layout');
}
async function render(layout: Awaited<ReturnType<typeof loadLayout>>) {
  return renderToStaticMarkup(layout.default({ children: createElement('p', null, 'synthetic page') }));
}
afterEach(() => { vi.unstubAllEnvs(); });

describe('robots.txt', () => {
  it.each(ENVIRONMENTS)('%s disallows all crawling', async (_label, env) => {
    stub(env);
    const robots = (await import('../../app/robots')).default;
    expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] });
  });

  it('control: Vercel production allows crawling with a sitemap', async () => {
    stub({ VERCEL: '1', VERCEL_ENV: 'production' });
    const robots = (await import('../../app/robots')).default;
    const result = robots();
    expect(result.rules).toEqual([{ userAgent: '*', allow: '/', disallow: ['/api/'] }]);
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe('root layout metadata and analytics', () => {
  it.each(ENVIRONMENTS)('%s: noindex/nofollow and no analytics provider even when the analytics URL is configured', async (_label, env) => {
    stub(env);
    const layout = await loadLayout();
    expect(layout.metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
    const html = await render(layout);
    expect(html).toContain('synthetic page');
    expect(html).not.toContain('data-plausible-src');
    expect(html).not.toContain(ANALYTICS);
  });

  it('control: Vercel production is indexable and renders the analytics provider', async () => {
    stub({ VERCEL: '1', VERCEL_ENV: 'production' });
    const layout = await loadLayout();
    expect(layout.metadata.robots).toMatchObject({ index: true, follow: true, googleBot: { index: true, follow: true } });
    expect(await render(layout)).toContain(`data-plausible-src="${ANALYTICS}"`);
  });
});
