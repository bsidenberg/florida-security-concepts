// JSON-LD builders. Empty strings and empty arrays are omitted so placeholders
// never become structured data. Address is area-level (Clermont, FL) until a
// verified street and postal code exist.

import { site, hasPhone, hasEmail, hasPostalAddress, activeSocialLinks } from '@/data/site';

export const HQ_GEO = { latitude: 28.4447, longitude: -81.7987 } as const;

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function prune(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      const next = prune(inner);
      if (next !== undefined) out[key] = next;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.length === 0) return undefined;
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
}

export function areaAddressNode() {
  return {
    '@type': 'PostalAddress',
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
    ...(hasPostalAddress()
      ? { streetAddress: site.address.street, postalCode: site.address.postalCode }
      : {}),
  };
}

export function areaServedNodes() {
  return [
    { '@type': 'State', name: 'Florida' },
    ...site.serviceCities.map((city) => ({
      '@type': 'City',
      name: city,
      containedInPlace: { '@type': 'State', name: 'Florida' },
    })),
  ];
}

/** 24/7 emergency coverage. This is not a claim that a storefront is staffed all day. */
export function openingHoursNode() {
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [...WEEK],
    opens: '00:00',
    closes: '23:59',
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  const sameAs = activeSocialLinks().map((item) => item.url);
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': ['ProfessionalService', 'HomeAndConstructionBusiness'],
    '@id': `${site.url}/#business`,
    name: site.name,
    legalName: site.legalName || undefined,
    description:
      'Florida Security Concepts provides Managed Entry Reliability for commercial and residential properties: preventive maintenance, repairs, 24/7 emergency service, retrofits, and new installations for gates, access control, video surveillance, and license plate recognition. Based in Clermont, Lake County, and serving Florida statewide.',
    url: site.url,
    image: `${site.url}/photos/central-florida-commercial-gate-license-plate-recognition-camera.webp`,
    telephone: hasPhone() ? site.phone : undefined,
    email: hasEmail() ? site.email : undefined,
    address: areaAddressNode(),
    geo: { '@type': 'GeoCoordinates', latitude: HQ_GEO.latitude, longitude: HQ_GEO.longitude },
    areaServed: areaServedNodes(),
    openingHoursSpecification: openingHoursNode(),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }));
}

export function localBusinessJsonLd({
  city,
  region,
  url,
  description,
  geo,
}: {
  city: string;
  region: string;
  url: string;
  description: string;
  geo?: { latitude: number; longitude: number };
}): Record<string, unknown> {
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${site.name} — ${city}`,
    description,
    url,
    telephone: hasPhone() ? site.phone : undefined,
    email: hasEmail() ? site.email : undefined,
    address: areaAddressNode(),
    parentOrganization: { '@id': `${site.url}/#business` },
    areaServed: {
      '@type': 'City',
      name: city,
      containedInPlace: { '@type': 'AdministrativeArea', name: region },
    },
    openingHoursSpecification: openingHoursNode(),
    geo: geo ? { '@type': 'GeoCoordinates', latitude: geo.latitude, longitude: geo.longitude } : undefined,
  }));
}

export function serviceJsonLd({
  name,
  description,
  url,
  serviceType,
  image,
}: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  image?: string;
}): Record<string, unknown> {
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    serviceType,
    image: image ? (image.startsWith('http') ? image : `${site.url}${image}`) : undefined,
    provider: {
      '@type': 'ProfessionalService',
      '@id': `${site.url}/#business`,
      name: site.name,
      url: site.url,
      telephone: hasPhone() ? site.phone : undefined,
      address: areaAddressNode(),
    },
    areaServed: areaServedNodes(),
  }));
}

export function faqJsonLd(items: { q: string; a: string }[]): Record<string, unknown> | null {
  if (!items?.length) return null;
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }));
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> | null {
  if (!items?.length) return null;
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }));
}

export function imageObjectJsonLd(photo: {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  placeName: string;
  illustrative: boolean;
}): Record<string, unknown> {
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: `${site.url}${photo.src}`,
    url: `${site.url}${photo.src}`,
    name: photo.alt,
    description: photo.alt,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    contentLocation: { '@type': 'Place', name: photo.placeName },
    creditText: photo.illustrative
      ? 'Illustrative scene. Not a photograph of a specific job or address.'
      : 'Field photograph. The property is not identified.',
  }));
}

export function contactPageJsonLd(url: string): Record<string, unknown> {
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${site.name}`,
    url,
    publisher: {
      '@type': 'ProfessionalService',
      '@id': `${site.url}/#business`,
      name: site.name,
      url: site.url,
      telephone: hasPhone() ? site.phone : undefined,
      email: hasEmail() ? site.email : undefined,
    },
  }));
}

export function articleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}): Record<string, unknown> {
  return asRecord(prune({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
  }));
}
