'use client';

import { FormEvent, useState, useEffect, useRef, useId } from 'react';
import { usePathname } from 'next/navigation';

const propertyTypes = [
  'HOA / gated community',
  'Multifamily / apartment / condo',
  'Storage facility',
  'Commercial property',
  'Industrial / warehouse',
  'Residential / estate',
  'Other',
];

const serviceOptions = [
  'New gate system',
  'Gate automation',
  'Access control',
  'Video surveillance',
  'Emergency repair',
  'Maintenance / service',
  'Full security system integration',
  'Not sure yet',
];

const urgencyOptions = [
  'Emergency',
  'This week',
  'This month',
  'Planning / budgeting',
];

const cities = [
  'Orlando',
  'Tampa',
  'Lakeland',
  'Kissimmee',
  'Winter Garden',
  'Clermont',
  'Lake Mary',
  'Sanford',
  'Ocala',
  'The Villages',
  'St. Petersburg',
  'Clearwater',
  'Brandon',
  'Wesley Chapel',
  'Other',
];

const contactMethods = ['Email', 'Phone call', 'Text message'];

export type LeadFormDefaults = {
  service?: string;
  propertyType?: string;
  city?: string;
  urgency?: string;
  serviceSlug?: string;
  industrySlug?: string;
  locationSlug?: string;
};

type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export function LeadCaptureForm({
  defaults = {},
  submitLabel = 'Submit Request',
}: {
  defaults?: LeadFormDefaults;
  submitLabel?: string;
}) {
  const pathname = usePathname();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attribution, setAttribution] = useState<Attribution>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setAttribution({
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      referrer: document.referrer || undefined,
    });
  }, []);

  // Move focus to the error region when a server error appears.
  useEffect(() => {
    if (formError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [formError]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setFormError(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string | undefined> = {
      fullName: fd.get('fullName')?.toString(),
      phone: fd.get('phone')?.toString(),
      email: fd.get('email')?.toString(),
      company: fd.get('company')?.toString(),
      propertyType: fd.get('propertyType')?.toString(),
      service: fd.get('service')?.toString(),
      city: fd.get('city')?.toString(),
      urgency: fd.get('urgency')?.toString(),
      contactMethod: fd.get('contactMethod')?.toString(),
      message: fd.get('message')?.toString(),
      honeypot: fd.get('company_name_extra')?.toString(),
      sourcePage: pathname || undefined,
      serviceSlug: defaults.serviceSlug,
      industrySlug: defaults.industrySlug,
      locationSlug: defaults.locationSlug,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      referrer: attribution.referrer,
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: {
        ok: boolean;
        error?: string;
        fields?: Record<string, string>;
        message?: string;
      } = await res.json().catch(() => ({ ok: false, error: 'Unexpected response.' }));

      if (!res.ok || !data.ok) {
        setFormError(
          data.error ||
            'Something went wrong submitting your request. Please try again or contact us directly.'
        );
        if (data.fields) setFieldErrors(data.fields);
        return;
      }

      setSubmitted(true);
      // Reset form so a back-button doesn't repopulate stale values.
      form.reset();
    } catch {
      setFormError(
        'We could not reach the server. Please check your connection and try again, or contact us directly.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="fsc-card p-8 md:p-10 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-fsc-ok/15 ring-1 ring-fsc-ok/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12l5 5L20 7"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-fsc-text">Request received</h3>
        <p className="mt-2 text-sm text-fsc-text-dim max-w-md mx-auto">
          A member of the Florida Security Concepts team will be in touch
          shortly. For an after-hours emergency, please also call our service
          line if available.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      id={formId}
      onSubmit={onSubmit}
      className="fsc-card p-6 md:p-8"
      aria-label="Site assessment request form"
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Full name"
          name="fullName"
          required
          autoComplete="name"
          error={fieldErrors.fullName}
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          error={fieldErrors.phone}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={fieldErrors.email}
        />
        <Field
          label="Company / community name"
          name="company"
          autoComplete="organization"
          error={fieldErrors.company}
        />
        <Select
          label="Property type"
          name="propertyType"
          required
          options={propertyTypes}
          defaultValue={defaults.propertyType}
          error={fieldErrors.propertyType}
        />
        <Select
          label="Service needed"
          name="service"
          required
          options={serviceOptions}
          defaultValue={defaults.service}
          error={fieldErrors.service}
        />
        <Select
          label="City / service area"
          name="city"
          options={cities}
          defaultValue={defaults.city}
          error={fieldErrors.city}
        />
        <Select
          label="Urgency"
          name="urgency"
          required
          options={urgencyOptions}
          defaultValue={defaults.urgency}
          error={fieldErrors.urgency}
        />
        <Select
          label="Preferred contact method"
          name="contactMethod"
          options={contactMethods}
          defaultValue="Email"
          error={fieldErrors.contactMethod}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Tell us about your property and needs"
            name="message"
            rows={4}
            error={fieldErrors.message}
          />
        </div>
      </div>

      {/* Honeypot — hidden from sighted users and assistive tech. Bots tend to fill it. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label>
          Company name (do not fill)
          <input
            type="text"
            name="company_name_extra"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Live region for status. */}
      <p
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className={`mt-4 text-sm ${
          formError ? 'text-fsc-warn' : 'sr-only'
        }`}
      >
        {formError}
      </p>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-fsc-text-muted">
          We respond to most assessment requests the same business day.
        </p>
        <button
          type="submit"
          disabled={busy}
          aria-disabled={busy}
          className="fsc-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? 'Submitting…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted mb-1.5">
        {label}
        {required && <span className="text-fsc-accent-glow"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={`w-full rounded-md border bg-fsc-bg/60 px-3.5 py-2.5 text-sm text-fsc-text placeholder-fsc-text-muted focus:ring-2 focus:outline-none transition ${
          error
            ? 'border-fsc-warn focus:border-fsc-warn focus:ring-fsc-warn/30'
            : 'border-fsc-border-strong focus:border-fsc-accent-glow focus:ring-fsc-accent/30'
        }`}
      />
      {error && (
        <span id={errorId} className="mt-1 block text-xs text-fsc-warn">
          {error}
        </span>
      )}
    </label>
  );
}

function Select({
  label,
  name,
  options,
  required,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted mb-1.5">
        {label}
        {required && <span className="text-fsc-accent-glow"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ''}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={`w-full rounded-md border bg-fsc-bg/60 px-3.5 py-2.5 text-sm text-fsc-text focus:ring-2 focus:outline-none transition ${
          error
            ? 'border-fsc-warn focus:border-fsc-warn focus:ring-fsc-warn/30'
            : 'border-fsc-border-strong focus:border-fsc-accent-glow focus:ring-fsc-accent/30'
        }`}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="mt-1 block text-xs text-fsc-warn">
          {error}
        </span>
      )}
    </label>
  );
}

function Textarea({
  label,
  name,
  rows = 4,
  error,
}: {
  label: string;
  name: string;
  rows?: number;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-text-muted mb-1.5">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={`w-full rounded-md border bg-fsc-bg/60 px-3.5 py-3 text-sm text-fsc-text placeholder-fsc-text-muted focus:ring-2 focus:outline-none transition resize-y ${
          error
            ? 'border-fsc-warn focus:border-fsc-warn focus:ring-fsc-warn/30'
            : 'border-fsc-border-strong focus:border-fsc-accent-glow focus:ring-fsc-accent/30'
        }`}
      />
      {error && (
        <span id={errorId} className="mt-1 block text-xs text-fsc-warn">
          {error}
        </span>
      )}
    </label>
  );
}
