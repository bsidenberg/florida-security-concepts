import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CTASection } from '@/components/CTASection';
import { BreadcrumbSchema } from '@/components/Schema';
import { site } from '@/data/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Florida Security Concepts | Central Florida Gates, Access Control & Cameras',
  description:
    'Florida Security Concepts LLC is a Central Florida gate, access control, and camera company based in Clermont, Lake County.',
  path: '/about',
});

// TODO(Brian): add team photos and confirmed titles. Names only until then; no bios.
const team = ['Brian Sidenberg', 'Jeff Hicks', 'Caleb Illig'];

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About us"
        title="Florida Security Concepts"
        subtitle="A Central Florida gate, access control, and camera company based in Clermont, Lake County."
        primaryCta={{ label: 'Schedule a Site Visit', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />
      <Section>
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
          <div className="max-w-3xl space-y-5 text-base leading-relaxed text-fsc-text-dim">
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">Gates, access control, and cameras for Central Florida properties.</h2>
            <p>{site.legalName} repairs, maintains, and installs the gates, access-control systems, call boxes, and cameras that commercial and residential properties use every day. We work with HOAs and community development districts, multifamily, storage facilities, commercial and industrial sites, and estates.</p>
            <p>We are based in Clermont, Lake County, and schedule work across <Link href="/service-areas" className="underline">Central Florida and Tampa Bay</Link>. Same-day when available. If a gate is down, call <a className="underline" href={`tel:${site.phone}`}>{site.phoneDisplay}</a>.</p>
          </div>
          <div className="mt-12">
            <Eyebrow>Our team</Eyebrow>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {team.map((name) => (
                <li key={name} className="rounded-lg border border-black/10 p-6">
                  {/* TODO: team photo */}
                  <p className="text-lg font-semibold text-fsc-text">{name}</p>
                  {/* TODO: title */}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
      <CTASection title="Tell us about your property." body="We start with an advanced consultation about the gate and the entry you actually have." />
      <BreadcrumbSchema items={[{ name: 'Home', url: site.url + '/' }, { name: 'About', url: site.url + '/about' }]} />
    </>
  );
}
