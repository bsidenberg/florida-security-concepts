import Link from 'next/link';
import { Container, Section, Eyebrow } from '@/components/Container';

export default function NotFound() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>404 · Not found</Eyebrow>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-fsc-text leading-tight">
            That page isn’t here.
          </h1>
          <p className="mt-4 text-base md:text-lg text-fsc-text-dim leading-relaxed">
            The link may be outdated, the page may have moved, or it may never
            have existed. Try one of the links below — or request a site
            assessment if you came here for help.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="fsc-btn-primary">
              Go home
            </Link>
            <Link href="/services" className="fsc-btn-secondary">
              View services
            </Link>
            <Link href="/contact" className="fsc-btn-secondary">
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
