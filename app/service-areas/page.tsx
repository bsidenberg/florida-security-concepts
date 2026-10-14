import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { LocationGrid } from '@/components/LocationGrid';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { locations } from '@/data/locations';
import { ServiceAreaLinks } from '@/components/LocalLandingPage';
import { canonicalUrl } from '@/lib/seo/canonical';

export const metadata: Metadata = {
  title: 'Service Areas | Clermont, Lake County, Orlando & Tampa Bay',
  description:
    'Florida Security Concepts service areas — Clermont and Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay. Gate repair and access control pages for each.',
  alternates: { canonical: canonicalUrl('/service-areas') },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Areas | Clermont, Lake County, Orlando & Tampa Bay',
    description:
      'Florida Security Concepts service areas — Clermont and Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay. Gate repair and access control pages for each.',
  },
};

export default function ServiceAreasPage() {
  return (
    <>
      <Hero
        eyebrow="Service Areas"
        title="Based in Clermont and Lake County."
        subtitle="Gate repair and access control for Clermont and Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay. Same documentation on every entrance we take on."
        primaryCta={{ label: 'Request an advanced consultation', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <ServiceAreaLinks service="gate-repair" heading="Gate repair" eyebrow="Service areas" />
      <ServiceAreaLinks service="access-control" heading="Access control" eyebrow="Service areas" />

      <Section>
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]}
          />
          <Eyebrow>Community pages</Eyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
            Other community pages already on the site
          </h2>
          <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
            Gate repair and access control are written up for five areas: Clermont and Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay. The pages below are older community notes. If your property is outside those five, ask before assuming we can schedule it.
          </p>
          <div className="mt-10">
            <LocationGrid items={locations} />
          </div>
        </Container>
      </Section>

      <CTASection
        title="Working across multiple sites or metros?"
        body="We standardize credential platforms, escalation paths, and reporting across properties in Clermont, Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay."
        primaryCta={{ label: 'Request an advanced consultation', href: '/contact' }}
        secondaryCta={{ label: 'Property Manager Industry', href: '/industries/property-managers' }}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: canonicalUrl('/') },
          { name: 'Service Areas', url: canonicalUrl('/service-areas') },
        ]}
      />
    </>
  );
}
