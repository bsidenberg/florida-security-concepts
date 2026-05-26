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
import {
  ArticleSchema,
  FAQSchema,
  BreadcrumbSchema,
} from '@/components/Schema';
import { resources, getResource } from '@/data/resources';
import { servicesBySlug } from '@/data/services';
import { industriesBySlug } from '@/data/industries';
import { site } from '@/data/site';

type Params = { params: { slug: string } };

export const dynamicParams = false;

export async function generateStaticParams() {
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = getResource(params.slug);
  if (!r) return {};
  return buildPageMetadata({
    title: r.metaTitle,
    description: r.metaDescription,
    path: `/resources/${r.slug}`,
    keywords: r.keywords,
    ogType: 'article',
    publishedTime: r.publishedDate,
    modifiedTime: r.updatedDate,
  });
}

export default function ResourcePage({ params }: Params) {
  const r = getResource(params.slug);
  if (!r) notFound();

  const url = `${site.url}/resources/${r.slug}`;
  const relatedServices = r.relatedServices
    .map((s) => servicesBySlug[s])
    .filter(Boolean);
  const relatedIndustries = r.relatedIndustries
    .map((s) => industriesBySlug[s])
    .filter(Boolean);

  return (
    <>
      <Hero
        eyebrow="Resource · Guide"
        title={r.question}
        subtitle={r.intro}
        primaryCta={{
          label: 'Talk to a security systems specialist',
          href: '/contact',
        }}
        secondaryCta={{ label: 'All resources', href: '/resources' }}
      />

      <Section tight>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/resources' },
              { label: r.question },
            ]}
          />

          {/* Direct answer */}
          <div className="fsc-card p-7 md:p-9 max-w-4xl">
            <Eyebrow>The short answer</Eyebrow>
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-fsc-text">
              {r.shortAnswer}
            </p>
            <p className="mt-5 text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted">
              Updated {formatDate(r.updatedDate)} · {site.name}
            </p>
          </div>
        </Container>
      </Section>

      {/* Long-form sections */}
      <Section tight>
        <Container>
          <article className="prose-invert max-w-3xl">
            {r.sections.map((sec, i) => (
              <div key={i} className="mt-10 first:mt-0">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text leading-tight">
                  {sec.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {sec.body.map((p, j) => (
                    <p key={j} className="text-base text-fsc-text-dim leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="mt-3 space-y-2.5">
                      {sec.bullets.map((b, k) => (
                        <li
                          key={k}
                          className="flex items-start gap-3 text-base text-fsc-text-dim"
                        >
                          <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-fsc-accent-glow shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </article>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container>
          <FAQ items={r.faqs} defaultOpenFirst />
        </Container>
      </Section>

      {/* Related services */}
      {relatedServices.length > 0 && (
        <Section>
          <Container>
            <Eyebrow>Related services</Eyebrow>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
              Where to take this next.
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedServices.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Related industries (chips) */}
      {relatedIndustries.length > 0 && (
        <Section tight>
          <Container>
            <Eyebrow>Most relevant for</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2">
              {relatedIndustries.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/industries/${i.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-fsc-border-strong bg-fsc-surface/60 px-3.5 py-1.5 text-xs text-fsc-text hover:border-fsc-accent-glow hover:text-fsc-accent-glow transition"
                  >
                    {i.shortLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CTASection
        title="Want a recommendation specific to your property?"
        body="Guides answer general questions. A site assessment gets to the answer specific to your property — and what to do next."
        primaryCta={{
          label: 'Talk to a security systems specialist',
          href: '/contact',
        }}
        secondaryCta={{ label: 'View Services', href: '/services' }}
      />

      <ArticleSchema
        headline={r.question}
        description={r.metaDescription}
        url={url}
        datePublished={r.publishedDate}
        dateModified={r.updatedDate}
      />
      <FAQSchema items={r.faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: site.url + '/' },
          { name: 'Resources', url: site.url + '/resources' },
          { name: r.question, url },
        ]}
      />
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
