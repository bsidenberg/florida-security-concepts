import type { Metadata } from 'next';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { queryDefaults } from '@/lib/leads/query';
import { ContactPageSchema } from '@/components/Schema';
import { site } from '@/data/site';
export const metadata: Metadata = { title: 'Request a Free Property Assessment', description: 'Talk with Florida Security Concepts about gate maintenance, repairs, retrofits or installation in Orlando and Tampa.', alternates: { canonical: '/contact' } };
export default function ContactPage({ searchParams }: { searchParams?: Record<string,string|string[]|undefined> }) {
  return <div className="fsc-contact fsc-light"><div className="fsc-container"><div className="fsc-contact-grid"><div><LeadCaptureForm defaults={queryDefaults(searchParams)} showHeading localPreview={process.env.FSC_LOCAL_PREVIEW === '1'} /></div><aside className="fsc-contact-aside"><p className="fsc-kicker">A conversation about your property</p><h2>Start with what you know.</h2><p>You do not need equipment specifications or a detailed scope to get in touch.</p><p>We’ll contact you to discuss your needs and arrange the next step. An assessment request is not an appointment booking.</p><div><h3>Prefer to talk?</h3><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a></div><div><h3>Orlando & Tampa</h3><p>Enter your property’s city or area so we can confirm service for your location.</p></div></aside></div></div><ContactPageSchema url={site.url + '/contact'}/></div>;
}
