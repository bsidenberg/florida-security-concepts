import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'FSC Sentinel Alerts: Optional Text Message Consent',
  description: 'How Florida Security Concepts staff can optionally opt in to FSC Sentinel equipment alert texts.',
  alternates: { canonical: '/sms-consent' },
};

export default function SmsConsentPage() {
  return <div className="fsc-light"><div className="fsc-container py-16 max-w-3xl space-y-6">
    <h1 className="text-3xl font-semibold">FSC Sentinel Alerts: optional text message consent</h1>
    <p>Florida Security Concepts LLC sends automated gate and access-control equipment alerts to its own employees and on-call technicians. Text messages are one optional way to receive these alerts. There is no public sign-up.</p>
    <p><strong>Text alerts are optional and not required.</strong> Agreeing to receive texts is not a condition of employment, of being on call, of any job duty, or of any purchase. Staff who do not opt in receive the same alerts by email and in the FSC Sentinel web console.</p>
    <h2 className="text-xl font-semibold">The opt-in form</h2>
    <p>Staff who want text alerts fill out the separate form below (on paper or by email to management). The consent box is unchecked by default, and leaving it unchecked has no effect on employment or on-call duties.</p>
    <div className="rounded border p-6 space-y-4">
      <p className="font-semibold">FSC Sentinel Alerts: optional text message consent form</p>
      <p>Name: ______________________</p>
      <p>Mobile number: ______________________</p>
      <label className="flex items-start gap-3">
        <input type="checkbox" defaultChecked={false} aria-label="Optional SMS consent (sample)" className="mt-1" />
        <span>(Optional, not required) I agree to receive automated FSC Sentinel equipment alert text messages (gate operator offline, fault and safety-sensor events) from {site.name} at the mobile number above. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time, or HELP for help. Consent is not a condition of employment, of being on call, or of any purchase.</span>
      </label>
      <p>Signature: ______________________ Date: __________</p>
    </div>
    <p>After management receives a signed form, the number is added to the alert route and the first text is an opt-in confirmation. Reply STOP at any time to opt out.</p>
    <p>See our <Link href="/terms" className="underline">SMS Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>. Mobile numbers and opt-in consent are never shared with third parties.</p>
  </div></div>;
}
