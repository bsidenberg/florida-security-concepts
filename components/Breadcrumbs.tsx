import Link from 'next/link';

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {it.href && !last ? (
                <Link href={it.href} className="hover:text-fsc-accent-glow">
                  {it.label}
                </Link>
              ) : (
                <span
                  className={last ? 'text-fsc-text' : 'text-fsc-text-muted'}
                  aria-current={last ? 'page' : undefined}
                >
                  {it.label}
                </span>
              )}
              {!last && <span className="text-fsc-border-strong">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
