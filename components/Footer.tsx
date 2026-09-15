import Link from 'next/link';
import { site } from '@/data/site';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
export function Footer() {
  return <footer className="fsc-footer"><div className="fsc-container">
    <div className="fsc-footer-grid"><div><Link href="/" className="text-xl font-semibold">{site.name}</Link><p className="mt-4 max-w-sm">Gate and access-control maintenance, repairs and installations for communities in Orlando and Tampa.</p><a className="fsc-footer-phone" href={`tel:${site.phone}`}>{site.phoneDisplay}</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a><p className="mt-4">24/7 emergency service</p></div>
    <div><h2>Services</h2><ul><li><Link href="/#maintenance" data-fsc-event="maintenance_interest" data-fsc-placement="footer">Preventive maintenance</Link></li>{services.map(s => <li key={s.slug}><Link href={`/services/${s.slug}`}>{s.navLabel}</Link></li>)}</ul></div>
    <div><h2>Properties we serve</h2><ul>{industries.map(i => <li key={i.slug}><Link href={`/industries/${i.slug}`}>{i.shortLabel}</Link></li>)}</ul></div>
    <div><h2>Explore</h2><ul><li><Link href="/service-areas/orlando">Orlando</Link></li><li><Link href="/service-areas/tampa">Tampa</Link></li><li><Link href="/service-areas">All service areas</Link></li><li><Link href="/industries">All property types</Link></li><li><Link href="/resources">Resources</Link></li><li><Link href="/contact" data-fsc-event="assessment_cta" data-fsc-placement="footer">Free property assessment</Link></li></ul></div></div>
    <div className="fsc-footer-bottom"><p>© {new Date().getFullYear()} {site.name}</p><Link href="/contact?urgency=emergency">Emergency contact form</Link></div>
  </div></footer>;
}
