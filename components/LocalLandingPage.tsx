import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { GateRepairProcess } from '@/components/GateRepairProcess';
import { Container, Section, Eyebrow } from '@/components/Container';
import { BreadcrumbSchema, FAQSchema, HowToSchema, JsonLd } from '@/components/Schema';
import { gateRepairProcess, showsLakeCountyGateRepairProcess } from '@/data/gateRepairProcess';
import { OperatorRepairLinks } from '@/components/OperatorAnswerPage';
import { site } from '@/data/site';
import {
  getLocalLanding,
  landingsFor,
  type LocalLanding,
  type LocalServiceKey,
} from '@/data/localLandings';
import { canonicalUrl } from '@/lib/seo/canonical';
import { answerLocalBusinessJsonLd } from '@/lib/seo/localAnswer';
import { BUSINESS_ID } from '@/lib/seo/structuredData';

const PHONE_DISPLAY = '352-282-0692';

function serviceLabel(service: LocalServiceKey): string {
  if (service === 'gate-repair') return 'Gate repair';
  if (service === 'security-cameras') return 'Security cameras';
  return 'Access control';
}

function ProjectCall({ placement }: { placement: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <a className="fsc-btn-primary" href={site.booking.bookUrl} target="_blank" rel="noopener noreferrer" data-fsc-placement={placement}>
        {site.booking.label}
      </a>
      <a className="fsc-btn-secondary" href={`tel:${site.phone}`}>
        {PHONE_DISPLAY}
      </a>
    </div>
  );
}

export function ServiceAreaLinks({
  service,
  currentSlug,
  heading = 'Service areas',
  eyebrow,
}: {
  service: LocalServiceKey;
  currentSlug?: string;
  heading?: string;
  eyebrow?: string;
}) {
  const pages = landingsFor(service);
  const eyebrowText = eyebrow ?? serviceLabel(service);
  return (
    <Section>
      <Container>
        <Eyebrow>{eyebrowText}</Eyebrow>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">{heading}</h2>
        <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
          Clermont and Lake County are home base. The same service is also published for Orlando, Kissimmee, Winter Garden, and Tampa Bay — each with its own page, because the hardware does not fail the same way in each place.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {pages.map((page) => (
            <li key={page.path}>
              <Link
                href={page.path}
                aria-current={page.slug === currentSlug ? 'page' : undefined}
                className="inline-flex items-center rounded-full border border-fsc-border-strong bg-fsc-surface px-3.5 py-1.5 text-sm text-fsc-text hover:border-fsc-accent-glow hover:text-fsc-accent-glow"
              >
                {page.areaLabel}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function localServiceJsonLd(landing: LocalLanding) {
  const url = canonicalUrl(landing.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: landing.h1,
    serviceType: landing.serviceType,
    description: landing.metaDescription,
    url,
    areaServed: landing.areaServed,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      '@id': BUSINESS_ID,
    },
  };
}

export function LocalLandingView({ landing }: { landing: LocalLanding }) {
  const url = canonicalUrl(landing.path);
  const otherService: LocalServiceKey = landing.service === 'gate-repair' ? 'access-control' : landing.service === 'security-cameras' ? 'access-control' : 'gate-repair';
  const counterpart = getLocalLanding(otherService, landing.slug);
  const otherLabel = serviceLabel(otherService);
  const isCameras = landing.service === 'security-cameras';
  const showRepairProcess = showsLakeCountyGateRepairProcess(landing.service, landing.slug);

  return (
    <>
      <section className="fsc-page-hero fsc-navy">
        <Container>
          <div className="max-w-4xl">
            <p className="fsc-eyebrow mb-5">{landing.eyebrow}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-fsc-text leading-[1.12]">{landing.h1}</h1>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-fsc-text-dim max-w-3xl">{landing.intro}</p>
            <ProjectCall placement="local_hero" />
            <p className="mt-4 text-sm text-fsc-text-dim max-w-3xl">
              The call is an advanced consultation about this property. It is not a dispatched visit, and it does not require a street address to get on the calendar — city and county are enough to confirm the area.
            </p>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: landing.parentServiceLabel, href: `/services/${landing.parentServiceSlug}` },
              { label: landing.areaLabel },
            ]}
          />
          <div className="fsc-card p-7 md:p-9 max-w-4xl">
            <Eyebrow>Local context</Eyebrow>
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-fsc-text">{landing.localContext}</p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Eyebrow>Florida weather</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            {landing.conditionsHeading}
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {landing.conditions.map((item) => (
              <div key={item.title} className="fsc-card p-6">
                <h3 className="text-base font-semibold text-fsc-text">{item.title}</h3>
                <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <Eyebrow>Before you call</Eyebrow>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
                What to check before calling
              </h2>
              <ul className="mt-6 space-y-4">
                {landing.beforeYouCall.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm md:text-base text-fsc-text-dim">
                    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-fsc-accent-glow shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fsc-card p-7 md:p-9">
              <Eyebrow>On the visit</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fsc-text leading-tight">{landing.optionsHeading}</h2>
              <div className="mt-6 space-y-5">
                {landing.options.map((option) => (
                  <div key={option.title}>
                    <h3 className="text-base font-semibold text-fsc-text">{option.title}</h3>
                    <p className="mt-1 text-sm text-fsc-text-dim leading-relaxed">{option.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {showRepairProcess && (
        <GateRepairProcess intro="On a gate we schedule from Clermont, the visit follows this sequence. We repair the operator, the leaf and hardware, the loop detector, and the safety devices only when they apply to that entrance." />
      )}

      {landing.operatorCoverage && landing.operatorCoverage.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Operators</Eyebrow>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              Gate operators we service here
            </h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              {landing.operatorCoverage.map((item) => (
                <div key={item.title} className="fsc-card p-6">
                  <h3 className="text-base font-semibold text-fsc-text">{item.title}</h3>
                  <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {landing.faqs && landing.faqs.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Answers</Eyebrow>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
              Questions about {serviceLabel(landing.service).toLowerCase()} in {landing.areaLabel}
            </h2>
            <div className="mt-8 max-w-3xl divide-y divide-fsc-border border-y border-fsc-border">
              {landing.faqs.map((faq) => (
                <div key={faq.q} className="py-6">
                  <h3 className="text-lg font-semibold text-fsc-text">{faq.q}</h3>
                  <p className="mt-2 text-base text-fsc-text-dim leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <ServiceAreaLinks service={landing.service} currentSlug={landing.slug} />

      {landing.path === '/gate-repair/clermont-fl' && <OperatorRepairLinks currentPath={landing.path} />}

      {counterpart && (
        <Section tight>
          <Container>
            <p className="text-base text-fsc-text-dim">
              {otherLabel} for this area is a separate page:{' '}
              <Link href={counterpart.path} className="underline text-fsc-accent-glow">
                {counterpart.h1}
              </Link>
              .
            </p>
          </Container>
        </Section>
      )}

      <section className="fsc-shared-cta fsc-navy">
        <Container>
          <div className="max-w-3xl">
            <p className="fsc-eyebrow">Next step</p>
            <h2 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
              Book a project call
            </h2>
            <p className="mt-4 text-base md:text-lg text-fsc-text-dim leading-relaxed">
              {isCameras ? 'Tell us the city, the scenes you need to see, and whether you need a new camera system or a fix to an existing one.' : 'Tell us the city, what the entrance is doing, and whether you need gate repair, access control, or both.'} We will confirm that {landing.areaLabel} is in the area and schedule an advanced consultation.
            </p>
            <ProjectCall placement="local_footer" />
          </div>
        </Container>
      </section>

      <JsonLd data={localServiceJsonLd(landing)} />
      {showRepairProcess && (
        <HowToSchema
          name={gateRepairProcess.name}
          description={gateRepairProcess.description}
          steps={gateRepairProcess.steps.map((step) => ({ name: step.name, text: step.text }))}
        />
      )}
      {landing.faqs && landing.faqs.length > 0 && (
        <JsonLd
          data={answerLocalBusinessJsonLd({
            name: site.name,
            description: landing.metaDescription,
            url,
            areaServed: landing.areaServed,
          })}
        />
      )}
      {landing.faqs && landing.faqs.length > 0 && <FAQSchema items={landing.faqs} />}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: canonicalUrl('/') },
          { name: landing.parentServiceLabel, url: canonicalUrl(`/services/${landing.parentServiceSlug}`) },
          { name: landing.areaLabel, url },
        ]}
      />
    </>
  );
}
