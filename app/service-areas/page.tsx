import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { LocationGrid } from '@/components/LocationGrid';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { locations } from '@/data/locations';
import { site } from '@/data/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Service Areas | Florida Security Systems, Statewide',
  description:
    'Service areas from our Clermont, Lake County base, including Orlando, Tampa, Lakeland, The Villages, Ocala, and the rest of Florida.',
  path: '/service-areas',
});

export default function ServiceAreasPage() {
  return (
    <>
      <Hero
        eyebrow="Service Areas"
        title="One team, serving all of Florida."
        subtitle="From our headquarters in Clermont, Lake County, we operate as one team — same credential standards, same response posture, same documentation across every site we touch."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <Section>
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]}
          />
          <Eyebrow>Coverage map</Eyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
            Cities we serve from Clermont, Lake County
          </h2>
          <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
            Every page below is a real local resource — services available, industries served, FAQ, and CTA tailored to the area. If your property sits between metros or just outside a listed city, we still serve it. Reach out for confirmation.
          </p>
          <div className="mt-10">
            <LocationGrid items={locations} />
          </div>
        </Container>
      </Section>

      <CTASection
        title="Working across multiple sites or metros?"
        body="We standardize credential platforms, escalation paths, and reporting across multi-site portfolios anywhere in Florida — one platform."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'Property Manager Industry', href: '/industries/property-managers' }}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Service Areas', url: site.url + '/service-areas' },
        ]}
      />
    </>
  );
}
