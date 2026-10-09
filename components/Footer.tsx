import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/brand/fsc-logo-reverse.png';
import { site } from '@/data/site';
import { services } from '@/data/services';
import { industries } from '@/data/industries';

export function Footer() {
  return <footer className="fsc-footer"><div className="fsc-container">
    <div className="fsc-footer-grid"><div><Link href="/"><Image src={logo} alt="Florida Security Concepts" width={173} height={88} className="fsc-footer-logo" sizes="173px" /></Link><p className="mt-4 max-w-sm">{site.tagline}</p><a className="fsc-footer-phone" href={`tel:${site.phone}`}>{site.phoneDisplay}</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a><a href={site.social.instagram}>Instagram @{site.instagramHandle}</a><p className="mt-4">Same-day when available. If a gate is down, call {site.phoneDisplay}.</p></div>
    <div><h2>Services</h2><ul>{services.map(s => <li key={s.slug}><Link href={`/services/${s.slug}`} data-fsc-event={s.slug === 'maintenance-plans' ? 'maintenance_interest' : undefined} data-fsc-placement={s.slug === 'maintenance-plans' ? 'footer' : undefined}>{s.navLabel}</Link></li>)}</ul></div>
    <div><h2>Properties we serve</h2><ul>{industries.map(i => <li key={i.slug}><Link href={`/industries/${i.slug}`}>{i.shortLabel}</Link></li>)}</ul></div>
    <div><h2>Explore</h2><ul><li><Link href="/service-areas/orlando">Orlando</Link></li><li><Link href="/service-areas/kissimmee">Kissimmee</Link></li><li><Link href="/service-areas/winter-garden">Winter Garden</Link></li><li><Link href="/service-areas/clermont">Clermont</Link></li><li><Link href="/service-areas/tampa">Tampa Bay</Link></li><li><Link href="/service-areas">All service areas</Link></li><li><Link href="/industries">All property types</Link></li><li><Link href="/resources">Resources</Link></li><li><Link href="/contact" data-fsc-event="assessment_cta" data-fsc-placement="footer">Book an advanced consultation</Link></li></ul></div></div>
    <div className="fsc-footer-bottom"><p>© {new Date().getFullYear()} {site.name}. {site.name} is a division of Florida Pole Barn Builders LLC.</p><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
  </div></footer>;
}
