import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LocalLandingView } from '../../components/LocalLandingPage';
import { localLandings } from '../../data/localLandings';
import { CANONICAL_ORIGIN } from '../../lib/seo/canonical';
import { BUSINESS_ID } from '../../lib/seo/structuredData';
import { buildPageMetadata } from '../../lib/seo/metadata';

const ALLOWED_SLUGS = ['clermont-fl', 'orlando-fl', 'kissimmee-fl', 'winter-garden-fl', 'tampa-bay-fl'];
const GATE_SLUGS = ['clermont-fl', 'minneola-fl', 'groveland-fl', 'orlando-fl', 'kissimmee-fl', 'winter-garden-fl', 'tampa-bay-fl'];

describe('local service-area pages', () => {
  it('publishes twelve pages: seven gate-repair areas and five access-control areas', () => {
    expect(localLandings).toHaveLength(12);
    expect(new Set(localLandings.map((landing) => landing.path)).size).toBe(12);
    for (const service of ['gate-repair', 'access-control'] as const) {
      const slugs = localLandings.filter((landing) => landing.service === service).map((landing) => landing.slug);
      expect(slugs).toEqual(service === 'gate-repair' ? GATE_SLUGS : ALLOWED_SLUGS);
    }
    expect(localLandings.map((landing) => landing.path)).toContain('/gate-repair/clermont-fl');
    expect(localLandings.find((landing) => landing.path === '/gate-repair/clermont-fl')?.h1).toBe(
      'Gate Repair in Clermont & Lake County, FL',
    );
  });

  it('gives each page its own title, description, and body', () => {
    const titles = localLandings.map((landing) => landing.title);
    const descriptions = localLandings.map((landing) => landing.metaDescription);
    const bodies = localLandings.map((landing) =>
      [landing.intro, landing.localContext, ...landing.conditions.map((item) => item.body), ...landing.beforeYouCall].join('\n'),
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(bodies).size).toBe(bodies.length);
    for (const description of descriptions) expect(description.length).toBeLessThanOrEqual(170);
  });

  it('renders a www canonical, city Service JSON-LD, and the booking call', () => {
    for (const landing of localLandings) {
      const metadata = buildPageMetadata({
        title: landing.title,
        description: landing.metaDescription,
        path: landing.path,
      });
      expect(metadata.alternates?.canonical).toBe(`${CANONICAL_ORIGIN}${landing.path}`);

      const html = renderToStaticMarkup(createElement(LocalLandingView, { landing }));
      expect(html).toContain(`>${landing.h1.replace(/&/g, '&amp;')}<`);
      expect(html).toContain('Book a project call');
      expect(html).toContain('352-282-0692');
      expect(html).toContain('https://booqer.ai/shops/florida-security-concepts/book');
      expect(html).toContain('>Service areas<');

      const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      expect(match).not.toBeNull();
      const schema = JSON.parse(match![1]) as Record<string, unknown>;
      expect(schema['@type']).toBe('Service');
      expect(schema.url).toBe(`${CANONICAL_ORIGIN}${landing.path}`);
      expect(schema.provider).toEqual({ '@type': 'HomeAndConstructionBusiness', '@id': BUSINESS_ID });
      expect(schema.areaServed).toEqual(landing.areaServed);
      expect(JSON.stringify(schema)).not.toMatch(/24\s*\/\s*7|\$\s?\d|streetAddress|postalCode/);
      expect(html).not.toMatch(/24\s*\/\s*7|free estimate|division of|Pole Barn|\$\s?\d/i);
    }
  });
});
