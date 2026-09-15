'use client';
import Link from 'next/link';
import { FormEvent, useContext, useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackLeadSubmitted, validationErrorProps, deliveryErrorClass, type AnalyticsEvent, type AnalyticsProps } from '@/lib/analytics/events';
import { regionFromCity } from '@/lib/analytics/region';
import { propertyTypes, serviceOptions, legacyServices, urgencyOptions, contactMethods } from '@/lib/leads/options';
import { validateLead } from '@/lib/leads/validateLead';
import type { LeadFormDefaults } from '@/lib/leads/query';
import { site } from '@/data/site';
import { LocalPreviewContext } from './LocalPreviewContext';
export type { LeadFormDefaults } from '@/lib/leads/query';
type Fields = Record<string,string>;
const blank: Fields = { fullName:'', email:'', phone:'', propertyType:'', city:'', service:'', company:'', urgency:'Not specified', contactMethod:'Email', message:'', honeypot:'' };
const labels: Fields = { fullName:'Full name', email:'Email', phone:'Phone', propertyType:'Property type', city:'City / service area', service:'Service needed', company:'Company / community name', urgency:'Timing', contactMethod:'Preferred contact method', message:'Tell us about your property and needs' };
export function LeadCaptureForm({ defaults = {}, submitLabel, showHeading = false, localPreview: providedLocalPreview = false }: { defaults?: LeadFormDefaults; submitLabel?: string; showHeading?: boolean; localPreview?: boolean }) {
  const localPreview = useContext(LocalPreviewContext) || providedLocalPreview;
  const { service, propertyType, city, urgency } = defaults;
  const id = useId();
  const pathname = usePathname();
  const [values,setValues] = useState<Fields>(() => ({ ...blank, service:defaults.service || '', propertyType:defaults.propertyType || '', city:defaults.city || '', urgency:defaults.urgency || 'Not specified' }));
  const previousDefaults = useRef(defaults);
  const [errors,setErrors] = useState<Fields>({});
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [receipt,setReceipt] = useState<string|null>(null);
  const [expired,setExpired] = useState(false);
  const [detailsOpen,setDetailsOpen] = useState(defaults.urgency === 'Emergency');
  const locked = useRef(false);
  const attempt = useRef<{fingerprint:string; id:string}|null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  // Analytics is categorical only and never runs in local preview. Arguments are computed inside the guard so nothing analytics-related can throw in the submit path.
  function emit<E extends AnalyticsEvent>(event: E, props: () => AnalyticsProps<E>) { if (localPreview) return; try { track(event, props()); } catch { /* Analytics cannot change form or delivery state. */ } }
  const isEmergency = values.urgency === 'Emergency';
  const displayedServices = legacyServices.includes(values.service) ? [...serviceOptions, {value:values.service,label:values.service}] : serviceOptions;
  useEffect(() => {
    const previous = previousDefaults.current;
    setValues(v => {
      const next = {...v};
      const current = {service, propertyType, city, urgency};
      for (const key of ['service','propertyType','city','urgency'] as const) if (current[key] !== previous[key]) next[key] = current[key] || (key === 'urgency' ? 'Not specified' : '');
      return next;
    });
    previousDefaults.current = {service, propertyType, city, urgency};
    if (urgency === 'Emergency') setDetailsOpen(true);
  }, [service, propertyType, city, urgency]);
  useEffect(() => { if (message) errorRef.current?.focus(); }, [message, errors]);
  useEffect(() => { if (receipt !== null) receiptRef.current?.focus(); }, [receipt]);
  function change(name: string,value: string) { setValues(v => ({...v,[name]:value})); if (name !== 'honeypot' && !started.current) { started.current = true; emit('assessment_form_start',() => ({ page_template:pathname })); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    setMessage(''); setErrors({}); setExpired(false);
    const validation = validateLead({...values,sourcePage:pathname});
    if (!validation.ok) { setErrors(validation.errors); setMessage('Please review the highlighted fields. Your other details are still here.'); emit('assessment_validation_error',() => validationErrorProps(validation.errors,values)); return; }
    const normalized = validation.lead;
    const fingerprint = JSON.stringify(['fullName','phone','email','propertyType','service','city','company','urgency','contactMethod','message'].map(key => normalized[key as keyof typeof normalized] || ''));
    if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, id:crypto.randomUUID() };
    const logicalRequestId = attempt.current.id;
    emit('assessment_submit_attempt',() => ({ service_category:normalized.service, property_category:normalized.propertyType, region:regionFromCity(normalized.city), urgency_category:normalized.urgency }));
    locked.current = true; setBusy(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(),20000);
    try {
      const response = await fetch('/api/leads',{ method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal, body:JSON.stringify({...values, sourcePage:pathname, serviceSlug:defaults.serviceSlug, industrySlug:defaults.industrySlug, locationSlug:defaults.locationSlug, requestId:attempt.current.id}) });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok === true) {
        setReceipt(typeof data.requestId === 'string' ? data.requestId : attempt.current.id);
        if (!localPreview) { try { trackLeadSubmitted(logicalRequestId,{ service_category:normalized.service, urgency_category:normalized.urgency || 'Not specified' }); } catch { /* Analytics cannot change confirmed receipt. */ } }
        return;
      }
      if (data?.code === 'INVALID' && data?.fields && typeof data.fields === 'object') emit('assessment_validation_error',() => validationErrorProps(data.fields,values));
      else emit('assessment_delivery_error',() => ({ error_class:deliveryErrorClass({ status:response.status, code:data?.code, hasBody:Boolean(data) }) }));
      if (data?.fields && typeof data.fields === 'object') setErrors(data.fields);
      if (data?.code === 'LOCAL_ONLY') { setErrors({email:'Use a synthetic email ending in @example.invalid for this local review.'}); setMessage('This preview accepts test details only. Please update the email field.'); }
      else if (data?.code === 'EXPIRED') { setExpired(true); setMessage('This request’s retry window has ended. Call us to check its status, or explicitly start a new request.'); }
      else if (response.status === 504 || data?.code === 'PENDING' || data?.code === 'RECEIPT_UNKNOWN' || !data) setMessage('We could not confirm whether your request was received. Retry the same request below, or call us to check. Your details have been kept.');
      else if (response.status === 429) setMessage('Please wait before trying again. Your details have been kept, or you can call us directly.');
      else if (data?.code === 'CONFLICT') setMessage('This request could not be confirmed. Please call us to check its status before sending another request.');
      else if (data?.code === 'DELIVERY_FAILED') setMessage('Your request could not be delivered. Please contact us directly or try again shortly.');
      else if (data?.code === 'CONFIGURATION') setMessage("We couldn't process your request right now. Your details have been kept — please try again shortly or call us.");
      else if (response.status === 400) setMessage('Please review the highlighted fields and try again.');
      else setMessage(localPreview ? 'The local request could not be saved. Use an example.invalid email for this review, then retry or check the local service.' : 'Your request could not be confirmed. Please try again or contact us directly. Your details have been kept.');
    } catch { emit('assessment_delivery_error',() => ({ error_class:deliveryErrorClass({ thrown:true, timedOut:controller.signal.aborted }) })); setMessage('We could not confirm whether your request was received. Retry the same request below, or call us to check. Your details have been kept.'); }
    finally { window.clearTimeout(timer); locked.current = false; setBusy(false); }
  }
  function control(name: string, required = false, options?: {label:string;value:string}[]) {
    const error = errors[name];
    const props = { id:`${id}-${name}`, name, value:values[name], onChange:(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => change(name,e.target.value), required, disabled:busy, 'aria-invalid':error ? true : undefined, 'aria-describedby':error ? `${id}-${name}-error` : undefined };
    return <div className={name === 'message' ? 'fsc-field fsc-field-wide' : 'fsc-field'} key={name}><label htmlFor={props.id}>{labels[name]}{required && <span aria-hidden="true"> *</span>}</label>{options ? <select {...props}><option value="" disabled>Select…</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : name === 'message' ? <textarea {...props} rows={4}/> : <input {...props} type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'} autoComplete={name === 'fullName' ? 'name' : name === 'phone' ? 'tel' : name === 'company' ? 'organization' : name === 'city' ? 'address-level2' : name === 'email' ? 'email' : undefined} placeholder={name === 'city' ? 'City or area of your property' : undefined}/>} {error && <p className="fsc-field-error" id={`${id}-${name}-error`}>{error}</p>}</div>;
  }
  const heading = showHeading && <div className="fsc-contact-intro"><p className="fsc-kicker">{isEmergency ? '24/7 emergency service' : 'Free property assessment'}</p><h1>{isEmergency ? 'Request emergency service.' : 'Tell us about your property.'}</h1><p>{isEmergency ? 'Call for urgent help. This form is an alternate contact option and does not dispatch a technician.' : 'Maintenance, repairs, an upgrade or a new installation. Let’s discuss what your community needs.'}</p><div className="fsc-contact-emergency"><a href={`tel:${site.emergencyPhone}`} data-fsc-event="emergency_call" data-fsc-placement="contact_intro">24/7 emergency service · Call {site.emergencyPhoneDisplay}</a><Link href={isEmergency ? '/contact' : '/contact?urgency=emergency'}>{isEmergency ? 'Return to a routine assessment' : 'Use the emergency contact form'}</Link></div></div>;
  if (receipt !== null) return <>{heading}<div className="fsc-form fsc-receipt" ref={receiptRef} role="status" tabIndex={-1}><span className="fsc-receipt-icon" aria-hidden="true">✓</span><h2>Request received</h2><p>{localPreview ? 'Your test request was saved locally. No message was sent to FSC.' : 'We’ll contact you to discuss your property and the next step.'}</p><p>An assessment is not yet booked. No technician has been dispatched.</p><p className="fsc-receipt-id">Request reference: {receipt}</p><a href={`tel:${site.phone}`}>Call {site.phoneDisplay}</a></div></>;
  return <>{heading}<form className="fsc-form" onSubmit={submit} aria-label="Site assessment request form" noValidate>
    <p className="fsc-form-top">{localPreview ? 'Local review: use synthetic details and an example.invalid email.' : 'Property assessments are free.'} <span>Fields marked * are required.</span></p>
    <div className="fsc-form-grid">{control('fullName',true)}{control('email',true)}{control('phone',true)}{control('propertyType',true,propertyTypes.map(value => ({value,label:value})))}{control('city',true)}{control('service',true,displayedServices)}</div>
    <details className="fsc-form-details" open={detailsOpen || Boolean(errors.company || errors.urgency || errors.contactMethod || errors.message)} onToggle={event => setDetailsOpen(event.currentTarget.open)}><summary>Add details <span>(optional)</span></summary><div className="fsc-form-grid">{control('company')}{control('urgency',false,urgencyOptions.map(value => ({value,label:value})))}{control('contactMethod',false,contactMethods.map(value => ({value,label:value})))}{control('message')}</div></details>
    <div className="fsc-honeypot" aria-hidden="true"><label>Leave this field empty<input name="fsc_check" tabIndex={-1} autoComplete="off" value={values.honeypot} onChange={e => change('honeypot',e.target.value)}/></label></div>
    {message && <div className="fsc-form-error" role="alert" ref={errorRef} tabIndex={-1}><p>{message}</p>{Object.keys(errors).length > 0 && <ul>{Object.keys(errors).map(name => <li key={name}><a href={`#${id}-${name}`} onClick={e => {e.preventDefault();document.getElementById(`${id}-${name}`)?.focus();}}>{labels[name] || name}: {errors[name]}</a></li>)}</ul>}<a href={`tel:${site.phone}`}>Call {site.phoneDisplay}</a></div>}
    <div className="text-xs leading-relaxed text-fsc-text-muted mt-3">
      <p>We use your contact and property details, along with the page and campaign information that brought you here, to respond to your request, with email delivery through Resend and inquiry records in our private business system. Please do not include gate codes, passwords or other sensitive security information.</p>
      <p className="mt-2">To prevent duplicate messages and resolve delivery problems, we keep an additional private copy of your request for seven days before scheduled cleanup, and minimal request identifiers and status records afterward. To limit repeated submissions, we temporarily use a protected identifier derived from your network address; this check does not store the address itself. For questions about your information, email info@floridasecurityconcepts.com.</p>
    </div>
    <div className="fsc-form-submit"><p>Your request starts a conversation.<br/>It does not book a visit or dispatch service.</p>{expired ? <button type="button" className="fsc-btn-primary" onClick={() => {attempt.current=null;setExpired(false);setMessage('');}}>Start a new request</button> : <button type="submit" className="fsc-btn-primary" disabled={busy}>{busy ? 'Sending request…' : message && attempt.current ? 'Retry request' : isEmergency ? 'Send emergency request' : submitLabel || 'Request a Free Property Assessment'} <span aria-hidden="true">↗</span></button>}</div><p className="sr-only" aria-live="polite">{busy ? 'Sending your request. Please wait.' : ''}</p>
  </form></>;
}
