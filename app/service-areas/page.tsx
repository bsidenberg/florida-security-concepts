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
  title: 'Service Areas | Orlando, Kissimmee, Winter Garden, Clermont, Tampa Bay',
  description:
    'Gate, access-control, and camera service from Clermont. Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay.',
  path: '/service-areas',
});

export default function ServiceAreasPage() {
  return (
    <>
      <Hero
        eyebrow="Service Areas"
        title="Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay."
        subtitle="We are based in Clermont, Lake County. These are the areas we schedule. If your property is in one of them, tell us the city and the equipment."
        primaryCta={{ label: 'Book an advanced consultation', href: '/contact' }}
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
            Orlando, Kissimmee, Winter Garden, and Clermont are scheduled from our Lake County base, along with Tampa Bay. If your property is between those cities, tell us where it is and we will say whether we can take the drive.
          </p>
          <div className="mt-10">
            <LocationGrid items={locations} />
          </div>
        </Container>
      </Section>

      <CTASection
        title="Working across multiple sites or metros?"
        body="We can use the same credentials, the same service notes, and the same call number across more than one site in this area."
        primaryCta={{ label: 'Book an advanced consultation', href: '/contact' }}
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
