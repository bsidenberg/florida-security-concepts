// Sitewide JSON-LD. Types come from schema-dts so an invalid @type or
// property fails `tsc`. The graph deliberately omits street address, prices,
// and opening hours.
import type {
  AdministrativeArea,
  City,
  Graph,
  HomeAndConstructionBusiness,
  ImageObject,
  PostalAddress,
  AskAction,
  EntryPoint,
  ReserveAction,
  Service,
} from 'schema-dts';
import { services } from '@/data/services';
import { activeSocialLinks, site } from '@/data/site';
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/seo/canonical';

export const BUSINESS_NAME = 'Florida Security Concepts LLC';
export const BUSINESS_ID = `${CANONICAL_ORIGIN}/#business`;
export const BUSINESS_PHONE = '+1-352-282-0692';

const logo: ImageObject = {
  '@type': 'ImageObject',
  url: `${CANONICAL_ORIGIN}/icon`,
  contentUrl: `${CANONICAL_ORIGIN}/icon`,
};

// City/region only. No streetAddress and no postalCode.
const address: PostalAddress = {
  '@type': 'PostalAddress',
  addressLocality: 'Clermont',
  addressRegion: 'FL',
};

const areaServed: (City | AdministrativeArea)[] = [
  {
    '@type': 'City',
    name: 'Clermont',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Lake County, Florida' },
  },
  { '@type': 'AdministrativeArea', name: 'Lake County' },
  { '@type': 'City', name: 'Orlando' },
  { '@type': 'City', name: 'Kissimmee' },
  { '@type': 'City', name: 'Winter Garden' },
  { '@type': 'AdministrativeArea', name: 'Tampa Bay' },
];

const ACTION_PLATFORMS = [
  'http://schema.org/DesktopWebPlatform',
  'http://schema.org/MobileWebPlatform',
] as const;

function bookEntryPoint(): EntryPoint {
  return {
    '@type': 'EntryPoint',
    urlTemplate: site.booking.bookUrl,
    actionPlatform: [...ACTION_PLATFORMS],
  };
}

function askEntryPoint(): EntryPoint {
  return {
    '@type': 'EntryPoint',
    urlTemplate: `${site.booking.askUrl}?q={question}`,
  };
}

/**
 * ReserveAction books an open slot. AskAction sends a question.
 * Both point at the Booqer shop. No price, no offer.
 */
export function bookingActions(): [ReserveAction, AskAction & { 'query-input': string }] {
  const reserve: ReserveAction = {
    '@type': 'ReserveAction',
    name: 'Book an appointment via Booqer',
    target: bookEntryPoint(),
  };
  const ask: AskAction & { 'query-input': string } = {
    '@type': 'AskAction',
    name: `Ask ${site.name} a question via Booqer`,
    target: askEntryPoint(),
    'query-input': 'required name=question',
  };
  return [reserve, ask];
}

/** Profiles the site actually links, plus the Booqer shop page. */
export function sameAsLinks(): string[] {
  return [site.booking.profileUrl, ...activeSocialLinks().map((link) => link.url)];
}

function safeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/24\s*\/\s*7|\$\s?\d/.test(value)) return undefined;
  return value;
}

/**
 * HomeAndConstructionBusiness is a LocalBusiness subtype for firms that work
 * on homes and buildings. ProfessionalService is deprecated, and narrower
 * types (locksmith, electrician, general contractor) do not describe this firm.
 */
const business: HomeAndConstructionBusiness = {
  '@type': 'HomeAndConstructionBusiness',
  '@id': BUSINESS_ID,
  name: BUSINESS_NAME,
  legalName: BUSINESS_NAME,
  url: canonicalUrl('/'),
  logo,
  image: `${CANONICAL_ORIGIN}/icon`,
  telephone: BUSINESS_PHONE,
  email: site.email,
  description: safeText(site.tagline),
  address,
  areaServed,
  sameAs: sameAsLinks(),
  potentialAction: bookingActions(),
};

function serviceNode(service: (typeof services)[number]): Service {
  const url = canonicalUrl(`/services/${service.slug}`);
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.navLabel,
    serviceType: service.shortLabel,
    description: safeText(service.intro),
    url,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      '@id': BUSINESS_ID,
      name: BUSINESS_NAME,
      url: canonicalUrl('/'),
      telephone: BUSINESS_PHONE,
    },
    areaServed,
  };
}

/** One Service node per service page that exists in data/services.ts. */
export function serviceNodes(): Service[] {
  return services.map(serviceNode);
}

export function businessGraph(): Graph {
  return {
    '@context': 'https://schema.org',
    '@graph': [business, ...serviceNodes()],
  };
}

export function serviceAreaServed(): (City | AdministrativeArea)[] {
  return areaServed;
}
