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
    'Gate automation, access control, video surveillance, and security system integration for Central Florida and Tampa Bay.',

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
    // No verified street address. street/postalCode intentionally blank — the
    // hasPostalAddress() helper requires all three (street + city + postalCode)
    // before any LocalBusiness PostalAddress schema is emitted, so partial
    // address data is structurally prevented from leaking into JSON-LD.
    street: '',
    city: 'Clermont',
    region: 'FL',
    postalCode: '',
    country: 'US',
  },

  hours: '24/7 emergency support · Standard service hours weekdays',
  serviceRegions: ['Central Florida', 'Tampa Bay'],
  serviceAreaSummary:
    'Orlando, Tampa, Lakeland, Kissimmee, Winter Garden, Clermont, Lake Mary, Sanford, Ocala, The Villages, St. Petersburg, Clearwater, Brandon, Wesley Chapel, and surrounding regions.',

  social: {
    // Add real profiles before launch.
    google: '',
    facebook: '',
    linkedin: '',
  },
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
  return list;
}

export const nav = {
  primary: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Industries', href: '/industries' },
    { label: 'Service Areas', href: '/service-areas' },
    { label: 'Resources', href: '/resources' },
    { label: 'Emergency Service', href: '/services/emergency-service' },
    { label: 'Contact', href: '/contact' },
  ],
  cta: { label: 'Request Site Assessment', href: '/contact' },
  emergencyCta: {
    label: 'Emergency Service',
    href: '/services/emergency-service',
  },
} as const;
