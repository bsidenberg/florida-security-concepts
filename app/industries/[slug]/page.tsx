import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CTASection } from '@/components/CTASection';
import { FAQ } from '@/components/FAQ';
import { ServiceCard } from '@/components/ServiceCard';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import {
  ServiceSchema,
  FAQSchema,
  BreadcrumbSchema,
} from '@/components/Schema';
import { industries, getIndustry } from '@/data/industries';
import { servicesBySlug } from '@/data/services';
import { site } from '@/data/site';

type Params = { params: { slug: string } };

export const dynamicParams = false;

export async function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ind = getIndustry(params.slug);
  if (!ind) return {};
  return buildPageMetadata({
    title: ind.metaTitle,
    description: ind.metaDescription,
    path: `/industries/${ind.slug}`,
    keywords: ind.keywords,
    ogType: 'article',
  });
}

export default function IndustryPage({ params }: Params) {
  const ind = getIndustry(params.slug);
  if (!ind) notFound();

  const recommended = ind.recommendedServices
    .map((slug) => servicesBySlug[slug])
    .filter(Boolean);

  const url = `${site.url}/industries/${ind.slug}`;
  const ctaLabel = `Plan security for your ${ind.shortLabel.toLowerCase()} property`;
  const ctaHref = `/contact?industry=${ind.slug}`;

  return (
    <>
      <Hero
        eyebrow={ind.eyebrow}
        title={ind.title}
        subtitle={ind.intro}
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'All industries', href: '/industries' }}
      />

      <Section tight>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Industries', href: '/industries' },
              { label: ind.shortLabel },
            ]}
          />

          <div className="fsc-card p-7 md:p-9 max-w-4xl">
            <Eyebrow>Direct answer</Eyebrow>
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-fsc-text">
              {ind.directAnswer}
            </p>
          </div>
        </Container>
      </Section>

      {/* Pains */}
      <Section>
        <Container>
          <Eyebrow>What this property type runs into</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            Common security gaps for {ind.shortLabel.toLowerCase()}.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {ind.pains.map((p) => (
              <div key={p.title} className="fsc-card p-6">
                <h3 className="text-base font-semibold text-fsc-text">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Recommended services */}
      <Section>
        <Container>
          <Eyebrow>What we recommend</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            Services most commonly deployed for this property type.
          </h2>
          <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
            {ind.recommendedReason}
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Key considerations */}
      <Section>
        <Container>
          <Eyebrow>What to plan for</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            Decisions that matter at design time.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {ind.keyConsiderations.map((c) => (
              <div key={c.title} className="fsc-card p-6">
                <h3 className="text-base font-semibold text-fsc-text">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container>
          <FAQ items={ind.faqs} defaultOpenFirst />
        </Container>
      </Section>

      {/* Lead capture */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <Eyebrow>Plan your system</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Start with a site assessment.
              </h2>
              <p className="mt-4 text-base text-fsc-text-dim leading-relaxed">
                Tell us about your property — we use the assessment to scope a
                system that fits the property’s actual operations.
              </p>
            </div>
            <div className="lg:col-span-7">
              <LeadCaptureForm
                defaults={{
                  propertyType: defaultPropertyType(ind.slug),
                  industrySlug: ind.slug,
                }}
                submitLabel={ctaLabel}
              />
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title={`Plan an integrated security system for your ${ind.shortLabel.toLowerCase()} property.`}
        body="One credential layer, one event timeline, one accountable team across gates, access control, cameras, and ongoing service."
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <ServiceSchema
        name={ind.title}
        description={ind.metaDescription}
        url={url}
        serviceType={`Security systems for ${ind.shortLabel}`}
      />
      <FAQSchema items={ind.faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Industries', url: site.url + '/industries' },
          { name: ind.shortLabel, url },
        ]}
      />
    </>
  );
}

function defaultPropertyType(slug: string): string | undefined {
  const map: Record<string, string> = {
    'hoa-gated-communities': 'HOA / gated community',
    'multifamily-apartments-condos': 'Multifamily / apartment / condo',
    'storage-facilities': 'Storage facility',
    'commercial-properties': 'Commercial property',
    'industrial-warehouses': 'Industrial / warehouse',
    'property-managers': 'Other',
    'residential-estates': 'Residential / estate',
  };
  return map[slug];
}
