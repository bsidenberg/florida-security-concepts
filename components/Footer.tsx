import Link from 'next/link';
import { site, hasPhone, hasEmail } from '@/data/site';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
import { locations } from '@/data/locations';

export function Footer() {
  const featuredLocations = locations.slice(0, 8);

  return (
    <footer className="relative mt-20 border-t border-fsc-border bg-fsc-surface/40">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fsc-accent/40 to-transparent" />
      <div className="fsc-container py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="text-sm font-semibold tracking-tight text-fsc-text">
              {site.name}
            </div>
            <p className="mt-3 text-sm text-fsc-text-dim leading-relaxed max-w-md">
              {site.tagline}
            </p>
            <div className="mt-5 flex flex-col gap-1.5 text-sm text-fsc-text-dim">
              <div>
                <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-accent-glow">
                  Coverage
                </span>{' '}
                · {site.serviceRegions.join(' · ')}
              </div>
              <div>
                <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-accent-glow">
                  Hours
                </span>{' '}
                · {site.hours}
              </div>
              {hasPhone() && (
                <div>
                  <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-accent-glow">
                    Phone
                  </span>{' '}
                  ·{' '}
                  <a
                    href={`tel:${site.phone}`}
                    className="hover:text-fsc-text"
                  >
                    {site.phoneDisplay}
                  </a>
                </div>
              )}
              {hasEmail() && (
                <div>
                  <span className="font-mono uppercase tracking-fsc-eyebrow text-[10px] text-fsc-accent-glow">
                    Email
                  </span>{' '}
                  ·{' '}
                  <a
                    href={`mailto:${site.email}`}
                    className="hover:text-fsc-text"
                  >
                    {site.email}
                  </a>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="fsc-btn-primary">
                Request Site Assessment
              </Link>
              <Link
                href="/services/emergency-service"
                className="fsc-btn-emergency"
              >
                Emergency Service
              </Link>
            </div>
          </div>

          <div>
            <FooterColTitle>Services</FooterColTitle>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-sm text-fsc-text-dim hover:text-fsc-text"
                  >
                    {s.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColTitle>Industries</FooterColTitle>
            <ul className="space-y-2">
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/industries/${i.slug}`}
                    className="text-sm text-fsc-text-dim hover:text-fsc-text"
                  >
                    {i.shortLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColTitle>Service Areas</FooterColTitle>
            <ul className="space-y-2">
              {featuredLocations.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/service-areas/${l.slug}`}
                    className="text-sm text-fsc-text-dim hover:text-fsc-text"
                  >
                    {l.city}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/service-areas"
                  className="text-sm font-semibold text-fsc-accent-glow hover:text-fsc-accent"
                >
                  View all areas →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 fsc-hr" />

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-fsc-text-muted">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fsc-text-muted">
            <li>
              <Link href="/contact" className="hover:text-fsc-text-dim">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-fsc-text-dim">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/services/emergency-service" className="hover:text-fsc-text-dim">
                Emergency
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-4 text-[10px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
      {children}
    </h4>
  );
}
