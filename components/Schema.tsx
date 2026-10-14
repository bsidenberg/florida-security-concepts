// Server-rendered JSON-LD schema components.
//
// All emitters omit absent fields rather than rendering empty strings, so
// pre-launch placeholders never produce malformed structured data.

import {
  site,
  hasPhone,
  hasEmail,
  hasPostalAddress,
} from '@/data/site';
import { canonicalUrl } from '@/lib/seo/canonical';
import {
  BUSINESS_ID,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  businessGraph,
  serviceAreaServed,
} from '@/lib/seo/structuredData';

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Strip undefined/null/'' and empty arrays so generated JSON-LD stays clean.
// Empty arrays (e.g. sameAs: []) must not be emitted — they are valid JSON but
// confuse some validators and provide no signal to crawlers.
function pruned<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.length === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function postalAddressNode() {
  if (!hasPostalAddress()) return undefined;
  return pruned({
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  });
}

export function OrganizationSchema() {
  return <JsonLd data={businessGraph()} />;
}

export function LocalBusinessSchema({
  city,
  region,
  url,
  description,
}: {
  city: string;
  region: string;
  url: string;
  description: string;
}) {
  return (
    <JsonLd
      data={pruned({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `${site.name} — ${city}`,
        description,
        url,
        areaServed: { '@type': 'City', name: city, containedInPlace: region },
        // Only include address if a verified street/postal is configured.
        address: postalAddressNode(),
        telephone: hasPhone() ? site.phone : undefined,
        email: hasEmail() ? site.email : undefined,
      })}
    />
  );
}

export function ServiceSchema({
  name,
  description,
  url,
  serviceType,
}: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
}) {
  return (
    <JsonLd
      data={pruned({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description: /24\s*\/\s*7|\$\s?\d/.test(description) ? undefined : description,
        url,
        serviceType,
        provider: pruned({
          '@type': 'HomeAndConstructionBusiness',
          '@id': BUSINESS_ID,
          name: BUSINESS_NAME,
          url: canonicalUrl('/'),
          telephone: BUSINESS_PHONE,
        }),
        areaServed: serviceAreaServed(),
      })}
    />
  );
}

export function FAQSchema({ items }: { items: { q: string; a: string }[] }) {
  if (!items?.length) return null;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((i) => ({
          '@type': 'Question',
          name: i.q,
          acceptedAnswer: { '@type': 'Answer', text: i.a },
        })),
      }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  if (!items?.length) return null;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          item: it.url,
        })),
      }}
    />
  );
}

export function ArticleSchema({
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
}) {
  return (
    <JsonLd
      data={pruned({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        description,
        url,
        datePublished,
        dateModified,
        author: { '@type': 'Organization', name: BUSINESS_NAME },
        publisher: pruned({
          '@type': 'HomeAndConstructionBusiness',
          '@id': BUSINESS_ID,
          name: BUSINESS_NAME,
          url: canonicalUrl('/'),
        }),
      })}
    />
  );
}

export function ContactPageSchema({ url }: { url: string }) {
  return (
    <JsonLd
      data={pruned({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: `Contact ${site.name}`,
        url,
        publisher: pruned({
          '@type': 'HomeAndConstructionBusiness',
          '@id': BUSINESS_ID,
          name: BUSINESS_NAME,
          url: canonicalUrl('/'),
          telephone: BUSINESS_PHONE,
          email: hasEmail() ? site.email : undefined,
        }),
      })}
    />
  );
}
