import Link from 'next/link';
import { Container } from './Container';

type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  align?: 'left' | 'center';
  variant?: 'home' | 'page';
};

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, align = 'left', variant = 'page' }: HeroProps) {
  return (
    <section className="fsc-page-hero fsc-navy">
      <Container>
        <div className={align === 'center' ? 'text-center mx-auto max-w-4xl' : 'max-w-4xl'}>
          {eyebrow && <p className="fsc-eyebrow mb-5">{eyebrow}</p>}
          <h1 className={`text-fsc-text leading-[1.12] ${variant === 'home' ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}>
            {title}
          </h1>
          <p className={`mt-6 text-base md:text-lg leading-relaxed text-fsc-text-dim max-w-3xl ${align === 'center' ? 'mx-auto' : ''}`}>
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className={`mt-8 flex flex-wrap gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
              {primaryCta && <Link href={primaryCta.href} className="fsc-btn-primary" data-fsc-event={primaryCta.href.startsWith('/contact') ? 'assessment_cta' : undefined} data-fsc-placement={primaryCta.href.startsWith('/contact') ? 'page_hero' : undefined}>{primaryCta.label}</Link>}
              {secondaryCta && <Link href={secondaryCta.href} className="fsc-btn-secondary">{secondaryCta.label}</Link>}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
