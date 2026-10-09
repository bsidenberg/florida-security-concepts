import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { queryDefaults } from '@/lib/leads/query';
import { ContactPageSchema } from '@/components/Schema';
import { site } from '@/data/site';
export const metadata: Metadata = buildPageMetadata({
  title: 'Book an Advanced Consultation',
  description: 'Talk with Florida Security Concepts in Clermont about gate repair, maintenance, retrofits, or a new installation. If a gate is down, call (352) 282-0692.',
  path: '/contact',
});
export default async function ContactPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  return <div className="fsc-contact fsc-light"><div className="fsc-container"><div className="fsc-contact-grid"><div><LeadCaptureForm defaults={queryDefaults(await searchParams)} showHeading localPreview={process.env.FSC_LOCAL_PREVIEW === '1'} /></div><aside className="fsc-contact-aside"><p className="fsc-kicker">A conversation about your property</p><h2>Start with what you know.</h2><p>You do not need equipment model numbers to get in touch.</p><p>We’ll contact you to discuss the property and the next step. This form does not book a visit or send a technician.</p><div><h3>Prefer to talk?</h3><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a><a className="break-all" href={`mailto:${site.email}`}>{site.email}</a></div><div><h3>Instagram</h3><a href={site.social.instagram}>@{site.instagramHandle}</a><p>instagram.com/floridasecurityconcepts</p></div><div><h3>Where we work</h3><p>Clermont, Orlando, Kissimmee, Winter Garden, and Tampa Bay. Enter your property’s city so we can confirm the drive.</p></div><div><h3>Gate down?</h3><p>Call {site.phoneDisplay}. Same-day when available. Do not use this form to request a dispatch.</p></div></aside></div></div><ContactPageSchema url={site.url + '/contact'}/></div>;
}
