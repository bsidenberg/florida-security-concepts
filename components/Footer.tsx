import Link from 'next/link';
import { site } from '@/data/site';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
export function Footer() {
  return <footer className="fsc-footer"><div className="fsc-container">
    <div className="fsc-footer-grid"><div><Link href="/" className="text-xl font-semibold">{site.name}</Link><p className="mt-4 max-w-sm">Gate and access-control maintenance, repairs, and installations for communities in Clermont and Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay.</p><a className="fsc-footer-phone" href={`tel:${site.phone}`}>352-282-0692</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a></div>
    <div><h2>Services</h2><ul><li><Link href="/#maintenance" data-fsc-event="maintenance_interest" data-fsc-placement="footer">Preventive maintenance</Link></li>{services.map(s => <li key={s.slug}><Link href={`/services/${s.slug}`}>{s.navLabel}</Link></li>)}</ul></div>
    <div><h2>Properties we serve</h2><ul>{industries.map(i => <li key={i.slug}><Link href={`/industries/${i.slug}`}>{i.shortLabel}</Link></li>)}</ul></div>
    <div><h2>Service areas</h2><ul><li><Link href="/gate-repair/clermont-fl">Clermont & Lake County</Link></li><li><Link href="/gate-repair/orlando-fl">Orlando</Link></li><li><Link href="/gate-repair/kissimmee-fl">Kissimmee</Link></li><li><Link href="/gate-repair/winter-garden-fl">Winter Garden</Link></li><li><Link href="/gate-repair/tampa-bay-fl">Tampa Bay</Link></li><li><Link href="/service-areas">All service areas</Link></li><li><Link href="/industries">All property types</Link></li><li><Link href="/resources">Resources</Link></li><li><Link href="/contact" data-fsc-event="assessment_cta" data-fsc-placement="footer">Advanced consultation</Link></li></ul></div></div>
    <div className="fsc-footer-bottom"><p>© {new Date().getFullYear()} Florida Security Concepts LLC.</p><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact?urgency=emergency">Emergency contact form</Link></div>
  </div></footer>;
}
