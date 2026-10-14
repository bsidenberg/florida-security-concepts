import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '../../app/sitemap';
import { OrganizationSchema } from '../../components/Schema';
import { industries } from '../../data/industries';
import { locations } from '../../data/locations';
import { resources } from '../../data/resources';
import { services } from '../../data/services';
import { CANONICAL_ORIGIN, canonicalUrl } from '../../lib/seo/canonical';
import { buildPageMetadata } from '../../lib/seo/metadata';
import { BUSINESS_NAME, BUSINESS_PHONE, businessGraph, sameAsLinks } from '../../lib/seo/structuredData';

const STATIC_PATHS = ['/', '/services', '/industries', '/service-areas', '/resources', '/contact', '/privacy', '/terms', '/sms-consent'];

function publicPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...services.map((service) => `/services/${service.slug}`),
    ...industries.map((industry) => `/industries/${industry.slug}`),
    ...locations.map((location) => `/service-areas/${location.slug}`),
    ...resources.map((resource) => `/resources/${resource.slug}`),
  ];
}

function walk(value: unknown, visit: (node: Record<string, unknown>) => void) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (value && typeof value === 'object') {
    visit(value as Record<string, unknown>);
    for (const nested of Object.values(value)) walk(nested, visit);
  }
}

describe('canonical URLs', () => {
  it('uses the www origin and a self-referencing path', () => {
    expect(canonicalUrl('/')).toBe(CANONICAL_ORIGIN);
    expect(canonicalUrl('/contact')).toBe(`${CANONICAL_ORIGIN}/contact`);
    expect(canonicalUrl('/services/gate-automation/')).toBe(`${CANONICAL_ORIGIN}/services/gate-automation`);
  });

  it('matches every sitemap loc to the canonical URL for that path', () => {
    const expected = publicPaths().map((path) => canonicalUrl(path)).sort();
    const actual = sitemap().map((entry) => entry.url).sort();
    expect(actual).toEqual(expected);
    for (const url of actual) {
      expect(url.startsWith(`${CANONICAL_ORIGIN}`)).toBe(true);
      expect(url.includes('?')).toBe(false);
    }
  });

  it('puts the absolute canonical on page metadata', () => {
    const metadata = buildPageMetadata({
      title: 'Gate automation',
      description: 'Automatic gate operators for communities and commercial sites.',
      path: '/services/gate-automation',
    });
    expect(metadata.alternates?.canonical).toBe(`${CANONICAL_ORIGIN}/services/gate-automation`);
    expect(metadata.openGraph && 'url' in metadata.openGraph ? metadata.openGraph.url : '').toBe(`${CANONICAL_ORIGIN}/services/gate-automation`);
  });
});

describe('business JSON-LD', () => {
  it('parses, uses schema.org types, and omits address lines, prices, and hours', () => {
    const html = renderToStaticMarkup(createElement(OrganizationSchema));
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![1]) as ReturnType<typeof businessGraph>;
    expect(parsed).toEqual(businessGraph());
    expect(parsed['@context']).toBe('https://schema.org');

    const graph = parsed['@graph'];
    const business = graph[0] as unknown as Record<string, unknown>;
    expect(business['@type']).toBe('HomeAndConstructionBusiness');
    expect(business.name).toBe(BUSINESS_NAME);
    expect(business.url).toBe(CANONICAL_ORIGIN);
    expect(business.telephone).toBe(BUSINESS_PHONE);
    expect(business.logo).toMatchObject({ '@type': 'ImageObject', url: `${CANONICAL_ORIGIN}/icon` });
    expect(business.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Clermont', addressRegion: 'FL' });
    expect(business.sameAs).toEqual(sameAsLinks());
    expect(sameAsLinks()).toContain('https://booqer.ai/shops/florida-security-concepts');
    expect(business.potentialAction).toMatchObject({
      '@type': 'ReserveAction',
      target: 'https://booqer.ai/shops/florida-security-concepts/book',
    });

    const served = business.areaServed as { name: string }[];
    expect(served.map((place) => place.name)).toEqual(['Orlando', 'Kissimmee', 'Winter Garden', 'Clermont', 'Tampa Bay']);

    const serviceEntries = graph.slice(1) as unknown as Record<string, unknown>[];
    expect(serviceEntries.map((entry) => entry.url)).toEqual(services.map((service) => canonicalUrl(`/services/${service.slug}`)));
    for (const entry of serviceEntries) {
      expect(entry['@type']).toBe('Service');
      expect(entry.provider).toMatchObject({ '@type': 'HomeAndConstructionBusiness', name: BUSINESS_NAME, telephone: BUSINESS_PHONE });
      expect(entry.areaServed).toEqual(business.areaServed);
    }

    const forbidden = ['openingHours', 'openingHoursSpecification', 'priceRange', 'price', 'streetAddress', 'postalCode', 'offers'];
    walk(parsed, (node) => {
      for (const key of forbidden) expect(node[key]).toBeUndefined();
    });
    expect(JSON.stringify(parsed)).not.toMatch(/24\s*\/\s*7|\$\s?\d/);
  });
});
