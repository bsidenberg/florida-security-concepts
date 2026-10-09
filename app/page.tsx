import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FAQSchema, ImageObjectSchema } from '@/components/Schema';
import { PhotoGrid } from '@/components/PhotoFigure';
import { HomeHero } from '@/components/home/HomeHero';
import { StatTiles, type Stat } from '@/components/home/StatTiles';
import { CursorCards, type CapabilityCard } from '@/components/home/CursorCards';
import { NightView } from '@/components/home/NightView';
import { Reveal } from '@/components/home/Reveal';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { site } from '@/data/site';
import { industries } from '@/data/industries';
import { resources } from '@/data/resources';
import { photos } from '@/data/photos';

export const metadata: Metadata = buildPageMetadata({
  title: 'Security Gates, Access Control & Cameras | Clermont',
  description: 'We repair and maintain gates, access control, and cameras from Clermont. Same-day when available. Orlando, Kissimmee, Winter Garden, and Tampa Bay.',
  path: '/',
});

// Equipment platforms FSC installs and services (owner-confirmed 2026-10-02).
const manufacturers = [
  { file: 'linear', name: 'Linear' }, { file: 'hysecurity', name: 'HySecurity' }, { file: 'liftmaster', name: 'LiftMaster' }, { file: 'essex', name: 'Essex Electronics' },
  { file: 'all-o-matic', name: 'All-O-Matic' }, { file: 'access-one', name: 'Access One Technologies' }, { file: 'aiphone', name: 'Aiphone' }, { file: 'chamberlain-elite', name: 'Chamberlain Elite' },
  { file: 'lockey', name: 'Lockey USA' }, { file: 'doorking', name: 'DKS DoorKing' }, { file: 'viking', name: 'Viking Access Systems' },
];

const stats: Stat[] = [
  { display: 'Same-day', label: 'when available', note: 'CALL IF A GATE IS DOWN' },
  { display: 'Local', label: 'Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay', note: 'BASED IN CLERMONT' },
  { value: industries.length, display: String(industries.length), label: 'property types, from warehouses to estates', note: 'SEE WHO WE SERVE' },
  { value: manufacturers.length, display: String(manufacturers.length), label: 'equipment platforms installed and serviced', note: 'GATES · ACCESS · INTERCOM' },
];

const integrationPath = '/services/security-system-integration';

const capabilities: CapabilityCard[] = [
  { slug: 'gates', icon: 'gate', glow: '191,10,48', title: 'Gates & automation', body: 'Swing, slide, barrier-arm, and vertical-lift operators, with battery backup and safety loops. We maintain them so they still work in August.', href: '/services/gate-automation', cta: 'Gate automation' },
  { slug: 'access', icon: 'access', glow: '0,40,104', title: 'Access control', body: 'Fobs, phone credentials, call boxes, and guest passes. Add a resident. Turn one off when they move.', href: '/services/access-control', cta: 'Access control' },
  { slug: 'video', icon: 'camera', glow: '191,10,48', title: 'Video surveillance', body: 'Cameras aimed at the gate, the lane, and the places you actually need to see. Pull the recording when something happens.', href: '/services/video-surveillance', cta: 'Video surveillance' },
  { slug: 'integration', icon: 'network', glow: '0,40,104', title: 'Repair & maintenance', body: 'We repair gates that stop, and we check operators, hinges or chain, rollers, loops, photo eyes, keypads, batteries, fuses, and wiring on a schedule set for that site.', href: '/services/gate-repair', cta: 'Gate repair' },
];

const needs = [
  { number: '01', title: 'Preventive maintenance', text: 'A checklist for the operator, the leaf, the safety devices, and the wiring. How often we come is set for that site.', href: '/services/maintenance-plans' },
  { number: '02', title: 'Repairs & service', text: 'A gate that will not open, will not close, or stops halfway.', href: '/services/gate-repair' },
  { number: '03', title: 'Retrofits & upgrades', text: 'An operator or entry system that is worn out, and what can still be kept.', href: '/contact?service=retrofit' },
  { number: '04', title: 'New installations', text: 'A new gate or access-control system planned around the lane you actually have.', href: '/services/security-gate-systems' },
];

const steps = [
  { t: 'Your call', title: 'Call and describe the issue', text: 'Tell us what the gate or entry system is doing and any standing instructions for the property.' },
  { t: 'Diagnosis', title: 'Remote checks where possible', text: 'On connected systems we check the operator, controller and network before a truck rolls.' },
  { t: 'Entry secured', title: 'Safe open or safe closed', text: 'The gate is held per the property’s instructions while parts and timing are confirmed.' },
  { t: 'On site', title: 'Fix and document', text: 'We repair what we can on the visit and document the cause and what we recommend next.' },
];

const faqs = [
  { q: 'Do you offer maintenance plans?', a: 'Yes. We check operators, hinges or chain, rollers and track, loops, photo eyes and safety devices, keypads, battery backup, fuses, grounding, and wiring. How often we come is set for that site. Start with an advanced consultation.' },
  { q: 'Can you work on an existing system?', a: 'Yes. We repair, retrofit, and upgrade gates and access equipment, and we install new ones. Tell us what you have and what it is doing.' },
  { q: 'Where do you provide service?', a: 'We are based in Clermont, Lake County. We schedule work in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay. Tell us the city so we can confirm the drive.' },
  { q: 'What should I do if a gate or access system is down?', a: 'Call (352) 282-0692. Same-day when available. The contact form does not send a technician.' },
];

export default function HomePage() {
  const latest = [...resources].sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1)).slice(0, 3);
  return <div className="fsc-home">
    <HomeHero />
    <div className="fsc-container fsc-stats-wrap"><StatTiles stats={stats} /></div>

    <section className="fsc-light fsc-section-new fsc-grid-bg" id="capabilities"><div className="fsc-container">
      <div className="fsc-section-heading fsc-section-heading-center"><div><h2>We like boring gates.<br/><em>They open, they close, they stay that way.</em></h2></div><p>One number for the operator, the credentials, and the cameras. We install them when you need a new entry, and we keep the ones you already have working.</p></div>
      <CursorCards cards={capabilities} />
      <p className="fsc-cap-note">The gate, the credentials, and the cameras can be planned as one entry. <Link href={integrationPath} className="fsc-text-link">System integration</Link>.</p>
    </div></section>

    <section className="fsc-light fsc-section-new" aria-labelledby="field-photos"><div className="fsc-container">
      <div className="fsc-section-heading"><div><p className="fsc-kicker">Gates, readers, and cameras</p><h2 id="field-photos">The equipment<br/><em>we work on.</em></h2></div></div>
      <PhotoGrid photos={[photos.commercialLpr, photos.storageSlide, photos.hoaCallbox, photos.technician, photos.storageSlideKeypad, photos.gateCamera]} />
    </div></section>

    <section className="fsc-ir-section" id="night-view"><div className="fsc-container">
      <div className="fsc-section-heading"><div><p className="fsc-kicker">Night view · simulated demonstration</p><h2>Your cursor is the camera’s<br/><em>infrared illuminator.</em></h2></div><p>A controlled entry at 2 a.m., drawn as a wireframe. Sweep the scene to light it up, hover any device or vehicle to see the kind of record an integrated system keeps, and click to take a snapshot. This is a demonstration of how the parts fit together, not a live feed.</p></div>
      <NightView />
    </div></section>

    <section className="fsc-maintenance fsc-section-new" id="maintenance"><div className="fsc-container fsc-two-column"><div><p className="fsc-kicker">Preventive maintenance</p><h2>Give maintenance a place<br/>in your property’s plan.</h2><p>A gate that needs attention again. An entry system people no longer trust. Equipment with an unclear service history.</p><p>We check the operator, the hinges or chain, the rollers and track, the loops, the photo eyes, the keypad, the battery, the fuses, and the wiring. How often we come is set for that site.</p><Link href="/services/maintenance-plans" className="fsc-btn-primary" data-fsc-event="maintenance_interest" data-fsc-placement="home_maintenance">See what a maintenance visit covers <span aria-hidden="true">›</span></Link></div><div className="fsc-maintenance-note"><span className="fsc-note-label">A useful starting point</span><h3>What is happening<br/>at your property?</h3><ul><li>Recurring gate or entry problems</li><li>Aging equipment and upgrade questions</li><li>A need for ongoing maintenance</li><li>A new property or portfolio to manage</li></ul><p>Your equipment and site conditions guide the conversation.</p></div></div></section>

    <section className="fsc-light fsc-section-new" id="services"><div className="fsc-container"><div className="fsc-section-heading"><div><p className="fsc-kicker">Start with what you need</p><h2>From the recurring issue<br/>to the next major project.</h2></div><p>Practical help for the systems that keep tenants, residents, visitors and vendors moving through your property.</p></div><div className="fsc-service-list">{needs.map(n => <Link key={n.number} href={n.href} className="fsc-service-item" data-fsc-event={n.href === '#maintenance' ? 'maintenance_interest' : undefined} data-fsc-placement={n.href === '#maintenance' ? 'home_services' : undefined}><span className="fsc-service-number">{n.number}</span><h3>{n.title}</h3><p>{n.text}</p><span className="fsc-service-arrow" aria-hidden="true">↗</span></Link>)}</div></div></section>

    <section className="fsc-emergency-block fsc-emergency-timeline"><div className="fsc-container">
      <div className="fsc-emergency-head"><div><p className="fsc-kicker">Same-day when available</p><h2>Gate down? Entry system offline?</h2><p>Call {site.phoneDisplay}. A form does not send a technician.</p></div><a href={`tel:${site.emergencyPhone}`} className="fsc-emergency-call" data-fsc-event="emergency_call" data-fsc-placement="home_emergency">Call {site.emergencyPhoneDisplay} <span aria-hidden="true">›</span></a></div>
      <Reveal className="fsc-timeline"><div className="fsc-timeline-bar" aria-hidden="true" />{steps.map((s) => <div key={s.title} className="fsc-step"><i aria-hidden="true" /><span className="fsc-step-t">{s.t}</span><b>{s.title}</b><p>{s.text}</p></div>)}</Reveal>
    </div></section>

    <section className="fsc-mfr fsc-grid-bg" aria-labelledby="mfr-heading"><div className="fsc-container"><p className="fsc-kicker" id="mfr-heading">Equipment we install and service</p></div>
      <div className="fsc-marquee" aria-hidden="false"><ul className="fsc-marquee-track">{[...manufacturers, ...manufacturers].map((m, i) => <li key={`${m.file}-${i}`} className="fsc-mfr-card" aria-hidden={i >= manufacturers.length || undefined}><Image src={`/manufacturers/${m.file}.png`} alt={i < manufacturers.length ? m.name : ''} width={160} height={70} sizes="160px" loading="eager" unoptimized /></li>)}</ul></div>
    </section>

    <section className="fsc-light fsc-section-new" id="service-areas"><div className="fsc-container fsc-two-column"><div><p className="fsc-kicker">Headquarters in Clermont, Lake County</p><h2>Commercial and residential,<br/>from Clermont to Tampa Bay.</h2><p>Warehouses, offices, storage facilities, gated communities, multifamily, and estates. Tell us the city, the equipment, and the work you need.</p><Link href="/service-areas" className="fsc-text-link">Explore our service areas →</Link><nav className="fsc-city-links" aria-label="City service areas"><Link href="/service-areas/orlando">Orlando</Link><Link href="/service-areas/kissimmee">Kissimmee</Link><Link href="/service-areas/winter-garden">Winter Garden</Link><Link href="/service-areas/clermont">Clermont</Link><Link href="/service-areas/tampa">Tampa Bay</Link></nav><div className="fsc-area-links"><Link href="/industries/commercial-properties">Commercial properties</Link><Link href="/industries/hoa-gated-communities">HOAs & gated communities</Link><Link href="/industries/storage-facilities">Storage facilities</Link><Link href="/industries">All property types</Link></div></div><div className="fsc-faq"><h3>A few things to know</h3>{faqs.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div></div></section>

    <section className="fsc-trust fsc-light fsc-section-new" aria-labelledby="proof-heading"><div className="fsc-container fsc-trust-grid"><div><p className="fsc-kicker">How to reach us</p><h2 id="proof-heading">Talk with the Clermont team.</h2><p>Call, email, or send a note about the property. If the gate is down, call.</p></div><ul><li><span>Headquarters area</span>Clermont, Lake County, Florida</li><li><span>Phone</span><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a></li><li><span>Scheduling</span>Same-day when available</li><li><span>Email</span><a href={`mailto:${site.email}`}>{site.email}</a></li></ul></div></section>

    <section className="fsc-resources-row fsc-section-new"><div className="fsc-container"><div className="fsc-section-heading"><div><p className="fsc-kicker">Straight from the field</p><h2>Answers you can<br/>act on.</h2></div><Link href="/resources" className="fsc-text-link">All resources →</Link></div>
      <div className="fsc-notes">{latest.map((r) => <Link key={r.slug} href={`/resources/${r.slug}`} className="fsc-note"><small>{new Date(r.updatedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small><b>{r.question}</b><span>{r.shortAnswer.length > 180 ? `${r.shortAnswer.slice(0, 177).trimEnd()}…` : r.shortAnswer}</span></Link>)}</div>
    </div></section>

    <section className="fsc-final-cta"><div className="fsc-container"><p className="fsc-kicker">Let’s talk about your property</p><h2>A clear next step starts here.</h2><p>Book an advanced consultation. We’ll contact you to discuss the property and the next step.</p><Link href="/contact" className="fsc-btn-primary" data-fsc-event="assessment_cta" data-fsc-placement="home_final">Book an advanced consultation <span aria-hidden="true">›</span></Link></div></section>
    <FAQSchema items={faqs} />
    {[photos.commercialLpr, photos.storageSlide, photos.hoaCallbox, photos.technician, photos.storageSlideKeypad, photos.gateCamera].map((photo) => <ImageObjectSchema key={photo.src} photo={photo} />)}
  </div>;
}
