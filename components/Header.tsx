'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { nav, site } from '@/data/site';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  return <header className="fsc-header">
    <div className="fsc-container fsc-header-main">
      <Link href="/" className="fsc-brand" aria-label="Florida Security Concepts home">
        <span className="fsc-brand-mark" aria-hidden="true">FSC<span /></span>
        <span>Florida Security <span className="block">Concepts</span></span>
      </Link>
      <nav className="fsc-desktop-nav" aria-label="Primary">{nav.primary.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} data-fsc-event={item.href === '/#maintenance' ? 'maintenance_interest' : undefined} data-fsc-placement={item.href === '/#maintenance' ? 'header' : undefined}>{item.label}</Link>)}</nav>
      <Link href="/contact" className="fsc-btn-primary fsc-header-assessment" data-fsc-event="assessment_cta" data-fsc-placement="header">Free assessment <span aria-hidden="true">↗</span></Link>
      <button ref={button} className="fsc-menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '×' : '☰'}</span></button>
    </div>
    <div className="fsc-emergency-strip"><div className="fsc-container"><span>Orlando & Tampa</span><a href={`tel:${site.emergencyPhone}`} data-fsc-event="emergency_call" data-fsc-placement="emergency_strip">24/7 emergency service <span aria-hidden="true">·</span> <strong>{site.emergencyPhoneDisplay}</strong></a></div></div>
    {open && <nav id="mobile-navigation" className="fsc-mobile-nav fsc-container" aria-label="Mobile">{nav.primary.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} data-fsc-event={item.href === '/#maintenance' ? 'maintenance_interest' : undefined} data-fsc-placement={item.href === '/#maintenance' ? 'mobile_nav' : undefined}>{item.label}</Link>)}<Link className="fsc-btn-primary" href="/contact" onClick={() => setOpen(false)} data-fsc-event="assessment_cta" data-fsc-placement="mobile_nav">Request a Free Property Assessment</Link></nav>}
  </header>;
}
