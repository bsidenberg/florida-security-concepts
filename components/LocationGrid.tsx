import Link from 'next/link';
import type { Location } from '@/data/locations';

export function LocationGrid({
  items,
  heading,
  className = '',
}: {
  items: Location[];
  heading?: string;
  className?: string;
}) {
  const grouped = items.reduce<Record<string, Location[]>>((acc, l) => {
    (acc[l.region] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div className={className}>
      {heading && (
        <h3 className="mb-6 text-lg font-semibold text-fsc-text">{heading}</h3>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(grouped).map(([region, list]) => (
          <div
            key={region}
            className="fsc-card p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fsc-accent-glow" />
                <h4 className="text-sm font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                  {region}
                </h4>
              </div>
              <span className="text-[11px] text-fsc-text-muted">
                {list.length} {list.length === 1 ? 'area' : 'areas'}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {list.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/service-areas/${l.slug}`}
                    className="group inline-flex items-center gap-1.5 text-sm text-fsc-text hover:text-fsc-accent-glow"
                  >
                    <span>{l.city}</span>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition"
                      aria-hidden
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
