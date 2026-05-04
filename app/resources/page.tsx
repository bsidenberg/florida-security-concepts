import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Container, Section, Eyebrow } from '@/components/Container';
import { CTASection } from '@/components/CTASection';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BreadcrumbSchema } from '@/components/Schema';
import { resources } from '@/data/resources';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Resources & Learning Center | Security System Guides',
  description:
    'Practical guides on security gate cost, access control for HOAs, storage facility cameras, and more — written for Central Florida and Tampa Bay properties.',
  alternates: { canonical: '/resources' },
};

export default function ResourcesIndexPage() {
  return (
    <>
      <Hero
        eyebrow="Resources · Learning Center"
        title="Practical answers to the security questions properties actually ask."
        subtitle="Direct, jargon-free guides on gate cost, access control, storage cameras, integration, and what property managers should look for."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <Section>
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Resources' }]} />
          <Eyebrow>All resources</Eyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
            Read by topic
          </h2>
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/resources/${r.slug}`}
                  className="fsc-card fsc-card-hover group block p-6 h-full"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                      Guide
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted">
                      Updated {formatDate(r.updatedDate)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base md:text-lg font-semibold text-fsc-text leading-snug">
                    {r.question}
                  </h3>
                  <p className="mt-3 text-sm text-fsc-text-dim leading-relaxed line-clamp-3">
                    {r.shortAnswer}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                    Read guide
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CTASection
        title="Want a recommendation specific to your property?"
        body="Resources answer general questions. A site assessment gets to the answer specific to your property — and what to do next."
        primaryCta={{ label: 'Request Site Assessment', href: '/contact' }}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Resources', url: site.url + '/resources' },
        ]}
      />
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}
