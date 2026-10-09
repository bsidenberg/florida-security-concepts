import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from './Container';

type CTAProps = {
  eyebrow?: string;
  title: string;
  body?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: 'default' | 'emergency';
};

function CtaLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const props = {
    className,
    'data-fsc-event': href.startsWith('/contact') ? 'assessment_cta' : undefined,
    'data-fsc-placement': href.startsWith('/contact') ? 'cta_section' : undefined,
  };
  if (href.startsWith('tel:') || href.startsWith('mailto:')) return <a href={href} {...props}>{children}</a>;
  return <Link href={href} {...props}>{children}</Link>;
}

export function CTASection({ eyebrow = 'Next step', title, body, primaryCta = { label: 'Book an advanced consultation', href: '/contact' }, secondaryCta, variant = 'default' }: CTAProps) {
  return (
    <section className={`fsc-shared-cta fsc-navy ${variant === 'emergency' ? 'fsc-shared-cta-emergency' : ''}`}>
      <Container>
        <div className="max-w-3xl">
          <p className={`fsc-eyebrow ${variant === 'emergency' ? 'text-fsc-warn' : ''}`}>{eyebrow}</p>
          <h2 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">{title}</h2>
          {body && <p className="mt-4 text-base md:text-lg text-fsc-text-dim leading-relaxed">{body}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryCta && <CtaLink href={primaryCta.href} className={variant === 'emergency' ? 'fsc-btn-emergency px-5 py-3' : 'fsc-btn-primary'}>{primaryCta.label}</CtaLink>}
            {secondaryCta && <CtaLink href={secondaryCta.href} className="fsc-btn-secondary">{secondaryCta.label}</CtaLink>}
          </div>
        </div>
      </Container>
    </section>
  );
}
