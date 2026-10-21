import { Container, Section, Eyebrow } from '@/components/Container';
import { googleReviewsUrl, reviews } from '@/data/reviews';
import { site } from '@/data/site';

function profileUrl(): string {
  return (googleReviewsUrl || site.social.google || '').trim();
}

/**
 * Renders real reviews from data/reviews.ts. With no reviews and no Google
 * Business Profile URL, it renders nothing. It does not emit review schema.
 */
export function Reviews({ className = '' }: { className?: string }) {
  const url = profileUrl();
  if (reviews.length === 0 && !url) return null;

  return (
    <Section className={className}>
      <Container>
        <Eyebrow>Reviews</Eyebrow>
        <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
          What customers have said
        </h2>
        {reviews.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((review) => (
              <li key={`${review.attribution}:${review.quote.slice(0, 24)}`} className="fsc-card p-6">
                <blockquote className="text-base text-fsc-text leading-relaxed">{review.quote}</blockquote>
                <p className="mt-4 text-sm text-fsc-text-dim">
                  {review.attribution}
                  {review.source ? ` · ${review.source}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
        {url && (
          <p className="mt-8">
            <a
              href={url}
              className="fsc-text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              See our reviews on Google
            </a>
          </p>
        )}
      </Container>
    </Section>
  );
}
