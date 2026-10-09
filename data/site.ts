// Centralized site-wide configuration. Update once, propagates everywhere.
// Empty string fields are intentional placeholders — fill before launch.
//
// Rendering rules:
// - Treat empty strings as "not set." Components must check truthiness.
// - JSON-LD must omit absent fields, not render empty strings.
// - CTAs always route to /contact even when phone/email are unset.

// Canonical production URL is the www form. The apex (floridasecurityconcepts.com)
// 308-redirects to www, so all canonical/sitemap/schema/OG output should use www.
// Override per environment via NEXT_PUBLIC_SITE_URL.
const DEFAULT_URL = 'https://www.floridasecurityconcepts.com';

function resolveUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!fromEnv) return DEFAULT_URL;
  // Strip trailing slash so we can safely append paths.
  return fromEnv.replace(/\/+$/, '');
}

export const site = {
  // Branding
  name: 'Florida Security Concepts',
  shortName: 'FSC',
  legalName: 'Florida Security Concepts',
  businessName: 'Florida Security Concepts',
  domain: 'floridasecurityconcepts.com',
  tagline:
    'Gate repair, maintenance, and access-control work for commercial and residential properties in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay.',

  // Resolved at module load. Override via NEXT_PUBLIC_SITE_URL.
  url: resolveUrl(),

  // Verified business contact info. Empty string = not set; components and
  // schema must hide UI / omit fields when unset.
  phone: '+13522820692', // E.164 — used by tel: links and JSON-LD telephone
  phoneDisplay: '(352) 282-0692', // Human-readable
  emergencyPhone: '+13522820692',
  emergencyPhoneDisplay: '(352) 282-0692',
  email: 'info@floridasecurityconcepts.com',

  address: {
    // No verified street address. street/postalCode stay blank. Schema emits an
    // area-level PostalAddress (Clermont, FL) and omits streetAddress until
    // hasPostalAddress() is true. Do not invent a street or ZIP.
    street: '',
    city: 'Clermont',
    region: 'FL',
    postalCode: '',
    country: 'US',
  },

  hours: 'Same-day when available',
  serviceRegions: ['Orlando', 'Kissimmee', 'Winter Garden', 'Clermont', 'Tampa Bay'],
  // Named in on-page copy and areaServed. Not a claim that each city has an office.
  serviceCities: [
    'Clermont',
    'Orlando',
    'Kissimmee',
    'Winter Garden',
    'Lakeland',
    'Tampa',
    'St. Petersburg',
    'Clearwater',
    'Brandon',
    'Wesley Chapel',
  ],
  serviceAreaSummary:
    'Based in Clermont, Lake County. We schedule work in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay.',

  instagramHandle: 'floridasecurityconcepts',
  social: {
    google: '',
    facebook: '',
    linkedin: '',
    instagram: 'https://www.instagram.com/floridasecurityconcepts/',
  },

  // TODO: Brian to populate with actual license numbers and manufacturer certifications
  licenses: {
    lowVoltage: '',
    electrical: '',
    alarm: '',
    other: [] as string[],
  },
  manufacturerCerts: [] as string[],
};

// --- Helpers --------------------------------------------------------------

export function hasPhone(): boolean {
  return Boolean(site.phone && site.phoneDisplay);
}

export function hasEmergencyPhone(): boolean {
  return Boolean(site.emergencyPhone && site.emergencyPhoneDisplay);
}

export function hasEmail(): boolean {
  return Boolean(site.email);
}

export function hasPostalAddress(): boolean {
  return Boolean(
    site.address.street && site.address.city && site.address.postalCode
  );
}

export function activeSocialLinks(): { name: string; url: string }[] {
  const list: { name: string; url: string }[] = [];
  if (site.social.google) list.push({ name: 'Google', url: site.social.google });
  if (site.social.facebook) list.push({ name: 'Facebook', url: site.social.facebook });
  if (site.social.linkedin) list.push({ name: 'LinkedIn', url: site.social.linkedin });
  if (site.social.instagram) list.push({ name: 'Instagram', url: site.social.instagram });
  return list;
}

export const nav = {
  primary: [
    { label: 'Maintenance', href: '/#maintenance' },
    { label: 'Services', href: '/services' },
    { label: 'Who We Serve', href: '/industries' },
    { label: 'Service Areas', href: '/service-areas' },
    { label: 'Resources', href: '/resources' },
  ],
  cta: { label: 'Book an advanced consultation', href: '/contact' },
  emergencyCta: { label: 'Call if a gate is down', href: '/services/emergency-service' },
} as const;
