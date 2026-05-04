// Lead capture types — shared between the form, API route, and delivery providers.

export type LeadInput = {
  // Required user fields
  fullName: string;
  phone: string;
  email: string;

  // Optional user fields
  company?: string;
  propertyType: string;
  service: string;
  city?: string;
  urgency: string;
  contactMethod?: string;
  message?: string;

  // Page context (populated by the form from the page it lives on)
  sourcePage?: string;
  serviceSlug?: string;
  industrySlug?: string;
  locationSlug?: string;

  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;

  // Spam mitigation — must be empty when received.
  honeypot?: string;
};

export type ValidatedLead = Required<
  Pick<LeadInput, 'fullName' | 'phone' | 'email' | 'propertyType' | 'service' | 'urgency'>
> &
  Omit<
    LeadInput,
    'fullName' | 'phone' | 'email' | 'propertyType' | 'service' | 'urgency' | 'honeypot'
  > & {
    submittedAt: string; // ISO 8601
  };

export type ValidationResult =
  | { ok: true; lead: ValidatedLead }
  | { ok: false; errors: Record<string, string> };

export type DeliveryMode = 'console' | 'resend' | 'supabase' | 'webhook';

export type DeliveryResult =
  | { ok: true; mode: DeliveryMode; deliveryId?: string }
  | { ok: false; mode: DeliveryMode | 'unknown'; reason: string };

export type ApiResponse =
  | { ok: true; message: string }
  | { ok: false; error: string; fields?: Record<string, string> };
