'use client';
// "Night view" (S-007): a wireframe controlled entry the cursor illuminates like
// an IR illuminator, with hover detections. Labelled a simulated demonstration;
// it is not a live monitoring service.
import { useEffect, useRef, useState } from 'react';

type Hotspot = { id: string; style: React.CSSProperties; label: string; title: string; lines: { text: string; tone?: 'ok' | 'alert' }[]; up?: boolean };

const HOTSPOTS: Hotspot[] = [
  { id: 'car-1', style: { left: '41%', top: '43%', width: '19%', height: '28%' }, label: 'Resident vehicle, plate QRT 482', title: 'VEHICLE · PLATE QRT 482', lines: [{ text: 'Authorized · credential 114 · read 99.1%' }, { text: 'GRANTED · gate opening', tone: 'ok' }] },
  { id: 'car-2', style: { left: '72%', top: '70%', width: '17%', height: '18%' }, label: 'Flagged vehicle, plate ZEP 614', title: 'VEHICLE · PLATE ZEP 614', lines: [{ text: 'Flagged by site · read 98.8%' }, { text: 'DENIED · alert sent to manager', tone: 'alert' }], up: true },
  { id: 'cam', style: { left: '74%', top: '15%', width: '8%', height: '10%' }, label: 'Camera CAM-01', title: 'CAM-01 · ENTRY LPR', lines: [{ text: '2560×1440 · IR on · 30 fps' }, { text: 'Retention 30 days · health OK' }] },
  { id: 'gate', style: { left: '33%', top: '38%', width: '34%', height: '18%' }, label: 'Slide gate operator', title: 'SLIDE GATE · OPERATOR 01', lines: [{ text: 'UL 325 · battery 100% · 1,284 cycles this month' }, { text: 'Last service 14 days ago', tone: 'ok' }] },
  { id: 'callbox', style: { left: '26%', top: '56%', width: '5%', height: '14%' }, label: 'Visitor call box', title: 'CALL BOX · VISITOR LANE', lines: [{ text: 'Cellular · 2 calls tonight' }, { text: 'Guest passes active: 6' }] },
  { id: 'guard', style: { left: '6%', top: '40%', width: '17%', height: '30%' }, label: 'Guard house', title: 'GUARD HOUSE', lines: [{ text: 'Network cabinet · recorder · UPS' }, { text: 'All devices online', tone: 'ok' }] },
];

function Scene() {
  return (
    <svg viewBox="0 0 1200 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#AEBBD6"><path d="M0 430 L1200 430" /><path d="M380 430 L300 620 M820 430 L900 620" /><path d="M600 440 L600 470 M600 500 L600 540 M600 570 L600 620" stroke="#fff" strokeDasharray="26 22" opacity=".7" /><path d="M0 470 Q300 452 600 452 T1200 470" opacity=".4" /></g>
        <g stroke="#AEBBD6"><path d="M0 405 Q200 380 380 395 M820 395 Q1000 380 1200 405" /><path d="M60 395 l40-40 40 40 M140 395 l60-60 60 60 M980 395 l50-50 50 50 M1080 395 l40-40 40 40" opacity=".5" /></g>
        <g stroke="#DDE3EE"><rect x="372" y="300" width="26" height="130" rx="2" /><rect x="802" y="300" width="26" height="130" rx="2" /><rect x="376" y="286" width="18" height="14" /><rect x="806" y="286" width="18" height="14" /></g>
        <g stroke="#fff"><rect x="400" y="316" width="400" height="104" /><path d="M400 340 H800 M400 400 H800" /><path d="M430 316v104M460 316v104M490 316v104M520 316v104M550 316v104M580 316v104M610 316v104M640 316v104M670 316v104M700 316v104M730 316v104M760 316v104" /><path d="M400 316 Q600 250 800 316" /><rect x="560" y="268" width="80" height="34" rx="4" /><text x="600" y="291" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="13" fill="#fff" stroke="none">FSC</text></g>
        <g stroke="#DDE3EE"><rect x="80" y="260" width="180" height="170" rx="3" /><path d="M80 260 L170 210 L260 260" /><rect x="110" y="300" width="50" height="40" /><rect x="190" y="300" width="50" height="40" /><rect x="150" y="360" width="40" height="70" /></g>
        <g stroke="#DDE3EE"><rect x="920" y="130" width="8" height="300" /><rect x="900" y="110" width="60" height="26" rx="5" /><rect x="956" y="114" width="16" height="18" rx="2" /><circle cx="964" cy="123" r="4" fill="#FF6B84" stroke="none" /><path d="M972 123 L1130 190 M972 123 L1130 60" stroke="#FF6B84" strokeDasharray="6 8" opacity=".8" /></g>
        <g stroke="#DDE3EE"><rect x="330" y="356" width="34" height="74" rx="3" /><rect x="338" y="366" width="18" height="12" rx="1" /><circle cx="347" cy="400" r="6" /><path d="M341 414h12M341 420h12" /></g>
        <g stroke="#fff"><rect x="500" y="455" width="220" height="70" rx="12" /><path d="M540 455 q20-38 70-38 h40 q40 0 60 38" /><rect x="560" y="425" width="50" height="24" rx="4" /><rect x="616" y="425" width="50" height="24" rx="4" /><circle cx="545" cy="528" r="18" /><circle cx="675" cy="528" r="18" /><rect x="590" y="492" width="56" height="20" rx="2" /><text x="618" y="506" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" fill="#fff" stroke="none">QRT 482</text></g>
        <g stroke="#fff" opacity=".9"><rect x="880" y="470" width="190" height="62" rx="10" /><path d="M915 470 q18-34 60-34 h36 q34 0 52 34" /><circle cx="918" cy="534" r="16" /><circle cx="1032" cy="534" r="16" /><rect x="960" y="500" width="50" height="18" rx="2" /><text x="985" y="513" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="10" fill="#fff" stroke="none">ZEP 614</text></g>
        <g stroke="#AEBBD6" opacity=".8"><path d="M1140 430 V300" /><path d="M1140 300 q-40-40-80-30 M1140 300 q40-40 60-20 M1140 300 q-10-50 20-70 M1140 300 q-50-10-60 30" /><path d="M30 430 V330" /><path d="M30 330 q-30-30-50-20 M30 330 q30-30 60-20 M30 330 q0-40 25-55" /></g>
        <g stroke="#5FD69B" opacity=".7"><rect x="520" y="560" width="160" height="30" rx="15" strokeDasharray="8 6" /><text x="600" y="580" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="10" fill="#5FD69B" stroke="none">SAFETY LOOP</text></g>
      </g>
    </svg>
  );
}

export function NightView() {
  const stageRef = useRef<HTMLDivElement>(null);
  const brightRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<string | null>(null);
  const [clock, setClock] = useState('02:14:08');
  const target = useRef({ mx: -999, my: -999 });

  useEffect(() => {
    let sec = 2 * 3600 + 14 * 60 + 8;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    const id = setInterval(() => { sec++; setClock(`${pad(Math.floor(sec / 3600) % 24)}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}`); }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const stage = stageRef.current, bright = brightRef.current; if (!stage || !bright) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = target.current;
    let cx = -999, cy = -999, raf = 0, auto: number | undefined;
    const onMove = (e: PointerEvent) => { const r = stage.getBoundingClientRect(); t.mx = e.clientX - r.left; t.my = e.clientY - r.top; };
    const onLeave = () => { if (fine) { t.mx = -999; t.my = -999; } };
    stage.addEventListener('pointermove', onMove, { passive: true }); stage.addEventListener('pointerleave', onLeave);
    const tick = () => { cx += (t.mx - cx) * 0.18; cy += (t.my - cy) * 0.18; bright.style.setProperty('--mx', `${cx}px`); bright.style.setProperty('--my', `${cy}px`); raf = requestAnimationFrame(tick); };
    if (reduce) { t.mx = stage.clientWidth * 0.5; t.my = stage.clientHeight * 0.55; cx = t.mx; cy = t.my; bright.style.setProperty('--mx', `${cx}px`); bright.style.setProperty('--my', `${cy}px`); }
    else {
      raf = requestAnimationFrame(tick);
      if (!fine) { let a = 0; auto = window.setInterval(() => { a += 0.03; t.mx = stage.clientWidth * (0.5 + 0.42 * Math.sin(a)); t.my = stage.clientHeight * (0.55 + 0.25 * Math.cos(a * 0.7)); }, 40); }
    }
    return () => { cancelAnimationFrame(raf); if (auto) clearInterval(auto); stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave); };
  }, []);

  const snapshotAt = (x: number, y: number) => {
    const stage = stageRef.current; if (!stage) return;
    const ring = document.createElement('span'); ring.className = 'fsc-ir-ring'; ring.style.left = `${x}px`; ring.style.top = `${y}px`;
    stage.appendChild(ring); setTimeout(() => ring.remove(), 1000);
    setSnap(`SNAPSHOT SAVED · ${clock} · CAM-01`); setTimeout(() => setSnap(null), 2200);
  };
  const snapshot = (e: React.PointerEvent<HTMLDivElement>) => { const r = stageRef.current?.getBoundingClientRect(); if (r) snapshotAt(e.clientX - r.left, e.clientY - r.top); };
  const keySnapshot = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault();
    const r = stageRef.current?.getBoundingClientRect(), b = e.currentTarget.getBoundingClientRect(); if (!r) return;
    const x = b.left - r.left + b.width / 2, y = b.top - r.top + b.height / 2;
    target.current.mx = x; target.current.my = y;
    snapshotAt(x, y);
  };

  return (
    <div className="fsc-ir-stage" ref={stageRef} onPointerDown={snapshot}>
      <div className="fsc-ir-ui"><span className="fsc-ir-rec"><i />CAM-01 · ENTRY · IR ILLUMINATOR: CURSOR · SIMULATED</span><span>{clock}</span></div>
      <div className="fsc-ir-layer fsc-ir-dim"><Scene /></div>
      <div className="fsc-ir-layer fsc-ir-bright" ref={brightRef}><Scene /></div>
      <div className="fsc-ir-vignette" />
      {HOTSPOTS.map((h) => (
        <button key={h.id} type="button" className={`fsc-ir-hot${h.up ? ' fsc-ir-hot-up' : ''}`} style={h.style} aria-label={h.label} onKeyDown={keySnapshot}>
          <span className="fsc-ir-det"><i /><i /><i /><i /></span>
          <span className="fsc-ir-lbl"><b>{h.title}</b>{h.lines.map((l, i) => <span key={i} className={l.tone ? `fsc-ir-${l.tone}` : undefined}>{l.text}</span>)}</span>
        </button>
      ))}
      <div className={`fsc-ir-snap${snap ? ' is-on' : ''}`} aria-live="polite">{snap ?? ''}</div>
    </div>
  );
}
