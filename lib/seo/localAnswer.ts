// Page-level LocalBusiness / Service JSON-LD for gate-operator answer pages.
// Address is city and region only. No street, postal code, prices, or hours.

import type { AdministrativeArea, City } from 'schema-dts';
import { site } from '@/data/site';
import { canonicalUrl } from '@/lib/seo/canonical';
import { BUSINESS_ID, BUSINESS_NAME, BUSINESS_PHONE, bookingActions } from '@/lib/seo/structuredData';

const cityAddress = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Clermont',
  addressRegion: 'FL',
};

export function answerLocalBusinessJsonLd({
  name,
  description,
  url,
  areaServed,
}: {
  name: string;
  description: string;
  url: string;
  areaServed: (City | AdministrativeArea)[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': `${url}#localbusiness`,
    name,
    legalName: site.legalName,
    description,
    url,
    telephone: BUSINESS_PHONE,
    email: site.email,
    address: cityAddress,
    areaServed,
    parentOrganization: { '@id': BUSINESS_ID },
    potentialAction: bookingActions(),
  };
}

export function answerServiceJsonLd({
  name,
  description,
  url,
  serviceType,
  areaServed,
}: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  areaServed: (City | AdministrativeArea)[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    serviceType,
    description,
    url,
    areaServed,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      '@id': BUSINESS_ID,
      name: BUSINESS_NAME,
      url: canonicalUrl('/'),
      telephone: BUSINESS_PHONE,
      address: cityAddress,
    },
  };
}
