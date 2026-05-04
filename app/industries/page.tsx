import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { IndustryCard } from '@/components/IndustryCard';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { industries } from '@/data/industries';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Industries Served | HOAs, Multifamily, Storage, Commercial & More',
  description:
    'Florida Security Concepts serves HOAs, gated communities, multifamily, storage, commercial, industrial, property managers, and estate properties across Central Florida and Tampa Bay.',
  alternates: { canonical: '/industries' },
};

export default function IndustriesIndexPage() {
  return (
    <>
      <Hero
        eyebrow="Industries"
        title="Security systems engineered for the way each property type actually operates."
        subtitle="Each industry has its own credential populations, traffic patterns, and incident profile. We design systems around those realities — not around generic templates."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <Section>
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Industries' }]} />
          <Eyebrow>All industries</Eyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
            Choose your property type
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((i) => (
              <IndustryCard key={i.slug} industry={i} />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Don’t see your property type?"
        body="If your property does not fit cleanly into any of these — mixed-use, specialty, or unusual operations — we still want to hear about it. The site assessment scopes itself to the property."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Industries', url: site.url + '/industries' },
        ]}
      />
    </>
  );
}
