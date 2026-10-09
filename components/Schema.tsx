// Server-rendered JSON-LD. Builders live in lib/seo/jsonld.ts so the payload can
// be validated without rendering React.

import {
  articleJsonLd,
  breadcrumbJsonLd,
  contactPageJsonLd,
  faqJsonLd,
  imageObjectJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  serviceJsonLd,
} from '@/lib/seo/jsonld';

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return <JsonLd data={organizationJsonLd()} />;
}

export function LocalBusinessSchema(props: {
  city: string;
  region: string;
  url: string;
  description: string;
  geo?: { latitude: number; longitude: number };
}) {
  return <JsonLd data={localBusinessJsonLd(props)} />;
}

export function ServiceSchema(props: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  image?: string;
}) {
  return <JsonLd data={serviceJsonLd(props)} />;
}

export function FAQSchema({ items }: { items: { q: string; a: string }[] }) {
  const data = faqJsonLd(items);
  if (!data) return null;
  return <JsonLd data={data} />;
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const data = breadcrumbJsonLd(items);
  if (!data) return null;
  return <JsonLd data={data} />;
}

export function ImageObjectSchema({
  photo,
}: {
  photo: {
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
    placeName: string;
    illustrative: boolean;
  };
}) {
  return <JsonLd data={imageObjectJsonLd(photo)} />;
}

export function ArticleSchema(props: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}) {
  return <JsonLd data={articleJsonLd(props)} />;
}

export function ContactPageSchema({ url }: { url: string }) {
  return <JsonLd data={contactPageJsonLd(url)} />;
}
