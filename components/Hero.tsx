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

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  align = 'left',
  variant = 'page',
}: HeroProps) {
  const isHome = variant === 'home';
  return (
    <section className="relative overflow-hidden">
      {/* Layered backgrounds for dimensional feel */}
      <div className="absolute inset-0 fsc-spotlight pointer-events-none" />
      <div className="absolute inset-0 fsc-grid-bg opacity-60 pointer-events-none [mask-image:linear-gradient(180deg,#000_0%,#000_60%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-fsc-accent/40 to-transparent" />

      {/* Subtle floating orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[640px] w-[1100px] rounded-full bg-fsc-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fsc-accent-deep/15 blur-3xl" />

      <Container>
        <div
          className={`relative pt-16 md:pt-28 pb-16 md:pb-24 ${
            align === 'center' ? 'text-center mx-auto max-w-4xl' : 'max-w-4xl'
          }`}
        >
          {eyebrow && (
            <div
              className={`flex ${
                align === 'center' ? 'justify-center' : ''
              } mb-6`}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-fsc-border-strong bg-fsc-surface/70 backdrop-blur px-3 py-1.5">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-fsc-accent-glow opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fsc-accent-glow" />
                </span>
                <span className="text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                  {eyebrow}
                </span>
              </span>
            </div>
          )}
          <h1
            className={`font-semibold tracking-tight text-fsc-text ${
              isHome
                ? 'text-4xl sm:text-5xl md:text-6xl leading-[1.05]'
                : 'text-3xl sm:text-4xl md:text-5xl leading-[1.1]'
            }`}
          >
            {title}
          </h1>
          <p
            className={`mt-6 text-base md:text-lg leading-relaxed text-fsc-text-dim ${
              align === 'center' ? 'mx-auto' : ''
            } max-w-3xl`}
          >
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div
              className={`mt-9 flex flex-wrap gap-3 ${
                align === 'center' ? 'justify-center' : ''
              }`}
            >
              {primaryCta && (
                <Link href={primaryCta.href} className="fsc-btn-primary">
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="fsc-btn-secondary">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
