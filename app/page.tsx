import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FAQSchema } from '@/components/Schema';
import { HomeHero } from '@/components/home/HomeHero';
import { StatTiles, type Stat } from '@/components/home/StatTiles';
import { CursorCards, type CapabilityCard } from '@/components/home/CursorCards';
import { NightView } from '@/components/home/NightView';
import { Reveal } from '@/components/home/Reveal';
import { site } from '@/data/site';
import { locations } from '@/data/locations';
import { resources } from '@/data/resources';

export const metadata: Metadata = { title: 'Gate & Access-Control Service for HOAs | Orlando & Tampa', description: 'Preventive maintenance, repairs, 24/7 emergency service and new installations for HOAs, property managers and CAMs. Request a free property assessment.', alternates: { canonical: '/' } };

// Equipment platforms FSC installs and services (owner-confirmed 2026-10-02).
const manufacturers = [
  { file: 'linear', name: 'Linear' }, { file: 'hysecurity', name: 'HySecurity' }, { file: 'liftmaster', name: 'LiftMaster' }, { file: 'essex', name: 'Essex Electronics' },
  { file: 'all-o-matic', name: 'All-O-Matic' }, { file: 'access-one', name: 'Access One Technologies' }, { file: 'aiphone', name: 'Aiphone' }, { file: 'chamberlain-elite', name: 'Chamberlain Elite' },
  { file: 'lockey', name: 'Lockey USA' }, { file: 'doorking', name: 'DKS DoorKing' }, { file: 'viking', name: 'Viking Access Systems' },
];

const stats: Stat[] = [
  { value: 24, display: '24/7', label: 'emergency service', note: 'EVERY DAY OF THE YEAR' },
  { value: 2, display: '2', label: 'metro areas, one number to call', note: 'ORLANDO · TAMPA' },
  { value: locations.length, display: String(locations.length), label: 'service areas across Central Florida', note: 'SEE ALL SERVICE AREAS' },
  { value: manufacturers.length, display: String(manufacturers.length), label: 'equipment platforms installed and serviced', note: 'GATES · ACCESS · INTERCOM' },
];

const capabilities: CapabilityCard[] = [
  { slug: 'gates', icon: 'gate', glow: '191,10,48', title: 'Gates & automation', body: 'Swing, slide and barrier-arm operators with battery backup and safety loops, maintained on a schedule so they keep working in August.', href: '/services/gate-automation', cta: 'Gate automation' },
  { slug: 'access', icon: 'access', glow: '0,40,104', title: 'Access control', body: 'Fobs, phone credentials, call boxes and guest passes managed from one dashboard. Add a resident in seconds, revoke one in less.', href: '/services/access-control', cta: 'Access control' },
  { slug: 'video', icon: 'camera', glow: '191,10,48', title: 'Video & plate recognition', body: 'Cameras placed where incidents happen, plus plate readers that turn every vehicle into a searchable record with a timestamp and a photo.', href: '/services/video-surveillance', cta: 'Video surveillance' },
  { slug: 'integration', icon: 'network', glow: '0,40,104', title: 'Integration & maintenance', body: 'Gate, cameras, readers and network on one managed system, with a preventive maintenance plan your board can budget for.', href: '/services/security-system-integration', cta: 'System integration' },
];

const needs = [
  { number: '01', title: 'Preventive maintenance', text: 'Plan ongoing care for the gates and access equipment your community relies on.', href: '#maintenance' },
  { number: '02', title: 'Repairs & service', text: 'Get help with recurring faults, unreliable entry or equipment that has stopped working.', href: '/contact?service=repair' },
  { number: '03', title: 'Retrofits & upgrades', text: 'Review aging operators and entry systems, and explore what can work with your property.', href: '/contact?service=retrofit' },
  { number: '04', title: 'New installations', text: 'Plan a new gate or access-control system around your entry points and everyday use.', href: '/services/security-gate-systems' },
];

const steps = [
  { t: 'Your call', title: 'Call and describe the issue', text: 'Tell us what the gate or entry system is doing and any standing instructions your community has.' },
  { t: 'Diagnosis', title: 'Remote checks where possible', text: 'On connected systems we check the operator, controller and network before a truck rolls.' },
  { t: 'Entry secured', title: 'Safe open or safe closed', text: 'The gate is held per your community’s instructions while parts and timing are confirmed.' },
  { t: 'On site', title: 'Fix and document', text: 'We repair what we can on the visit and document the cause and what we recommend next.' },
];

const faqs = [
  { q: 'Do you offer preventive-maintenance contracts?', a: 'Yes. We offer preventive maintenance for gates and access-control systems. The equipment, condition and use of your property help determine the scope. Start with a free property assessment request.' },
  { q: 'Can you work on an existing system?', a: 'We handle service, repairs, retrofits and upgrades as well as new installations. Tell us about your existing equipment and the issue so we can discuss the right next step. Compatibility is assessed for each property.' },
  { q: 'Where do you provide service?', a: 'Our focus is the Orlando market, and we also serve Tampa. Share your property’s city or area so we can confirm service for your location.' },
  { q: 'What should I do if a gate or access system is down?', a: 'Call Florida Security Concepts for 24/7 emergency service. A website request does not automatically dispatch a technician or confirm an arrival time.' },
];

export default function HomePage() {
  const latest = [...resources].sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1)).slice(0, 3);
  return <div className="fsc-home">
    <HomeHero />
    <div className="fsc-container fsc-stats-wrap"><StatTiles stats={stats} /></div>

    <section className="fsc-light fsc-section-new fsc-grid-bg" id="capabilities"><div className="fsc-container">
      <div className="fsc-section-heading fsc-section-heading-center"><div><h2>One partner.<br/><em>Four systems that work as one.</em></h2></div><p>From the gate operator to the camera to the credential in a resident’s pocket, we install and maintain the whole entry, so there is one number to call.</p></div>
      <CursorCards cards={capabilities} />
    </div></section>

    <section className="fsc-ir-section" id="night-view"><div className="fsc-container">
      <div className="fsc-section-heading"><div><p className="fsc-kicker">Night view · simulated demonstration</p><h2>Your cursor is the camera’s<br/><em>infrared illuminator.</em></h2></div><p>A community entry at 2 a.m., drawn as a wireframe. Sweep the scene to light it up, hover any device or vehicle to see the kind of record an integrated system keeps, and click to take a snapshot. This is a demonstration of how the parts fit together, not a live feed.</p></div>
      <NightView />
    </div></section>

    <section className="fsc-maintenance fsc-section-new" id="maintenance"><div className="fsc-container fsc-two-column"><div><p className="fsc-kicker">Preventive maintenance</p><h2>Give maintenance a place<br/>in your property’s plan.</h2><p>A gate that needs attention again. An entry system residents no longer trust. Equipment with an unclear service history.</p><p>Let’s look at what your community has and discuss a maintenance plan suited to its equipment and use.</p><Link href="/contact?service=preventive-maintenance" className="fsc-btn-primary" data-fsc-event="assessment_cta maintenance_interest" data-fsc-placement="home_maintenance">Discuss preventive maintenance <span aria-hidden="true">›</span></Link></div><div className="fsc-maintenance-note"><span className="fsc-note-label">A useful starting point</span><h3>What is happening<br/>at your property?</h3><ul><li>Recurring gate or entry problems</li><li>Aging equipment and upgrade questions</li><li>A need for ongoing maintenance</li><li>A new community or property to manage</li></ul><p>Your equipment and site conditions guide the conversation.</p></div></div></section>

    <section className="fsc-light fsc-section-new" id="services"><div className="fsc-container"><div className="fsc-section-heading"><div><p className="fsc-kicker">Start with what you need</p><h2>From the recurring issue<br/>to the next major project.</h2></div><p>Practical help for the systems that keep residents, visitors and vendors moving through your property.</p></div><div className="fsc-service-list">{needs.map(n => <Link key={n.number} href={n.href} className="fsc-service-item" data-fsc-event={n.href === '#maintenance' ? 'maintenance_interest' : undefined} data-fsc-placement={n.href === '#maintenance' ? 'home_services' : undefined}><span className="fsc-service-number">{n.number}</span><h3>{n.title}</h3><p>{n.text}</p><span className="fsc-service-arrow" aria-hidden="true">↗</span></Link>)}</div></div></section>

    <section className="fsc-emergency-block fsc-emergency-timeline"><div className="fsc-container">
      <div className="fsc-emergency-head"><div><p className="fsc-kicker">24/7 emergency service</p><h2>Gate down? Entry system offline?</h2><p>Call FSC to discuss the issue. A form request does not dispatch a technician.</p></div><a href={`tel:${site.emergencyPhone}`} className="fsc-emergency-call" data-fsc-event="emergency_call" data-fsc-placement="home_emergency">Call {site.emergencyPhoneDisplay} <span aria-hidden="true">›</span></a></div>
      <Reveal className="fsc-timeline"><div className="fsc-timeline-bar" aria-hidden="true" />{steps.map((s) => <div key={s.title} className="fsc-step"><i aria-hidden="true" /><span className="fsc-step-t">{s.t}</span><b>{s.title}</b><p>{s.text}</p></div>)}</Reveal>
    </div></section>

    <section className="fsc-mfr fsc-grid-bg" aria-labelledby="mfr-heading"><div className="fsc-container"><p className="fsc-kicker" id="mfr-heading">Equipment we install and service</p></div>
      <div className="fsc-marquee" aria-hidden="false"><ul className="fsc-marquee-track">{[...manufacturers, ...manufacturers].map((m, i) => <li key={`${m.file}-${i}`} className="fsc-mfr-card" aria-hidden={i >= manufacturers.length || undefined}><Image src={`/manufacturers/${m.file}.png`} alt={i < manufacturers.length ? m.name : ''} width={160} height={70} sizes="160px" loading="eager" unoptimized /></li>)}</ul></div>
    </section>

    <section className="fsc-light fsc-section-new"><div className="fsc-container fsc-two-column"><div><p className="fsc-kicker">Orlando first. Tampa too.</p><h2>Local service for<br/>the communities you manage.</h2><p>From one property to a management portfolio, start with the city, the equipment and the work you need.</p><Link href="/service-areas" className="fsc-text-link">Explore our service areas →</Link><div className="fsc-area-links"><Link href="/industries/hoa-gated-communities">HOAs & gated communities</Link><Link href="/industries/property-managers">Property managers & CAMs</Link></div></div><div className="fsc-faq"><h3>A few things to know</h3>{faqs.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div></div></section>

    <section className="fsc-resources-row fsc-section-new"><div className="fsc-container"><div className="fsc-section-heading"><div><p className="fsc-kicker">Straight from the field</p><h2>Answers your board<br/>can act on.</h2></div><Link href="/resources" className="fsc-text-link">All resources →</Link></div>
      <div className="fsc-notes">{latest.map((r) => <Link key={r.slug} href={`/resources/${r.slug}`} className="fsc-note"><small>{new Date(r.updatedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small><b>{r.question}</b><span>{r.shortAnswer.length > 180 ? `${r.shortAnswer.slice(0, 177).trimEnd()}…` : r.shortAnswer}</span></Link>)}</div>
    </div></section>

    <section className="fsc-final-cta"><div className="fsc-container"><p className="fsc-kicker">Let’s talk about your property</p><h2>A clear next step starts here.</h2><p>Request a free property assessment. We’ll contact you to discuss your needs and arrange the next step.</p><Link href="/contact" className="fsc-btn-primary" data-fsc-event="assessment_cta" data-fsc-placement="home_final">Request a Free Property Assessment <span aria-hidden="true">›</span></Link></div></section>
    <FAQSchema items={faqs} />
  </div>;
}
