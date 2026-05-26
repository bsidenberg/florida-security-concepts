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
import {
  ServiceSchema,
  FAQSchema,
  BreadcrumbSchema,
} from '@/components/Schema';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import {
  services,
  servicesBySlug,
  getService,
} from '@/data/services';
import { industriesBySlug } from '@/data/industries';
import { site } from '@/data/site';

type Params = { params: { slug: string } };

export const dynamicParams = false;

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const svc = getService(params.slug);
  if (!svc) return {};
  return buildPageMetadata({
    title: svc.metaTitle,
    description: svc.metaDescription,
    path: `/services/${svc.slug}`,
    keywords: svc.keywords,
    ogType: 'article',
  });
}

export default function ServicePage({ params }: Params) {
  const svc = getService(params.slug);
  if (!svc) notFound();

  const related = svc.relatedServices
    .map((slug) => servicesBySlug[slug])
    .filter(Boolean);
  const relatedIndustries = svc.relatedIndustries
    .map((slug) => industriesBySlug[slug])
    .filter(Boolean);

  const url = `${site.url}/services/${svc.slug}`;
  const isEmergency = svc.slug === 'emergency-service';
  const ctaLabel = isEmergency
    ? 'Request emergency service'
    : `Request a ${svc.shortLabel.toLowerCase()} site assessment`;
  const ctaHref = isEmergency
    ? '/contact?urgency=emergency'
    : `/contact?service=${svc.slug}`;

  return (
    <>
      <Hero
        eyebrow={svc.eyebrow}
        title={svc.title}
        subtitle={svc.intro}
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'All services', href: '/services' }}
      />

      <Section tight>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: svc.shortLabel },
            ]}
          />

          {/* Direct answer (AEO/GEO) */}
          <div className="fsc-card p-7 md:p-9 max-w-4xl">
            <Eyebrow>Direct answer</Eyebrow>
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-fsc-text">
              {svc.directAnswer}
            </p>
          </div>
        </Container>
      </Section>

      {/* Capabilities */}
      <Section>
        <Container>
          <Eyebrow>Capabilities</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            What this service includes.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {svc.capabilities.map((c) => (
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

      {/* Who for + outcomes */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="fsc-card p-7 md:p-9">
              <Eyebrow>Who this is for</Eyebrow>
              <ul className="mt-5 space-y-3">
                {svc.whoFor.map((w) => (
                  <li key={w} className="flex items-start gap-3 text-sm md:text-base text-fsc-text">
                    <Bullet />
                    <span className="text-fsc-text-dim">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fsc-card p-7 md:p-9">
              <Eyebrow>What you get</Eyebrow>
              <ul className="mt-5 space-y-3">
                {svc.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-sm md:text-base">
                    <Check />
                    <span className="text-fsc-text-dim">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Process */}
      {svc.process && svc.process.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Process</Eyebrow>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              From assessment to a working system.
            </h2>
            <ol className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {svc.process.map((p, i) => (
                <li key={p.step} className="fsc-card p-6">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                    <span>Step {String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-fsc-text">
                    {p.step}
                  </h3>
                  <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
                    {p.body}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {/* Related industries */}
      {relatedIndustries.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Industries that use this service</Eyebrow>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              How this service applies across property types.
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedIndustries.map((i) => (
                <IndustryCard key={i.slug} industry={i} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section>
        <Container>
          <FAQ items={svc.faqs} defaultOpenFirst />
        </Container>
      </Section>

      {/* Lead capture */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <Eyebrow>Plan this service</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                Start with a site assessment.
              </h2>
              <p className="mt-4 text-base text-fsc-text-dim leading-relaxed">
                Tell us about the property — we use the assessment to scope the
                right kind of visit, not to push a generic quote.
              </p>
            </div>
            <div className="lg:col-span-7">
              <LeadCaptureForm
                defaults={{
                  service: defaultServiceLabel(svc.slug),
                  serviceSlug: svc.slug,
                }}
                submitLabel={ctaLabel}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related services */}
      {related.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Related services</Eyebrow>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              Often deployed together.
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <ServiceCard key={r.slug} service={r} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CTASection
        title={`Ready to scope ${svc.shortLabel.toLowerCase()} for your property?`}
        body="A short conversation gets to a realistic recommendation. We tell you what you don’t need, not just what you might want."
        primaryCta={{ label: ctaLabel, href: ctaHref }}
        secondaryCta={{ label: 'Browse Resources', href: '/resources' }}
      />

      <ServiceSchema
        name={svc.title}
        description={svc.metaDescription}
        url={url}
        serviceType={svc.shortLabel}
      />
      <FAQSchema items={svc.faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Services', url: site.url + '/services' },
          { name: svc.shortLabel, url },
        ]}
      />
    </>
  );
}

function Check() {
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

function Bullet() {
  return (
    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-fsc-accent-glow shrink-0" />
  );
}

// Map service slug to default form value (matches LeadCaptureForm option labels).
function defaultServiceLabel(slug: string): string | undefined {
  const map: Record<string, string> = {
    'security-gate-systems': 'New gate system',
    'gate-automation': 'Gate automation',
    'access-control': 'Access control',
    'video-surveillance': 'Video surveillance',
    'security-system-integration': 'Full security system integration',
    'emergency-service': 'Emergency repair',
  };
  return map[slug];
}
