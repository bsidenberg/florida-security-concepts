// Canonical public route inventory used ONLY for analytics pageview sanitization.
// Hardcoded (not derived from data/*) so the shared client bundle does not carry
// page content. Must equal the 38 launch routes (tests/fixtures/routes.ts).
export const CANONICAL_ROUTES = [
  '/', '/contact', '/services', '/industries', '/service-areas', '/resources',
  '/services/security-gate-systems', '/services/gate-automation', '/services/access-control',
  '/services/video-surveillance', '/services/security-system-integration', '/services/emergency-service',
  '/industries/hoa-gated-communities', '/industries/multifamily-apartments-condos', '/industries/storage-facilities',
  '/industries/commercial-properties', '/industries/industrial-warehouses', '/industries/property-managers',
  '/industries/residential-estates',
  '/service-areas/orlando', '/service-areas/tampa', '/service-areas/lakeland', '/service-areas/kissimmee',
  '/service-areas/winter-garden', '/service-areas/clermont', '/service-areas/lake-mary', '/service-areas/sanford',
  '/service-areas/ocala', '/service-areas/the-villages', '/service-areas/st-petersburg', '/service-areas/clearwater',
  '/service-areas/brandon', '/service-areas/wesley-chapel',
  '/resources/how-much-does-an-automatic-gate-cost', '/resources/best-access-control-system-for-hoa',
  '/resources/storage-facility-security-camera-guide', '/resources/gate-automation-vs-access-control',
  '/resources/property-manager-security-system-checklist',
] as const;

export const NOT_FOUND_PATH = '/404';
const ROUTES: ReadonlySet<string> = new Set(CANONICAL_ROUTES);

/** Known canonical pathname, or `/404` for anything else. Never echoes unknown input. */
export function canonicalPathname(pathname: unknown): string {
  if (typeof pathname !== 'string' || pathname.length === 0 || pathname.length > 200) return NOT_FOUND_PATH;
  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return ROUTES.has(trimmed) ? trimmed : NOT_FOUND_PATH;
}

export const PAGE_TEMPLATES = [
  'home', 'contact', 'services_index', 'service_detail', 'industries_index', 'industry_detail',
  'service_areas_index', 'service_area_detail', 'resources_index', 'resource_detail', 'not_found',
] as const;
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

/** Template family of a pathname (sanitized through the inventory first). */
export function pageTemplateFor(pathname: unknown): PageTemplate {
  const path = canonicalPathname(pathname);
  if (path === '/') return 'home';
  if (path === '/contact') return 'contact';
  const [, section, slug] = path.split('/');
  const families: Record<string, [PageTemplate, PageTemplate]> = {
    services: ['services_index', 'service_detail'],
    industries: ['industries_index', 'industry_detail'],
    'service-areas': ['service_areas_index', 'service_area_detail'],
    resources: ['resources_index', 'resource_detail'],
  };
  const family = families[section];
  if (!family) return 'not_found';
  return slug ? family[1] : family[0];
}
