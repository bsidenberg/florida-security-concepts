import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  LeadCaptureForm,
  type LeadFormDefaults,
} from '@/components/LeadCaptureForm';
import { ContactPageSchema, BreadcrumbSchema } from '@/components/Schema';
import { site, hasPhone, hasEmail } from '@/data/site';
import { getService } from '@/data/services';
import { getIndustry } from '@/data/industries';
import { getLocation } from '@/data/locations';

export const metadata: Metadata = {
  title: 'Contact | Request a Site Assessment',
  description:
    'Request a site assessment from Florida Security Concepts — gate, access control, surveillance, and integrated security systems for Central Florida and Tampa Bay.',
  alternates: { canonical: '/contact' },
};

// Map slug-style query params back to the form's option labels.
const SERVICE_LABELS: Record<string, string> = {
  'security-gate-systems': 'New gate system',
  'gate-automation': 'Gate automation',
  'access-control': 'Access control',
  'video-surveillance': 'Video surveillance',
  'security-system-integration': 'Full security system integration',
  'emergency-service': 'Emergency repair',
};

const INDUSTRY_PROPERTY_TYPES: Record<string, string> = {
  'hoa-gated-communities': 'HOA / gated community',
  'multifamily-apartments-condos': 'Multifamily / apartment / condo',
  'storage-facilities': 'Storage facility',
  'commercial-properties': 'Commercial property',
  'industrial-warehouses': 'Industrial / warehouse',
  'property-managers': 'Other',
  'residential-estates': 'Residential / estate',
};

const URGENCY_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  'this-week': 'This week',
  thisweek: 'This week',
  'this-month': 'This month',
  thismonth: 'This month',
  planning: 'Planning / budgeting',
  'planning-budgeting': 'Planning / budgeting',
};

const KNOWN_FORM_CITIES = new Set([
  'Orlando',
  'Tampa',
  'Lakeland',
  'Kissimmee',
  'Winter Garden',
  'Clermont',
  'Lake Mary',
  'Sanford',
  'Ocala',
  'The Villages',
  'St. Petersburg',
  'Clearwater',
  'Brandon',
  'Wesley Chapel',
]);

function pickParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0]?.trim();
  return value.trim();
}

function buildDefaults(searchParams?: {
  [key: string]: string | string[] | undefined;
}): { defaults: LeadFormDefaults; intro?: string } {
  const defaults: LeadFormDefaults = {};
  if (!searchParams) return { defaults };

  const serviceParam = pickParam(searchParams.service);
  if (serviceParam) {
    const svc = getService(serviceParam);
    if (svc) {
      defaults.serviceSlug = svc.slug;
      defaults.service = SERVICE_LABELS[svc.slug];
    }
  }

  const industryParam = pickParam(searchParams.industry);
  if (industryParam) {
    const ind = getIndustry(industryParam);
    if (ind) {
      defaults.industrySlug = ind.slug;
      defaults.propertyType = INDUSTRY_PROPERTY_TYPES[ind.slug];
    }
  }

  const locationParam = pickParam(searchParams.location);
  if (locationParam) {
    const loc = getLocation(locationParam);
    if (loc) {
      defaults.locationSlug = loc.slug;
      defaults.city = KNOWN_FORM_CITIES.has(loc.city) ? loc.city : 'Other';
    }
  }

  const urgencyParam = pickParam(searchParams.urgency)?.toLowerCase();
  if (urgencyParam && URGENCY_LABELS[urgencyParam]) {
    defaults.urgency = URGENCY_LABELS[urgencyParam];
  }

  let intro: string | undefined;
  if (defaults.urgency === 'Emergency') {
    intro =
      'Tell us what is happening. Emergency requests are triaged on intake — we respond fast.';
  } else if (defaults.serviceSlug) {
    const svc = getService(defaults.serviceSlug);
    if (svc) intro = `We’ve preselected ${svc.shortLabel.toLowerCase()} for you — adjust anything that needs changing.`;
  } else if (defaults.locationSlug) {
    const loc = getLocation(defaults.locationSlug);
    if (loc) intro = `Tell us about your ${loc.city} property and we’ll route the request locally.`;
  } else if (defaults.industrySlug) {
    const ind = getIndustry(defaults.industrySlug);
    if (ind) intro = `Tell us about your ${ind.shortLabel.toLowerCase()} property — we’ll scope the right kind of site visit.`;
  }

  return { defaults, intro };
}

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { defaults, intro } = buildDefaults(searchParams);
  const isEmergency = defaults.urgency === 'Emergency';

  return (
    <>
      <Hero
        align="center"
        eyebrow={isEmergency ? 'Emergency · Site Assessment' : 'Contact · Site Assessment'}
        title={isEmergency ? 'Request emergency service.' : 'Tell us about your property.'}
        subtitle={
          intro ||
          'A short request form is enough to get the conversation started. We use it to scope the right kind of site visit — not to push you into a generic quote.'
        }
      />

      <Section tight>
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <aside className="lg:col-span-4 space-y-6">
              {(hasPhone() || hasEmail()) && (
                <div className="fsc-card p-6">
                  <p className="text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow mb-2">
                    Reach us directly
                  </p>
                  <h3 className="text-base font-semibold text-fsc-text">
                    Prefer to call or email?
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-fsc-text-dim">
                    {hasPhone() && (
                      <li>
                        <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-text-muted">
                          Phone
                        </span>{' '}
                        ·{' '}
                        <a
                          href={`tel:${site.phone}`}
                          className="text-fsc-text hover:text-fsc-accent-glow"
                        >
                          {site.phoneDisplay}
                        </a>
                      </li>
                    )}
                    {hasEmail() && (
                      <li>
                        <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-text-muted">
                          Email
                        </span>{' '}
                        ·{' '}
                        <a
                          href={`mailto:${site.email}`}
                          className="text-fsc-text hover:text-fsc-accent-glow break-all"
                        >
                          {site.email}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <InfoCard
                eyebrow="Coverage"
                title="Central Florida & Tampa Bay"
                body={site.serviceAreaSummary}
              />
              <InfoCard
                eyebrow="Hours"
                title="24/7 emergency support"
                body={site.hours}
              />
              {!isEmergency && (
                <div className="fsc-card p-6">
                  <p className="text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-warn mb-2">
                    Emergency
                  </p>
                  <h3 className="text-base font-semibold text-fsc-text">
                    Need emergency service now?
                  </h3>
                  <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
                    For a stuck gate, failed access control, or system outage,
                    request emergency service so we can triage and dispatch faster.
                  </p>
                  <Link
                    href="/contact?urgency=emergency"
                    className="fsc-btn-emergency mt-5 px-4 py-2"
                  >
                    Request Emergency Service
                  </Link>
                </div>
              )}
              <div className="fsc-card p-6">
                <p className="text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow mb-2">
                  What to expect
                </p>
                <ul className="space-y-2.5 text-sm text-fsc-text-dim">
                  <li className="flex items-start gap-3">
                    <Step n="1" />
                    <span>You submit a short request — we review the same business day.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Step n="2" />
                    <span>A short scoping call to confirm the right kind of site visit.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Step n="3" />
                    <span>On-site assessment, then a documented recommendation.</span>
                  </li>
                </ul>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <LeadCaptureForm
                defaults={defaults}
                submitLabel={
                  isEmergency ? 'Request Emergency Service' : 'Submit Request'
                }
              />
            </div>
          </div>
        </Container>
      </Section>

      <ContactPageSchema url={site.url + '/contact'} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Contact', url: site.url + '/contact' },
        ]}
      />
    </>
  );
}

function InfoCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="fsc-card p-6">
      <p className="text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow mb-2">
        {eyebrow}
      </p>
      <h3 className="text-base font-semibold text-fsc-text">{title}</h3>
      <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n }: { n: string }) {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-fsc-accent/40 bg-fsc-accent/10 text-[10px] font-mono text-fsc-accent-glow shrink-0">
      {n}
    </span>
  );
}
