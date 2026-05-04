'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { nav, site } from '@/data/site';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-fsc-bg/85 backdrop-blur-md border-b border-fsc-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="fsc-container flex h-16 md:h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold tracking-tight text-fsc-text leading-tight">
              Florida Security
            </div>
            <div className="text-[10px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow leading-none">
              Concepts
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {nav.primary.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href)}
              className="fsc-nav-link text-sm font-medium text-fsc-text-dim hover:text-fsc-text data-[active=true]:text-fsc-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href={nav.emergencyCta.href} className="fsc-btn-emergency">
            <PulseDot />
            <span>{nav.emergencyCta.label}</span>
          </Link>
          <Link href={nav.cta.href} className="fsc-btn-primary">
            {nav.cta.label}
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center rounded-md border border-fsc-border-strong bg-fsc-surface/60 p-2 text-fsc-text"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-fsc-border bg-fsc-bg/95 backdrop-blur-md">
          <nav className="fsc-container py-4 flex flex-col gap-1" aria-label="Mobile">
            {nav.primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-fsc-surface text-fsc-text border border-fsc-border'
                    : 'text-fsc-text-dim hover:bg-fsc-surface/60 hover:text-fsc-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href={nav.emergencyCta.href} className="fsc-btn-emergency w-full">
                <PulseDot />
                <span>{nav.emergencyCta.label}</span>
              </Link>
              <Link href={nav.cta.href} className="fsc-btn-primary w-full">
                {nav.cta.label}
              </Link>
            </div>
            {site.serviceRegions.length > 0 && (
              <p className="mt-3 px-3 text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted">
                Serving {site.serviceRegions.join(' · ')}
              </p>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <div className="relative h-9 w-9 rounded-md bg-gradient-to-br from-fsc-accent/30 to-fsc-accent-deep/40 ring-1 ring-fsc-accent/40 shadow-fsc-glow flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
          stroke="#bfdbfe"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#60a5fa"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inset-0 rounded-full bg-fsc-warn opacity-70 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-fsc-warn" />
    </span>
  );
}
