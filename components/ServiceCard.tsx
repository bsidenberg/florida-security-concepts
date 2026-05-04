import Link from 'next/link';
import type { Service } from '@/data/services';

const iconBySlug: Record<string, string> = {
  'security-gate-systems': 'M4 18V8h16v10M4 13h16M8 8V4m8 4V4',
  'gate-automation': 'M4 12h16M8 6l-4 6 4 6M16 6l4 6-4 6',
  'access-control':
    'M16 11V8a4 4 0 10-8 0v3M5 11h14v9H5zM12 14v3',
  'video-surveillance': 'M3 7l13-3v14L3 15V7zm13 1l5-2v8l-5-2',
  'fire-alarm-systems':
    'M12 3c2 4 5 6 5 10a5 5 0 11-10 0c0-2 1-3 2-4',
  'security-system-integration':
    'M5 7h5v5H5zM14 12h5v5h-5zM10 9.5l4 0M9.5 12v0M14.5 9.5v3',
  'emergency-service':
    'M12 3v6m0 0l3-3m-3 3l-3-3M5 13l-2 7 7-2m4-12l5 5-9 9H5v-5z',
};

export function ServiceCard({
  service,
  compact = false,
}: {
  service: Service;
  compact?: boolean;
}) {
  const path = iconBySlug[service.slug] || iconBySlug['security-system-integration'];
  return (
    <Link
      href={`/services/${service.slug}`}
      className="fsc-card fsc-card-hover group block p-6 md:p-7"
    >
      <div className="flex items-start gap-4">
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
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-semibold text-fsc-text leading-snug">
            {service.navLabel}
          </h3>
          {!compact && (
            <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">
              {service.intro.split('.')[0]}.
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
            <span>Explore service</span>
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
        </div>
      </div>
    </Link>
  );
}
