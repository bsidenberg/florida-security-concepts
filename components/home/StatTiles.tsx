'use client';
// Stat tiles with a count-up on scroll (S-007). Values are facts from the repo
// or approved wording only; the markup carries the final number for no-JS.
import { useEffect, useRef } from 'react';

export type Stat = { value: number; display: string; label: string; note: string };

export function StatTiles({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return; const b = en.target as HTMLElement; io.unobserve(b);
      const to = Number(b.dataset.count); const suffix = b.dataset.suffix ?? ''; const t0 = performance.now();
      const f = (t: number) => { const p = Math.min(1, (t - t0) / 1200); b.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 3)))}${suffix}`; if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }), { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="fsc-stats" ref={ref}>
      {stats.map((s) => {
        const suffix = s.display.replace(String(s.value), '');
        return <div key={s.label} className="fsc-stat"><b data-count={s.value} data-suffix={suffix}>{s.display}</b><span>{s.label}</span><small>{s.note}</small></div>;
      })}
    </div>
  );
}
