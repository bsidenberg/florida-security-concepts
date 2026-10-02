'use client';
// Cursor-reactive dot-matrix map of Florida for the homepage hero (S-007).
// Progressive enhancement: the surrounding markup carries all content; this
// canvas only draws. Respects prefers-reduced-motion by rendering one still frame.
import { useEffect, useRef } from 'react';

export type MapCity = { slug: string; city: string; lon: number; lat: number };

// Coordinates for the fourteen canonical service-area routes plus HQ.
export const MAP_CITIES: MapCity[] = [
  { slug: 'orlando', city: 'Orlando', lon: -81.38, lat: 28.54 },
  { slug: 'tampa', city: 'Tampa', lon: -82.46, lat: 27.95 },
  { slug: 'lakeland', city: 'Lakeland', lon: -81.95, lat: 28.04 },
  { slug: 'kissimmee', city: 'Kissimmee', lon: -81.42, lat: 28.3 },
  { slug: 'winter-garden', city: 'Winter Garden', lon: -81.59, lat: 28.57 },
  { slug: 'clermont', city: 'Clermont', lon: -81.77, lat: 28.55 },
  { slug: 'lake-mary', city: 'Lake Mary', lon: -81.32, lat: 28.76 },
  { slug: 'sanford', city: 'Sanford', lon: -81.27, lat: 28.8 },
  { slug: 'ocala', city: 'Ocala', lon: -82.14, lat: 29.19 },
  { slug: 'the-villages', city: 'The Villages', lon: -81.96, lat: 28.93 },
  { slug: 'st-petersburg', city: 'St. Petersburg', lon: -82.64, lat: 27.77 },
  { slug: 'clearwater', city: 'Clearwater', lon: -82.8, lat: 27.97 },
  { slug: 'brandon', city: 'Brandon', lon: -82.29, lat: 27.94 },
  { slug: 'wesley-chapel', city: 'Wesley Chapel', lon: -82.33, lat: 28.24 },
];
const HQ = { lon: -81.75, lat: 28.57, label: 'LAKE COUNTY HQ' };

const FL: [number, number][] = [[-87.6, 30.99], [-85.0, 31.0], [-84.9, 30.7], [-82.0, 30.6], [-81.4, 30.7], [-81.3, 30.0], [-80.6, 28.6], [-80.1, 27.0], [-80.0, 26.0], [-80.4, 25.2], [-81.1, 25.1], [-81.7, 25.9], [-82.1, 26.6], [-82.7, 27.5], [-82.8, 28.2], [-82.7, 28.9], [-83.0, 29.1], [-83.4, 29.5], [-84.0, 30.1], [-84.4, 29.9], [-85.0, 29.6], [-85.4, 29.7], [-86.5, 30.4], [-87.5, 30.3]];

function inside(x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = FL.length - 1; i < FL.length; j = i++) {
    const [xi, yi] = FL[i];
    const [xj, yj] = FL[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

type Dot = { x: number; y: number; ox: number; oy: number; d: number; s: number; ph: number };
type Ping = { x: number; y: number; t: number };

export function HeroMap({ hoverSlug }: { hoverSlug: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<string | null>(hoverSlug);
  const pingRef = useRef<Ping[]>([]);
  const cityPx = useRef<Record<string, [number, number]>>({});

  useEffect(() => {
    const prev = hoverRef.current;
    hoverRef.current = hoverSlug;
    if (hoverSlug && hoverSlug !== prev) {
      const c = cityPx.current[hoverSlug];
      if (c) pingRef.current.push({ x: c[0], y: c[1], t: 0 });
    }
  }, [hoverSlug]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const section = cv.parentElement as HTMLElement;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const slot = section.querySelector('.fsc-hero-map-slot') as HTMLElement | null;
    let fontFamily = 'sans-serif', visible = true;
    let W = 1, H = 1, dpr = 1, dots: Dot[] = [], hq: [number, number] = [0, 0], slotRect = { x: 0, y: 0, w: 1, h: 1 }, mobile = false;
    let mx = -9999, my = -9999, cx = -9999, cy = -9999, hasMouse = false, lastMove = 0, raf = 0, autoI = 0;

    // The map is centred on the hero's empty grid column (desktop) or the
    // dedicated slot under the copy (mobile), and clipped to it on mobile.
    // Whole state fitted inside the slot: lon −87.7…−80.0 (7.7° × 0.9 aspect), lat 24.9…31.1 (6.2°).
    let scale = 1;
    const proj = (lon: number, lat: number): [number, number] => {
      const ox = slotRect.x + slotRect.w / 2, oy = slotRect.y + slotRect.h / 2;
      return [ox + (lon + 83.85) * scale * 0.9, oy - (lat - 28.0) * scale];
    };
    const build = () => {
      const r = section.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mobile = W < 900;
      if (slot) { const sr = slot.getBoundingClientRect(); slotRect = { x: sr.left - r.left, y: sr.top - r.top, w: Math.max(1, sr.width), h: Math.max(1, sr.height) }; }
      else slotRect = { x: W * 0.42, y: 0, w: W * 0.58, h: H };
      scale = Math.min((slotRect.h - 24) / 6.2, (slotRect.w - 24) / (7.7 * 0.9));
      fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
      dots = [];
      const step = Math.max(0.06, Math.min(0.14, 7 / scale));
      for (let lon = -87.7; lon < -79.9; lon += step) for (let lat = 24.9; lat < 31.1; lat += step) {
        if (inside(lon, lat)) {
          const [x, y] = proj(lon, lat);
          dots.push({ x, y, ox: x, oy: y, d: Math.hypot(lon - HQ.lon, lat - HQ.lat), s: 0, ph: Math.random() * 6.28 });
        }
      }
      hq = proj(HQ.lon, HQ.lat);
      const px: Record<string, [number, number]> = {};
      for (const c of MAP_CITIES) px[c.slug] = proj(c.lon, c.lat);
      cityPx.current = px;
    };
    build();
    const onResize = () => { build(); if (reduce) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }, { threshold: 0 });
    io.observe(section);
    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; hasMouse = true; lastMove = performance.now(); };
    const onLeave = () => { hasMouse = false; };
    const onDown = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); pingRef.current.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 }); };
    window.addEventListener('resize', onResize);
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    section.addEventListener('pointerdown', onDown);

    let lastSweep = -1;
    const frame = (t: number) => {
      const s = t / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (mobile) { ctx.beginPath(); ctx.rect(slotRect.x, slotRect.y, slotRect.w, slotRect.h); ctx.clip(); }
      const idle = !hasMouse || performance.now() - lastMove > 3500;
      let tx: number, ty: number;
      if (idle) { const a = s * 0.45; tx = hq[0] + Math.cos(a) * W * 0.16; ty = hq[1] + Math.sin(a * 1.3) * H * 0.22; } else { tx = mx; ty = my; }
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      if (idle && !reduce && Math.floor(s / 4) !== lastSweep) {
        lastSweep = Math.floor(s / 4);
        const c = MAP_CITIES[autoI++ % MAP_CITIES.length];
        const p = cityPx.current[c.slug];
        if (p) pingRef.current.push({ x: p[0], y: p[1], t: 0 });
      }
      pingRef.current = pingRef.current.filter((p) => p.t < 1.4);
      pingRef.current.forEach((p) => { p.t += 0.016; });
      const R = 150;
      for (const d of dots) {
        const dx = d.x - cx, dy = d.y - cy; const dist = Math.hypot(dx, dy);
        let f = dist < R ? 1 - dist / R : 0; f = f * f;
        let ring = 0;
        for (const p of pingRef.current) { const pd = Math.hypot(d.x - p.x, d.y - p.y); const w = Math.max(0, 1 - Math.abs(pd - p.t * 420) / 40) * (1 - p.t / 1.4); if (w > ring) ring = w; }
        const k = Math.min(1, f + ring); d.s += (k - d.s) * 0.18;
        const push = d.s * Math.min(22, scale * 0.3); const nx = dist > 0.01 ? dx / dist : 0, ny = dist > 0.01 ? dy / dist : 0;
        d.x = d.ox + (f > 0 ? nx * push : 0) + Math.sin(s * 1.1 + d.ph) * 0.6;
        d.y = d.oy + (f > 0 ? ny * push : 0) + Math.cos(s * 0.9 + d.ph) * 0.6;
        const near = Math.max(0, 1 - d.d / 2.2); const base = 0.14 + near * 0.22;
        const rC = 191 + (0 - 191) * (1 - d.s), gC = 10 + (40 - 10) * (1 - d.s), bC = 48 + (104 - 48) * (1 - d.s);
        ctx.fillStyle = `rgba(${rC | 0},${gC | 0},${bC | 0},${Math.min(1, base + d.s * 0.9)})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, (scale > 70 ? 1.6 : 1.2) + near * 0.5 + d.s * 3, 0, 6.28); ctx.fill();
      }
      for (const p of pingRef.current) { ctx.strokeStyle = `rgba(191,10,48,${0.35 * (1 - p.t / 1.4)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.t * 420, 0, 6.28); ctx.stroke(); }
      for (const c of MAP_CITIES) {
        const p = cityPx.current[c.slug]; if (!p) continue;
        const h = hoverRef.current === c.slug; const nearC = Math.hypot(p[0] - cx, p[1] - cy) < 60; const pu = 0.5 + 0.5 * Math.sin(s * 2.4 + c.city.length);
        ctx.fillStyle = h || nearC ? '#BF0A30' : '#002868'; ctx.beginPath(); ctx.arc(p[0], p[1], h || nearC ? 5 : 3, 0, 6.28); ctx.fill();
        if (h || nearC) { ctx.strokeStyle = `rgba(191,10,48,${0.7 - 0.5 * pu})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 8 + 10 * pu, 0, 6.28); ctx.stroke(); ctx.fillStyle = '#0E1B3A'; ctx.font = `700 12px ${fontFamily}`; ctx.fillText(c.city.toUpperCase(), p[0] + 14, p[1] + 4); }
      }
      const hp = 0.5 + 0.5 * Math.sin(s * 2.2);
      ctx.strokeStyle = `rgba(191,10,48,${0.55 - 0.4 * hp})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hq[0], hq[1], 8 + 16 * hp, 0, 6.28); ctx.stroke();
      ctx.save(); ctx.translate(hq[0], hq[1]); ctx.fillStyle = '#BF0A30'; ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(-1, -5); ctx.lineTo(7, -5); ctx.lineTo(2, 5); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#0E1B3A'; ctx.font = `700 12px ${fontFamily}`; ctx.fillText(HQ.label, hq[0] + 14, hq[1] - 8);
      if (fine && !idle) {
        // Miles ≈ pixel distance ÷ (px per degree of latitude) × 69.
        const miles = (Math.hypot(hq[0] - cx, hq[1] - cy) / scale) * 69;
        ctx.strokeStyle = 'rgba(191,10,48,0.25)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hq[0], hq[1]); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#4A5673'; ctx.font = '500 10px ui-monospace, monospace'; ctx.fillText(`${miles | 0} MI FROM HQ`, cx + 20, cy - 14);
      }
      ctx.restore();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      section.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="fsc-hero-canvas" aria-hidden="true" />;
}
