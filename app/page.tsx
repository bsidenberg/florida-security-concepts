import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { CapabilityBar } from '@/components/CapabilityBar';
import { Container, Section, Eyebrow } from '@/components/Container';
import { ServiceCard } from '@/components/ServiceCard';
import { IndustryCard } from '@/components/IndustryCard';
import { LocationGrid } from '@/components/LocationGrid';
import { CTASection } from '@/components/CTASection';
import { FAQ } from '@/components/FAQ';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { FAQSchema } from '@/components/Schema';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
import { locations } from '@/data/locations';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: `${site.name} | Advanced Security Systems for Central Florida & Tampa Bay`,
  description: site.tagline,
  alternates: { canonical: '/' },
};

const homeFaqs = [
  {
    q: 'What kinds of properties does Florida Security Concepts work with?',
    a: 'HOAs and gated communities, multifamily and condominium properties, storage facilities, commercial and industrial sites, property management portfolios, and high-value residential estates across Central Florida and Tampa Bay.',
  },
  {
    q: 'Do you only install gates, or do you also handle access control and cameras?',
    a: 'We design and integrate gates, access control, video surveillance, and ongoing service as one coordinated system. Most properties get more value from an integrated system than from any single product.',
  },
  {
    q: 'Do you offer emergency or same-day service?',
    a: '24/7 emergency support is available, with same-day service when scheduling and travel allow. Emergency requests are triaged on intake.',
  },
  {
    q: 'Where do you operate?',
    a: 'Across Central Florida and Tampa Bay — including Orlando, Tampa, Lakeland, Kissimmee, Winter Garden, Clermont, Lake Mary, Sanford, Ocala, The Villages, St. Petersburg, Clearwater, Brandon, and Wesley Chapel.',
  },
];

export default function HomePage() {
  return (
    <>
      <Hero
        variant="home"
        eyebrow="Central Florida · Tampa Bay"
        title="Advanced Security Gates, Access Control & Surveillance for Central Florida and Tampa Bay"
        subtitle="Florida Security Concepts designs, installs, services, and integrates gate automation, access control, video surveillance, and full-site security systems for communities, businesses, storage facilities, and high-value properties."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <CapabilityBar />

      {/* Systems integrator positioning */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Positioning</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Security systems built as infrastructure — not bolted on.
              </h2>
              <p className="mt-5 text-base md:text-lg text-fsc-text-dim leading-relaxed">
                We treat gates, credentials, cameras, and ongoing service as one
                system. The credential database, event timeline, and escalation
                path on your property are decisions — not the byproducts of
                three vendors meeting at a gate post.
              </p>
              <div className="mt-7">
                <Link href="/services/security-system-integration" className="fsc-btn-secondary">
                  How integration works
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Designed, not assembled',
                  body: 'Operator class, safety devices, credential model, and camera scenes specified together — sized to the property’s real cycles and incidents.',
                },
                {
                  title: 'One credential layer',
                  body: 'Residents, vendors, employees, and guests handled as distinct populations across every gate and door.',
                },
                {
                  title: 'A unified timeline',
                  body: 'Camera, access, and gate events on a single timeline so investigations finish in minutes — not days.',
                },
                {
                  title: 'Lifecycle service',
                  body: 'Documented escalation, scheduled checks, and same-day emergency response when scheduling and travel allow.',
                },
              ].map((item) => (
                <div key={item.title} className="fsc-card p-6">
                  <h3 className="text-base font-semibold text-fsc-text">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Core services grid */}
      <Section>
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <Eyebrow>Core services</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Gates, access, surveillance, integration — and 24/7 service behind all of it.
              </h2>
            </div>
            <Link href="/services" className="fsc-btn-secondary">
              All services
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Industries served */}
      <Section>
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <Eyebrow>Industries we serve</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Engineered for the way your property actually operates.
              </h2>
              <p className="mt-4 text-base text-fsc-text-dim leading-relaxed">
                Each industry has its own credential populations, traffic patterns, and incident profile. We design systems around them — not around generic templates.
              </p>
            </div>
            <Link href="/industries" className="fsc-btn-secondary">
              All industries
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((i) => (
              <IndustryCard key={i.slug} industry={i} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Service areas */}
      <Section>
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <Eyebrow>Service Areas</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                A regional team across Central Florida and Tampa Bay.
              </h2>
            </div>
            <Link href="/service-areas" className="fsc-btn-secondary">
              All areas
            </Link>
          </div>
          <LocationGrid items={locations} />
        </Container>
      </Section>

      {/* Emergency banner */}
      <CTASection
        eyebrow="Emergency · 24/7"
        title="Gate down? Access control offline? We respond fast."
        body="Same-day service when scheduling and travel allow. Documented response, honest diagnosis, and a system returned to a known-good state — not just the symptom."
        primaryCta={{
          label: 'Request Emergency Service',
          href: '/contact?urgency=emergency',
        }}
        secondaryCta={{
          label: 'How emergency service works',
          href: '/services/emergency-service',
        }}
        variant="emergency"
      />

      {/* Lead capture */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Site Assessment</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Tell us about your property.
              </h2>
              <p className="mt-5 text-base text-fsc-text-dim leading-relaxed">
                A short request form is enough to get the conversation started.
                We use it to scope the right kind of site visit — not to push you
                into a generic quote.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-fsc-text-dim">
                {[
                  'Same-day response on most assessment requests',
                  'No pressure to commit before the site visit',
                  'Honest scope — including what you don’t need',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckIcon /> <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <LeadCaptureForm />
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ preview */}
      <Section>
        <Container>
          <FAQ items={homeFaqs} defaultOpenFirst />
          <FAQSchema items={homeFaqs} />
        </Container>
      </Section>

      {/* Final CTA */}
      <CTASection
        title="Plan an integrated security system for your property."
        body="Gate, credential, camera, and service infrastructure designed around how your property actually controls vehicles, visitors, vendors, residents, and after-hours access."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'Browse Resources', href: '/resources' }}
      />
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-1 text-fsc-accent-glow shrink-0"
      aria-hidden
    >
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
