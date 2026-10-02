'use client';
// Capability cards whose glow and 3D tilt follow the cursor (S-007). Pure
// enhancement: cards are plain links with full content when JS is off.
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export type CapabilityCard = { slug: string; title: string; body: string; icon: 'gate' | 'access' | 'camera' | 'network'; glow: string; href: string; cta: string };

const ICONS: Record<CapabilityCard['icon'], string> = {
  gate: 'M6 40V18l18-10 18 10v22M10 40V24h28v16M18 24v16M30 24v16M24 24v16',
  access: 'M8 14h32v22H8zM14 22h8M14 28h12M30 22h4M20 14V9a4 4 0 0 1 8 0v5',
  camera: 'M6 14h26v18H6zM32 20l10-5v18l-10-5M16 19a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 40h16',
  network: 'M24 18a6 6 0 1 0 0 12 6 6 0 0 0 0-12M8 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6M40 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6M8 35a3 3 0 1 0 0 6 3 3 0 0 0 0-6M40 35a3 3 0 1 0 0 6 3 3 0 0 0 0-6M10.5 12.5l9 7M37.5 12.5l-9 7M10.5 35.5l9-7M37.5 35.5l-9-7',
};

export function CursorCards({ cards }: { cards: CapabilityCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.fsc-cap-card'));
    const section = root.closest('section') as HTMLElement | null;
    const offs: (() => void)[] = [];
    for (const card of cards) {
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--x', `${x}px`); card.style.setProperty('--y', `${y}px`);
        if (fine && !reduce) card.style.transform = `rotateX(${(y / r.height - 0.5) * -8}deg) rotateY(${(x / r.width - 0.5) * 10}deg) translateY(-4px)`;
      };
      const enter = () => { const g = card.dataset.glow || '191,10,48'; card.style.setProperty('--glow', g); if (section) section.style.backgroundColor = `rgba(${g},0.04)`; };
      const leave = () => { card.style.transform = ''; if (section) section.style.backgroundColor = ''; };
      card.addEventListener('pointermove', move); card.addEventListener('pointerenter', enter); card.addEventListener('pointerleave', leave);
      offs.push(() => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerenter', enter); card.removeEventListener('pointerleave', leave); });
    }
    return () => offs.forEach((f) => f());
  }, []);
  return (
    <div className="fsc-cap-cards" ref={ref}>
      {cards.map((c) => (
        <article key={c.slug} className="fsc-cap-card" data-glow={c.glow}>
          <div className="fsc-cap-body">
            <svg className="fsc-cap-icon" viewBox="0 0 48 48" aria-hidden="true"><path d={ICONS[c.icon]} /></svg>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
          <Link href={c.href} className="fsc-cap-foot">{c.cta} <span aria-hidden="true">›</span></Link>
        </article>
      ))}
    </div>
  );
}
