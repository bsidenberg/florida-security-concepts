import Link from 'next/link';
import type { Industry } from '@/data/industries';

const iconBySlug: Record<string, string> = {
  'hoa-gated-communities': 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z',
  'multifamily-apartments-condos':
    'M4 3h16v18H4zM8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2',
  'storage-facilities':
    'M3 9l9-5 9 5v11H3zM7 13h10M7 17h10',
  'commercial-properties':
    'M4 21V8l8-4 8 4v13M9 12h2M9 16h2M13 12h2M13 16h2',
  'industrial-warehouses':
    'M3 21V11l6-3v3l6-3v3l6-3v13zM7 21v-4M11 21v-4M15 21v-4',
  'property-managers':
    'M16 11a4 4 0 10-8 0 4 4 0 008 0zM3 21a8 8 0 0118 0',
  'residential-estates':
    'M3 11l9-7 9 7M5 9v11h14V9M9 20v-7h6v7',
};

export function IndustryCard({ industry }: { industry: Industry }) {
  const path = iconBySlug[industry.slug] || iconBySlug['commercial-properties'];
  return (
    <Link
      href={`/industries/${industry.slug}`}
      className="fsc-card fsc-card-hover group block p-6 md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-fsc-bg/60 ring-1 ring-fsc-border-strong group-hover:ring-fsc-accent/40 transition">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="text-fsc-accent-glow"
            aria-hidden
          >
            <path
              d={path}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted">
          Industry
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-fsc-text leading-snug">
        {industry.shortLabel}
      </h3>
      <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
        {industry.intro.split('.')[0]}.
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
        <span>View industry</span>
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
  );
}
