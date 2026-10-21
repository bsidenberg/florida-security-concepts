import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { GateRepairProcess } from '@/components/GateRepairProcess';
import { Container, Section, Eyebrow } from '@/components/Container';
import { BreadcrumbSchema, FAQSchema, HowToSchema, JsonLd } from '@/components/Schema';
import { gateRepairProcess } from '@/data/gateRepairProcess';
import type { OperatorPage } from '@/data/operatorPages';
import { site } from '@/data/site';
import { canonicalUrl } from '@/lib/seo/canonical';
import { answerLocalBusinessJsonLd, answerServiceJsonLd } from '@/lib/seo/localAnswer';

const PHONE_DISPLAY = '352-282-0692';

const RELATED = [
  { href: '/gate-operator-repair/clermont-fl', label: 'Gate operator repair in Clermont' },
  { href: '/service-areas/lake-county-fl', label: 'Lake County hub' },
  { href: '/gate-repair/clermont-fl', label: 'Gate repair in Clermont and Lake County' },
  { href: '/access-control/clermont-fl', label: 'Access control in Clermont' },
  { href: '/gate-repair/winter-garden-fl', label: 'Gate repair in Winter Garden' },
  { href: '/gate-repair/minneola-fl', label: 'Gate repair in Minneola' },
  { href: '/gate-repair/groveland-fl', label: 'Gate repair in Groveland' },
  { href: '/service-areas/montverde', label: 'Montverde' },
  { href: '/service-areas/minneola', label: 'Minneola' },
  { href: '/service-areas/groveland', label: 'Groveland' },
  { href: '/service-areas/orange-county', label: 'West Orange County' },
  { href: '/services/emergency-service', label: 'Emergency service' },
] as const;

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

export function OperatorRepairLinks({ currentPath }: { currentPath?: string }) {
  const links = RELATED.filter((link) => link.href !== currentPath);
  return (
    <Section>
      <Container>
        <Eyebrow>Clermont · Lake County</Eyebrow>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
          Gate operator repair
        </h2>
        <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
          Florida Security Concepts repairs LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators in Clermont, Minneola, Groveland, Montverde, and Winter Garden. Same-day when available. After-hours emergency service is by phone at {site.phoneDisplay}. An advanced consultation is the project call.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center rounded-full border border-fsc-border-strong bg-fsc-surface px-3.5 py-1.5 text-sm text-fsc-text hover:border-fsc-accent-glow hover:text-fsc-accent-glow"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function OperatorAnswerPage({ page }: { page: OperatorPage }) {
  const url = canonicalUrl(page.path);
  return (
    <>
      <section className="fsc-page-hero fsc-navy">
        <Container>
          <div className="max-w-4xl">
            <p className="fsc-eyebrow mb-5">{page.eyebrow}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-fsc-text leading-[1.12]">{page.h1}</h1>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-fsc-text-dim max-w-3xl">{page.directAnswer}</p>
            <ProjectCall placement="operator_hero" />
            <p className="mt-4 text-sm text-fsc-text-dim max-w-3xl">
              Book a project call through Booqer — available slots are confirmed instantly. The call is an advanced consultation. It does not dispatch a technician. If the gate is down, call {PHONE_DISPLAY}. Same-day when available.
            </p>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <Breadcrumbs
            items={page.breadcrumbs.map((crumb, index) => ({
              label: crumb.name,
              href: index === page.breadcrumbs.length - 1 ? undefined : crumb.path,
            }))}
          />
        </Container>
      </Section>

      {page.sections.map((section) => (
        <Section key={section.heading}>
          <Container>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              {section.heading}
            </h2>
            <div className="mt-6 max-w-3xl space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base md:text-lg leading-relaxed text-fsc-text-dim">
                  {paragraph}
                </p>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      <Section>
        <Container>
          <Eyebrow>Common symptoms</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
            What the gate is doing
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {page.symptoms.map((symptom) => (
              <div key={symptom.title} className="fsc-card p-6">
                <h3 className="text-base font-semibold text-fsc-text">{symptom.title}</h3>
                <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">{symptom.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <GateRepairProcess intro="Operator repair in Clermont and Lake County follows this sequence. The leaf, the loop detector, and the safety devices are part of the visit when they are why the operator faulted." />

      <Section>
        <Container>
          <Eyebrow>Answers</Eyebrow>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
            Questions about gate operator repair
          </h2>
          <div className="mt-8 max-w-3xl divide-y divide-fsc-border border-y border-fsc-border">
            {page.faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="text-lg font-semibold text-fsc-text">{faq.q}</h3>
                <p className="mt-2 text-base text-fsc-text-dim leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <OperatorRepairLinks currentPath={page.path} />

      <section className="fsc-shared-cta fsc-navy">
        <Container>
          <div className="max-w-3xl">
            <p className="fsc-eyebrow">Next step</p>
            <h2 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
              Book a project call
            </h2>
            <p className="mt-4 text-base md:text-lg text-fsc-text-dim leading-relaxed">
              Book a project call through Booqer — available slots are confirmed instantly. Tell us the city and what the operator is doing. Same-day when available if the gate is down: call {PHONE_DISPLAY}.
            </p>
            <ProjectCall placement="operator_footer" />
          </div>
        </Container>
      </section>

      <JsonLd
        data={answerLocalBusinessJsonLd({
          name: site.name,
          description: page.metaDescription,
          url,
          areaServed: page.areaServed,
        })}
      />
      <JsonLd
        data={answerServiceJsonLd({
          name: page.h1,
          description: page.metaDescription,
          url,
          serviceType: page.serviceType,
          areaServed: page.areaServed,
        })}
      />
      <HowToSchema
        name={gateRepairProcess.name}
        description={gateRepairProcess.description}
        steps={gateRepairProcess.steps.map((step) => ({ name: step.name, text: step.text }))}
      />
      <FAQSchema items={page.faqs} />
      <BreadcrumbSchema
        items={page.breadcrumbs.map((crumb) => ({
          name: crumb.name,
          url: canonicalUrl(crumb.path),
        }))}
      />
    </>
  );
}
