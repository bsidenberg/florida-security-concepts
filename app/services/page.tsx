import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { ServiceCard } from '@/components/ServiceCard';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { services } from '@/data/services';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Security Services | Gates, Access Control, Surveillance & Integration',
  description:
    'Florida Security Concepts services — security gate systems, gate automation, access control, video surveillance, system integration, and 24/7 emergency support.',
  alternates: { canonical: '/services' },
};

export default function ServicesIndexPage() {
  return (
    <>
      <Hero
        eyebrow="Services"
        title="Security services engineered for the way your property actually operates."
        subtitle="Each service below is designed to integrate with the others — credential, camera, gate, and service systems built as one platform across Central Florida and Tampa Bay."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
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
        body="A short site assessment gets to a realistic recommendation faster than any quote — and tells you what you don’t need, not just what you might want."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
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
