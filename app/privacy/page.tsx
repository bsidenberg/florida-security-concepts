import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Florida Security Concepts handles the information you share with us, including text message alerts.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <div className="fsc-light"><div className="fsc-container py-16 max-w-3xl space-y-6">
    <h1 className="text-3xl font-semibold">Privacy Policy</h1>
    <p>{site.name} is a division of Florida Pole Barn Builders LLC. This policy explains how we handle information you share with us.</p>
    <h2 className="text-xl font-semibold">Information you send us</h2>
    <p>When you contact us by phone, email or our contact form, we use your details only to respond to your request and provide our services. The contact form explains exactly what it collects and how long it is kept.</p>
    <h2 className="text-xl font-semibold">Text message (SMS) alerts</h2>
    <p>We send automated equipment alert text messages to our own staff and on-call technicians who have agreed to receive them. See our <Link href="/terms" className="underline">SMS terms</Link> for program details.</p>
    <p>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties. Information may be shared only with the service providers that deliver our messages.</p>
    <h2 className="text-xl font-semibold">We do not sell your information</h2>
    <p>We do not sell or rent personal information.</p>
    <h2 className="text-xl font-semibold">Contact</h2>
    <p>Questions about your information: <a className="underline" href={`mailto:${site.email}`}>{site.email}</a> or <a className="underline" href={`tel:${site.phone}`}>{site.phoneDisplay}</a>.</p>
  </div></div>;
}
