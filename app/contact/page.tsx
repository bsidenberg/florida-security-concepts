import type { Metadata } from 'next';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { queryDefaults } from '@/lib/leads/query';
import { ContactPageSchema } from '@/components/Schema';
import { site } from '@/data/site';
import { canonicalUrl } from '@/lib/seo/canonical';
export const metadata: Metadata = { title: 'Request an Advanced Consultation', description: 'Talk with Florida Security Concepts about gate maintenance, repairs, retrofits, or installation in Clermont, Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay.', alternates: { canonical: canonicalUrl('/contact') } };
export default async function ContactPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  return <div className="fsc-contact fsc-light"><div className="fsc-container"><div className="fsc-contact-grid"><div><LeadCaptureForm defaults={queryDefaults(await searchParams)} showHeading localPreview={process.env.FSC_LOCAL_PREVIEW === '1'} /></div><aside className="fsc-contact-aside"><p className="fsc-kicker">A conversation about your property</p><h2>Start with what you know.</h2><p>You do not need equipment specifications or a detailed scope to get in touch.</p><p>We’ll contact you to discuss your needs and arrange the next step. An assessment request is not an appointment booking.</p><div><h3>Prefer to talk?</h3><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a><a href={site.booking.bookUrl} target="_blank" rel="noopener noreferrer">{site.booking.label}</a></div><div><h3>Clermont & Lake County</h3><p>We are based in Clermont and work across Lake County, Orlando, Kissimmee, Winter Garden, and Tampa Bay. Enter your property’s city so we can confirm the visit.</p></div></aside></div></div><ContactPageSchema url={canonicalUrl('/contact')}/></div>;
}
