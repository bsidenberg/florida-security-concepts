'use client';
// Homepage hero (S-007): compact Source1-style hero with the cursor-reactive
// Florida map. Service-area chips are real internal links; hovering one pings
// its city on the map. Photographs live further down the page, not over the map.
import Link from 'next/link';
import { useState } from 'react';
import { HeroMap, MAP_CITIES } from './HeroMap';

const CHIP_SLUGS = ['orlando', 'kissimmee', 'winter-garden', 'clermont', 'tampa'];

export function HomeHero() {
  const [hover, setHover] = useState<string | null>(null);
  const chips = CHIP_SLUGS.map((slug) => MAP_CITIES.find((c) => c.slug === slug)!).filter(Boolean);
  return (
    <section className="fsc-hero fsc-grid-bg" id="top">
      <HeroMap hoverSlug={hover} />
      <div className="fsc-container fsc-hero-grid">
        <div className="fsc-hero-left">
          <p className="fsc-kicker">Commercial &amp; residential · Based in Clermont, Lake County</p>
          <h1>Gate &amp; access-control service <em>you can see working.</em></h1>
          <div className="fsc-hero-ctas">
            <Link href="/contact" className="fsc-btn-primary fsc-main-cta" data-fsc-event="assessment_cta" data-fsc-placement="hero">Book an advanced consultation <span aria-hidden="true">›</span></Link>
            <a href="#night-view" className="fsc-btn-outline">See the night view <span aria-hidden="true">↓</span></a>
          </div>
          <p className="fsc-hero-intro">We repair and maintain the gates, access control, and cameras your property uses every day. Same-day when available. New installations when you need a new entry. Based in Clermont. We work in Orlando, Kissimmee, Winter Garden, and Tampa Bay.</p>
          <div className="fsc-hero-needs" aria-label="Service choices">
            <Link href="#maintenance" data-fsc-event="maintenance_interest" data-fsc-placement="hero">Maintenance</Link>
            <Link href="/contact?service=repair">Repairs</Link>
            <Link href="/contact?service=retrofit">Retrofits</Link>
            <Link href="/services/security-gate-systems">New installations</Link>
          </div>
          <nav className="fsc-hero-sites" aria-label="Service areas">
            {chips.map((c) => (
              <Link key={c.slug} href={`/service-areas/${c.slug}`} className="fsc-site-chip" data-active={hover === c.slug || undefined} onPointerEnter={() => setHover(c.slug)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(c.slug)} onBlur={() => setHover(null)}>
                <i aria-hidden="true" />{c.city}
              </Link>
            ))}
            <Link href="/service-areas" className="fsc-site-chip fsc-site-chip-all">All service areas ›</Link>
          </nav>
          <p className="fsc-hero-hint" aria-hidden="true"><i />Move across the map · click to ping</p>
        </div>
        <div className="fsc-hero-map-slot" aria-hidden="true" />
      </div>
    </section>
  );
}
