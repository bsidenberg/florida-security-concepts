// Hosted/local-preview isolation of indexing and analytics (app/robots.ts, app/layout.tsx).
// Fonts, CSS and site chrome components are stubbed so the real layout module's environment gating can be
// evaluated and rendered outside Next; the analytics loader is replaced by a visible marker so its presence is
// observable. Every negative case uses the same valid pa- URL and production NODE_ENV as the positive control,
// so a negative can only pass because of the gate under test.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// Evaluate the JSX dev runtime under the test environment before any NODE_ENV stub (the layout transform targets it).
import 'react/jsx-dev-runtime';

vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-sans-stub' }), JetBrains_Mono: () => ({ variable: 'font-mono-stub' }) }));
vi.mock('../../app/globals.css', () => ({}));
vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/Schema', () => ({ OrganizationSchema: () => null }));
vi.mock('@/components/LocalPreviewContext', () => ({ LocalPreviewProvider: ({ children }: { children: unknown }) => children }));
vi.mock('@/lib/analytics/PlausibleAnalytics', () => ({ PlausibleAnalytics: ({ src }: { src: string }) => createElement('div', { 'data-plausible-src': src }) }));

const ANALYTICS = 'https://plausible.io/js/pa-synthetic-unit.js';
const HOSTED_PREVIEWS: [string, Record<string, string>][] = [
  ['Vercel preview', { VERCEL: '1', VERCEL_ENV: 'preview' }],
  ['Vercel development', { VERCEL: '1', VERCEL_ENV: 'development' }],
  ['production env targeting preview', { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'preview' }],
];
function stub(env: Record<string, string>) {
  for (const key of ['VERCEL', 'VERCEL_ENV', 'VERCEL_TARGET_ENV', 'FSC_LOCAL_PREVIEW']) vi.stubEnv(key, '');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL', ANALYTICS);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}
// The layout reads NODE_ENV and preview markers at module load. A unique query creates a fresh instance of the layout
// module only; React's JSX runtime stays cached (resetting modules would re-evaluate it as its production build).
// app/robots.ts reads the environment when called, so it needs no reload.
let instance = 0;
async function loadLayout() {
  return import(/* @vite-ignore */ `../../app/layout.tsx?preview-isolation=${++instance}`) as Promise<typeof import('../../app/layout')>;
}
async function renderLayout() {
  const layout = await loadLayout();
  return { layout, html: renderToStaticMarkup(layout.default({ children: createElement('p', null, 'synthetic page') })) };
}
afterEach(() => { vi.unstubAllEnvs(); });

describe('robots.txt', () => {
  it.each(HOSTED_PREVIEWS)('%s disallows all crawling', async (_label, env) => {
    stub(env);
    const robots = (await import('../../app/robots')).default;
    expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] });
  });

  it('local preview disallows all crawling', async () => {
    stub({ FSC_LOCAL_PREVIEW: '1' });
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
  it('control: Vercel production with a pa- URL is indexable and renders the analytics loader with that exact URL', async () => {
    stub({ VERCEL: '1', VERCEL_ENV: 'production' });
    const { layout, html } = await renderLayout();
    expect(layout.metadata.robots).toMatchObject({ index: true, follow: true, googleBot: { index: true, follow: true } });
    expect(html).toContain(`data-plausible-src="${ANALYTICS}"`);
    expect(html.match(/data-plausible-src=/g)).toHaveLength(1);
  });

  it('control: a non-Vercel production build (measurement mode) with a pa- URL renders the analytics loader', async () => {
    stub({});
    const { layout, html } = await renderLayout();
    expect(layout.metadata.robots).toMatchObject({ index: true, follow: true });
    expect(html).toContain(`data-plausible-src="${ANALYTICS}"`);
  });

  it.each(HOSTED_PREVIEWS)('%s: noindex/nofollow and no analytics loader despite a valid pa- URL in production', async (_label, env) => {
    stub(env);
    const { layout, html } = await renderLayout();
    expect(layout.metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
    expect(html).toContain('synthetic page');
    expect(html).not.toContain('data-plausible-src');
    expect(html).not.toContain(ANALYTICS);
  });

  it('local preview: noindex and no analytics loader despite a valid pa- URL in production', async () => {
    stub({ FSC_LOCAL_PREVIEW: '1' });
    const { layout, html } = await renderLayout();
    expect(layout.metadata.robots).toMatchObject({ index: false, follow: false });
    expect(html).toContain('Local review');
    expect(html).not.toContain('data-plausible-src');
  });

  it('development NODE_ENV renders no analytics loader even with a valid pa- URL', async () => {
    stub({ VERCEL: '1', VERCEL_ENV: 'production' });
    vi.stubEnv('NODE_ENV', 'development');
    const { html } = await renderLayout();
    expect(html).not.toContain('data-plausible-src');
  });

  it.each([
    ['legacy script.js', 'https://plausible.io/js/script.js'],
    ['non-https', 'http://plausible.io/js/pa-synthetic-unit.js'],
    ['look-alike host', 'https://plausible.io.example.invalid/js/pa-synthetic-unit.js'],
    ['self-hosted path', 'https://example.invalid/js/pa-synthetic-unit.js'],
    ['query string', 'https://plausible.io/js/pa-synthetic-unit.js?u=1'],
    ['path traversal', 'https://plausible.io/js/../js/pa-synthetic-unit.js'],
    ['javascript URL', 'javascript:alert(1)//https://plausible.io/js/pa-x.js'],
    ['empty', ''],
  ])('production rejects a %s analytics URL', async (_label, url) => {
    stub({ VERCEL: '1', VERCEL_ENV: 'production' });
    vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL', url);
    const { html } = await renderLayout();
    expect(html).toContain('synthetic page');
    expect(html).not.toContain('data-plausible-src');
  });
});
