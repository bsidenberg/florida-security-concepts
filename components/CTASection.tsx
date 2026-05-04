import Link from 'next/link';
import { Container } from './Container';

type CTAProps = {
  eyebrow?: string;
  title: string;
  body?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: 'default' | 'emergency';
};

export function CTASection({
  eyebrow = 'Next step',
  title,
  body,
  primaryCta = { label: 'Request Site Assessment', href: '/contact' },
  secondaryCta,
  variant = 'default',
}: CTAProps) {
  return (
    <section className="relative">
      <Container>
        <div
          className={`relative overflow-hidden rounded-2xl border ${
            variant === 'emergency'
              ? 'border-fsc-warn/30 bg-gradient-to-br from-fsc-warn/10 via-fsc-surface to-fsc-bg'
              : 'border-fsc-border-strong bg-gradient-to-br from-fsc-surface-2 via-fsc-surface to-fsc-bg'
          } p-10 md:p-14`}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-50 fsc-grid-bg [mask-image:radial-gradient(ellipse_at_right,#000,transparent_70%)]"
          />
          <div
            aria-hidden
            className={`absolute -top-32 -right-24 h-80 w-80 rounded-full ${
              variant === 'emergency' ? 'bg-fsc-warn/15' : 'bg-fsc-accent/15'
            } blur-3xl`}
          />
          <div className="relative max-w-3xl">
            <p
              className={`text-[11px] font-mono uppercase tracking-fsc-eyebrow ${
                variant === 'emergency' ? 'text-fsc-warn' : 'text-fsc-accent-glow'
              }`}
            >
              {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight">
              {title}
            </h2>
            {body && (
              <p className="mt-4 text-base md:text-lg text-fsc-text-dim leading-relaxed max-w-2xl">
                {body}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className={
                    variant === 'emergency'
                      ? 'fsc-btn-emergency px-5 py-3'
                      : 'fsc-btn-primary'
                  }
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="fsc-btn-secondary">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
