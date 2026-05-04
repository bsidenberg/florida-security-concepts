// Server-rendered JSON-LD schema components.
//
// All emitters omit absent fields rather than rendering empty strings, so
// pre-launch placeholders never produce malformed structured data.

import {
  site,
  hasPhone,
  hasEmail,
  hasPostalAddress,
  activeSocialLinks,
} from '@/data/site';

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Strip undefined/null/'' values so generated JSON-LD stays clean.
function pruned<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.length === 0) continue;
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
  const sameAs = activeSocialLinks().map((s) => s.url);
  return (
    <JsonLd
      data={pruned({
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: site.name,
        legalName: site.legalName || undefined,
        description: site.tagline,
        url: site.url,
        areaServed: site.serviceRegions.map((r) => ({
          '@type': 'AdministrativeArea',
          name: r,
        })),
        address: postalAddressNode(),
        telephone: hasPhone() ? site.phone : undefined,
        email: hasEmail() ? site.email : undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      })}
    />
  );
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
        description,
        url,
        serviceType,
        provider: pruned({
          '@type': 'ProfessionalService',
          name: site.name,
          url: site.url,
          telephone: hasPhone() ? site.phone : undefined,
        }),
        areaServed: site.serviceRegions.map((r) => ({
          '@type': 'AdministrativeArea',
          name: r,
        })),
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
        author: { '@type': 'Organization', name: site.name },
        publisher: pruned({
          '@type': 'Organization',
          name: site.name,
          url: site.url,
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
          '@type': 'ProfessionalService',
          name: site.name,
          url: site.url,
          telephone: hasPhone() ? site.phone : undefined,
          email: hasEmail() ? site.email : undefined,
        }),
      })}
    />
  );
}
