import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { ServiceCard } from '@/components/ServiceCard';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { services } from '@/data/services';
import { site } from '@/data/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Security Services | Gates, Access Control, Surveillance & Integration',
  description:
    'Gate repair, maintenance plans, gate automation, access control, video surveillance, and system integration. Same-day when available.',
  path: '/services',
});

export default function ServicesIndexPage() {
  return (
    <>
      <Hero
        eyebrow="Services"
        title="Gate repair, maintenance, and the rest of the entry."
        subtitle="We repair gates, we maintain them, and we install new ones. Access control and cameras are part of the same visit when the property needs them."
        primaryCta={{ label: 'Book an advanced consultation', href: '/contact' }}
        secondaryCta={{ label: 'Industries we serve', href: '/industries' }}
      />

      <Section>
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />
          <Eyebrow>All services</Eyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
            Choose a service to learn more
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Not sure which services apply to your property?"
        body="Tell us what the gate is doing. We will say what applies and what does not."
        primaryCta={{ label: 'Book an advanced consultation', href: '/contact' }}
        secondaryCta={{ label: 'Browse Resources', href: '/resources' }}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Services', url: site.url + '/services' },
        ]}
      />
    </>
  );
}
