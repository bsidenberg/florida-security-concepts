import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CTASection } from '@/components/CTASection';
import { FAQ } from '@/components/FAQ';
import { ServiceCard } from '@/components/ServiceCard';
import { IndustryCard } from '@/components/IndustryCard';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import {
  LocalBusinessSchema,
  FAQSchema,
  BreadcrumbSchema,
} from '@/components/Schema';
import {
  locations,
  locationsBySlug,
  getLocation,
} from '@/data/locations';
import { servicesBySlug } from '@/data/services';
import { industriesBySlug } from '@/data/industries';
import { site } from '@/data/site';

type Params = { params: { slug: string } };

export const dynamicParams = false;

export async function generateStaticParams() {
  return locations.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loc = getLocation(params.slug);
  if (!loc) return {};
  return buildPageMetadata({
    title: loc.metaTitle,
    description: loc.metaDescription,
    path: `/service-areas/${loc.slug}`,
    keywords: loc.keywords,
    ogType: 'article',
  });
}

const locationFaqs = (city: string) => [
  {
    q: `Does Florida Security Concepts serve ${city}?`,
    a: `Yes. ${city} is part of our Central Florida and Tampa Bay coverage area. We service communities, commercial properties, storage facilities, industrial sites, and estates throughout the area.`,
  },
  {
    q: `Do you offer same-day or emergency service in ${city}?`,
    a: `24/7 emergency support is available, with same-day service when scheduling and travel allow. Emergency requests are triaged on intake.`,
  },
  {
    q: `Do you handle ${city} HOA and property management work?`,
    a: `Yes. We work directly with property managers and HOA boards across ${city} on gate, access control, video, and integrated security systems — both single-site and multi-site.`,
  },
  {
    q: `What kinds of properties do you typically work with in ${city}?`,
    a: `From gated communities and multifamily to commercial, industrial, storage, and high-value residential. The site assessment scopes itself to the specific property.`,
  },
];

export default function LocationPage({ params }: Params) {
  const loc = getLocation(params.slug);
  if (!loc) notFound();

  const services = loc.highlightServices
    .map((slug) => servicesBySlug[slug])
    .filter(Boolean);
  const industries = loc.highlightIndustries
    .map((slug) => industriesBySlug[slug])
    .filter(Boolean);
  const nearbyLocs = loc.nearby
    .map((slug) => locationsBySlug[slug])
    .filter(Boolean);

  const url = `${site.url}/service-areas/${loc.slug}`;
  const faqs = locationFaqs(loc.city);
  const ctaLabel = `Request service in ${loc.city}`;
  const ctaHref = `/contact?location=${loc.slug}`;

  return (
    <>
      <Hero
        eyebrow={`${loc.region}${loc.county ? ' · ' + loc.county : ''}`}
        title={`Security Gate, Access Control & Surveillance in ${loc.city}`}
        subtitle={loc.intro}
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'All service areas', href: '/service-areas' }}
      />

      <Section tight>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Service Areas', href: '/service-areas' },
              { label: loc.city },
            ]}
          />
          <div className="fsc-card p-7 md:p-9 max-w-4xl">
            <Eyebrow>Local context</Eyebrow>
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-fsc-text">
              {loc.localContext}
            </p>
          </div>
        </Container>
      </Section>

      {/* Services in this area */}
      <Section>
        <Container>
          <Eyebrow>Services in {loc.city}</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            What we install and service in {loc.city}.
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Industries in this area */}
      {industries.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Industries served in {loc.city}</Eyebrow>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              Property types we work with locally.
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {industries.map((i) => (
                <IndustryCard key={i.slug} industry={i} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section>
        <Container>
          <FAQ items={faqs} defaultOpenFirst />
        </Container>
      </Section>

      {/* Lead capture */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <Eyebrow>Plan your {loc.city} system</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Start with a site assessment.
              </h2>
              <p className="mt-4 text-base text-fsc-text-dim leading-relaxed">
                Tell us about your {loc.city} property. We respond to most assessment requests the same business day.
              </p>
            </div>
            <div className="lg:col-span-7">
              <LeadCaptureForm
                defaults={{ city: matchCity(loc.city), locationSlug: loc.slug }}
                submitLabel={ctaLabel}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Nearby */}
      {nearbyLocs.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Nearby areas</Eyebrow>
            <h3 className="mt-3 text-xl md:text-2xl font-semibold text-fsc-text">
              Also serving
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {nearbyLocs.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={`/service-areas/${n.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-fsc-border-strong bg-fsc-surface/60 px-3.5 py-1.5 text-xs text-fsc-text hover:border-fsc-accent-glow hover:text-fsc-accent-glow transition"
                  >
                    {n.city}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CTASection
        title={`Plan an integrated security system in ${loc.city}.`}
        body="Gate, credential, camera, and service infrastructure designed around how your property actually controls vehicles, visitors, vendors, residents, and after-hours access."
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'Browse Resources', href: '/resources' }}
      />

      <LocalBusinessSchema
        city={loc.city}
        region={loc.region}
        url={url}
        description={loc.metaDescription}
      />
      <FAQSchema items={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Service Areas', url: site.url + '/service-areas' },
          { name: loc.city, url },
        ]}
      />
    </>
  );
}

// Map our city display name to the form's city option list.
function matchCity(city: string): string | undefined {
  const known = [
    'Orlando',
    'Tampa',
    'Lakeland',
    'Kissimmee',
    'Winter Garden',
    'Clermont',
    'Lake Mary',
    'Sanford',
    'Ocala',
    'The Villages',
    'St. Petersburg',
    'Clearwater',
    'Brandon',
    'Wesley Chapel',
  ];
  return known.includes(city) ? city : 'Other';
}
