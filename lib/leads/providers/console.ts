import type { DeliveryResult, ValidatedLead } from '../types';

// Console delivery — logs the lead in a structured form.
// Suitable for development. In production, treat console mode as a fallback
// that ensures leads are at least captured in server logs (e.g., Vercel Logs)
// rather than silently dropped — but emit a warning so it is replaced with a
// real provider before launch.

export async function deliverViaConsole(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const env = process.env.NODE_ENV;
  const banner =
    env === 'production'
      ? '[lead-delivery:console][PROD-FALLBACK]'
      : '[lead-delivery:console]';

  if (env === 'production') {
    console.warn(
      `${banner} LEAD_DELIVERY_MODE=console in production — configure a real provider before launch.`
    );
  }

  // Log a single structured line so it's easy to grep/aggregate.
  console.log(
    `${banner} new lead`,
    JSON.stringify({
      submittedAt: lead.submittedAt,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      propertyType: lead.propertyType,
      service: lead.service,
      city: lead.city,
      urgency: lead.urgency,
      contactMethod: lead.contactMethod,
      sourcePage: lead.sourcePage,
      serviceSlug: lead.serviceSlug,
      industrySlug: lead.industrySlug,
      locationSlug: lead.locationSlug,
      utm: {
        source: lead.utmSource,
        medium: lead.utmMedium,
        campaign: lead.utmCampaign,
      },
      referrer: lead.referrer,
      messagePreview: lead.message?.slice(0, 240),
    })
  );

  return { ok: true, mode: 'console' };
}
