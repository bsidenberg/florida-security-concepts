'use client';

import { useState } from 'react';

export type FAQItem = { q: string; a: string };

export function FAQ({
  items,
  heading = 'Frequently asked questions',
  defaultOpenFirst = false,
}: {
  items: FAQItem[];
  heading?: string;
  defaultOpenFirst?: boolean;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(
    defaultOpenFirst ? 0 : null
  );

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fsc-text">
        {heading}
      </h2>
      <ul className="mt-8 divide-y divide-fsc-border border-y border-fsc-border">
        {items.map((item, i) => {
          const open = openIdx === i;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                className="w-full text-left py-5 flex items-start justify-between gap-6 hover:text-fsc-accent-glow transition"
              >
                <span className="text-base md:text-lg font-medium text-fsc-text">
                  {item.q}
                </span>
                <span
                  className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-fsc-border-strong text-fsc-text-dim transition ${
                    open ? 'bg-fsc-accent/10 border-fsc-accent/40 text-fsc-accent-glow rotate-45' : ''
                  }`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  open ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm md:text-base text-fsc-text-dim leading-relaxed max-w-3xl">
                    {item.a}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
