import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Terms and SMS Terms',
  description: 'Terms for Florida Security Concepts, including the FSC Sentinel Alerts text message program.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <div className="fsc-light"><div className="fsc-container py-16 max-w-3xl space-y-6">
    <h1 className="text-3xl font-semibold">Terms</h1>
    <p>{site.name} is a division of Florida Pole Barn Builders LLC. Information on this website is general and does not create a service agreement. Work is performed under a written proposal or agreement.</p>
    <h2 className="text-xl font-semibold">FSC Sentinel Alerts (SMS program)</h2>
    <p><strong>What it is.</strong> FSC Sentinel Alerts sends automated gate and access-control equipment alerts, such as an operator going offline or a safety sensor fault, to {site.name} staff and on-call technicians. It does not send marketing messages.</p>
    <p><strong>How you opt in.</strong> Only {site.name} employees and on-call technicians are enrolled. You opt in by giving {site.name} management your mobile number in writing (a signed on-call acknowledgment or an email) stating that you agree to receive alert texts. There is no public sign-up, and consent is not a condition of any purchase.</p>
    <p><strong>Message frequency</strong> varies with equipment events. <strong>Message and data rates may apply.</strong></p>
    <p><strong>Opt out</strong> at any time by replying STOP. Reply HELP for help, or contact us at <a className="underline" href={`tel:${site.phone}`}>{site.phoneDisplay}</a> or <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>.</p>
    <p>Carriers are not liable for delayed or undelivered messages.</p>
    <p>See our <Link href="/privacy" className="underline">Privacy Policy</Link> for how we handle your information. Mobile numbers and opt-in consent are never shared with third parties for marketing.</p>
  </div></div>;
}
